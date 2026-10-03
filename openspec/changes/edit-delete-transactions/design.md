## Context

Sheeto currently supports creating transactions (via `POST` to append rows in `2026記帳明細`) and querying transactions by month (via `GET` with `action=getTransactions`). However, when users make a mistake—such as typing the wrong amount, choosing the wrong category, selecting the wrong date, or making a typo in remarks—there is no way to modify or remove the record from within the application. Users currently must open Google Sheets manually, find the corresponding row, and edit or delete it.

This change extends Sheeto to support updating and deleting transactions directly from the mobile UI.

## Goals / Non-Goals

**Goals:**
- Return a 1-based row index (`rowIndex`) for every transaction item in `getTransactions`.
- Implement `updateTransaction` in `gas/Code.js` via `POST` to modify Date, Category, Amount, and Remarks of a target row.
- Implement `deleteTransaction` in `gas/Code.js` via `POST` to remove a target row from `2026記帳明細`.
- Never modify or delete the wrong row, even when row indices have shifted since the list was fetched.
- Support Edit and Delete actions in the mobile transactions table / history view.
- Provide a responsive Edit Modal with pre-filled inputs for Amount, Category, Date, and Remarks.
- Provide a Delete Confirmation dialog to prevent accidental deletion.
- Automatically refresh transactions, monthly total, and the expense donut chart upon successful update or delete.
- Maintain backwards compatibility for existing transaction creation requests.

**Non-Goals:**
- Batch editing or multi-selection deletion.
- In-app undo history (users can rely on Google Sheets' built-in version history if needed).
- Adding new columns or altering existing spreadsheet layout.
- Optimistic UI updates (the list is always re-fetched from the sheet after a mutation).

## Decisions

### 1. Row Identification in Google Sheets
- **Option A**: Add a UUID column to `2026記帳明細` and populate UUIDs for every row.
- **Option B**: Use the 1-based sheet row index (`rowIndex`) alone.
- **Option C**: Use `rowIndex` plus an optimistic concurrency check on the row's original values.
- **Decision**: **Option C**. Option A would alter the existing 4-column layout (`日期`, `分類`, `金額`, `備註`) and require data migrations. Option B is fragile: `rowIndex` goes stale whenever rows shift—after a delete (before the refresh returns), or when the sheet is sorted or edited directly in Google Sheets—and a stale index silently targets the wrong row.

  With Option C, the client sends `rowIndex` together with `original: { date, category, amount, remarks }` exactly as received from `getTransactions`. Under the script lock, the backend reads row `rowIndex`, normalizes it the same way `getTransactions` does (date formatted `yyyy/MM/dd` in the script time zone, amount via `parseFloat`, remarks defaulting to `""`), and compares all four fields. On mismatch it returns `{ success: false, code: "CONFLICT" }` without writing. Two genuinely identical rows are interchangeable, so matching either is harmless.

### 2. API Method and Dispatch for Mutations in Google Apps Script
- **Option A**: Use HTTP `PUT` and `DELETE`.
- **Option B**: Use `POST` with an action field in the payload (`action: "updateTransaction"`, `action: "deleteTransaction"`).
- **Decision**: **Option B (`POST` with action payload)**. Google Apps Script Web Apps only implement `doGet(e)` and `doPost(e)`. Dispatching via an `action` field in the POST request body is the standard Apps Script pattern.
- **Dispatch rules** (evaluated after passcode validation):
  - `action` absent → existing create/append behavior (backwards compatible).
  - `action === "updateTransaction"` → update handler.
  - `action === "deleteTransaction"` → delete handler.
  - Any other `action` value → `Bad Request: Invalid action.`, no write. This prevents a misspelled action carrying date/category/amount from silently appending a duplicate row.

### 3. Input Validation
Shared helpers in `gas/Code.js` validate fields for both create and update:
- `rowIndex`: must be an integer (`Number.isInteger`) with `2 <= rowIndex <= sheet.getLastRow()`.
- `date`: must match `yyyy/MM/dd`, be a real calendar date, and fall in 2026 (the log sheet is year-specific). One `parseDate` helper is used by both create and update.
- `amount`: numeric and `> 0`.
- `category`: must be one of `CATEGORIES_LIST`.
- `original` (update/delete only): must be present with all four fields.

### 4. Write Serialization
All writes (create, update, delete) acquire `LockService.getScriptLock()` with a short timeout (e.g. 10 seconds) and release it in `finally`. The concurrency check and the write happen inside the same lock so no other write can shift rows in between. If the lock cannot be acquired, the request fails with a retryable error.

### 5. Frontend Edit & Delete Interaction Design
- **Option A**: Slide-to-reveal actions (swipe gestures).
- **Option B**: Edit (✏️) and Delete (🗑️) buttons in each table row.
- **Option C**: Tap the row to open the Edit modal; Delete is a button inside the modal.
- **Decision**: **Option C**. Swipe gestures conflict with native scrolling and pull-to-refresh. Option B adds a fifth column to an already dense 4-column table, which overflows on narrow screens and yields small touch targets. Option C keeps the table layout unchanged, gives the whole row as a touch target, and keeps the destructive action one extra step away. Rows get a subtle pressed/hover style to signal they are tappable.

### 6. Edit Modal Experience
- Tapping a row opens the Edit Modal pre-filled with the transaction's Date, Category, Amount, and Remarks.
- The modal reuses the logging form's category picker and amount input/validation (extracted into shared components/functions) rather than duplicating them.
- Date conversion: `getTransactions` returns `yyyy/MM/dd`; the modal's `<input type="date">` uses `yyyy-MM-dd` (constrained to 2026 via `min`/`max`); the request sends `yyyy/MM/dd` again.
- On submit, the frontend validates amount (> 0) and category, then sends `updateTransaction` with `rowIndex`, `original`, and the new values.
- Success: close modal, show success toast, refresh. If the new date is in a different month from the one being viewed, the toast states the destination month (e.g. 「已更新，並移至 2026-08」), since the row will disappear from the current list.
- Failure: the modal stays open with the user's edits intact and an error toast is shown.

### 7. Accidental Deletion Protection
- The Edit modal contains a Delete button. Tapping it shows a confirmation dialog with the transaction's Date, Category, and Amount.
- Cancel dismisses the dialog without any network request.
- Confirm sends `deleteTransaction` with `rowIndex` and `original`, closes the dialogs, shows a toast, and refreshes the list.

### 8. Mutation In-Flight State
A single `mutating` flag is set from the moment an update/delete request is sent until the follow-up `fetchTransactions` completes (success or failure). While set, row taps are ignored and modal submit/confirm buttons are disabled. This closes the window in which the visible list holds stale `rowIndex` values. List rows use `rowIndex` as their React `key`.

### 9. Conflict Handling
When the backend returns `code: "CONFLICT"`, the frontend closes the modal/dialog, shows 「資料已變動，已重新整理，請再試一次」, and re-fetches the current month.

## Risks / Trade-offs

- **[Risk] Row index drift** (rows shifted by an earlier delete, or by sorting/editing directly in Google Sheets):
  - *Mitigation*: Optimistic concurrency check (Decision 1) under the script lock (Decision 4), plus the in-flight interaction lock on the frontend (Decision 8). A stale request is rejected rather than applied to the wrong row.
- **[Risk] Concurrency check false positives** from value normalization differences (e.g. floating point amounts, time-zone date formatting):
  - *Mitigation*: The backend compares using the exact same normalization that `getTransactions` uses to produce the values the client echoes back. A false positive only causes a refresh-and-retry, never data loss.
- **[Risk] Accidental deletion**: Deletion is irreversible from the web app.
  - *Mitigation*: Delete is inside the Edit modal and requires a confirmation dialog. If accidentally confirmed, Google Sheets' Version History (「版本歷史紀錄」) retains previous snapshots.
- **[Risk] Invalid input from clients**: Out-of-bounds or non-integer `rowIndex`, unknown categories, malformed dates.
  - *Mitigation*: Strict backend validation (Decision 3); the header row can never be modified.
- **[Risk] Stale GAS deployment**: Apps Script Web Apps keep serving the previously deployed version until a new version is published.
  - *Mitigation*: Redeploying a new version is an explicit task, verified before frontend testing.
- **[Trade-off] Stricter create validation**: Create requests with an unknown category, `amount <= 0`, or a non-2026 date are now rejected. The current frontend never sends such values, so no user-visible change is expected.

## 1. Backend Implementation

- [x] 1.1 In `gas/Code.js` `doGet(e)`, include `rowIndex` (`i + 2`) in each transaction object returned by `getTransactions`.
- [x] 1.2 In `gas/Code.js`, extract shared helpers: `parseDate` (validates `yyyy/MM/dd`, real calendar date, year 2026), `validateTransactionFields` (date, `amount > 0`, `category` in `CATEGORIES_LIST`), and `normalizeRow` (same date/amount/remarks normalization as `getTransactions`).
- [x] 1.3 Restructure `doPost(e)`: validate passcode first, then dispatch on `action` — absent → create, `updateTransaction` → update, `deleteTransaction` → delete, anything else → `Bad Request: Invalid action.` with no write. Make the create path use the shared validation and date parsing.
- [x] 1.4 Wrap all writes (create, update, delete) in `LockService.getScriptLock()` with a ~10s `waitLock`, releasing in `finally`; return a retryable error if the lock cannot be acquired.
- [x] 1.5 Implement a `validateRowTarget(sheet, rowIndex, original)` helper: require integer `rowIndex` with `2 <= rowIndex <= lastRow`, require `original` with all four fields, and compare `normalizeRow` of the current row against `original`, returning `{ success: false, code: "CONFLICT" }` on mismatch.
- [x] 1.6 Implement `updateTransaction`: validate new fields, run `validateRowTarget` inside the lock, then write columns A–D via `getRange(rowIndex, 1, 1, 4).setValues(...)`.
- [x] 1.7 Implement `deleteTransaction`: run `validateRowTarget` inside the lock, then `sheet.deleteRow(rowIndex)`.

## 2. Frontend API & Mutation Logic

- [x] 2.1 Extract the amount input/validation and category picker from the logging form in `src/App.jsx` into reusable components/functions so the logging form and the Edit modal share them.
- [x] 2.2 Add date conversion helpers between the API format (`yyyy/MM/dd`) and `<input type="date">` format (`yyyy-MM-dd`).
- [x] 2.3 Implement `handleUpdateTransaction`: send `updateTransaction` with `rowIndex`, `original`, and new values; on success close the modal, show a toast (mentioning the destination month if it differs from the viewed month), and refresh; on failure keep the modal open with edits intact and show an error toast.
- [x] 2.4 Implement `handleDeleteTransaction`: send `deleteTransaction` with `rowIndex` and `original`; on success close the dialogs, show a toast, and refresh; on failure close the confirmation and show an error toast.
- [x] 2.5 Add a `mutating` state set from request start until the follow-up `fetchTransactions` completes; while set, ignore row taps and disable save/confirm buttons.
- [x] 2.6 Handle `code: "CONFLICT"` responses: close modal/dialog, show 「資料已變動，已重新整理，請再試一次」, and re-fetch the current month.

## 3. Frontend UI Components & Modals

- [x] 3.1 Make transaction rows in `src/App.jsx` tappable to open the Edit modal, and change the row `key` from the array index to `tx.rowIndex`.
- [x] 3.2 Build the Edit Transaction modal prefilled with amount, category, date (constrained to 2026 via `min`/`max`), and remarks, using the shared form pieces from 2.1, with Save, Cancel, and Delete actions.
- [x] 3.3 Build the Delete Confirmation dialog (opened from the Edit modal) showing date, category, and amount, with Cancel and Confirm actions.

## 4. Styling, Deployment & Verification

- [x] 4.1 Add mobile-responsive glassmorphism styles in `src/App.css` for the Edit modal, form fields, confirmation dialog, and tappable row pressed/hover state.
- [x] 4.2 Verify the frontend build via `npm run build`.
- [x] 4.3 Paste the updated `gas/Code.js` into Apps Script and publish a **new version** via Deploy → Manage deployments (keeping the same Web App URL); confirm the deployed version serves `rowIndex` in `getTransactions`.
- [x] 4.4 Manually verify against the live sheet:
  - Create still works (POST without `action`).
  - Edit amount/category/remarks of a transaction; sheet row and list both update.
  - Edit a date into another month; toast names the new month and the row leaves the current list.
  - Delete a transaction with confirmation; cancel sends no request.
  - Delete one row, then immediately try to act on another row before the refresh finishes — interaction is blocked.
  - Sort or edit the sheet directly in Google Sheets, then edit a stale row in the app — conflict message shown and list refreshed, no wrong row modified.
  - Wrong passcode and unknown `action` are rejected without modifying the sheet.

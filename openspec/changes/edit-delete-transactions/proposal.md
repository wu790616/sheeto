## Why

Currently, once an expense entry is submitted, users have no way to modify or delete it from within the Sheeto mobile interface. If an incorrect amount, wrong category, mistaken date, or inaccurate note is submitted, users are forced to manually open Google Sheets on desktop or mobile, locate the specific row, and edit or remove it. Introducing in-app edit and delete capabilities allows users to correct mistakes seamlessly directly from their mobile devices.

## What Changes

- **Backend (GAS API)**:
  - Enrich `getTransactions` response so each transaction record includes a row identifier (`rowIndex`) referencing its position in the `2026記帳明細` sheet.
  - Restructure `doPost` to validate the passcode first, then dispatch strictly by `action`: absent → create (existing behavior), `updateTransaction` / `deleteTransaction` → mutation handlers, any other value → rejected without writing.
  - Add `updateTransaction` to modify Date, Category, Amount, and Remarks of a specified row.
  - Add `deleteTransaction` to delete a specified row from `2026記帳明細`.
  - Guard every mutation with an **optimistic concurrency check**: the client sends the row's original values alongside `rowIndex`, and the backend refuses to write if the row's current contents no longer match (protects against row index drift).
  - Serialize all sheet writes (create, update, delete) with `LockService` to avoid interleaved writes.
  - Validate inputs strictly: integer `rowIndex` within bounds, `amount > 0`, `category` in the known category list, and a well-formed 2026 date. The create path adopts the same field validation.
- **Frontend (Mobile UI)**:
  - Tapping a transaction row in the Monthly Transactions list (History tab) opens an Edit modal; the Delete action lives inside that modal, behind a confirmation step.
  - The Edit modal is prefilled with the transaction's current values (Amount, Category, Date, Remarks) and reuses the existing logging form's category picker and validation logic.
  - While a mutation and its follow-up refresh are in flight, all row interactions are disabled so stale row indices cannot be submitted.
  - Automatically refresh the transaction list, monthly totals, and category breakdown chart after successful editing or deletion; if an edit moves a transaction to another month, the success toast says so.
  - Show loading indicators, error feedback (keeping the user's input on failure), and success notifications (toasts). On a concurrency conflict, inform the user and refresh the list automatically.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `sheet-integration`: Support identifying transaction rows, updating and deleting transaction rows with conflict detection, strict action dispatch, and serialized writes in the `2026記帳明細` sheet.
- `mobile-expense-logging`: Support editing and deleting existing transactions from the history list via an edit modal with validation, delete confirmation, failure/conflict handling, and view refresh upon mutation.

## Impact

- **Backend (`gas/Code.js`)**:
  - `doGet`: include `rowIndex` (the actual 1-based row number in `2026記帳明細`) in the returned transaction objects.
  - `doPost`: passcode check first, then strict `action` dispatch; shared helpers for date parsing, field validation, and row matching; `LockService` around all writes.
  - The Apps Script Web App must be **redeployed as a new version** for the frontend to reach the new handlers.
- **Frontend (`src/App.jsx`, `src/App.css`)**:
  - Extract the transaction form fields (amount, category, date, remarks) and validation into reusable pieces shared by the logging form and the Edit modal.
  - Add edit modal state, delete confirmation state, and a mutation-in-flight state.
  - Add API helper calls for `updateTransaction` and `deleteTransaction`.
  - Make transaction rows tappable; use `rowIndex` as the React list key.
  - Add responsive modal dialog styles for editing transactions on mobile devices.
- **Dependencies & APIs**: No external library dependencies required; uses existing React hooks and GAS built-in services (`LockService`).

## Why

Users currently have no visual feedback on their logged transactions in the mobile interface. This makes it impossible to verify whether a transaction has been successfully recorded to the Google Sheet without manually opening the Google Sheets app or website. Additionally, being able to browse transactions by month directly in the app improves overall usability and allows quick monthly audits.

## What Changes

- **Modified Capability**: The Google Apps Script API will support querying transactions filtered by a specific month (e.g., `2026-07`) from the `2026記帳明細` sheet.
- **Modified Capability**: The mobile web interface will display a "Monthly Transactions" section showing the date, category, amount, and optional remarks of all recorded transactions for the selected month.
- **UI Update**:
  - A month selector (e.g., dropdown or toggle buttons) defaulting to the current month.
  - A transaction table/list displaying the selected month's transactions.
  - A monthly total summary calculated from the displayed list.
  - Automatic refresh of the transaction list and monthly total upon successful transaction submission if the submitted transaction belongs to the currently viewed month.

## Capabilities

### New Capabilities

*(None)*

### Modified Capabilities

- `sheet-integration`: The GAS API must support querying recorded transactions filtered by a specified month from the `2026記帳明細` sheet.
- `mobile-expense-logging`: The mobile UI must provide a month selector, fetch and display transactions filtered by the selected month, calculate the monthly total, and refresh the view upon successful submission of a transaction.

## Impact

- **Backend (Google Apps Script - `gas/Code.js`)**: Add a request handler (`GET` or action-based `POST`) to accept a `month` parameter and return filtered transactions from `2026記帳明細`.
- **Frontend (React - `src/App.jsx`)**:
  - Add state for selected month, monthly transactions list, and loading status.
  - Add a month selector dropdown/interface component.
  - Add API fetch function that retrieves transactions for a specified month.
  - Add UI list/table showing transaction details and a total sum indicator.
  - Trigger refresh when submitting a new transaction for the active month.
- **Security**: The query requests must use the same passcode authentication mechanism to ensure expense data privacy.

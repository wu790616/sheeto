# Specification: mobile-expense-logging

## Purpose
TBD: Mobile web interface to select a category, enter an amount, select a date (today/yesterday), optionally add remarks, and submit to the GAS API.
## Requirements
### Requirement: Enter transaction details
The system SHALL provide a mobile-friendly user interface with inputs for Amount (using a native HTML input field with decimal input mode to trigger the native device keyboard), Category (selectable buttons), Date (date picker defaulting to today's date, with a quick "Yesterday" selector), and Remarks (optional text input). The interface SHALL NOT display a custom on-screen virtual keyboard.

#### Scenario: Interface initialization
- **WHEN** the user opens the mobile application
- **THEN** the interface defaults the date to today and focuses on the amount input field, showing the device's native keyboard.

#### Scenario: Date toggle
- **WHEN** the user clicks the "Yesterday" quick selector
- **THEN** the date input field value changes to yesterday's date.

### Requirement: Submit transaction to Google Sheets API
The system SHALL transmit the transaction details (Date, Category, Amount, Remarks) to the Google Apps Script Web App URL when the user clicks the "Submit" button, including a passcode for authentication.

#### Scenario: Successful submission
- **WHEN** the user clicks "Submit" with a valid amount, category, and matching passcode
- **THEN** the system POSTs the request to the GAS Web App URL, displays a success notification, and clears the form.

#### Scenario: Submission fails due to wrong passcode
- **WHEN** the user clicks "Submit" but the passcode is incorrect
- **THEN** the system shows an authentication error message and preserves the form content.

### Requirement: Display monthly transactions
The system SHALL provide a "Monthly Transactions" interface displaying recorded transactions for a selected month and calculating the total sum of those transactions.

#### Scenario: Load monthly transactions on init
- **WHEN** the user opens the mobile application and has entered a valid passcode
- **THEN** the system SHALL fetch and display the transactions for the current month.

#### Scenario: Switch month
- **WHEN** the user selects a different month using the month selector
- **THEN** the system SHALL fetch and display the transactions for the selected month and update the monthly total sum.

#### Scenario: Auto-refresh list after submission
- **WHEN** the user submits a new transaction successfully and the transaction's month matches the currently viewed month
- **THEN** the system SHALL automatically refresh the monthly transactions list and the monthly total sum.

#### Scenario: No transactions for the selected month
- **WHEN** the selected month has no recorded transactions
- **THEN** the system SHALL display an empty-state message and a monthly total of 0.

#### Scenario: Fetching monthly transactions fails
- **WHEN** the request to fetch transactions for the selected month fails (e.g. network error or backend/authentication error)
- **THEN** the system SHALL display an error state to the user and SHALL NOT clear any previously displayed transaction data.

#### Scenario: Rapid month switching
- **WHEN** the user switches to a new month before the fetch for a previously selected month has completed
- **THEN** the system SHALL discard the stale response and only display data matching the currently selected month.

### Requirement: Tabbed navigation
The system SHALL provide a tabbed navigation interface allowing the user to switch between the "Log" (記帳) page and the "History" (明細) page.

#### Scenario: Tab switching
- **WHEN** the user clicks the "明細 History" tab button
- **THEN** the system SHALL display the monthly transactions interface and keep the navigation bar active at the bottom.

### Requirement: Display monthly expense category pie chart and breakdown
The system SHALL provide a visual pie chart (or donut chart) and category breakdown on the monthly transactions interface, displaying the total expenditure, the proportion/percentage of spending for each category, and category-level sum amounts for the selected month.

#### Scenario: Render pie chart with category distribution
- **WHEN** transactions exist for the selected month
- **THEN** the system SHALL calculate the total sum for each category, calculate the percentage of total spending for each category, and render a responsive pie chart along with a category breakdown legend showing each category's icon, name, total amount, and percentage.

#### Scenario: Empty transactions chart state
- **WHEN** there are no transactions for the selected month
- **THEN** the system SHALL NOT render an empty or broken chart, and SHALL display an empty state or placeholder indicating no expense data available.

#### Scenario: Update chart on month switch
- **WHEN** the user selects a different month
- **THEN** the pie chart and category breakdown SHALL automatically update to reflect the totals and percentages of the new month's transactions.

#### Scenario: Update chart after new transaction logged
- **WHEN** a new transaction is logged for the currently selected month
- **THEN** the pie chart and category breakdown SHALL update to include the newly submitted expense amount in its respective category.

#### Scenario: Transaction with unrecognized category
- **WHEN** a transaction's category does not match any entry in the predefined category list
- **THEN** the system SHALL render it using a fallback color and icon (matching the "其他" style) while preserving the transaction's original category name, instead of failing to render or showing an undefined color.

#### Scenario: Highlight category on tap
- **WHEN** the user taps a chart segment or a category in the breakdown legend
- **THEN** the system SHALL visually highlight the corresponding segment and legend entry together.

### Requirement: Edit existing transaction
The system SHALL let the user edit a recorded transaction by tapping its row in the monthly transactions list.

#### Scenario: Open edit modal with prefilled data
- **WHEN** the user taps a transaction row
- **THEN** the system SHALL display an edit modal prefilled with the transaction's current date, category, amount, and remarks.

#### Scenario: Submit valid transaction edit
- **WHEN** the user submits the edit modal with a valid amount (> 0), a selected category, and a 2026 date
- **THEN** the system SHALL send an `updateTransaction` request to the GAS API with `rowIndex`, the transaction's original values, and the updated values, close the modal, show a success toast, and refresh the monthly transactions list and totals.

#### Scenario: Edit moves transaction to another month
- **WHEN** the user successfully saves an edit whose new date falls in a month other than the one being viewed
- **THEN** the success toast SHALL state the month the transaction was moved to, and the refreshed list SHALL no longer show it.

#### Scenario: Submit edit with invalid input
- **WHEN** the user attempts to submit the edit modal with an amount of 0, negative amount, or without a selected category
- **THEN** the system SHALL display a validation error message and SHALL NOT submit the request.

#### Scenario: Edit request fails
- **WHEN** the `updateTransaction` request fails due to a network error or a non-conflict error response
- **THEN** the system SHALL keep the edit modal open with the user's edits intact and show an error toast.

#### Scenario: Cancel transaction edit
- **WHEN** the user cancels or closes the edit modal
- **THEN** the modal SHALL close without saving changes and without modifying the transaction list.

### Requirement: Delete existing transaction
The system SHALL provide a delete action inside the edit modal, protected by a confirmation step.

#### Scenario: Request transaction deletion
- **WHEN** the user taps the delete action in the edit modal
- **THEN** the system SHALL display a confirmation prompt detailing the transaction's date, category, and amount, asking the user to confirm deletion.

#### Scenario: Confirm transaction deletion
- **WHEN** the user confirms the deletion prompt
- **THEN** the system SHALL send a `deleteTransaction` request to the GAS API with the target `rowIndex` and the transaction's original values, close the prompt and modal, show a success toast, and refresh the monthly transactions list and totals.

#### Scenario: Delete request fails
- **WHEN** the `deleteTransaction` request fails due to a network error or a non-conflict error response
- **THEN** the system SHALL close the confirmation prompt, keep the transaction list unchanged, and show an error toast.

#### Scenario: Cancel transaction deletion
- **WHEN** the user dismisses or cancels the deletion confirmation prompt
- **THEN** the confirmation prompt SHALL close and no deletion request SHALL be sent.

### Requirement: Safe mutation state
The system SHALL prevent mutations based on stale row indices and handle backend conflict responses.

#### Scenario: Interactions disabled while mutation is in flight
- **WHEN** an update or delete request has been sent and the follow-up list refresh has not yet completed
- **THEN** the system SHALL ignore taps on transaction rows and disable the edit modal's save and delete-confirm actions.

#### Scenario: Backend reports a row conflict
- **WHEN** an update or delete request returns `code: "CONFLICT"`
- **THEN** the system SHALL close the edit modal and confirmation prompt, show a message that the data has changed, and re-fetch the current month's transactions.


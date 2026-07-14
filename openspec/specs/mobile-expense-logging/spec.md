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



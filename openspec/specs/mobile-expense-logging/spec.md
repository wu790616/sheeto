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


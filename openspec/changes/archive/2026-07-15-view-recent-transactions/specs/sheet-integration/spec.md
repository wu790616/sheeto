## ADDED Requirements

### Requirement: Query transactions by month
The system SHALL support retrieving transactions from `2026記帳明細` filtered by a specified month.

#### Scenario: Retrieve transactions for a specific month
- **WHEN** a request is received with `action=getTransactions`, a valid passcode, and `month=2026-07`
- **THEN** the system SHALL return a JSON array containing transactions matching the date "2026-07" in `2026記帳明細` (each transaction having Date, Category, Amount, Remarks).

#### Scenario: Query failed due to invalid passcode
- **WHEN** a request is received with `action=getTransactions` but the passcode is incorrect
- **THEN** the system SHALL return an authentication error message.

#### Scenario: Query failed due to invalid or missing month parameter
- **WHEN** a request is received with `action=getTransactions`, a valid passcode, but a `month` parameter that is missing or not in `YYYY-MM` format
- **THEN** the system SHALL return a validation error message and SHALL NOT query the sheet.

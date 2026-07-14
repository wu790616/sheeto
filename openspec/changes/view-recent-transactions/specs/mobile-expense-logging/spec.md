## ADDED Requirements

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

## ADDED Requirements

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

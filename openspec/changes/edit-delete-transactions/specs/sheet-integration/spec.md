## MODIFIED Requirements

### Requirement: Query transactions by month
The system SHALL support retrieving transactions from `2026記帳明細` filtered by a specified month, including the row index of each transaction.

#### Scenario: Retrieve transactions for a specific month
- **WHEN** a request is received with `action=getTransactions`, a valid passcode, and `month=2026-07`
- **THEN** the system SHALL return a JSON array containing transactions matching the date "2026-07" in `2026記帳明細`, where each transaction item includes `rowIndex` (the 1-based row number in `2026記帳明細`), `date`, `category`, `amount`, and `remarks`.

#### Scenario: Query failed due to invalid passcode
- **WHEN** a request is received with `action=getTransactions` but the passcode is incorrect
- **THEN** the system SHALL return an authentication error message.

#### Scenario: Query failed due to invalid or missing month parameter
- **WHEN** a request is received with `action=getTransactions`, a valid passcode, but a `month` parameter that is missing or not in `YYYY-MM` format
- **THEN** the system SHALL return a validation error message and SHALL NOT query the sheet.

## ADDED Requirements

### Requirement: POST action dispatch
The system SHALL validate the passcode of every POST request before inspecting its `action`, and SHALL dispatch strictly on the `action` field.

#### Scenario: POST without action creates a transaction
- **WHEN** a POST request is received with a valid passcode, no `action` field, and valid `date`, `category`, and `amount`
- **THEN** the system SHALL append a new transaction row, preserving the existing create behavior.

#### Scenario: POST with createTransaction action creates a transaction
- **WHEN** a POST request is received with a valid passcode, `action=createTransaction`, and valid `date`, `category`, and `amount`
- **THEN** the system SHALL append a new transaction row, identical to a POST without an `action` field.

#### Scenario: POST with unknown action is rejected
- **WHEN** a POST request is received with a valid passcode and an `action` value other than `createTransaction`, `updateTransaction`, or `deleteTransaction`
- **THEN** the system SHALL return an invalid action error and SHALL NOT modify the sheet.

#### Scenario: POST with invalid passcode is rejected regardless of action
- **WHEN** a POST request is received with an incorrect passcode
- **THEN** the system SHALL return an unauthorized error message and SHALL NOT modify the sheet, regardless of the `action` value.

### Requirement: Transaction field validation
The system SHALL validate transaction fields on create and update: `date` in `yyyy/MM/dd` format representing a real calendar date in 2026, numeric `amount` greater than 0, and `category` belonging to the known category list.

#### Scenario: Write rejected due to invalid fields
- **WHEN** a create or `updateTransaction` request has a malformed or non-2026 `date`, a non-numeric or non-positive `amount`, or a `category` not in the known category list
- **THEN** the system SHALL return a validation error message and SHALL NOT modify the sheet.

### Requirement: Serialized sheet writes
The system SHALL serialize all writes to `2026記帳明細` (create, update, delete) using a script-wide lock, and SHALL perform the conflict check and the write of an update or delete within the same lock.

#### Scenario: Lock cannot be acquired
- **WHEN** a write request cannot acquire the script lock within the timeout
- **THEN** the system SHALL return a retryable error message and SHALL NOT modify the sheet.

### Requirement: Update transaction row
The system SHALL support modifying the Date, Category, Amount, and Remarks of an existing transaction row in `2026記帳明細` identified by its 1-based row index, only if the row still contains the values the client originally fetched.

#### Scenario: Successful transaction update
- **WHEN** a POST request is received with `action=updateTransaction`, a valid passcode, an integer `rowIndex` within sheet bounds (>= 2 and <= lastRow), an `original` object whose `date`, `category`, `amount`, and `remarks` match the row's current values, and valid new `date`, `category`, `amount`, and `remarks`
- **THEN** the system SHALL update the designated row's cells (columns A to D) with the new values and return a success response.

#### Scenario: Update rejected due to row conflict
- **WHEN** a POST request is received with `action=updateTransaction`, a valid passcode, and a valid `rowIndex`, but the row's current values do not match `original`
- **THEN** the system SHALL return a conflict error with `code: "CONFLICT"` and SHALL NOT modify the sheet.

#### Scenario: Update failed due to invalid rowIndex
- **WHEN** a POST request is received with `action=updateTransaction`, a valid passcode, but `rowIndex` is missing, not an integer, less than 2, or greater than `lastRow`
- **THEN** the system SHALL return an error message indicating invalid row index and SHALL NOT modify the sheet.

#### Scenario: Update failed due to missing original values
- **WHEN** a POST request is received with `action=updateTransaction`, a valid passcode, but the `original` object is missing or incomplete
- **THEN** the system SHALL return a validation error message and SHALL NOT modify the sheet.

### Requirement: Delete transaction row
The system SHALL support deleting an existing transaction row from `2026記帳明細` identified by its 1-based row index, only if the row still contains the values the client originally fetched.

#### Scenario: Successful transaction deletion
- **WHEN** a POST request is received with `action=deleteTransaction`, a valid passcode, an integer `rowIndex` within sheet bounds (>= 2 and <= lastRow), and an `original` object matching the row's current values
- **THEN** the system SHALL delete the designated row from `2026記帳明細` and return a success response.

#### Scenario: Deletion rejected due to row conflict
- **WHEN** a POST request is received with `action=deleteTransaction`, a valid passcode, and a valid `rowIndex`, but the row's current values do not match `original`
- **THEN** the system SHALL return a conflict error with `code: "CONFLICT"` and SHALL NOT delete any row.

#### Scenario: Deletion failed due to invalid rowIndex
- **WHEN** a POST request is received with `action=deleteTransaction`, a valid passcode, but `rowIndex` is missing, not an integer, less than 2, or greater than `lastRow`
- **THEN** the system SHALL return an error message indicating invalid row index and SHALL NOT modify the sheet.

#### Scenario: Deletion failed due to missing original values
- **WHEN** a POST request is received with `action=deleteTransaction`, a valid passcode, but the `original` object is missing or incomplete
- **THEN** the system SHALL return a validation error message and SHALL NOT delete any row.

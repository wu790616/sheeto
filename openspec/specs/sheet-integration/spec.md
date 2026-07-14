# Specification: sheet-integration

## Purpose
TBD: Design of the 2026記帳明細 sheet structure and configuration of the SUMIFS formulas in 2026滿月記帳.

## Requirements

### Requirement: Transaction detail sheet structure
The system SHALL maintain a dedicated sheet tab named `2026記帳明細` with the following columns: Date, Category, Amount, Remarks.

#### Scenario: Transaction row append
- **WHEN** a valid transaction is posted to the GAS Web App endpoint
- **THEN** the Apps Script appends a new row to the `2026記帳明細` sheet containing the transaction data in the order of Date, Category, Amount, Remarks.

### Requirement: Aggregate transactions in summary sheet
The system SHALL sum up transaction amounts from `2026記帳明細` in the monthly columns of `2026滿月記帳` using `SUMIFS` formulas matching the respective month and category.

#### Scenario: Automatic monthly sum calculation
- **WHEN** a row is appended to `2026記帳明細` with category "餐費" and date "2026/07/10"
- **THEN** the cell for July (Col J) under row "餐費" (Row 33) in the `2026滿月記帳` sheet automatically sums up all July transactions matching "餐費" from the `2026記帳明細` sheet.

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

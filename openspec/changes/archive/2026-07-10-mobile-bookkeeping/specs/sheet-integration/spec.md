## ADDED Requirements

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

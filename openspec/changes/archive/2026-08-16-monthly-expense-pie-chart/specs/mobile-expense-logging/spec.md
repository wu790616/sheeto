## ADDED Requirements

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

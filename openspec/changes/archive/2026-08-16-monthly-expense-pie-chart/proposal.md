## Why

Currently, the monthly transactions ("明細") tab displays the total expenditure and a tabular list of individual transactions, but lacks visual analytics for expense distribution. Users cannot easily see category-level proportions or identify major spending areas at a glance. Adding an interactive pie chart with total spending and category breakdown will provide immediate visual insights into monthly spending habits.

## What Changes

- Add a visual expense category breakdown (pie/donut chart) to the monthly transactions ("明細") page.
- Display the monthly total expense prominently alongside or within the chart view.
- Provide a category breakdown legend showing the category icon, name, spent amount, and percentage of total expenditure for the selected month.
- Ensure the chart and category breakdown dynamically update when switching months or when a new transaction is logged.
- Handle edge cases gracefully (e.g. zero spending or empty transactions for the month with informative placeholder/empty states).

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `mobile-expense-logging`: Add requirements for monthly expense category breakdown and pie chart visualization in the monthly transactions interface.

## Impact

- **Frontend Code**: `src/App.jsx` (adding chart visualization component or embedded SVG/canvas pie chart, state derivations for category totals and percentages) and `src/App.css` (styling for chart container, legend, and mobile responsive layout).
- **Dependencies**: No heavy external charting library strictly required (can be implemented cleanly via lightweight SVG donut/pie chart or HTML5 Canvas/CSS conic-gradient to keep bundle size minimal and fast), or lightweight helper.
- **Backend/API**: No GAS backend changes required; calculates statistics directly from the fetched monthly transactions payload.

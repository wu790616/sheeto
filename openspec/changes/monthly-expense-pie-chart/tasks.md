## 1. Category Data & Calculation Utilities

- [ ] 1.1 Define category color mapping and metadata helpers matching the existing `CATEGORIES` in `src/App.jsx`, including a fallback color/label for transactions whose `category` does not match any known entry
- [ ] 1.2 Implement category aggregation logic using `useMemo` to compute category totals, sorted rankings, and percentage shares from `transactions`

## 2. Donut Chart & Category Breakdown Component

- [ ] 2.1 Build the SVG donut chart component with stroke dash segments, centered total display, and category highlight interactions
- [ ] 2.2 Build the category breakdown list component displaying category emoji, name, spent amount, percentage badge, and visual progress bar

## 3. UI Integration & Styling

- [ ] 3.1 Integrate the Donut Chart and category breakdown section into the History ("明細") tab above the transaction table in `src/App.jsx`
- [ ] 3.2 Add dark-mode glassmorphism CSS styles, responsive mobile layouts, and transition animations in `src/App.css`
- [ ] 3.3 Ensure empty state handling (when monthly total is $0 or no transactions exist) and seamless updates upon month switching or adding new records

## 4. Verification & Polish

- [ ] 4.1 Verify calculation accuracy for category amounts and percentages across different months
- [ ] 4.2 Test mobile responsiveness, touch interactions, and build correctness with `npm run build`

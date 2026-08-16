## Context

Sheeto is a mobile-first expense logging web application using React + Vite with a dark-mode glassmorphism design. In the "History" (明細) tab, users can select any month to view their logged transactions retrieved from Google Apps Script. Currently, the interface presents the total monthly expense and a transaction table, but lacks a visual breakdown of spending across categories.

Adding an expense pie/donut chart on the History tab will provide users with immediate visual feedback on their spending proportions and top expense categories.

## Goals / Non-Goals

**Goals:**
- Aggregate monthly transactions by category to calculate category totals, percentages, and overall monthly spending.
- Render a responsive, modern SVG donut chart matching the dark-theme glassmorphism aesthetic.
- Display the monthly total spending prominently in the center of the donut chart.
- Provide a clean category breakdown list sorted by spending (descending), displaying emoji, category name, formatted dollar amount, and percentage.
- Support interactive segment highlighting on hover or tap.
- Automatically update the chart when switching months or when new expenses are added.
- Keep bundle size minimal with zero external heavy chart libraries.

**Non-Goals:**
- Historical multi-month comparative bar charts or yearly spending trends.
- Custom user-defined category creation or category color pickers.
- Budgeting target limit / warning threshold alarms.

## Decisions

### Decision 1: Custom SVG Donut Chart vs Third-Party Charting Library
- **Choice**: Implement a lightweight native SVG Donut Chart component with SVG `stroke-dasharray` and `stroke-dashoffset` (or SVG arc paths).
- **Rationale**:
  - Eliminates bulky external dependencies (Chart.js, Recharts, etc.), keeping bundle size extremely light and load times instantaneous.
  - Gives 100% control over CSS styling, animations, responsive scaling, and dark-theme color harmony.
  - Zero compatibility friction with React 18 and Vite.
- **Alternatives Considered**:
  - *Chart.js / Recharts*: Rich features, but adds unnecessary bundle weight and canvas/DOM overhead for a single mobile donut chart.
  - *CSS `conic-gradient`*: Simple, but harder to animate and interact with individual slices or hover tooltips cleanly.

### Decision 2: Palette Mapping & Category Integration
- **Choice**: Map each category from the predefined `CATEGORIES` array to a curated, high-contrast color token:
  - 餐費 (Meals): `#f97316` (Warm Orange)
  - 咖啡飲料 (Coffee): `#d97706` (Amber)
  - 衣服鞋子美容保養 (Beauty): `#ec4899` (Pink)
  - 運輸交通 (Transport): `#3b82f6` (Blue)
  - 居家生活用品 (Household): `#10b981` (Emerald)
  - 醫療/保健 (Medical): `#ef4444` (Red)
  - 健身運動/按摩 (Fitness): `#8b5cf6` (Purple)
  - 休閒娛樂 (Entertainment): `#06b6d4` (Cyan)
  - 3C/電子產品 (Digital): `#6366f1` (Indigo)
  - 公益 (Charity): `#f43f5e` (Rose)
  - 其他 (Others): `#94a3b8` (Slate)
  - Fallback (unmatched category): `#94a3b8` (Slate) — same as 其他, used when a transaction's `category` string does not match any entry in `CATEGORIES` (e.g. legacy or manually-edited data)
- **Rationale**: Consistent color association across re-renders and easy visual recognition for users. The fallback avoids `undefined` colors reaching the SVG when data drifts from the predefined category list.

### Decision 3: Component Hierarchy & UX Layout
- **Layout**:
  - Month selector in the header of the History view.
  - Donut Chart summary card: Displays the SVG Donut chart with total amount in the center, alongside or above a detailed category breakdown list with percentage bars.
  - Detailed Transaction Table: Located directly beneath the summary chart for granular line-item inspection.
- **Interactivity**: Clicking/tapping a category in the legend or slice highlights the category and displays its specific spending details.

## Risks / Trade-offs

- **[Risk] Rounding and tiny percentage slices (< 1%)**
  - *Mitigation*: Percentages will be formatted with 1 decimal place (e.g. `12.5%`). If a category is non-zero but < 0.1%, display `< 0.1%`. SVG segments will include minimal gap offsets so all active categories remain discernible.
- **[Risk] Performance on large transaction lists**
  - *Mitigation*: Category totals and proportions are computed using `useMemo` based on `transactions`. For typical monthly datasets (< 1,000 items), calculation overhead is < 1ms.
- **[Risk] Zero transactions or zero total in month**
  - *Mitigation*: Render a graceful empty-state placeholder in place of the chart without dividing by zero or emitting SVG NaN values.

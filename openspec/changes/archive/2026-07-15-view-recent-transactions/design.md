## Context

Currently, Sheeto operates as a write-only client. The Google Apps Script backend (`gas/Code.js`) only handles POST requests for appending transactions. The React frontend (`src/App.jsx`) only submits transactions. Users have no way to view their historical logging data without leaving the app and opening the spreadsheet directly.

To resolve this, we will add read capabilities to Sheeto:
1. Extend the GAS API to support querying transactions for a given month.
2. Extend the React frontend to display a monthly transactions list with monthly total calculation, allowing month-to-month navigation.

## Goals / Non-Goals

**Goals:**
- Implement a `doGet` handler in `gas/Code.js` that parses `action`, `month`, and `passcode` parameters to return matching transactions.
- Implement a month selector in `src/App.jsx` showing months of the current year.
- Display a card containing the list of transactions for the selected month, showing Date, Category, Amount, and Remarks.
- Calculate and display the total spending for the selected month.
- Auto-refresh the list whenever a new transaction is successfully added.

**Non-Goals:**
- Edit or delete transactions from the mobile UI.
- Full multi-year calendar selector (a simple list of months for the current year is sufficient).
- Advanced category-wise breakdown charts.

## Decisions

### 1. API Method for Retrieving Transactions
- **Option A**: Use `doGet(e)` with query parameters: `?action=getTransactions&month=YYYY-MM&passcode=XYZ`.
- **Option B**: Use `doPost(e)` with an action payload: `{ action: "getTransactions", month: "YYYY-MM", passcode: "XYZ" }`.
- **Decision**: **Option A (doGet)**. It is semantically correct for fetching data. Although `passcode` is sent in the URL query string, GAS is accessed over HTTPS, securing transit. The React client can perform a simple `fetch` with query parameters.
- **Alternatives considered**: Option B is also secure, but GET is standard for reads.

### 2. Frontend Month Selector Design
- **Option A**: A dropdown selector (e.g., `<select>`) displaying months.
- **Option B**: Month paging buttons (Prev/Next month).
- **Decision**: **Option A (Dropdown selector)**. A dropdown is compact, mobile-friendly, and allows quick jumping to any month of the current year without clicking multiple times. We will generate the options dynamically (e.g. all months of the current year or the last 12 months).

### 3. Data Formatting and Sorting
- **Date Matching**: Column A stores actual `Date` objects (the `yyyy/MM/dd` formatting set in `setupSheet()` is only a display format). The GAS script must convert each cell's `Date` value to a comparable string using `Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM")` and compare against the requested `month` parameter, rather than relying on string parsing. This avoids mismatches introduced by timezone differences between the script's execution timezone and the spreadsheet's timezone.
- **Output Format**: Matching rows are formatted as `yyyy/MM/dd` in the JSON response (consistent with how dates are submitted from the frontend).
- **Sorting**: The transactions will be returned sorted in **descending order (newest first)** so the user can easily see their latest entry at the top of the list.
- **Parameter Validation**: `doGet(e)` must validate that `action` is `getTransactions` and `month` matches `YYYY-MM` before querying the sheet, returning a `success: false` validation error otherwise (mirrors the existing parameter validation in `doPost`).

### 4. Concurrent Request Handling (Frontend)
- **Problem**: If the user switches months quickly, an earlier request (for a previously selected month) may resolve *after* a later request (for the currently selected month), overwriting the UI with stale data.
- **Decision**: Guard the fetch effect with an `AbortController` (aborting the previous in-flight request when the selected month changes) or a request-sequence check, so only the response matching the currently selected month is ever applied to state.

### 5. Navigation Layout Design
- **Problem**: Displaying the monthly transaction list directly underneath the log forms on a single page makes the UI cluttered and requires substantial vertical scrolling on small mobile screens.
- **Decision**: Split the application into two distinct tab views ("Log" and "History") using a sticky bottom navigation bar. This isolates the entry context from the browsing context, keeping the mobile viewport clean and focused.

## Risks / Trade-offs

- **[Risk] Performance on large sheets**: Scanning all rows of `2026記帳明細` using `getValues()` could slow down if there are tens of thousands of rows.
  - *Mitigation*: For a personal budget spreadsheet, the number of transactions per year is usually under 5000 rows. Apps Script easily handles `getValues()` for a few thousand rows.
- **[Risk] CORS / Google Redirect issues**: Google Apps Script web apps return a 302 redirect.
  - *Mitigation*: The standard browser `fetch()` API automatically follows redirects.
- **[Risk] Passcode exposure via GET query string**: Sending `passcode` as a query parameter means it can be captured in browser history, and in Apps Script's own execution logs, beyond just transit exposure (which HTTPS already covers). This is a wider exposure surface than the existing `doPost` flow, which only sends the passcode in the request body.
  - *Mitigation*: Accepted for this iteration given personal single-user use; document that the Web App URL should not be shared or bookmarked publicly. If this becomes a concern, a follow-up change should migrate `getTransactions` to `doPost` with an action-based payload to match the write path's exposure profile.
- **[Risk] Month selector limited to current year**: Per the Non-Goals, the selector only lists months of the current year, so around a year boundary (e.g. early January) the user cannot browse December of the prior year from the dropdown.
  - *Mitigation*: Accepted as a known limitation for this change; revisit in a future change if needed.

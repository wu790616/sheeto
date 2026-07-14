## 1. Backend Implementation

- [ ] 1.1 Implement `doGet(e)` in [gas/Code.js](file:///Users/wendywu/proj/sheeto/gas/Code.js) to retrieve and filter transactions from the `2026記帳明細` sheet by a given month, using `Utilities.formatDate` with the script timezone to compare each row's `Date` value against the requested `yyyy-MM` month.
- [ ] 1.2 Add passcode verification in `doGet(e)` to protect transaction data.
- [ ] 1.3 Validate the `action` and `month` request parameters in `doGet(e)`, returning a `success: false` validation error (consistent with `doPost`'s existing validation) when `month` is missing or not in `YYYY-MM` format.

## 2. Frontend State & Fetch Logic

- [ ] 2.1 Add state variables in [src/App.jsx](file:///Users/wendywu/proj/sheeto/src/App.jsx) for the selected month, transactions list, list loading indicator, and fetch errors.
- [ ] 2.2 Implement a fetch function in `src/App.jsx` to retrieve transactions using the GAS Web App GET API with the configured passcode and selected month.
- [ ] 2.3 Set up an `useEffect` hook to fetch transactions automatically on mount and whenever the selected month, passcode, or GAS URL changes.
- [ ] 2.4 Update the `handleSubmit` function in `src/App.jsx` to automatically trigger a refresh of the transaction list after a new transaction is successfully submitted.
- [ ] 2.5 Guard the fetch effect against race conditions (e.g. `AbortController` or a request-sequence check) so that a stale response for a previously selected month cannot overwrite the currently displayed month's data.

## 3. UI and Styling

- [ ] 3.1 Design and render a month selector in `src/App.jsx` displaying months of the current year.
- [ ] 3.2 Add a card in `src/App.jsx` to render the monthly transactions list (table or cards) and show the calculated monthly total sum.
- [ ] 3.3 Apply CSS styles to the month selector, transaction list card, and monthly total sum indicator in [src/App.css](file:///Users/wendywu/proj/sheeto/src/App.css) using the app's premium glassmorphism design.
- [ ] 3.4 Add an empty-state treatment for months with no transactions and an error-state treatment for failed fetches, without clearing previously displayed data on a failed refresh.

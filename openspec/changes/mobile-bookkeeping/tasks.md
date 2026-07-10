## 1. Google Sheets Configuration

- [x] 1.1 Create the new sheet tab named `2026記帳明細` in the spreadsheet with the column headers: Date, Category, Amount, Remarks.
- [x] 1.2 Update the formulas in column J (July 2026) for all "非計劃" categories in the `2026滿月記帳` sheet to use `=SUMIFS('2026記帳明細'!C:C, '2026記帳明細'!A:A, ">=2026-07-01", '2026記帳明細'!A:A, "<=2026-07-31", '2026記帳明細'!B:B, "<category_name>")`.

## 2. Google Apps Script Implementation

- [x] 2.1 Create an Apps Script file in the spreadsheet editor containing a `doPost(e)` function that parses JSON payloads.
- [x] 2.2 Implement static passcode validation using GAS Script Properties to authorize incoming POST requests.
- [x] 2.3 Write logic to append a row to `2026記帳明細` containing the parsed Date, Category, Amount, and Remarks, and return a CORS-enabled JSON response.
- [x] 2.4 Deploy the Apps Script as a Web App with access set to "Anyone" and copy the deployment URL.

## 3. Frontend Project Setup

- [x] 3.1 Initialize a new Vite-based React application in the workspace root.
- [x] 3.2 Install project dev dependencies and configure a clean folder structure.

## 4. Frontend UI Implementation

- [x] 4.1 Design a premium, mobile-first responsive layout with a dark theme and clean typography.
- [x] 4.2 Build the custom numeric keypad and amount display component for rapid input.
- [x] 4.3 Implement category selector buttons based on the user's categories.
- [x] 4.4 Add date toggle buttons ("Today" / "Yesterday") and an optional remarks text input.
- [x] 4.5 Create a settings panel to store the user's GAS Web App URL and passcode in `localStorage`.

## 5. API Connection & Integration

- [x] 5.1 Implement the API client function to send POST requests with transaction data and passcode to the GAS endpoint.
- [x] 5.2 Implement loading indicators, success animations, and error handling messages in the UI.

## 6. Verification and Deployment

- [ ] 6.1 Deploy the Vite React app to Zeabur.
- [ ] 6.2 Conduct a full end-to-end test of logging a transaction from a mobile device and verifying it appears in the spreadsheet.

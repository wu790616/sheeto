## Why

The user manages their personal finance in a Google Sheet (`理財.xlsx`, specifically the `2026滿月記帳` sheet). Currently, recording daily expenses on mobile is extremely tedious because the user has to manually append values (e.g. `+150`) to a cell containing a long addition formula (e.g. `=380+1642+185...`). A dedicated, beautiful, mobile-friendly web interface is needed to log transactions on the go, appending them to a transaction detail tab in Google Sheets, which then automatically aggregates the sums into the main bookkeeping sheet.

## What Changes

- **New Sheet Tab**: Create a new tab `2026記帳明細` in the existing Google Sheet to store transaction details (Date, Category, Amount, Remarks).
- **Google Sheets Formula Updates**: Replace the manual addition formulas in the monthly columns of the `2026滿月記帳` sheet (starting from July) with `SUMIFS` formulas that aggregate transactions from `2026記帳明細`.
- **Google Apps Script Web App**: Deploy an Apps Script in the Google Sheet that exposes a secure POST API endpoint to append new rows to `2026記帳明細`. The endpoint will be protected by a static passcode.
- **Mobile-first React Application**: Build a lightweight, responsive React frontend using Vite and Vanilla CSS. It will feature a quick input keypad, quick date selectors, category buttons based on the user's categories, and a simple submission flow.
- **Free Cloud Deployment**: Deploy the React app to Vercel so it is accessible on mobile anytime.

## Capabilities

### New Capabilities

- `mobile-expense-logging`: Mobile web interface to select a category, enter an amount, select a date (today/yesterday), optionally add remarks, and submit to the GAS API.
- `sheet-integration`: Design of the `2026記帳明細` sheet structure and configuration of the `SUMIFS` formulas in `2026滿月記帳`.

### Modified Capabilities

*None*

## Impact

- **Google Sheet**: A new sheet `2026記帳明細` is added. Monthly column cells (starting from July) in `2026滿月記帳` are updated with `SUMIFS` formulas.
- **Apps Script**: An Apps Script is added and deployed as a Web App to the Google Sheet.
- **Workspace**: A new React frontend codebase is set up in the `sheeto` workspace root.

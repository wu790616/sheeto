## Context

The user manages personal finance in a Google Sheet file (`理財.xlsx`, specifically the `2026滿月記帳` sheet). Currently, updating daily expenses (under the "非計劃" section) on mobile is extremely difficult because it requires opening cells with long formulas like `=380+1642+185...` and appending values. The system needs a simple, responsive mobile web frontend to log transactions and write them directly into Google Sheets, which will then aggregate the sums automatically.

## Goals / Non-Goals

**Goals:**
- Design a new `2026記帳明細` sheet tab to log transaction history (Date, Category, Amount, Remarks).
- Update the monthly column formulas in the `2026滿月記帳` sheet (starting from July 2026) to dynamically aggregate data from the new tab using `=SUMIFS()`.
- Develop a Google Apps Script (GAS) Web App that exposes a POST API endpoint to validate a simple passcode and append rows to the spreadsheet.
- Build a responsive, high-performance mobile-first React application using Vite and Vanilla CSS.
- Deploy the frontend application to Zeabur for secure, persistent access.

**Non-Goals:**
- **Phase 1 Non-Goal**: Displaying the assets dashboard, stocks, funds, or crypto data with Recharts. This is deferred to Phase 2.
- Multi-user authentication system. The app is for a single user, secured by a single static passcode.
- Hosting or configuring an external SQL/NoSQL database. Google Sheets is the single source of truth.

## Decisions

### Decision 1: Google Apps Script Web App for API
- **Rationale**: Since all data must reside in Google Sheets, Google Apps Script (GAS) is the most efficient and secure way to interact with Google Sheets. By deploying the script as a Web App (executing as "Me", accessible by "Anyone"), we expose an HTTP endpoint that can write to the sheets directly without requiring OAuth 2.0 login on the client device.
- **Alternatives**: Client-side Google Sheets API integration via Google Identity Services. Rejected because it requires authenticating with Google frequently on mobile, exposing API client keys, and adding UX friction.

### Decision 2: React (Vite) + Zeabur for Frontend
- **Rationale**: Vite provides near-instant reload during development and a highly optimized build. React makes it easy to build dynamic forms, keypads, and layout state. Zeabur offers clean Git-based deployments that automatically rebuild on push, aligning with the user's existing environment.
- **Alternatives**: Google Apps Script HTML Service. Rejected because GAS HTML service executes inside an iframe on Google domains, leading to slow rendering, URL routing limitations, and poor styling capabilities.

### Decision 3: Custom Password/Passcode Security
- **Rationale**: To prevent unauthorized users from posting to the spreadsheet, the Apps Script API will require a `passcode` parameter in the POST payload. This passcode will be validated against a secret stored in the Apps Script properties. The user will input this passcode in their React client, which will be saved in local storage so they only have to enter it once.
- **Alternatives**: Firebase Auth / Auth0. Rejected as it adds external service dependencies and increases complexity for a single-user project.

### Decision 4: Data Schema in `2026記帳明細`
- Columns:
  1. **Date** (`yyyy/MM/dd` format)
  2. **Category** (String matching row labels in `2026滿月記帳`, e.g., `餐費`, `咖啡飲料`, `運輸交通`)
  3. **Amount** (Number)
  4. **Remarks** (String, optional)

## Risks / Trade-offs

- **[Risk] GAS Latency** → Mitigated by displaying a loading spinner on submission and disabling double-clicks on the submit button.
- **[Risk] Spreadsheet structure changes (Yearly rollover)** → Mitigated by defining sheet names as config constants in both the Apps Script and React apps.

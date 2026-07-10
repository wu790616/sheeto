/**
 * Sheeto - Google Apps Script Backend (Refactored)
 * 
 * Instructions:
 * 1. Open your Google Sheet in a browser.
 * 2. Click on "Extensions" -> "Apps Script".
 * 3. Delete any default code and paste this file.
 * 4. Run `setupSheet()` once to configure the sheets and automatically scan & set formula.
 * 5. Set the Passcode: Click the gear icon (Project Settings), scroll to "Script Properties",
 *    and add a property with Name "PASSCODE" and your secret value (e.g., "1234").
 * 6. Click "Deploy" -> "New deployment" -> Select type "Web app".
 *    - Execute as: "Me" (your-email)
 *    - Who has access: "Anyone"
 * 7. Deploy and copy the Web App URL for your frontend.
 */

// Configuration
const LOG_SHEET_NAME = "2026記帳明細";
const SUMMARY_SHEET_NAME = "2026滿月記帳";

// Categories matching App.jsx and Column C row labels
const CATEGORIES_LIST = [
  "餐費",
  "咖啡飲料",
  "衣服鞋子美容保養",
  "運輸交通",
  "居家生活用品",
  "醫療/保健",
  "健身運動/按摩",
  "休閒娛樂",
  "3C/電子產品",
  "公益",
  "其他"
];

/**
 * Setup function to initialize sheets and formulas.
 * Scans Column C dynamically to avoid hardcoding row numbers,
 * and sets up dynamic SUMIFS formulas that automatically handle months (Jul-Dec) and years.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Create the bookkeeping log sheet if it does not exist
  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET_NAME);
    logSheet.appendRow(["日期", "分類", "金額", "備註"]);
    
    // Style the header row
    const headerRange = logSheet.getRange("A1:D1");
    headerRange.setFontWeight("bold");
    headerRange.setBackgroundColor("#e0e0e0");
    headerRange.setHorizontalAlignment("center");
    
    // Format Date and Amount columns
    logSheet.getRange("A:A").setNumberFormat("yyyy/MM/dd");
    logSheet.getRange("C:C").setNumberFormat("#,##0.0");
    
    Logger.log("Created sheet tab: " + LOG_SHEET_NAME);
  } else {
    Logger.log("Sheet tab already exists: " + LOG_SHEET_NAME);
  }
  
  // 2. Set up dynamic SUMIFS formulas in 2026滿月記帳
  const summarySheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (summarySheet) {
    // Read Column C values to dynamically match rows
    const lastRow = summarySheet.getLastRow();
    const cColumnValues = summarySheet.getRange(1, 3, lastRow, 1).getValues(); // Column 3 is Col C
    
    // Column J represents July (Column index 10)
    const colJuly = 10;
    let formulasSetCount = 0;
    
    for (let i = 0; i < cColumnValues.length; i++) {
      const cellValue = cColumnValues[i][0].toString().trim();
      const rowNum = i + 1;
      
      // If the row category matches our known categories
      if (CATEGORIES_LIST.indexOf(cellValue) !== -1) {
        const cell = summarySheet.getRange(rowNum, colJuly);
        
        // DYNAMIC FORMULA:
        // - Extracts year from $D$1 (e.g. "2026年" -> 2026)
        // - Extracts month from header J$2 (e.g. "7月" -> 7)
        // - Calculates EOMONTH for start and end date boundaries
        // - Matches category from $C<row>
        const formula = `=SUMIFS('${LOG_SHEET_NAME}'!$C:$C, '${LOG_SHEET_NAME}'!$A:$A, ">="&DATE(VALUE(SUBSTITUTE($D$1, "年", "")), SUBSTITUTE(J$2, "月", ""), 1), '${LOG_SHEET_NAME}'!$A:$A, "<="&EOMONTH(DATE(VALUE(SUBSTITUTE($D$1, "年", "")), SUBSTITUTE(J$2, "月", ""), 1), 0), '${LOG_SHEET_NAME}'!$B:$B, $C${rowNum})`;
        
        cell.setFormula(formula);
        formulasSetCount++;
      }
    }
    
    Logger.log("Dynamically scanned C column and set " + formulasSetCount + " formulas in " + SUMMARY_SHEET_NAME);
  } else {
    Logger.log("Error: Summary sheet '" + SUMMARY_SHEET_NAME + "' not found.");
  }
}

/**
 * Handle POST requests from the mobile client
 */
function doPost(e) {
  try {
    // Parse input data
    const payload = JSON.parse(e.postData.contents);
    const dateStr = payload.date; // "yyyy/MM/dd"
    const category = payload.category;
    const amount = parseFloat(payload.amount);
    const remarks = payload.remarks || "";
    const passcode = payload.passcode;
    
    // 1. Validate passcode
    const systemPasscode = PropertiesService.getScriptProperties().getProperty("PASSCODE");
    if (!systemPasscode) {
      return createJsonResponse({ success: false, error: "System passcode is not configured in Script Properties." }, 500);
    }
    if (passcode !== systemPasscode) {
      return createJsonResponse({ success: false, error: "Unauthorized: Invalid passcode." }, 401);
    }
    
    // 2. Validate parameters
    if (!dateStr || !category || isNaN(amount)) {
      return createJsonResponse({ success: false, error: "Bad Request: Missing required parameters." }, 400);
    }
    
    // 3. Append row to sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!logSheet) {
      return createJsonResponse({ success: false, error: "Sheet '" + LOG_SHEET_NAME + "' not found. Run setupSheet() first." }, 500);
    }
    
    // Format date string to Date object to ensure Google Sheets parses it correctly
    const dateParts = dateStr.split("/");
    const parsedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    
    logSheet.appendRow([parsedDate, category, amount, remarks]);
    
    return createJsonResponse({ success: true, message: "Transaction logged successfully." }, 200);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() }, 500);
  }
}

/**
 * Handle preflight OPTIONS request for CORS compatibility
 */
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Helper to build JSON responses.
 * Note: Google Web Apps automatically handles redirection and Access-Control-Allow-Origin: *
 * when requests are made via simple requests (Content-Type: text/plain).
 */
function createJsonResponse(data) {
  const jsonString = JSON.stringify(data);
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

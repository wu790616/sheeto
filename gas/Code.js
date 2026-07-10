/**
 * Sheeto - Google Apps Script Backend
 * 
 * Instructions:
 * 1. Open your Google Sheet in a browser.
 * 2. Click on "Extensions" -> "Apps Script".
 * 3. Delete any default code and paste this file.
 * 4. Run `setupSheet()` once to configure the sheets and J column formulas (July 2026).
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

/**
 * Setup function to initialize sheets and formulas.
 * Run this ONCE from the Apps Script editor.
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
  
  // 2. Set up SUMIFS formulas in 2026滿月記帳 (Column J for July 2026)
  const summarySheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (summarySheet) {
    // Mapping of Row Number -> Category Name based on the user's spreadsheet structure
    const categories = {
      33: "餐費",
      34: "咖啡飲料",
      35: "衣服鞋子美容保養",
      36: "運輸交通",
      37: "居家生活用品",
      38: "醫療/保健",
      39: "健身運動/按摩",
      40: "休閒娛樂",
      41: "3C/電子產品",
      42: "公益",
      43: "其他"
    };
    
    // Column J represents July (Column index 10)
    const colJuly = 10;
    
    for (const rowStr in categories) {
      const row = parseInt(rowStr, 10);
      const categoryName = categories[row];
      const cell = summarySheet.getRange(row, colJuly);
      
      // SUMIFS(Sum_Range, Date_Range, ">=Start_Date", Date_Range, "<=End_Date", Category_Range, "Category_Name")
      const formula = `=SUMIFS('${LOG_SHEET_NAME}'!C:C, '${LOG_SHEET_NAME}'!A:A, ">=2026-07-01", '${LOG_SHEET_NAME}'!A:A, "<=2026-07-31", '${LOG_SHEET_NAME}'!B:B, "${categoryName}")`;
      cell.setFormula(formula);
    }
    Logger.log("Configured July 2026 formulas in " + SUMMARY_SHEET_NAME);
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
  const output = ContentService.createTextOutput();
  return output.setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Helper to build JSON responses with CORS headers enabled
 */
function createJsonResponse(data, statusCode) {
  const jsonString = JSON.stringify(data);
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

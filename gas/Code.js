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
 * and sets up dynamic SUMIFS formulas for all month columns (e.g. 1月~12月, including 8月).
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
  
  // 2. Set up dynamic SUMIFS formulas in 2026滿月記帳 for all month columns
  const summarySheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (summarySheet) {
    // Read Column C values to dynamically match rows
    const lastRow = summarySheet.getLastRow();
    const lastCol = summarySheet.getLastColumn();
    const cColumnValues = summarySheet.getRange(1, 3, lastRow, 1).getValues(); // Column 3 is Col C
    
    // Read Row 2 headers to find all month columns (e.g. "1月", "2月", ..., "12月")
    const row2Values = summarySheet.getRange(2, 1, 1, lastCol).getValues()[0];
    
    let formulasSetCount = 0;
    
    for (let col = 1; col <= lastCol; col++) {
      const headerVal = row2Values[col - 1].toString().trim();
      
      // If the row 2 header matches month pattern and is 7月 or later (>= 7)
      const monthMatch = headerVal.match(/^(\d+)月$/);
      if (monthMatch && parseInt(monthMatch[1], 10) >= 7) {
        const colLetter = getColumnLetter(col);
        
        for (let i = 0; i < cColumnValues.length; i++) {
          const cellValue = cColumnValues[i][0].toString().trim();
          const rowNum = i + 1;
          
          // If the row category matches our known categories
          if (CATEGORIES_LIST.indexOf(cellValue) !== -1) {
            const cell = summarySheet.getRange(rowNum, col);
            
            // DYNAMIC FORMULA:
            // - Extracts year from $D$1 (e.g. "2026年" -> 2026)
            // - Extracts month from header <Col>$2 (e.g. "8月" -> 8)
            // - Calculates EOMONTH for start and end date boundaries
            // - Matches category from $C<row>
            const formula = `=SUMIFS('${LOG_SHEET_NAME}'!$C:$C, '${LOG_SHEET_NAME}'!$A:$A, ">="&DATE(VALUE(SUBSTITUTE($D$1, "年", "")), SUBSTITUTE(${colLetter}$2, "月", ""), 1), '${LOG_SHEET_NAME}'!$A:$A, "<="&EOMONTH(DATE(VALUE(SUBSTITUTE($D$1, "年", "")), SUBSTITUTE(${colLetter}$2, "月", ""), 1), 0), '${LOG_SHEET_NAME}'!$B:$B, $C${rowNum})`;
            
            cell.setFormula(formula);
            formulasSetCount++;
          }
        }
      }
    }
    
    Logger.log("Dynamically scanned C column and month headers, set " + formulasSetCount + " formulas in " + SUMMARY_SHEET_NAME);
  } else {
    Logger.log("Error: Summary sheet '" + SUMMARY_SHEET_NAME + "' not found.");
  }
}

/**
 * Helper function to convert 1-based column index to column letter (1 -> A, 4 -> D, 10 -> J, 11 -> K, etc.)
 */
function getColumnLetter(colIndex) {
  let temp, letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    colIndex = Math.floor((colIndex - temp) / 26);
  }
  return letter;
}

/**
 * Parse and validate a date string in yyyy/MM/dd format.
 * Ensures the date is a real calendar date in the year 2026.
 */
function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  const match = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year !== 2026) return null; // Sheet is year-specific (2026)
  if (month < 1 || month > 12) return null;
  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return null;
  }
  return dateObj;
}

/**
 * Validate transaction fields (date, category, amount).
 * Returns { valid: true, parsedDate, amount } or { valid: false, error }.
 */
function validateTransactionFields(dateStr, category, amount) {
  const parsedDate = parseDate(dateStr);
  if (!parsedDate) {
    return { valid: false, error: "無效的日期格式，請使用 2026 年的 yyyy/MM/dd 格式。" };
  }
  if (!category || CATEGORIES_LIST.indexOf(category) === -1) {
    return { valid: false, error: "無效的消費分類。" };
  }
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0 || !isFinite(numAmount)) {
    return { valid: false, error: "金額必須為大於 0 的數值。" };
  }
  return { valid: true, parsedDate: parsedDate, amount: numAmount };
}

/**
 * Normalize a sheet row [date, category, amount, remarks] using the same logic as getTransactions.
 */
function normalizeRow(row, tz) {
  let dateObj = row[0];
  if (dateObj && !(dateObj instanceof Date)) {
    dateObj = new Date(dateObj);
  }
  const dateStr = (dateObj instanceof Date && !isNaN(dateObj.getTime()))
    ? Utilities.formatDate(dateObj, tz, "yyyy/MM/dd")
    : "";
  return {
    date: dateStr,
    category: row[1] !== undefined && row[1] !== null ? row[1].toString().trim() : "",
    amount: parseFloat(row[2]) || 0,
    remarks: row[3] !== undefined && row[3] !== null ? row[3].toString().trim() : ""
  };
}

/**
 * Validate target row bounds and verify optimistic concurrency check against original values.
 */
function validateRowTarget(sheet, rowIndex, original, tz) {
  if (!Number.isInteger(rowIndex) || rowIndex < 2 || rowIndex > sheet.getLastRow()) {
    return {
      valid: false,
      response: createJsonResponse({ success: false, error: "Bad Request: Invalid or out-of-bounds rowIndex." })
    };
  }
  if (!original || typeof original !== "object" || !original.date || original.category === undefined || original.amount === undefined) {
    return {
      valid: false,
      response: createJsonResponse({ success: false, error: "Bad Request: Missing original transaction values for concurrency check." })
    };
  }
  const currentRowValues = sheet.getRange(rowIndex, 1, 1, 4).getValues()[0];
  const currentRowNorm = normalizeRow(currentRowValues, tz);

  const origAmount = parseFloat(original.amount) || 0;
  const origRemarks = original.remarks !== undefined && original.remarks !== null ? original.remarks.toString().trim() : "";
  const origCategory = original.category ? original.category.toString().trim() : "";
  const origDate = original.date ? original.date.toString().trim() : "";

  const isMatch = (
    currentRowNorm.date === origDate &&
    currentRowNorm.category === origCategory &&
    Math.abs(currentRowNorm.amount - origAmount) < 0.001 &&
    currentRowNorm.remarks === origRemarks
  );

  if (!isMatch) {
    return {
      valid: false,
      response: createJsonResponse({
        success: false,
        code: "CONFLICT",
        error: "資料已變動，已重新整理，請再試一次"
      })
    };
  }

  return { valid: true };
}

/**
 * Handle GET requests from the mobile client
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const passcode = e.parameter.passcode;
    const month = e.parameter.month;
    
    // 1. Validate passcode
    const systemPasscode = PropertiesService.getScriptProperties().getProperty("PASSCODE");
    if (!systemPasscode) {
      return createJsonResponse({ success: false, error: "System passcode is not configured in Script Properties." });
    }
    if (passcode !== systemPasscode) {
      return createJsonResponse({ success: false, error: "Unauthorized: Invalid passcode." });
    }
    
    // 2. Validate action and month parameters
    if (action !== "getTransactions") {
      return createJsonResponse({ success: false, error: "Bad Request: Invalid action." });
    }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return createJsonResponse({ success: false, error: "Bad Request: Missing or invalid month parameter. Expected format: YYYY-MM." });
    }
    
    // 3. Query transactions from sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!logSheet) {
      return createJsonResponse({ success: false, error: "Sheet '" + LOG_SHEET_NAME + "' not found. Run setupSheet() first." });
    }
    
    const lastRow = logSheet.getLastRow();
    const transactions = [];
    
    if (lastRow > 1) {
      const values = logSheet.getRange(2, 1, lastRow - 1, 4).getValues();
      const tz = Session.getScriptTimeZone();
      
      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        const dateVal = row[0];
        let dateObj = dateVal;
        
        if (dateObj && !(dateObj instanceof Date)) {
          dateObj = new Date(dateObj);
        }
        
        if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
          const rowMonth = Utilities.formatDate(dateObj, tz, "yyyy-MM");
          if (rowMonth === month) {
            transactions.push({
              rowIndex: i + 2,
              date: Utilities.formatDate(dateObj, tz, "yyyy/MM/dd"),
              category: row[1],
              amount: parseFloat(row[2]) || 0,
              remarks: row[3] || ""
            });
          }
        }
      }
    }
    
    // Sort descending by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return createJsonResponse({ success: true, transactions: transactions });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle POST requests from the mobile client
 */
function doPost(e) {
  let lock = null;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "Bad Request: Missing request body." });
    }
    // Parse input data
    const payload = JSON.parse(e.postData.contents);
    const passcode = payload.passcode;
    
    // 1. Validate passcode first
    const systemPasscode = PropertiesService.getScriptProperties().getProperty("PASSCODE");
    if (!systemPasscode) {
      return createJsonResponse({ success: false, error: "System passcode is not configured in Script Properties." });
    }
    if (passcode !== systemPasscode) {
      return createJsonResponse({ success: false, error: "Unauthorized: Invalid passcode." });
    }

    const action = payload.action;

    // 2. Strict action dispatch: absent or createTransaction -> create; updateTransaction -> update; deleteTransaction -> delete; else reject
    if (action && action !== "createTransaction" && action !== "updateTransaction" && action !== "deleteTransaction") {
      return createJsonResponse({ success: false, error: "Bad Request: Invalid action." });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logSheet = ss.getSheetByName(LOG_SHEET_NAME);
    if (!logSheet) {
      return createJsonResponse({ success: false, error: "Sheet '" + LOG_SHEET_NAME + "' not found. Run setupSheet() first." });
    }
    const tz = Session.getScriptTimeZone();

    // 3. Acquire script lock for all writes (10s timeout)
    lock = LockService.getScriptLock();
    const hasLock = lock.tryLock(10000);
    if (!hasLock) {
      return createJsonResponse({ success: false, error: "伺服器忙碌中，請稍後重試 (Lock timeout)" });
    }

    // 4. Handle Create (Action absent or createTransaction)
    if (!action || action === "createTransaction") {
      const fieldVal = validateTransactionFields(payload.date, payload.category, payload.amount);
      if (!fieldVal.valid) {
        return createJsonResponse({ success: false, error: fieldVal.error });
      }
      const remarks = payload.remarks !== undefined && payload.remarks !== null ? payload.remarks.toString().trim() : "";
      logSheet.appendRow([fieldVal.parsedDate, payload.category, fieldVal.amount, remarks]);
      return createJsonResponse({ success: true, message: "Transaction logged successfully." });
    }

    // 5. Handle Update
    if (action === "updateTransaction") {
      const rowIndex = payload.rowIndex;
      const targetCheck = validateRowTarget(logSheet, rowIndex, payload.original, tz);
      if (!targetCheck.valid) {
        return targetCheck.response;
      }

      const fieldVal = validateTransactionFields(payload.date, payload.category, payload.amount);
      if (!fieldVal.valid) {
        return createJsonResponse({ success: false, error: fieldVal.error });
      }
      const remarks = payload.remarks !== undefined && payload.remarks !== null ? payload.remarks.toString().trim() : "";
      logSheet.getRange(rowIndex, 1, 1, 4).setValues([[fieldVal.parsedDate, payload.category, fieldVal.amount, remarks]]);
      return createJsonResponse({ success: true, message: "Transaction updated successfully." });
    }

    // 6. Handle Delete
    if (action === "deleteTransaction") {
      const rowIndex = payload.rowIndex;
      const targetCheck = validateRowTarget(logSheet, rowIndex, payload.original, tz);
      if (!targetCheck.valid) {
        return targetCheck.response;
      }
      logSheet.deleteRow(rowIndex);
      return createJsonResponse({ success: true, message: "Transaction deleted successfully." });
    }

    return createJsonResponse({ success: false, error: "Bad Request: Unhandled action." });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  } finally {
    if (lock) {
      try {
        lock.releaseLock();
      } catch (releaseErr) {
        // ignore release error
      }
    }
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

/**
 * تابع برای دریافت داده‌ها (GET Request)
 */
function doGet(e) {
    try {
        const action = e.parameter.action || 'getData';

        // دریافت لیست ادیتورها
        if (action === 'getEditors') {
            const editors = getEditors();
            return ContentService.createTextOutput(
                JSON.stringify({ success: true, data: editors })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // دریافت درخواست‌های مدیر
        if (action === 'getManagerRequests') {
            const requests = getManagerRequests();
            return ContentService.createTextOutput(
                JSON.stringify({ success: true, data: requests, count: requests.length })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // دریافت داده‌های اصلی (پیش‌فرض)
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Main_Data");

        if (!sheet) {
            return ContentService.createTextOutput(
                JSON.stringify({ error: "Sheet 'Main_Data' not found" })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        const dataRange = sheet.getDataRange();
        const values = dataRange.getValues();

        // ردیف اول header است
        const headers = values[0];
        const data = [];

        // تبدیل به آرایه‌ای از objects
        for (let i = 1; i < values.length; i++) {
            const row = {};
            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = values[i][j];
            }
            data.push(row);
        }

        return ContentService.createTextOutput(
            JSON.stringify({
                success: true,
                data: data,
                count: data.length
            })
        ).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(
            JSON.stringify({
                success: false,
                error: error.toString()
            })
        ).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * تابع برای بروزرسانی داده (POST Request)
 */
function doPost(e) {
    try {
        const params = JSON.parse(e.postData.contents);
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Main_Data");

        if (!sheet) {
            return ContentService.createTextOutput(
                JSON.stringify({ success: false, error: "Sheet not found" })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // بروزرسانی سلول مشخص
        if (params.action === "updateCell") {
            sheet.getRange(params.row, params.col).setValue(params.value);

            return ContentService.createTextOutput(
                JSON.stringify({ success: true, message: "Cell updated successfully" })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // بروزرسانی ردیف کامل
        if (params.action === "updateRow") {
            const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            const rowIndex = params.rowIndex + 2; // +1 برای header, +1 برای 1-indexed

            for (let key in params.data) {
                const colIndex = headers.indexOf(key) + 1;
                if (colIndex > 0) {
                    sheet.getRange(rowIndex, colIndex).setValue(params.data[key]);
                }
            }

            return ContentService.createTextOutput(
                JSON.stringify({ success: true, message: "Row updated successfully" })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // افزودن ردیف جدید
        if (params.action === "addRow") {
            const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
            const newRow = headers.map(header => params.data[header] || "");
            sheet.appendRow(newRow);

            return ContentService.createTextOutput(
                JSON.stringify({ success: true, message: "Row added successfully" })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // حذف ردیف
        if (params.action === "deleteRow") {
            sheet.deleteRow(params.rowIndex + 2); // +1 برای header, +1 برای 1-indexed

            return ContentService.createTextOutput(
                JSON.stringify({ success: true, message: "Row deleted successfully" })
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // افزودن درخواست مدیر
        if (params.action === "addManagerRequest") {
            const result = addManagerRequest(params.title, params.description, params.priority);
            return ContentService.createTextOutput(
                JSON.stringify(result)
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // حذف درخواست مدیر
        if (params.action === "deleteManagerRequest") {
            const result = deleteManagerRequest(params.requestId);
            return ContentService.createTextOutput(
                JSON.stringify(result)
            ).setMimeType(ContentService.MimeType.JSON);
        }

        // بروزرسانی درخواست مدیر
        if (params.action === "updateManagerRequest") {
            const result = updateManagerRequest(
                params.requestId,
                params.title,
                params.description,
                params.priority,
                params.status
            );
            return ContentService.createTextOutput(
                JSON.stringify(result)
            ).setMimeType(ContentService.MimeType.JSON);
        }

        return ContentService.createTextOutput(
            JSON.stringify({ success: false, error: "Unknown action" })
        ).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(
            JSON.stringify({
                success: false,
                error: error.toString()
            })
        ).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * دریافت گزینه‌های dropdown
 */
function getDropdownOptions() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Dropdowns");

    if (!sheet) {
        return { error: "Dropdowns sheet not found" };
    }

    const data = sheet.getDataRange().getValues();
    const options = {};

    for (let col = 0; col < data[0].length; col++) {
        const columnName = data[0][col];
        const columnValues = [];

        for (let row = 1; row < data.length; row++) {
            if (data[row][col]) {
                columnValues.push(data[row][col]);
            }
        }

        options[columnName] = columnValues;
    }

    return options;
}

/**
 * دریافت لیست ادیتورها (افرادی که دسترسی ویرایش دارند)
 */
function getEditors() {
    try {
        const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const file = DriveApp.getFileById(spreadsheet.getId());
        const editors = file.getEditors();

        return editors.map(editor => ({
            name: editor.getName() || editor.getEmail().split('@')[0],
            email: editor.getEmail()
        }));
    } catch (error) {
        return [];
    }
}

/**
 * دریافت درخواست‌های مدیر از شیت Manager_Requests
 */
function getManagerRequests() {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Manager_Requests");

    // اگر شیت وجود نداشت، ایجاد کن
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Manager_Requests");
        // هدرها
        sheet.getRange(1, 1, 1, 6).setValues([
            ["id", "عنوان", "توضیحات", "تاریخ", "اولویت", "وضعیت"]
        ]);
        sheet.getRange(1, 1, 1, 6).setBackground("#4285f4").setFontColor("white").setFontWeight("bold");
        return [];
    }

    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (values.length <= 1) return [];

    const headers = values[0];
    const data = [];

    for (let i = 1; i < values.length; i++) {
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[i][j];
        }
        data.push(row);
    }

    return data;
}

/**
 * افزودن درخواست جدید از مدیر
 */
function addManagerRequest(title, description, priority) {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Manager_Requests");

    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Manager_Requests");
        sheet.getRange(1, 1, 1, 6).setValues([
            ["id", "عنوان", "توضیحات", "تاریخ", "اولویت", "وضعیت"]
        ]);
        sheet.getRange(1, 1, 1, 6).setBackground("#4285f4").setFontColor("white").setFontWeight("bold");
    }

    const lastRow = sheet.getLastRow();
    const newId = lastRow; // id ساده
    const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");

    sheet.appendRow([newId, title, description, date, priority, "جدید"]);

    return { success: true, id: newId };
}

/**
 * حذف درخواست مدیر
 */
function deleteManagerRequest(requestId) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Manager_Requests");

    if (!sheet) {
        return { success: false, error: "Sheet not found" };
    }

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == requestId) {
            sheet.deleteRow(i + 1);
            return { success: true };
        }
    }

    return { success: false, error: "Request not found" };
}

/**
 * بروزرسانی درخواست مدیر
 */
function updateManagerRequest(requestId, title, description, priority, status) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Manager_Requests");

    if (!sheet) {
        return { success: false, error: "Sheet not found" };
    }

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
        if (data[i][0] == requestId) {
            const row = i + 1;
            if (title) sheet.getRange(row, 2).setValue(title);
            if (description !== undefined) sheet.getRange(row, 3).setValue(description);
            if (priority) sheet.getRange(row, 5).setValue(priority);
            if (status) sheet.getRange(row, 6).setValue(status);
            return { success: true };
        }
    }

    return { success: false, error: "Request not found" };
}

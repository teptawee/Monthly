function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('ระบบบันทึกและจัดการรายรับ-รายจ่าย')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ================= 1. Setup โครงสร้างชีทและรายการเริ่มต้น =================
function setupSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // SetupConfig Sheet (สำหรับรายจ่าย)
  var setupSheet = ss.getSheetByName("SetupConfig");
  if (!setupSheet) {
    setupSheet = ss.insertSheet("SetupConfig");
  } else {
    setupSheet.clear();
  }
  
  setupSheet.appendRow(["ชื่อรายการ", "หมวดหมู่", "จำนวนเงิน"]);
  
  var initialSetup = [
    ["ค่าห้อง", "ค่าที่พักและสาธารณูปโภค", 2200],
    ["ค่าเน็ต AIS", "ค่าโทรศัพท์และอินเทอร์เน็ต", 319],
    ["ค่าเน็ตทรู", "ค่าโทรศัพท์และอินเทอร์เน็ต", 533.93],
    ["ค่าโทรเมย์", "ค่าโทรศัพท์และอินเทอร์เน็ต", 200],
    ["ค่าโทรเทพ", "ค่าโทรศัพท์และอินเทอร์เน็ต", 416],
    ["ค่าโทรตาล", "ค่าโทรศัพท์และอินเทอร์เน็ต", 0],
    ["ค่าโทรแม่", "ค่าโทรศัพท์และอินเทอร์เน็ต", 0],
    ["ประกันสังคมเมย์", "ครอบครัวและเงินออม", 431],
    ["ค่าน้ำ", "ค่าที่พักและสาธารณูปโภค", 0],
    ["ค่าไฟห้องเช่า", "ค่าที่พักและสาธารณูปโภค", 0],
    ["ค่าไฟบ้านใหม่", "ค่าที่พักและสาธารณูปโภค", 0],
    ["ค่าไฟแม่", "ค่าที่พักและสาธารณูปโภค", 0],
    ["ที่จอดรถ", "ค่าที่พักและสาธารณูปโภค", 700],
    ["Lotus", "ค่าใช้จ่ายส่วนตัว / ช้อปปิ้ง", 0],
    ["F Chouse", "ค่าใช้จ่ายส่วนตัว / ช้อปปิ้ง", 0],
    ["Lazada", "ค่าใช้จ่ายส่วนตัว / ช้อปปิ้ง", 0],
    ["Shoppee", "ค่าใช้จ่ายส่วนตัว / ช้อปปิ้ง", 0],
    ["KTC", "ค่าบัตรเครดิตและผ่อนชำระ", 0],
    ["K PLUS", "ค่าบัตรเครดิตและผ่อนชำระ", 0],
    ["PTT", "ค่าบัตรเครดิตและผ่อนชำระ", 0],
    ["TMB FAST", "ค่าบัตรเครดิตและผ่อนชำระ", 0],
    ["TMB Smart", "ค่าบัตรเครดิตและผ่อนชำระ", 0],
    ["SCB Card", "ค่าบัตรเครดิตและผ่อนชำระ", 0],
    ["ค่าบ้าน", "ค่าที่พักและสาธารณูปโภค", 8000],
    ["KPTT", "ค่าบัตรเครดิตและผ่อนชำระ", 0],
    ["เคเบิล", "ค่าที่พักและสาธารณูปโภค", 200],
    ["Lottery", "ค่าใช้จ่ายส่วนตัว / ช้อปปิ้ง", 0],
    ["ให้เมีย", "ครอบครัวและเงินออม", 10000],
    ["ให้แม่", "ครอบครัวและเงินออม", 0],
    ["เงินเก็บ", "ครอบครัวและเงินออม", 0],
    ["เงินออม", "ครอบครัวและเงินออม", 2000]
  ];
  setupSheet.getRange(2, 1, initialSetup.length, 3).setValues(initialSetup);
  
  // SetupIncomeConfig Sheet (สำหรับรายรับ)
  var setupIncSheet = ss.getSheetByName("SetupIncomeConfig");
  if (!setupIncSheet) {
    setupIncSheet = ss.insertSheet("SetupIncomeConfig");
  } else {
    setupIncSheet.clear();
  }
  setupIncSheet.appendRow(["ชื่อรายการรายรับ"]);
  var initialIncomeSetup = [
    ["เงินเดือน"],
    ["โบนัส"],
    ["งานฟรีแลนซ์ / รับจ้าง"],
    ["ขายของออนไลน์"],
    ["เงินปันผล / ดอกเบี้ย"],
    ["รายรับอื่นๆ"]
  ];
  setupIncSheet.getRange(2, 1, initialIncomeSetup.length, 1).setValues(initialIncomeSetup);

  // Expenses Sheet
  var expSheet = ss.getSheetByName("Expenses");
  if (!expSheet) {
    expSheet = ss.insertSheet("Expenses");
    expSheet.appendRow(["ID", "Date", "Name", "Amount", "Status", "Category"]);
  }

  // Incomes Sheet
  var incSheet = ss.getSheetByName("Incomes");
  if (!incSheet) {
    incSheet = ss.insertSheet("Incomes");
    incSheet.appendRow(["ID", "Date", "Source", "Amount", "Category"]);
  }
  
  return "ตั้งค่าระบบ โครงสร้างชีท และรายการตั้งต้นสำเร็จแล้ว!";
}

function getSetupItems() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("SetupConfig");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  data.shift();
  return data;
}

function getIncomeSetupItems() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("SetupIncomeConfig");
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  data.shift();
  var result = [];
  data.forEach(function(row) {
    if(row[0]) result.push(row[0]);
  });
  return result;
}

// ================= 2. ระบบจัดการรายจ่าย (Expenses) =================
function getExpenses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Expenses");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var rows = data.slice(1);
  var result = [];
  
  rows.forEach(function(row) {
    result.push({
      id: row[0],
      date: row[1] ? Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
      name: row[2],
      amount: row[3],
      status: row[4],
      category: row[5]
    });
  });
  
  return result;
}

function saveExpense(item) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Expenses");
  
  if (!sheet) {
    sheet = ss.insertSheet("Expenses");
    sheet.appendRow(["ID", "Date", "Name", "Amount", "Status", "Category"]);
  }
  
  var data = sheet.getDataRange().getValues();
  var targetMonth = item.date ? item.date.substring(0, 7) 
                             : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM");
  
  if (!item.id || item.id === "") {
    for (var i = 1; i < data.length; i++) {
      var rowDate = data[i][1];
      var rowName = data[i][2];
      
      var rowMonth = "";
      if (rowDate) {
        if (rowDate instanceof Date) {
          rowMonth = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM");
        } else {
          rowMonth = String(rowDate).substring(0, 7);
        }
      }
      
      if (rowName === item.name && rowMonth === targetMonth) {
        throw new Error("รายการ \"" + item.name + "\" ได้ถูกบันทึกไปแล้วในรอบเดือนนี้ ไม่สามารถบันทึกซ้ำได้ครับ");
      }
    }
  }

  var category = item.category || getCategoryFromName(item.name);
  saveNewExpenseToConfig(item.name, category, item.amount);

  if (item.id && item.id !== "") {
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(item.id)) {
        sheet.getRange(i + 1, 2, 1, 5).setValues([[item.date, item.name, item.amount, item.status, category]]);
        found = true;
        break;
      }
    }
    if (!found) throw new Error("ไม่พบรายการที่ต้องการแก้ไข");
    return "อัปเดตข้อมูลรายจ่ายสำเร็จ!";
  } else {
    var newId = Utilities.getUuid();
    sheet.appendRow([newId, item.date, item.name, item.amount, item.status, category]);
    return "บันทึกรายการรายจ่ายสำเร็จ!";
  }
}

function saveNewExpenseToConfig(name, category, defaultAmount) {
  if (!name) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var setupSheet = ss.getSheetByName("SetupConfig");
  if (!setupSheet) {
    setupSheet = ss.insertSheet("SetupConfig");
    setupSheet.appendRow(["ชื่อรายการ", "หมวดหมู่", "จำนวนเงิน"]);
  }
  
  var data = setupSheet.getDataRange().getValues();
  var exists = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toLowerCase() === name.trim().toLowerCase()) {
      exists = true;
      break;
    }
  }
  if (!exists) {
    setupSheet.appendRow([name.trim(), category || "ทั่วไป", Number(defaultAmount) || 0]);
  }
}

function deleteExpense(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Expenses");
  if (!sheet) return "ไม่พบข้อมูล";
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return "ลบรายการสำเร็จ!";
    }
  }
  throw new Error("ไม่พบรายการที่ต้องการลบ");
}

// ================= 3. ระบบจัดการรายรับ (Incomes) =================
function getIncomes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Incomes");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var rows = data.slice(1);
  var result = [];
  
  rows.forEach(function(row) {
    result.push({
      id: row[0],
      date: row[1] ? Utilities.formatDate(new Date(row[1]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
      source: row[2],
      amount: row[3],
      category: row[4] || "รายรับทั่วไป"
    });
  });
  
  return result;
}

function saveIncome(item) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Incomes");
  
  if (!sheet) {
    sheet = ss.insertSheet("Incomes");
    sheet.appendRow(["ID", "Date", "Source", "Amount", "Category"]);
  }
  
  var data = sheet.getDataRange().getValues();
  saveNewIncomeSourceToConfig(item.source);

  if (item.id && item.id !== "") {
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(item.id)) {
        sheet.getRange(i + 1, 2, 1, 4).setValues([[item.date, item.source, item.amount, item.category || "รายรับทั่วไป"]]);
        found = true;
        break;
      }
    }
    if (!found) throw new Error("ไม่พบรายการรายรับที่ต้องการแก้ไข");
    return "อัปเดตข้อมูลรายรับสำเร็จ!";
  } else {
    var newId = Utilities.getUuid();
    sheet.appendRow([newId, item.date, item.source, item.amount, item.category || "รายรับทั่วไป"]);
    return "บันทึกรายรับสำเร็จ!";
  }
}

function saveNewIncomeSourceToConfig(sourceName) {
  if (!sourceName) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var setupIncSheet = ss.getSheetByName("SetupIncomeConfig");
  if (!setupIncSheet) {
    setupIncSheet = ss.insertSheet("SetupIncomeConfig");
    setupIncSheet.appendRow(["ชื่อรายการรายรับ"]);
  }
  
  var data = setupIncSheet.getDataRange().getValues();
  var exists = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toLowerCase() === sourceName.trim().toLowerCase()) {
      exists = true;
      break;
    }
  }
  if (!exists) {
    setupIncSheet.appendRow([sourceName.trim()]);
  }
}

function deleteIncome(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Incomes");
  if (!sheet) return "ไม่พบข้อมูล";
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return "ลบรายการรายรับสำเร็จ!";
    }
  }
  throw new Error("ไม่พบรายการรายรับที่ต้องการลบ");
}

function getCategoryFromName(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var setupSheet = ss.getSheetByName("SetupConfig");
  if (!setupSheet) return "ทั่วไป";
  
  var data = setupSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      return data[i][1] || "ทั่วไป";
    }
  }
  return "ทั่วไป";
}

// ================= 4. ระบบส่งอีเมลแจ้งเตือนอัตโนมัติ =================
function sendPendingExpensesEmail(customTitle) {
  var email = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
  if (!email) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Expenses");
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  
  var pendingItems = [];
  var totalPending = 0;
  
  for (var i = 1; i < data.length; i++) {
    var status = data[i][4];
    if (status !== "จ่ายแล้ว") {
      pendingItems.push({
        date: data[i][1] ? Utilities.formatDate(new Date(data[i][1]), Session.getScriptTimeZone(), "yyyy-MM-dd") : "",
        name: data[i][2],
        amount: Number(data[i][3]) || 0
      });
      totalPending += Number(data[i][3]) || 0;
    }
  }
  
  if (pendingItems.length === 0) return;
  
  var subject = customTitle || "⚠️ แจ้งเตือน: รายการค่าใช้จ่ายที่ยังไม่ได้ชำระ (รอเคลียร์)";
  var htmlBody = "<div style='font-family:sans-serif; padding:15px;'>";
  htmlBody += "<h2 style='color:#d9534f;'>รายงานรายการค่าใช้จ่ายค้างชำระ</h2>";
  htmlBody += "<p>นี่คือรายการค่าใช้จ่ายที่ยังมีสถานะ <b>'รอจ่าย'</b> ในระบบ:</p>";
  htmlBody += "<table style='border-collapse:collapse; width:100%; max-width:600px;'>";
  htmlBody += "<tr style='background:#f2f2f2;'><th style='border:1px solid #ddd; padding:8px; text-align:left;'>วันที่</th><th style='border:1px solid #ddd; padding:8px; text-align:left;'>รายการ</th><th style='border:1px solid #ddd; padding:8px; text-align:right;'>จำนวนเงิน</th></tr>";
  
  pendingItems.forEach(function(item) {
    htmlBody += "<tr>";
    htmlBody += "<td style='border:1px solid #ddd; padding:8px;'>" + item.date + "</td>";
    htmlBody += "<td style='border:1px solid #ddd; padding:8px;'>" + item.name + "</td>";
    htmlBody += "<td style='border:1px solid #ddd; padding:8px; text-align:right;'>" + item.amount.toLocaleString() + " บาท</td>";
    htmlBody += "</tr>";
  });
  
  htmlBody += "</table>";
  htmlBody += "<h3 style='color:#333;'>ยอดค้างจ่ายรวมทั้งหมด: <span style='color:#d9534f;'>" + totalPending.toLocaleString() + " บาท</span></h3>";
  htmlBody += "</div>";
  
  MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody });
}

function createMonthlyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var funcName = triggers[i].getHandlerFunction();
    if (funcName === "autoClearOrResetMonthly" || funcName === "triggerMidMonthEmail" || funcName === "triggerEndMonthEmail") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  ScriptApp.newTrigger("autoClearOrResetMonthly").timeBased().onMonthDay(10).atHour(1).create();
  ScriptApp.newTrigger("triggerMidMonthEmail").timeBased().onMonthDay(15).atHour(8).create();
  ScriptApp.newTrigger("triggerEndMonthEmail").timeBased().onMonthDay(28).atHour(8).create();
    
  return "ตั้งเวลาอัตโนมัติสำเร็จแล้ว!";
}

function triggerMidMonthEmail() {
  sendPendingExpensesEmail("⚠️ แจ้งเตือนกลางเดือน: รายการค่าใช้จ่ายที่ยังไม่ได้ชำระ (วันที่ 15)");
}

function triggerEndMonthEmail() {
  var today = new Date();
  var tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
  if (tomorrow.getDate() === 1) {
    sendPendingExpensesEmail("📊 สรุปยอดสิ้นเดือน: รายการค่าใช้จ่ายที่ยังค้างชำระ");
  }
}

function autoClearOrResetMonthly() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Expenses");
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][4] === "จ่ายแล้ว") {
      sheet.deleteRow(i + 1);
    }
  }
}

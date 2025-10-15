// ============================================
// API.gs - REST API Entry Point
// ============================================

const SPREADSHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';
const FONNTE_API_URL = 'https://api.fonnte.com/send';
const MASTER_FONNTE_TOKEN = 'YOUR_FONNTE_TOKEN_HERE'; // Ganti dengan token Fonnte Anda

// ============================================
// Main API Handler (GET & POST)
// ============================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    // Parse parameters - support both URL params and POST data
    const params = e.parameter || {};
    let data = { ...params };
    
    // Try parse POST data if exists
    if (e.postData && e.postData.contents) {
      try {
        const postData = JSON.parse(e.postData.contents);
        data = { ...data, ...postData };
      } catch (parseError) {
        // If JSON parse fails, use params only
        Logger.log('JSON parse failed, using params only');
      }
    }
    
    const action = data.action || params.action;
    
    if (!action) {
      return createResponse({ success: false, message: 'Action parameter required' });
    }
    
    // Route to appropriate handler
    let result;
    
    switch(action) {
      // Auth endpoints
      case 'register':
        result = registerUser(data.nama, data.no_wa);
        break;
      case 'login':
        result = loginUser(data.no_wa, data.password);
        break;
      case 'saveToken':
        result = saveFonnteToken(data.userID, data.token);
        break;
        
      // Customer endpoints
      case 'uploadCustomers':
        result = uploadCustomers(data.userID, data.csvData);
        break;
      case 'getCustomerCount':
        result = getCustomerCount(data.userID);
        break;
      case 'getCustomerTags':
        result = getCustomerTags(data.userID);
        break;
      case 'clearCustomers':
        result = clearAllCustomers(data.userID);
        break;
        
      // Template endpoints
      case 'saveTemplate':
        result = saveMessageTemplate(data.userID, data.namaTemplate, data.isiPesan, data.templateID);
        break;
      case 'getTemplates':
        result = getTemplates(data.userID);
        break;
      case 'getTemplate':
        result = getTemplateByID(data.templateID, data.userID);
        break;
      case 'deleteTemplate':
        result = deleteTemplate(data.templateID, data.userID);
        break;
      case 'previewTemplate':
        result = previewMessage(data.userID, data.templateID);
        break;
        
      // Schedule endpoints
      case 'scheduleMessage':
        result = scheduleMessage(data.userID, data.templateID, data.targetWaktu, data.tag);
        break;
      case 'getSchedules':
        result = getSchedules(data.userID);
        break;
      case 'cancelSchedule':
        result = cancelSchedule(data.jadwalID, data.userID);
        break;
        
      default:
        result = { success: false, message: 'Unknown action: ' + action };
    }
    
    return createResponse(result);
    
  } catch (error) {
    logError('handleRequest', error);
    return createResponse({ 
      success: false, 
      message: 'Server error: ' + error.toString() 
    });
  }
}

function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// Helper Functions
// ============================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  } else {
    // Schema migration for existing sheets
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    if (sheetName === 'Pelanggan' && headers.indexOf('Tag') === -1) {
      sheet.insertColumnAfter(4); // After No_WhatsApp
      sheet.getRange(1, 5).setValue('Tag').setFontWeight('bold');
    }
    
    if (sheetName === 'JadwalKirim') {
      if (headers.indexOf('Tag') === -1) {
        sheet.insertColumnAfter(3); // After TemplateID
        sheet.getRange(1, 4).setValue('Tag').setFontWeight('bold');
      }
      if (headers.indexOf('Terkirim') === -1) {
        sheet.insertColumnAfter(7);
        sheet.getRange(1, 8).setValue('Terkirim').setFontWeight('bold');
      }
      if (headers.indexOf('Total_Penerima') === -1) {
        sheet.insertColumnAfter(8);
        sheet.getRange(1, 9).setValue('Total_Penerima').setFontWeight('bold');
      }
    }
  }
  
  return sheet;
}

function initializeSheet(sheet, sheetName) {
  let headers = [];
  
  switch(sheetName) {
    case 'Pengguna':
      headers = ['UserID', 'Nama', 'No_WhatsApp', 'Fonnte_Token', 'Password', 'Tgl_Daftar'];
      break;
    case 'Pelanggan':
      headers = ['PelangganID', 'UserID', 'Nama', 'No_WhatsApp', 'Tag', 'Parameter_1', 'Parameter_2', 'Parameter_3', 'Parameter_4', 'Parameter_5', 'Parameter_6', 'Parameter_7', 'Parameter_8', 'Parameter_9', 'Parameter_10'];
      break;
    case 'TemplatePesan':
      headers = ['TemplateID', 'UserID', 'Nama_Template', 'Isi_Pesan'];
      break;
    case 'JadwalKirim':
      headers = ['JadwalID', 'UserID', 'TemplateID', 'Tag', 'Target_Waktu', 'Status', 'Log_Info', 'Terkirim', 'Total_Penerima'];
      break;
  }
  
  if (headers.length > 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}

// ============================================
// DebugCustomer.gs - Debug Customer Data
// ============================================

function checkCustomerData(userID) {
  try {
    const sheet = getSheet('Pelanggan');
    const data = sheet.getDataRange().getValues();
    
    Logger.log('=== CHECK CUSTOMER DATA ===');
    Logger.log('UserID: ' + userID);
    Logger.log('Total rows: ' + (data.length - 1));
    Logger.log('');
    
    let count = 0;
    for (let i = 1; i < data.length && count < 5; i++) {
      const sheetUserID = String(data[i][1]).trim();
      if (sheetUserID === userID) {
        count++;
        Logger.log('Customer ' + count + ':');
        Logger.log('  PelangganID: ' + data[i][0]);
        Logger.log('  UserID: ' + data[i][1]);
        Logger.log('  Nama: ' + data[i][2] + ' (type: ' + typeof data[i][2] + ')');
        Logger.log('  No_WhatsApp: ' + data[i][3] + ' (type: ' + typeof data[i][3] + ')');
        
        for (let j = 4; j < 14; j++) {
          if (data[i][j]) {
            Logger.log('  Parameter_' + (j-3) + ': ' + data[i][j] + ' (type: ' + typeof data[i][j] + ')');
          }
        }
        Logger.log('');
      }
    }
    
    if (count === 0) {
      Logger.log('No customers found for UserID: ' + userID);
    }
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

function testPreviewWithDebug(userID, templateID) {
  try {
    Logger.log('=== TEST PREVIEW ===');
    
    const templateResult = getTemplateByID(templateID, userID);
    Logger.log('Template found: ' + templateResult.success);
    if (templateResult.success) {
      Logger.log('Template content: ' + templateResult.data.isi_pesan);
    }
    Logger.log('');
    
    const customersResult = getCustomers(userID, 1);
    Logger.log('Customer found: ' + customersResult.success);
    Logger.log('Customer count: ' + customersResult.count);
    
    if (customersResult.success && customersResult.data.length > 0) {
      const customer = customersResult.data[0];
      Logger.log('Customer data:');
      Logger.log(JSON.stringify(customer, null, 2));
      Logger.log('');
      
      if (templateResult.success) {
        const message = replacePlaceholders(templateResult.data.isi_pesan, customer);
        Logger.log('Final message:');
        Logger.log(message);
        Logger.log('');
        Logger.log('Message length: ' + message.length + ' chars');
      }
    }
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

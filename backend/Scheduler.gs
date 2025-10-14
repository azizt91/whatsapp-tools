// ============================================
// Scheduler.gs - Automated Job Executor
// ============================================

function runScheduledJobs() {
  try {
    const sheet = getSheet('JadwalKirim');
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    
    Logger.log(`[Scheduler] Running at ${formatDateTime(now)}`);
    
    for (let i = 1; i < data.length; i++) {
      const jadwalID = data[i][0];
      const userID = data[i][1];
      const templateID = data[i][2];
      const targetWaktu = new Date(data[i][3]);
      const status = data[i][4];
      
      if (status === 'Menunggu' && targetWaktu <= now) {
        Logger.log(`[Scheduler] Processing jadwal ${jadwalID}`);
        
        sheet.getRange(i + 1, 5).setValue('Diproses');
        SpreadsheetApp.flush();
        
        const result = processScheduledJob(userID, templateID, jadwalID);
        
        sheet.getRange(i + 1, 5).setValue(result.status);
        sheet.getRange(i + 1, 6).setValue(result.log);
        SpreadsheetApp.flush();
        
        Logger.log(`[Scheduler] Jadwal ${jadwalID} completed: ${result.log}`);
      }
    }
    
    Logger.log('[Scheduler] Completed');
    
  } catch (error) {
    logError('runScheduledJobs', error);
  }
}

function processScheduledJob(userID, templateID, jadwalID) {
  try {
    const userResult = getUserByID(userID);
    if (!userResult.success) {
      return {
        status: 'Gagal',
        log: 'User tidak ditemukan'
      };
    }
    
    const fonnteToken = userResult.data.fonnte_token;
    if (!fonnteToken) {
      return {
        status: 'Gagal',
        log: 'Token Fonnte belum diatur'
      };
    }
    
    const templateResult = getTemplateByID(templateID, userID);
    if (!templateResult.success) {
      return {
        status: 'Gagal',
        log: 'Template tidak ditemukan'
      };
    }
    
    const customersResult = getCustomers(userID, 10000);
    if (!customersResult.success || customersResult.data.length === 0) {
      return {
        status: 'Gagal',
        log: 'Tidak ada pelanggan'
      };
    }
    
    const template = templateResult.data.isi_pesan;
    const customers = customersResult.data;
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    for (let j = 0; j < customers.length; j++) {
      try {
        const customer = customers[j];
        const message = replacePlaceholders(template, customer);
        
        const sendResult = sendWhatsAppMessage(fonnteToken, customer.no_whatsapp, message);
        
        if (sendResult.success) {
          successCount++;
        } else {
          failCount++;
          errors.push(`${customer.nama}: ${sendResult.message}`);
        }
        
        if (j < customers.length - 1) {
          const delay = Math.random() * 30000 + 15000;
          Utilities.sleep(delay);
        }
        
        if (j % 10 === 0) {
          Logger.log(`[Scheduler] Progress ${j + 1}/${customers.length}`);
        }
        
      } catch (customerError) {
        failCount++;
        errors.push(`${customers[j].nama}: ${customerError.toString()}`);
        logError(`processScheduledJob[Customer ${j}]`, customerError);
      }
    }
    
    const logMessage = `Selesai pada ${formatDateTime(new Date())}. ` +
                      `Berhasil: ${successCount}/${customers.length}, Gagal: ${failCount}.` +
                      (errors.length > 0 ? ` Error pertama: ${errors[0]}` : '');
    
    return {
      status: failCount === 0 ? 'Selesai' : 'Selesai (dengan error)',
      log: logMessage
    };
    
  } catch (error) {
    logError('processScheduledJob', error);
    return {
      status: 'Gagal',
      log: 'Error: ' + error.toString()
    };
  }
}

function setupTrigger() {
  try {
    deleteTriggers('runScheduledJobs');
    
    ScriptApp.newTrigger('runScheduledJobs')
      .timeBased()
      .everyMinutes(5)
      .create();
    
    return {
      success: true,
      message: 'Trigger berhasil dibuat! Scheduler akan berjalan setiap 5 menit.'
    };
    
  } catch (error) {
    logError('setupTrigger', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

function deleteTriggers(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

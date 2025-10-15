// ============================================
// Scheduler.gs - Automated Job Executor
// ============================================

function runScheduledJobs() {
  try {
    const sheet = getSheet('JadwalKirim');
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    
    Logger.log(`[Scheduler] Running at ${formatDateTime(now)}`);
    
    // Headers: JadwalID, UserID, TemplateID, Tag, Target_Waktu, Status, Log_Info
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const jadwalID = row[0];
      const userID = row[1];
      const templateID = row[2];
      const tag = row[3] || null; // Get the tag
      const targetWaktu = new Date(row[4]);
      const status = row[5];
      
      if (status === 'Menunggu' && targetWaktu <= now) {
        Logger.log(`[Scheduler] Processing jadwal ${jadwalID} for tag: ${tag}`);
        
        sheet.getRange(i + 1, 6).setValue('Diproses'); // Status column
        SpreadsheetApp.flush();
        
        const result = processScheduledJob(userID, templateID, jadwalID, tag);
        
        sheet.getRange(i + 1, 6).setValue(result.status); // Status column
        sheet.getRange(i + 1, 7).setValue(result.log);    // Log_Info column
        SpreadsheetApp.flush();
        
        Logger.log(`[Scheduler] Jadwal ${jadwalID} completed: ${result.log}`);
      }
    }
    
    Logger.log('[Scheduler] Completed');
    
  } catch (error) {
    logError('runScheduledJobs', error);
  }
}

function processScheduledJob(userID, templateID, jadwalID, tag) {
  try {
    const userResult = getUserByID(userID);
    if (!userResult.success) {
      return { status: 'Gagal', log: 'User tidak ditemukan' };
    }
    
    const fonnteToken = userResult.data.fonnte_token;
    if (!fonnteToken) {
      return { status: 'Gagal', log: 'Token Fonnte belum diatur' };
    }
    
    const templateResult = getTemplateByID(templateID, userID);
    if (!templateResult.success) {
      return { status: 'Gagal', log: 'Template tidak ditemukan' };
    }
    
    const customersResult = getCustomers(userID, tag, 10000); // Use the tag here
    if (!customersResult.success || customersResult.data.length === 0) {
      const logMsg = tag ? `Tidak ada pelanggan dengan tag "${tag}"` : 'Tidak ada pelanggan';
      return { status: 'Gagal', log: logMsg };
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
          const delay = Math.random() * 30000 + 15000; // 15-45 seconds
          Utilities.sleep(delay);
        }
        
        if (j > 0 && j % 10 === 0) {
          Logger.log(`[Scheduler] Progress ${j}/${customers.length} for job ${jadwalID}`);
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
    return { status: 'Gagal', log: 'Error: ' + error.toString() };
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

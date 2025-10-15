// ============================================
// Scheduler.gs - Automated Job Executor
// ============================================

const BATCH_SIZE = 10; // Process 10 messages per run to stay within limits

function runScheduledJobs() {
  try {
    const sheet = getSheet('JadwalKirim');
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    
    Logger.log(`[Scheduler] Running at ${formatDateTime(now)}`);
    
    // Headers: JadwalID, UserID, TemplateID, Tag, Target_Waktu, Status, Log_Info, Terkirim, Total_Penerima
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[5];
      const targetWaktu = new Date(row[4]);

      // Process jobs that are due and are either waiting or already in progress
      if ((status === 'Menunggu' && targetWaktu <= now) || status === 'Diproses') {
        const jadwalID = row[0];
        const userID = row[1];
        const templateID = row[2];
        const tag = row[3] || null;
        const sentCount = parseInt(row[7] || 0);
        const totalRecipients = parseInt(row[8] || 0);

        Logger.log(`[Scheduler] Processing job ${jadwalID}. Status: ${status}, Progress: ${sentCount}/${totalRecipients}`);
        
        // Set status to 'Diproses' immediately
        if (status === 'Menunggu') {
          sheet.getRange(i + 1, 6).setValue('Diproses');
          SpreadsheetApp.flush();
        }
        
        const result = processScheduledJob(userID, templateID, jadwalID, tag, sentCount, totalRecipients);
        
        // Update sheet with new progress
        sheet.getRange(i + 1, 6).setValue(result.newStatus);
        sheet.getRange(i + 1, 7).setValue(result.logMessage);
        sheet.getRange(i + 1, 8).setValue(result.newSentCount);
        SpreadsheetApp.flush();
        
        Logger.log(`[Scheduler] Job ${jadwalID} updated. New status: ${result.newStatus}, Progress: ${result.newSentCount}/${totalRecipients}`);
      }
    }
    
    Logger.log('[Scheduler] Completed');
    
  } catch (error) {
    logError('runScheduledJobs', error);
  }
}

function processScheduledJob(userID, templateID, jadwalID, tag, sentCount, totalRecipients) {
  try {
    // Initial checks
    const userResult = getUserByID(userID);
    if (!userResult.success) return { newStatus: 'Gagal', logMessage: 'User tidak ditemukan', newSentCount: sentCount };

    const fonnteToken = userResult.data.fonnte_token;
    if (!fonnteToken) return { newStatus: 'Gagal', logMessage: 'Token Fonnte belum diatur', newSentCount: sentCount };

    const templateResult = getTemplateByID(templateID, userID);
    if (!templateResult.success) return { newStatus: 'Gagal', logMessage: 'Template tidak ditemukan', newSentCount: sentCount };

    // Get all customers for this job
    const customersResult = getCustomers(userID, tag, 10000);
    if (!customersResult.success || customersResult.data.length === 0) {
      return { newStatus: 'Gagal', logMessage: 'Tidak ada pelanggan untuk jadwal ini', newSentCount: 0 };
    }

    const allCustomers = customersResult.data;
    const template = templateResult.data.isi_pesan;
    
    // Determine the slice of customers to process in this run
    const customersToProcess = allCustomers.slice(sentCount, sentCount + BATCH_SIZE);
    
    if (customersToProcess.length === 0 && sentCount >= totalRecipients) {
        return { newStatus: 'Selesai', logMessage: `Pengiriman selesai. Total: ${totalRecipients}.`, newSentCount: sentCount };
    }

    let successThisRun = 0;
    let errors = [];

    for (let j = 0; j < customersToProcess.length; j++) {
      const customer = customersToProcess[j];
      try {
        const message = replacePlaceholders(template, customer);
        const sendResult = sendWhatsAppMessage(fonnteToken, customer.no_whatsapp, message);
        
        if (sendResult.success) {
          successThisRun++;
        } else {
          errors.push(`${customer.nama}: ${sendResult.message}`);
        }
        
        if (j < customersToProcess.length - 1) {
          const delay = Math.random() * 20000 + 10000; // 10-30 seconds delay
          Utilities.sleep(delay);
        }
      } catch (customerError) {
        errors.push(`${customer.nama}: ${customerError.toString()}`);
        logError(`processScheduledJob[Customer: ${customer.nama}]`, customerError);
      }
    }

    const newSentCount = sentCount + successThisRun;
    const isJobComplete = newSentCount >= totalRecipients;

    let newStatus = isJobComplete ? 'Selesai' : 'Diproses';
    if (isJobComplete && errors.length > 0) {
      newStatus = 'Selesai (dengan error)';
    }

    let logMessage = `Terkirim: ${newSentCount}/${totalRecipients}. `;
    if (errors.length > 0) {
      logMessage += `Gagal: ${errors.length} (Contoh: ${errors[0]})`;
    } else {
      logMessage += `Semua berhasil pada batch ini.`
    }

    return { newStatus, logMessage, newSentCount };

  } catch (error) {
    logError('processScheduledJob', error);
    return { newStatus: 'Gagal', logMessage: `Error sistem: ${error.toString()}`, newSentCount: sentCount };
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

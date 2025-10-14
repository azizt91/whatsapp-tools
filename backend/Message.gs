// ============================================
// Message.gs - Message Template & Scheduling
// ============================================

function saveMessageTemplate(userID, namaTemplate, isiPesan, templateID = null) {
  try {
    const sheet = getSheet('TemplatePesan');
    const data = sheet.getDataRange().getValues();
    
    if (!templateID) {
      templateID = generateID('TMPL');
      sheet.appendRow([templateID, userID, namaTemplate, isiPesan]);
      
      return {
        success: true,
        message: 'Template berhasil disimpan!',
        data: { templateID }
      };
    } else {
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === templateID && data[i][1] === userID) {
          sheet.getRange(i + 1, 3).setValue(namaTemplate);
          sheet.getRange(i + 1, 4).setValue(isiPesan);
          
          return {
            success: true,
            message: 'Template berhasil diupdate!',
            data: { templateID }
          };
        }
      }
      
      return {
        success: false,
        message: 'Template tidak ditemukan!'
      };
    }
    
  } catch (error) {
    logError('saveMessageTemplate', error);
    return {
      success: false,
      message: 'Terjadi kesalahan: ' + error.toString()
    };
  }
}

function getTemplates(userID) {
  try {
    const sheet = getSheet('TemplatePesan');
    const data = sheet.getDataRange().getValues();
    
    const templates = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userID) {
        templates.push({
          templateID: data[i][0],
          nama_template: data[i][2],
          isi_pesan: data[i][3]
        });
      }
    }
    
    return {
      success: true,
      data: templates
    };
    
  } catch (error) {
    logError('getTemplates', error);
    return {
      success: false,
      message: error.toString(),
      data: []
    };
  }
}

function getTemplateByID(templateID, userID) {
  try {
    const sheet = getSheet('TemplatePesan');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === templateID && data[i][1] === userID) {
        return {
          success: true,
          data: {
            templateID: data[i][0],
            userID: data[i][1],
            nama_template: data[i][2],
            isi_pesan: data[i][3]
          }
        };
      }
    }
    
    return {
      success: false,
      message: 'Template tidak ditemukan!'
    };
    
  } catch (error) {
    logError('getTemplateByID', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

function deleteTemplate(templateID, userID) {
  try {
    const sheet = getSheet('TemplatePesan');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === templateID && data[i][1] === userID) {
        sheet.deleteRow(i + 1);
        return {
          success: true,
          message: 'Template berhasil dihapus!'
        };
      }
    }
    
    return {
      success: false,
      message: 'Template tidak ditemukan!'
    };
    
  } catch (error) {
    logError('deleteTemplate', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

function scheduleMessage(userID, templateID, targetWaktu) {
  try {
    const sheet = getSheet('JadwalKirim');
    
    const templateResult = getTemplateByID(templateID, userID);
    if (!templateResult.success) {
      return {
        success: false,
        message: 'Template tidak ditemukan!'
      };
    }
    
    const customerResult = getCustomerCount(userID);
    if (customerResult.count === 0) {
      return {
        success: false,
        message: 'Anda belum memiliki pelanggan!'
      };
    }
    
    const jadwalID = generateID('JDWL');
    const targetDate = new Date(targetWaktu);
    
    sheet.appendRow([
      jadwalID,
      userID,
      templateID,
      formatDateTime(targetDate),
      'Menunggu',
      ''
    ]);
    
    return {
      success: true,
      message: `Jadwal berhasil dibuat! Akan dikirim ke ${customerResult.count} pelanggan.`,
      data: {
        jadwalID,
        customerCount: customerResult.count
      }
    };
    
  } catch (error) {
    logError('scheduleMessage', error);
    return {
      success: false,
      message: 'Terjadi kesalahan: ' + error.toString()
    };
  }
}

function getSchedules(userID) {
  try {
    const sheet = getSheet('JadwalKirim');
    const data = sheet.getDataRange().getValues();
    
    const templateSheet = getSheet('TemplatePesan');
    const templateData = templateSheet.getDataRange().getValues();
    
    const schedules = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userID) {
        let templateName = 'Template Dihapus';
        
        for (let j = 1; j < templateData.length; j++) {
          if (templateData[j][0] === data[i][2]) {
            templateName = templateData[j][2];
            break;
          }
        }
        
        schedules.push({
          jadwalID: data[i][0],
          templateID: data[i][2],
          templateName: templateName,
          target_waktu: data[i][3],
          status: data[i][4],
          log_info: data[i][5]
        });
      }
    }
    
    schedules.sort((a, b) => new Date(b.target_waktu) - new Date(a.target_waktu));
    
    return {
      success: true,
      data: schedules
    };
    
  } catch (error) {
    logError('getSchedules', error);
    return {
      success: false,
      message: error.toString(),
      data: []
    };
  }
}

function cancelSchedule(jadwalID, userID) {
  try {
    const sheet = getSheet('JadwalKirim');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === jadwalID && data[i][1] === userID) {
        const status = data[i][4];
        
        if (status === 'Diproses' || status === 'Selesai') {
          return {
            success: false,
            message: 'Jadwal tidak dapat dibatalkan (sudah diproses/selesai)!'
          };
        }
        
        sheet.getRange(i + 1, 5).setValue('Dibatalkan');
        sheet.getRange(i + 1, 6).setValue('Dibatalkan oleh user pada ' + formatDateTime(new Date()));
        
        return {
          success: true,
          message: 'Jadwal berhasil dibatalkan!'
        };
      }
    }
    
    return {
      success: false,
      message: 'Jadwal tidak ditemukan!'
    };
    
  } catch (error) {
    logError('cancelSchedule', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

function previewMessage(userID, templateID) {
  try {
    const templateResult = getTemplateByID(templateID, userID);
    if (!templateResult.success) {
      return {
        success: false,
        message: 'Template tidak ditemukan!'
      };
    }
    
    const customersResult = getCustomers(userID, 1);
    if (!customersResult.success || customersResult.data.length === 0) {
      return {
        success: false,
        message: 'Belum ada data pelanggan untuk preview!'
      };
    }
    
    const sampleCustomer = customersResult.data[0];
    const message = replacePlaceholders(templateResult.data.isi_pesan, sampleCustomer);
    
    return {
      success: true,
      data: {
        original: templateResult.data.isi_pesan,
        preview: message,
        sampleData: sampleCustomer
      }
    };
    
  } catch (error) {
    logError('previewMessage', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

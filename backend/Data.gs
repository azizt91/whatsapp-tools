// ============================================
// Data.gs - Data Management (Customers)
// ============================================

function uploadCustomers(userID, csvData) {
  try {
    const sheet = getSheet('Pelanggan');
    
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      return {
        success: false,
        message: 'File CSV kosong atau tidak valid!'
      };
    }
    
    const headers = lines[0].split(',').map(h => h.trim());
    
    const namaIndex = headers.findIndex(h => h.toLowerCase() === 'nama');
    const waIndex = headers.findIndex(h => h.toLowerCase() === 'no_whatsapp' || h.toLowerCase() === 'whatsapp');
    
    if (namaIndex === -1 || waIndex === -1) {
      return {
        success: false,
        message: 'Header CSV harus memiliki kolom "Nama" dan "No_WhatsApp"!'
      };
    }
    
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < 2) continue;
        
        const pelangganID = generateID('PLG');
        const nama = values[namaIndex] || '';
        const no_wa = validatePhoneNumber(values[waIndex] || '');
        
        if (!nama || !no_wa) {
          failCount++;
          errors.push(`Baris ${i + 1}: Data tidak lengkap`);
          continue;
        }
        
        const rowData = [pelangganID, userID, nama, no_wa];
        
        for (let j = 0; j < 10; j++) {
          const paramIndex = j + 2;
          if (paramIndex < values.length && paramIndex !== namaIndex && paramIndex !== waIndex) {
            rowData.push(values[paramIndex]);
          } else {
            rowData.push('');
          }
        }
        
        sheet.appendRow(rowData);
        successCount++;
        
      } catch (rowError) {
        failCount++;
        errors.push(`Baris ${i + 1}: ${rowError.toString()}`);
      }
    }
    
    return {
      success: true,
      message: `Berhasil upload ${successCount} pelanggan` + (failCount > 0 ? `, ${failCount} gagal` : ''),
      data: {
        successCount,
        failCount,
        errors: errors.slice(0, 5)
      }
    };
    
  } catch (error) {
    logError('uploadCustomers', error);
    return {
      success: false,
      message: 'Terjadi kesalahan: ' + error.toString()
    };
  }
}

function getCustomers(userID, limit = 100) {
  try {
    const sheet = getSheet('Pelanggan');
    const data = sheet.getDataRange().getValues();
    
    const customers = [];
    
    for (let i = 1; i < data.length && customers.length < limit; i++) {
      // Convert userID to string for comparison
      const sheetUserID = String(data[i][1]).trim();
      if (sheetUserID === userID) {
        const customer = {
          pelangganID: data[i][0],
          nama: String(data[i][2] || ''),
          no_whatsapp: String(data[i][3] || '')
        };
        
        // Add parameters (convert to string to avoid date issues)
        for (let j = 4; j < 14; j++) {
          if (data[i][j]) {
            customer[`parameter_${j - 3}`] = String(data[i][j]);
          }
        }
        
        customers.push(customer);
      }
    }
    
    return {
      success: true,
      data: customers,
      count: customers.length
    };
    
  } catch (error) {
    logError('getCustomers', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

function getCustomerCount(userID) {
  try {
    const sheet = getSheet('Pelanggan');
    const data = sheet.getDataRange().getValues();
    
    let count = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userID) {
        count++;
      }
    }
    
    return {
      success: true,
      count: count
    };
    
  } catch (error) {
    logError('getCustomerCount', error);
    return {
      success: false,
      count: 0
    };
  }
}

function clearAllCustomers(userID) {
  try {
    const sheet = getSheet('Pelanggan');
    const data = sheet.getDataRange().getValues();
    
    let deletedCount = 0;
    
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === userID) {
        sheet.deleteRow(i + 1);
        deletedCount++;
      }
    }
    
    return {
      success: true,
      message: `${deletedCount} pelanggan berhasil dihapus!`,
      count: deletedCount
    };
    
  } catch (error) {
    logError('clearAllCustomers', error);
    return {
      success: false,
      message: error.toString()
    };
  }
}

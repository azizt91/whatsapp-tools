// ============================================
// Data.gs - Data Management (Customers)
// ============================================

function uploadCustomers(userID, csvData) {
  try {
    const sheet = getSheet('Pelanggan');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      return { success: false, message: 'File CSV kosong atau tidak valid!' };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const namaIndex = headers.indexOf('nama');
    const waIndex = headers.indexOf('no_whatsapp');
    const tagIndex = headers.indexOf('tag');
    
    if (namaIndex === -1 || waIndex === -1) {
      return { success: false, message: 'Header CSV harus memiliki kolom "Nama" dan "No_WhatsApp"!' };
    }
    
    // Find parameter columns (any column that is not a special one)
    const specialIndices = [namaIndex, waIndex, tagIndex].filter(i => i > -1);
    const paramIndices = headers.map((h, i) => i).filter(i => specialIndices.indexOf(i) === -1);

    const rowsToInsert = [];
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;

        const nama = values[namaIndex] || '';
        const no_wa = validatePhoneNumber(values[waIndex] || '');
        
        if (!nama || !no_wa) {
          failCount++;
          errors.push(`Baris ${i + 1}: Data Nama atau No_WhatsApp kosong.`);
          continue;
        }

        const pelangganID = generateID('PLG');
        const tag = tagIndex > -1 ? values[tagIndex] : '';
        
        const newRow = [pelangganID, userID, nama, no_wa, tag];
        
        // Add parameters
        for (let j = 0; j < 10; j++) {
          const paramCsvIndex = paramIndices[j];
          if (paramCsvIndex !== undefined && values[paramCsvIndex]) {
            newRow.push(values[paramCsvIndex]);
          } else {
            newRow.push('');
          }
        }
        
        rowsToInsert.push(newRow);
        successCount++;
      } catch (rowError) {
        failCount++;
        errors.push(`Baris ${i + 1}: ${rowError.toString()}`);
      }
    }

    if (rowsToInsert.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rowsToInsert.length, rowsToInsert[0].length).setValues(rowsToInsert);
    }
    
    return {
      success: true,
      message: `Berhasil upload ${successCount} pelanggan` + (failCount > 0 ? `, ${failCount} gagal` : ''),
      data: { successCount, failCount, errors: errors.slice(0, 5) }
    };
    
  } catch (error) {
    logError('uploadCustomers', error);
    return { success: false, message: 'Terjadi kesalahan: ' + error.toString() };
  }
}

function getCustomers(userID, tag = null, limit = 500) {
  try {
    const sheet = getSheet('Pelanggan');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const customers = [];
    
    for (let i = 1; i < data.length; i++) {
      if (customers.length >= limit) break;

      const row = data[i];
      const sheetUserID = String(row[1]).trim();
      const customerTag = String(row[4] || '').trim();

      if (sheetUserID === userID) {
        if (tag && tag !== customerTag) {
          continue; // Skip if tag is specified and doesn't match
        }

        const customer = {
          pelangganID: row[0],
          nama: String(row[2] || ''),
          no_whatsapp: String(row[3] || ''),
          tag: customerTag
        };
        
        // Add parameters dynamically based on headers
        for (let j = 5; j < headers.length; j++) {
          if (row[j]) {
            const paramName = headers[j].toLowerCase(); // e.g., parameter_1
            customer[paramName] = String(row[j]);
          }
        }
        
        customers.push(customer);
      }
    }
    
    return { success: true, data: customers, count: customers.length };
  } catch (error) {
    logError('getCustomers', error);
    return { success: false, message: error.toString() };
  }
}

function getCustomerTags(userID) {
  try {
    const sheet = getSheet('Pelanggan');
    const data = sheet.getDataRange().getValues();
    const tags = new Set();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const sheetUserID = String(row[1]).trim();
      const customerTag = String(row[4] || '').trim();

      if (sheetUserID === userID && customerTag) {
        tags.add(customerTag);
      }
    }

    return { success: true, data: [...tags] };

  } catch (error) {
    logError('getCustomerTags', error);
    return { success: false, message: error.toString(), data: [] };
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

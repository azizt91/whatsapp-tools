// ============================================
// FixPhone.gs - Fix Wrong Phone Numbers
// ============================================

// Function untuk fix nomor WA yang salah format di spreadsheet
function fixWrongPhoneNumbers() {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    Logger.log('=== FIX PHONE NUMBERS ===');
    Logger.log('Total rows: ' + (data.length - 1));
    
    let fixedCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const currentPhone = data[i][2];
      Logger.log('\nRow ' + (i + 1) + ': ' + currentPhone);
      
      // Fix nomor yang salah (contoh: 681914... -> 6281914...)
      if (currentPhone && currentPhone.startsWith('6') && !currentPhone.startsWith('62')) {
        const fixedPhone = '62' + currentPhone.substring(1);
        
        Logger.log('  FIXING: ' + currentPhone + ' -> ' + fixedPhone);
        sheet.getRange(i + 1, 3).setValue(fixedPhone);
        fixedCount++;
      }
      // Fix nomor yang kurang digit
      else if (currentPhone && currentPhone.length < 12) {
        Logger.log('  WARNING: Nomor terlalu pendek, skip: ' + currentPhone);
      }
      // Nomor sudah benar
      else if (currentPhone && currentPhone.startsWith('62')) {
        Logger.log('  OK: ' + currentPhone);
      }
    }
    
    Logger.log('\n=== SUMMARY ===');
    Logger.log('Fixed: ' + fixedCount + ' phone numbers');
    Logger.log('Done!');
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

// Function untuk fix 1 nomor spesifik
function fixMyPhoneNumber() {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    // GANTI DENGAN NOMOR YANG SALAH DI SPREADSHEET ANDA
    const wrongPhone = '681914170701'; // ← GANTI INI
    const correctPhone = '6281914170701'; // ← GANTI INI
    
    Logger.log('=== FIX SPECIFIC PHONE ===');
    Logger.log('Looking for: ' + wrongPhone);
    Logger.log('Will change to: ' + correctPhone);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === wrongPhone) {
        Logger.log('Found at row ' + (i + 1));
        sheet.getRange(i + 1, 3).setValue(correctPhone);
        Logger.log('✅ Fixed!');
        return;
      }
    }
    
    Logger.log('❌ Phone number not found: ' + wrongPhone);
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

// Function untuk lihat semua nomor di spreadsheet
function listAllPhoneNumbers() {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    Logger.log('=== ALL PHONE NUMBERS ===');
    Logger.log('Total users: ' + (data.length - 1));
    
    for (let i = 1; i < data.length; i++) {
      const phone = data[i][2];
      const nama = data[i][1];
      const valid = phone.startsWith('62') && phone.length >= 12;
      
      Logger.log('\nRow ' + (i + 1) + ':');
      Logger.log('  Nama: ' + nama);
      Logger.log('  No WA: ' + phone);
      Logger.log('  Length: ' + phone.length);
      Logger.log('  Valid: ' + (valid ? '✅' : '❌'));
    }
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

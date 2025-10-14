// ============================================
// Debug.gs - Debugging Helper Functions
// ============================================

// Test function untuk cek data user di spreadsheet
function debugCheckUser(no_wa) {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    no_wa = validatePhoneNumber(no_wa);
    
    Logger.log('=== DEBUG: Check User ===');
    Logger.log('Searching for: ' + no_wa);
    Logger.log('Total rows: ' + (data.length - 1));
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === no_wa) {
        Logger.log('\n✅ User FOUND at row ' + (i + 1));
        Logger.log('UserID: ' + data[i][0]);
        Logger.log('Nama: ' + data[i][1]);
        Logger.log('No_WhatsApp: ' + data[i][2]);
        Logger.log('Fonnte_Token: ' + (data[i][3] ? 'SET' : 'EMPTY'));
        Logger.log('Password Hash: ' + data[i][4]);
        Logger.log('Tgl_Daftar: ' + data[i][5]);
        return;
      }
    }
    
    Logger.log('\n❌ User NOT FOUND');
    Logger.log('All phone numbers in sheet:');
    for (let i = 1; i < data.length; i++) {
      Logger.log(`  Row ${i + 1}: ${data[i][2]}`);
    }
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

// Test function untuk cek password hash
function debugTestPassword(plainPassword) {
  Logger.log('=== DEBUG: Password Hash ===');
  Logger.log('Plain password: ' + plainPassword);
  Logger.log('Hashed: ' + hashPassword(plainPassword));
  Logger.log('Hashed again: ' + hashPassword(plainPassword));
  Logger.log('Should be SAME if hashing is consistent');
}

// Test function untuk simulasi login
function debugTestLogin(no_wa, password) {
  try {
    Logger.log('=== DEBUG: Test Login ===');
    Logger.log('Input No WA: ' + no_wa);
    Logger.log('Input Password: ' + password);
    
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    no_wa = validatePhoneNumber(no_wa);
    Logger.log('Validated No WA: ' + no_wa);
    
    const hashedPassword = hashPassword(password);
    Logger.log('Hashed Password: ' + hashedPassword);
    
    for (let i = 1; i < data.length; i++) {
      Logger.log(`\nChecking row ${i + 1}:`);
      Logger.log('  Sheet No WA: ' + data[i][2]);
      Logger.log('  Match? ' + (data[i][2] === no_wa));
      
      if (data[i][2] === no_wa) {
        Logger.log('  Sheet Password Hash: ' + data[i][4]);
        Logger.log('  Input Password Hash: ' + hashedPassword);
        Logger.log('  Password Match? ' + (data[i][4] === hashedPassword));
        
        if (data[i][4] === hashedPassword) {
          Logger.log('\n✅ LOGIN SUCCESS');
        } else {
          Logger.log('\n❌ PASSWORD MISMATCH');
          Logger.log('Possible causes:');
          Logger.log('  1. Password has extra spaces');
          Logger.log('  2. Copy-paste issue from WA');
          Logger.log('  3. Different hashing algorithm');
        }
        return;
      }
    }
    
    Logger.log('\n❌ USER NOT FOUND');
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

// Function untuk list semua user
function debugListAllUsers() {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    Logger.log('=== DEBUG: All Users ===');
    Logger.log('Total users: ' + (data.length - 1));
    
    for (let i = 1; i < data.length; i++) {
      Logger.log(`\nUser ${i}:`);
      Logger.log('  UserID: ' + data[i][0]);
      Logger.log('  Nama: ' + data[i][1]);
      Logger.log('  No_WhatsApp: ' + data[i][2]);
      Logger.log('  Fonnte_Token: ' + (data[i][3] ? 'SET' : 'EMPTY'));
      Logger.log('  Tgl_Daftar: ' + data[i][5]);
    }
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

// Function untuk reset password user (emergency)
function debugResetPassword(no_wa) {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    no_wa = validatePhoneNumber(no_wa);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === no_wa) {
        const newPassword = generatePassword(8);
        const hashedPassword = hashPassword(newPassword);
        
        sheet.getRange(i + 1, 5).setValue(hashedPassword);
        
        Logger.log('✅ Password reset successful');
        Logger.log('User: ' + data[i][1]);
        Logger.log('No WA: ' + no_wa);
        Logger.log('NEW Password: ' + newPassword);
        Logger.log('NEW Hash: ' + hashedPassword);
        
        // Send to WA
        const message = `*Password Reset - WhatsApp Tools*\n\n` +
                       `Halo ${data[i][1]},\n\n` +
                       `Password baru Anda: *${newPassword}*\n\n` +
                       `Silakan login dengan password baru.`;
        
        sendWhatsAppMessage(MASTER_FONNTE_TOKEN, no_wa, message);
        Logger.log('✅ New password sent to WhatsApp');
        
        return;
      }
    }
    
    Logger.log('❌ User not found: ' + no_wa);
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

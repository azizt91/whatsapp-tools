// ============================================
// TestLogin.gs - Direct Test Login
// ============================================

// Function untuk test login langsung dengan data Anda
function testLoginDirect() {
  try {
    // GANTI DENGAN DATA ANDA
    const testNoWA = '6281914170701';  // ← Nomor yang sudah diperbaiki
    const testPassword = 'PASTE_PASSWORD_DARI_WA';  // ← Password dari WhatsApp
    
    Logger.log('=================================');
    Logger.log('DIRECT LOGIN TEST');
    Logger.log('=================================');
    Logger.log('Test No WA: ' + testNoWA);
    Logger.log('Test Password: ' + testPassword);
    Logger.log('');
    
    // Get spreadsheet data
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    Logger.log('Total users in sheet: ' + (data.length - 1));
    Logger.log('');
    
    // Validate phone
    const validatedNoWA = validatePhoneNumber(testNoWA);
    Logger.log('Validated No WA: ' + validatedNoWA);
    Logger.log('');
    
    // Hash password
    const hashedPassword = hashPassword(testPassword);
    Logger.log('Hashed Password: ' + hashedPassword);
    Logger.log('');
    
    // Find user
    Logger.log('Searching for user...');
    let userFound = false;
    
    for (let i = 1; i < data.length; i++) {
      Logger.log('\n--- Row ' + (i + 1) + ' ---');
      
      // Convert to string for comparison
      const sheetPhone = String(data[i][2]).trim();
      
      Logger.log('Sheet No WA (raw): ' + data[i][2]);
      Logger.log('Sheet No WA (converted): ' + sheetPhone);
      Logger.log('Sheet Name: ' + data[i][1]);
      Logger.log('Comparing: [' + sheetPhone + '] === [' + validatedNoWA + ']');
      Logger.log('Match: ' + (sheetPhone === validatedNoWA));
      
      if (sheetPhone === validatedNoWA) {
        userFound = true;
        Logger.log('✅ USER FOUND!');
        Logger.log('');
        Logger.log('User Details:');
        Logger.log('  UserID: ' + data[i][0]);
        Logger.log('  Nama: ' + data[i][1]);
        Logger.log('  No_WhatsApp: ' + data[i][2]);
        Logger.log('  Fonnte_Token: ' + (data[i][3] ? 'SET' : 'EMPTY'));
        Logger.log('  Password Hash: ' + data[i][4]);
        Logger.log('  Tgl_Daftar: ' + data[i][5]);
        Logger.log('');
        
        Logger.log('Password Comparison:');
        Logger.log('  Input Hash:  ' + hashedPassword);
        Logger.log('  Sheet Hash:  ' + data[i][4]);
        Logger.log('  Length Input: ' + hashedPassword.length);
        Logger.log('  Length Sheet: ' + data[i][4].length);
        Logger.log('  Match: ' + (data[i][4] === hashedPassword));
        Logger.log('');
        
        if (data[i][4] === hashedPassword) {
          Logger.log('✅✅✅ LOGIN SUCCESS! ✅✅✅');
          Logger.log('Password is correct!');
        } else {
          Logger.log('❌❌❌ PASSWORD MISMATCH! ❌❌❌');
          Logger.log('');
          Logger.log('DEBUGGING INFO:');
          
          // Character by character comparison
          Logger.log('First 20 chars comparison:');
          for (let j = 0; j < 20; j++) {
            const inputChar = hashedPassword.charAt(j);
            const sheetChar = data[i][4].charAt(j);
            const match = inputChar === sheetChar ? '✓' : '✗';
            Logger.log('  Pos ' + j + ': Input[' + inputChar + '] Sheet[' + sheetChar + '] ' + match);
          }
          
          Logger.log('');
          Logger.log('POSSIBLE CAUSES:');
          Logger.log('1. Password dari WA salah (ada spasi, typo, dll)');
          Logger.log('2. Password di spreadsheet corrupt');
          Logger.log('3. Hash function berbeda');
        }
        
        return;
      }
    }
    
    if (!userFound) {
      Logger.log('❌❌❌ USER NOT FOUND! ❌❌❌');
      Logger.log('');
      Logger.log('Phone number ' + validatedNoWA + ' not in spreadsheet!');
      Logger.log('');
      Logger.log('All phone numbers in sheet:');
      for (let i = 1; i < data.length; i++) {
        Logger.log('  Row ' + (i + 1) + ': ' + data[i][2] + ' (' + data[i][1] + ')');
      }
    }
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

// Function untuk lihat password yang ter-generate saat registrasi terakhir
function getLastRegistrationPassword() {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      Logger.log('No users in spreadsheet');
      return;
    }
    
    // Get last user
    const lastRow = data.length - 1;
    const userData = data[lastRow];
    
    Logger.log('=================================');
    Logger.log('LAST REGISTERED USER');
    Logger.log('=================================');
    Logger.log('UserID: ' + userData[0]);
    Logger.log('Nama: ' + userData[1]);
    Logger.log('No_WhatsApp: ' + userData[2]);
    Logger.log('Password Hash: ' + userData[4]);
    Logger.log('Tgl_Daftar: ' + userData[5]);
    Logger.log('');
    Logger.log('⚠️ NOTE: Password plain text tidak bisa dilihat dari hash!');
    Logger.log('Cek log registrasi untuk melihat password asli.');
    
  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
  }
}

// Function untuk generate hash dari password tertentu (untuk test)
function generateHashForPassword() {
  // GANTI DENGAN PASSWORD YANG MAU DI-TEST
  const testPassword = 'PASTE_PASSWORD_DISINI';
  
  Logger.log('Password: ' + testPassword);
  Logger.log('Hash: ' + hashPassword(testPassword));
}

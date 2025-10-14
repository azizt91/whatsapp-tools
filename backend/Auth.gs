// ============================================
// Auth.gs - Authentication & User Management
// ============================================

function registerUser(nama, no_wa) {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    no_wa = validatePhoneNumber(no_wa);
    
    // DEBUGGING: Log untuk troubleshooting
    Logger.log('=== REGISTRATION ATTEMPT ===');
    Logger.log('Input Nama: ' + nama);
    Logger.log('Input No WA: ' + no_wa);
    Logger.log('Validated No WA: ' + no_wa);
    
    for (let i = 1; i < data.length; i++) {
      // Convert to string for comparison
      const sheetPhone = String(data[i][2]).trim();
      if (sheetPhone === no_wa) {
        return {
          success: false,
          message: 'Nomor WhatsApp sudah terdaftar!'
        };
      }
    }
    
    const userID = generateID('USR');
    const password = generatePassword(8);
    const hashedPassword = hashPassword(password);
    const tglDaftar = new Date();
    
    // DEBUGGING: Log password dan hash
    Logger.log('Generated Password: ' + password);
    Logger.log('Hashed Password: ' + hashedPassword);
    
    sheet.appendRow([
      userID,
      nama,
      no_wa,
      '',
      hashedPassword,
      formatDateTime(tglDaftar)
    ]);
    
    Logger.log('User saved to spreadsheet');
    
    const welcomeMessage = `*Selamat datang di WhatsApp Tools!*\n\n` +
                          `Nama: ${nama}\n` +
                          `Username: ${no_wa}\n` +
                          `Password: *${password}*\n\n` +
                          `Silakan login menggunakan kredensial di atas.\n` +
                          `_Simpan password Anda dengan aman!_`;
    
    const sendResult = sendWhatsAppMessage(MASTER_FONNTE_TOKEN, no_wa, welcomeMessage);
    
    Logger.log('Send WA result: ' + JSON.stringify(sendResult));
    
    if (sendResult.success) {
      return {
        success: true,
        message: 'Registrasi berhasil! Password telah dikirim ke WhatsApp Anda.',
        data: { userID, no_wa, password: password } // TEMPORARY: Kembalikan password untuk debug
      };
    } else {
      // Tetap return success karena user sudah tersimpan
      return {
        success: true,
        message: 'Registrasi berhasil! Password: ' + password + ' (simpan ini, gagal kirim ke WA)',
        data: { userID, no_wa, password: password }
      };
    }
    
  } catch (error) {
    logError('registerUser', error);
    return {
      success: false,
      message: 'Terjadi kesalahan: ' + error.toString()
    };
  }
}

function loginUser(no_wa, password) {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    no_wa = validatePhoneNumber(no_wa);
    const hashedPassword = hashPassword(password);
    
    // DEBUGGING: Log untuk troubleshooting
    Logger.log('=== LOGIN ATTEMPT ===');
    Logger.log('Input No WA: ' + no_wa);
    Logger.log('Input Password: ' + password);
    Logger.log('Hashed Password: ' + hashedPassword);
    
    let userFound = false;
    
    for (let i = 1; i < data.length; i++) {
      // Convert to string for comparison (handle number vs string issue)
      const sheetPhone = String(data[i][2]).trim();
      if (sheetPhone === no_wa) {
        userFound = true;
        Logger.log('User FOUND at row ' + (i + 1));
        Logger.log('Sheet Password Hash: ' + data[i][4]);
        Logger.log('Hash Match: ' + (data[i][4] === hashedPassword));
        
        if (data[i][4] === hashedPassword) {
          const userData = {
            userID: data[i][0],
            nama: data[i][1],
            no_whatsapp: data[i][2],
            fonnte_token: data[i][3],
            tgl_daftar: data[i][5]
          };
          
          return {
            success: true,
            message: 'Login berhasil!',
            data: userData
          };
        } else {
          return {
            success: false,
            message: 'Password salah! [Debug: Hash mismatch]'
          };
        }
      }
    }
    
    if (!userFound) {
      return {
        success: false,
        message: 'Nomor WhatsApp tidak terdaftar! Silakan registrasi terlebih dahulu.'
      };
    }
    
    return {
      success: false,
      message: 'Nomor WhatsApp atau password salah!'
    };
    
  } catch (error) {
    logError('loginUser', error);
    return {
      success: false,
      message: 'Terjadi kesalahan: ' + error.toString()
    };
  }
}

function saveFonnteToken(userID, token) {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userID) {
        sheet.getRange(i + 1, 4).setValue(token);
        
        return {
          success: true,
          message: 'Token Fonnte berhasil disimpan!'
        };
      }
    }
    
    return {
      success: false,
      message: 'User tidak ditemukan!'
    };
    
  } catch (error) {
    logError('saveFonnteToken', error);
    return {
      success: false,
      message: 'Terjadi kesalahan: ' + error.toString()
    };
  }
}

function getUserByID(userID) {
  try {
    const sheet = getSheet('Pengguna');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userID) {
        return {
          success: true,
          data: {
            userID: data[i][0],
            nama: data[i][1],
            no_whatsapp: data[i][2],
            fonnte_token: data[i][3],
            tgl_daftar: data[i][5]
          }
        };
      }
    }
    
    return { success: false, message: 'User tidak ditemukan' };
  } catch (error) {
    logError('getUserByID', error);
    return { success: false, message: error.toString() };
  }
}

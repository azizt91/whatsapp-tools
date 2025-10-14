// ============================================
// Utils.gs - Helper Functions
// ============================================

function generateID(prefix) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}${random}`;
}

function hashPassword(password) {
  const hash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.US_ASCII
  );
  return hash.map(byte => {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function generatePassword(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function processSpintax(text) {
  const regex = /\{([^{}]+)\}/g;
  return text.replace(regex, (match, options) => {
    const choices = options.split('|');
    return choices[Math.floor(Math.random() * choices.length)];
  });
}

function replacePlaceholders(template, data) {
  let message = template;
  
  // Convert data values to string and limit length
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      let value = data[key];
      
      // Convert to string safely
      if (value === null || value === undefined) {
        value = '';
      } else if (value instanceof Date) {
        // Format date as DD/MM/YYYY
        const day = String(value.getDate()).padStart(2, '0');
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const year = value.getFullYear();
        value = day + '/' + month + '/' + year;
      } else if (typeof value === 'object') {
        value = String(value);
      } else {
        value = String(value);
      }
      
      // Limit value length to prevent very long replacements
      if (value.length > 500) {
        value = value.substring(0, 497) + '...';
      }
      
      // Replace placeholder (use replaceAll for multiple occurrences)
      const placeholder = `[${key.toLowerCase()}]`;
      message = message.split(placeholder).join(value);
    }
  }
  
  return processSpintax(message);
}

function sendWhatsAppMessage(token, target, message) {
  try {
    // Clean message: remove excessive newlines and trim
    message = message.trim().replace(/\n{3,}/g, '\n\n');
    
    // Check message length
    if (message.length > 4000) {
      Logger.log('WARNING: Message too long (' + message.length + ' chars), truncating...');
      message = message.substring(0, 3997) + '...';
    }
    
    const payload = {
      'target': target,
      'message': message,
      'countryCode': '62'
    };
    
    const options = {
      'method': 'post',
      'headers': {
        'Authorization': token
      },
      'payload': payload,
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(FONNTE_API_URL, options);
    const result = JSON.parse(response.getContentText());
    
    // Log response for debugging
    Logger.log('Fonnte response: ' + JSON.stringify(result));
    
    return {
      success: result.status !== false,
      message: result.reason || 'Pesan terkirim',
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

function validatePhoneNumber(phone) {
  // Remove all non-digit characters
  let cleaned = String(phone).replace(/\D/g, '').trim();
  
  // Log untuk debugging
  Logger.log('validatePhoneNumber input: ' + phone);
  Logger.log('validatePhoneNumber cleaned: ' + cleaned);
  
  // Remove leading zeros or plus
  cleaned = cleaned.replace(/^0+/, '');
  
  // If starts with country code 62, keep it
  if (cleaned.startsWith('62')) {
    Logger.log('validatePhoneNumber output (already 62): ' + cleaned);
    return cleaned;
  }
  
  // If starts with 8 (Indo number without country code), add 62
  if (cleaned.startsWith('8')) {
    const result = '62' + cleaned;
    Logger.log('validatePhoneNumber output (added 62): ' + result);
    return result;
  }
  
  // If starts with 6 but not 62 (possible typo/bug), check if it should be 628
  if (cleaned.startsWith('6') && !cleaned.startsWith('62')) {
    // Kemungkinan: 681914... seharusnya 6281914...
    const result = '62' + cleaned.substring(1);
    Logger.log('validatePhoneNumber output (fixed 6->62): ' + result);
    return result;
  }
  
  // Default: add 62 prefix
  const result = '62' + cleaned;
  Logger.log('validatePhoneNumber output (default): ' + result);
  return result;
}

function formatDateTime(date) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const pad = (n) => n.toString().padStart(2, '0');
  
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function logError(context, error) {
  console.error(`[${context}] ${error.toString()}`);
  Logger.log(`[${context}] ${error.toString()}`);
}

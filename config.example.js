// ============================================
// Configuration File - EXAMPLE
// ============================================
// 
// CARA SETUP:
// 1. Copy file ini menjadi 'config.js'
// 2. Ganti YOUR_DEPLOYMENT_ID dengan ID deployment Google Apps Script Anda
// 3. Jangan commit config.js ke repository (sudah ada di .gitignore)

// GANTI DENGAN URL GOOGLE APPS SCRIPT WEB APP ANDA
// Format: https://script.google.com/macros/s/XXXXX/exec
const API_BASE_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID_HERE/exec';

// Jangan ubah yang di bawah ini
const API_CONFIG = {
  baseURL: API_BASE_URL
};

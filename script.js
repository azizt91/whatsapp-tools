// ============================================
// Frontend JavaScript - API Communication
// ============================================

let currentUser = null;

// Initialize App
window.onload = function() {
  checkSession();
};

// ============================================
// API Helper Functions
// ============================================

async function apiCall(action, method = 'GET', data = null) {
  try {
    showLoading();
    
    // Build URL with action parameter
    let url = new URL(API_CONFIG.baseURL);
    url.searchParams.append('action', action);
    
    // For GET or data in URL, add all params to URL
    if (method === 'GET' || data) {
      for (const [key, value] of Object.entries(data || {})) {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, value);
        }
      }
    }
    
    // Always use GET for Google Apps Script (better CORS support)
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow'
    });
    
    const result = await response.json();
    
    hideLoading();
    return result;
    
  } catch (error) {
    hideLoading();
    console.error('API Error:', error);
    return { success: false, message: 'Terjadi kesalahan koneksi: ' + error.message };
  }
}

// ============================================
// Session & Authentication
// ============================================

function checkSession() {
  const sessionData = localStorage.getItem('whatsapp_tools_session');
  if (sessionData) {
    currentUser = JSON.parse(sessionData);
    showDashboard();
  }
}

function saveSession(userData) {
  localStorage.setItem('whatsapp_tools_session', JSON.stringify(userData));
  currentUser = userData;
}

function clearSession() {
  localStorage.removeItem('whatsapp_tools_session');
  currentUser = null;
}

// ============================================
// Tab Switching
// ============================================

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  if (tab === 'login') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('loginForm').classList.add('active');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('registerForm').classList.add('active');
  }
}

// ============================================
// Handle Register
// ============================================

async function handleRegister(event) {
  event.preventDefault();
  
  const nama = document.getElementById('registerNama').value.trim();
  const no_wa = document.getElementById('registerWA').value.trim();
  
  const result = await apiCall('register', 'POST', { nama, no_wa });
  
  if (result.success) {
    // Show password in alert if returned (for debugging or if WA failed)
    let message = result.message;
    if (result.data && result.data.password) {
      message += '\n\n⚠️ SIMPAN PASSWORD INI:\n' + result.data.password;
    }
    showAlert('success', message);
    document.getElementById('registerForm').querySelector('form').reset();
    switchTab('login');
  } else {
    showAlert('error', result.message);
  }
}

// ============================================
// Handle Login
// ============================================

async function handleLogin(event) {
  event.preventDefault();
  
  const no_wa = document.getElementById('loginWA').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  
  const result = await apiCall('login', 'POST', { no_wa, password });
  
  if (result.success) {
    saveSession(result.data);
    showDashboard();
  } else {
    showAlert('error', result.message);
  }
}

// ============================================
// Handle Logout
// ============================================

function handleLogout() {
  if (!confirm('Yakin ingin logout?')) return;
  
  clearSession();
  showAuthView();
}

// ============================================
// Show Dashboard
// ============================================

function showDashboard() {
  document.getElementById('authView').classList.remove('active');
  document.getElementById('dashboardView').classList.add('active');
  
  document.getElementById('userInfo').textContent = `${currentUser.nama} (${currentUser.no_whatsapp})`;
  
  if (currentUser.fonnte_token) {
    document.getElementById('fonnteToken').value = currentUser.fonnte_token;
  }
  
  loadDashboardData();
}

// ============================================
// Show Auth View
// ============================================

function showAuthView() {
  document.getElementById('dashboardView').classList.remove('active');
  document.getElementById('authView').classList.add('active');
  document.getElementById('loginForm').querySelector('form').reset();
}

// ============================================
// Load Dashboard Data
// ============================================

function loadDashboardData() {
  loadCustomerCount();
  loadTemplates();
  loadSchedules();
}

// ============================================
// Handle Save Token
// ============================================

async function handleSaveToken(event) {
  event.preventDefault();
  
  const token = document.getElementById('fonnteToken').value;
  
  const result = await apiCall('saveToken', 'POST', { 
    userID: currentUser.userID, 
    token 
  });
  
  if (result.success) {
    showAlert('success', result.message);
    currentUser.fonnte_token = token;
    saveSession(currentUser);
  } else {
    showAlert('error', result.message);
  }
}

// ============================================
// Load Customer Count
// ============================================

async function loadCustomerCount() {
  const result = await apiCall('getCustomerCount', 'POST', { 
    userID: currentUser.userID 
  });
  
  if (result.success) {
    document.getElementById('customerCount').textContent = `${result.count} pelanggan`;
  }
}

// ============================================
// Handle Upload CSV
// ============================================

async function handleUploadCSV(event) {
  event.preventDefault();
  
  const fileInput = document.getElementById('csvFile');
  const file = fileInput.files[0];
  
  if (!file) {
    showAlert('error', 'Pilih file CSV terlebih dahulu!');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    const csvData = e.target.result;
    
    const result = await apiCall('uploadCustomers', 'POST', { 
      userID: currentUser.userID, 
      csvData 
    });
    
    if (result.success) {
      showAlert('success', result.message);
      fileInput.value = '';
      loadCustomerCount();
    } else {
      showAlert('error', result.message);
    }
  };
  
  reader.readAsText(file);
}

// ============================================
// Clear Customers
// ============================================

async function clearCustomers() {
  if (!confirm('Yakin ingin menghapus SEMUA pelanggan? Tindakan ini tidak dapat dibatalkan!')) {
    return;
  }
  
  const result = await apiCall('clearCustomers', 'POST', { 
    userID: currentUser.userID 
  });
  
  if (result.success) {
    showAlert('success', result.message);
    loadCustomerCount();
  } else {
    showAlert('error', result.message);
  }
}

// ============================================
// Load Templates
// ============================================

async function loadTemplates() {
  const result = await apiCall('getTemplates', 'POST', { 
    userID: currentUser.userID 
  });
  
  if (result.success) {
    displayTemplates(result.data);
    updateTemplateDropdown(result.data);
  }
}

// ============================================
// Display Templates
// ============================================

function displayTemplates(templates) {
  const container = document.getElementById('templateList');
  
  if (templates.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center;">Belum ada template. Klik "Buat Template" untuk menambahkan.</p>';
    return;
  }
  
  let html = '';
  templates.forEach(template => {
    html += `
      <div class="template-item">
        <div class="template-info">
          <h4>${template.nama_template}</h4>
          <p>${template.isi_pesan}</p>
        </div>
        <div class="template-actions">
          <button onclick="editTemplate('${template.templateID}')" class="btn btn-sm btn-info">Edit</button>
          <button onclick="deleteTemplate('${template.templateID}')" class="btn btn-sm btn-danger">Hapus</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ============================================
// Update Template Dropdown
// ============================================

function updateTemplateDropdown(templates) {
  const select = document.getElementById('scheduleTemplate');
  select.innerHTML = '<option value="">-- Pilih Template --</option>';
  
  templates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.templateID;
    option.textContent = template.nama_template;
    select.appendChild(option);
  });
}

// ============================================
// Show/Hide Template Form
// ============================================

function showTemplateForm() {
  document.getElementById('templateForm').style.display = 'block';
  document.getElementById('editTemplateID').value = '';
  document.getElementById('templateName').value = '';
  document.getElementById('templateMessage').value = '';
}

function hideTemplateForm() {
  document.getElementById('templateForm').style.display = 'none';
}

// ============================================
// Handle Save Template
// ============================================

async function handleSaveTemplate(event) {
  event.preventDefault();
  
  const templateID = document.getElementById('editTemplateID').value || null;
  const nama = document.getElementById('templateName').value;
  const pesan = document.getElementById('templateMessage').value;
  
  const result = await apiCall('saveTemplate', 'POST', { 
    userID: currentUser.userID, 
    namaTemplate: nama, 
    isiPesan: pesan, 
    templateID 
  });
  
  if (result.success) {
    showAlert('success', result.message);
    hideTemplateForm();
    loadTemplates();
  } else {
    showAlert('error', result.message);
  }
}

// ============================================
// Edit Template
// ============================================

async function editTemplate(templateID) {
  const result = await apiCall('getTemplate', 'POST', { 
    templateID, 
    userID: currentUser.userID 
  });
  
  if (result.success) {
    document.getElementById('editTemplateID').value = result.data.templateID;
    document.getElementById('templateName').value = result.data.nama_template;
    document.getElementById('templateMessage').value = result.data.isi_pesan;
    document.getElementById('templateForm').style.display = 'block';
    document.getElementById('templateForm').scrollIntoView({ behavior: 'smooth' });
  }
}

// ============================================
// Delete Template
// ============================================

async function deleteTemplate(templateID) {
  if (!confirm('Yakin ingin menghapus template ini?')) return;
  
  const result = await apiCall('deleteTemplate', 'POST', { 
    templateID, 
    userID: currentUser.userID 
  });
  
  if (result.success) {
    showAlert('success', result.message);
    loadTemplates();
  } else {
    showAlert('error', result.message);
  }
}

// ============================================
// Preview Template
// ============================================

async function previewTemplate() {
  const templateID = document.getElementById('editTemplateID').value;
  
  if (!templateID) {
    showAlert('error', 'Simpan template terlebih dahulu untuk preview!');
    return;
  }
  
  const result = await apiCall('previewTemplate', 'POST', { 
    userID: currentUser.userID, 
    templateID 
  });
  
  if (result.success) {
    const msg = `Preview Pesan:\n\n${result.data.preview}\n\n(Berdasarkan pelanggan: ${result.data.sampleData.nama})`;
    alert(msg);
  } else {
    showAlert('error', result.message);
  }
}

// ============================================
// Handle Schedule Message
// ============================================

async function handleScheduleMessage(event) {
  event.preventDefault();
  
  const templateID = document.getElementById('scheduleTemplate').value;
  const waktu = document.getElementById('scheduleTime').value;
  
  if (!currentUser.fonnte_token) {
    showAlert('error', 'Simpan Token Fonnte terlebih dahulu!');
    return;
  }
  
  const result = await apiCall('scheduleMessage', 'POST', { 
    userID: currentUser.userID, 
    templateID, 
    targetWaktu: waktu 
  });
  
  if (result.success) {
    showAlert('success', result.message);
    document.querySelector('#scheduleTime').value = '';
    document.querySelector('#scheduleTemplate').value = '';
    loadSchedules();
  } else {
    showAlert('error', result.message);
  }
}

// ============================================
// Load Schedules
// ============================================

async function loadSchedules() {
  const result = await apiCall('getSchedules', 'POST', { 
    userID: currentUser.userID 
  });
  
  if (result.success) {
    displaySchedules(result.data);
  }
}

// ============================================
// Display Schedules
// ============================================

function displaySchedules(schedules) {
  const container = document.getElementById('scheduleList');
  
  if (schedules.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center;">Belum ada jadwal pengiriman.</p>';
    return;
  }
  
  let html = '<table><thead><tr><th>Template</th><th>Waktu</th><th>Status</th><th>Log</th><th>Aksi</th></tr></thead><tbody>';
  
  schedules.forEach(schedule => {
    const statusClass = 'status-' + schedule.status.toLowerCase().replace(/\s/g, '-').replace(/[()]/g, '');
    html += `
      <tr>
        <td>${schedule.templateName}</td>
        <td>${schedule.target_waktu}</td>
        <td><span class="status-badge ${statusClass}">${schedule.status}</span></td>
        <td>${schedule.log_info || '-'}</td>
        <td>
          ${schedule.status === 'Menunggu' ? 
            `<button onclick="cancelSchedule('${schedule.jadwalID}')" class="btn btn-sm btn-danger">Batal</button>` : 
            '-'
          }
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

// ============================================
// Cancel Schedule
// ============================================

async function cancelSchedule(jadwalID) {
  if (!confirm('Yakin ingin membatalkan jadwal ini?')) return;
  
  const result = await apiCall('cancelSchedule', 'POST', { 
    jadwalID, 
    userID: currentUser.userID 
  });
  
  if (result.success) {
    showAlert('success', result.message);
    loadSchedules();
  } else {
    showAlert('error', result.message);
  }
}

// ============================================
// Refresh Schedules
// ============================================

function refreshSchedules() {
  loadSchedules();
}

// ============================================
// Show/Hide Loading
// ============================================

function showLoading() {
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

// ============================================
// Show Alert
// ============================================

function showAlert(type, message) {
  alert(message);
}

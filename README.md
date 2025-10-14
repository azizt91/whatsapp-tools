# 📱 WhatsApp Tools - Multi User System

> **Modern Architecture**: Frontend (Netlify) + Backend API (Google Apps Script) + Database (Google Sheets)

Sistem pengiriman pesan WhatsApp otomatis dan terjadwal yang mendukung multiple users dengan arsitektur terpisah antara frontend dan backend.

---

## 🏗️ Arsitektur

```
┌──────────────────┐
│   Frontend       │  → HTML, CSS, JS (Static Files)
│   (Netlify)      │  → Hosted on Netlify CDN
└────────┬─────────┘
         │ API Calls (fetch)
         │
┌────────▼─────────┐
│   Backend API    │  → Google Apps Script
│   (GAS)          │  → REST API Endpoints
└────────┬─────────┘
         │
┌────────▼─────────┐
│   Database       │  → Google Sheets
│   (Sheets)       │  → 4 Sheets (Pengguna, Pelanggan, etc.)
└──────────────────┘
```

---

## 📁 Struktur Project

```
tools_wa/
│
├── frontend/                    ← Deploy ke Netlify
│   ├── index.html              ← Main HTML
│   ├── style.css               ← Pure CSS
│   ├── script.js               ← Frontend logic dengan fetch()
│   ├── config.js               ← API endpoint config (gitignored)
│   ├── config.example.js       ← Template config
│   ├── .gitignore              ← Git ignore rules
│   └── sample_pelanggan.csv    ← Contoh CSV
│
├── backend/                     ← Upload ke Google Apps Script
│   ├── API.gs                  ← Main API handler (doGet/doPost)
│   ├── Auth.gs                 ← Authentication functions
│   ├── Data.gs                 ← Customer data functions
│   ├── Message.gs              ← Template & schedule functions
│   ├── Scheduler.gs            ← Automated job executor
│   └── Utils.gs                ← Helper functions
│
└── docs/
    ├── DEPLOYMENT_NETLIFY.md   ← Panduan deployment lengkap
    ├── README.md               ← Dokumentasi utama
    └── skema.md                ← Skema arsitektur detail
```

---

## ✨ Fitur

✅ **Multi-User System** - Data setiap user terpisah  
✅ **REST API** - Backend sebagai API, frontend terpisah  
✅ **CSV Upload** - Import data pelanggan dari file CSV  
✅ **Template Pesan** - Buat template dengan placeholder dinamis  
✅ **Spintax Support** - Variasi pesan dengan `{kata1|kata2|kata3}`  
✅ **Scheduling** - Jadwalkan pengiriman ke banyak pelanggan  
✅ **Password Hashing** - Security dengan SHA-256  
✅ **Auto Delay** - Jeda acak 15-45 detik antar pengiriman  
✅ **Responsive UI** - Mobile-friendly design  
✅ **Free Hosting** - Netlify (frontend) + GAS (backend) = $0/month  

---

## 🚀 Quick Start

### 1. Setup Backend (Google Apps Script)

```bash
# 1. Buat Google Spreadsheet baru
# 2. Extensions > Apps Script
# 3. Copy semua file dari /backend
# 4. Edit API.gs, ganti SPREADSHEET_ID
# 5. Deploy > New deployment > Web app
# 6. Copy Web App URL
```

**Detail**: Lihat [DEPLOYMENT_NETLIFY.md](DEPLOYMENT_NETLIFY.md)

### 2. Setup Frontend (Netlify)

```bash
# Clone/download project
cd frontend/

# Copy config template
cp config.example.js config.js

# Edit config.js, paste Web App URL dari step 1
nano config.js

# Push ke GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/whatsapp-tools.git
git push -u origin main

# Deploy ke Netlify
# 1. Login ke netlify.com
# 2. New site from Git
# 3. Connect GitHub repo
# 4. Deploy!
```

**Detail**: Lihat [DEPLOYMENT_NETLIFY.md](DEPLOYMENT_NETLIFY.md)

---

## 📖 Cara Penggunaan

### Registrasi & Login

1. Buka Netlify URL Anda
2. Klik tab **Registrasi**
3. Masukkan nama & nomor WA (format `628xxx`)
4. Password akan **auto dikirim ke WhatsApp**
5. Login dengan nomor WA dan password

### Setup Token Fonnte

1. Login ke [fonnte.com](https://fonnte.com)
2. Copy **Token API** Anda
3. Di dashboard, paste token di **Pengaturan Akun**
4. Klik **Simpan Token**

### Upload Data Pelanggan

**Format CSV:**
```csv
Nama,No_WhatsApp,Tagihan,Periode
John Doe,628123456789,Rp 100.000,Januari 2025
Jane Smith,628987654321,Rp 150.000,Januari 2025
```

- Kolom wajib: `Nama`, `No_WhatsApp`
- Kolom tambahan bebas (max 10 parameter)

### Membuat Template

```
{Halo|Hai|Selamat pagi} [nama]! 👋

Ini adalah pengingat untuk tagihan [periode] sebesar [tagihan].

Mohon transfer sebelum tanggal jatuh tempo.

{Terima kasih|Thanks}! 🙏
```

**Placeholder**: `[nama]`, `[no_whatsapp]`, `[tagihan]`, `[periode]`, dll  
**Spintax**: `{pilihan1|pilihan2}` untuk variasi random

### Jadwalkan Pengiriman

1. Pilih **Template**
2. Pilih **Waktu Pengiriman**
3. Klik **Jadwalkan**
4. Sistem akan auto kirim saat waktunya tiba!

---

## 🔧 Development

### Local Testing Frontend

```bash
cd frontend/

# Buka di browser
open index.html

# Atau dengan server local
python -m http.server 8000
# Buka http://localhost:8000
```

### Update Frontend

```bash
# Edit files
nano style.css

# Commit & push
git add .
git commit -m "Update styling"
git push origin main

# Netlify auto-redeploy!
```

### Update Backend

1. Edit di Apps Script Editor
2. Save (Ctrl+S)
3. Deploy > Manage deployments
4. Edit > New version > Deploy

---

## 🌐 API Endpoints

| Endpoint | Method | Parameters | Response |
|----------|--------|------------|----------|
| `?action=register` | POST | `nama`, `no_wa` | `{ success, message, data }` |
| `?action=login` | POST | `no_wa`, `password` | `{ success, message, data }` |
| `?action=saveToken` | POST | `userID`, `token` | `{ success, message }` |
| `?action=uploadCustomers` | POST | `userID`, `csvData` | `{ success, message }` |
| `?action=getTemplates` | POST | `userID` | `{ success, data: [...] }` |
| `?action=scheduleMessage` | POST | `userID`, `templateID`, `targetWaktu` | `{ success, message }` |

**Full API docs**: Lihat komentar di `backend/API.gs`

---

## 📊 Database Schema (Google Sheets)

### Sheet: Pengguna
| Kolom | Type | Keterangan |
|-------|------|------------|
| UserID | String | Primary key (USR-xxx) |
| Nama | String | Nama lengkap |
| No_WhatsApp | String | Nomor WA (628xxx) |
| Fonnte_Token | String | Token Fonnte API |
| Password | String | Password hash (SHA-256) |
| Tgl_Daftar | Datetime | Timestamp registrasi |

### Sheet: Pelanggan
| Kolom | Type | Keterangan |
|-------|------|------------|
| PelangganID | String | Primary key (PLG-xxx) |
| UserID | String | Foreign key ke Pengguna |
| Nama | String | Nama pelanggan |
| No_WhatsApp | String | Nomor WA pelanggan |
| Parameter_1 to Parameter_10 | String | Data fleksibel dari CSV |

### Sheet: TemplatePesan
| Kolom | Type | Keterangan |
|-------|------|------------|
| TemplateID | String | Primary key (TMPL-xxx) |
| UserID | String | Foreign key ke Pengguna |
| Nama_Template | String | Nama template |
| Isi_Pesan | Text | Konten template |

### Sheet: JadwalKirim
| Kolom | Type | Keterangan |
|-------|------|------------|
| JadwalID | String | Primary key (JDWL-xxx) |
| UserID | String | Foreign key ke Pengguna |
| TemplateID | String | Foreign key ke TemplatePesan |
| Target_Waktu | Datetime | Waktu pengiriman |
| Status | String | Menunggu/Diproses/Selesai/Gagal |
| Log_Info | Text | Log hasil eksekusi |

---

## 🐛 Troubleshooting

### CORS Error

**Problem**: `Access to fetch has been blocked by CORS policy`

**Solution**:
- Pastikan deployment GAS **Who has access** = `Anyone`
- Redeploy dengan New version

### API Returns HTML Instead of JSON

**Problem**: `Unexpected token '<'`

**Solution**:
- Cek Apps Script Executions log
- Pastikan `doGet()` return `ContentService.createTextOutput().setMimeType(JSON)`

### Password Tidak Terkirim

**Problem**: User registrasi tapi password tidak masuk WA

**Solution**:
- Cek `MASTER_FONNTE_TOKEN` di `API.gs`
- Pastikan device Fonnte online
- Cek Executions log untuk error

---

## 📈 Performance & Limits

### Google Apps Script Quotas (Free Account)

- **URL Fetch**: 20,000 calls/day
- **Execution time**: 6 minutes/execution
- **Trigger total**: 90 minutes/day

### Netlify Free Plan

- **Bandwidth**: 100 GB/month
- **Build minutes**: 300/month
- **Sites**: Unlimited

**Cukup untuk 1000+ users!** 🚀

---

## 🔒 Security

✅ Password hashing (SHA-256)  
✅ Session di localStorage  
✅ Input validation  
✅ CORS enabled  
✅ Environment variables untuk secrets  
✅ .gitignore untuk config.js  

---

## 📞 Support

- **Issues**: Create issue di GitHub repo
- **Email**: your-email@example.com
- **Documentation**: `/docs` folder

---

## 📄 License

MIT License - Free to use dan modify.

---

## 🙏 Credits

- **Fonnte API**: https://fonnte.com
- **Google Apps Script**: https://script.google.com
- **Netlify**: https://netlify.com

---

## 🎉 Changelog

### v2.0.0 (2025-01-10)
- ✨ NEW: Arsitektur terpisah (Frontend di Netlify, Backend di GAS)
- ✨ NEW: REST API endpoints
- ✨ NEW: Pure HTML/CSS/JS (no server-side rendering)
- 🔧 FIX: CORS handling
- 📚 DOC: Complete deployment guide for Netlify

### v1.0.0 (2025-01-09)
- 🎉 Initial release
- ✅ Multi-user system
- ✅ CSV upload
- ✅ Template & scheduling
- ✅ Spintax support

---

**Dibuat dengan ❤️ menggunakan Google Apps Script, Fonnte API, dan Netlify**

**Happy messaging! 📱✨**

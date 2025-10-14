# Skema Lengkap: Tools WhatsApp Otomatis dengan Google Apps Script & Fonnte API

Dokumen ini merinci skema arsitektur, backend, dan frontend untuk membangun aplikasi pengirim pesan WhatsApp terjadwal yang bersifat multi-user, menggunakan Google Sheets sebagai database, Google Apps Script sebagai backend, dan antarmuka web (HTML/CSS/JS).

-----

## 🏗️ 1. Arsitektur Umum

Sistem ini terdiri dari empat komponen utama yang saling berinteraksi:

1.  **Frontend (Antarmuka Pengguna)**: Dibangun dengan HTML, CSS, dan JavaScript. Ini adalah halaman web yang diakses oleh rekan-rekan Anda untuk mengelola akun, pelanggan, template pesan, dan jadwal. Halaman ini disajikan (di-render) langsung oleh Google Apps Script.
2.  **Backend (Logika Aplikasi)**: Google Apps Script (GAS) bertindak sebagai server. GAS akan menangani semua logika:
      * Menyajikan halaman web (Frontend).
      * Mengelola otentikasi (registrasi & login).
      * Memproses permintaan dari frontend (misalnya, menyimpan token, mengupload data).
      * Menjalankan tugas terjadwal (trigger) untuk mengirim pesan.
3.  **Database (Penyimpanan Data)**: Satu file Google Spreadsheet digunakan sebagai database. Setiap *sheet* di dalamnya berfungsi sebagai tabel untuk menyimpan data pengguna, pelanggan, template, dan jadwal.
4.  **API Eksternal (Layanan Pengiriman)**: Fonnte WhatsApp API digunakan sebagai jembatan untuk mengirimkan pesan dari backend (GAS) ke nomor WhatsApp pelanggan.

-----

## ⚙️ 2. Skema Backend (Google Apps Script & Google Sheets)

Ini adalah jantung dari aplikasi Anda. Organisasi yang baik di sini akan membuat pengembangan dan pemeliharaan menjadi lebih mudah.

### 2.1. Struktur Database (Google Sheets)

Buat satu file Google Spreadsheet dengan 4 sheet berikut:

#### `1. Sheet: Pengguna`

Menyimpan data kredensial dan konfigurasi untuk setiap rekan Anda.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `UserID` | `String` | **(Primary Key)** ID unik untuk setiap pengguna, misal: `USR-001`. |
| `Nama` | `String` | Nama lengkap rekan. |
| `No_WhatsApp` | `String` | Nomor WhatsApp rekan (juga sebagai username). Format: `628...` |
| `Fonnte_Token`| `String` | Token Fonnte API milik masing-masing rekan. |
| `Password` | `String` | Password yang di-generate sistem (sebaiknya di-hash untuk keamanan). |
| `Tgl_Daftar` | `Datetime` | Waktu saat pengguna mendaftar. |

#### `2. Sheet: Pelanggan`

Menyimpan data pelanggan dari semua rekan.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `PelangganID` | `String` | **(Primary Key)** ID unik untuk setiap pelanggan, misal: `PLG-001`. |
| `UserID` | `String` | **(Foreign Key)** Merujuk ke `UserID` di sheet `Pengguna`. |
| `Nama` | `String` | Nama pelanggan. |
| `No_WhatsApp` | `String` | Nomor WhatsApp pelanggan. Format: `628...` |
| `Parameter_1`| `String` | Kolom fleksibel. Bisa untuk `[tagihan]`, `[produk]`, dll. |
| `Parameter_2`| `String` | Kolom fleksibel. Bisa untuk `[periode]`, `[tgl_tempo]`, dll. |
| `Parameter_...`| `String` | Bisa ditambahkan hingga `Parameter_10` untuk fleksibilitas maksimal. |

#### `3. Sheet: TemplatePesan`

Menyimpan template atau format pesan yang bisa digunakan berulang kali.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `TemplateID` | `String` | **(Primary Key)** ID unik untuk setiap template, misal: `TMPL-001`. |
| `UserID` | `String` | **(Foreign Key)** Merujuk ke `UserID` pemilik template. |
| `Nama_Template`| `String` | Nama yang mudah diingat, misal: "Template Tagihan Bulanan". |
| `Isi_Pesan` | `Text` | Isi pesan dengan placeholder, misal: `Halo [nama], ...` |

#### `4. Sheet: JadwalKirim`

Berfungsi sebagai antrean (queue) tugas pengiriman pesan.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `JadwalID` | `String` | **(Primary Key)** ID unik untuk setiap jadwal, misal: `JDWL-001`. |
| `UserID` | `String` | **(Foreign Key)** Merujuk ke `UserID` pemilik jadwal. |
| `TemplateID` | `String` | **(Foreign Key)** Merujuk ke `TemplateID` yang akan digunakan. |
| `Target_Waktu` | `Datetime` | Tanggal dan jam pesan harus mulai dikirim. |
| `Status` | `String` | Status eksekusi: `Menunggu`, `Diproses`, `Selesai`, `Gagal`. |
| `Log_Info` | `Text` | Catatan hasil eksekusi (misal: "Terkirim ke 450/500 pelanggan"). |

### 2.2. Logika Backend (Fungsi-fungsi di Google Apps Script)

Anda bisa memecah file `.gs` Anda untuk organisasi yang lebih baik.

  * **`Auth.gs` (Manajemen Pengguna)**

      * `registerUser(nama, no_wa)`: Membuat `UserID` baru, generate password, mengirim password ke WA pengguna, dan menyimpan ke sheet `Pengguna`.
      * `loginUser(no_wa, password)`: Memverifikasi kredensial dari sheet `Pengguna`.
      * `saveFonnteToken(userID, token)`: Menyimpan token Fonnte ke baris pengguna yang sesuai.

  * **`Data.gs` (Manajemen Data)**

      * `uploadCustomers(userID, dataCSV)`: Menerima data pelanggan dalam format CSV (atau array 2D), memprosesnya, dan menambahkannya ke sheet `Pelanggan` dengan `UserID` yang benar.

  * **`Message.gs` (Manajemen Pesan & Jadwal)**

      * `saveMessageTemplate(userID, namaTemplate, isiPesan)`: Menyimpan atau memperbarui template pesan di sheet `TemplatePesan`.
      * `scheduleMessage(userID, templateID, targetWaktu)`: Membuat entri baru di sheet `JadwalKirim` dengan status `Menunggu`.

  * **`Scheduler.gs` (Eksekutor Otomatis)**

      * `runScheduledJobs()`: **Fungsi ini yang akan di-trigger secara otomatis.**
        1.  Cek sheet `JadwalKirim` untuk baris dengan `Status = 'Menunggu'` dan `Target_Waktu` sudah lewat.
        2.  Ubah statusnya menjadi `Diproses`.
        3.  Ambil `UserID` dan `TemplateID` dari jadwal tersebut.
        4.  Ambil `Fonnte_Token` dan `Isi_Pesan` yang sesuai.
        5.  Ambil *semua* data pelanggan yang cocok dengan `UserID` dari sheet `Pelanggan`.
        6.  Lakukan *looping* untuk setiap pelanggan:
              * Ganti placeholder (`[nama]`, `[Parameter_1]`, dll.) di `Isi_Pesan` dengan data pelanggan.
              * Kirim pesan menggunakan Fonnte API.
              * **PENTING:** Tambahkan jeda acak: `Utilities.sleep(Math.random() * 30000 + 15000);` // Jeda 15-45 detik.
        7.  Setelah loop selesai, ubah status di `JadwalKirim` menjadi `Selesai` dan catat hasilnya di `Log_Info`.

-----

## 🖥️ 3. Skema Frontend (UI/UX - HTML, CSS, JavaScript)

Ini adalah tampilan yang akan dilihat oleh rekan Anda. Buat beberapa halaman atau "view" yang bisa ditampilkan secara dinamis menggunakan JavaScript.

### 3.1. Alur Pengguna (User Flow)

Login/Registrasi → Dashboard → Pengaturan (Input Token) → Kelola Pelanggan (Upload CSV) → Kelola Template → Buat Jadwal → Lihat Status.

### 3.2. Desain Form & Halaman

#### Halaman Login & Registrasi

  * Tampilan simpel dengan dua tab: "Login" dan "Registrasi".
  * **Form Registrasi**:
      * Input Teks: `Nama Lengkap`
      * Input Teks: `Nomor WhatsApp (628...)`
      * Tombol: `Daftar` (akan memicu pengiriman password ke WA).
  * **Form Login**:
      * Input Teks: `Nomor WhatsApp (628...)`
      * Input Password: `Password`
      * Tombol: `Login`

#### Halaman Dashboard (Setelah Login)

Ini adalah halaman utama. Gunakan desain "kartu" (cards) untuk navigasi cepat.

  * **Kartu 1: Pengaturan Akun**

      * Menampilkan nama dan nomor WA pengguna.
      * **Form Simpan Token Fonnte:**
          * Label: `Token Fonnte Anda`
          * Input Teks: `[Input untuk token]`
          * Tombol: `Simpan Token`

  * **Kartu 2: Kelola Pelanggan**

      * Menampilkan jumlah pelanggan saat ini.
      * **Form Upload Data Pelanggan:**
          * Label: `Upload File CSV Pelanggan`
          * Input File: `<input type="file" accept=".csv">`
          * Tombol: `Upload`
          * **Instruksi Penting di bawah form:**
            > "Pastikan file CSV Anda memiliki header. Kolom **wajib** adalah `Nama` dan `No_WhatsApp`. Kolom selanjutnya akan dibaca sebagai parameter. Contoh: `Nama,No_WhatsApp,Tagihan,Periode` akan menjadi parameter `[Tagihan]` dan `[Periode]` di template pesan."
            > [Link untuk mengunduh contoh template CSV]

  * **Kartu 3: Kelola Template Pesan**

      * Menampilkan daftar template yang sudah dibuat.
      * Tombol: `+ Buat Template Baru`
      * **Form Buat/Edit Template Pesan:**
          * Input Teks: `Nama Template` (misal: "Promo Akhir Tahun")

          * Text Area (bidang teks besar): `Isi Pesan`

          * **Bagian Bantuan (Sangat Berguna):**

            > **Parameter yang Tersedia:**

            >   - `[nama]`: Nama pelanggan.
            >   - `[no_whatsapp]`: Nomor WhatsApp pelanggan.
            >   - *Parameter dari file CSV Anda akan tampil di sini setelah Anda upload.*

            > **Tips (Spintax):** Gunakan `{kata1|kata2}` untuk membuat pesan lebih bervariasi. Contoh: `{Halo|Hai|Selamat pagi}`.

          * Tombol: `Simpan Template`

  * **Kartu 4: Buat Jadwal Pengiriman**

      * **Form Penjadwalan:**
          * Dropdown: `Pilih Template Pesan` (diisi dari template yang sudah disimpan).
          * Input Tanggal & Waktu: `<input type="datetime-local">`
          * Tombol: `Jadwalkan Pengiriman`

  * **Tabel: Riwayat & Status Pengiriman**

      * Menampilkan data dari sheet `JadwalKirim` milik pengguna yang sedang login.
      * Kolom: `Nama Template`, `Waktu Dijadwalkan`, `Status`, `Log`.

-----

## 🔄 4. Alur Komunikasi Frontend ↔️ Backend

Komunikasi antara JavaScript di browser (frontend) dengan Google Apps Script (backend) dilakukan menggunakan `google.script.run`.

  * **JavaScript (Frontend)**: Memanggil fungsi backend.
  * **Google Apps Script (Backend)**: Menjalankan fungsi dan bisa mengembalikan data ke frontend.

**Contoh Alur Login:**

1.  Pengguna mengisi form login dan menekan tombol "Login".
2.  JavaScript di frontend menangkap event klik tersebut.
3.  JavaScript mengambil nilai dari input nomor WA dan password.
4.  JavaScript memanggil fungsi backend:
    ```javascript
    // Di dalam file HTML/JS Anda
    const no_wa = document.getElementById('no_wa_input').value;
    const password = document.getElementById('password_input').value;

    google.script.run
        .withSuccessHandler(onLoginSuccess) // Fungsi yang dijalankan jika berhasil
        .withFailureHandler(onLoginFailure) // Fungsi yang dijalankan jika gagal
        .loginUser(no_wa, password); // Memanggil fungsi `loginUser` di GAS

    function onLoginSuccess(result) {
      if (result.success) {
        // Arahkan ke halaman dashboard
        alert("Login berhasil!");
        // Logika untuk menampilkan view dashboard
      } else {
        alert(result.message);
      }
    }

    function onLoginFailure(error) {
      alert("Terjadi kesalahan: " + error.message);
    }
    ```
5.  **Di Google Apps Script (`Auth.gs`)**:
    ```javascript
    function loginUser(no_wa, password) {
      // ... logika untuk mengecek data di sheet `Pengguna` ...
      if (penggunaDitemukan && passwordBenar) {
        return { success: true, message: "Login berhasil." };
      } else {
        return { success: false, message: "Nomor WhatsApp atau password salah." };
      }
    }
    ```

Alur yang sama berlaku untuk semua interaksi: menyimpan token, mengupload file, menyimpan template, dan menjadwalkan pesan. Frontend memanggil fungsi di backend, dan backend memprosesnya di Google Sheets.

Note :
token fonntee saya : q3yqhiRwa2UXzpwGydZ2 untuk mengirikan password login ke pengguna
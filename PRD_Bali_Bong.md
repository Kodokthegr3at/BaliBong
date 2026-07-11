# Product Requirements Document (PRD)
## Bali Bong Homepage & Digital Menu Platform

| | |
|---|---|
| **Nama Produk** | Bali Bong Homepage |
| **Status** | Perencanaan |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 10 Juli 2026 |
| **Pemilik Produk** | Bali Bong Restaurant |

---

## 1. Latar Belakang

Bali Bong adalah restoran dengan menu masakan Indonesia (khususnya Bali) yang membutuhkan kehadiran digital berupa homepage informatif dan menu digital yang dapat diakses pelanggan melalui QR Code di meja. Saat ini belum ada platform digital terpusat untuk menampilkan informasi restoran, menu, dan mempermudah operasional internal (manajemen menu & informasi restoran).

## 2. Tujuan Produk

1. Menyediakan homepage resmi yang menampilkan informasi restoran (profil, akses transportasi, kontak & jam buka).
2. Menyediakan menu digital yang mudah diakses via QR Code di setiap meja, tanpa perlu mengunduh aplikasi.
3. Mendukung pelanggan domestik maupun turis mancanegara dengan dukungan **5 bahasa**: Indonesia, Jepang, Mandarin, Korea, dan Spanyol.
4. Memberikan panel admin agar staf restoran dapat mengelola menu dan informasi restoran secara mandiri tanpa bantuan developer.

## 3. Target Pengguna

| Persona | Deskripsi | Kebutuhan Utama |
|---|---|---|
| Pelanggan Lokal (ID) | Pengunjung berbahasa Indonesia | Info menu, harga, rekomendasi |
| Turis Jepang | Wisatawan berbahasa Jepang | Menu dalam bahasa Jepang, foto/keterangan jelas |
| Turis Tiongkok | Wisatawan berbahasa Mandarin | Menu dalam bahasa Mandarin |
| Turis Korea | Wisatawan berbahasa Korea | Menu dalam bahasa Korea |
| Turis Spanyol/Amerika Latin | Wisatawan berbahasa Spanyol | Menu dalam bahasa Spanyol |
| Admin/Staf Restoran | Pengelola internal | CRUD menu, update info restoran, kelola QR Code |

## 4. Ruang Lingkup & Roadmap (berdasarkan fase)

```
FASE 1 (MVP)          FASE 2                 FASE 3
├─ Halaman Utama       ├─ Integrasi QR Code   ├─ Panel Admin
└─ Menu Digital                               
```

### FASE 1 — Halaman Utama & Menu Digital
**Status:** Direncanakan

**A. Halaman Utama**
- Tentang Bali Bong (profil restoran, cerita singkat/konsep)
- Akses Transportasi (peta lokasi, cara menuju restoran)
- Kontak & Jam Buka (nomor telepon, alamat, jam operasional)
- Dukungan 5 bahasa (switcher bahasa di header)

**B. Menu Digital**
- Daftar Menu Berkategori (Makanan Berat, Makanan Sayur, Manisan, Ala Carte, Rekomendasi)
- Filter & Kategori (filter berdasarkan kategori, harga, jenis)
- Rekomendasi Makanan (menu unggulan/best seller)
- Menu ditampilkan dalam 5 bahasa sesuai pilihan pengguna

### FASE 2 — Integrasi QR Code
**Status:** Direncanakan
- Pembuatan QR Code (generate QR unik per meja/link menu digital)
- Unduh & Cetak QR Code (export QR dalam format printable, misal PDF/PNG untuk dicetak dan ditempel di meja)

### FASE 3 — Panel Admin
**Status:** Direncanakan
- Manajemen Menu (tambah/edit/hapus item menu, harga, kategori, status tersedia/habis, upload foto, terjemahan 5 bahasa)
- Manajemen Informasi Restoran (edit profil, jam buka, kontak, transportasi)

---

## 5. Data Menu (Sumber Data Awal)

Struktur data menu berikut menjadi dasar seed data / skema database. Semua harga dalam Rupiah (IDR). Setiap item memerlukan field terjemahan untuk 5 bahasa (`name_id`, `name_ja`, `name_zh`, `name_ko`, `name_es`) yang akan diisi/diedit melalui Panel Admin.

### 5.1 Makanan Berat
| Nama Menu (ID) | Harga (IDR) |
|---|---|
| Bali Spicy Chicken | 1.280 |
| Ayam dan Tempe Goreng | 1.180 |
| Mie Ayam | 1.180 |
| Ayam Geprek | 1.280 |
| Bali Bong Hamburg | 990 |
| Pho Goreng | 1.080 |
| Bali Bong Original Coconut Mapo Toufu | 990 |
| Bubur Ayam | 1.180 |
| Cumi-Cumi Goreng | 990 |
| Gulai Kambing | 1.300 |
| Tumis Leher Ayam | 990 |
| Sayam Ayam Pedas | 990 |
| Ayam Bumbu Bali | 1.080 |
| Maboroshi no Java Curry (幻のジャワカレー) | 1.080 |
| Nasi Goreng | 1.180 |
| Mie Goreng | 1.180 |
| Bihun Goreng | 1.180 |
| Ayam Goreng Bali Bong | 990 |
| Ayam Bakar | 1.180 |
| Opor Ayam | 990 |
| Telor Balado | 990 |
| Tempe Manis | 750 |
| Tempe Laksa | 750 |
| Udang Cah Terong | 680 |
| Tempe Goreng | 680 |
| Perkedel Kentang | 680 |
| Lumpia Goreng | 620 |
| Perkedel Jagung | 690 |
| Telor Dadar | 690 |
| Sate Ayam (4 tusuk) | 990 |
| Sate Ayam (2 tusuk) | 500 |
| Sate Kambing (4 tusuk) | 980 |
| Sate Kambing (2 tusuk) | 500 |
| Sate Lilit (4 tusuk) | 990 |
| Sate Lilit (2 tusuk) | 500 |
| Sate Campur (masing-masing jenis 2 tusuk, total 6 tusuk) | 1.480 |
| Soto Ayam | 1.180 |
| Ayam dan Sayur Rice Noodle | 1.180 |
| Bakso | 1.180 |
| Mie Laksa | 1.180 |
| Gaprao | 1.080 |
| Bali Bong Chicken Soup Curry | 1.200 |
| Udon Coconut Curry | 1.080 |
| Pho Goreng | 1.180 |
| Ayam dan Sayur Pho | 1.180 |
| Coconut Curry Pho | 1.180 |
| Tom Yum Pho | 1.180 |

> Catatan: Terdapat dua entri "Pho Goreng" dengan harga berbeda (1.080 dan 1.180) — perlu klarifikasi ke pihak restoran apakah ini varian berbeda (mis. porsi kecil/besar) sebelum masuk ke database produksi.

### 5.2 Makanan Sayur
| Nama Menu | Harga (IDR) |
|---|---|
| Gado-Gado | 880 |
| Bali Bong Original Salad | 880 |
| Lumpia Sayur | 880 |
| Tumis Kangkung | 980 |
| Capcay Sayur | 880 |
| Pare Goreng | 880 |

### 5.3 Manisan
| Nama Menu | Harga (IDR) |
|---|---|
| Pisang Goreng (dengan es krim) | 550 |
| Coconut Tapioka | 550 |
| Ice Cream | 300 |
| Waffle Ice Cream | 550 |

### 5.4 Ala Carte (Menu Kecil)
| Nama Menu | Harga (IDR) |
|---|---|
| Udang Goreng Pedas | 680 |
| Kentang Sambal Keju | 490 |
| Mini Ayam Geprek | 690 |
| Kentang Balado | 450 |
| Ikan Asam Manis | 580 |
| Udang Laksa | 680 |
| Kerupuk Udang | 300 |
| Acar | 300 |
| Emping Melinjo | 300 |

### 5.5 Rekomendasi
| Nama Menu | Harga (IDR) |
|---|---|
| Nasi Campur | 1.600 |
| Bali Bong Omurice | 1.380 |
| Rendang | 1.500 |

---

## 6. Fitur Multi-Bahasa (5 Bahasa)

**Bahasa yang didukung:** Indonesia (id), Jepang (ja), Mandarin (zh), Korea (ko), Spanyol (es)

### Requirement
- Language switcher pada header, tersedia di semua halaman (Homepage & Menu).
- Bahasa default: Indonesia; deteksi otomatis opsional berdasarkan `Accept-Language` browser, dengan fallback ke Indonesia.
- Seluruh teks statis UI (navigasi, label, tombol) diterjemahkan menggunakan i18n (JSON translation file per bahasa).
- Seluruh konten dinamis (nama menu, deskripsi menu, info restoran) disimpan per-bahasa di database dan dapat diedit dari Panel Admin.
- Format harga tetap dalam Rupiah (IDR) di semua bahasa (tidak dikonversi mata uang), kecuali disepakati lain.
- Font & layout harus mendukung karakter CJK (Jepang, Mandarin, Korea) dan Latin dengan diakritik (Spanyol).

### Implementasi Teknis
- Frontend: Angular i18n (`@angular/localize`) atau library `ngx-translate` untuk translasi UI statis secara reaktif tanpa rebuild per bahasa (`ngx-translate` direkomendasikan agar switch bahasa tidak perlu reload).
- Backend: tabel translasi terpisah per entitas (lihat skema database Bagian 8) agar admin dapat mengelola 5 versi bahasa per item menu.

---

## 7. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| Performa | Halaman menu harus load < 2 detik pada koneksi 4G |
| Responsif | Mobile-first (mayoritas akses via QR Code dari smartphone) |
| Ketersediaan | Uptime ≥ 99.5% (mengandalkan Vercel Edge Network) |
| Keamanan | Panel Admin dilindungi autentikasi (JWT), role-based access |
| SEO | Homepage harus SEO-friendly (meta tag multi-bahasa, sitemap) |
| Aksesibilitas | Kontras warna & ukuran font memadai, mendukung pembesaran teks |
| Skalabilitas | Struktur data mendukung penambahan menu/bahasa baru tanpa migrasi besar |

---

## 8. Arsitektur Teknis

### 8.1 Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Angular (SPA/SSR dengan Angular Universal untuk SEO) |
| Backend | Node.js (Express.js atau NestJS untuk struktur modular) |
| Database | PostgreSQL |
| Deployment | Vercel |
| Autentikasi Admin | JWT-based auth |
| QR Code | Library `qrcode` (Node.js) untuk generate; export PNG/PDF |

### 8.2 Catatan Deployment di Vercel
- Frontend Angular di-deploy sebagai static build (`ng build`) atau via Angular Universal (SSR) menggunakan Vercel's Node.js runtime.
- Backend Node.js/Express di-deploy sebagai **Vercel Serverless Functions** (folder `/api`), atau sebagai layanan terpisah (mis. Railway/Render) jika dibutuhkan koneksi database persisten yang lebih stabil — karena serverless function bersifat stateless dan cold-start dapat memengaruhi koneksi database.
- Database PostgreSQL di-hosting terpisah (mis. Supabase, Neon, atau Vercel Postgres) karena Vercel tidak menyediakan hosting PostgreSQL native — cukup koneksi dari serverless function.
- Gunakan connection pooling (mis. PgBouncer / Prisma Data Proxy) untuk menghindari exhaustion koneksi database akibat sifat serverless yang scale horizontal secara otomatis.

### 8.3 Skema Database (Draft)

```sql
-- Tabel restoran info
CREATE TABLE restaurant_info (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL,       -- e.g. 'about', 'transportation', 'contact', 'hours'
    lang VARCHAR(5) NOT NULL,       -- id, ja, zh, ko, es
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel kategori menu
CREATE TABLE menu_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL   -- makanan_berat, makanan_sayur, manisan, ala_carte, rekomendasi
);

CREATE TABLE menu_category_translations (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES menu_categories(id),
    lang VARCHAR(5) NOT NULL,
    name VARCHAR(100) NOT NULL
);

-- Tabel item menu
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES menu_categories(id),
    price INT NOT NULL,               -- dalam IDR
    image_url TEXT,
    is_recommended BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel terjemahan nama & deskripsi menu (5 bahasa)
CREATE TABLE menu_item_translations (
    id SERIAL PRIMARY KEY,
    menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
    lang VARCHAR(5) NOT NULL,         -- id, ja, zh, ko, es
    name VARCHAR(150) NOT NULL,
    description TEXT,
    UNIQUE(menu_item_id, lang)
);

-- Tabel QR Code
CREATE TABLE qr_codes (
    id SERIAL PRIMARY KEY,
    table_label VARCHAR(50),          -- mis. "Meja 1"
    target_url TEXT NOT NULL,
    qr_image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel admin user
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 8.4 Contoh API Endpoint (Draft)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/menu?lang=id` | Ambil semua menu beserta kategori, dalam bahasa tertentu |
| GET | `/api/menu/:id?lang=ja` | Detail satu item menu dalam bahasa tertentu |
| GET | `/api/restaurant-info?lang=ko` | Ambil info restoran (about, transportasi, kontak, jam buka) |
| POST | `/api/admin/menu` | (Admin) Tambah item menu baru + terjemahan 5 bahasa |
| PUT | `/api/admin/menu/:id` | (Admin) Update item menu |
| DELETE | `/api/admin/menu/:id` | (Admin) Hapus item menu |
| POST | `/api/admin/qr` | (Admin) Generate QR Code baru untuk meja |
| GET | `/api/admin/qr/:id/download` | (Admin) Unduh QR Code (PNG/PDF) |
| POST | `/api/admin/auth/login` | Login admin (menghasilkan JWT) |

---

## 9. Metrik Keberhasilan (Success Metrics)

| Metrik | Target |
|---|---|
| Waktu load halaman menu | < 2 detik |
| Adopsi QR Code oleh pelanggan | ≥ 80% pelanggan dine-in memindai QR |
| Pengurangan waktu update menu oleh staf | Dari manual (cetak ulang) menjadi < 5 menit via Panel Admin |
| Cakupan bahasa terpakai | Statistik penggunaan bahasa non-Indonesia terekam untuk evaluasi turis |

## 10. Risiko & Asumsi

- **Asumsi:** Data menu final (termasuk klarifikasi duplikasi "Pho Goreng") akan dikonfirmasi ulang oleh pihak restoran sebelum go-live.
- **Risiko:** Terjemahan 5 bahasa untuk seluruh menu memerlukan effort tambahan (jasa penerjemah/translator profesional) di luar scope development.
- **Risiko:** Koneksi database dari Vercel serverless function perlu strategi connection pooling agar tidak terjadi bottleneck saat traffic tinggi (jam makan siang/malam).
- **Asumsi:** Foto menu belum tersedia di data awal — perlu proses fotografi produk sebelum Fase 1 rilis penuh.

## 11. Out of Scope (Saat Ini)

- Sistem pemesanan online / online ordering & payment
- Sistem reservasi meja
- Aplikasi mobile native (iOS/Android)
- Program loyalitas pelanggan

---

*Dokumen ini adalah draft awal berdasarkan roadmap fase (Fase 1–3) dan data menu yang tersedia. Diperlukan review lebih lanjut dengan stakeholder Bali Bong untuk finalisasi scope, terutama terkait duplikasi data menu dan aset foto.*

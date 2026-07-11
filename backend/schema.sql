-- SQL Schema for Bali Bong Database

-- Tabel restoran info
CREATE TABLE IF NOT EXISTS restaurant_info (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL,       -- e.g. 'about', 'transportation', 'contact', 'hours'
    lang VARCHAR(5) NOT NULL,       -- id, ja, zh, ko, es
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(key, lang)
);

-- Tabel kategori menu
CREATE TABLE IF NOT EXISTS menu_categories (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL   -- makanan_berat, makanan_sayur, manisan, ala_carte, rekomendasi
);

CREATE TABLE IF NOT EXISTS menu_category_translations (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES menu_categories(id) ON DELETE CASCADE,
    lang VARCHAR(5) NOT NULL,
    name VARCHAR(100) NOT NULL,
    UNIQUE(category_id, lang)
);

-- Tabel item menu
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES menu_categories(id) ON DELETE SET NULL,
    price INT NOT NULL,               -- dalam IDR
    image_url TEXT,
    is_recommended BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabel terjemahan nama & deskripsi menu (5 bahasa)
CREATE TABLE IF NOT EXISTS menu_item_translations (
    id SERIAL PRIMARY KEY,
    menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
    lang VARCHAR(5) NOT NULL,         -- id, ja, zh, ko, es
    name VARCHAR(150) NOT NULL,
    description TEXT,
    UNIQUE(menu_item_id, lang)
);

-- Tabel QR Code
CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    table_label VARCHAR(50),          -- mis. "Meja 1"
    target_url TEXT NOT NULL,
    qr_image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabel admin user
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);

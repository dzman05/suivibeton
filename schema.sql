-- Drop tables if they exist
DROP TABLE IF EXISTS production;
DROP TABLE IF EXISTS formulations;
DROP TABLE IF EXISTS users;

-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer', -- 'admin' (Centrale) or 'viewer'
    full_name TEXT
);

-- Formulations Table
CREATE TABLE formulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_formulation TEXT NOT NULL UNIQUE,
    designation TEXT NOT NULL,
    dosage_cement REAL NOT NULL,        -- kg/m3
    dosage_water REAL NOT NULL,         -- L/m3
    dosage_gravillon_15_25 REAL NOT NULL, -- kg/m3
    dosage_gravillon_8_15 REAL NOT NULL,  -- kg/m3
    dosage_polyflow REAL NOT NULL,      -- kg/m3 (Poly Flow SR 8800)
    dosage_sable_0_1 REAL NOT NULL,      -- kg/m3
    dosage_sable_0_3 REAL NOT NULL,      -- kg/m3
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Production Table
CREATE TABLE production (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_production DATE NOT NULL,
    formulation_id INTEGER NOT NULL,
    quantity_m3 REAL NOT NULL,
    centrale_name TEXT DEFAULT 'H57.1',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (formulation_id) REFERENCES formulations(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Initial Users (Password: Cosider2026)
INSERT INTO users (username, password_hash, role, full_name) VALUES ('admin', 'Cosider2026', 'admin', 'Administrateur');
INSERT INTO users (username, password_hash, role, full_name) VALUES ('gestion', 'Cosider2026', 'gestion', 'Contrôle de Gestion');
INSERT INTO users (username, password_hash, role, full_name) VALUES ('magasin', 'Cosider2026', 'magasin', 'Magasinier');

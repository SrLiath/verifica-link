const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    // Tabela clients
    db.run(`
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            speed INTEGER DEFAULT 0
        )
    `);

    // Tabela items (se ainda for usada)
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabela links
    db.run(`
        CREATE TABLE IF NOT EXISTS links (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            name TEXT NOT NULL,
            status TEXT CHECK(status IN ('UP', 'DOWN')) NOT NULL,
            mac_address TEXT,
            mtu INTEGER,
            speed TEXT,
            running BOOLEAN,
            comment TEXT,
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Nova tabela services
    db.run(`
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id TEXT NOT NULL,
            service_name TEXT NOT NULL,
            is_running INTEGER NOT NULL DEFAULT 0 CHECK(is_running IN (0, 1)),
            last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

module.exports = db;
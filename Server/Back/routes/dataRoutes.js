const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

function generateUniqueId() {
    const timestamp = Date.now();
    const randomChars = Math.random().toString(36).substring(2, 8); // ex: 'a1b2c3'
    return `${timestamp}${randomChars}`;
}

const db = new sqlite3.Database('./database.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id TEXT PRIMARY KEY,  -- Agora usamos TEXT pois tem letras e números
            name TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

router.post('/insert', (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Campos name e description são obrigatórios.' });
    }

    const id = generateUniqueId(); 

    const stmt = db.prepare(`
        INSERT INTO items (id, name, description)
        VALUES (?, ?, ?)
    `);

    stmt.run(id, name, description, function (err) {
        if (err) {
            console.error('Erro ao inserir no banco:', err.message);
            return res.status(500).json({ error: 'Erro ao salvar item.' });
        }

        const newItem = {
            id,
            name,
            description,
            created_at: new Date().toISOString()
        };

        res.status(201).json(newItem);
    });

    stmt.finalize();
});

module.exports = router;
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();
const db = new sqlite3.Database('./database.db');
const { encriptar } = require('../helper/crypt.js');

function generateUniqueId() {
    const timestamp = Date.now();
    const randomChars = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${randomChars}`;
}

/**
 * @route   GET /api/clients
 * @desc    Retorna todos os clientes com seus links e status do serviço
 */
router.get('/clients', (req, res) => {
    const sql = `
        SELECT 
          c.id AS client_id,
          c.name AS client_name,
          l.id AS link_id,
          l.name AS link_name,
          l.status AS link_status,
          s.service_name,
          s.is_running,
          s.last_checked
        FROM clients c
        LEFT JOIN links l ON c.id = l.client_id
        LEFT JOIN services s ON c.id = s.client_id
        ORDER BY c.id;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const clientsMap = {};

        rows.forEach(row => {
            if (!clientsMap[row.client_id]) {
                clientsMap[row.client_id] = {
                    id: row.client_id,
                    name: row.client_name,
                    links: [],
                    service: {
                        name: row.service_name || 'Nenhum serviço',
                        running: row.is_running ? true : false,
                        lastChecked: row.last_checked || null
                    }
                };
            }

            if (row.link_id) {
                clientsMap[row.client_id].links.push({
                    id: row.link_id,
                    name: row.link_name,
                    status: row.link_status
                });
            }
        });

        const clientsList = Object.values(clientsMap);

        res.json(clientsList);
    });
});

/**
 * @route POST /api/insert
 * @desc Insere novos itens com ID único
 */
router.post('/insert', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Campo name é obrigatório.' });
    }

    db.run(
        `INSERT INTO clients (name, speed) VALUES (?, 0)`,
        [name],
        function (err) {
            if (err) {
                console.error('Erro ao inserir cliente:', err.message);
                return res.status(500).json({ error: 'Erro ao salvar cliente.' });
            }

            const nomeCriptografado = encriptar(`${name}_${this.lastID}`);

            res.status(201).json({
                id: this.lastID,
                name: nomeCriptografado,
                real: name,
                created_at: new Date().toISOString()
            });
        }
    );
});

/**
 * @route DELETE /api/clients/:id
 * @desc Remove cliente e seus links associados
 */
router.delete('/clients/:id', (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'ID inválido.' });
    }

    db.run('DELETE FROM clients WHERE id = ?', [id], function (err) {
        if (err) {
            console.error('Erro ao deletar cliente:', err.message);
            return res.status(500).json({ error: 'Erro ao deletar cliente.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }

        db.run('DELETE FROM links WHERE client_id = ?', [id], (err) => {
            if (err) console.error('Erro ao deletar links associados:', err.message);
        });

        db.run('DELETE FROM services WHERE client_id = ?', [id], (err) => {
            if (err) console.error('Erro ao deletar serviços associados:', err.message);
        });

        res.json({ message: 'Cliente excluído com sucesso.', deletedId: id });
    });
});

module.exports = router;
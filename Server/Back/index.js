const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http');

const websocketRoutes = require('./routes/dataRoutes');

app.use(express.json());
app.get('/', (req, res) => {
    return res.send('Servidor WebSocket ativo. Conecte-se para enviar dados.');
})
app.use('/api', websocketRoutes);

const dbFile = './database.db';
if (!fs.existsSync(dbFile)) {
    fs.openSync(dbFile, 'w');
}

const db = new sqlite3.Database(dbFile);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS interfaces (
            default_name TEXT PRIMARY KEY,
            name TEXT,
            mac_address TEXT,
            mtu INTEGER,
            speed TEXT,
            running BOOLEAN,
            comment TEXT,
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
    const clientId = urlParams.get('id');

    if (!clientId) {
        console.log('Conexão rejeitada: ID não fornecido.');
        ws.send(JSON.stringify({ error: 'ID não fornecido.' }));
        ws.close();
        return;
    }

    console.log(`Cliente conectado com ID: ${clientId}`);

    // Você pode salvar o ID na própria conexão para uso futuro
    ws.clientId = clientId;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.Re && Array.isArray(data.Re)) {
                data.Re.forEach((interfaceData) => {
                    const interfaceInfo = interfaceData.Map;
                    const defaultName = interfaceInfo["default-name"];

                    // Verifica se o registro já existe
                    db.get(
                        'SELECT 1 FROM interfaces WHERE default_name = ?',
                        [defaultName],
                        (err, row) => {
                            if (err) {
                                console.error('Erro ao consultar banco:', err.message);
                                return;
                            }

                            if (!row) {
                                // Registro NÃO existe
                                ws.send(JSON.stringify({
                                    error: `Registro com default_name "${defaultName}" não encontrado.`,
                                    action: 'update_rejected'
                                }));
                                console.log(`Tentativa de atualizar registro inexistente: ${defaultName}`);
                                return;
                            }

                            // Registro existe → pode atualizar
                            const stmt = db.prepare(`
                                UPDATE interfaces SET
                                    name = ?,
                                    mac_address = ?,
                                    mtu = ?,
                                    speed = ?,
                                    running = ?,
                                    comment = ?
                                WHERE default_name = ?
                            `);

                            stmt.run(
                                interfaceInfo.name,
                                interfaceInfo["mac-address"],
                                parseInt(interfaceInfo.mtu),
                                interfaceInfo.speed,
                                interfaceInfo.running === "true" ? 1 : 0,
                                interfaceInfo.comment || null,
                                defaultName
                            );
                            stmt.finalize();

                            console.log(`Dados da interface ${interfaceInfo.name} atualizados.`);
                        }
                    );
                });
            }
        } catch (error) {
            console.error('Erro ao processar mensagem:', error.message);
        }
    });

    ws.on('close', () => {
        console.log(`Cliente desconectado (ID: ${ws.clientId})`);
    });
});

server.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
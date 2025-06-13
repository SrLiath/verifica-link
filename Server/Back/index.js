const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { decriptar } = require('./helper/crypt');
const websocketRoutes = require('./routes/dataRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Servidor WebSocket ativo. Conecte-se para enviar dados.'));
app.use(websocketRoutes);

const dbFile = './database.db';
if (!fs.existsSync(dbFile)) fs.openSync(dbFile, 'w');

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
  } else {
    db.run(`
            CREATE TABLE IF NOT EXISTS services (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              client_id TEXT NOT NULL,
              service_name TEXT NOT NULL,
              is_running INTEGER NOT NULL DEFAULT 0,
              last_checked DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela services:', err.message);
      }
    });
  }
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');
  const encryptedClientId = urlParams.get('token');

  if (!encryptedClientId) {
    ws.send(JSON.stringify({ error: 'ID não fornecido.' }));
    ws.close();
    return;
  }

  let decryptedId;
  try {
    decryptedId = decriptar(encryptedClientId);
  } catch (err) {
    ws.send(JSON.stringify({ error: 'ID inválido ou corrompido.' }));
    ws.close();
    return;
  }

  const [clientName, uniqueId] = decryptedId.split('_');
  if (!clientName || !uniqueId) {
    ws.send(JSON.stringify({ error: 'Formato de ID inválido.' }));
    ws.close();
    return;
  }

  db.get('SELECT id FROM clients WHERE name = ?', [clientName], (err, row) => {
    if (err || !row) {
      ws.send(JSON.stringify({ error: 'Cliente não autorizado.' }));
      ws.close();
      return;
    }

    ws.clientId = uniqueId;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Atualiza status do serviço
        const serviceName = data.service;
        const isServiceRunning = Boolean(data.service_running);

        if (serviceName !== undefined && typeof isServiceRunning !== 'undefined') {
          db.get(
            'SELECT * FROM services WHERE client_id = ?',
            [uniqueId],
            (err, row) => {
              if (err) {
                console.error('Erro ao verificar serviço:', err.message);
                return;
              }

              const now = new Date().toISOString();

              if (!row) {
                // Inserir novo registro de serviço
                db.run(
                  `
                                    INSERT INTO services (
                                      client_id, service_name, is_running, last_checked
                                    ) VALUES (?, ?, ?, ?)
                                    `,
                  [uniqueId, serviceName, isServiceRunning ? 1 : 0, now],
                  function (err) {
                    if (err) {
                      console.error('Erro ao inserir serviço:', err.message);
                      ws.send(
                        JSON.stringify({
                          error: `Falha ao inserir serviço "${serviceName}".`,
                          action: 'service_insert_failed',
                        })
                      );
                    } else {
                      console.log(`Serviço "${serviceName}" inserido.`);
                    }
                  }
                );
              } else {
                // Atualizar serviço existente
                db.run(
                  `
                                    UPDATE services SET
                                      service_name = ?,
                                      is_running = ?,
                                      last_checked = ?
                                    WHERE client_id = ?
                                    `,
                  [serviceName, isServiceRunning ? 1 : 0, now, uniqueId],
                  function (err) {
                    if (err) {
                      console.error('Erro ao atualizar serviço:', err.message);
                      ws.send(
                        JSON.stringify({
                          error: `Erro ao atualizar serviço "${serviceName}".`,
                          action: 'service_update_failed',
                        })
                      );
                    } else {
                      console.log(`Serviço "${serviceName}" atualizado.`);
                    }
                  }
                );
              }
            }
          );
        }

        // Processamento das interfaces do MikroTik
        if (data.mikrotik?.[0]?.Re && Array.isArray(data.mikrotik[0].Re)) {
          data.mikrotik[0].Re.forEach((interfaceData) => {
            const interfaceInfo = interfaceData.Map;
            const defaultName = interfaceInfo["default-name"];

            db.get(
              'SELECT * FROM links WHERE id = ?',
              [defaultName],
              (err, linkRow) => {
                if (err) {
                  console.error('Erro ao buscar interface:', err.message);
                  return;
                }

                if (!linkRow) {
                  db.run(
                    `
                                        INSERT INTO links (
                                          id, client_id, name, mac_address, mtu, speed, running, comment, status
                                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                        `,
                    [
                      defaultName,
                      uniqueId,
                      interfaceInfo.name,
                      interfaceInfo["mac-address"],
                      parseInt(interfaceInfo.mtu),
                      data.speedtest?.download_mbps || null,
                      interfaceInfo.running === "true" ? 1 : 0,
                      interfaceInfo.comment || null,
                      interfaceInfo.running === "true" ? 'UP' : 'DOWN'
                    ],
                    function (err) {
                      if (err) {
                        console.error('Erro ao criar interface:', err.message);
                      } else {
                        console.log(`Interface "${defaultName}" criada.`);
                      }
                    }
                  );
                } else {
                  db.prepare(`
                                        UPDATE links SET
                                          name = ?, mac_address = ?, mtu = ?, speed = ?, 
                                          running = ?, comment = ?
                                        WHERE id = ?
                                    `).run(
                    interfaceInfo.name,
                    interfaceInfo["mac-address"],
                    parseInt(interfaceInfo.mtu),
                    data.speedtest?.download_mbps || null,
                    interfaceInfo.running === "true" ? 1 : 0,
                    interfaceInfo.comment || null,
                    defaultName
                  ).finalize((err) => {
                    if (err) {
                      console.error('Erro ao atualizar interface:', err.message);
                    } else {
                      console.log(`Interface "${defaultName}" atualizada.`);
                    }
                  });
                }
              }
            );
          });
        }

        ws.send(JSON.stringify({ success: true, message: 'Dados processados com sucesso.' }));

      } catch (error) {
        console.error('Erro ao processar mensagem:', error.message);
        ws.send(JSON.stringify({ error: 'Erro ao processar dados.', action: 'parse_error' }));
      }
    });

    ws.on('close', () => {
      console.log(`Cliente desconectado: ${clientName} (ID: ${uniqueId})`);
    });
  });
});

server.listen(3001, () => {
  console.log('Servidor rodando em http://localhost:3001');
});
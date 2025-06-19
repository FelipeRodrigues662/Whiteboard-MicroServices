// wsClient.js
const WebSocket = require("ws");
const axios = require("axios");
require('dotenv').config();

// Use variável de ambiente para o endereço do core
const SERVER_URL = process.env.CORE_WS_URL; // DEV padrão
const RETRY_INTERVAL = 30000;
const SEND_INTERVAL = 10000;

let ws;

async function getRoomCount() {
  try {
    const res = await axios.get("http://session-service:PORT/sessions/active-count");
    return res.data.activeSessions || 0;
  } catch {
    return 0;
  }
}

async function getUserCount() {
  try {
    const res = await axios.get("http://session-service:PORT/sessions/connected-users");
    return res.data.count || 0;
  } catch {
    return 0;
  }
}

function connect() {
  ws = new WebSocket(SERVER_URL);

  ws.on("open", () => {
    console.log("[✓] Conectado ao whiteboard-core");

    setInterval(async () => {
      const roomCount = await getRoomCount();
      const userCount = await getUserCount();

      const data = {
        serverId: "main-server-6",
        name: "Servidor Grupo_6",
        roomCount,
        userCount,
        status: "online",
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
        console.log("[→] Dados enviados:", data);
      }
    }, SEND_INTERVAL);
  });

  ws.on("close", () => {
    console.warn("[!] Conexão fechada. Tentando reconectar...");
    setTimeout(connect, RETRY_INTERVAL);
  });

  ws.on("error", (err) => {
    console.error("[x] Erro na conexão:", err.message);
    ws.close();
  });
}

connect();
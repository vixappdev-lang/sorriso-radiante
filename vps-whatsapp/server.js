/**
 * Levii WhatsApp VPS — Baileys
 * API HTTP autenticada via Bearer token
 * Reconexão automática exponencial, sessão persistida em auth/
 */

const express = require("express");
const pino = require("pino");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");

const PORT = parseInt(process.env.PORT || "3000", 10);
const TOKEN = process.env.LEVII_TOKEN;
const AUTH_DIR = path.resolve(__dirname, "auth");

if (!TOKEN) {
  console.error("FATAL: LEVII_TOKEN env var required");
  process.exit(1);
}
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

const logger = pino({ level: "warn" });

let sock = null;
let currentQR = null;          // base64 image
let connState = "disconnected"; // 'connecting'|'qr'|'connected'|'disconnected'
let phoneNumber = null;
let startedAt = Date.now();
let messagesSent = 0;
let reconnectAttempts = 0;
let reconnectTimer = null;

async function connect() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    connState = "connecting";

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      browser: Browsers.macOS("Levii"),
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: false,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          currentQR = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
          connState = "qr";
          console.log("[wa] QR code disponível");
        } catch (e) { console.error("[wa] qr error", e); }
      }

      if (connection === "open") {
        connState = "connected";
        currentQR = null;
        reconnectAttempts = 0;
        phoneNumber = sock.user?.id?.split(":")[0] || null;
        console.log(`[wa] CONECTADO como ${phoneNumber}`);
      }

      if (connection === "close") {
        connState = "disconnected";
        const code = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        console.log(`[wa] desconectado (code=${code}, loggedOut=${loggedOut})`);

        if (!loggedOut) {
          // Reconnect com backoff exponencial (cap 60s)
          reconnectAttempts++;
          const delay = Math.min(60000, 1500 * Math.pow(2, Math.min(reconnectAttempts, 6)));
          console.log(`[wa] reconectando em ${delay}ms (tentativa ${reconnectAttempts})`);
          reconnectTimer = setTimeout(connect, delay);
        } else {
          // Sessão deslogada → limpa para forçar novo QR
          try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); fs.mkdirSync(AUTH_DIR); } catch {}
          reconnectTimer = setTimeout(connect, 2000);
        }
      }
    });

    // Não processamos mensagens recebidas por padrão (escopo: enviar)
    // Para receber, escute sock.ev.on("messages.upsert", ...)
  } catch (e) {
    console.error("[wa] connect error", e);
    connState = "disconnected";
    reconnectAttempts++;
    const delay = Math.min(60000, 1500 * Math.pow(2, Math.min(reconnectAttempts, 6)));
    reconnectTimer = setTimeout(connect, delay);
  }
}

function jidFromNumber(num) {
  const digits = String(num).replace(/\D/g, "");
  return `${digits}@s.whatsapp.net`;
}

/* ======================== HTTP API ======================== */

const app = express();
app.use(express.json({ limit: "1mb" }));

// Auth middleware
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ") || h.slice(7) !== TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.get("/status", (_, res) => {
  res.json({
    status: connState,
    phone: phoneNumber,
    uptime_s: Math.floor((Date.now() - startedAt) / 1000),
    messages_sent: messagesSent,
    reconnect_attempts: reconnectAttempts,
  });
});

app.get("/info", (_, res) => {
  res.json({
    version: require("./package.json").version,
    node: process.version,
    started_at: new Date(startedAt).toISOString(),
    uptime_s: Math.floor((Date.now() - startedAt) / 1000),
    state: connState,
    phone: phoneNumber,
    messages_sent: messagesSent,
  });
});

app.get("/qr", (_, res) => {
  if (connState === "connected") return res.json({ status: "connected", qr: null });
  if (!currentQR) return res.json({ status: connState, qr: null, message: "Aguardando QR..." });
  res.json({ status: "qr", qr: currentQR });
});

app.post("/send", async (req, res) => {
  if (connState !== "connected") return res.status(503).json({ error: "not_connected", state: connState });
  const { to, message } = req.body || {};
  if (!to || !message) return res.status(400).json({ error: "missing_to_or_message" });
  try {
    const jid = jidFromNumber(to);
    const result = await sock.sendMessage(jid, { text: String(message) });
    messagesSent++;
    res.json({ ok: true, id: result?.key?.id, to: jid });
  } catch (e) {
    console.error("[wa] send error", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/restart", async (_, res) => {
  try { sock?.end?.(undefined); } catch {}
  setTimeout(connect, 500);
  res.json({ ok: true });
});

app.post("/logout", async (_, res) => {
  try { await sock?.logout(); } catch {}
  try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); fs.mkdirSync(AUTH_DIR); } catch {}
  setTimeout(connect, 800);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[http] Levii WA escutando em :${PORT}`);
  connect();
});

// Graceful shutdown
process.on("SIGTERM", () => { try { sock?.end?.(undefined); } catch {} process.exit(0); });
process.on("SIGINT",  () => { try { sock?.end?.(undefined); } catch {} process.exit(0); });

// Empacota e retorna o ZIP completo da VPS WhatsApp (Baileys + install.sh)
// Para ser baixado pelo admin diretamente pelo modal de configuração.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PACKAGE_JSON = `{
  "name": "lynecloud-whatsapp-vps",
  "version": "1.1.0",
  "description": "LyneCloud WhatsApp VPS — Baileys + Express + Bot Webhook",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.7",
    "express": "^4.21.0",
    "pino": "^9.4.0",
    "qrcode": "^1.5.4",
    "node-fetch": "^2.7.0"
  },
  "engines": {
    "node": ">=18"
  }
}
`;

const SERVER_JS = `/**
 * LyneCloud WhatsApp VPS — Baileys
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
let currentQR = null;
let connState = "disconnected";
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
      version, auth: state, logger,
      browser: Browsers.macOS("LyneCloud"),
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
        console.log(\`[wa] CONECTADO como \${phoneNumber}\`);
      }
      if (connection === "close") {
        connState = "disconnected";
        const code = lastDisconnect?.error?.output?.statusCode;
        const loggedOut = code === DisconnectReason.loggedOut;
        console.log(\`[wa] desconectado (code=\${code}, loggedOut=\${loggedOut})\`);
        if (!loggedOut) {
          reconnectAttempts++;
          const delay = Math.min(60000, 1500 * Math.pow(2, Math.min(reconnectAttempts, 6)));
          reconnectTimer = setTimeout(connect, delay);
        } else {
          try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); fs.mkdirSync(AUTH_DIR); } catch {}
          reconnectTimer = setTimeout(connect, 2000);
        }
      }
    });
  } catch (e) {
    console.error("[wa] connect error", e);
    connState = "disconnected";
    reconnectAttempts++;
    const delay = Math.min(60000, 1500 * Math.pow(2, Math.min(reconnectAttempts, 6)));
    reconnectTimer = setTimeout(connect, delay);
  }
}

function jidFromNumber(num) {
  const digits = String(num).replace(/\\D/g, "");
  return \`\${digits}@s.whatsapp.net\`;
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  if (req.path === "/health") return next();
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ") || h.slice(7) !== TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
});

app.get("/health", (_, res) => res.json({ ok: true }));
app.get("/status", (_, res) => res.json({
  status: connState, phone: phoneNumber,
  uptime_s: Math.floor((Date.now() - startedAt) / 1000),
  messages_sent: messagesSent, reconnect_attempts: reconnectAttempts,
}));
app.get("/info", (_, res) => res.json({
  version: require("./package.json").version, node: process.version,
  started_at: new Date(startedAt).toISOString(),
  uptime_s: Math.floor((Date.now() - startedAt) / 1000),
  state: connState, phone: phoneNumber, messages_sent: messagesSent,
}));
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
  console.log(\`[http] LyneCloud WA escutando em :\${PORT}\`);
  connect();
});

process.on("SIGTERM", () => { try { sock?.end?.(undefined); } catch {} process.exit(0); });
process.on("SIGINT",  () => { try { sock?.end?.(undefined); } catch {} process.exit(0); });
`;

const ECOSYSTEM_CONFIG = `module.exports = {
  apps: [{
    name: "lynecloud-wa",
    script: "./server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "300M",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
    },
  }],
};
`;

const INSTALL_SH = `#!/bin/bash
# LyneCloud WhatsApp VPS — Instalador automatizado para Ubuntu 22.04+
# Execute como root: sudo bash install.sh

set -e

GREEN='\\033[0;32m'
BLUE='\\033[0;34m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

echo -e "\${BLUE}═══════════════════════════════════════════════════\${NC}"
echo -e "\${BLUE}  LyneCloud WhatsApp VPS — Instalação automatizada\${NC}"
echo -e "\${BLUE}═══════════════════════════════════════════════════\${NC}"

# 1. Atualizar sistema
echo -e "\${YELLOW}» Atualizando sistema...\${NC}"
apt-get update -qq
apt-get upgrade -y -qq

# 2. Node.js 20
if ! command -v node &> /dev/null; then
  echo -e "\${YELLOW}» Instalando Node.js 20...\${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

# 3. PM2 global
if ! command -v pm2 &> /dev/null; then
  echo -e "\${YELLOW}» Instalando PM2...\${NC}"
  npm install -g pm2
fi

# 4. Token
if [ -z "\$LEVII_TOKEN" ]; then
  LEVII_TOKEN=\$(openssl rand -hex 32)
  echo -e "\${GREEN}» Token gerado:\${NC} \$LEVII_TOKEN"
  echo -e "\${YELLOW}  ⚠ COPIE ESTE TOKEN AGORA! Cole no painel admin LyneCloud.\${NC}"
fi

# 5. Instalar deps
echo -e "\${YELLOW}» Instalando dependências (pode demorar ~2min)...\${NC}"
npm install --production --silent

# 6. Persistir token em .env (PM2 lê via ecosystem)
cat > .env <<EOF
LEVII_TOKEN=\$LEVII_TOKEN
PORT=3000
EOF

# 7. Atualizar ecosystem para ler env
cat > ecosystem.config.js <<'EOF'
require("dotenv").config();
module.exports = {
  apps: [{
    name: "lynecloud-wa",
    script: "./server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "300M",
    env: {
      NODE_ENV: "production",
      PORT: process.env.PORT || 3000,
      LEVII_TOKEN: process.env.LEVII_TOKEN,
    },
  }],
};
EOF
npm install dotenv --silent

# 8. Iniciar via PM2
echo -e "\${YELLOW}» Iniciando serviço via PM2...\${NC}"
pm2 delete lynecloud-wa 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash || true

# 9. Firewall
if command -v ufw &> /dev/null; then
  ufw allow 3000/tcp 2>/dev/null || true
fi

echo ""
echo -e "\${GREEN}═══════════════════════════════════════════════════\${NC}"
echo -e "\${GREEN}  ✓ Instalação concluída!\${NC}"
echo -e "\${GREEN}═══════════════════════════════════════════════════\${NC}"
echo ""
echo -e "\${BLUE}URL da VPS:\${NC}     http://\$(curl -s ifconfig.me):3000"
echo -e "\${BLUE}Token:\${NC}          \$LEVII_TOKEN"
echo ""
echo -e "\${YELLOW}Próximos passos:\${NC}"
echo "  1. Copie URL e Token acima"
echo "  2. Cole no Painel Admin > WhatsApp > ⚙ Configurar VPS"
echo "  3. Clique em 'Conectar' para gerar QR Code"
echo ""
echo -e "Para HTTPS (recomendado): aponte um subdomínio para este IP"
echo -e "e rode: \${BLUE}apt install nginx certbot python3-certbot-nginx -y\${NC}"
echo ""
echo -e "Logs em tempo real: \${BLUE}pm2 logs lynecloud-wa\${NC}"
echo -e "Status do serviço:  \${BLUE}pm2 status\${NC}"
`;

const README_MD = `# LyneCloud WhatsApp VPS

Servidor próprio de WhatsApp usando **Baileys** — gratuito, ilimitado, sem dependência de SaaS.

## Requisitos
- VPS Ubuntu 22.04+ (1 vCPU, 1GB RAM mínimo)
- Acesso root via SSH
- Porta 3000 liberada

## Instalação rápida (5 minutos)

\`\`\`bash
# 1. Conecte na VPS via SSH
ssh root@SEU_IP

# 2. Crie pasta e extraia o ZIP enviado pelo painel
mkdir -p /opt/lynecloud-wa && cd /opt/lynecloud-wa
# (faça upload do lynecloud-whatsapp-vps.zip aqui via scp ou unzip)
unzip lynecloud-whatsapp-vps.zip

# 3. Execute o instalador
chmod +x install.sh
sudo bash install.sh
\`\`\`

O instalador:
- Instala Node.js 20 + PM2
- Gera um token aleatório seguro
- Inicia o serviço como daemon (auto-restart)
- Configura systemd para iniciar no boot

## Uso

Após instalar, o terminal mostra a **URL** e o **Token** da VPS.
Cole ambos em **Painel Admin > WhatsApp > ⚙ Configurar VPS** e clique **Conectar**.

O painel exibirá um QR Code — escaneie com o WhatsApp do celular da clínica.

## Comandos úteis

\`\`\`bash
pm2 status             # ver status
pm2 logs lynecloud-wa      # ver logs em tempo real
pm2 restart lynecloud-wa   # reiniciar
pm2 stop lynecloud-wa      # parar
\`\`\`

## HTTPS (opcional, mas recomendado)

\`\`\`bash
apt install nginx certbot python3-certbot-nginx -y
# Configure um subdomínio (ex: wa.suaclinica.com) apontando para o IP da VPS
certbot --nginx -d wa.suaclinica.com
\`\`\`

E adicione esse proxy reverso em \`/etc/nginx/sites-available/wa\`:

\`\`\`
server {
  server_name wa.suaclinica.com;
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host \\$host;
    proxy_set_header X-Real-IP \\$remote_addr;
  }
}
\`\`\`

## Suporte
- Problemas? Veja \`pm2 logs lynecloud-wa\`
- Sessão travada? \`pm2 restart lynecloud-wa\` ou clique em "Reiniciar" no painel
- Precisa trocar o número? Clique em "Desconectar" no painel e escaneie novo QR
`;

const GITIGNORE = `node_modules/
auth/
.env
*.log
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await sb.auth.getClaims(token);
    if (!claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sbService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: isAdmin } = await sbService.rpc("has_role", {
      _user_id: claims.claims.sub,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build ZIP
    const zip = new JSZip();
    zip.file("server.js", SERVER_JS);
    zip.file("package.json", PACKAGE_JSON);
    zip.file("ecosystem.config.js", ECOSYSTEM_CONFIG);
    zip.file("install.sh", INSTALL_SH);
    zip.file("README.md", README_MD);
    zip.file(".gitignore", GITIGNORE);

    const buffer = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="lynecloud-whatsapp-vps.zip"',
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (e: any) {
    console.error("[whatsapp-vps-package]", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

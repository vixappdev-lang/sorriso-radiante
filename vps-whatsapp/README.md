# Levii — WhatsApp VPS (Baileys, 100% gratuito)

Servidor Node.js usando [Baileys](https://github.com/WhiskeySockets/Baileys) para
conectar uma instância de WhatsApp **diretamente** (sem Chromium, sem Puppeteer)
e expor uma API HTTP autenticada usada pelo painel da Clínica Levii.

- **Leve**: ~80 MB RAM, sem browser headless.
- **Estável 24/7**: PM2 + restart automático + reconexão exponencial.
- **Multi-Device**: sessão persistida em `auth/`, sobrevive a reinícios.
- **Custo**: zero. Use qualquer VPS (Hetzner CX11, Contabo, Oracle Free Tier).

## Pré-requisitos da VPS

- Ubuntu 22.04 LTS (recomendado)
- 1 vCPU / 1 GB RAM (mínimo)
- Porta 443 liberada (ou 3000 + Nginx reverso)
- Domínio apontado (opcional, mas recomendado para HTTPS)

## Instalação automática (5 min)

```bash
# 1. Conecte na VPS via SSH como root
ssh root@SEU_IP

# 2. Clone este diretório (apenas a pasta vps-whatsapp/)
mkdir -p /opt/levii && cd /opt/levii
# Copie os arquivos da pasta vps-whatsapp/ para /opt/levii/

# 3. Rode o instalador
chmod +x install.sh && ./install.sh
```

O script vai:
1. Instalar Node 20, PM2, Nginx, Certbot.
2. Instalar dependências (`npm ci --production`).
3. Gerar um **TOKEN** seguro de 64 chars (mostrado no final).
4. Iniciar via PM2 com restart automático.
5. Configurar systemd para iniciar no boot.
6. (Opcional) Configurar HTTPS via Let's Encrypt se você passar `DOMAIN=meu.dominio.com`.

## Conectar ao painel Levii

1. Copie o **TOKEN** mostrado no final da instalação.
2. Acesse o painel → **WhatsApp → Conexão → VPS Própria**.
3. Cole:
   - **URL**: `https://meu.dominio.com` (ou `http://SEU_IP:3000`)
   - **Token**: o token gerado
4. Clique **Conectar** → escaneie o QR Code com o WhatsApp.

Pronto. A partir daí, todo evento da clínica (confirmação, cancelamento, lembrete,
campanhas) usa essa instância automaticamente.

## Endpoints da API

Todos exigem `Authorization: Bearer <TOKEN>`.

| Método | Path | Descrição |
|---|---|---|
| GET  | `/status` | `{ status: "connected" \| "qr" \| "disconnected", phone? }` |
| GET  | `/qr` | Retorna QR code base64 (se `status=qr`) |
| POST | `/send` | `{ to: "5527999990000", message: "Olá" }` envia mensagem |
| POST | `/restart` | Recria a sessão (mantém credenciais) |
| POST | `/logout` | Apaga credenciais (precisa novo QR) |
| GET  | `/info` | Versão, uptime, contagem de mensagens |

## Operação 24/7

```bash
pm2 status                    # ver status
pm2 logs levii-wa             # ver logs em tempo real
pm2 restart levii-wa          # restart manual
systemctl status pm2-root     # autoload no boot
```

## Atualizar

```bash
cd /opt/levii
git pull   # se versionou
npm ci --production
pm2 restart levii-wa
```

## Por que Baileys (e não whatsapp-web.js / venom)?

| Lib | Base | RAM | Estável? |
|---|---|---|---|
| **Baileys** | WS Multi-Device direto | ~80 MB | ✅ Excelente, mantida ativamente |
| whatsapp-web.js | Puppeteer/Chromium | ~600 MB+ | ⚠️ Cai com updates do WA Web |
| venom-bot | Puppeteer | ~600 MB+ | ⚠️ Manutenção lenta |

Baileys é a melhor opção gratuita e self-hosted em 2025.

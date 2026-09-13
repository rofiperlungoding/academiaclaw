#!/usr/bin/env bash
set -e

echo "=== [1/6] Installing System Prerequisites ==="
apt update
apt install -y python3-venv python3-pip python3-full nginx curl git

echo "=== [2/6] Setting Up Project Directory ==="
mkdir -p /opt/academiaclaw
mkdir -p /opt/academiaclaw/backend/data/uploads

echo "=== [3/6] Configuring Python Virtual Environment ==="
cd /opt/academiaclaw
if [ ! -d "/opt/academiaclaw/.venv" ]; then
    python3 -m venv /opt/academiaclaw/.venv
fi
/opt/academiaclaw/.venv/bin/pip install --upgrade pip
if [ -f "/opt/academiaclaw/backend/requirements.txt" ]; then
    /opt/academiaclaw/.venv/bin/pip install -r /opt/academiaclaw/backend/requirements.txt
fi

echo "=== [4/6] Creating Systemd Service ==="
cat << 'EOF' > /etc/systemd/system/academiaclaw.service
[Unit]
Description=AcademiaClaw Fullstack Backend API & Static Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/academiaclaw
Environment="PYTHONPATH=/opt/academiaclaw"
# Secrets live here, never in the repo. Missing file is fatal on purpose:
# starting without JWT_SECRET would sign tokens with an empty key.
EnvironmentFile=/opt/academiaclaw/.env
ExecStart=/opt/academiaclaw/.venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable academiaclaw.service
systemctl restart academiaclaw.service

echo "=== [4b/6] Checking Secrets ==="
if [ ! -f /opt/academiaclaw/.env ]; then
    cp /opt/academiaclaw/.env.example /opt/academiaclaw/.env
    chmod 600 /opt/academiaclaw/.env
    echo "  created /opt/academiaclaw/.env from template — FILL IT IN, then:"
    echo "    systemctl restart academiaclaw"
fi

echo "=== [5/6] Syncing OpenClaw Config ==="
if [ -d "/opt/academiaclaw/openclaw_config" ]; then
    cp -r /opt/academiaclaw/openclaw_config/*.md /root/.openclaw/workspace/ 2>/dev/null || true
fi

echo "=== [6/6] Configuring Nginx Reverse Proxy ==="
cat << 'EOF' > /etc/nginx/sites-available/academiaclaw
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }

    location /openclaw/ {
        proxy_pass http://127.0.0.1:18789/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/academiaclaw /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx || echo "Nginx configuration verified"

echo "=== VPS Setup Complete! ==="

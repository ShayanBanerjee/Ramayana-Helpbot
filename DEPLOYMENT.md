# Deploying Grantha to a Hostinger VPS (askgrantha.com)

Target: Hostinger **KVM 2** (2 vCPU / 8 GB RAM), **Ubuntu 26.04 LTS**. Recent Ubuntu releases ship a
Python newer than this project supports (it needs 3.10–3.11), so we install Python 3.11 with `uv` instead of
relying on the system Python. (Ubuntu 22.04 also works: its system Python 3.10 is fine — use `python3 -m venv`.) Architecture: nginx serves the built React app and proxies
`/api/*` to gunicorn (1 worker + threads) on `127.0.0.1:8080`.

## 1. Buy and create the VPS
1. hPanel → VPS → choose **KVM 2** (try the 1-month term first, move to 24 months once it runs well).
2. OS: **Ubuntu 26.04 64-bit, no control panel**. Pick the data center nearest your users.
3. Set a root password and add your SSH public key. Note the server's **IPv4 address**.

## 2. Point the domain (GoDaddy → DNS)
In GoDaddy's DNS manager for `askgrantha.com`, set:
| Type | Name | Value |
|---|---|---|
| A | `@` | your VPS IPv4 |
| A | `www` | your VPS IPv4 |
Delete any default "parked" A/CNAME records. Propagation takes minutes to a few hours (`dig askgrantha.com`).

## 3. First login and hardening
```bash
ssh root@<VPS_IP>
apt update && apt -y upgrade
adduser grantha && usermod -aG sudo grantha          # app/admin user
rsync --archive --chown=grantha:grantha ~/.ssh /home/grantha   # reuse your SSH key
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
# swap as a safety net against out-of-memory kills while models load
fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```
Log out and back in as `grantha` for the rest.

## 4. Install system packages and Python 3.11
```bash
sudo apt install -y nginx git build-essential curl certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
curl -LsSf https://astral.sh/uv/install.sh | sh && source ~/.local/bin/env
uv python install 3.11
```

## 5. Get the code
```bash
sudo mkdir -p /opt/grantha && sudo chown grantha:grantha /opt/grantha
git clone -b dev https://github.com/ShayanBanerjee/Ramayana-Helpbot.git /opt/grantha   # use main once merged
cd /opt/grantha/backend
uv venv --python 3.11 .venv && source .venv/bin/activate
uv pip install torch --index-url https://download.pytorch.org/whl/cpu   # CPU-only: far smaller than the default
uv pip install -r requirements.txt
python --version   # must be 3.11.x
```
If the repo is private, clone with a deploy key or a GitHub token instead.

## 6. Configure the backend
```bash
cp .env.example .env && nano .env
```
Set at least:
```
OPENAI_API_KEY=sk-...
SECRET_KEY=<python -c "import secrets; print(secrets.token_hex(32))">
FRONTEND_URL=https://askgrantha.com
SESSION_COOKIE_SECURE=true
ADMIN_EMAILS=shayanbanerjee96@gmail.com
GOOGLE_CLIENT_ID= / GOOGLE_CLIENT_SECRET=      # optional, see step 10
```
`wsgi.py` refuses to start with the placeholder `SECRET_KEY`. Also set an **OpenAI monthly spend limit**
in the OpenAI dashboard before launch.

## 7. Corpus: upload PDFs and ingest
The PDFs and `chroma_store/` are gitignored, so copy the corpus from your laptop:
```bash
# from your laptop, in the repo root
rsync -avP backend/data/ grantha@<VPS_IP>:/opt/grantha/backend/data/
# then on the VPS
cd /opt/grantha/backend && source .venv/bin/activate
python ingest.py        # slow (~29k chunks); first run also downloads the embedding model
```
(Alternative: rsync your already-built `backend/chroma_store/` instead of re-ingesting — same
embedding model required.) After the models are cached you can add `HF_HUB_OFFLINE=1` to `.env`.

## 8. Build the frontend, install the services
```bash
cd /opt/grantha/frontend && npm ci && npm run build        # outputs frontend/dist

sudo cp /opt/grantha/deploy/grantha.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now grantha
journalctl -u grantha -f          # wait for the models to load, then Ctrl+C

sudo cp /opt/grantha/deploy/nginx-grantha.conf /etc/nginx/sites-available/grantha
sudo ln -s /etc/nginx/sites-available/grantha /etc/nginx/sites-enabled/grantha
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```
Nginx must be able to read `/opt/grantha/frontend/dist` (default perms are fine).

## 9. HTTPS (once DNS resolves to the VPS)
```bash
sudo certbot --nginx -d askgrantha.com -d www.askgrantha.com --redirect -m you@example.com --agree-tos
sudo certbot renew --dry-run
```

## 10. OAuth (optional) and admin
- Google console → OAuth client → add redirect URI `https://askgrantha.com/api/auth/google/callback`.
- Facebook app → Valid OAuth Redirect URI `https://askgrantha.com/api/auth/facebook/callback`.
- Admin: sign up with the email in `ADMIN_EMAILS`, or run `python scripts/reset_admin_password.py`.
  Delete the generated `admin-creds.txt` after saving the password somewhere safe.

## 11. Smoke test
```bash
curl https://askgrantha.com/api/health
```
Then in a browser: landing page loads with the new logo (and a smooth fade-in on reload) → ask "Who is Hanuman?" → ask "Does the Valmiki
Ramayana describe multiple worlds?" → sign up → reload and confirm history persists.

## Updating later
```bash
cd /opt/grantha && git pull
cd backend && source .venv/bin/activate && uv pip install -r requirements.txt
cd ../frontend && npm ci && npm run build
sudo systemctl restart grantha
```

## Backups (do this before you have real users)
Back up `backend/instance/` (SQLite users + chats) and `backend/chroma_store/` nightly, e.g. a cron'd
`tar` + `rclone` to cheap object storage, or enable Hostinger's weekly snapshots.

## Troubleshooting
- **502 from nginx** → gunicorn still loading models or crashed: `journalctl -u grantha -n 100`.
- **`pip`/`uv` build errors or missing wheels** → you are on the wrong Python: `python --version` inside the venv must be 3.11.x.
- **Killed / out-of-memory** → confirm the service uses `--workers 1`, check `free -h`, keep the swap file.
- **Login works then logs out** → `SESSION_COOKIE_SECURE=true` requires HTTPS; confirm certbot finished.
- **OAuth redirect_uri_mismatch** → the registered URI must be exactly `https://askgrantha.com/api/auth/<provider>/callback`.

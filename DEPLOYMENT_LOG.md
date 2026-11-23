# Grantha deployment log (2026-11-23)

Live at https://askgrantha.com (and www). Hostinger KVM 2, Ubuntu 26.04, GoDaddy DNS. VPS IP: 189.72.177.182.
Follow `DEPLOYMENT.md` for the full procedure; this file records what actually went wrong and how it was fixed.

## Final state (verified from outside)
- `/api/health` returns 200 on both hostnames over HTTPS; HTTP redirects (301) to HTTPS.
- Let's Encrypt cert valid until 2027-02-21; `certbot renew --dry-run` passed.
- `grantha.service` (gunicorn, 1 worker, 6 threads) runs as user `grantha`.
- Corpus (`chroma_store/` 411M, `data/` 26M) copied to `/opt/grantha/backend/`.

## Problems hit and fixes
1. **502 Bad Gateway / `status=203/EXEC ... Permission denied`**
   Cause: repo, venv and build were created as root, but the service runs as `grantha`
   (uv's Python also lived under `/root/.local/share/uv`).
   Fix: `chown -R grantha:grantha /opt/grantha`, then as `grantha` install uv, `uv python install 3.11`,
   `rm -rf .venv && uv venv --python 3.11 .venv`, install CPU torch first, then `requirements.txt`.
   Lesson: do every step after user creation as `grantha`, not root.
2. **rsync "mkdir ... Permission denied"** — same root-ownership cause. Also: don't use `sudo rsync` on the Mac.
3. **git "dubious ownership"** — same cause, fixed by the chown.
4. **Domain served GoDaddy's parked page** (3.33.130.190 / 15.197.148.33)
   Cause: GoDaddy's default `A @ Parked` record. Fix: edit that A record to the VPS IP (can't delete a Parked record).
   `www` is a CNAME to `askgrantha.com`, which is fine.
5. **certbot failed** — it was run on the Mac. It must run on the VPS as root, with plain-text domains
   (not markdown-link text) and a real email, not a `<placeholder>`.

## Remaining to-do
- Ask real questions on the live site (confirms OpenAI key + retrieval), sign up, reload to check history persists.
- Set an OpenAI monthly spend limit.
- Register OAuth redirect URIs if using Google/Facebook login.
- Backups: Hostinger snapshots, or `tar czf ~/grantha-backup-$(date +%F).tgz -C /opt/grantha/backend instance chroma_store`.
- Optional: `HF_HUB_OFFLINE=1` in `.env` once models are cached.
- Optional: the Mac got an unneeded `brew install certbot` (pulled python@3.15); `brew uninstall certbot` to undo.

## Update procedure (as `grantha` on the VPS)
```
cd /opt/grantha && git pull
cd backend && source .venv/bin/activate && uv pip install -r requirements.txt
cd ../frontend && npm ci && npm run build
sudo systemctl restart grantha
```

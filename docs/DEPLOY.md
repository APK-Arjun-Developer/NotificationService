# Production deployment (GitHub Actions)

Pushing to **`main`** runs [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml): typecheck, build, then deploy over SSH with PM2.

## Server prerequisites

Your VPS (or VM) needs:

- **Node.js 20+**
- **npm**
- **PM2**: `npm install -g pm2`
- SSH access for the deploy user
- An empty deploy directory (e.g. `/var/www/notification-service`)

```bash
# Example one-time server setup (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
sudo mkdir -p /var/www/notification-service
sudo chown $USER:$USER /var/www/notification-service
```

## GitHub repository secrets

Go to **GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret**.

### SSH (required)

| Secret | Example | Description |
|--------|---------|-------------|
| `SSH_HOST` | `203.0.113.10` | Server IP or hostname |
| `SSH_USER` | `deploy` | SSH username |
| `SSH_PRIVATE_KEY` | `-----BEGIN OPENSSH...` | Private key (full PEM) |
| `SSH_PORT` | `22` | Optional; omit if using 22 |
| `DEPLOY_PATH` | `/var/www/notification-service` | Target folder on server |

### Application (required)

| Secret | Example |
|--------|---------|
| `PORT` | `3001` |
| `API_KEY` | 32+ char random string |
| `SQLITE_PATH` | `./data/notifications.db` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `you@gmail.com` |
| `SMTP_APP_PASSWORD` | Gmail app password |
| `EMAIL_FROM_NAME` | `Notification Service` |
| `EMAIL_FROM_ADDRESS` | `you@gmail.com` |

## GitHub environment (optional)

The workflow uses the **`production`** environment. Create it under **Settings → Environments** if you want protection rules or environment-specific secrets.

## Deploy flow

```mermaid
flowchart LR
  A[Push to main] --> B[Typecheck + build]
  B --> C[Write .env.production from secrets]
  C --> D[SCP to server]
  D --> E[npm ci + pm2 restart]
```

## Manual deploy trigger

**Actions → Deploy to Production → Run workflow**

## Verify after deploy

```bash
curl http://YOUR_SERVER_IP:3001/health
```

## Local production test

```bash
cd notification-service
cp .env.production .env.production.local   # fill real values locally only
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

Do not commit filled production secrets.

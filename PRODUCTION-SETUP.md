# CloudDesk Production Setup Guide

## Prerequisites
- Windows Server on GCP (instance-20251118-075156)
- Domain: cloud-desk.gabrielseto.dev
- Node.js installed
- Git installed

## Step 1: Install Caddy Web Server

Download and install Caddy for Windows:

```powershell
# Download Caddy (run in PowerShell as Administrator)
Invoke-WebRequest -Uri "https://caddyserver.com/api/download?os=windows&arch=amd64" -OutFile "caddy.exe"

# Move to a permanent location
New-Item -ItemType Directory -Force -Path "C:\caddy"
Move-Item caddy.exe C:\caddy\caddy.exe

# Add to PATH
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\caddy", "Machine")
```

Or download manually from: https://caddyserver.com/download

## Step 2: Configure Cloudflare DNS

1. Log in to Cloudflare Dashboard
2. Select your domain `gabrielseto.dev`
3. Go to **DNS** → **Records**
4. Add an A record:
   - Type: `A`
   - Name: `cloud-desk`
   - IPv4 address: `34.101.112.163` (your GCP server IP)
   - Proxy status: **Proxied** (orange cloud)
   - TTL: Auto
5. Click **Save**

## Step 3: Build the Frontend

```powershell
# Navigate to CloudDesk directory
cd C:\path\to\CloudDesk

# Install dependencies (if not already done)
npm install

# Build the production frontend
npm run build
```

This creates the `dist` folder with optimized static files.

## Step 4: Start the Backend

```powershell
# In one terminal/command prompt
cd C:\path\to\CloudDesk\server
npm start
```

The backend will run on `http://localhost:3001`

## Step 5: Start Caddy Web Server

```powershell
# In another terminal/command prompt
cd C:\path\to\CloudDesk

# Create logs directory
New-Item -ItemType Directory -Force -Path "logs"

# Start Caddy (will automatically get SSL certificate from Let's Encrypt)
caddy run
```

Caddy will:
- Serve your frontend from the `dist` folder
- Proxy `/api/*` requests to your backend on port 3001
- Automatically obtain and renew SSL certificates from Let's Encrypt
- Handle HTTPS on port 443

## Step 6: Set Up as Windows Services (Optional but Recommended)

### Install NSSM (Non-Sucking Service Manager)

```powershell
# Download NSSM
Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile "nssm.zip"
Expand-Archive nssm.zip -DestinationPath "C:\nssm"
```

### Create Backend Service

```powershell
# Run as Administrator
C:\nssm\nssm-2.24\win64\nssm.exe install CloudDeskAPI "C:\Program Files\nodejs\node.exe" "C:\path\to\CloudDesk\server\index.js"
C:\nssm\nssm-2.24\win64\nssm.exe set CloudDeskAPI AppDirectory "C:\path\to\CloudDesk\server"
C:\nssm\nssm-2.24\win64\nssm.exe start CloudDeskAPI
```

### Create Caddy Service

```powershell
# Run as Administrator
C:\nssm\nssm-2.24\win64\nssm.exe install CloudDeskWeb "C:\caddy\caddy.exe" "run --config C:\path\to\CloudDesk\Caddyfile"
C:\nssm\nssm-2.24\win64\nssm.exe set CloudDeskWeb AppDirectory "C:\path\to\CloudDesk"
C:\nssm\nssm-2.24\win64\nssm.exe start CloudDeskWeb
```

## Step 7: Verify Setup

1. Wait 2-3 minutes for DNS propagation
2. Visit: https://cloud-desk.gabrielseto.dev
3. You should see your CloudDesk application with a valid SSL certificate!

## Troubleshooting

### Check if backend is running:
```powershell
curl http://localhost:3001/api/health
```

### Check Caddy logs:
```powershell
Get-Content logs\access.log -Tail 50
```

### Check Windows Firewall:
Make sure Windows Firewall allows ports 80 and 443:
```powershell
New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

### Restart services:
```powershell
# Restart backend
net stop CloudDeskAPI
net start CloudDeskAPI

# Restart Caddy
net stop CloudDeskWeb
net start CloudDeskWeb
```

## Updating the Application

When you make changes:

```powershell
# 1. Pull latest code
git pull

# 2. Install any new dependencies
npm install

# 3. Rebuild frontend
npm run build

# 4. Restart backend service
net stop CloudDeskAPI
net start CloudDeskAPI

# Caddy will automatically serve the new dist folder
```

## Environment Variables

Make sure these are set correctly:

**Frontend (.env):**
```env
VITE_API_URL=
```
(Empty = uses relative URLs, works with reverse proxy)

**Backend (server/.env):**
```env
NODE_ENV=production
FRONTEND_URL=https://cloud-desk.gabrielseto.dev
PORT=3001
```

## Security Notes

- Caddy automatically handles SSL/TLS certificates
- Cloudflare provides DDoS protection and CDN
- Backend is not directly exposed (only through Caddy reverse proxy)
- Security headers are automatically added by Caddy

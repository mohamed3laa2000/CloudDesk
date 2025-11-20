# GCP Compute Engine Setup Guide

This guide provides step-by-step instructions for setting up Google Cloud Platform (GCP) Compute Engine integration with CloudDesk EDU.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [GCP Project Setup](#gcp-project-setup)
4. [Service Account Configuration](#service-account-configuration)
5. [Server Configuration](#server-configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Security Best Practices](#security-best-practices)

## Overview

CloudDesk EDU can provision real Windows Server virtual machines in Google Cloud Platform. When GCP integration is enabled, the system:

- Creates actual Windows Server VMs in GCP regions (Singapore or Iowa)
- Manages VM lifecycle (start, stop, delete)
- Provides Windows password reset functionality
- Synchronizes VM status with the CloudDesk database
- Assigns external IP addresses for remote access

**Demo Mode vs Production Mode:**

| Feature | Demo Mode | Production Mode |
|---------|-----------|-----------------|
| VM Provisioning | Database only | Real GCP VMs |
| Provisioning Time | Instant | 5-10 minutes |
| Costs | None | GCP compute charges |
| Windows Access | Simulated | Full RDP access |
| Configuration | `GCP_ENABLED=false` | `GCP_ENABLED=true` |

## Prerequisites

Before starting, ensure you have:

- ✅ Active Google Cloud Platform account
- ✅ GCP project with billing enabled
- ✅ Administrative access to the GCP project
- ✅ Server with Node.js installed
- ✅ Command-line access to the server

## GCP Project Setup

### Step 1: Create or Select a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click "New Project" or select an existing project
4. Note your **Project ID** (you'll need this later)

### Step 2: Enable Billing

1. Navigate to **Billing** in the left sidebar
2. Link a billing account to your project
3. Verify billing is active

### Step 3: Enable Required APIs

Enable the Compute Engine and Cloud Resource Manager APIs:

**Via Console:**
1. Navigate to **APIs & Services > Library**
2. Search for "Compute Engine API" and click **Enable**
3. Search for "Cloud Resource Manager API" and click **Enable**

**Via gcloud CLI:**
```bash
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
```

### Step 4: Verify API Status

Check that APIs are enabled:

```bash
gcloud services list --enabled | grep -E "compute|cloudresourcemanager"
```

Expected output:
```
compute.googleapis.com          Compute Engine API
cloudresourcemanager.googleapis.com  Cloud Resource Manager API
```

## Service Account Configuration

### Step 1: Install gcloud SDK

**Linux/macOS:**
```bash
# Download and install
curl https://sdk.cloud.google.com | bash

# Restart shell
exec -l $SHELL

# Verify installation
gcloud --version
```

**Windows:**
Download the installer from [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)

### Step 2: Initialize gcloud

```bash
# Initialize gcloud
gcloud init

# Login with your Google account
gcloud auth login

# Set default project
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Create Service Account

Create a dedicated service account for CloudDesk:

```bash
# Create service account
gcloud iam service-accounts create clouddesk-compute \
  --display-name="CloudDesk Compute Service Account" \
  --description="Service account for CloudDesk VM management"

# Verify creation
gcloud iam service-accounts list
```

### Step 4: Grant IAM Permissions

**Option A: Use Built-in Role (Recommended)**

Grant the Compute Instance Admin role:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

**Option B: Create Custom Role (Advanced)**

For fine-grained control, create a custom role:

```bash
# Create custom role
gcloud iam roles create cloudDeskComputeRole \
  --project=YOUR_PROJECT_ID \
  --title="CloudDesk Compute Role" \
  --description="Custom role for CloudDesk VM management" \
  --permissions=compute.instances.create,compute.instances.delete,compute.instances.get,compute.instances.list,compute.instances.start,compute.instances.stop,compute.instances.setMetadata,compute.disks.create,compute.images.useReadOnly,compute.zones.get,compute.zones.list

# Assign custom role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="projects/YOUR_PROJECT_ID/roles/cloudDeskComputeRole"
```

### Step 5: Create Service Account Key

Generate a JSON key file:

```bash
# Create key file
gcloud iam service-accounts keys create ~/clouddesk-sa-key.json \
  --iam-account=clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Verify key creation
ls -lh ~/clouddesk-sa-key.json
```

**⚠️ Security Warning:** This key file provides full access to your GCP resources. Store it securely and never commit it to version control.

### Step 6: Authenticate on Server

Copy the key file to your server and authenticate:

```bash
# Copy key to server (if needed)
scp ~/clouddesk-sa-key.json user@your-server:/secure/path/

# On the server, authenticate
gcloud auth activate-service-account \
  --key-file=/secure/path/clouddesk-sa-key.json

# Verify authentication
gcloud auth list
```

Expected output:
```
                  Credentialed Accounts
ACTIVE  ACCOUNT
*       clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

## Server Configuration

### Step 1: Update Environment Variables

Edit `server/.env`:

```env
# GCP Configuration
GCP_ENABLED=true
GCP_PROJECT_ID=your-actual-project-id
GCP_TIMEOUT_MS=300000
```

### Step 2: Verify gcloud Configuration

```bash
# Check active account
gcloud auth list

# Check project
gcloud config get-value project

# Test gcloud access
gcloud compute zones list --limit=5
```

### Step 3: Start the Server

```bash
cd server
npm start
```

Look for these log messages:

```
✓ GCP Compute Engine integration enabled
✓ Project: your-project-id
✓ Server running on port 3001
```

## Verification

### Test 1: Check gcloud Connectivity

```bash
# List available zones
gcloud compute zones list --filter="name:(asia-southeast1-a OR us-central1-a)"

# List Windows images
gcloud compute images list --project=windows-cloud --filter="family:windows-2022" --limit=1
```

### Test 2: Create Test Instance via API

Use curl or Postman to test instance creation:

```bash
curl -X POST http://localhost:3001/api/instances \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "test-instance",
    "cpuCores": 4,
    "ramGb": 8,
    "storageGb": 50,
    "region": "SINGAPORE",
    "imageId": "windows-general"
  }'
```

### Test 3: Verify in GCP Console

1. Go to [Compute Engine > VM Instances](https://console.cloud.google.com/compute/instances)
2. Look for instances with names starting with "clouddesk-"
3. Verify instance is running in the correct zone

### Test 4: Test Windows Password Reset

```bash
curl -X POST http://localhost:3001/api/instances/INSTANCE_ID/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "username": "Administrator"
  }'
```

## Troubleshooting

### Issue: "gcloud: command not found"

**Solution:**
```bash
# Verify gcloud is in PATH
which gcloud

# If not found, add to PATH (Linux/macOS)
echo 'export PATH=$PATH:/path/to/google-cloud-sdk/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
gcloud --version
```

### Issue: "Authentication failed"

**Solution:**
```bash
# Check active account
gcloud auth list

# Re-authenticate if needed
gcloud auth activate-service-account \
  --key-file=/path/to/clouddesk-sa-key.json

# Verify project
gcloud config get-value project
```

### Issue: "Permission denied" errors

**Solution:**
```bash
# Check service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com"

# Re-grant permissions if needed
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

### Issue: "Quota exceeded"

**Solution:**
1. Go to [IAM & Admin > Quotas](https://console.cloud.google.com/iam-admin/quotas)
2. Filter by "Compute Engine API"
3. Select the quota to increase
4. Click "Edit Quotas" and request an increase
5. Try a different region if quota is regional

### Issue: "API not enabled"

**Solution:**
```bash
# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

# Verify
gcloud services list --enabled
```

### Issue: Instance creation timeout

**Symptoms:** Instance creation takes longer than 5 minutes

**Solution:**
1. Check GCP Console for instance status
2. Increase timeout in `.env`: `GCP_TIMEOUT_MS=600000` (10 minutes)
3. Check server logs for detailed error messages
4. Verify network connectivity to GCP

### Issue: Windows password reset fails

**Symptoms:** Password reset returns error

**Solution:**
1. Verify instance is RUNNING: `gcloud compute instances describe INSTANCE_NAME --zone=ZONE`
2. Check instance has Windows guest agent installed (automatic for Windows images)
3. Ensure service account has `compute.instances.setMetadata` permission
4. Wait 2-3 minutes after instance creation before resetting password

## Security Best Practices

### 1. Service Account Key Management

- ✅ Store key files in secure locations with restricted permissions
- ✅ Use environment variables or secret management systems
- ✅ Rotate keys regularly (every 90 days)
- ✅ Never commit keys to version control
- ❌ Don't share keys via email or chat

```bash
# Set restrictive permissions
chmod 600 /path/to/clouddesk-sa-key.json

# Verify permissions
ls -l /path/to/clouddesk-sa-key.json
# Should show: -rw------- (600)
```

### 2. Principle of Least Privilege

- ✅ Use custom roles with only required permissions
- ✅ Avoid granting Owner or Editor roles
- ✅ Regularly audit service account permissions
- ✅ Remove unused service accounts

### 3. Network Security

- ✅ Configure VPC firewall rules to restrict access
- ✅ Use Cloud NAT for outbound traffic
- ✅ Enable VPC Flow Logs for monitoring
- ✅ Implement IP allowlisting where possible

### 4. Monitoring and Logging

- ✅ Enable Cloud Audit Logs
- ✅ Monitor service account usage
- ✅ Set up alerts for unusual activity
- ✅ Review logs regularly

```bash
# View recent audit logs
gcloud logging read "protoPayload.authenticationInfo.principalEmail=clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --limit=10 \
  --format=json
```

### 5. Cost Management

- ✅ Set up billing alerts
- ✅ Use budget notifications
- ✅ Monitor resource usage
- ✅ Implement automatic shutdown for idle instances

## Additional Resources

- [GCP Compute Engine Documentation](https://cloud.google.com/compute/docs)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference)
- [IAM Best Practices](https://cloud.google.com/iam/docs/best-practices)
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)
- [CloudDesk API Documentation](./api-reference.md)

## Support

If you encounter issues not covered in this guide:

1. Check server logs: `tail -f server/logs/app.log`
2. Review GCP audit logs in the Console
3. Contact CloudDesk support: support@clouddesk.edu
4. Open an issue: [GitHub Issues](https://github.com/rofiperlungoding/CloudDesk/issues)

---

**Last Updated:** November 2024  
**Version:** 1.0

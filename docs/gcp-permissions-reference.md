# GCP Permissions Reference

This document provides a comprehensive reference for all Google Cloud Platform permissions required by CloudDesk EDU.

## Required Permissions

### Compute Instance Management

| Permission | Purpose | Required For |
|------------|---------|--------------|
| `compute.instances.create` | Create new VM instances | Instance provisioning |
| `compute.instances.delete` | Delete VM instances | Instance deletion |
| `compute.instances.get` | Query instance details and status | Status checks, instance details |
| `compute.instances.list` | List instances in project | Instance inventory |
| `compute.instances.start` | Start stopped instances | Instance lifecycle management |
| `compute.instances.stop` | Stop running instances | Instance lifecycle management |
| `compute.instances.setMetadata` | Modify instance metadata | Windows password reset |

### Disk Management

| Permission | Purpose | Required For |
|------------|---------|--------------|
| `compute.disks.create` | Create boot disks | Instance provisioning |

### Image Access

| Permission | Purpose | Required For |
|------------|---------|--------------|
| `compute.images.useReadOnly` | Use Windows Server images | Instance provisioning |

### Zone Information

| Permission | Purpose | Required For |
|------------|---------|--------------|
| `compute.zones.get` | Access zone information | Region mapping |
| `compute.zones.list` | List available zones | Configuration validation |

## Predefined IAM Roles

### Recommended: Compute Instance Admin (v1)

**Role ID:** `roles/compute.instanceAdmin.v1`

**Includes all required permissions plus:**
- Full instance lifecycle management
- Disk management
- Image access
- Network configuration

**Grant this role:**
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

**Pros:**
- ✅ Includes all required permissions
- ✅ Maintained by Google
- ✅ Automatically updated with new features
- ✅ Easy to manage

**Cons:**
- ⚠️ Includes some permissions not strictly required
- ⚠️ Broader access than minimal principle

### Alternative: Compute Admin

**Role ID:** `roles/compute.admin`

**Includes:** Full Compute Engine administration

**⚠️ Not Recommended:** Too broad for CloudDesk needs. Use only if you need additional Compute Engine management capabilities.

## Custom Role Configuration

For organizations requiring strict least-privilege access, create a custom role with only the required permissions.

### Create Custom Role

```bash
gcloud iam roles create cloudDeskComputeRole \
  --project=YOUR_PROJECT_ID \
  --title="CloudDesk Compute Role" \
  --description="Minimal permissions for CloudDesk VM management" \
  --permissions=compute.instances.create,compute.instances.delete,compute.instances.get,compute.instances.list,compute.instances.start,compute.instances.stop,compute.instances.setMetadata,compute.disks.create,compute.images.useReadOnly,compute.zones.get,compute.zones.list \
  --stage=GA
```

### Assign Custom Role

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="projects/YOUR_PROJECT_ID/roles/cloudDeskComputeRole"
```

### Update Custom Role

If you need to add permissions later:

```bash
gcloud iam roles update cloudDeskComputeRole \
  --project=YOUR_PROJECT_ID \
  --add-permissions=compute.newPermission.name
```

## Permission Verification

### Check Service Account Permissions

```bash
# List all roles assigned to service account
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

### Test Specific Permission

```bash
# Test if service account can create instances
gcloud compute instances create test-permission-check \
  --zone=asia-southeast1-a \
  --machine-type=e2-micro \
  --dry-run

# Clean up (if test succeeded)
gcloud compute instances delete test-permission-check \
  --zone=asia-southeast1-a \
  --quiet
```

### Audit Permission Usage

```bash
# View recent Compute Engine operations
gcloud logging read "protoPayload.authenticationInfo.principalEmail=clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com AND resource.type=gce_instance" \
  --limit=20 \
  --format="table(timestamp,protoPayload.methodName,protoPayload.status.code)"
```

## Permission Scope by Feature

### Instance Creation

**Required Permissions:**
- `compute.instances.create`
- `compute.disks.create`
- `compute.images.useReadOnly`
- `compute.zones.get`

**Operations:**
- Provision new Windows Server VM
- Create boot disk
- Assign machine type
- Configure network

### Instance Lifecycle Management

**Required Permissions:**
- `compute.instances.start`
- `compute.instances.stop`
- `compute.instances.get`

**Operations:**
- Start stopped instances
- Stop running instances
- Query instance status

### Instance Deletion

**Required Permissions:**
- `compute.instances.delete`
- `compute.instances.get`

**Operations:**
- Delete VM instances
- Remove associated resources

### Windows Password Reset

**Required Permissions:**
- `compute.instances.setMetadata`
- `compute.instances.get`

**Operations:**
- Generate Windows password
- Update instance metadata
- Retrieve password credentials

### Status Synchronization

**Required Permissions:**
- `compute.instances.get`
- `compute.instances.list`

**Operations:**
- Query instance status
- Retrieve instance details
- List all instances

## Security Considerations

### Principle of Least Privilege

**Best Practice:** Grant only the permissions required for CloudDesk operations.

**Implementation:**
1. Start with custom role containing minimal permissions
2. Add permissions only when needed
3. Regularly audit and remove unused permissions
4. Use separate service accounts for different environments (dev, staging, prod)

### Permission Boundaries

**What CloudDesk DOES NOT need:**
- ❌ `compute.instances.update` - Not used by CloudDesk
- ❌ `compute.networks.*` - Network management not required
- ❌ `compute.firewalls.*` - Firewall management not required
- ❌ `compute.snapshots.*` - Snapshot management not implemented
- ❌ `compute.images.create` - Custom image creation not required
- ❌ Project-level permissions (Owner, Editor)

### Conditional Access

For advanced security, use IAM Conditions to restrict access:

```bash
# Example: Restrict to specific zones
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1" \
  --condition='expression=resource.name.startsWith("projects/YOUR_PROJECT_ID/zones/asia-southeast1-a") || resource.name.startsWith("projects/YOUR_PROJECT_ID/zones/us-central1-a"),title=CloudDesk Zones Only'
```

## Troubleshooting Permission Issues

### Error: "Permission denied"

**Symptoms:**
```
ERROR: (gcloud.compute.instances.create) Could not fetch resource:
 - Required 'compute.instances.create' permission for 'projects/YOUR_PROJECT_ID'
```

**Solution:**
1. Verify service account has required role:
   ```bash
   gcloud projects get-iam-policy YOUR_PROJECT_ID \
     --flatten="bindings[].members" \
     --filter="bindings.members:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com"
   ```

2. Re-grant permissions:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

3. Wait 60 seconds for IAM changes to propagate

### Error: "API not enabled"

**Symptoms:**
```
ERROR: (gcloud.compute.instances.create) API [compute.googleapis.com] not enabled
```

**Solution:**
```bash
gcloud services enable compute.googleapis.com
```

### Error: "Insufficient permissions for setMetadata"

**Symptoms:** Windows password reset fails with permission error

**Solution:**
```bash
# Verify setMetadata permission
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --format="value(bindings.role)" | xargs -I {} gcloud iam roles describe {} --format="value(includedPermissions)" | grep setMetadata

# If missing, add permission to custom role or use compute.instanceAdmin.v1
```

## Permission Audit Checklist

Use this checklist to verify service account configuration:

- [ ] Service account created
- [ ] Service account has Compute Instance Admin role OR custom role with all required permissions
- [ ] Compute Engine API enabled
- [ ] Cloud Resource Manager API enabled
- [ ] Service account key created and stored securely
- [ ] gcloud authenticated with service account
- [ ] Test instance creation succeeds
- [ ] Test instance start/stop succeeds
- [ ] Test instance deletion succeeds
- [ ] Test Windows password reset succeeds (for Windows instances)
- [ ] Audit logs enabled and monitored

## Additional Resources

- [GCP IAM Documentation](https://cloud.google.com/iam/docs)
- [Compute Engine IAM Roles](https://cloud.google.com/compute/docs/access/iam)
- [IAM Best Practices](https://cloud.google.com/iam/docs/best-practices)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
- [CloudDesk GCP Setup Guide](./gcp-setup-guide.md)

---

**Last Updated:** November 2024  
**Version:** 1.0

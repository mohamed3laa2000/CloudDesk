# CloudDesk Backend Server

Backend API for CloudDesk authentication system using Firebase Authentication, JWT, and PostgreSQL.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Configure environment variables in `.env`:
   - Set `JWT_SECRET` (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - Set `DATABASE_URL` with your Supabase PostgreSQL connection string
   - Set Firebase Admin SDK credentials

4. Run database migrations:
   ```bash
   npm run migrate
   ```
   This will create the `approved_users` table and necessary indexes.

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with Firebase ID token
- `POST /api/auth/verify` - Verify JWT token
- `GET /api/health` - Health check

### Passkey Authentication
- `POST /api/auth/passkey/register-options` - Get WebAuthn registration options
- `POST /api/auth/passkey/register-verify` - Verify and store new passkey
- `POST /api/auth/passkey/login-options` - Get WebAuthn authentication options
- `POST /api/auth/passkey/login-verify` - Verify passkey and issue JWT
- `GET /api/auth/passkey/list` - List user's enrolled passkeys
- `DELETE /api/auth/passkey/:id` - Delete a passkey
- `PATCH /api/auth/passkey/:id/name` - Update passkey friendly name
- `GET /api/auth/passkey/2fa-status` - Get 2FA mode status
- `PUT /api/auth/passkey/2fa-status` - Enable/disable 2FA mode

### Instance Management
- `GET /api/instances` - List all instances for authenticated user
- `POST /api/instances` - Create new instance (provisions GCP VM if enabled)
- `GET /api/instances/:id` - Get instance details
- `PATCH /api/instances/:id/status` - Update instance status (start/stop)
- `DELETE /api/instances/:id` - Delete instance (removes GCP VM if applicable)
- `POST /api/instances/:id/reset-password` - Reset Windows password (GCP only)

## WebAuthn / Passkey Authentication

CloudDesk supports passwordless authentication using WebAuthn passkeys. Users can authenticate using:
- **Platform authenticators**: Built-in biometrics (Face ID, Touch ID, Windows Hello)
- **Cross-platform authenticators**: Security keys (YubiKey, Titan Key)

### Features

- **Standalone passkey login**: Sign in using only a passkey (no password required)
- **2FA mode**: Require passkey verification after Google OAuth login
- **Passkey management**: Enroll, rename, and delete passkeys from profile settings
- **Multiple passkeys**: Users can register multiple authenticators
- **Phishing-resistant**: Public key cryptography prevents credential theft

### Configuration

WebAuthn requires three environment variables in `server/.env`:

```env
# Relying Party ID - must match your domain
RP_ID=localhost                    # Development
# RP_ID=example.com                # Production

# Relying Party Name - shown to users during enrollment
RP_NAME=CloudDesk

# Expected Origin - complete URL with protocol
ORIGIN=http://localhost:5173       # Development
# ORIGIN=https://example.com       # Production
```

**Important Configuration Rules:**

1. **RP_ID** must match your domain:
   - Development: `localhost`
   - Production: `example.com` or `app.example.com`
   - Cannot include protocol or port
   - Changing this invalidates all existing passkeys

2. **ORIGIN** must match the browser URL exactly:
   - Must include protocol (`http://` or `https://`)
   - Must include port for non-standard ports
   - Production must use HTTPS (WebAuthn requires secure context)

3. **RP_NAME** is displayed to users:
   - Should be your application or company name
   - Shown in browser prompts and authenticator interfaces

### Development vs Production

**Development Setup:**
```env
RP_ID=localhost
RP_NAME=CloudDesk Dev
ORIGIN=http://localhost:5173
```

**Production Setup:**
```env
RP_ID=yourdomain.com
RP_NAME=CloudDesk
ORIGIN=https://yourdomain.com
```

### Database Schema

Passkey authentication requires two additional tables:

**passkeys table:**
- Stores user credentials (public keys, counters, metadata)
- One user can have multiple passkeys
- Includes friendly names for easy identification

**webauthn_challenges table:**
- Temporary storage for authentication challenges
- Challenges expire after 5 minutes
- Prevents replay attacks

Run migrations to create these tables:
```bash
npm run migrate
```

### Security Features

- **Challenge-response authentication**: Prevents replay attacks
- **Counter validation**: Detects cloned authenticators
- **Origin verification**: Prevents cross-origin attacks
- **Signature validation**: Cryptographic proof of possession
- **User verification**: Requires biometric or PIN

### Browser Support

WebAuthn is supported in:
- Chrome/Edge 67+
- Firefox 60+
- Safari 13+
- Mobile browsers (iOS 14+, Android Chrome)

The application automatically detects WebAuthn support and hides passkey options in unsupported browsers.

**For detailed browser compatibility information**, including:
- Platform authenticator requirements (Touch ID, Windows Hello, etc.)
- Security key compatibility
- Troubleshooting guide
- Update instructions

See the comprehensive [Browser Compatibility Guide](../docs/passkey-browser-compatibility.md).

### Testing

Run passkey-related tests:
```bash
# Unit tests
npm test -- webauthnService.test.js
npm test -- passkeyController.test.js

# Integration tests
npm test -- passkeyRegistration.integration.test.js
npm test -- passkeyAuthentication.integration.test.js
npm test -- passkeyManagement.integration.test.js

# Property-based tests
npm test -- passkeyController.property.test.js
```

### Troubleshooting

**"WebAuthn not supported"**
- Ensure you're using HTTPS in production
- Check browser compatibility
- Verify secure context (localhost or HTTPS)

**"Origin mismatch"**
- Verify ORIGIN matches browser URL exactly
- Include protocol and port
- Check for trailing slashes

**"RP_ID mismatch"**
- Ensure RP_ID matches domain (without protocol)
- Cannot use IP addresses in production
- Subdomains must match exactly

**"Challenge expired"**
- Challenges expire after 5 minutes
- User must complete authentication promptly
- Check server time synchronization

## Database Migrations

The project uses SQL migration files to manage database schema changes.

### Running Migrations

To run all migrations:
```bash
npm run migrate
```

### Migration Files

Migration files are located in `server/migrations/` and are executed in alphabetical order:
- `001_create_approved_users.sql` - Creates the approved_users table with email index

### Creating New Migrations

1. Create a new SQL file in `server/migrations/` with a numbered prefix (e.g., `002_add_new_table.sql`)
2. Write your SQL statements in the file
3. Run `npm run migrate` to apply the migration

## GCP Compute Engine Integration

CloudDesk supports real VM provisioning using Google Cloud Platform Compute Engine.

### Prerequisites

1. **GCP Project Setup**
   - Active GCP project with billing enabled
   - Compute Engine API enabled
   - Cloud Resource Manager API enabled

2. **gcloud SDK Installation**
   ```bash
   # Install gcloud SDK (see https://cloud.google.com/sdk/docs/install)
   
   # Verify installation
   gcloud --version
   ```

3. **Service Account Configuration**
   ```bash
   # Create service account
   gcloud iam service-accounts create clouddesk-compute \
     --display-name="CloudDesk Compute Service Account"
   
   # Grant Compute Instance Admin role
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   
   # Create service account key
   gcloud iam service-accounts keys create ~/clouddesk-sa-key.json \
     --iam-account=clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

4. **Authenticate on Server**
   ```bash
   gcloud auth activate-service-account \
     --key-file=/path/to/clouddesk-sa-key.json
   
   # Set default project
   gcloud config set project YOUR_PROJECT_ID
   ```

### Required GCP Permissions

The service account needs the following permissions:

- `compute.instances.create` - Create VM instances
- `compute.instances.delete` - Delete VM instances
- `compute.instances.get` - Query instance status
- `compute.instances.list` - List instances
- `compute.instances.start` - Start stopped instances
- `compute.instances.stop` - Stop running instances
- `compute.instances.setMetadata` - Windows password reset
- `compute.disks.create` - Create boot disks
- `compute.images.useReadOnly` - Use Windows images
- `compute.zones.get` - Access zone information

**Recommended:** Use the built-in `roles/compute.instanceAdmin.v1` role which includes all required permissions.

### Configuration

Add to your `.env` file:

```env
# GCP Configuration
GCP_PROJECT_ID=your-gcp-project-id
GCP_ENABLED=true  # Set to false for demo mode
```

### Supported Regions

| CloudDesk Region | GCP Region | GCP Zone |
|-----------------|------------|----------|
| SINGAPORE | asia-southeast1 | asia-southeast1-a |
| IOWA | us-central1 | us-central1-a |

### Features

**When GCP is Enabled:**
- Real Windows Server VM provisioning
- Instance lifecycle management (start/stop/delete)
- Windows password reset functionality
- Real-time status synchronization with GCP
- External IP address assignment
- Comprehensive error handling and logging

**When GCP is Disabled (Demo Mode):**
- Database-only instance management
- Instant operations (no actual VMs)
- No GCP costs
- Perfect for development and testing

### GCP Service Architecture

The `gcpService.js` module handles all GCP interactions:

```javascript
// Core operations
createInstance(config)           // Provision new VM
startInstance(name, zone)        // Start stopped VM
stopInstance(name, zone)         // Stop running VM
deleteInstance(name, zone)       // Delete VM
getInstanceStatus(name, zone)    // Query VM status
resetWindowsPassword(name, zone, username)  // Reset Windows password

// Internal helpers
_executeGcloudCommand(args)      // Execute gcloud CLI commands
_mapToMachineType(cpu, ram)      // Map resources to GCP machine types
_mapToGcpZone(region)            // Map CloudDesk regions to GCP zones
_mapToGcpImage(imageId)          // Map image presets to Windows images
```

### Error Handling

The GCP service provides structured error responses:

- `GCP_AUTH_ERROR` - Authentication required
- `GCP_PERMISSION_ERROR` - Insufficient permissions
- `GCP_QUOTA_ERROR` - Project quota exceeded
- `GCP_NOT_FOUND` - Instance not found
- `GCP_TIMEOUT` - Operation timed out
- `GCP_INVALID_CONFIG` - Invalid configuration

### Logging

All GCP operations are logged with:
- Operation type and parameters
- Execution time
- Success/failure status
- Error details (if applicable)
- User context

### Testing

Run GCP service tests:
```bash
npm test -- gcpService.test.js
```

Tests include:
- Machine type mapping validation
- Region to zone mapping
- Command execution with timeouts
- Error handling scenarios
- Status transition validation

### Troubleshooting

**gcloud not found:**
- Ensure gcloud SDK is installed and in PATH
- Restart terminal after installation

**Authentication errors:**
- Verify service account key is valid
- Check service account has required permissions
- Re-authenticate with `gcloud auth activate-service-account`

**Permission denied:**
- Verify IAM role assignment
- Check that Compute Engine API is enabled
- Review service account permissions in GCP Console

**Quota exceeded:**
- Check project quotas in GCP Console
- Request quota increases if needed
- Try different region

## Project Structure

```
server/
├── config/          # Configuration files
├── controllers/     # Request handlers
│   ├── authController.js
│   ├── instanceController.js
│   └── ...
├── middleware/      # Express middleware
├── migrations/      # Database migration scripts
├── routes/          # API routes
│   ├── auth.js
│   ├── instances.js
│   └── ...
├── services/        # Business logic services
│   ├── firebaseAdmin.js
│   ├── jwtService.js
│   ├── dbService.js
│   └── gcpService.js      # GCP Compute Engine integration
├── tests/           # Unit and integration tests
│   ├── gcpService.test.js
│   └── ...
├── index.js         # Application entry point
└── package.json     # Dependencies
```

<div align="center">
  <img src="Foto/Logo CloudDesk White.png" alt="CloudDesk EDU Logo" width="120" height="120">
  
  # CloudDesk EDU
  
  ### Enterprise-grade cloud desktop platform for students, educators, and professionals
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
  
  [Live Demo](https://clouddesk-edu.vercel.app) · [Documentation](docs/) · [Report Bug](https://github.com/rofiperlungoding/CloudDesk/issues)
</div>

---

CloudDesk EDU is a modern, enterprise-grade SaaS platform that provides instant access to fully-configured cloud desktops. Built for educational institutions and professionals who need powerful computing resources without expensive hardware investments.

## ✨ Features

### 🔐 Authentication & Security
- **Firebase Authentication**: Secure Google OAuth integration
- **WebAuthn Passkey Authentication**: Passwordless login with biometrics or security keys
- **2FA Mode**: Optional passkey verification after Google login for enhanced security
- **JWT Token Management**: Stateless authentication with secure token handling
- **Domain Restriction**: Universitas Brawijaya (@ub.ac.id) email validation
- **Protected Routes**: Automatic authentication guards for secure pages
- **PostgreSQL User Management**: Approved user whitelist with database persistence

### 🖥️ Cloud Desktop Management
- **Instant Provisioning**: Deploy fully-configured desktops in seconds
- **Multiple Presets**: Pre-optimized configurations for Development, Data Science, 3D Rendering, and General Purpose
- **Flexible Resources**: Scale CPU (2-32 cores), RAM (4-128 GB), storage (30GB-2TB), and GPU on demand
- **13 Global Regions**: Deploy in US (4 regions), EU (4 regions), Asia Pacific (3 regions), Middle East, and South America
- **8 GPU Options**: From entry-level T4 to enterprise H100, categorized by use case (Entry, Professional, Enterprise, Workstation)

### 📊 Usage Analytics & Cost Management
- **Real-time Monitoring**: Track resource usage and costs as they happen
- **Detailed Breakdowns**: Per-instance cost analysis with visual charts
- **Cost Estimation**: Transparent pricing with hourly and monthly projections
- **Usage Insights**: Identify optimization opportunities and spending patterns

### 👥 Classroom Mode (Coming Soon)
- **Bulk Provisioning**: Deploy identical desktops for entire classes
- **Centralized Management**: Control all student desktops from one dashboard
- **Session Scheduling**: Automatic start/stop based on class schedules
- **Cost Control**: Set budgets and prevent runaway spending

### 📚 Comprehensive Documentation
- **API Reference**: Complete REST API documentation with 14+ endpoints
- **Interactive FAQ**: 28 questions across 7 categories with accordion UI
- **Getting Started Guide**: Step-by-step tutorials for new users
- **Integration Guides**: LMS, SSO, and third-party integrations

### 🎨 Enterprise Design System
- **Professional UI**: Clean, confident interface built for serious work
- **Accessibility First**: WCAG AA compliant, keyboard navigable, screen reader friendly
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Consistent Components**: Comprehensive design system with reusable components

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database (Supabase recommended)
- Firebase project with Google OAuth enabled
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/rofiperlungoding/CloudDesk.git
cd CloudDesk

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..

# Configure environment variables
# Copy .env.example to .env and fill in your values
cp .env.example .env
cp server/.env.example server/.env

# Run database migrations
cd server
npm run migrate
npm run seed

# If migrating from USD to IDR (optional - only if you have existing billing data)
npm run migrate:currency:test    # Test first
npm run migrate:currency         # Run migration
npm run migrate:currency:verify  # Verify results

cd ..

# Start backend server (in one terminal)
cd server
npm start

# Start frontend development server (in another terminal)
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

## 📁 Project Structure

```
CloudDesk/
├── docs/                          # Complete design documentation
│   ├── design-system-foundation.md    # Colors, typography, spacing
│   ├── component-library-spec.md      # Component specifications
│   ├── app-shell-spec.md              # Navigation and layout
│   ├── landing-page-spec.md           # Marketing page design
│   ├── dashboard-page-spec.md         # Dashboard specifications
│   ├── create-instance-page-spec.md   # Instance creation flow
│   ├── instance-detail-page-spec.md   # Detail page design
│   ├── usage-cost-page-spec.md        # Analytics page specs
│   ├── classroom-mode-page-spec.md    # Future feature preview
│   └── ui-consistency-checklist.md    # Quality assurance guide
│
├── server/                        # Backend API server
│   ├── controllers/               # Request handlers
│   │   └── authController.js      # Authentication logic
│   ├── middleware/                # Express middleware
│   │   └── errorHandler.js        # Global error handling
│   ├── services/                  # Business logic
│   │   ├── firebaseAdmin.js       # Firebase Admin SDK
│   │   ├── jwtService.js          # JWT token management
│   │   └── dbService.js           # Database operations
│   ├── routes/                    # API routes
│   │   └── auth.js                # Authentication endpoints
│   ├── config/                    # Configuration
│   │   └── database.js            # PostgreSQL connection
│   ├── migrations/                # Database migrations
│   │   ├── 001_create_approved_users.sql
│   │   └── 002_seed_approved_users.sql
│   ├── tests/                     # Unit tests
│   └── index.js                   # Server entry point
│
├── src/
│   ├── components/
│   │   ├── Auth/                  # Authentication components
│   │   │   └── AuthGuard.tsx      # Protected route wrapper
│   │   ├── Layout/                # App shell, navigation, sidebar
│   │   │   └── TopNav.tsx         # Top navigation with user menu
│   │   └── ui/                    # Reusable UI components
│   │       ├── Button.tsx         # Primary, secondary, ghost variants
│   │       ├── Card.tsx           # Content containers
│   │       ├── Input.tsx          # Form inputs with validation
│   │       ├── Select.tsx         # Dropdown selectors
│   │       ├── Badge.tsx          # Status indicators
│   │       ├── Tabs.tsx           # Tab navigation
│   │       └── ComponentShowcase.tsx  # Component documentation
│   │
│   ├── contexts/                  # React contexts
│   │   └── AuthContext.tsx        # Authentication state management
│   │
│   ├── services/                  # API services
│   │   ├── api.ts                 # Axios instance with interceptors
│   │   └── firebase.ts            # Firebase client configuration
│   │
│   ├── routes/                    # Page components
│   │   ├── Login.tsx              # Login page with Google OAuth
│   │   ├── Landing.tsx            # Public landing page
│   │   ├── Dashboard.tsx          # Instance overview (protected)
│   │   ├── CreateInstance.tsx     # Instance creation wizard (protected)
│   │   ├── InstanceDetail.tsx     # Single instance view (protected)
│   │   ├── Usage.tsx              # Analytics and billing (protected)
│   │   └── Classroom.tsx          # Feature preview (protected)
│   │
│   ├── data/                      # Mock data and types
│   │   ├── types.ts               # TypeScript interfaces
│   │   ├── instances.ts           # Instance data
│   │   ├── pricing.ts             # Pricing information
│   │   ├── usage.ts               # Usage statistics
│   │   └── images.ts              # Image assets
│   │
│   ├── hooks/                     # Custom React hooks
│   │   └── useInstancesDemo.ts    # Instance state management
│   │
│   ├── styles/                    # Global styles and tokens
│   │   ├── global.css             # Base styles
│   │   └── tokens.ts              # Design tokens
│   │
│   ├── App.tsx                    # Root component with routing
│   └── main.tsx                   # Application entry point
│
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite build configuration
```

## 🎨 Design System

CloudDesk EDU follows a comprehensive design system built for enterprise applications.

### Color Palette

- **Primary**: Teal 600 (`#0F766E`) - Actions, links, focus states
- **Neutrals**: Gray 50-900 - Text, backgrounds, borders
- **Success**: Emerald 500 (`#10B981`) - Positive states
- **Warning**: Amber 500 (`#F59E0B`) - Caution states
- **Error**: Red 500 (`#EF4444`) - Errors, destructive actions

### Typography

- **Font Family**: Inter (with system fallbacks)
- **Scale**: 12px, 13px, 14px, 16px, 18px, 24px, 32px, 36px
- **Weights**: 400 (regular), 500 (medium), 600 (semibold)
- **Line Heights**: 1.2 (headings), 1.5 (body text)

### Spacing Scale

Based on 4px increments: 4, 8, 12, 16, 24, 32, 48, 64

### Component Library

All components follow consistent patterns:
- **Buttons**: Primary, Secondary, Ghost, Destructive variants
- **Cards**: White background, subtle borders, consistent padding
- **Forms**: Clear labels, inline validation, accessible error states
- **Tables**: Sortable columns, hover states, responsive design
- **Badges**: Semantic colors for status indication

See [Component Library Spec](docs/component-library-spec.md) for complete documentation.

## 🧩 Key Components

### Button Component

```tsx
import { Button } from '@/components/ui/Button';

// Primary action
<Button variant="primary">Create Desktop</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Destructive action
<Button variant="destructive">Delete</Button>

// With loading state
<Button variant="primary" loading>Creating...</Button>
```

### Card Component

```tsx
import { Card } from '@/components/ui/Card';

<Card>
  <Card.Header>
    <Card.Title>Desktop Configuration</Card.Title>
  </Card.Header>
  <Card.Body>
    {/* Content */}
  </Card.Body>
</Card>
```

### Status Badge

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="success">Running</Badge>
<Badge variant="warning">Provisioning</Badge>
<Badge variant="error">Error</Badge>
```

## 📱 Pages & Routes

### Public Routes

- **`/`** - Landing page with product overview and CTAs
- **`/product`** - Product features and benefits
- **`/pricing`** - Pricing plans and comparison
- **`/use-cases`** - Use case examples and testimonials
- **`/about`** - Company mission, vision, and values
- **`/contact`** - Contact form and support information
- **`/docs`** - Documentation hub
- **`/docs/getting-started`** - Getting started guide
- **`/docs/api`** - API reference documentation
- **`/docs/faq`** - Frequently asked questions (card layout)
- **`/docs/faq-accordion`** - FAQ with interactive accordion
- **`/community`** - Community forum with discussions
- **`/support`** - Contact support page with multiple channels
- **`/security`** - Security features and compliance information
- **`/privacy`** - Privacy policy
- **`/terms`** - Terms of service

### Authenticated Routes

- **`/dashboard`** - Instance overview with summary cards and table
- **`/create`** - Instance creation wizard with presets and configuration
- **`/instances/:id`** - Detailed instance view with actions
- **`/usage`** - Usage analytics and cost breakdown
- **`/classroom`** - Classroom Mode feature preview (coming soon)

## 🔧 Configuration

### Environment Variables

#### Frontend Configuration

Create a `.env` file in the root directory (see `.env.example`):

```env
# Backend API URL
VITE_API_URL=http://localhost:3001

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

#### Backend Configuration

Create a `server/.env` file (see `server/.env.example`):

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# JWT Configuration
JWT_SECRET=your_jwt_secret_minimum_32_characters

# PostgreSQL Database
DATABASE_URL=postgresql://username:password@host:5432/database

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# WebAuthn / Passkey Authentication
RP_ID=localhost                    # Must match your domain (use 'localhost' for dev)
RP_NAME=CloudDesk                  # Displayed to users during passkey enrollment
ORIGIN=http://localhost:5173       # Complete URL with protocol (use HTTPS in production)

# GCP Compute Engine Integration (Optional)
GCP_PROJECT_ID=your-gcp-project-id
GCP_ENABLED=false  # Set to true to enable real VM provisioning
```

**Important**: Never commit `.env` files to version control. They are already included in `.gitignore`.

### WebAuthn / Passkey Authentication

CloudDesk EDU supports passwordless authentication using WebAuthn passkeys. Users can sign in using biometrics (Face ID, Touch ID, Windows Hello) or security keys (YubiKey, Titan Key).

#### Features

- **Standalone Passkey Login**: Sign in using only a passkey without Google OAuth
- **2FA Mode**: Require passkey verification after Google login for enhanced security
- **Multiple Authenticators**: Users can register multiple passkeys (platform and cross-platform)
- **Passkey Management**: Enroll, rename, and delete passkeys from profile settings
- **Phishing-Resistant**: Public key cryptography prevents credential theft and phishing

#### Configuration

WebAuthn requires three environment variables in `server/.env`:

```env
# Relying Party ID - must match your domain
RP_ID=localhost                    # Development
# RP_ID=example.com                # Production

# Relying Party Name - shown to users
RP_NAME=CloudDesk

# Expected Origin - complete URL with protocol
ORIGIN=http://localhost:5173       # Development
# ORIGIN=https://example.com       # Production (MUST use HTTPS)
```

#### Configuration Rules

**RP_ID (Relying Party ID):**
- Must match your domain name (without protocol or port)
- Development: `localhost`
- Production: `example.com` or `app.example.com`
- Cannot include `http://`, `https://`, or port numbers
- **CRITICAL**: Changing this value invalidates all existing passkeys

**ORIGIN (Expected Origin):**
- Must be the complete URL where users access your application
- Must include protocol (`http://` or `https://`)
- Must include port for non-standard ports (e.g., `:5173`)
- Production **MUST** use HTTPS (WebAuthn requires secure context)
- Must match exactly what appears in the browser address bar

**RP_NAME (Relying Party Name):**
- Human-readable name displayed to users during passkey enrollment
- Shown in browser prompts and authenticator interfaces
- Should be your application or company name

#### Development vs Production Examples

**Development Setup:**
```env
RP_ID=localhost
RP_NAME=CloudDesk Dev
ORIGIN=http://localhost:5173
```

**Production Setup (Root Domain):**
```env
RP_ID=example.com
RP_NAME=CloudDesk
ORIGIN=https://example.com
```

**Production Setup (Subdomain):**
```env
RP_ID=app.example.com
RP_NAME=CloudDesk
ORIGIN=https://app.example.com
```

#### Database Setup

Passkey authentication requires additional database tables. Run migrations to create them:

```bash
cd server
npm run migrate
```

This creates:
- `passkeys` table - Stores user credentials and metadata
- `webauthn_challenges` table - Temporary challenge storage (5-minute expiration)
- `passkey_2fa_enabled` column in `approved_users` table

#### Browser Support

WebAuthn is supported in:
- ✅ Chrome/Edge 67+
- ✅ Firefox 60+
- ✅ Safari 13+
- ✅ iOS Safari 14+
- ✅ Android Chrome 70+

The application automatically detects WebAuthn support and gracefully hides passkey options in unsupported browsers.

#### Security Features

- **Challenge-Response**: Cryptographically random challenges prevent replay attacks
- **Counter Validation**: Detects cloned authenticators by tracking signature counters
- **Origin Verification**: Prevents cross-origin and phishing attacks
- **Signature Validation**: Cryptographic proof that user possesses the private key
- **User Verification**: Requires biometric or PIN for authentication
- **5-Minute Challenge Expiration**: Prevents stale challenge reuse

#### Troubleshooting

**"WebAuthn not supported" error:**
- Ensure you're using HTTPS in production (required by WebAuthn spec)
- Check browser compatibility (see [Browser Compatibility Guide](docs/passkey-browser-compatibility.md))
- Verify you're in a secure context (localhost or HTTPS)
- Update to a modern browser: Chrome 67+, Firefox 60+, Safari 13+

**"Origin mismatch" error:**
- Verify `ORIGIN` environment variable matches browser URL exactly
- Include protocol (`http://` or `https://`)
- Include port if non-standard (e.g., `:5173`)
- Check for trailing slashes (should not be included)

**"RP_ID mismatch" error:**
- Ensure `RP_ID` matches your domain without protocol
- Cannot use IP addresses in production
- Subdomains must match exactly (e.g., `app.example.com` not `example.com`)

**"Challenge expired" error:**
- Challenges expire after 5 minutes for security
- User must complete authentication promptly
- Check server time synchronization (NTP)

**Passkeys not working after deployment:**
- Verify all three environment variables are set correctly
- Ensure production uses HTTPS
- Check that `RP_ID` matches your production domain
- Review server logs for detailed error messages

For more details, see the [WebAuthn section in server/README.md](server/README.md#webauthn--passkey-authentication).

### Currency Migration (USD to IDR)

CloudDesk EDU uses Indonesian Rupiah (IDR) for all pricing. If you have existing billing data in USD, use the migration scripts:

```bash
cd server

# Step 1: Test migration (safe, no real data changed)
npm run migrate:currency:test

# Step 2: Run migration (converts USD to IDR at 1 USD = 16,600 IDR)
npm run migrate:currency

# Step 3: Verify results
npm run migrate:currency:verify
```

**Features:**
- ✅ Automatic backup creation before migration
- ✅ Interactive confirmation prompts
- ✅ Comprehensive verification
- ✅ Idempotent (safe to run multiple times)
- ✅ Rollback instructions provided

**Note:** If you're starting fresh with no existing billing data, you don't need to run the migration. The application is already configured for IDR.

For detailed instructions, see [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md).

### GCP Compute Engine Integration (Optional)

CloudDesk EDU supports real Google Cloud Platform VM provisioning for production deployments. When enabled, the system provisions actual Windows-based virtual machines in GCP instead of using demo mode.

#### Prerequisites

1. **Google Cloud Platform Account**
   - Active GCP project with billing enabled
   - gcloud SDK installed on the server
   - Service account with appropriate permissions

2. **Required GCP APIs**
   
   Enable the following APIs in your GCP project:
   ```bash
   gcloud services enable compute.googleapis.com
   gcloud services enable cloudresourcemanager.googleapis.com
   ```

3. **Install gcloud SDK**
   
   Follow the [official installation guide](https://cloud.google.com/sdk/docs/install) for your operating system:
   
   ```bash
   # Verify installation
   gcloud --version
   
   # Authenticate with service account
   gcloud auth activate-service-account --key-file=/path/to/service-account-key.json
   
   # Set default project
   gcloud config set project YOUR_PROJECT_ID
   ```

#### Required GCP Permissions

Create a service account with the following IAM roles:

**Compute Engine Permissions:**
- `compute.instances.create` - Create VM instances
- `compute.instances.delete` - Delete VM instances
- `compute.instances.get` - Query instance status and details
- `compute.instances.list` - List instances in project
- `compute.instances.start` - Start stopped instances
- `compute.instances.stop` - Stop running instances
- `compute.instances.setMetadata` - Required for Windows password reset
- `compute.disks.create` - Create boot disks for instances
- `compute.images.useReadOnly` - Use Windows Server images
- `compute.zones.get` - Access zone information

**Recommended IAM Role:**

The easiest approach is to assign the **Compute Instance Admin (v1)** role (`roles/compute.instanceAdmin.v1`) to your service account:

```bash
# Create service account
gcloud iam service-accounts create clouddesk-compute \
  --display-name="CloudDesk Compute Service Account"

# Grant Compute Instance Admin role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"

# Create and download service account key
gcloud iam service-accounts keys create ~/clouddesk-sa-key.json \
  --iam-account=clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

**Custom Role (Advanced):**

For fine-grained control, create a custom role with only the required permissions:

```bash
# Create custom role
gcloud iam roles create cloudDeskComputeRole \
  --project=YOUR_PROJECT_ID \
  --title="CloudDesk Compute Role" \
  --description="Custom role for CloudDesk VM management" \
  --permissions=compute.instances.create,compute.instances.delete,compute.instances.get,compute.instances.list,compute.instances.start,compute.instances.stop,compute.instances.setMetadata,compute.disks.create,compute.images.useReadOnly,compute.zones.get

# Assign custom role to service account
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:clouddesk-compute@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="projects/YOUR_PROJECT_ID/roles/cloudDeskComputeRole"
```

#### Configuration Steps

1. **Set Environment Variables**
   
   Update `server/.env`:
   ```env
   GCP_PROJECT_ID=your-gcp-project-id
   GCP_ENABLED=true
   ```

2. **Authenticate gcloud SDK**
   
   On your server, authenticate using the service account:
   ```bash
   gcloud auth activate-service-account \
     --key-file=/path/to/clouddesk-sa-key.json
   ```

3. **Verify Configuration**
   
   Test that gcloud is properly configured:
   ```bash
   # List available zones
   gcloud compute zones list
   
   # Verify authentication
   gcloud auth list
   
   # Check project configuration
   gcloud config get-value project
   ```

4. **Start the Server**
   
   The server will automatically detect GCP configuration on startup:
   ```bash
   cd server
   npm start
   ```
   
   Look for the log message:
   ```
   ✓ GCP Compute Engine integration enabled
   ✓ Project: your-gcp-project-id
   ```

#### Supported Regions

CloudDesk currently supports VM provisioning in two GCP regions:

| CloudDesk Region | GCP Region | GCP Zone | Location |
|-----------------|------------|----------|----------|
| SINGAPORE | asia-southeast1 | asia-southeast1-a | Singapore |
| IOWA | us-central1 | us-central1-a | Iowa, USA |

#### Features

When GCP integration is enabled:

- ✅ **Real VM Provisioning**: Creates actual Windows Server VMs in GCP
- ✅ **Windows Password Reset**: Generate and retrieve Windows administrator passwords
- ✅ **Instance Lifecycle Management**: Start, stop, and delete VMs
- ✅ **Status Synchronization**: Real-time status updates from GCP
- ✅ **External IP Assignment**: Automatic public IP allocation
- ✅ **Error Handling**: Comprehensive error messages for GCP operations
- ✅ **Audit Logging**: All GCP operations logged with context

#### Demo Mode vs Production Mode

**Demo Mode** (`GCP_ENABLED=false`):
- Uses database-only instance management
- No actual VMs provisioned
- Instant operations (no waiting)
- No GCP costs
- Perfect for development and testing

**Production Mode** (`GCP_ENABLED=true`):
- Provisions real Windows Server VMs in GCP
- 5-10 minute provisioning time
- Actual compute costs apply
- Full Windows desktop functionality
- Requires GCP credentials

#### Troubleshooting

**"gcloud command not found"**
- Ensure gcloud SDK is installed and in your PATH
- Restart your terminal after installation

**"Authentication failed"**
- Verify service account key is valid
- Check that service account has required permissions
- Re-authenticate: `gcloud auth activate-service-account --key-file=...`

**"Quota exceeded"**
- Check your GCP project quotas in the console
- Request quota increases if needed
- Try a different region

**"Permission denied"**
- Verify service account has Compute Instance Admin role
- Check that required APIs are enabled
- Review IAM policy bindings

**"Instance creation timeout"**
- GCP VM provisioning can take 5-10 minutes
- Check GCP Console for instance status
- Review server logs for detailed error messages

#### Cost Considerations

GCP charges apply for:
- **Compute**: Per-second billing for VM instances
- **Storage**: Boot disk storage (minimum 50GB for Windows)
- **Network**: Egress traffic (ingress is free)
- **Licensing**: Windows Server license included in machine cost

Estimate costs using the [GCP Pricing Calculator](https://cloud.google.com/products/calculator).

**Cost Optimization Tips:**
- Stop instances when not in use (storage costs only)
- Use preemptible VMs for non-critical workloads (not yet supported)
- Choose appropriate machine types (don't over-provision)
- Monitor usage with CloudDesk analytics

### Tailwind Configuration

The project uses a custom Tailwind configuration with extended color palette and design tokens. See `tailwind.config.js` for details.

## 🧪 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Type check without emitting files
npm run type-check

# Lint code with ESLint
npm run lint

# Format code with Prettier
npm run format

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

The project maintains high code quality standards:
- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Enforces code style and best practices
- **Prettier**: Consistent code formatting
- **Component Documentation**: All components include usage examples

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📚 Documentation

Comprehensive documentation is available in the `docs/` directory:

### Design & Components
1. **[Design System Foundation](docs/design-system-foundation.md)** - Colors, typography, spacing, elevation
2. **[Component Library](docs/component-library-spec.md)** - Complete component specifications
3. **[App Shell](docs/app-shell-spec.md)** - Navigation and layout structure
4. **[UI Consistency Checklist](docs/ui-consistency-checklist.md)** - Quality assurance guidelines

### User Documentation
- **[API Reference](/docs/api)** - Complete REST API documentation with 14+ endpoints
- **[FAQ](/docs/faq)** - 28 frequently asked questions across 7 categories
- **[Getting Started](/docs/getting-started)** - Quick start guide for new users
- **[Quick Reference](docs/QUICK-REFERENCE.md)** - Developer quick reference guide

### GCP Integration Documentation
- **[GCP Integration Summary](docs/GCP-INTEGRATION-SUMMARY.md)** - Overview of GCP integration features and documentation
- **[GCP Setup Guide](docs/gcp-setup-guide.md)** - Complete setup instructions for GCP Compute Engine
- **[GCP Permissions Reference](docs/gcp-permissions-reference.md)** - Detailed IAM permissions documentation
- **[GCP Error Handling](docs/gcp-error-handling-implementation.md)** - Error handling implementation details

### Page Specifications

Each page has detailed design specifications:
- [Landing Page](docs/landing-page-spec.md)
- [Dashboard](docs/dashboard-page-spec.md)
- [Create Instance](docs/create-instance-page-spec.md)
- [Instance Detail](docs/instance-detail-page-spec.md)
- [Usage & Cost](docs/usage-cost-page-spec.md)
- [Classroom Mode](docs/classroom-mode-page-spec.md)

## 🎯 Roadmap

### Current Version (v1.0)
- ✅ Complete design system with teal corporate branding
- ✅ CloudDesk logo integration across all pages
- ✅ All core pages implemented (15+ routes)
- ✅ Firebase Authentication with Google OAuth
- ✅ JWT token-based authorization
- ✅ PostgreSQL database with user management
- ✅ Protected routes with authentication guards
- ✅ Domain-restricted login (@ub.ac.id)
- ✅ Backend API with Express.js
- ✅ 13 global server regions
- ✅ 8 GPU options with categorization
- ✅ Responsive design
- ✅ Accessibility compliance (WCAG AA)
- ✅ Professional icon system (Lucide React)
- ✅ Legal pages (Privacy Policy, Terms of Service)

### Upcoming Features
- 🔄 Real-time instance monitoring
- 🔄 Classroom Mode implementation
- 🔄 Advanced analytics and reporting
- 🔄 Multi-language support
- 🔄 Dark mode theme
- 🔄 Email notifications
- 🔄 Two-factor authentication

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the [UI Consistency Checklist](docs/ui-consistency-checklist.md)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style and conventions
- Ensure all TypeScript types are properly defined
- Test on multiple browsers and screen sizes
- Update documentation for new features
- Maintain accessibility standards (WCAG AA)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**CloudDesk EDU** is developed and maintained by:
- **Rofi Perlungoding** - [@rofiperlungoding](https://github.com/rofiperlungoding)
- **Gabriel Seto Pribadi** - [@private4920](https://github.com/private4920)

## 🙏 Acknowledgments

- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Vite](https://vitejs.dev/) - Build tool
- [Lucide](https://lucide.dev/) - Icon library
- [Inter Font](https://rsms.me/inter/) - Typography

## 📞 Support

For questions, issues, or feature requests:
- 📧 Email: support@clouddesk.edu
- 🐛 Issues: [GitHub Issues](https://github.com/rofiperlungoding/CloudDesk/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/rofiperlungoding/CloudDesk/discussions)

---

**Built with ❤️ for students, educators, and professionals worldwide.**

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
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone https://github.com/rofiperlungoding/CloudDesk.git
cd CloudDesk

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

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
├── src/
│   ├── components/
│   │   ├── layout/                # App shell, navigation, sidebar
│   │   └── ui/                    # Reusable UI components
│   │       ├── Button.tsx         # Primary, secondary, ghost variants
│   │       ├── Card.tsx           # Content containers
│   │       ├── Input.tsx          # Form inputs with validation
│   │       ├── Select.tsx         # Dropdown selectors
│   │       ├── Badge.tsx          # Status indicators
│   │       ├── Tabs.tsx           # Tab navigation
│   │       └── ComponentShowcase.tsx  # Component documentation
│   │
│   ├── routes/                    # Page components
│   │   ├── Landing.tsx            # Public landing page
│   │   ├── Dashboard.tsx          # Instance overview
│   │   ├── CreateInstance.tsx     # Instance creation wizard
│   │   ├── InstanceDetail.tsx     # Single instance view
│   │   ├── Usage.tsx              # Analytics and billing
│   │   └── Classroom.tsx          # Feature preview
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

Create a `.env` file in the root directory:

```env
# API Configuration (for future backend integration)
VITE_API_URL=https://api.clouddesk.edu
VITE_API_KEY=your_api_key_here

# Feature Flags
VITE_ENABLE_CLASSROOM_MODE=false
VITE_ENABLE_ANALYTICS=true
```

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
- ✅ 13 global server regions
- ✅ 8 GPU options with categorization
- ✅ Responsive design
- ✅ Accessibility compliance (WCAG AA)
- ✅ Professional icon system (Lucide React)
- ✅ Legal pages (Privacy Policy, Terms of Service)
- ✅ Mock data layer

### Upcoming Features
- 🔄 Backend API integration
- 🔄 Real-time instance monitoring
- 🔄 User authentication and authorization
- 🔄 Classroom Mode implementation
- 🔄 Advanced analytics and reporting
- 🔄 Multi-language support
- 🔄 Dark mode theme

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

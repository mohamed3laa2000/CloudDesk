import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { GraduationCap, Users, Briefcase, Zap, Settings, DollarSign, Globe } from 'lucide-react';

import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Landing() {
  useDocumentTitle('Cloud Desktops for Everyone');
  
  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left: Logo + Brand */}
            <div className="flex items-center gap-4 sm:gap-8">
              <Link to="/">
                <img src="/logo-clouddesk.png" alt="CloudDesk EDU" className="h-8 sm:h-9 w-auto object-contain hover:opacity-80 transition-opacity" />
              </Link>
              
              {/* Center: Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link to="/product" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Product
                </Link>
                <Link to="/use-cases" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Use Cases
                </Link>
                <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link to="/docs" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Documentation
                </Link>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/onboarding">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <div>
              <div className="inline-block mb-4">
                <span className="text-sm font-medium text-indigo-600 tracking-wide">
                  Cloud desktops for underpowered devices
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 leading-tight mb-6">
                Access powerful computing from any device
              </h1>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
                CloudDesk EDU provides instant access to fully-configured cloud
                desktops. Run resource-intensive applications, collaborate with
                your team, and work from anywhere—without expensive hardware.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/onboarding">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  View Demo
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                No credit card required • 7-day free trial
              </p>
            </div>

            {/* Right: Product Preview Card */}
            <div className="relative">
              <Card className="p-6 shadow-xl border-gray-200">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    My Desktops
                  </h3>
                </div>
                <div className="space-y-3">
                  {/* Desktop Item 1 */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Ubuntu 22.04 LTS
                        </span>
                        <Badge variant="success">Running</Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        4 vCPU • 8 GB RAM
                      </span>
                    </div>
                    <Button variant="primary" size="sm">
                      Connect
                    </Button>
                  </div>

                  {/* Desktop Item 2 */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Windows 11 Pro
                        </span>
                        <Badge variant="neutral">Stopped</Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        8 vCPU • 16 GB RAM
                      </span>
                    </div>
                    <Button variant="secondary" size="sm">
                      Start
                    </Button>
                  </div>

                  {/* Desktop Item 3 */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Data Science ML
                        </span>
                        <Badge variant="info">Provisioning</Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        8 vCPU • 32 GB RAM
                      </span>
                    </div>
                    <Button variant="secondary" size="sm" disabled>
                      Pending
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-8 sm:mb-12">
            <span className="text-sm font-medium text-indigo-600 tracking-wide">
              Who It's For
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mt-3 mb-4">
              Built for students, educators, and professionals
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're learning, teaching, or building, CloudDesk EDU
              adapts to your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Students Card */}
            <Card className="p-6 sm:p-8 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 bg-indigo-50 rounded-lg flex items-center justify-center mb-6">
                <GraduationCap className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                Students
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Run demanding software for coursework without buying expensive
                hardware. Access your desktop from the library, dorm, or home.
              </p>
            </Card>

            {/* Lecturers Card */}
            <Card className="p-6 sm:p-8 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 bg-indigo-50 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                Lecturers & Educators
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Provide consistent environments for all students. Manage
                classroom desktops, share resources, and ensure everyone has the
                tools they need.
              </p>
            </Card>

            {/* Professionals Card */}
            <Card className="p-6 sm:p-8 hover:shadow-lg hover:border-gray-300 transition-all">
              <div className="w-14 h-14 bg-indigo-50 rounded-lg flex items-center justify-center mb-6">
                <Briefcase className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                Professionals & Engineers
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Scale your computing power on demand. Run builds, simulations,
                and data processing without infrastructure overhead.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">
              Why CloudDesk EDU?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {/* Benefit 1 */}
            <div className="text-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Instant Access
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-[240px] mx-auto">
                Start working in seconds. No installation, no configuration, no
                waiting. Your desktop is ready when you are.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="text-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Flexible Resources
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-[240px] mx-auto">
                Scale CPU, RAM, and storage to match your workload. Adjust on
                the fly as your needs change.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="text-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Transparent Pricing
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-[240px] mx-auto">
                Pay only for what you use. No hidden fees, no surprises. Track
                your spending in real-time.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="text-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Work Anywhere
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-[240px] mx-auto">
                Access your desktop from any device with a browser. Your work
                follows you, not your hardware.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 bg-indigo-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-8">
            Create your first cloud desktop in under 60 seconds. No credit card
            required.
          </p>
          <Link to="/onboarding">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
          </Link>
          <p className="text-sm text-gray-500 mt-6">
            Free 7-day trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Branding */}
            <div>
              <div className="mb-4">
                <img src="/logo-clouddesk-white.png" alt="CloudDesk EDU" className="h-9 w-auto object-contain" />
              </div>
              <p className="text-sm">Cloud desktops for everyone</p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/product" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/docs" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="hover:text-white transition-colors">
                    Community
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/security" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 text-sm text-center">
            © 2025 CloudDesk EDU. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

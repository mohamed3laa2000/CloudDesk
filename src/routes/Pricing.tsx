import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Pricing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Brand */}
            <div className="flex items-center gap-8">
              <Link to="/">
                <img src="/logo-clouddesk.png" alt="CloudDesk EDU" className="h-9 w-auto object-contain hover:opacity-80 transition-opacity" />
              </Link>
              
              {/* Center: Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link to="/product" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Product
                </Link>
                <Link to="/use-cases" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Use Cases
                </Link>
                <Link to="/pricing" className="text-sm font-medium text-indigo-600 transition-colors">
                  Pricing
                </Link>
                <Link to="/docs" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Documentation
                </Link>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-semibold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600">
              Pay only for what you use. No hidden fees, no surprises. Scale up or down anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Student Plan */}
          <Card className="p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Student</h3>
              <p className="text-gray-600">Perfect for individual students</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-semibold text-gray-900">Rp 4.150</span>
                <span className="text-gray-600 ml-2">/hour</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">~Rp 332.000/month for typical usage</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Up to 4 vCPU</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Up to 8 GB RAM</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">50 GB SSD Storage</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Basic support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Community access</span>
              </li>
            </ul>
            <Button variant="secondary" className="w-full">
              Start Free Trial
            </Button>
          </Card>

          {/* Professional Plan */}
          <Card className="p-8 border-2 border-indigo-600 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-indigo-600 text-white text-sm font-medium rounded-full">
                Most Popular
              </span>
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Professional</h3>
              <p className="text-gray-600">For professionals and teams</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-semibold text-gray-900">Rp 8.300</span>
                <span className="text-gray-600 ml-2">/hour</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">~Rp 664.000/month for typical usage</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Up to 16 vCPU</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Up to 32 GB RAM</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">200 GB SSD Storage</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Basic GPU access</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Priority support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Team collaboration</span>
              </li>
            </ul>
            <Button variant="primary" className="w-full">
              Start Free Trial
            </Button>
          </Card>

          {/* Enterprise Plan */}
          <Card className="p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600">For institutions and large teams</p>
            </div>
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-semibold text-gray-900">Custom</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Volume discounts available</p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Unlimited resources</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Advanced GPU access</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Dedicated support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">SLA guarantee</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Custom integrations</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">Classroom Mode access</span>
              </li>
            </ul>
            <Button variant="secondary" className="w-full">
              Contact Sales
            </Button>
          </Card>
        </div>

        {/* Additional Costs */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            Additional Resources
          </h2>
          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">GPU Add-ons</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">NVIDIA T4 (Basic)</span>
                    <span className="font-medium text-gray-900">+Rp 5.810/hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">NVIDIA A100 (Advanced)</span>
                    <span className="font-medium text-gray-900">+Rp 60.922/hour</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Additional Storage</span>
                    <span className="font-medium text-gray-900">Rp 1.660/GB/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Backup Storage</span>
                    <span className="font-medium text-gray-900">Rp 830/GB/month</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-8 py-20">
          <h2 className="text-3xl font-semibold text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How does billing work?
              </h3>
              <p className="text-gray-600">
                You're only charged for the time your desktops are running. Billing is calculated per second and billed monthly. Stop your desktops when not in use to save costs.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! All new users get a 7-day free trial with $25 in credits. No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change my plan?
              </h3>
              <p className="text-gray-600">
                Absolutely. You can upgrade or downgrade your resources at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and wire transfers for enterprise customers.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer educational discounts?
              </h3>
              <p className="text-gray-600">
                Yes! Students and educators with valid .edu email addresses receive 50% off all plans. Contact us for verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <Card className="p-12 bg-indigo-50 border-indigo-200 text-center">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Start Your Free Trial Today
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            No credit card required. $25 in free credits. Cancel anytime.
          </p>
          <Button variant="primary" size="lg">
            Get Started Free
          </Button>
        </Card>
      </section>
      </div>
    </div>
  );
}

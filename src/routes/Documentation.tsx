import React from 'react';
import { Link } from 'react-router-dom';
import { Book, Code, Zap, Shield, HelpCircle, ExternalLink } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';

export function Documentation() {
  const [activeSection, setActiveSection] = React.useState('getting-started');

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry that is most visible
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio and position
          const mostVisible = visibleEntries.reduce((prev, current) => {
            const prevTop = prev.boundingClientRect.top;
            const currentTop = current.boundingClientRect.top;
            
            // Prefer the section closest to the top of viewport
            if (prevTop >= 0 && currentTop >= 0) {
              return prevTop < currentTop ? prev : current;
            }
            // If one is above viewport, prefer the one in viewport
            return prevTop >= 0 ? prev : current;
          });
          
          setActiveSection(mostVisible.target.id);
        }
      },
      {
        rootMargin: '-20% 0px -35% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    const sections = document.querySelectorAll('h2[id]');
    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

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
                <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link to="/docs" className="text-sm font-medium text-indigo-600 transition-colors">
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
              Documentation
            </h1>
            <p className="text-xl text-gray-600">
              Everything you need to get started with CloudDesk EDU
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start Cards */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8">Quick Start</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Link to="/docs/getting-started">
            <Card className="p-6 hover:border-indigo-300 transition-colors cursor-pointer">
              <Zap className="w-10 h-10 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Getting Started
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first cloud desktop in under 5 minutes
              </p>
              <Button variant="ghost" className="p-0 h-auto">
                Read guide →
              </Button>
            </Card>
          </Link>

          <Link to="/docs/api">
            <Card className="p-6 hover:border-indigo-300 transition-colors cursor-pointer">
              <Code className="w-10 h-10 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                API Reference
              </h3>
              <p className="text-gray-600 mb-4">
                Integrate CloudDesk into your applications
              </p>
              <Button variant="ghost" className="p-0 h-auto">
                View API docs →
              </Button>
            </Card>
          </Link>

          <Link to="/docs/faq">
            <Card className="p-6 hover:border-indigo-300 transition-colors cursor-pointer">
              <HelpCircle className="w-10 h-10 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                FAQ
              </h3>
              <p className="text-gray-600 mb-4">
                Answers to commonly asked questions
              </p>
              <Button variant="ghost" className="p-0 h-auto">
                Browse FAQ →
              </Button>
            </Card>
          </Link>
        </div>

        {/* Main Documentation */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Contents</h3>
              <nav className="space-y-2">
                <a 
                  href="#getting-started" 
                  className={`block text-sm transition-colors ${
                    activeSection === 'getting-started' 
                      ? 'text-indigo-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Getting Started
                </a>
                <a 
                  href="#creating-desktop" 
                  className={`block text-sm transition-colors ${
                    activeSection === 'creating-desktop' 
                      ? 'text-indigo-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Creating a Desktop
                </a>
                <a 
                  href="#connecting" 
                  className={`block text-sm transition-colors ${
                    activeSection === 'connecting' 
                      ? 'text-indigo-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Connecting
                </a>
                <a 
                  href="#managing" 
                  className={`block text-sm transition-colors ${
                    activeSection === 'managing' 
                      ? 'text-indigo-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Managing Desktops
                </a>
                <a 
                  href="#billing" 
                  className={`block text-sm transition-colors ${
                    activeSection === 'billing' 
                      ? 'text-indigo-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Billing & Usage
                </a>
                <a 
                  href="#security" 
                  className={`block text-sm transition-colors ${
                    activeSection === 'security' 
                      ? 'text-indigo-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Security
                </a>
                <a 
                  href="#troubleshooting" 
                  className={`block text-sm transition-colors ${
                    activeSection === 'troubleshooting' 
                      ? 'text-indigo-600 font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Troubleshooting
                </a>
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-12">
            <Card className="p-8">
              <h2 id="getting-started" className="text-2xl font-semibold text-gray-900 mb-6">
                Getting Started
              </h2>
              
              <div className="prose prose-gray max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  1. Create Your Account
                </h3>
                <p className="text-gray-600 mb-4">
                  Sign up for a free CloudDesk EDU account. No credit card required for the 7-day trial.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <code className="text-sm text-gray-900">
                    https://clouddesk.edu/signup
                  </code>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  2. Choose a Preset
                </h3>
                <p className="text-gray-600 mb-4">
                  Select from our pre-configured presets optimized for different workflows:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                  <li>General Purpose - For everyday tasks and light development</li>
                  <li>Development & Engineering - For software development</li>
                  <li>Data Science & ML - For data analysis and machine learning</li>
                  <li>3D Rendering & CAD - For graphics-intensive work</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  3. Customize Resources
                </h3>
                <p className="text-gray-600 mb-4">
                  Adjust CPU, RAM, storage, and GPU to match your needs. You can change these later.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  4. Deploy & Connect
                </h3>
                <p className="text-gray-600 mb-4">
                  Your desktop will be ready in 2-3 minutes. Connect via browser, RDP, or VNC.
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h2 id="creating-desktop" className="text-2xl font-semibold text-gray-900 mb-6">
                Creating a Desktop
              </h2>
              
              <div className="prose prose-gray max-w-none">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Configuration Options
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Instance Name</h4>
                    <p className="text-gray-600">
                      Choose a descriptive name to identify your desktop (e.g., "ML Project Desktop", "CAD Workstation").
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Region</h4>
                    <p className="text-gray-600 mb-2">
                      Select the region closest to you for best performance:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>US East (Virginia) - Lowest latency for East Coast US</li>
                      <li>US West (Oregon) - Lowest latency for West Coast US</li>
                      <li>EU West (Ireland) - Lowest latency for Europe</li>
                      <li>Asia Pacific (Singapore) - Lowest latency for Asia</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Resources</h4>
                    <p className="text-gray-600 mb-2">
                      Configure compute resources based on your workload:
                    </p>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 text-gray-900">Resource</th>
                            <th className="text-left py-2 text-gray-900">Range</th>
                            <th className="text-left py-2 text-gray-900">Recommended</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-600">
                          <tr className="border-b border-gray-200">
                            <td className="py-2">CPU</td>
                            <td className="py-2">1-16 vCPU</td>
                            <td className="py-2">4 vCPU</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-2">RAM</td>
                            <td className="py-2">2-64 GB</td>
                            <td className="py-2">8 GB</td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-2">Storage</td>
                            <td className="py-2">20-500 GB</td>
                            <td className="py-2">50 GB</td>
                          </tr>
                          <tr>
                            <td className="py-2">GPU</td>
                            <td className="py-2">None, T4, A100</td>
                            <td className="py-2">None</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 id="connecting" className="text-2xl font-semibold text-gray-900 mb-6">
                Connecting to Your Desktop
              </h2>
              
              <ConnectionTabs />
            </Card>

            <Card className="p-8">
              <h2 id="managing" className="text-2xl font-semibold text-gray-900 mb-6">
                Managing Desktops
              </h2>
              
              <div className="prose prose-gray max-w-none space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Starting and Stopping
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Control your desktop's power state to manage costs and resources:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li><strong>Start:</strong> Boot up your desktop. Takes 30-60 seconds.</li>
                    <li><strong>Stop:</strong> Shut down your desktop. You're only charged for storage when stopped.</li>
                    <li><strong>Restart:</strong> Reboot your desktop to apply updates or fix issues.</li>
                  </ul>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-amber-900">
                      <strong>Cost Tip:</strong> Stop your desktop when not in use to save on compute costs. You'll only pay for storage.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Snapshots & Backups
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Protect your work with snapshots and automated backups:
                  </p>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Manual Snapshots</h4>
                      <p className="text-gray-600">
                        Create a snapshot before making major changes. Restore to any snapshot in seconds.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Automatic Backups</h4>
                      <p className="text-gray-600">
                        Daily backups are created automatically. Retained for 30 days.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Scaling Resources
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Adjust your desktop's resources as your needs change:
                  </p>
                  <ol className="list-decimal list-inside text-gray-600 space-y-2">
                    <li>Stop your desktop</li>
                    <li>Click "Edit Configuration"</li>
                    <li>Adjust CPU, RAM, storage, or GPU</li>
                    <li>Save changes and restart</li>
                  </ol>
                  <p className="text-gray-600 mt-4">
                    Changes take effect immediately after restart. Pricing adjusts automatically.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Deleting a Desktop
                  </h3>
                  <p className="text-gray-600 mb-4">
                    When you no longer need a desktop:
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-900 mb-2">
                      <strong>Warning:</strong> Deleting a desktop is permanent and cannot be undone.
                    </p>
                    <p className="text-sm text-red-800">
                      Create a snapshot before deleting if you might need the data later.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 id="billing" className="text-2xl font-semibold text-gray-900 mb-6">
                Billing & Usage
              </h2>
              
              <div className="prose prose-gray max-w-none space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    How Billing Works
                  </h3>
                  <p className="text-gray-600 mb-4">
                    CloudDesk EDU uses pay-as-you-go pricing with per-minute billing:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Compute (when running)</span>
                        <span className="text-gray-900 font-medium">Rp 1.660 - Rp 41.500/hour</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage (always charged)</span>
                        <span className="text-gray-900 font-medium">Rp 1.660/GB/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">GPU (when running)</span>
                        <span className="text-gray-900 font-medium">Rp 5.810 - Rp 132.800/hour</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Snapshots</span>
                        <span className="text-gray-900 font-medium">Rp 830/GB/month</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Monitoring Usage
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Track your spending in real-time:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>View current month costs in the dashboard</li>
                    <li>Set up billing alerts to avoid surprises</li>
                    <li>Download detailed usage reports</li>
                    <li>See per-desktop cost breakdown</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Cost Optimization Tips
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-600 text-xs font-semibold">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Stop when not in use</h4>
                        <p className="text-sm text-gray-600">
                          You only pay for storage when stopped, saving up to 90% on costs.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-600 text-xs font-semibold">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Right-size resources</h4>
                        <p className="text-sm text-gray-600">
                          Start small and scale up only when needed. You can always adjust later.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-600 text-xs font-semibold">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Delete unused desktops</h4>
                        <p className="text-sm text-gray-600">
                          Remove desktops you no longer need to avoid storage charges.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Payment Methods
                  </h3>
                  <p className="text-gray-600 mb-4">
                    We accept the following payment methods:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>Credit cards (Visa, Mastercard, American Express)</li>
                    <li>Debit cards</li>
                    <li>PayPal</li>
                    <li>Wire transfer (for enterprise customers)</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 id="security" className="text-2xl font-semibold text-gray-900 mb-6">
                Security Best Practices
              </h2>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Encryption
                    </h3>
                    <p className="text-gray-600">
                      All data is encrypted at rest and in transit using industry-standard AES-256 encryption.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Access Control
                    </h3>
                    <p className="text-gray-600">
                      Use strong passwords and enable two-factor authentication for your account.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Automatic Backups
                    </h3>
                    <p className="text-gray-600">
                      Your desktops are automatically backed up daily. Restore from any backup point.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Shield className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Compliance
                    </h3>
                    <p className="text-gray-600">
                      CloudDesk EDU is SOC 2 Type II certified and GDPR compliant.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <h2 id="troubleshooting" className="text-2xl font-semibold text-gray-900 mb-6">
                Troubleshooting
              </h2>
              
              <div className="prose prose-gray max-w-none space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Connection Issues
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Can't connect to desktop</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                        <li>Verify your desktop is in "Running" state</li>
                        <li>Check your internet connection</li>
                        <li>Try a different browser or connection method</li>
                        <li>Disable VPN or proxy if enabled</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Slow or laggy connection</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                        <li>Choose a region closer to your location</li>
                        <li>Close bandwidth-heavy applications</li>
                        <li>Use wired connection instead of WiFi</li>
                        <li>Lower display quality in connection settings</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Performance Issues
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Desktop is running slow</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                        <li>Check resource usage in the dashboard</li>
                        <li>Close unnecessary applications</li>
                        <li>Consider upgrading CPU or RAM</li>
                        <li>Restart your desktop to clear memory</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Out of storage space</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                        <li>Delete unnecessary files and applications</li>
                        <li>Move large files to external storage</li>
                        <li>Increase storage capacity in settings</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Desktop Won't Start
                  </h3>
                  <p className="text-gray-600 mb-4">
                    If your desktop fails to start:
                  </p>
                  <ol className="list-decimal list-inside text-gray-600 space-y-2">
                    <li>Wait 2-3 minutes and try again</li>
                    <li>Check the status page for any service issues</li>
                    <li>Try stopping and starting again</li>
                    <li>Restore from a recent snapshot if available</li>
                    <li>Contact support if the issue persists</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Billing Questions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Unexpected charges</h4>
                      <p className="text-gray-600 mb-2">
                        Check your usage report to see detailed breakdown:
                      </p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                        <li>Verify all desktops are stopped when not in use</li>
                        <li>Check for forgotten snapshots</li>
                        <li>Review GPU usage if applicable</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Payment failed</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                        <li>Verify your payment method is valid</li>
                        <li>Check for sufficient funds</li>
                        <li>Update billing information in settings</li>
                        <li>Contact your bank if card is declined</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Getting More Help
                  </h3>
                  <p className="text-gray-600 mb-4">
                    If you can't find a solution here:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Community Forum</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Search existing topics or ask the community
                      </p>
                      <Link to="/community" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        Visit Forum →
                      </Link>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Contact Support</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Get help from our support team
                      </p>
                      <Link to="/support" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        Contact Us →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Need More Help?
            </h2>
            <p className="text-lg text-gray-600">
              Our support team is here to help you succeed
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Book className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Knowledge Base
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Browse our comprehensive guides and tutorials
              </p>
              <Link to="/docs/getting-started">
                <Button variant="secondary" size="sm" className="w-full">
                  Browse articles
                </Button>
              </Link>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Community Forum
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Get help from other CloudDesk users
              </p>
              <Link to="/community">
                <Button variant="secondary" size="sm" className="w-full">
                  Visit forum
                </Button>
              </Link>
            </Card>

            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Contact Support
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Reach out to our support team directly
              </p>
              <Link to="/support">
                <Button variant="secondary" size="sm" className="w-full">
                  Contact us
                </Button>
              </Link>
            </Card>
          </div>

          {/* What's Next */}
          <Card className="p-12 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
            <h2 className="text-3xl font-semibold text-gray-900 mb-12 text-center">
              What's Next?
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Explore Features
                </h3>
                <p className="text-gray-600 mb-4">
                  Learn about snapshots, backups, and team collaboration.
                </p>
                <Link to="/docs" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Read Documentation →
                </Link>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Join Community
                </h3>
                <p className="text-gray-600 mb-4">
                  Get help from other CloudDesk users and share tips.
                </p>
                <Link to="/community" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Visit Forum →
                </Link>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Need Help?
                </h3>
                <p className="text-gray-600 mb-4">
                  Our support team is here to help you succeed.
                </p>
                <Link to="/support" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Contact Support →
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
      </div>
    </div>
  );
}

// Connection Tabs Component
function ConnectionTabs() {
  const [activeTab, setActiveTab] = React.useState('browser');

  return (
    <>
      <Tabs
        items={[
          { id: 'browser', label: 'Browser' },
          { id: 'rdp', label: 'RDP' },
          { id: 'vnc', label: 'VNC' },
        ]}
        activeId={activeTab}
        onChange={setActiveTab}
      />
      
      <div className="mt-6">
        {activeTab === 'browser' && (
                      <div className="prose prose-gray max-w-none">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Browser-Based Connection (Recommended)
                        </h3>
                        <p className="text-gray-600 mb-4">
                          The easiest way to connect. No software installation required.
                        </p>
                        <ol className="list-decimal list-inside text-gray-600 space-y-2">
                          <li>Click "Connect" on your desktop</li>
                          <li>Click "Open in Browser"</li>
                          <li>Your desktop will open in a new tab</li>
                        </ol>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-blue-900">
                            <strong>Tip:</strong> For best performance, use Chrome or Edge browser.
                          </p>
                        </div>
                      </div>
                    )}
                    {activeTab === 'rdp' && (
                      <div className="prose prose-gray max-w-none">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Remote Desktop Protocol (RDP)
                        </h3>
                        <p className="text-gray-600 mb-4">
                          For Windows users who prefer native Remote Desktop.
                        </p>
                        <ol className="list-decimal list-inside text-gray-600 space-y-2">
                          <li>Click "Connect" on your desktop</li>
                          <li>Click "Download RDP File"</li>
                          <li>Open the downloaded .rdp file</li>
                          <li>Enter your credentials when prompted</li>
                        </ol>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                          <p className="text-sm text-gray-900 font-medium mb-2">Windows:</p>
                          <p className="text-sm text-gray-600">Built-in Remote Desktop Connection</p>
                          <p className="text-sm text-gray-900 font-medium mb-2 mt-3">macOS:</p>
                          <p className="text-sm text-gray-600">Download Microsoft Remote Desktop from App Store</p>
                        </div>
                      </div>
                    )}
        {activeTab === 'vnc' && (
          <div className="prose prose-gray max-w-none">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              VNC Connection
            </h3>
            <p className="text-gray-600 mb-4">
              For users who prefer VNC clients.
            </p>
            <ol className="list-decimal list-inside text-gray-600 space-y-2">
              <li>Install a VNC client (RealVNC, TightVNC, etc.)</li>
              <li>Click "Connect" on your desktop</li>
              <li>Click "Copy VNC Address"</li>
              <li>Paste the address into your VNC client</li>
              <li>Enter your credentials when prompted</li>
            </ol>
          </div>
        )}
      </div>
    </>
  );
}


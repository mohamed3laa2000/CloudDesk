import React from 'react';
import { Book, Code, Zap, Shield, HelpCircle, ExternalLink } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';

export function Documentation() {
  return (
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
        </div>

        {/* Main Documentation */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Contents</h3>
              <nav className="space-y-2">
                <a href="#getting-started" className="block text-sm text-indigo-600 hover:text-indigo-700">
                  Getting Started
                </a>
                <a href="#creating-desktop" className="block text-sm text-gray-600 hover:text-gray-900">
                  Creating a Desktop
                </a>
                <a href="#connecting" className="block text-sm text-gray-600 hover:text-gray-900">
                  Connecting
                </a>
                <a href="#managing" className="block text-sm text-gray-600 hover:text-gray-900">
                  Managing Desktops
                </a>
                <a href="#billing" className="block text-sm text-gray-600 hover:text-gray-900">
                  Billing & Usage
                </a>
                <a href="#security" className="block text-sm text-gray-600 hover:text-gray-900">
                  Security
                </a>
                <a href="#troubleshooting" className="block text-sm text-gray-600 hover:text-gray-900">
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

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <Book className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Knowledge Base
              </h3>
              <p className="text-gray-600 mb-4">
                Browse our comprehensive guides and tutorials
              </p>
              <Button variant="ghost" className="mx-auto">
                Browse articles
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <HelpCircle className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Community Forum
              </h3>
              <p className="text-gray-600 mb-4">
                Get help from other CloudDesk users
              </p>
              <Button variant="ghost" className="mx-auto">
                Visit forum
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <ExternalLink className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Contact Support
              </h3>
              <p className="text-gray-600 mb-4">
                Reach out to our support team directly
              </p>
              <Button variant="ghost" className="mx-auto">
                Contact us
              </Button>
            </Card>
          </div>
        </div>
      </section>
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

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <Book className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Knowledge Base
              </h3>
              <p className="text-gray-600 mb-4">
                Browse our comprehensive guides and tutorials
              </p>
              <Button variant="ghost" className="mx-auto">
                Browse articles
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <HelpCircle className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Community Forum
              </h3>
              <p className="text-gray-600 mb-4">
                Get help from other CloudDesk users
              </p>
              <Button variant="ghost" className="mx-auto">
                Visit forum
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <ExternalLink className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Contact Support
              </h3>
              <p className="text-gray-600 mb-4">
                Reach out to our support team directly
              </p>
              <Button variant="ghost" className="mx-auto">
                Contact us
              </Button>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

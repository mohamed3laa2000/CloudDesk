import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/">
                <img src="/logo-clouddesk.png" alt="CloudDesk EDU" className="h-9 w-auto object-contain hover:opacity-80 transition-opacity" />
              </Link>
            </div>

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

      {/* Hero */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-8">
          <h1 className="text-4xl font-semibold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: November 15, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-8">
          <div className="prose prose-gray max-w-none">
            <Card className="p-8 mb-8 bg-indigo-50 border-indigo-200">
              <p className="text-gray-900 leading-relaxed">
                At CloudDesk EDU, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our cloud desktop platform.
              </p>
            </Card>

            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                    <p>When you create an account, we collect:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Name and email address</li>
                      <li>Password (encrypted)</li>
                      <li>Billing information (processed securely through third-party payment processors)</li>
                      <li>Educational institution affiliation (optional)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Data</h3>
                    <p>We automatically collect certain information when you use our service:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Desktop instance configurations and usage metrics</li>
                      <li>Connection logs and session duration</li>
                      <li>IP addresses and device information</li>
                      <li>Browser type and operating system</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Desktop Content</h3>
                    <p>Files and data you store on your cloud desktops are encrypted and accessible only to you. We do not access, scan, or analyze your desktop content except when:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Required by law or legal process</li>
                      <li>You explicitly request technical support</li>
                      <li>Necessary to maintain system security and integrity</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <div className="space-y-2 text-gray-600">
                  <p>We use the collected information to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process your transactions and send billing notifications</li>
                    <li>Respond to your support requests and communications</li>
                    <li>Monitor and analyze usage patterns to optimize performance</li>
                    <li>Detect, prevent, and address technical issues and security threats</li>
                    <li>Send important service updates and security alerts</li>
                    <li>Comply with legal obligations and enforce our terms</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Sharing and Disclosure</h2>
                <div className="space-y-4 text-gray-600">
                  <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Providers</h3>
                    <p>We work with third-party service providers who assist us in operating our platform:</p>
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Cloud infrastructure providers (AWS, Google Cloud)</li>
                      <li>Payment processors (Stripe)</li>
                      <li>Email service providers</li>
                      <li>Analytics and monitoring tools</li>
                    </ul>
                    <p className="mt-2">These providers are contractually obligated to protect your data and use it only for the services they provide to us.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Requirements</h3>
                    <p>We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Transfers</h3>
                    <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
                <div className="space-y-2 text-gray-600">
                  <p>We implement industry-standard security measures to protect your information:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>End-to-end encryption for data in transit (TLS 1.3)</li>
                    <li>AES-256 encryption for data at rest</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Multi-factor authentication options</li>
                    <li>Isolated desktop environments</li>
                    <li>SOC 2 Type II certified infrastructure</li>
                  </ul>
                  <p className="mt-4">However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Retention</h2>
                <div className="space-y-2 text-gray-600">
                  <p>We retain your information for as long as necessary to provide our services and comply with legal obligations:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Account information: Retained while your account is active</li>
                    <li>Desktop data: Retained until you delete your desktop or account</li>
                    <li>Usage logs: Retained for 90 days</li>
                    <li>Billing records: Retained for 7 years for tax and accounting purposes</li>
                  </ul>
                  <p className="mt-4">When you delete your account, we permanently delete your personal information and desktop data within 30 days, except where retention is required by law.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
                <div className="space-y-2 text-gray-600">
                  <p>You have the following rights regarding your personal information:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Access:</strong> Request a copy of your personal information</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                    <li><strong>Export:</strong> Download your desktop data at any time</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                    <li><strong>Restriction:</strong> Request limitation of data processing</li>
                  </ul>
                  <p className="mt-4">To exercise these rights, contact us at privacy@clouddesk.edu or through your account settings.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. International Data Transfers</h2>
                <div className="space-y-2 text-gray-600">
                  <p>CloudDesk EDU operates globally. Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for international transfers, including:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Standard Contractual Clauses approved by the European Commission</li>
                    <li>Compliance with GDPR for EU users</li>
                    <li>Data residency options for enterprise customers</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
                <div className="space-y-2 text-gray-600">
                  <p>CloudDesk EDU is designed for educational use, including by students under 18. When used in an educational setting:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>We comply with COPPA (Children's Online Privacy Protection Act)</li>
                    <li>Educational institutions must obtain parental consent</li>
                    <li>We collect only the minimum information necessary</li>
                    <li>Student data is never used for advertising or marketing</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking</h2>
                <div className="space-y-2 text-gray-600">
                  <p>We use cookies and similar technologies to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Maintain your session and keep you logged in</li>
                    <li>Remember your preferences and settings</li>
                    <li>Analyze usage patterns and improve our service</li>
                    <li>Provide security features</li>
                  </ul>
                  <p className="mt-4">You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
                <div className="space-y-2 text-gray-600">
                  <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Posting the updated policy on our website</li>
                    <li>Sending an email notification to your registered email address</li>
                    <li>Displaying a prominent notice in your dashboard</li>
                  </ul>
                  <p className="mt-4">Your continued use of CloudDesk EDU after changes become effective constitutes acceptance of the updated policy.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
                <div className="space-y-2 text-gray-600">
                  <p>If you have questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
                  <div className="mt-4 p-6 bg-gray-50 rounded-lg space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Data Protection Officer</p>
                      <p><strong>Name:</strong> Gabriel Seto Pribadi</p>
                      <p><strong>Email:</strong> me@gabrielseto.dev</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">General Privacy Inquiries</p>
                      <p><strong>Email:</strong> privacy@clouddesk.edu</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Related Documents</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Link to="/terms">
              <Card className="p-6 hover:border-indigo-200 transition-colors text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Terms of Service</h3>
                <p className="text-sm text-gray-600">Read our terms and conditions</p>
              </Card>
            </Link>
            <Link to="/security">
              <Card className="p-6 hover:border-indigo-200 transition-colors text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Security</h3>
                <p className="text-sm text-gray-600">Learn about our security practices</p>
              </Card>
            </Link>
            <Link to="/contact">
              <Card className="p-6 hover:border-indigo-200 transition-colors text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Contact Us</h3>
                <p className="text-sm text-gray-600">Get in touch with our team</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

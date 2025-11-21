import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function TermsOfService() {
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
            Terms of Service
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
                These Terms of Service govern your use of CloudDesk EDU's cloud desktop platform. By creating an account or using our services, you agree to be bound by these terms.
              </p>
            </Card>

            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <div className="space-y-2 text-gray-600">
                  <p>By accessing or using CloudDesk EDU ("Service"), you agree to comply with and be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.</p>
                  <p>We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms.</p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Account Registration</h2>
                <div className="space-y-2 text-gray-600">
                  <p>To use CloudDesk EDU, you must:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Be at least 13 years old (or have parental/guardian consent)</li>
                    <li>Provide accurate and complete registration information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Promptly update your account information if it changes</li>
                    <li>Accept responsibility for all activities under your account</li>
                  </ul>
                  <p className="mt-4">You may not:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Share your account with others</li>
                    <li>Create multiple accounts to circumvent restrictions</li>
                    <li>Use another person's account without permission</li>
                    <li>Impersonate any person or entity</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Acceptable Use Policy</h2>
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Permitted Uses</h3>
                    <p>You may use CloudDesk EDU for:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Educational purposes and coursework</li>
                      <li>Software development and testing</li>
                      <li>Data analysis and research</li>
                      <li>Professional work and productivity</li>
                      <li>Any lawful purpose consistent with these Terms</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Prohibited Activities</h3>
                    <p>You may not use CloudDesk EDU to:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Violate any applicable laws or regulations</li>
                      <li>Infringe on intellectual property rights</li>
                      <li>Distribute malware, viruses, or harmful code</li>
                      <li>Conduct cryptocurrency mining without explicit permission</li>
                      <li>Launch attacks on other systems or networks</li>
                      <li>Send spam or unsolicited communications</li>
                      <li>Host illegal content or engage in illegal activities</li>
                      <li>Attempt to gain unauthorized access to our systems</li>
                      <li>Interfere with or disrupt the Service</li>
                      <li>Resell or redistribute the Service without authorization</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Service Availability and Support</h2>
                <div className="space-y-2 text-gray-600">
                  <p>We strive to provide reliable service with 99.9% uptime, but we do not guarantee uninterrupted access. The Service may be temporarily unavailable due to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Scheduled maintenance (with advance notice)</li>
                    <li>Emergency maintenance or security updates</li>
                    <li>Factors beyond our control (network issues, natural disasters)</li>
                  </ul>
                  <p className="mt-4">We provide support through:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Email support for all users</li>
                    <li>Live chat during business hours</li>
                    <li>Priority support for Enterprise customers</li>
                    <li>Community forums and documentation</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Billing and Payment</h2>
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Pricing</h3>
                    <p>CloudDesk EDU operates on a pay-as-you-go model. You are charged based on:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Desktop instance runtime (per hour)</li>
                      <li>Resource allocation (CPU, RAM, storage)</li>
                      <li>Additional features (GPU, premium support)</li>
                    </ul>
                    <p className="mt-2">Current pricing is available at clouddesk.edu/pricing. We reserve the right to change prices with 30 days' notice.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Terms</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Charges are billed monthly in arrears</li>
                      <li>Payment is due within 7 days of invoice date</li>
                      <li>Late payments may result in service suspension</li>
                      <li>You are responsible for all applicable taxes</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Refunds</h3>
                    <p>We offer refunds in the following cases:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Service outages exceeding our SLA commitments</li>
                      <li>Billing errors (corrected within 30 days)</li>
                      <li>Unused credits upon account closure (pro-rated)</li>
                    </ul>
                    <p className="mt-2">Refunds are not provided for:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Voluntary account cancellation</li>
                      <li>Account termination due to Terms violations</li>
                      <li>Services already rendered</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data and Content</h2>
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Content</h3>
                    <p>You retain all rights to content you create or store on CloudDesk EDU. By using the Service, you grant us a limited license to:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Store and process your content to provide the Service</li>
                      <li>Create backups for disaster recovery</li>
                      <li>Access content when required by law or with your permission</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Backup</h3>
                    <p>While we maintain regular backups, you are responsible for:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Creating your own backups of important data</li>
                      <li>Using our snapshot and export features</li>
                      <li>Maintaining copies of critical files locally</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Deletion</h3>
                    <p>When you delete content or close your account:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Data is permanently deleted within 30 days</li>
                      <li>Backups are purged according to our retention policy</li>
                      <li>Some metadata may be retained for legal compliance</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
                <div className="space-y-2 text-gray-600">
                  <p>CloudDesk EDU and its original content, features, and functionality are owned by CloudDesk EDU and protected by international copyright, trademark, and other intellectual property laws.</p>
                  <p>You may not:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Copy, modify, or distribute our software or documentation</li>
                    <li>Reverse engineer or decompile our platform</li>
                    <li>Remove or alter any proprietary notices</li>
                    <li>Use our trademarks without written permission</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Termination</h2>
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">By You</h3>
                    <p>You may terminate your account at any time through your account settings. Upon termination:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Your access to the Service will cease immediately</li>
                      <li>You will be charged for usage up to the termination date</li>
                      <li>Your data will be deleted according to our retention policy</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">By Us</h3>
                    <p>We may suspend or terminate your account if:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>You violate these Terms</li>
                      <li>Your account is inactive for 12 months</li>
                      <li>Payment is overdue by more than 30 days</li>
                      <li>We are required to do so by law</li>
                      <li>Continuing service poses a security risk</li>
                    </ul>
                    <p className="mt-2">We will provide reasonable notice before termination, except in cases of serious violations or legal requirements.</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitations of Liability</h2>
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Disclaimer</h3>
                    <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
                    <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLOUDDESK EDU SHALL NOT BE LIABLE FOR:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Indirect, incidental, special, or consequential damages</li>
                      <li>Loss of profits, data, or business opportunities</li>
                      <li>Service interruptions or data loss</li>
                      <li>Third-party actions or content</li>
                    </ul>
                    <p className="mt-2">Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
                <div className="space-y-2 text-gray-600">
                  <p>You agree to indemnify and hold harmless CloudDesk EDU from any claims, damages, losses, or expenses (including legal fees) arising from:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Your use of the Service</li>
                    <li>Your violation of these Terms</li>
                    <li>Your violation of any third-party rights</li>
                    <li>Content you create or store on the Service</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Dispute Resolution</h2>
                <div className="space-y-4 text-gray-600">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Governing Law</h3>
                    <p>These Terms are governed by and construed in accordance with the laws of the Republic of Indonesia, without regard to conflict of law principles.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Jurisdiction</h3>
                    <p>Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of Indonesia. Both parties consent to the jurisdiction and venue of such courts.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Dispute Resolution Process</h3>
                    <p>Before initiating legal proceedings, parties agree to attempt to resolve disputes through good faith negotiation. If negotiation fails, disputes may be submitted to mediation or the appropriate Indonesian courts.</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. General Provisions</h2>
                <div className="space-y-2 text-gray-600">
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and CloudDesk EDU regarding the Service.</li>
                    <li><strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.</li>
                    <li><strong>Waiver:</strong> Failure to enforce any provision does not constitute a waiver of that provision.</li>
                    <li><strong>Assignment:</strong> You may not assign these Terms without our consent. We may assign these Terms to any successor or affiliate.</li>
                    <li><strong>Force Majeure:</strong> We are not liable for delays or failures due to circumstances beyond our reasonable control.</li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
                <div className="space-y-2 text-gray-600">
                  <p>For questions about these Terms, please contact us:</p>
                  <div className="mt-4 p-6 bg-gray-50 rounded-lg space-y-3">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Legal Officer</p>
                      <p><strong>Name:</strong> Gabriel Seto Pribadi</p>
                      <p><strong>Email:</strong> me@gabrielseto.dev</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">General Inquiries</p>
                      <p><strong>Email:</strong> legal@clouddesk.edu</p>
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
            <Link to="/privacy">
              <Card className="p-6 hover:border-indigo-200 transition-colors text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Privacy Policy</h3>
                <p className="text-sm text-gray-600">How we handle your data</p>
              </Card>
            </Link>
            <Link to="/security">
              <Card className="p-6 hover:border-indigo-200 transition-colors text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Security</h3>
                <p className="text-sm text-gray-600">Our security practices</p>
              </Card>
            </Link>
            <Link to="/contact">
              <Card className="p-6 hover:border-indigo-200 transition-colors text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Contact Us</h3>
                <p className="text-sm text-gray-600">Get in touch</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { Shield, Eye, Lock, Database, User, FileText } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f0de] to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#166534] rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-[#1f3b2c] mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl text-[#4b5563] max-w-3xl mx-auto mb-8">
              Your privacy is fundamental to our mission. Learn how we protect your data and respect your rights.
            </p>
            <p className="text-[#4b5563]">
              Last updated: December 16, 2025
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          
          {/* Introduction */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">Introduction</h2>
            <p className="text-[#4b5563] leading-relaxed mb-4">
              AgriLink ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our agricultural platform and services.
            </p>
            <p className="text-[#4b5563] leading-relaxed">
              By using AgriLink, you agree to the collection and use of information in accordance with this policy. If you disagree with our practices, please do not use our platform.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">Information We Collect</h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-start gap-4">
                  <User className="w-6 h-6 text-[#166534] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f3b2c] mb-2">Personal Information</h3>
                    <ul className="text-[#4b5563] space-y-2">
                      <li>• Name, email address, phone number</li>
                      <li>• Government-issued identification (Aadhaar, PAN)</li>
                      <li>• Bank account details for payments</li>
                      <li>• Physical address and location data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-start gap-4">
                  <Database className="w-6 h-6 text-[#166534] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f3b2c] mb-2">Agricultural Data</h3>
                    <ul className="text-[#4b5563] space-y-2">
                      <li>• Land ownership and cultivation details</li>
                      <li>• Crop patterns and yield information</li>
                      <li>• Soil and water resource data</li>
                      <li>• Farm equipment and infrastructure</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-start gap-4">
                  <Eye className="w-6 h-6 text-[#166534] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-[#1f3b2c] mb-2">Usage Data</h3>
                    <ul className="text-[#4b5563] space-y-2">
                      <li>• Platform interaction patterns</li>
                      <li>• Device and browser information</li>
                      <li>• IP address and location data</li>
                      <li>• Cookies and similar tracking technologies</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">How We Use Your Information</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <ul className="text-[#4b5563] space-y-3">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Service Provision:</strong> To provide and maintain our agricultural platform services</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Transaction Processing:</strong> To facilitate marketplace transactions and payments</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Personalization:</strong> To customize your experience and provide relevant agricultural insights</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Communication:</strong> To send important updates, notifications, and support messages</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Analytics:</strong> To improve our services and develop new agricultural solutions</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Data Security */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">Data Security</h2>
            
            <div className="bg-[#f0fdf4] p-6 rounded-xl">
              <div className="flex items-start gap-4">
                <Lock className="w-6 h-6 text-[#166534] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-[#4b5563] leading-relaxed mb-4">
                    We implement industry-standard security measures to protect your information:
                  </p>
                  <ul className="text-[#4b5563] space-y-2">
                    <li>• <strong>Blockchain Technology:</strong> Immutable ledger for critical agricultural records</li>
                    <li>• <strong>Encryption:</strong> End-to-end encryption for data transmission and storage</li>
                    <li>• <strong>Access Controls:</strong> Strict authentication and authorization protocols</li>
                    <li>• <strong>Regular Audits:</strong> Continuous security monitoring and vulnerability assessments</li>
                    <li>• <strong>Data Backup:</strong> Secure backup systems with disaster recovery protocols</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">Data Sharing and Disclosure</h2>
            
            <p className="text-[#4b5563] leading-relaxed mb-4">
              We do not sell your personal information. We only share your data in the following circumstances:
            </p>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <ul className="text-[#4b5563] space-y-3">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>With Your Consent:</strong> When you explicitly authorize us to share specific information</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Service Providers:</strong> With trusted third-party partners who help us operate our platform</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Marketplace Transactions:</strong> To facilitate buying and selling on our platform</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">Your Privacy Rights</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-[#1f3b2c] mb-3">Access and Correction</h3>
                <p className="text-[#4b5563]">
                  You can access, update, or correct your personal information through your account settings or by contacting us.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-[#1f3b2c] mb-3">Data Portability</h3>
                <p className="text-[#4b5563]">
                  Request copies of your data in a machine-readable format for transfer to other services.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-[#1f3b2c] mb-3">Deletion</h3>
                <p className="text-[#4b5563]">
                  Request deletion of your personal information, subject to legal and contractual obligations.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-[#1f3b2c] mb-3">Opt-Out</h3>
                <p className="text-[#4b5563]">
                  Control how we contact you and manage your communication preferences.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies and Tracking */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">Cookies and Tracking Technologies</h2>
            
            <p className="text-[#4b5563] leading-relaxed mb-4">
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and maintain platform security. You can control cookie settings through your browser preferences.
            </p>
            
            <div className="bg-[#f0fdf4] p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-[#1f3b2c] mb-3">Cookie Types:</h3>
              <ul className="text-[#4b5563] space-y-2">
                <li>• <strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                <li>• <strong>Performance Cookies:</strong> Help us understand how our platform is used</li>
                <li>• <strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                <li>• <strong>Marketing Cookies:</strong> Used for personalized content and advertisements</li>
              </ul>
            </div>
          </section>

          {/* International Data Transfers */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">International Data Transfers</h2>
            
            <p className="text-[#4b5563] leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">Children's Privacy</h2>
            
            <p className="text-[#4b5563] leading-relaxed">
              Our platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete such information.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">Changes to This Privacy Policy</h2>
            
            <p className="text-[#4b5563] leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of our platform after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#1f3b2c] mb-4">Contact Us</h2>
            
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <p className="text-[#4b5563] leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="space-y-2 text-[#4b5563]">
                <p><strong>Email:</strong> bhuvanbn01@gmail.com</p>
                <p><strong>Phone:</strong> 7090869356</p>
                <p><strong>Address:</strong> AgriLink HQ, Mysuru, Karnataka 570001, India</p>
              </div>
              
              <div className="mt-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-[#166534] hover:text-[#15803d] font-medium"
                >
                  <FileText className="w-5 h-5" />
                  Contact Our Privacy Team
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#166534] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your Privacy Matters
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            We're committed to protecting your data while providing the best agricultural platform experience.
          </p>
          <Link
            href="/register"
            className="bg-white text-[#166534] px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all"
          >
            Join AgriLink Today
          </Link>
        </div>
      </div>
    </div>
  );
}

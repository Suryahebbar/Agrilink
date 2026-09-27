import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Shield } from 'lucide-react';
import HeaderWrapper from '../components/Header/HeaderWrapper';
import Footer from '../components/Footer/Footer';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Review the terms, eligibility, land pooling rules, and agreements for using AgriLink services.',
};

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f7f0de] to-white">
      <HeaderWrapper />
      
      {/* Hero Section */}
      <main className="flex-grow pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#166534] rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1f3b2c] mb-6">
              Terms & Conditions
            </h1>
            <p className="text-lg md:text-xl text-[#4b5563] max-w-3xl mx-auto mb-4">
              Please read these terms carefully before registering and using the AgriLink platform.
            </p>
            <p className="text-[#6b7280] text-sm">
              Last updated: July 24, 2026
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="bg-[#fffaf1] border border-[#e2d4b7] rounded-lg shadow-sm p-8 md:p-12 space-y-8 text-sm md:text-base text-[#4b5563] leading-relaxed">
            
            <section>
              <h2 className="text-xl font-bold text-[#1f3b2c] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#166534] rounded-full inline-block"></span>
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing, registering for, or using AgriLink ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not register for an account or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1f3b2c] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#166534] rounded-full inline-block"></span>
                2. User Eligibility & Registration
              </h2>
              <p className="mb-2">
                To register as a Farmer on AgriLink, you must:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Be at least 18 years of age and possess the legal capacity to enter into binding agreements.</li>
                <li>Provide a valid Aadhaar number and have access to the Aadhaar-linked mobile number for OTP verification.</li>
                <li>Ensure that all information provided during registration (Full Name, Date of Birth, Aadhaar details) is accurate and matches official government records.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1f3b2c] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#166534] rounded-full inline-block"></span>
                3. Aadhaar Verification & Identity
              </h2>
              <p>
                We use secure, standard protocols to verify your identity via Aadhaar-linked OTP. By registering, you consent to the validation of your name, date of birth, and phone number against Aadhaar databases. AgriLink does not store your full Aadhaar number in plain text, ensuring your privacy and data security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1f3b2c] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#166534] rounded-full inline-block"></span>
                4. Land Registration & Pooling Rules
              </h2>
              <p className="mb-2">
                One of AgriLink's primary services is land boundary mapping and pooling. By using these features, you agree that:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>You will only register land parcels that you legally own or are authorized to cultivate (via lease or power of attorney).</li>
                <li>Boundary markings and calculations drawn on our mapping interfaces are for planning and platform optimization purposes and do not replace legal land survey records.</li>
                <li>Land pooling agreements with adjacent neighbors are legally binding mutual contracts, and both parties must honor the revenue-sharing and resource-allocation terms.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1f3b2c] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#166534] rounded-full inline-block"></span>
                5. Marketplace Transactions
              </h2>
              <p>
                Farmers may buy seeds, fertilizers, machinery, and tools from verified suppliers through our integrated marketplace. AgriLink acts as an intermediary. While we verify suppliers, users must inspect items upon delivery. Any payment processing disputes will be resolved according to the payment gateway policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#1f3b2c] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#166534] rounded-full inline-block"></span>
                6. Modification of Services & Terms
              </h2>
              <p>
                We reserve the right to modify or discontinue any feature of the platform, or amend these Terms at any time. Continued use of the platform following modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            <div className="border-t border-[#e2d4b7] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                <Shield className="w-4 h-4 text-[#166534]" />
                <span>Your data is protected under our Privacy Policy.</span>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

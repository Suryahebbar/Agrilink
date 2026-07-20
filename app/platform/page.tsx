import Link from 'next/link';
import { Shield, Users, TrendingUp, Globe, Database, Cpu } from 'lucide-react';

export default function Platform() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f0de] to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-[#1f3b2c] mb-6">
              The AgriLink Platform
            </h1>
            <p className="text-xl md:text-2xl text-[#4b5563] max-w-3xl mx-auto mb-8">
              A comprehensive agricultural ecosystem powered by blockchain technology and artificial intelligence, designed to transform farming for the digital age.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-gradient-to-r from-[#166534] to-[#15803d] text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Get Started
              </Link>
              <Link
                href="/features"
                className="border-2 border-[#166534] text-[#166534] px-8 py-3 rounded-lg font-medium hover:bg-[#166534] hover:text-white transition-all"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-4">
            Built for Modern Agriculture
          </h2>
          <p className="text-lg text-[#4b5563] max-w-2xl mx-auto">
            Our platform integrates cutting-edge technology with traditional farming wisdom to create a seamless experience for all stakeholders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#166534] rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Blockchain Security</h3>
            <p className="text-[#4b5563]">
              Immutable ledger technology ensures complete transparency and security for all transactions, agreements, and data records.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#166534] rounded-lg flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">AI-Powered Insights</h3>
            <p className="text-[#4b5563]">
              Machine learning algorithms provide predictive analytics, crop recommendations, and market insights to optimize farming decisions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#166534] rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Connected Community</h3>
            <p className="text-[#4b5563]">
              Bring together farmers, suppliers, buyers, and experts in a unified ecosystem fostering collaboration and knowledge sharing.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#166534] rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Market Intelligence</h3>
            <p className="text-[#4b5563]">
              Real-time market data, price trends, and demand forecasting help farmers make informed selling decisions and maximize profits.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#166534] rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Secure Data Storage</h3>
            <p className="text-[#4b5563]">
              Decentralized storage ensures data integrity while maintaining privacy and control over sensitive agricultural information.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#166534] rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Global Reach</h3>
            <p className="text-[#4b5563]">
              Connect with agricultural communities worldwide, access international markets, and share best practices across borders.
            </p>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="bg-[#f0fdf4] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-4">
              Advanced Technology Stack
            </h2>
            <p className="text-lg text-[#4b5563] max-w-2xl mx-auto">
              Built on cutting-edge technologies to ensure reliability, scalability, and innovation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl">
              <h3 className="text-2xl font-semibold text-[#1f3b2c] mb-4">Blockchain Layer</h3>
              <ul className="space-y-3 text-[#4b5563]">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Smart contracts for automated agreements
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Decentralized identity management
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Transparent supply chain tracking
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Tokenized asset management
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl">
              <h3 className="text-2xl font-semibold text-[#1f3b2c] mb-4">AI & Analytics</h3>
              <ul className="space-y-3 text-[#4b5563]">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Predictive crop yield analysis
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Weather pattern recognition
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Market price optimization
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-[#166534] rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Risk assessment models
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#166534] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Farming Experience?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers who are already leveraging the power of AgriLink to grow their business and secure their future.
          </p>
          <Link
            href="/register"
            className="bg-white text-[#166534] px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all"
          >
            Start Your Journey
          </Link>
        </div>
      </div>
    </div>
  );
}

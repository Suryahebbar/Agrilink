import Link from 'next/link';
import { 
  Sprout, 
  ShoppingCart, 
  FileText, 
  TrendingUp, 
  Cloud, 
  Shield, 
  Smartphone, 
  Users,
  MapPin,
  DollarSign,
  Truck,
  Award
} from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Sprout className="w-8 h-8" />,
      title: "Smart Farming",
      description: "AI-powered crop recommendations and precision farming insights to maximize yield and minimize resource usage.",
      category: "Farmer Tools"
    },
    {
      icon: <ShoppingCart className="w-8 h-8" />,
      title: "Digital Marketplace",
      description: "Connect directly with buyers and suppliers, eliminating middlemen and ensuring fair prices for your produce.",
      category: "Marketplace"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Land Records",
      description: "Blockchain-secured land documentation and ownership records with smart contracts for seamless transactions.",
      category: "Land Management"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Market Analytics",
      description: "Real-time market data, price trends, and demand forecasting to help you make informed selling decisions.",
      category: "Analytics"
    },
    {
      icon: <Cloud className="w-8 h-8" />,
      title: "Weather Intelligence",
      description: "Advanced weather forecasting and climate insights to plan farming activities and mitigate risks.",
      category: "Weather"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure Payments",
      description: "Blockchain-based payment system ensuring secure, transparent, and instant transactions without intermediaries.",
      category: "Payments"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Mobile App",
      description: "Access all platform features on-the-go with our intuitive mobile application for farmers and suppliers.",
      category: "Mobile"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Network",
      description: "Connect with fellow farmers, share knowledge, and collaborate on agricultural initiatives in your region.",
      category: "Community"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Supply Chain Tracking",
      description: "Complete traceability from farm to table with GPS tracking and blockchain verification at every step.",
      category: "Supply Chain"
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Financial Services",
      description: "Access to agricultural loans, insurance, and financial products tailored specifically for farmers' needs.",
      category: "Finance"
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Logistics Support",
      description: "Integrated logistics solutions for transportation, storage, and delivery of agricultural products.",
      category: "Logistics"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Quality Certification",
      description: "Organic and quality certification management with blockchain-verified credentials and standards compliance.",
      category: "Quality"
    }
  ];

  const categories = ["All", "Farmer Tools", "Marketplace", "Land Management", "Analytics", "Weather", "Payments", "Mobile", "Community", "Supply Chain", "Finance", "Logistics", "Quality"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f0de] to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-[#1f3b2c] mb-6">
              Powerful Features for Modern Agriculture
            </h1>
            <p className="text-xl md:text-2xl text-[#4b5563] max-w-3xl mx-auto mb-8">
              Discover how AgriLink's comprehensive suite of tools can transform your farming operations and connect you to the future of agriculture.
            </p>
            <Link
              href="/register"
              className="bg-gradient-to-r from-[#166534] to-[#15803d] text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Start Using Features
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-4">
            Everything You Need in One Platform
          </h2>
          <p className="text-lg text-[#4b5563] max-w-2xl mx-auto">
            From farm management to market connections, we've got every aspect of modern agriculture covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <div className="w-16 h-16 bg-[#166534] rounded-xl flex items-center justify-center mb-6 text-white">
                {feature.icon}
              </div>
              <div className="mb-2">
                <span className="text-sm font-medium text-[#166534] bg-[#f0fdf4] px-3 py-1 rounded-full">
                  {feature.category}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-4">
                {feature.title}
              </h3>
              <p className="text-[#4b5563] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-[#f0fdf4] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-4">
              Why Choose AgriLink?
            </h2>
            <p className="text-lg text-[#4b5563] max-w-2xl mx-auto">
              Experience the difference that cutting-edge technology and farmer-first design can make.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#166534] rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Increase Productivity</h3>
              <p className="text-[#4b5563]">
                Boost your farm's output by up to 40% with AI-driven insights and precision farming techniques.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#166534] rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Maximize Profits</h3>
              <p className="text-[#4b5563]">
                Cut out middlemen and connect directly with buyers to get better prices for your produce.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#166534] rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Secure & Transparent</h3>
              <p className="text-[#4b5563]">
                Blockchain technology ensures your data and transactions are secure, transparent, and tamper-proof.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#166534] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Farming?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers who are already using AgriLink to grow their business and secure their future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-[#166534] px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all"
            >
              Get Started Now
            </Link>
            <Link
              href="/platform"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-[#166534] transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

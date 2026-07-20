import Link from 'next/link';
import { Users, Target, Heart, Award, Globe, Lightbulb, Shield } from 'lucide-react';

export default function About() {
  const team = [
    {
      name: "Goutham Chakravarthy S",
      role: "CEO (Chief Executive Officer)",
      description: "Visionary leader and co-founder driving the company's strategic direction and growth."
    },
    {
      name: "Bhuvan B N",
      role: "CTO (Chief Technical Officer)",
      description: "Technology expert and co-founder leading our technical vision and product development."
    },
    {
      name: "Surya Y S",
      role: "COO (Chief Operations Officer)",
      description: "Operations leader and co-founder ensuring seamless execution of our business strategies."
    },
    {
      name: "Ramya T G",
      role: "CPO (Chief Product Officer)",
      description: "Product visionary and co-founder shaping innovative solutions for our users."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f0de] to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-[#1f3b2c] mb-6">
              About AgriLink
            </h1>
            <p className="text-xl md:text-2xl text-[#4b5563] max-w-3xl mx-auto mb-8">
              We're on a mission to empower farmers with technology, connect agricultural communities, and build a sustainable future for agriculture.
            </p>
            <Link
              href="/contact"
              className="bg-gradient-to-r from-[#166534] to-[#15803d] text-white px-8 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-6">
              Our Mission
            </h2>
            <p className="text-lg text-[#4b5563] mb-6">
              To revolutionize agriculture by integrating cutting-edge technology with traditional farming wisdom, creating a sustainable and profitable ecosystem for farmers worldwide.
            </p>
            <p className="text-lg text-[#4b5563] mb-6">
              We believe that technology should empower, not replace, the invaluable knowledge and experience that farmers have cultivated over generations.
            </p>
          </div>
          <div className="bg-[#f0fdf4] p-8 rounded-xl">
            <Target className="w-16 h-16 text-[#166534] mb-4" />
            <h3 className="text-2xl font-semibold text-[#1f3b2c] mb-4">
              Our Vision
            </h3>
            <p className="text-[#4b5563]">
              To create a world where every farmer has access to the tools, knowledge, and markets they need to thrive in the digital age, ensuring food security and sustainable agriculture for future generations.
            </p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-[#f0fdf4] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-[#4b5563] max-w-2xl mx-auto">
              These principles guide everything we do, from product development to community engagement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Heart className="w-8 h-8 text-[#166534] mb-4" />
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Farmer First</h3>
              <p className="text-[#4b5563]">
                Every decision we make starts with the question: "How does this benefit farmers?"
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Lightbulb className="w-8 h-8 text-[#166534] mb-4" />
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Innovation</h3>
              <p className="text-[#4b5563]">
                Constantly pushing boundaries to find better solutions for agricultural challenges.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Shield className="w-8 h-8 text-[#166534] mb-4" />
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Trust & Security</h3>
              <p className="text-[#4b5563]">
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Users className="w-8 h-8 text-[#166534] mb-4" />
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Community</h3>
              <p className="text-[#4b5563]">
                Building strong connections and fostering collaboration among agricultural stakeholders.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Globe className="w-8 h-8 text-[#166534] mb-4" />
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Sustainability</h3>
              <p className="text-[#4b5563]">
                Promoting practices that ensure long-term environmental and economic viability.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Award className="w-8 h-8 text-[#166534] mb-4" />
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-3">Excellence</h3>
              <p className="text-[#4b5563]">
                Delivering the highest quality products and services to our agricultural community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-4">
            Meet Our Team
          </h2>
          <p className="text-lg text-[#4b5563] max-w-2xl mx-auto">
            Passionate individuals dedicated to transforming agriculture through technology and innovation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <div key={index} className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-[#166534] to-[#15803d] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[#1f3b2c] mb-2">
                {member.name}
              </h3>
              <p className="text-[#166534] font-medium mb-2">
                {member.role}
              </p>
              <p className="text-[#4b5563] text-sm">
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-[#f0fdf4] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-4">
              Our Story
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-[#4b5563] mb-6">
              AgriLink was born from a simple observation: while technology was transforming every industry, agriculture remained largely untouched by the digital revolution. Our founder, Dr. Rajesh Kumar, witnessed firsthand the challenges faced by small farmers in accessing markets, securing fair prices, and adopting modern farming practices.
            </p>
            <p className="text-lg text-[#4b5563] mb-6">
              What started as a small initiative in 2020 has grown into a comprehensive platform serving over 50,000 farmers across India. We've combined cutting-edge blockchain technology with practical agricultural knowledge to create solutions that truly make a difference in farmers' lives.
            </p>
            <p className="text-lg text-[#4b5563]">
              Today, AgriLink stands as a testament to what's possible when technology serves humanity's most fundamental need: food. We're not just building a platform; we're cultivating a movement to create a more sustainable, equitable, and prosperous future for agriculture.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#166534] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join Us in Transforming Agriculture
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Whether you're a farmer, supplier, or technology enthusiast, there's a place for you in the AgriLink community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-[#166534] px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-all"
            >
              Join Our Community
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-[#166534] transition-all"
            >
              Partner With Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { CheckCircle } from 'lucide-react';

const steps = [
  {
    id: 1,
    name: 'Register & Verify',
    description: 'Sign up as a farmer or supplier and complete a simple, secure KYC process by uploading your documents.',
  },
  {
    id: 2,
    name: 'Integrate or Shop',
    description: 'Farmers can opt-in to land integration, while everyone can browse our extensive marketplace for tools and equipment.',
  },
  {
    id: 3,
    name: 'Grow & Prosper',
    description: 'Utilize integrated land, smart tools, and AI insights to boost productivity, increase yield, and enhance profitability.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-[#f7f0de]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1f3b2c] mb-4">How It Works</h2>
          <p className="text-xl text-[#4b5563] max-w-3xl mx-auto">
            Get started with AgriLink in just a few simple steps
          </p>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute top-0 left-1/2 w-0.5 h-full bg-[#d1d5db] -ml-px"></div>
          
          {/* Steps */}
          <div className="space-y-12 md:space-y-16">
            {steps.map((step, index) => (
              <div key={step.id} className="relative flex flex-col md:flex-row items-center">
                {/* Left side (for even steps) */}
                <div className="hidden md:block md:w-1/2 pr-12">
                  {index % 2 === 0 && (
                    <div className="text-right">
                      <h3 className="text-lg font-medium text-gray-900">{step.name}</h3>
                      <p className="mt-2 text-gray-600">{step.description}</p>
                    </div>
                  )}
                </div>

                {/* Center circle */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#166534] text-white mx-auto mb-4 md:mb-0 relative z-10 shadow-lg">
                  <span className="font-semibold">{step.id}</span>
                </div>

                {/* Right side (for odd steps) */}
                <div className="md:w-1/2 pl-12">
                  {index % 2 === 1 && (
                    <div className="md:text-left">
                      <h3 className="text-lg font-medium text-gray-900">{step.name}</h3>
                      <p className="mt-2 text-gray-600">{step.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

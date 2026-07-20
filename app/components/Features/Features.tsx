import { LandPlot, LineChart, Tractor, ScrollText } from 'lucide-react';

const features = [
  {
    name: 'Blockchain Land Integration',
    description: 'Securely pool land with neighbors using smart contracts, increasing yield potential and fostering trust.',
    icon: LandPlot,
  },
  {
    name: 'AI Crop Price Prediction',
    description: 'Leverage AI to forecast crop prices based on historical data and location, enabling smarter selling decisions.',
    icon: LineChart,
  },
  {
    name: 'Smart Equipment Marketplace',
    description: 'Access a wide range of agricultural tools and machinery, from manual implements to smart, GPS-enabled equipment.',
    icon: Tractor,
  },
  {
    name: 'Govt. Scheme Discovery',
    description: 'Automatically find and get notified about government schemes applicable to you based on your land and profile.',
    icon: ScrollText,
  },
];

export default function Features() {
  return (
    <section id="features" className="py-16 bg-[#fbf5e6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-2">
            A New Era of Smart Agriculture
          </h2>
          <p className="text-sm md:text-base text-[#4b5563] max-w-2xl mx-auto">
            Our platform is built on cutting-edge technology to empower every stakeholder in the agricultural ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.name} className="bg-[#fffaf1] p-6 rounded-lg border border-[#f4b36b] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-[#fbead1] text-[#b45309] mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.name}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="bg-[#166534] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Farm?</h2>
        <p className="text-xl text-green-100 max-w-3xl mx-auto mb-8">
          Join the AgriLink community today and unlock the full potential of your land and business.
        </p>
        <Link 
          href="/register" 
          className="inline-block bg-[#f97316] text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-[#ea580c] transition-colors"
        >
          Register Now
        </Link>
      </div>
    </section>
  );
}

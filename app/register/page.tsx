import Link from 'next/link';
import HeaderWrapper from '../components/Header/HeaderWrapper';
import Footer from '../components/Footer/Footer';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f0de]">
      <HeaderWrapper />
      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-[#1f3b2c] mb-4">Join AgriLink</h1>
            <p className="text-base md:text-lg text-[#4b5563] max-w-2xl mx-auto">
              Choose your role to get started. Are you looking to grow, or to provide the tools for growth?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Farmer card */}
            <div className="bg-[#fffaf1] border border-[#e2d4b7] rounded-lg shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#1f3b2c] mb-2">Register as a Farmer</h2>
                <p className="text-sm text-[#4b5563] mb-4">
                  Join our community to integrate your land, access smart tools, and leverage AI for better yields.
                </p>
                <ul className="space-y-2 text-sm text-[#374151]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#166534]"></span>
                    <span>Securely pool land with neighbors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#166534]"></span>
                    <span>Access AI-powered crop insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#166534]"></span>
                    <span>Discover relevant government schemes</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  href="/register/farmer"
                  className="w-full inline-flex items-center justify-center rounded-md bg-[#166534] px-4 py-2 text-sm font-medium text-white hover:bg-[#14532d] transition-colors"
                >
                  Register
                  <span className="ml-2 text-lg leading-none">→</span>
                </Link>
              </div>
            </div>

            {/* Supplier card */}
            <div className="bg-[#fffaf1] border border-[#e2d4b7] rounded-lg shadow-sm p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#1f3b2c] mb-2">Register as a Supplier</h2>
                <p className="text-sm text-[#4b5563] mb-4">
                  List your agricultural equipment and supplies on our marketplace to reach a wider audience of farmers.
                </p>
                <ul className="space-y-2 text-sm text-[#374151]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#b45309]"></span>
                    <span>Showcase your products to verified farmers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#b45309]"></span>
                    <span>Easy-to-use product listing tools</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#b45309]"></span>
                    <span>Secure payment processing</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6">
                <Link
                  href="/register/supplier"
                  className="w-full inline-flex items-center justify-center rounded-md bg-[#f97316] px-4 py-2 text-sm font-medium text-white hover:bg-[#ea580c] transition-colors"
                >
                  I'm a Supplier
                  <span className="ml-2 text-lg leading-none">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center text-xs md:text-sm text-[#6b7280]">
            <span>Already have an account? </span>
            <Link href="/login" className="underline hover:text-[#166534]">
              Log in here
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

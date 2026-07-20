import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="footer" className="bg-[#f7f0de] border-t border-[#e2d4b7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-[#1f3b2c] mb-4">AgriLink</h3>
            <p className="text-[#4b5563]">
              Empowering agriculture through technology, connecting farmers, and cultivating a sustainable future with blockchain and AI.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-[#111827] uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/platform" className="text-[#4b5563] hover:text-[#166534]">Platform</Link></li>
              <li><Link href="/features" className="text-[#4b5563] hover:text-[#166534]">Features</Link></li>
              <li><Link href="/register" className="text-[#4b5563] hover:text-[#166534]">Register</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-[#111827] uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-[#4b5563] hover:text-[#166534]">About Us</Link></li>
              <li><Link href="/contact" className="text-[#4b5563] hover:text-[#166534]">Contact</Link></li>
              <li><Link href="/privacy" className="text-[#4b5563] hover:text-[#166534]">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} AgriLink. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

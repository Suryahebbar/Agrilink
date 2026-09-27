import Link from 'next/link';
import { Compass, Home, ArrowLeft, Sprout, Search } from 'lucide-react';
import HeaderWrapper from './components/Header/HeaderWrapper';
import Footer from './components/Footer/Footer';

export const metadata = {
  title: 'Page Not Found - 404',
  description: 'The page you were looking for does not exist on AgriLink.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f7f0de] via-[#fffdf9] to-white text-slate-800">
      <HeaderWrapper />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Visual Icon Illustration */}
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-100/70 animate-ping opacity-30" />
            <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-tr from-[#166534] to-[#22c55e] flex items-center justify-center shadow-2xl shadow-emerald-900/20 text-white transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <Compass className="w-14 h-14 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[#f59e0b] flex items-center justify-center text-white shadow-md">
              <Sprout className="w-5 h-5" />
            </div>
          </div>

          {/* Heading and error badge */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-emerald-100 text-[#166534] border border-emerald-200">
              Error 404 • Lost in the Field
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1f3b2c] tracking-tight">
              Plot Not Found
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
              Looks like this path hasn't been cultivated yet or the boundary coordinates have moved.
            </p>
          </div>

          {/* Quick Help Navigation Links */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-semibold text-sm shadow-lg shadow-emerald-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>

            <Link
              href="/features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#1f3b2c] border border-slate-200 font-semibold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Search className="w-4 h-4 text-emerald-600" />
              Explore Features
            </Link>
          </div>

          {/* Useful links footer bar */}
          <div className="pt-6 border-t border-slate-200/60 max-w-md mx-auto">
            <p className="text-xs text-slate-500 mb-3">Popular destinations:</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-[#166534]">
              <Link href="/register/farmer" className="hover:underline">Farmer Registration</Link>
              <span>•</span>
              <Link href="/login" className="hover:underline">Portal Login</Link>
              <span>•</span>
              <Link href="/platform" className="hover:underline">Platform Docs</Link>
              <span>•</span>
              <Link href="/contact" className="hover:underline">Support</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

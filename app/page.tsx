import type { Metadata } from 'next';
import HeaderWrapper from './components/Header/HeaderWrapper';
import Hero from './components/Hero/Hero';
import Features from './components/Features/Features';
import HowItWorks from './components/HowItWorks/HowItWorks';
import CTASection from './components/CTASection/CTASection';
import Footer from './components/Footer/Footer';

export const metadata: Metadata = {
  title: 'Home - Decentralized Agricultural Land Pooling',
  description: 'Connect fragmented farmlands, create smart pooling agreements, predict crop yields with AI, and trade fairly in our agricultural marketplace.',
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderWrapper />
      <main className="flex-grow">
        <Hero />
        <Features />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

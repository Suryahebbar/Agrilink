'use client';

import { useState, useEffect } from 'react';

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Unsplash farmland aerial images
  const images = [
    'https://images.unsplash.com/photo-1475084124271-aebaf8a67166?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1455106429120-62f655f62f83?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1529511582893-2d7e684dd128?q=80&w=1933&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1658900283889-798f1cf0ea0b?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1615129825073-c47c67bdec5b?q=80&w=1994&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="relative pt-60 pb-80 md:pt-90 md:pb-96 overflow-hidden">
      {/* Background images with crossfade */}
      <div className="absolute inset-0 -z-10">
        {images.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
            style={{
              backgroundImage: `url('${image}')`,
              filter: 'blur(2px)',
              opacity: currentImageIndex === index ? 1 : 0
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Connecting Fields, <span className="text-[#86efac]">Cultivating Futures</span>
          </h1>
          <p className="mt-6 text-xl text-white/90 max-w-3xl mx-auto">
            AgriLink bridges the gap between traditional farming and modern technology, 
            empowering farmers with blockchain land integration, AI-powered insights, 
            and a comprehensive marketplace for all agricultural needs.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#footer" 
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#d97706] hover:bg-[#b45309] md:py-4 md:text-lg md:px-10 transition-colors"
            >
              Explore Agrilink
            </a>
            <a 
              href="/register" 
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-[#166534] bg-[#dcfce7] hover:bg-[#bbf7d0] md:py-4 md:text-lg md:px-10 transition-colors"
            >
              Register
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
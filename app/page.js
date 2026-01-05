'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#2B2D9E] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2B2D9E] via-[#3535b0] to-[#1f2175]"></div>
      
      <div className="relative z-10 text-center px-4">
        {/* WannaGo Logo */}
        <h1 
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white mb-8 tracking-wider"
          style={{
            textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.6), 0 0 60px rgba(255, 255, 255, 0.4)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '0.05em'
          }}
        >
          WannaGo
        </h1>

        <p className="text-white/80 text-lg md:text-xl mb-12 max-w-md mx-auto">
          Choose & Connect. Share Activities. Meet Up.
        </p>

        {showButton && (
          <div className="space-y-6 animate-fade-in">
            <Link href="/auth/register">
              <button 
                className="text-2xl md:text-4xl font-bold text-white px-10 py-4 rounded-full transition-all duration-300 hover:scale-110 bg-[#4a3aff] hover:bg-[#5a4aff] shadow-lg"
                style={{
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                  letterSpacing: '0.1em'
                }}
              >
                JOIN UP
              </button>
            </Link>
            
            <div>
              <Link href="/auth/signin" className="text-white/80 hover:text-white underline underline-offset-4 transition-colors text-lg">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Decorative sparkle */}
      <div className="absolute bottom-10 right-10 text-white text-5xl opacity-60">
        ✦
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

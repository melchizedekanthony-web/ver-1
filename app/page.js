'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Show "JOIN UP" button after logo animation
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1aff] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1aff] via-[#2020ff] to-[#1515dd] animate-pulse"></div>
      
      <div className="relative z-10 text-center">
        {/* GOWITHME Logo with glow effect */}
        <h1 className="text-7xl md:text-9xl font-black text-white mb-8 tracking-wider animate-pulse"
            style={{
              textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.6), 0 0 60px rgba(255, 255, 255, 0.4)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.1em'
            }}>
          GOWITHME
        </h1>

        {/* JOIN UP Button - appears after delay */}
        {showButton && (
          <div className="animate-fade-in">
            <Link href="/auth/register">
              <button 
                className="text-3xl md:text-5xl font-bold text-white px-12 py-4 rounded-full transition-all duration-300 hover:scale-110"
                style={{
                  textShadow: '0 0 15px rgba(255, 255, 255, 0.9), 0 0 30px rgba(255, 255, 255, 0.7)',
                  letterSpacing: '0.15em'
                }}>
                JOIN UP
              </button>
            </Link>
            
            <div className="mt-8">
              <Link href="/auth/signin">
                <button className="text-lg text-white/80 hover:text-white underline underline-offset-4 transition-colors">
                  Already have an account? Sign in
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom sparkle effect */}
      <div className="absolute bottom-10 right-10 text-white text-6xl opacity-70 animate-pulse">
        ✦
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}

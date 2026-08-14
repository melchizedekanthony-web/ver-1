'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MapPin, Users, MessageSquare, Sparkles, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: MapPin, label: 'Radar', path: '/dashboard', filled: true },
    { icon: Users, label: 'Network', path: '/connections', filled: false },
    { icon: MessageSquare, label: 'Chat', path: '/messages', filled: false },
    { icon: Sparkles, label: 'AI Concierge', path: '/assistant', filled: false },
    { icon: User, label: 'Profile', path: '/profile', filled: false },
  ];

  return (
    <>
      <div className="fixed bottom-3 left-0 right-0 z-50 px-4 pb-safe pointer-events-none">
        <nav className="max-w-md mx-auto w-full bg-[#12151E]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] pointer-events-auto p-1.5">
          <div className="flex justify-around items-center h-14">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path + '/'));
              
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className="relative flex flex-col items-center justify-center w-full h-full space-y-0.5 group"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 bg-[#DC2626]/15 rounded-xl border border-[#DC2626]/40"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="relative flex flex-col items-center z-10">
                    <Icon 
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive 
                          ? 'text-[#DC2626] scale-110 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' 
                          : 'text-[#94A3B8] group-hover:text-white'
                      }`} 
                    />
                    {isActive && (
                      <span className="w-1 h-1 rounded-full bg-[#FBBF24] mt-0.5 animate-pulse shadow-[0_0_6px_#FBBF24]" />
                    )}
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight z-10 transition-colors ${
                    isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-[#E2E8F0]'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
      {/* Spacer to prevent content overlap */}
      <div className="h-20" />
    </>
  );
}


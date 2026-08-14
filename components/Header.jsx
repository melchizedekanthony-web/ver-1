'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Bell, ArrowLeft, Home, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

export default function Header({ user, showBack = true, title, onBack }) {
  const router = useRouter();
  const pathname = usePathname();

  // Main pages that should show back to dashboard
  const mainPages = ['/connections', '/messages', '/assistant', '/profile', '/calendar', '/alerts'];
  const isMainPage = mainPages.some(page => pathname.startsWith(page));
  const isDashboard = pathname === '/dashboard';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (isMainPage) {
      router.push('/dashboard');
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0A0C10]/80 backdrop-blur-xl border-b border-[#2A2F3D]/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {showBack && !isDashboard ? (
            <motion.button 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleBack} 
              className="text-[#E2E8F0] p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center -ml-2 border border-white/5"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
          ) : null}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => router.push('/dashboard')}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DC2626] to-[#991B1B] flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)] group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              {title ? (
                title
              ) : (
                <>Wanna<span className="text-[#DC2626] drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">Go</span></>
              )}
            </h1>
          </motion.div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isDashboard && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#E2E8F0] hover:bg-white/10 hover:text-white transition-colors rounded-full border border-white/5"
              onClick={() => router.push('/dashboard')}
            >
              <Home className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#E2E8F0] hover:bg-white/10 hover:text-white transition-colors rounded-full relative border border-white/5"
            onClick={() => router.push('/alerts')}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-[#0A0C10] animate-pulse"></span>
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Avatar 
              className="border-2 border-[#DC2626] w-9 h-9 cursor-pointer shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              onClick={() => router.push('/profile')}
            >
              <AvatarImage src={user?.profilePhoto} />
              <AvatarFallback className="bg-[#1A1E2B] text-white text-xs font-bold border border-white/10">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </div>
      </div>
    </header>
  );
}


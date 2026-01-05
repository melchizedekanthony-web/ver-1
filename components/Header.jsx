'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Bell, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Header({ user, showBack = true, title, onBack }) {
  const router = useRouter();
  const pathname = usePathname();

  // Main pages that should show back to dashboard
  const mainPages = ['/connections', '/messages', '/wellness', '/profile', '/calendar', '/alerts'];
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
    <header className="bg-[#2B2D9E] sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack && !isDashboard ? (
            <button 
              onClick={handleBack} 
              className="text-white p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : null}
          <h1 
            className="text-xl font-black text-white tracking-wider cursor-pointer"
            onClick={() => router.push('/dashboard')}
            style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
          >
            {title || 'WannaGo'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {!isDashboard && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={() => router.push('/dashboard')}
            >
              <Home className="w-5 h-5" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            onClick={() => router.push('/alerts')}
          >
            <Bell className="w-5 h-5" />
          </Button>
          <Avatar 
            className="border-2 border-white/40 w-8 h-8 cursor-pointer"
            onClick={() => router.push('/profile')}
          >
            <AvatarFallback className="bg-[#4a3aff] text-white text-sm">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

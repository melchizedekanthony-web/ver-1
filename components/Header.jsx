'use client';

import { useRouter } from 'next/navigation';
import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Header({ user, showBack, title }) {
  const router = useRouter();

  return (
    <header className="bg-[#1a1aff] sticky top-0 z-40 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button onClick={() => router.back()} className="text-white text-2xl">
              ←
            </button>
          ) : null}
          <h1 
            className="text-xl font-black text-white tracking-wider cursor-pointer"
            onClick={() => router.push('/dashboard')}
            style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
          >
            {title || 'GOWITHME'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
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

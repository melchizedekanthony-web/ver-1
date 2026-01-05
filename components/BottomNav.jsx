'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MapPin, Users, MessageSquare, ShoppingBag, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: MapPin, label: 'Explore', path: '/dashboard', filled: true },
    { icon: Users, label: 'Connections', path: '/connections', filled: false },
    { icon: MessageSquare, label: 'Chat', path: '/messages', filled: false },
    { icon: ShoppingBag, label: 'Store', path: '/wellness', filled: false },
    { icon: User, label: 'Profile', path: '/profile', filled: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
                isActive ? 'text-[#2B2D9E]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                <Icon 
                  className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} 
                  fill={isActive && item.filled ? 'currentColor' : 'none'}
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#2B2D9E] rounded-full" />
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-[#2B2D9E]' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area padding for mobile */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
}

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MapPin, Users, MessageSquare, ShoppingBag, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: MapPin, label: 'Explore', path: '/dashboard' },
    { icon: Users, label: 'Connections', path: '/connections' },
    { icon: MessageSquare, label: 'Chat', path: '/messages' },
    { icon: ShoppingBag, label: 'Store', path: '/wellness' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-[#1a1aff]' : 'text-gray-500 hover:text-[#4a3aff]'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

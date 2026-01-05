'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { 
  User, Calendar, Bell, Users, Settings, LogOut, ChevronRight,
  Edit, Shield, Star
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser, signOut, fetchWithAuth } from '@/lib/auth';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetchWithAuth('/api/profile');
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { icon: User, label: 'Set Status (e.g. Available)', path: '/profile/status' },
    { icon: Calendar, label: 'Availability & Calendar', path: '/calendar' },
    { icon: Bell, label: 'Alerts & Requests', path: '/alerts' },
    { icon: Users, label: 'My Connections', path: '/connections' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header user={user} title="MY PROFILE" />

      {/* Profile Card */}
      <Card className="mx-4 mt-4 p-6 text-center">
        <div className="relative inline-block">
          <Avatar className="w-24 h-24 mx-auto border-4 border-[#1a1aff]">
            <AvatarImage src={profile?.profilePhoto} />
            <AvatarFallback className="bg-[#4a3aff] text-white text-2xl">
              {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mt-4">{profile?.name || user?.name}</h2>
        <p className="text-gray-500">{profile?.email || user?.email}</p>
        
        {/* Rating */}
        <div className="flex items-center justify-center gap-1 mt-2">
          {[1,2,3,4,5].map((star) => (
            <Star 
              key={star} 
              className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
            />
          ))}
          <span className="text-gray-600 ml-1">(4.0)</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-2xl font-bold text-[#1a1aff]">24</p>
            <p className="text-sm text-gray-500">Activities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1a1aff]">18</p>
            <p className="text-sm text-gray-500">Connections</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1a1aff]">4.8</p>
            <p className="text-sm text-gray-500">Rating</p>
          </div>
        </div>
      </Card>

      {/* Menu Items */}
      <div className="mx-4 mt-4 space-y-2">
        {menuItems.map((item) => (
          <Card 
            key={item.path}
            className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
            onClick={() => router.push(item.path)}
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-[#1a1aff]" />
            </div>
            <span className="flex-1 font-medium text-gray-700">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Card>
        ))}
      </div>

      {/* Edit & Logout */}
      <div className="mx-4 mt-6 space-y-3">
        <Button 
          variant="outline"
          className="w-full py-6 border-[#1a1aff] text-[#1a1aff]"
          onClick={() => router.push('/profile/edit')}
        >
          <Edit className="w-5 h-5 mr-2" />
          EDIT PREFERENCES
        </Button>
        
        <Button 
          variant="outline"
          className="w-full py-6 border-red-500 text-red-500 hover:bg-red-50"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}

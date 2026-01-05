'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, Bell, MapPin, Coffee, Film, Music, Dumbbell, 
  Utensils, ShoppingBag, Users, Calendar, MessageSquare,
  Settings, LogOut, Mountain, Bike, BookOpen, Heart
} from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem('fittr_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } else {
        router.push('/auth/signin');
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/signin');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('fittr_user');
    localStorage.removeItem('fittr_token');
    await fetch('/api/signout', { method: 'POST' });
    window.location.href = '/';
  };

  // Activity options matching your flow images
  const activities = [
    { id: 'hiking', name: 'Hiking', icon: Mountain, color: 'bg-green-100 text-green-700' },
    { id: 'coffee', name: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
    { id: 'cinema', name: 'Cinema', icon: Film, color: 'bg-purple-100 text-purple-700' },
    { id: 'concert', name: 'Concert', icon: Music, color: 'bg-pink-100 text-pink-700' },
    { id: 'gym', name: 'Gym', icon: Dumbbell, color: 'bg-blue-100 text-blue-700' },
    { id: 'dining', name: 'Dining', icon: Utensils, color: 'bg-red-100 text-red-700' },
    { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: 'bg-yellow-100 text-yellow-700' },
    { id: 'cycling', name: 'Cycling', icon: Bike, color: 'bg-cyan-100 text-cyan-700' },
    { id: 'reading', name: 'Reading', icon: BookOpen, color: 'bg-indigo-100 text-indigo-700' },
    { id: 'wellness', name: 'Wellness', icon: Heart, color: 'bg-rose-100 text-rose-700' },
  ];

  const handleActivityClick = (activity) => {
    toast.success(`Let's find people for ${activity.name}!`);
    // Navigate to matches filtered by activity
    router.push(`/activity/${activity.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1aff] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1aff]">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-black text-white tracking-wider"
              style={{
                textShadow: '0 0 10px rgba(255, 255, 255, 0.6)'
              }}>
            GOWITHME
          </h1>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
            >
              <Bell className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5" />
            </Button>
            <Avatar className="border-2 border-white/40">
              <AvatarFallback className="bg-[#4a3aff] text-white">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2"
              style={{
                textShadow: '0 0 15px rgba(255, 255, 255, 0.5)'
              }}>
            What would you like to do?
          </h2>
          <p className="text-white/70 text-lg">Choose an activity and find companions nearby</p>
        </div>

        {/* Activity Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto mb-12">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <Card 
                key={activity.id}
                className="bg-white/95 backdrop-blur hover:bg-white transition-all duration-300 hover:scale-105 cursor-pointer border-0 shadow-xl"
                onClick={() => handleActivityClick(activity)}
              >
                <div className="p-6 flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-full ${activity.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-gray-800">{activity.name}</h3>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card 
            className="bg-white/95 backdrop-blur hover:bg-white transition-all cursor-pointer border-0 shadow-xl"
            onClick={() => router.push('/connections')}
          >
            <div className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#4a3aff]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#4a3aff]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">My Connections</h3>
                <p className="text-sm text-gray-600">View your network</p>
              </div>
            </div>
          </Card>

          <Card 
            className="bg-white/95 backdrop-blur hover:bg-white transition-all cursor-pointer border-0 shadow-xl"
            onClick={() => router.push('/calendar')}
          >
            <div className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#4a3aff]/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#4a3aff]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">My Schedule</h3>
                <p className="text-sm text-gray-600">Upcoming activities</p>
              </div>
            </div>
          </Card>

          <Card 
            className="bg-white/95 backdrop-blur hover:bg-white transition-all cursor-pointer border-0 shadow-xl"
            onClick={() => router.push('/wellness')}
          >
            <div className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#4a3aff]/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-[#4a3aff]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Wellness Store</h3>
                <p className="text-sm text-gray-600">Shop products</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Map placeholder - showing it's coming */}
        <div className="mt-12 max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur border-0 shadow-xl">
            <div className="p-8 text-center">
              <MapPin className="w-12 h-12 text-[#4a3aff] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Find People Nearby</h3>
              <p className="text-gray-600 mb-4">See who's active in your area</p>
              <Button className="bg-[#4a3aff] hover:bg-[#3a2aef] text-white">
                View Map
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          <button className="p-4 flex flex-col items-center text-[#4a3aff]">
            <MapPin className="w-6 h-6 mb-1" />
            <span className="text-xs">Explore</span>
          </button>
          <button className="p-4 flex flex-col items-center text-gray-600">
            <Users className="w-6 h-6 mb-1" />
            <span className="text-xs">Connections</span>
          </button>
          <button className="p-4 flex flex-col items-center text-gray-600">
            <MessageSquare className="w-6 h-6 mb-1" />
            <span className="text-xs">Messages</span>
          </button>
          <button className="p-4 flex flex-col items-center text-gray-600">
            <User className="w-6 h-6 mb-1" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
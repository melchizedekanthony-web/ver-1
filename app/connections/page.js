'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Star, Calendar, MoreVertical, Compass, UserCheck, Flame } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser, fetchWithAuth } from '@/lib/auth';

export default function ConnectionsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await fetchWithAuth('/api/matches');
      const data = await res.json();
      if (data.matches) {
        setConnections(data.matches.map(m => ({
          ...m,
          status: ['Active', 'Available', 'Busy'][Math.floor(Math.random() * 3)],
          lastActivity: ['Trail Run', 'Coffee & Code', 'Power Yoga', 'Rock Climbing'][Math.floor(Math.random() * 4)],
          connectionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star 
        key={star} 
        className={`w-3.5 h-3.5 ${star <= (rating || 4) ? 'text-[#FBBF24] fill-[#FBBF24]' : 'text-white/20'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[#94A3B8] text-sm">Loading activity connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white pb-32">
      <Header user={user} title="NETWORK" />
      
      {/* Search Header */}
      <div className="bg-[#12151E] px-4 py-4 border-b border-white/10 sticky top-14 z-20 backdrop-blur-xl">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] w-4 h-4" />
          <Input
            placeholder="Search activity partners & friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1A1E2B] border-white/10 text-white placeholder:text-[#94A3B8] rounded-xl h-11 focus-visible:ring-[#DC2626]"
          />
        </div>
      </div>

      {/* Connections List */}
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-white text-lg tracking-tight">Active Activity Network ({filteredConnections.length})</h2>
          <span className="text-xs font-bold text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/20 px-2.5 py-0.5 rounded-full">
            LIVE FRIENDS
          </span>
        </div>
        
        {filteredConnections.map((connection) => (
          <div 
            key={connection.id} 
            className="dark-glass-card p-4 hover:border-[#DC2626]/40 transition-all cursor-pointer"
            onClick={() => router.push(`/user/${connection.id}`)}
          >
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <Avatar className="w-14 h-14 border-2 border-[#DC2626]">
                  <AvatarImage src={connection.profilePhoto} />
                  <AvatarFallback className="bg-[#1A1E2B] text-white font-bold">
                    {connection.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0A0C10] ${
                  connection.status === 'Active' ? 'bg-[#DC2626]' : 
                  connection.status === 'Available' ? 'bg-[#FBBF24]' : 'bg-[#94A3B8]'
                }`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base truncate">{connection.name}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    connection.status === 'Active' ? 'bg-[#DC2626]/15 text-[#FF6B6B] border-[#DC2626]/30' : 
                    connection.status === 'Available' ? 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30' : 'bg-white/5 text-[#94A3B8] border-white/10'
                  }`}>
                    {connection.status}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#DC2626]" /> {connection.lastActivity} partner
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  {renderStars(connection.averageRating)}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
              <Button 
                size="sm" 
                className="flex-1 bg-[#1A1E2B] hover:bg-white/10 text-white font-bold border border-white/10 rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/messages/${connection.id}`);
                }}
              >
                <MessageSquare className="w-4 h-4 mr-1.5 text-[#DC2626]" />
                Direct Chat
              </Button>
              <Button 
                size="sm" 
                className="flex-1 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard?partner=${connection.id}`);
                }}
              >
                <Compass className="w-4 h-4 mr-1.5" />
                Request Activity
              </Button>
            </div>
          </div>
        ))}

        {filteredConnections.length === 0 && (
          <div className="text-center py-12 bg-[#12151E] rounded-2xl border border-white/10">
            <p className="text-[#94A3B8]">No activity connections found.</p>
            <Button 
              className="mt-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              onClick={() => router.push('/dashboard')}
            >
              Broadcast on Radar
            </Button>
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-30 space-y-2 pointer-events-auto">
        <Button 
          className="w-full py-3.5 bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:opacity-90 text-white font-bold rounded-2xl shadow-[0_0_25px_rgba(220,38,38,0.6)] border border-red-500/30"
          onClick={() => router.push('/dashboard')}
        >
          <Compass className="w-5 h-5 mr-2" />
          Find New Partners Nearby
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}


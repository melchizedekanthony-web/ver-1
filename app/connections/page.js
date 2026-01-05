'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Star, Calendar, MoreVertical } from 'lucide-react';
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
      // Using matches as connections for demo
      const res = await fetchWithAuth('/api/matches');
      const data = await res.json();
      if (data.matches) {
        setConnections(data.matches.map(m => ({
          ...m,
          status: ['Active', 'Available', 'Busy'][Math.floor(Math.random() * 3)],
          lastActivity: 'Hiking',
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
        className={`w-4 h-4 ${star <= (rating || 4) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading connections...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header user={user} title="CONNECTIONS" />
      
      {/* Search */}
      <div className="bg-white px-4 py-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50"
          />
        </div>
      </div>

      {/* Connections List */}
      <div className="p-4 space-y-3">
        <h2 className="font-bold text-gray-800 mb-3">My Connections ({filteredConnections.length})</h2>
        
        {filteredConnections.map((connection) => (
          <Card 
            key={connection.id} 
            className="bg-white p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/user/${connection.id}`)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={connection.profilePhoto} />
                  <AvatarFallback className="bg-[#4a3aff] text-white">
                    {connection.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  connection.status === 'Active' ? 'bg-green-500' : 
                  connection.status === 'Available' ? 'bg-blue-500' : 'bg-gray-400'
                }`}></div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{connection.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    connection.status === 'Active' ? 'bg-green-100 text-green-700' : 
                    connection.status === 'Available' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {connection.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{connection.lastActivity}</p>
                <div className="flex items-center gap-1 mt-1">
                  {renderStars(connection.averageRating)}
                </div>
              </div>
              
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/messages/${connection.id}`);
                }}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Message
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/rate/${connection.id}`);
                }}
              >
                <Star className="w-4 h-4 mr-1" />
                Rate
              </Button>
            </div>
          </Card>
        ))}

        {filteredConnections.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No connections found.</p>
            <Button 
              className="mt-4 bg-[#1a1aff]"
              onClick={() => router.push('/dashboard')}
            >
              Find Partners
            </Button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-20 left-4 right-4 space-y-2">
        <Button 
          variant="outline"
          className="w-full py-3 border-[#1a1aff] text-[#1a1aff]"
          onClick={() => router.push('/rate/experience')}
        >
          RATE EXPERIENCE
        </Button>
        <Button 
          className="w-full py-3 bg-[#1a1aff] hover:bg-[#1515dd]"
          onClick={() => router.push('/calendar')}
        >
          TRACK ACTIVITY
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}

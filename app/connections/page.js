'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Star, MessageCircle, Calendar, MoreVertical } from 'lucide-react';

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('fittr_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/matches', {
        credentials: 'include',
        headers
      });
      const data = await res.json();
      if (data.matches) {
        // Mock connection data
        const enriched = data.matches.map(m => ({
          ...m,
          connected: true,
          activitiesDone: Math.floor(Math.random() * 20) + 1,
          lastActivity: ['Gym', 'Running', 'Coffee', 'Hiking'][Math.floor(Math.random() * 4)]
        }));
        setConnections(enriched);
      }
    } catch (error) {
      console.error('Failed to fetch connections');
    }
  };

  const filteredConnections = connections.filter(conn => 
    conn.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4 mb-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">My Connections</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search connections..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-3xl font-bold text-[#4a3aff]">{connections.length}</div>
            <div className="text-sm text-gray-600">Total Connections</div>
          </Card>
          <Card className="p-4">
            <div className="text-3xl font-bold text-green-600">{Math.floor(connections.length * 0.3)}</div>
            <div className="text-sm text-gray-600">Active This Week</div>
          </Card>
        </div>

        {/* Connections List */}
        <div className="space-y-3">
          {filteredConnections.map((conn) => (
            <Card key={conn.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-[#4a3aff] text-white text-xl">
                      {conn.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-lg">{conn.name}</h3>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{conn.averageRating || '5.0'}</span>
                      <span className="text-sm text-gray-600">• {conn.activitiesDone} activities together</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        Last: {conn.lastActivity}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button size="sm" className="flex-1 bg-[#4a3aff] hover:bg-[#3a2aef]">
                        <Calendar className="w-4 h-4 mr-2" />
                        Plan Activity
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredConnections.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600">No connections found</div>
          </div>
        )}
      </main>
    </div>
  );
}
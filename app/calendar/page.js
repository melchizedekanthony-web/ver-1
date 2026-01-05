'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Users, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function CalendarPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('fittr_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/sessions?filter=upcoming', {
        credentials: 'include',
        headers
      });
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions');
    }
  };

  // Mock upcoming activities if no real sessions
  const mockSessions = [
    {
      id: 1,
      activityType: 'Gym',
      location: 'LA Fitness Downtown',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      participants: [{ user: { name: 'Sarah' } }, { user: { name: 'Mike' } }]
    },
    {
      id: 2,
      activityType: 'Coffee',
      location: 'Starbucks Main St',
      startTime: new Date(Date.now() + 172800000).toISOString(),
      participants: [{ user: { name: 'Emma' } }]
    },
    {
      id: 3,
      activityType: 'Hiking',
      location: 'Runyon Canyon',
      startTime: new Date(Date.now() + 259200000).toISOString(),
      participants: [{ user: { name: 'James' } }, { user: { name: 'Lisa' } }, { user: { name: 'Alex' } }]
    }
  ];

  const displaySessions = sessions.length > 0 ? sessions : mockSessions;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">My Schedule</h1>
                <p className="text-sm text-gray-600">Upcoming activities</p>
              </div>
            </div>
            <Button className="bg-[#4a3aff] hover:bg-[#3a2aef]">
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Calendar View Placeholder */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-[#4a3aff]/10 to-purple-100">
          <div className="text-center">
            <CalendarIcon className="w-12 h-12 text-[#4a3aff] mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-1">Calendar Integration Coming Soon</h3>
            <p className="text-sm text-gray-600">Sync with Google Calendar & Apple Calendar</p>
          </div>
        </Card>

        {/* Upcoming Activities */}
        <h2 className="text-lg font-bold mb-4">Upcoming Activities</h2>
        <div className="space-y-4">
          {displaySessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#4a3aff]/10 flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-[#4a3aff]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg">{session.activityType}</h3>
                      <Badge className="bg-green-100 text-green-700">Confirmed</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(session.startTime).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {session.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {session.participants?.length || 0} {session.participants?.length === 1 ? 'person' : 'people'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                      <Button size="sm" className="flex-1 bg-[#4a3aff] hover:bg-[#3a2aef]">
                        Get Directions
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {displaySessions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600 mb-4">No upcoming activities</div>
            <Button onClick={() => router.push('/dashboard')}>Find Activities</Button>
          </div>
        )}
      </main>
    </div>
  );
}
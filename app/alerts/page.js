'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Bell, Check, X, User, MapPin, Calendar } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser, fetchWithAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function AlertsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [meetupAlerts, setMeetupAlerts] = useState(true);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    generateMockRequests();
  }, []);

  const generateMockRequests = async () => {
    try {
      const res = await fetchWithAuth('/api/matches');
      const data = await res.json();
      if (data.matches) {
        // Generate incoming requests
        setIncomingRequests(data.matches.slice(0, 2).map((m, i) => ({
          ...m,
          activity: ['Hiking', 'Yoga'][i],
          status: 'pending'
        })));
        // Generate my requests
        setMyRequests(data.matches.slice(2, 4).map((m, i) => ({
          ...m,
          activity: ['Yoga', 'Coffee'][i],
          status: 'seeking'
        })));
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const handleAccept = (requestId) => {
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    toast.success('Request accepted!');
  };

  const handleDecline = (requestId) => {
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    toast.info('Request declined');
  };

  const handleCancelRequest = (requestId) => {
    setMyRequests(prev => prev.filter(r => r.id !== requestId));
    toast.info('Request cancelled');
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header user={user} title="ALERTS & REQUESTS" showBack />

      {/* Meetup Alerts Toggle */}
      <Card className="mx-4 mt-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#1a1aff]" />
            <span className="font-medium">Meetup Alerts</span>
          </div>
          <Switch 
            checked={meetupAlerts} 
            onCheckedChange={setMeetupAlerts}
          />
        </div>
      </Card>

      {/* Incoming Requests */}
      <div className="mx-4 mt-6">
        <h2 className="font-bold text-gray-800 mb-3">Incoming Requests</h2>
        {incomingRequests.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No incoming requests
          </Card>
        ) : (
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={request.profilePhoto} />
                    <AvatarFallback className="bg-[#4a3aff] text-white">
                      {request.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{request.name}: {request.activity}</p>
                    <p className="text-sm text-green-600">Accept/Decline</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleAccept(request.id)}
                  >
                    <Check className="w-4 h-4 mr-1" /> Accept
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                    onClick={() => handleDecline(request.id)}
                  >
                    <X className="w-4 h-4 mr-1" /> Decline
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* My Requests */}
      <div className="mx-4 mt-6">
        <h2 className="font-bold text-gray-800 mb-3">My Requests</h2>
        {myRequests.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No outgoing requests
          </Card>
        ) : (
          <div className="space-y-3">
            {myRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#1a1aff]" />
                    </div>
                    <div>
                      <p className="font-semibold">{request.activity}: Seeking</p>
                      <p className="text-sm text-gray-500">Looking for partners</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleCancelRequest(request.id)}
                  >
                    Decline
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

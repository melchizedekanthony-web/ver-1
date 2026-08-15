'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Bell, Check, X } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    fetchRequests();
  }, []);

  // Real, persisted connection requests — each one is a pending row in the
  // `meetups` collection (see app/connect/[userId]/page.js for the rest of
  // that flow). "Incoming" means someone else connected with you and is
  // waiting on your accept; "outgoing" means you're waiting on them.
  const fetchRequests = async () => {
    setError(false);
    try {
      const res = await fetchWithAuth('/api/meetups');
      const data = await res.json();
      if (res.ok) {
        setIncomingRequests(data.incoming || []);
        setMyRequests(data.outgoing || []);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId) => {
    try {
      const res = await fetchWithAuth(`/api/meetups/${userId}/accept`, { method: 'POST' });
      if (!res.ok) {
        toast.error('Could not accept this request');
        return;
      }
      setIncomingRequests(prev => prev.filter(r => r.userId !== userId));
      toast.success('Request accepted! Let\'s coordinate a meetup.');
      router.push(`/connect/${userId}`);
    } catch (error) {
      console.error('Failed to accept request:', error);
      toast.error('Could not accept this request');
    }
  };

  const handleDecline = async (userId) => {
    try {
      const res = await fetchWithAuth(`/api/meetups/${userId}/cancel`, { method: 'POST' });
      if (!res.ok) {
        toast.error('Could not decline this request');
        return;
      }
      setIncomingRequests(prev => prev.filter(r => r.userId !== userId));
      toast.info('Request declined');
    } catch (error) {
      console.error('Failed to decline request:', error);
      toast.error('Could not decline this request');
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      const res = await fetchWithAuth(`/api/meetups/${userId}/cancel`, { method: 'POST' });
      if (!res.ok) {
        toast.error('Could not cancel this request');
        return;
      }
      setMyRequests(prev => prev.filter(r => r.userId !== userId));
      toast.info('Request cancelled');
    } catch (error) {
      console.error('Failed to cancel request:', error);
      toast.error('Could not cancel this request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] pb-20">
        <Header user={user} title="ALERTS & REQUESTS" showBack />
        <div className="mx-4 mt-6 space-y-3 animate-pulse">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#12151E] border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] pb-20">
      <Header user={user} title="ALERTS & REQUESTS" showBack />

      {/* Meetup Alerts Toggle */}
      <Card className="mx-4 mt-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#DC2626]" />
            <span className="font-medium">Meetup Alerts</span>
          </div>
          <Switch
            checked={meetupAlerts}
            onCheckedChange={setMeetupAlerts}
          />
        </div>
      </Card>

      {error && (
        <Card className="mx-4 mt-4 p-4 bg-red-500/10 border-red-500/30">
          <p className="text-red-400 text-sm mb-2">Couldn't load your requests.</p>
          <Button size="sm" variant="outline" className="border-red-500/40 text-red-400" onClick={fetchRequests}>
            Retry
          </Button>
        </Card>
      )}

      {/* Incoming Requests */}
      <div className="mx-4 mt-6">
        <h2 className="font-bold text-white mb-3">Incoming Requests</h2>
        {incomingRequests.length === 0 ? (
          <Card className="p-6 text-center text-[#94A3B8]">
            No incoming requests
          </Card>
        ) : (
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <Card key={request.meetupId} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={request.profilePhoto} />
                    <AvatarFallback className="bg-[#DC2626] text-white">
                      {request.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {request.name}{request.activity ? `: ${request.activity}` : ''}
                    </p>
                    <p className="text-sm text-emerald-400">Wants to connect</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleAccept(request.userId)}
                  >
                    <Check className="w-4 h-4 mr-1" /> Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleDecline(request.userId)}
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
        <h2 className="font-bold text-white mb-3">My Requests</h2>
        {myRequests.length === 0 ? (
          <Card className="p-6 text-center text-[#94A3B8]">
            No outgoing requests
          </Card>
        ) : (
          <div className="space-y-3">
            {myRequests.map((request) => (
              <Card key={request.meetupId} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={request.profilePhoto} />
                      <AvatarFallback className="bg-white/5 text-white">
                        {request.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {request.name}{request.activity ? `: ${request.activity}` : ''}
                      </p>
                      <p className="text-sm text-[#94A3B8]">Waiting for them to accept</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleCancelRequest(request.userId)}
                  >
                    Cancel
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

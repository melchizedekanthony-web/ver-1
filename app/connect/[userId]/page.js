'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, MessageSquare, Phone, X, Check, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { getUser, fetchWithAuth } from '@/lib/auth';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function ConnectPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const activity = searchParams.get('activity');

  const [user, setUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('pending'); // pending, accepted, meeting
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [targetLocation, setTargetLocation] = useState({ lat: 40.7180, lng: -74.0010 });

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    fetchTargetUser();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Set target nearby
          setTargetLocation({
            lat: position.coords.latitude + (Math.random() - 0.5) * 0.02,
            lng: position.coords.longitude + (Math.random() - 0.5) * 0.02
          });
        },
        (error) => console.log('Geolocation error:', error)
      );
    }
  };

  const fetchTargetUser = async () => {
    try {
      const res = await fetchWithAuth('/api/matches');
      const data = await res.json();
      if (data.matches) {
        const found = data.matches.find(m => m.id === userId);
        if (found) {
          setTargetUser(found);
        } else if (data.matches.length > 0) {
          // Use first match as fallback for demo
          setTargetUser(data.matches[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const handleAcceptConnection = () => {
    setConnectionStatus('accepted');
    toast.success('Connection accepted! Share your location to meet up.');
  };

  const handleShareLocation = () => {
    setConnectionStatus('meeting');
    toast.success('Location shared! Navigate to meet your companion.');
  };

  const handleArrived = () => {
    toast.success('Great! You\'ve met up! Enjoy your activity!');
    router.push(`/meetup/${userId}?activity=${activity}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#1a1aff] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-white text-2xl">←</button>
        <h1 className="text-xl font-bold text-white">LOCATION CONNECT</h1>
        <div className="w-8"></div>
      </header>

      {/* Map */}
      <div className="h-[50vh] relative">
        <MapComponent
          center={[(userLocation.lat + targetLocation.lat) / 2, (userLocation.lng + targetLocation.lng) / 2]}
          zoom={14}
          users={targetUser ? [{ ...targetUser, location: targetLocation }] : []}
          currentUser={{ location: userLocation }}
          selectedUser={targetUser ? { ...targetUser, location: targetLocation } : null}
          showRoute={connectionStatus === 'meeting'}
          className="h-full w-full"
        />

        {/* Location markers legend */}
        <div className="absolute top-4 left-4 bg-white rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>You (A)</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>{targetUser?.name || 'Companion'} (B)</span>
          </div>
        </div>
      </div>

      {/* Connection Panel */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-4 py-6 min-h-[40vh]">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

        {targetUser && (
          <>
            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16 border-2 border-[#1a1aff]">
                <AvatarImage src={targetUser.profilePhoto} />
                <AvatarFallback className="bg-[#4a3aff] text-white text-xl">
                  {targetUser.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{targetUser.name}</h3>
                <p className="text-gray-500 capitalize">{activity || 'Activity'} Partner</p>
              </div>
            </div>

            {/* Status Messages */}
            {connectionStatus === 'pending' && (
              <Card className="bg-blue-50 border-blue-200 p-4 mb-6">
                <p className="text-blue-800">Waiting for {targetUser.name} to accept your connection request...</p>
                <div className="mt-3 flex justify-center">
                  <div className="animate-pulse flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animation-delay-200"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animation-delay-400"></div>
                  </div>
                </div>
              </Card>
            )}

            {connectionStatus === 'accepted' && (
              <Card className="bg-green-50 border-green-200 p-4 mb-6">
                <div className="flex items-center gap-2 text-green-800">
                  <Check className="w-5 h-5" />
                  <p>Connection accepted! Ready to share location?</p>
                </div>
              </Card>
            )}

            {connectionStatus === 'meeting' && (
              <Card className="bg-purple-50 border-purple-200 p-4 mb-6">
                <div className="flex items-center gap-2 text-purple-800">
                  <Navigation className="w-5 h-5" />
                  <p>Following route to meet {targetUser.name}...</p>
                </div>
                <p className="text-sm text-purple-600 mt-2">Estimated arrival: 5-10 minutes</p>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="flex gap-3 mb-6">
              <Button variant="outline" className="flex-1 py-6" onClick={() => router.push(`/messages/${targetUser.id}`)}>
                <MessageSquare className="w-5 h-5 mr-2" />
                Message
              </Button>
              <Button variant="outline" className="flex-1 py-6">
                <Phone className="w-5 h-5 mr-2" />
                Call
              </Button>
            </div>

            {/* Main Action Button */}
            {connectionStatus === 'pending' && (
              <Button 
                className="w-full py-6 bg-[#1a1aff] hover:bg-[#1515dd] text-white text-lg font-semibold"
                onClick={handleAcceptConnection}
              >
                Accept Connection
              </Button>
            )}

            {connectionStatus === 'accepted' && (
              <Button 
                className="w-full py-6 bg-[#1a1aff] hover:bg-[#1515dd] text-white text-lg font-semibold"
                onClick={handleShareLocation}
              >
                SHARE LOCATION
              </Button>
            )}

            {connectionStatus === 'meeting' && (
              <Button 
                className="w-full py-6 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
                onClick={handleArrived}
              >
                ARRIVED
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

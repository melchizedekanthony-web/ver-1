'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { getUser, fetchWithAuth } from '@/lib/auth';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { 
  ssr: false,
  loading: () => <div className="h-full bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function MeetupPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const activity = searchParams.get('activity');

  const [user, setUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [meetupLocation, setMeetupLocation] = useState({ lat: 40.7128, lng: -74.0060 });

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
          setMeetupLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
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
        setTargetUser(found || data.matches[0]);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const handleComplete = () => {
    toast.success('Activity completed! Don\'t forget to rate your experience.');
    router.push(`/rate/${userId}`);
  };

  const handleMessageGroup = () => {
    router.push(`/messages/${userId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#1a1aff] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-white text-2xl">←</button>
        <h1 className="text-xl font-bold text-white">MEET UP!</h1>
        <div className="w-8"></div>
      </header>

      {/* Map showing meetup location */}
      <div className="h-[50vh] relative">
        <MapComponent
          center={[meetupLocation.lat, meetupLocation.lng]}
          zoom={16}
          users={targetUser ? [{ ...targetUser, location: meetupLocation }] : []}
          currentUser={{ location: meetupLocation }}
          className="h-full w-full"
        />

        {/* Success indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 rounded-full p-4 shadow-lg">
          <Check className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Meetup Panel */}
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-4 py-6">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>

        {/* Success Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">You've Met Up!</h2>
          <p className="text-gray-600">Enjoy your {activity || 'activity'} together!</p>
        </div>

        {/* Participants */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Meetup Point</h3>
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <Avatar className="w-16 h-16 mx-auto border-2 border-green-500">
                <AvatarFallback className="bg-[#4a3aff] text-white">
                  {user?.name?.charAt(0) || 'Y'}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm mt-2 font-medium">You</p>
            </div>
            
            <div className="flex items-center">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            
            <div className="text-center">
              <Avatar className="w-16 h-16 mx-auto border-2 border-green-500">
                <AvatarImage src={targetUser?.profilePhoto} />
                <AvatarFallback className="bg-[#4a3aff] text-white">
                  {targetUser?.name?.charAt(0) || 'P'}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm mt-2 font-medium">{targetUser?.name || 'Partner'}</p>
            </div>
          </div>
        </div>

        {/* Location info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Nestay Point:</h3>
          <p className="text-gray-600">Soccer Field</p>
          <p className="text-sm text-gray-500">Secor Filed, Matt Denny</p>
          <p className="text-right font-semibold text-[#1a1aff]">$18.00</p>
        </div>

        {/* Action Buttons */}
        <Button 
          className="w-full py-6 bg-[#1a1aff] hover:bg-[#1515dd] text-white text-lg font-semibold mb-3"
          onClick={handleMessageGroup}
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          MESSAGE GROUP
        </Button>

        <Button 
          variant="outline"
          className="w-full py-6 border-[#1a1aff] text-[#1a1aff] text-lg font-semibold"
          onClick={handleComplete}
        >
          <Star className="w-5 h-5 mr-2" />
          Complete & Rate
        </Button>
      </div>
    </div>
  );
}

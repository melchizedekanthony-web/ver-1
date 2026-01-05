'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Check, Star, MessageSquare, Shield, XCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { getUser, fetchWithAuth } from '@/lib/auth';

const MapComponent = dynamic(
  () => import('@/components/MapComponent').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }
);

export default function MeetupPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const activity = searchParams.get('activity');

  const [user, setUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [meetupLocation, setMeetupLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  
  // Emergency state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const emergencyReasons = [
    'Felt unsafe',
    'Person was not who they said',
    'Inappropriate behavior',
    'Location seemed dangerous',
    'Other safety concern'
  ];

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

  const handleEmergencyExit = () => {
    setShowEmergencyModal(true);
  };

  const submitEmergency = async () => {
    try {
      const fullReason = additionalDetails 
        ? `${emergencyReason}: ${additionalDetails}` 
        : emergencyReason;

      await fetchWithAuth('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          targetId: targetUser?.id || userId,
          targetType: 'user',
          rating: 1,
          reviewText: fullReason,
          isCancellation: true,
          isEmergency: true
        })
      });

      toast.error('Emergency exit recorded. Stay safe!', { duration: 5000 });
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting emergency:', error);
      router.push('/dashboard');
    }
  };

  const skipAndExit = () => {
    toast.error('Emergency exit. Stay safe!', { duration: 5000 });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <header className="bg-[#2B2D9E] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-white text-2xl">←</button>
        <h1 className="text-xl font-bold text-white">MEET UP!</h1>
        <div className="w-8"></div>
      </header>

      {/* Map showing meetup location */}
      <div className="h-[45vh] relative">
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
          <h3 className="font-semibold text-gray-700 mb-2">Meetup Location</h3>
          <p className="text-gray-600 capitalize">{activity || 'Activity'} spot</p>
          <p className="text-sm text-gray-500">Current meetup location</p>
        </div>

        {/* Action Buttons */}
        <Button 
          className="w-full py-6 bg-[#2B2D9E] hover:bg-[#1f2175] text-white text-lg font-semibold mb-3"
          onClick={handleMessageGroup}
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          MESSAGE GROUP
        </Button>

        <Button 
          variant="outline"
          className="w-full py-6 border-[#2B2D9E] text-[#2B2D9E] text-lg font-semibold"
          onClick={handleComplete}
        >
          <Star className="w-5 h-5 mr-2" />
          Complete & Rate
        </Button>
      </div>

      {/* PROMINENT EMERGENCY EXIT BUTTON - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50 shadow-lg">
        <button
          onClick={handleEmergencyExit}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-md"
        >
          <Shield className="w-6 h-6" />
          EMERGENCY EXIT
          <XCircle className="w-6 h-6" />
        </button>
        <p className="text-center text-xs text-gray-500 mt-2">
          Tap anytime if you feel unsafe or need to leave immediately
        </p>
      </div>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 border-2 border-red-500 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-600">⚠️ Emergency Exit</h3>
              <button onClick={() => setShowEmergencyModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">
                <strong>Your safety is our priority.</strong> This will immediately end the meetup and your feedback will help keep the community safe.
              </p>
            </div>

            {/* Reason Selection */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">What happened?</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {emergencyReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setEmergencyReason(reason)}
                    className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                      emergencyReason === reason
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Additional details (optional)</p>
              <Textarea 
                placeholder="Please describe what happened..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Submit */}
            <div className="space-y-3">
              <Button 
                className="w-full py-4 bg-red-600 hover:bg-red-700"
                onClick={submitEmergency}
              >
                Exit & Report
              </Button>
              
              <Button 
                variant="outline"
                className="w-full py-4 border-red-300 text-red-600"
                onClick={skipAndExit}
              >
                Exit Without Reporting
              </Button>
              
              <Button 
                variant="ghost"
                className="w-full py-3 text-gray-500"
                onClick={() => setShowEmergencyModal(false)}
              >
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

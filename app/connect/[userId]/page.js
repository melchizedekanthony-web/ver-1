'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, MessageSquare, Phone, X, Check, Navigation, AlertTriangle, Star, Shield, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getUser, fetchWithAuth } from '@/lib/auth';

const MapComponent = dynamic(
  () => import('@/components/MapComponent').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <div className="h-full bg-gray-100 flex items-center justify-center">Loading map...</div>
  }
);

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
  
  // Cancel/Emergency state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRating, setCancelRating] = useState(0);
  const [isEmergency, setIsEmergency] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState('');

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

  const handleCancelMeetup = () => {
    setShowCancelModal(true);
    setIsEmergency(false);
  };

  const handleEmergencyCancel = () => {
    setShowCancelModal(true);
    setIsEmergency(true);
  };

  const submitCancellation = async () => {
    try {
      // Combine reason with additional details
      const fullReason = additionalDetails 
        ? `${cancelReason}: ${additionalDetails}` 
        : cancelReason;

      // In production, save the cancellation reason and rating
      await fetchWithAuth('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          targetId: targetUser?.id || userId,
          targetType: 'user',
          rating: cancelRating,
          reviewText: fullReason,
          isCancellation: true,
          isEmergency: isEmergency
        })
      });

      if (isEmergency) {
        toast.error('Emergency exit recorded. Stay safe!', { duration: 5000 });
      } else {
        toast.info('Meetup cancelled. Your feedback has been recorded.');
      }
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error submitting cancellation:', error);
      router.push('/dashboard');
    }
  };

  const skipAndExit = () => {
    if (isEmergency) {
      toast.error('Emergency exit. Stay safe!', { duration: 5000 });
    } else {
      toast.info('Meetup cancelled.');
    }
    router.push('/dashboard');
  };

  const cancelReasons = isEmergency ? [
    'Felt unsafe',
    'Person was not who they said',
    'Inappropriate behavior',
    'Location seemed dangerous',
    'Other safety concern'
  ] : [
    'Schedule conflict',
    'Running late',
    'Changed my mind',
    'Weather conditions',
    'Personal emergency',
    'Found another partner'
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <header className="bg-[#2B2D9E] px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-white text-2xl">←</button>
        <h1 className="text-xl font-bold text-white">LOCATION CONNECT</h1>
        <div className="w-8"></div>
      </header>

      {/* Map */}
      <div className="h-[40vh] relative">
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
      <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-4 py-6">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

        {targetUser && (
          <>
            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16 border-2 border-[#2B2D9E]">
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

            {/* Main Action Buttons */}
            {connectionStatus === 'pending' && (
              <div className="space-y-3">
                <Button 
                  className="w-full py-6 bg-[#2B2D9E] hover:bg-[#1f2175] text-white text-lg font-semibold"
                  onClick={handleAcceptConnection}
                >
                  Accept Connection
                </Button>
                <Button 
                  variant="outline"
                  className="w-full py-4 border-gray-300 text-gray-600 hover:bg-gray-50"
                  onClick={handleCancelMeetup}
                >
                  Cancel Meetup
                </Button>
              </div>
            )}

            {connectionStatus === 'accepted' && (
              <div className="space-y-3">
                <Button 
                  className="w-full py-6 bg-[#2B2D9E] hover:bg-[#1f2175] text-white text-lg font-semibold"
                  onClick={handleShareLocation}
                >
                  SHARE LOCATION
                </Button>
                <Button 
                  variant="outline"
                  className="w-full py-4 border-gray-300 text-gray-600 hover:bg-gray-50"
                  onClick={handleCancelMeetup}
                >
                  Cancel Meetup
                </Button>
              </div>
            )}

            {connectionStatus === 'meeting' && (
              <div className="space-y-3">
                <Button 
                  className="w-full py-6 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
                  onClick={handleArrived}
                >
                  ARRIVED
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* PROMINENT EMERGENCY EXIT BUTTON - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50 shadow-lg">
        <button
          onClick={handleEmergencyCancel}
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

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className={`w-full max-w-md p-6 ${isEmergency ? 'border-2 border-red-500' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${isEmergency ? 'text-red-600' : 'text-gray-800'}`}>
                {isEmergency ? '⚠️ Emergency Exit' : 'Cancel Meetup'}
              </h3>
              <button onClick={() => setShowCancelModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {isEmergency && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">
                  <strong>Your safety is our priority.</strong> This will immediately end the meetup and your feedback will help keep the community safe.
                </p>
              </div>
            )}

            {/* Reason Selection */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                {isEmergency ? 'What happened?' : 'Reason for cancelling'}
              </p>
              <div className="space-y-2">
                {cancelReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setCancelReason(reason)}
                    className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                      cancelReason === reason
                        ? isEmergency 
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-[#2B2D9E] bg-blue-50 text-[#2B2D9E]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating (optional) */}
            {!isEmergency && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Rate your experience (optional)</p>
                <div className="flex gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setCancelRating(star)}
                      className="p-1"
                    >
                      <Star 
                        className={`w-8 h-8 transition-colors ${
                          star <= cancelRating 
                            ? 'text-yellow-400 fill-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Additional details (optional)</p>
              <Textarea 
                placeholder={isEmergency ? "Please describe what happened..." : "Any additional notes..."}
                value={cancelReason.includes(cancelReasons[0]) ? '' : ''}
                onChange={(e) => setCancelReason(prev => {
                  const selected = cancelReasons.find(r => prev.startsWith(r));
                  return selected ? `${selected}: ${e.target.value}` : e.target.value;
                })}
                rows={3}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
              >
                Go Back
              </Button>
              <Button 
                className={`flex-1 ${isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2B2D9E] hover:bg-[#1f2175]'}`}
                onClick={submitCancellation}
              >
                {isEmergency ? 'Exit Now' : 'Cancel Meetup'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

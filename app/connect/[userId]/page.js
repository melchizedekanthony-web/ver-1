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
    loading: () => <div className="h-full bg-[#0A0C10] flex items-center justify-center">Loading map...</div>
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
    <div className="min-h-screen bg-[#0A0C10] pb-24">
      {/* Header */}
      <header className="bg-[#DC2626] px-4 py-3 flex items-center justify-between">
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
        <div className="absolute top-4 left-4 bg-[#12151E]/95 border border-white/10 rounded-lg px-3 py-2 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>You (A)</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className="w-3 h-3 rounded-full bg-white/50"></div>
            <span>{targetUser?.name || 'Companion'} (B)</span>
          </div>
        </div>
      </div>

      {/* Connection Panel */}
      <div className="bg-[#12151E] rounded-t-3xl -mt-6 relative z-10 px-4 py-6">
        <div className="w-12 h-1 bg-[#2A2F3D] rounded-full mx-auto mb-6"></div>

        {targetUser && (
          <>
            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16 border-2 border-[#DC2626]">
                <AvatarImage src={targetUser.profilePhoto} />
                <AvatarFallback className="bg-[#DC2626] text-white text-xl">
                  {targetUser.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold text-white">{targetUser.name}</h3>
                <p className="text-[#94A3B8] capitalize">{activity || 'Activity'} Partner</p>
                {targetUser.avgRating ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#FBBF24]/15 text-[#FBBF24] px-2 py-0.5 rounded-full border border-[#FBBF24]/30 mt-1">
                    <Star className="w-3 h-3 fill-[#FBBF24]" />
                    {targetUser.avgRating} · {targetUser.reviewCount} review{targetUser.reviewCount === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="inline-block text-xs font-bold bg-white/5 text-[#94A3B8] px-2 py-0.5 rounded-full border border-white/10 mt-1">
                    New here — no reviews yet
                  </span>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {connectionStatus === 'pending' && (
              <Card className="bg-[#DC2626]/10 border-[#DC2626]/30 p-4 mb-6">
                <p className="text-white">Waiting for {targetUser.name} to accept your connection request...</p>
                <div className="mt-3 flex justify-center">
                  <div className="animate-pulse flex gap-1">
                    <div className="w-2 h-2 bg-[#DC2626] rounded-full"></div>
                    <div className="w-2 h-2 bg-[#DC2626] rounded-full animation-delay-200"></div>
                    <div className="w-2 h-2 bg-[#DC2626] rounded-full animation-delay-400"></div>
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
                  className="w-full py-6 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-lg font-semibold"
                  onClick={handleAcceptConnection}
                >
                  Accept Connection
                </Button>
                <Button 
                  variant="outline"
                  className="w-full py-4 border-white/15 text-[#94A3B8] hover:bg-[#1A1E2B]"
                  onClick={handleCancelMeetup}
                >
                  Cancel Meetup
                </Button>
              </div>
            )}

            {connectionStatus === 'accepted' && (
              <div className="space-y-3">
                <Button 
                  className="w-full py-6 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-lg font-semibold"
                  onClick={handleShareLocation}
                >
                  SHARE LOCATION
                </Button>
                <Button 
                  variant="outline"
                  className="w-full py-4 border-white/15 text-[#94A3B8] hover:bg-[#1A1E2B]"
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
      <div className="fixed bottom-0 left-0 right-0 bg-[#12151E]/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 z-50 shadow-lg">
        <button
          onClick={handleEmergencyCancel}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-md"
        >
          <Shield className="w-6 h-6" />
          EMERGENCY EXIT
          <XCircle className="w-6 h-6" />
        </button>
        <p className="text-center text-xs text-[#94A3B8] mt-2">
          Tap anytime if you feel unsafe or need to leave immediately
        </p>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <Card className={`w-full max-w-md p-6 max-h-[90vh] overflow-y-auto ${isEmergency ? 'border-2 border-red-500' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${isEmergency ? 'text-red-600' : 'text-white'}`}>
                {isEmergency ? '⚠️ Emergency Exit' : 'Cancel Meetup'}
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6 text-[#94A3B8]" />
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
              <p className="text-sm font-medium text-[#E2E8F0] mb-2">
                {isEmergency ? 'What happened?' : 'Reason for cancelling (optional)'}
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cancelReasons.map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setCancelReason(reason)}
                    className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                      cancelReason === reason
                        ? isEmergency 
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-[#DC2626] bg-[#DC2626]/15 text-[#DC2626]'
                        : 'border-white/10 hover:border-white/15'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating (optional) - only for non-emergency */}
            {!isEmergency && (
              <div className="mb-4">
                <p className="text-sm font-medium text-[#E2E8F0] mb-2">Rate your experience (optional)</p>
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
                            : 'text-[#3A4052]'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div className="mb-6">
              <p className="text-sm font-medium text-[#E2E8F0] mb-2">Additional details (optional)</p>
              <Textarea 
                placeholder={isEmergency ? "Please describe what happened..." : "Any additional notes..."}
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Submit */}
            <div className="space-y-3">
              <Button 
                className={`w-full py-4 ${isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-[#DC2626] hover:bg-[#B91C1C]'}`}
                onClick={submitCancellation}
              >
                {isEmergency ? 'Exit & Report' : 'Cancel Meetup'}
              </Button>
              
              {isEmergency && (
                <Button 
                  variant="outline"
                  className="w-full py-4 border-red-300 text-red-600"
                  onClick={skipAndExit}
                >
                  Exit Without Reporting
                </Button>
              )}
              
              <Button 
                variant="ghost"
                className="w-full py-3 text-[#94A3B8]"
                onClick={() => setShowCancelModal(false)}
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

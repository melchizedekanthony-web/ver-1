'use client';

import { useEffect, useState, useRef } from 'react';
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

// Real straight-line distance in miles — same formula as the backend's
// haversineDistanceMiles, kept local here so the "you're close" proximity
// check and the live "X mi away" readout don't need a round trip.
function distanceMiles(a, b) {
  if (!a || !b || typeof a.lat !== 'number' || typeof b.lat !== 'number') return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sinLat), Math.sqrt(1 - sinLat));
}

const PROXIMITY_ALERT_MILES = 0.1; // ~528 ft

export default function ConnectPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const activity = searchParams.get('activity');

  const [user, setUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  // The real, shared meetup record — persisted server-side and visible to
  // BOTH participants (replaces the old local-only connectionStatus state,
  // which never left this browser tab and meant the other person had no
  // idea whether you'd accepted, dropped a pin, or arrived).
  const [meetup, setMeetup] = useState(null);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [pendingPin, setPendingPin] = useState(null); // {lat,lng} tapped but not yet sent
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const lastLocationPostRef = useRef(0);
  const proximityAlertedRef = useRef(false);
  const watchIdRef = useRef(null);

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
    fetchMeetup();

    // Poll the shared meetup record so each side sees the other's actions
    // (accept, pin proposed/confirmed, arrived) without a manual refresh.
    // No websocket infra yet — this is the simplest real synchronization
    // that beats the old "never synced at all" local state.
    const interval = setInterval(fetchMeetup, 5000);
    return () => clearInterval(interval);
  }, []);

  // Once both sides have arrived, hand off to the post-meetup screen.
  useEffect(() => {
    if (meetup?.status === 'completed') {
      router.push(`/meetup/${userId}?activity=${activity}`);
    }
  }, [meetup?.status]);

  // Live in-transit position sharing — only runs once the meeting point is
  // locked in and both people are actually heading there. Uses watchPosition
  // rather than a one-off getCurrentPosition so the marker keeps moving, and
  // throttles the actual network write to every ~8s so it doesn't spam the
  // server on every GPS tick.
  useEffect(() => {
    const isTransitPhase = meetup?.status === 'in_transit' || meetup?.status === 'arrived';
    if (!isTransitPhase || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(loc);

        const now = Date.now();
        if (now - lastLocationPostRef.current > 8000) {
          lastLocationPostRef.current = now;
          fetchWithAuth(`/api/meetups/${userId}/location`, {
            method: 'POST',
            body: JSON.stringify({ lat: loc.lat, lng: loc.lng })
          }).catch((error) => console.error('Failed to share live location:', error));
        }
      },
      (error) => console.log('Geolocation watch error:', error),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [meetup?.status, userId]);

  // Proximity alert — fires once per meetup when the two live positions get
  // within PROXIMITY_ALERT_MILES of each other, so no one has to keep
  // eyeballing the map to know their companion is close.
  useEffect(() => {
    const theirLiveLocation = meetup?.participantLocations?.[userId];
    if (meetup?.status !== 'in_transit' || !theirLiveLocation) return;

    const distance = distanceMiles(userLocation, theirLiveLocation);
    if (distance !== null && distance <= PROXIMITY_ALERT_MILES && !proximityAlertedRef.current) {
      proximityAlertedRef.current = true;
      toast.success(`${targetUser?.name || 'Your companion'} is close by!`, { duration: 6000 });
    }
  }, [meetup?.participantLocations, meetup?.status, userLocation, userId, targetUser?.name]);

  const fetchMeetup = async () => {
    try {
      const url = `/api/meetups/${userId}${activity ? `?activity=${encodeURIComponent(activity)}` : ''}`;
      const res = await fetchWithAuth(url);
      const data = await res.json();
      if (res.ok && data.meetup) {
        setMeetup(data.meetup);
      }
    } catch (error) {
      console.error('Failed to fetch meetup:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Geolocation error:', error)
      );
    }
  };

  // Fetches the SPECIFIC person this page is about, by id — not a lookup
  // into whatever the current /api/matches list happens to contain. The old
  // version silently fell back to "the first match" when the requested id
  // wasn't found, which meant this page — the cancel/emergency-exit page —
  // could show the wrong person's name, photo, and rating. Real location
  // (if they're currently broadcasting) comes back too, no fabrication.
  const fetchTargetUser = async () => {
    try {
      const res = await fetchWithAuth(`/api/users/${userId}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setTargetUser(data.user);
      } else {
        toast.error("Couldn't load this person's info");
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const handleCall = () => {
    if (!targetUser?.phone) return;
    window.location.href = `tel:${targetUser.phone}`;
  };

  const handleAcceptConnection = async () => {
    try {
      const res = await fetchWithAuth(`/api/meetups/${userId}/accept`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.meetup) {
        setMeetup(data.meetup);
        toast.success('Connection accepted!');
      } else {
        toast.error(data.error || 'Could not accept connection');
      }
    } catch (error) {
      console.error('Failed to accept connection:', error);
      toast.error('Could not accept connection');
    }
  };

  // Only active while pinDropMode is on — lets the user tap the map above to
  // pick a real meeting spot instead of the old fake "share location" theater.
  const handleMapClick = ({ lat, lng }) => {
    if (!pinDropMode) return;
    setPendingPin({ lat, lng });
  };

  const submitMeetingPoint = async () => {
    if (!pendingPin) return;
    try {
      const res = await fetchWithAuth(`/api/meetups/${userId}/point`, {
        method: 'POST',
        body: JSON.stringify({ lat: pendingPin.lat, lng: pendingPin.lng, label: 'Meeting point' })
      });
      const data = await res.json();
      if (res.ok && data.meetup) {
        setMeetup(data.meetup);
        setPinDropMode(false);
        setPendingPin(null);
        toast.success(`Meeting point proposed to ${targetUser?.name || 'them'}`);
      } else {
        toast.error(data.error || 'Could not set meeting point');
      }
    } catch (error) {
      console.error('Failed to propose meeting point:', error);
      toast.error('Could not set meeting point');
    }
  };

  const handleConfirmMeetingPoint = async () => {
    try {
      const res = await fetchWithAuth(`/api/meetups/${userId}/confirm-point`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.meetup) {
        setMeetup(data.meetup);
        toast.success('Meeting point confirmed! Head over when ready.');
      } else {
        toast.error(data.error || 'Could not confirm meeting point');
      }
    } catch (error) {
      console.error('Failed to confirm meeting point:', error);
      toast.error('Could not confirm meeting point');
    }
  };

  const handleArrived = async () => {
    try {
      const res = await fetchWithAuth(`/api/meetups/${userId}/arrived`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.meetup) {
        setMeetup(data.meetup);
        if (data.meetup.status === 'completed') {
          toast.success('You\'ve both arrived! Enjoy your activity!');
        } else {
          toast.success('Marked as arrived — waiting for them to get there too.');
        }
      } else {
        toast.error(data.error || 'Could not update status');
      }
    } catch (error) {
      console.error('Failed to mark arrived:', error);
      toast.error('Could not update status');
    }
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

      // Save the cancellation reason/rating and end the shared meetup record
      // so the other participant's view updates too (not just this tab's).
      await Promise.all([
        fetchWithAuth('/api/reviews', {
          method: 'POST',
          body: JSON.stringify({
            targetId: targetUser?.id || userId,
            targetType: 'user',
            rating: cancelRating,
            reviewText: fullReason,
            isCancellation: true,
            isEmergency: isEmergency
          })
        }),
        fetchWithAuth(`/api/meetups/${userId}/cancel`, { method: 'POST' })
      ]);

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

  const skipAndExit = async () => {
    try {
      await fetchWithAuth(`/api/meetups/${userId}/cancel`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to cancel meetup:', error);
    }
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

  const status = meetup?.status || 'pending';
  const myId = user?.id;
  const iAccepted = !!(meetup?.acceptedBy || []).includes(myId);
  const iProposedPoint = meetup?.meetingPointProposedBy === myId;
  const iConfirmedPoint = !!(meetup?.meetingPointConfirmedBy || []).includes(myId);
  const iArrived = !!(meetup?.arrivedBy || []).includes(myId);
  const activePin = pendingPin || meetup?.meetingPoint || null;

  // Once they're actually en route, their live-shared position (updated every
  // ~8s while this page is open on their end) is more useful than the
  // once-an-hour broadcast location, so it takes priority on the map.
  const theirLiveLocation = meetup?.participantLocations?.[userId] || null;
  const liveTargetLocation = theirLiveLocation || targetUser?.location || null;
  const liveTargetUser = targetUser ? { ...targetUser, location: liveTargetLocation } : null;
  const liveDistanceMiles = theirLiveLocation ? distanceMiles(userLocation, theirLiveLocation) : null;

  const mapFocus = activePin || liveTargetLocation || null;

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
          center={mapFocus
            ? [(userLocation.lat + mapFocus.lat) / 2, (userLocation.lng + mapFocus.lng) / 2]
            : [userLocation.lat, userLocation.lng]}
          zoom={14}
          users={liveTargetLocation ? [liveTargetUser] : []}
          currentUser={{ location: userLocation }}
          selectedUser={liveTargetLocation ? liveTargetUser : null}
          showRoute={(status === 'in_transit' || status === 'arrived') && !!liveTargetLocation}
          onMapClick={pinDropMode ? handleMapClick : undefined}
          meetingPoint={activePin}
          className="h-full w-full"
        />

        {pinDropMode && (
          <div className="absolute inset-x-4 bottom-4 bg-[#DC2626]/95 text-white text-sm font-semibold text-center py-2 px-3 rounded-lg shadow-lg backdrop-blur-md">
            Tap anywhere on the map to drop your meeting pin
          </div>
        )}

        {/* Location markers legend */}
        <div className="absolute top-4 left-4 bg-[#12151E]/95 border border-white/10 rounded-lg px-3 py-2 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>You (A)</span>
          </div>
          <div className="flex items-center gap-2 text-sm mt-1">
            <div className={`w-3 h-3 rounded-full ${liveTargetLocation ? 'bg-white/50' : 'bg-white/20'}`}></div>
            <span>
              {targetUser?.name || 'Companion'} (B)
              {theirLiveLocation ? ' — live' : !liveTargetLocation ? ' — location unavailable' : ''}
            </span>
          </div>
          {meetup?.meetingPoint && (
            <div className="flex items-center gap-2 text-sm mt-1">
              <div className="w-3 h-3 rounded-full bg-[#FBBF24]"></div>
              <span>Meeting point</span>
            </div>
          )}
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
            {status === 'pending' && (
              <Card className="bg-[#DC2626]/10 border-[#DC2626]/30 p-4 mb-6">
                {iAccepted ? (
                  <>
                    <p className="text-white">Waiting for {targetUser.name} to accept your connection request...</p>
                    <div className="mt-3 flex justify-center">
                      <div className="animate-pulse flex gap-1">
                        <div className="w-2 h-2 bg-[#DC2626] rounded-full"></div>
                        <div className="w-2 h-2 bg-[#DC2626] rounded-full animation-delay-200"></div>
                        <div className="w-2 h-2 bg-[#DC2626] rounded-full animation-delay-400"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-white">Ready to connect with {targetUser.name} for {activity || 'this activity'}? Accept to start coordinating a meetup.</p>
                )}
              </Card>
            )}

            {status === 'accepted' && (
              <Card className="bg-emerald-500/10 border-emerald-500/30 p-4 mb-6">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-5 h-5" />
                  <p>Connection accepted! Drop a pin on the map to suggest where to meet.</p>
                </div>
              </Card>
            )}

            {status === 'meeting_point_set' && (
              <Card className="bg-[#FBBF24]/10 border-[#FBBF24]/30 p-4 mb-6">
                <div className="flex items-center gap-2 text-[#FBBF24]">
                  <MapPin className="w-5 h-5" />
                  <p>
                    {iProposedPoint
                      ? `You proposed a meeting point — waiting for ${targetUser.name} to confirm.`
                      : `${targetUser.name} proposed a meeting point.`}
                  </p>
                </div>
              </Card>
            )}

            {status === 'in_transit' && (
              <Card className="bg-[#FBBF24]/10 border-[#FBBF24]/30 p-4 mb-6">
                <div className="flex items-center gap-2 text-[#FBBF24]">
                  <Navigation className="w-5 h-5" />
                  <p>Meeting point confirmed — head over when ready!</p>
                </div>
                <p className="text-sm text-[#94A3B8] mt-2">
                  {theirLiveLocation
                    ? liveDistanceMiles !== null
                      ? `${targetUser.name} is ${liveDistanceMiles < 0.1 ? 'right nearby' : `${liveDistanceMiles.toFixed(1)} mi away`}`
                      : 'Live location shared'
                    : "Waiting for their location to update"}
                </p>
              </Card>
            )}

            {status === 'arrived' && (
              <Card className="bg-emerald-500/10 border-emerald-500/30 p-4 mb-6">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-5 h-5" />
                  <p>
                    {iArrived
                      ? `You're marked as arrived — waiting for ${targetUser.name}.`
                      : `${targetUser.name} has arrived! Tap Arrived when you get there.`}
                  </p>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="flex gap-3 mb-6">
              <Button variant="outline" className="flex-1 py-6" onClick={() => router.push(`/messages/${targetUser.id}`)}>
                <MessageSquare className="w-5 h-5 mr-2" />
                Message
              </Button>
              <Button
                variant="outline"
                className="flex-1 py-6 disabled:opacity-40"
                onClick={handleCall}
                disabled={!targetUser?.phone}
                title={targetUser?.phone ? `Call ${targetUser.name}` : "They haven't shared a phone number"}
              >
                <Phone className="w-5 h-5 mr-2" />
                Call
              </Button>
            </div>

            {/* Main Action Buttons */}
            {pinDropMode ? (
              <div className="space-y-3">
                <p className="text-center text-sm text-[#94A3B8]">Tap the map above to place your meeting point</p>
                <Button
                  className="w-full py-6 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-lg font-semibold disabled:opacity-40"
                  onClick={submitMeetingPoint}
                  disabled={!pendingPin}
                >
                  Propose This Spot
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-3 border-white/15 text-[#94A3B8]"
                  onClick={() => { setPinDropMode(false); setPendingPin(null); }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                {status === 'pending' && (
                  <div className="space-y-3">
                    {!iAccepted ? (
                      <Button
                        className="w-full py-6 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-lg font-semibold"
                        onClick={handleAcceptConnection}
                      >
                        Accept Connection
                      </Button>
                    ) : (
                      <Button disabled className="w-full py-6 bg-[#2A2F3D] text-[#94A3B8] text-lg font-semibold">
                        Waiting for {targetUser.name}...
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full py-4 border-white/15 text-[#94A3B8] hover:bg-[#1A1E2B]"
                      onClick={handleCancelMeetup}
                    >
                      Cancel Meetup
                    </Button>
                  </div>
                )}

                {status === 'accepted' && (
                  <div className="space-y-3">
                    <Button
                      className="w-full py-6 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-lg font-semibold"
                      onClick={() => setPinDropMode(true)}
                    >
                      DROP PIN ON MAP
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

                {status === 'meeting_point_set' && (
                  <div className="space-y-3">
                    {!iConfirmedPoint ? (
                      <Button
                        className="w-full py-6 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-lg font-semibold"
                        onClick={handleConfirmMeetingPoint}
                      >
                        CONFIRM MEETING POINT
                      </Button>
                    ) : (
                      <Button disabled className="w-full py-6 bg-[#2A2F3D] text-[#94A3B8] text-lg font-semibold">
                        Waiting for {targetUser.name} to confirm...
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full py-4 border-white/15 text-[#94A3B8] hover:bg-[#1A1E2B]"
                      onClick={() => setPinDropMode(true)}
                    >
                      Suggest a Different Spot
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

                {status === 'in_transit' && (
                  <div className="space-y-3">
                    <Button
                      className="w-full py-6 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
                      onClick={handleArrived}
                    >
                      ARRIVED
                    </Button>
                  </div>
                )}

                {status === 'arrived' && (
                  <div className="space-y-3">
                    {!iArrived ? (
                      <Button
                        className="w-full py-6 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
                        onClick={handleArrived}
                      >
                        ARRIVED
                      </Button>
                    ) : (
                      <Button disabled className="w-full py-6 bg-[#2A2F3D] text-[#94A3B8] text-lg font-semibold">
                        Waiting for {targetUser.name}...
                      </Button>
                    )}
                  </div>
                )}
              </>
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
              <h3 className={`text-xl font-bold ${isEmergency ? 'text-red-400' : 'text-white'}`}>
                {isEmergency ? '⚠️ Emergency Exit' : 'Cancel Meetup'}
              </h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6 text-[#94A3B8]" />
              </button>
            </div>

            {isEmergency && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">
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
                          ? 'border-red-500 bg-red-500/15 text-red-400'
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
                  className="w-full py-4 border-red-500/40 text-red-400"
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

'use client';

import { useEffect, useRef } from 'react';
import { getUser, fetchWithAuth } from '@/lib/auth';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes while the tab is open and visible

// Mounted once, globally (see app/providers.jsx), for every signed-in page.
// Sends a lightweight "still here" signal — real lastActiveAt + real
// last-known location — which is what makes someone show up in other
// people's nearby radar just by having the app open, without requiring an
// explicit broadcast every time (see findNearbyBroadcasters in the API).
//
// Two things keep this from overreaching:
//   1. It checks the user's own Available toggle before ever touching
//      geolocation — if they've turned it off, this does nothing at all,
//      not even a location permission prompt.
//   2. It only runs while the tab is actually visible in the foreground.
//      A web app can't reliably keep running while backgrounded or the
//      phone is locked anyway (that's a real platform limitation, not a
//      choice — see the native-app conversion path for what changes that),
//      so this deliberately doesn't pretend to be a true background service.
//      The 4-hour staleness window server-side (AVAILABILITY_STALE_MS)
//      is what naturally times someone out if they stop opening the app,
//      rather than requiring this component to run in the background.
export default function PresenceHeartbeat() {
  const intervalRef = useRef(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    let cancelled = false;

    const sendHeartbeat = async () => {
      try {
        // Re-checked on every heartbeat (not just once on mount) so turning
        // Available off in the Profile tab takes effect quickly, even
        // though this component itself doesn't re-render for that change.
        const presenceRes = await fetchWithAuth('/api/presence');
        const presence = await presenceRes.json();
        if (cancelled || !presence?.available) return;

        const send = (lat, lng) => {
          fetchWithAuth('/api/presence/heartbeat', {
            method: 'POST',
            body: JSON.stringify(typeof lat === 'number' ? { lat, lng } : {})
          }).catch((error) => console.error('Presence heartbeat failed:', error));
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => send(position.coords.latitude, position.coords.longitude),
            () => send(), // denied or unavailable — still record "active", just no location update
            { maximumAge: 4 * 60 * 1000 }
          );
        } else {
          send();
        }
      } catch (error) {
        console.error('Presence check failed:', error);
      }
    };

    const startInterval = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') sendHeartbeat();
      }, HEARTBEAT_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
        startInterval();
      }
    };

    sendHeartbeat();
    startInterval();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return null;
}

'use client';

import { useEffect, useState, useRef } from 'react';

export default function MapComponent({
  center = [40.7128, -74.0060],
  zoom = 13,
  users = [],
  currentUser = null,
  selectedUser = null,
  onUserClick,
  showRoute = false,
  onMapClick,
  meetingPoint = null,
  className = ''
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return;
      
      const L = (await import('leaflet')).default;
      
      // Fix default marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (mapRef.current && !mapInstanceRef.current) {
        // Initialize map with Dark Matter CartoDB tiles
        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView(center, zoom);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsLoaded(true);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Tap-to-drop-pin support — only active while a caller passes onMapClick
  // (e.g. the connect page's "propose a meeting point" mode). Re-bound
  // whenever the handler identity changes so it never fires a stale closure.
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !onMapClick) return;
    const map = mapInstanceRef.current;
    const handleClick = (e) => {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [onMapClick, isLoaded]);

  // Update markers when users change
  useEffect(() => {
    const updateMarkers = async () => {
      if (!mapInstanceRef.current || !isLoaded) return;

      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Custom HTML Marker for Current User (Glowing Red Pulse Radar)
      const createCurrentUserIcon = () => {
        return L.divIcon({
          className: 'custom-user-pin',
          html: `
            <div style="position: relative; width: 44px; height: 44px; display: flex; items-center; justify-content: center;">
              <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(220, 38, 38, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; inset: 6px; border-radius: 9999px; background: rgba(220, 38, 38, 0.6);"></div>
              <div style="position: relative; width: 20px; height: 20px; border-radius: 9999px; background: #DC2626; border: 3px solid #FFFFFF; box-shadow: 0 0 15px #DC2626;"></div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });
      };

      // Custom HTML Marker for Nearby Users / Activity Matches
      const createMatchUserIcon = (user, isSelected) => {
        const initial = user.name ? user.name.charAt(0) : 'U';
        const photo = user.profilePhoto;
        const color = isSelected ? '#FBBF24' : '#DC2626';
        
        return L.divIcon({
          className: 'custom-match-pin',
          html: `
            <div style="position: relative; cursor: pointer; transition: transform 0.2s;">
              <div style="
                width: 42px; 
                height: 42px; 
                border-radius: 9999px; 
                background: #12151E; 
                border: 2px solid ${color}; 
                box-shadow: 0 0 15px ${isSelected ? 'rgba(251, 191, 36, 0.8)' : 'rgba(220, 38, 38, 0.6)'}; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                overflow: hidden;
              ">
                ${photo 
                  ? `<img src="${photo}" style="width: 100%; height: 100%; object-fit: cover;" />`
                  : `<span style="color: #FFFFFF; font-weight: 800; font-size: 14px;">${initial}</span>`
                }
              </div>
              <div style="
                position: absolute; 
                bottom: -4px; 
                right: -2px; 
                width: 14px; 
                height: 14px; 
                border-radius: 9999px; 
                background: #FBBF24; 
                border: 2px solid #0A0C10;
              "></div>
            </div>
          `,
          iconSize: [42, 42],
          iconAnchor: [21, 21]
        });
      };

      // Add current user marker
      if (currentUser?.location) {
        const marker = L.marker([currentUser.location.lat, currentUser.location.lng], {
          icon: createCurrentUserIcon()
        }).addTo(map);
        marker.bindPopup(`
          <div style="background: #12151E; color: #FFFFFF; padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); font-family: sans-serif;">
            <strong style="color: #FBBF24;">You are here</strong>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #94A3B8;">Broadcasting location</p>
          </div>
        `);
        markersRef.current.push(marker);
      }

      // Add other nearby user markers
      users.forEach(user => {
        if (!user.location) return;
        
        const isSelected = selectedUser?.id === user.id;
        const marker = L.marker([user.location.lat, user.location.lng], {
          icon: createMatchUserIcon(user, isSelected)
        }).addTo(map);

        marker.bindPopup(`
          <div style="background: #12151E; color: #FFFFFF; padding: 10px; border-radius: 14px; border: 1px solid rgba(220,38,38,0.4); text-align: center; min-width: 130px; font-family: sans-serif;">
            <strong style="font-size: 14px; color: #FFFFFF; display: block;">${user.name || 'User'}</strong>
            <div style="margin: 4px 0; background: rgba(220, 38, 38, 0.2); color: #FF6B6B; font-size: 11px; padding: 2px 8px; border-radius: 9999px; font-weight: 700; display: inline-block;">
              ${user.activity || 'Wanna Go!'}
            </div>
            ${user.distance ? `<p style="font-size: 11px; color: #94A3B8; margin: 4px 0 0 0;">📍 ${user.distance} mi away</p>` : ''}
          </div>
        `, { className: 'dark-leaflet-popup' });

        marker.on('click', () => {
          if (onUserClick) onUserClick(user);
        });

        markersRef.current.push(marker);
      });

      // Meeting point pin — the mutually-agreed (or proposed) spot from the
      // shared `meetups` record, distinct from either person's live position.
      if (meetingPoint && typeof meetingPoint.lat === 'number' && typeof meetingPoint.lng === 'number') {
        const meetIcon = L.divIcon({
          className: 'custom-meeting-pin',
          html: `
            <div style="position: relative; width: 38px; height: 46px;">
              <svg width="38" height="46" viewBox="0 0 38 46" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 0C8.5 0 0 8.5 0 19c0 14 19 27 19 27s19-13 19-27C38 8.5 29.5 0 19 0z" fill="#FBBF24" stroke="#0A0C10" stroke-width="2"/>
                <circle cx="19" cy="18" r="7" fill="#0A0C10"/>
              </svg>
            </div>
          `,
          iconSize: [38, 46],
          iconAnchor: [19, 46]
        });
        const marker = L.marker([meetingPoint.lat, meetingPoint.lng], { icon: meetIcon }).addTo(map);
        marker.bindPopup(`
          <div style="background: #12151E; color: #FFFFFF; padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(251,191,36,0.4); font-family: sans-serif;">
            <strong style="color: #FBBF24;">${meetingPoint.label || 'Meeting point'}</strong>
          </div>
        `);
        markersRef.current.push(marker);
      }

      // Draw route line if needed
      if (showRoute && currentUser?.location && selectedUser?.location) {
        const routeLine = L.polyline([
          [currentUser.location.lat, currentUser.location.lng],
          [selectedUser.location.lat, selectedUser.location.lng]
        ], {
          color: '#DC2626',
          weight: 4,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(map);
        markersRef.current.push(routeLine);
      }
    };

    updateMarkers();
  }, [users, currentUser, selectedUser, showRoute, isLoaded, onUserClick, meetingPoint]);

  // Update map center when it changes
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom, isLoaded]);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height: '100%', width: '100%', minHeight: '300px', background: '#0A0C10' }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-[#0A0C10] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-[#94A3B8] text-sm font-medium">Initializing Radar Map...</p>
          </div>
        </div>
      )}
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-tip {
          background: #12151E !important;
          border: 1px solid rgba(220,38,38,0.4) !important;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}


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
  className = ''
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Leaflet dynamically on client side only
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
        // Initialize map
        const map = L.map(mapRef.current).setView(center, zoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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

  // Update markers when users change
  useEffect(() => {
    const updateMarkers = async () => {
      if (!mapInstanceRef.current || !isLoaded) return;

      const L = (await import('leaflet')).default;
      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Create custom icons
      const createIcon = (color) => new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Add current user marker
      if (currentUser?.location) {
        const marker = L.marker([currentUser.location.lat, currentUser.location.lng], {
          icon: createIcon('green')
        }).addTo(map);
        marker.bindPopup('<strong>You</strong>');
        markersRef.current.push(marker);
      }

      // Add other users
      users.forEach(user => {
        if (!user.location) return;
        
        const isSelected = selectedUser?.id === user.id;
        const marker = L.marker([user.location.lat, user.location.lng], {
          icon: createIcon(isSelected ? 'red' : 'blue')
        }).addTo(map);

        marker.bindPopup(`
          <div style="text-align: center; min-width: 100px;">
            <strong>${user.name || 'User'}</strong>
            <p style="margin: 5px 0; color: #666;">${user.activity || 'Available'}</p>
            ${user.distance ? `<p style="font-size: 12px; color: #999;">${user.distance} km away</p>` : ''}
          </div>
        `);

        marker.on('click', () => {
          if (onUserClick) onUserClick(user);
        });

        markersRef.current.push(marker);
      });

      // Draw route line if needed
      if (showRoute && currentUser?.location && selectedUser?.location) {
        const routeLine = L.polyline([
          [currentUser.location.lat, currentUser.location.lng],
          [selectedUser.location.lat, selectedUser.location.lng]
        ], {
          color: '#1a1aff',
          weight: 4,
          dashArray: '10, 10'
        }).addTo(map);
        markersRef.current.push(routeLine);
      }
    };

    updateMarkers();
  }, [users, currentUser, selectedUser, showRoute, isLoaded, onUserClick]);

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
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);
const useMap = dynamic(
  () => import('react-leaflet').then((mod) => mod.useMap),
  { ssr: false }
);

export default function MapComponent({ 
  center = [40.7128, -74.0060], // Default NYC
  zoom = 13,
  users = [],
  currentUser = null,
  selectedUser = null,
  onUserClick,
  showRoute = false,
  className = ''
}) {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState(null);

  useEffect(() => {
    setIsClient(true);
    // Import Leaflet on client side
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      // Fix default marker icon
      delete leaflet.default.Icon.Default.prototype._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  if (!isClient || !L) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  // Create custom icons
  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const currentUserIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const selectedUserIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Current user marker */}
      {currentUser && currentUser.location && (
        <Marker 
          position={[currentUser.location.lat, currentUser.location.lng]} 
          icon={currentUserIcon}
        >
          <Popup>
            <div className="text-center">
              <strong>You</strong>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Other users */}
      {users.map((user) => (
        <Marker
          key={user.id}
          position={[user.location?.lat || 40.7128, user.location?.lng || -74.0060]}
          icon={selectedUser?.id === user.id ? selectedUserIcon : userIcon}
          eventHandlers={{
            click: () => onUserClick?.(user),
          }}
        >
          <Popup>
            <div className="text-center min-w-[120px]">
              <strong>{user.name}</strong>
              <p className="text-sm text-gray-600">{user.activity || 'Available'}</p>
              {user.distance && <p className="text-xs text-gray-500">{user.distance} km away</p>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Route line between current user and selected user */}
      {showRoute && currentUser?.location && selectedUser?.location && (
        <Polyline
          positions={[
            [currentUser.location.lat, currentUser.location.lng],
            [selectedUser.location.lat, selectedUser.location.lng]
          ]}
          color="#1a1aff"
          weight={4}
          dashArray="10, 10"
        />
      )}
    </MapContainer>
  );
}

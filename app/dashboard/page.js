'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Search, MapPin, Coffee, Film, Music, Dumbbell, Mountain, Bike, 
  BookOpen, Heart, Users, Utensils, X
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser, getAuthToken, fetchWithAuth, signOut } from '@/lib/auth';

// Dynamic import for map to avoid SSR issues
const MapComponent = dynamic(
  () => import('@/components/MapComponent').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#1a1aff] border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }
);

const activities = [
  { id: 'hiking', name: 'Hiking', icon: Mountain, color: 'bg-green-100 text-green-700' },
  { id: 'coffee', name: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  { id: 'cinema', name: 'Cinema', icon: Film, color: 'bg-purple-100 text-purple-700' },
  { id: 'concert', name: 'Concert', icon: Music, color: 'bg-pink-100 text-pink-700' },
  { id: 'gym', name: 'Gym', icon: Dumbbell, color: 'bg-blue-100 text-blue-700' },
  { id: 'cycling', name: 'Cycling', icon: Bike, color: 'bg-cyan-100 text-cyan-700' },
  { id: 'dining', name: 'Dining', icon: Utensils, color: 'bg-red-100 text-red-700' },
  { id: 'reading', name: 'Book Club', icon: BookOpen, color: 'bg-indigo-100 text-indigo-700' },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAuth();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (user && selectedActivity) {
      fetchNearbyUsers(selectedActivity.id);
    }
  }, [user, selectedActivity]);

  const checkAuth = async () => {
    try {
      const storedUser = getUser();
      if (!storedUser) {
        router.push('/auth/signin');
        return;
      }
      setUser(storedUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/signin');
    } finally {
      setLoading(false);
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
        (error) => {
          console.log('Geolocation error:', error);
          // Use default NYC location
        }
      );
    }
  };

  const fetchNearbyUsers = async (activityId) => {
    try {
      const res = await fetchWithAuth(`/api/matches?activity=${activityId}`);
      const data = await res.json();
      if (data.matches) {
        // Add mock locations for demo
        const usersWithLocations = data.matches.map((match, index) => ({
          ...match,
          location: {
            lat: userLocation.lat + (Math.random() - 0.5) * 0.05,
            lng: userLocation.lng + (Math.random() - 0.5) * 0.05
          },
          activity: selectedActivity?.name,
          distance: Math.floor(Math.random() * 10) + 1
        }));
        setNearbyUsers(usersWithLocations);
      }
    } catch (error) {
      console.error('Failed to fetch nearby users:', error);
    }
  };

  const handleActivitySelect = (activity) => {
    setSelectedActivity(activity);
    setShowActivityPicker(false);
    setSelectedUser(null);
    toast.success(`Looking for ${activity.name} partners nearby!`);
  };

  const handleUserClick = (clickedUser) => {
    setSelectedUser(clickedUser);
  };

  const handleConnect = () => {
    if (selectedUser) {
      router.push(`/connect/${selectedUser.id}?activity=${selectedActivity?.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1aff] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header user={user} />
      
      {/* Search Bar */}
      <div className="bg-white px-4 py-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search activities or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Map Section */}
      <div className="relative h-[45vh] bg-gray-200">
        <MapComponent
          center={[userLocation.lat, userLocation.lng]}
          zoom={14}
          users={nearbyUsers}
          currentUser={{ location: userLocation }}
          selectedUser={selectedUser}
          onUserClick={handleUserClick}
          showRoute={!!selectedUser}
          className="h-full w-full"
        />

        {/* Activity indicator on map */}
        {selectedActivity && (
          <div className="absolute top-4 left-4 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <selectedActivity.icon className="w-5 h-5 text-[#1a1aff]" />
            <span className="font-medium">{selectedActivity.name}</span>
            <button onClick={() => setSelectedActivity(null)} className="ml-2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        {/* Current location button */}
        <button 
          onClick={getUserLocation}
          className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg"
        >
          <MapPin className="w-5 h-5 text-[#1a1aff]" />
        </button>
      </div>

      {/* Activity Selection Drawer */}
      {!selectedActivity && (
        <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-4 py-6 shadow-lg">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">CHOOSE ACTIVITY</h2>
          <div className="grid grid-cols-4 gap-3">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <button
                  key={activity.id}
                  onClick={() => handleActivitySelect(activity)}
                  className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-full ${activity.color} flex items-center justify-center mb-2`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{activity.name}</span>
                </button>
              );
            })}
          </div>
          <Button 
            className="w-full mt-4 bg-[#1a1aff] hover:bg-[#1515dd] text-white font-semibold py-6"
            onClick={() => setShowActivityPicker(true)}
          >
            SELECT
          </Button>
        </div>
      )}

      {/* Selected User Panel */}
      {selectedUser && selectedActivity && (
        <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-4 py-6 shadow-lg">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16 border-2 border-[#1a1aff]">
              <AvatarImage src={selectedUser.profilePhoto} />
              <AvatarFallback className="bg-[#4a3aff] text-white text-xl">
                {selectedUser.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">{selectedUser.name}</h3>
              <p className="text-gray-500">{selectedUser.distance} km away</p>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map((star) => (
                  <span key={star} className={`text-sm ${star <= (selectedUser.averageRating || 4) ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
                <span className="text-xs text-gray-500 ml-1">({selectedUser.averageRating || '4.0'})</span>
              </div>
            </div>
            <button onClick={() => setSelectedUser(null)}>
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline"
              className="flex-1 py-6 border-[#1a1aff] text-[#1a1aff]"
              onClick={() => router.push(`/user/${selectedUser.id}`)}
            >
              View Profile
            </Button>
            <Button 
              className="flex-1 py-6 bg-[#1a1aff] hover:bg-[#1515dd] text-white"
              onClick={handleConnect}
            >
              CONNECT
            </Button>
          </div>
        </div>
      )}

      {/* Nearby Users List (when activity selected but no user selected) */}
      {selectedActivity && !selectedUser && nearbyUsers.length > 0 && (
        <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-4 py-6 shadow-lg">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">FIND COMPANION</h2>
          <div className="space-y-3 max-h-[30vh] overflow-y-auto">
            {nearbyUsers.slice(0, 5).map((nearbyUser) => (
              <button
                key={nearbyUser.id}
                onClick={() => handleUserClick(nearbyUser)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={nearbyUser.profilePhoto} />
                  <AvatarFallback className="bg-[#4a3aff] text-white">
                    {nearbyUser.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-800">{nearbyUser.name}</p>
                  <p className="text-sm text-gray-500">{nearbyUser.distance} km away</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm font-medium">{nearbyUser.averageRating || '4.0'}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button 
            className="w-full mt-4 bg-[#1a1aff] hover:bg-[#1515dd] text-white font-semibold py-6"
          >
            CONNECT
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

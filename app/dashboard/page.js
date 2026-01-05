'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Search, MapPin, Coffee, Film, Music, Dumbbell, Mountain, Bike, 
  BookOpen, Heart, Users, Utensils, X, Star, ChevronUp, ChevronDown,
  Camera, Dog, Palette, Trophy, GraduationCap, UserPlus, UsersRound,
  MessageSquare, Send, Clock, Filter, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import { getUser, getAuthToken, fetchWithAuth, signOut } from '@/lib/auth';

// Dynamic import for map
const MapComponent = dynamic(
  () => import('@/components/MapComponent').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#2B2D9E] border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }
);

// Activity definitions with icons and colors
const activities = [
  { id: 'hiking', name: 'Hiking', icon: Mountain, color: 'bg-green-100 text-green-600 border-green-200' },
  { id: 'running', name: 'Running', icon: Zap, color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { id: 'coffee', name: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-600 border-amber-200' },
  { id: 'cinema', name: 'Cinema', icon: Film, color: 'bg-purple-100 text-purple-600 border-purple-200' },
  { id: 'concert', name: 'Concert', icon: Music, color: 'bg-pink-100 text-pink-600 border-pink-200' },
  { id: 'gym', name: 'Gym', icon: Dumbbell, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { id: 'cycling', name: 'Cycling', icon: Bike, color: 'bg-cyan-100 text-cyan-600 border-cyan-200' },
  { id: 'dining', name: 'Dining', icon: Utensils, color: 'bg-red-100 text-red-600 border-red-200' },
  { id: 'bookclub', name: 'Book Club', icon: BookOpen, color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
  { id: 'yoga', name: 'Yoga', icon: Heart, color: 'bg-rose-100 text-rose-600 border-rose-200' },
  { id: 'dogwalking', name: 'Dog Walking', icon: Dog, color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
  { id: 'photography', name: 'Photography', icon: Camera, color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

// Connection types
const connectionTypes = [
  { 
    id: 'buddy', 
    name: 'BUDDY', 
    description: 'Find a 1-on-1 companion',
    icon: UserPlus, 
    color: 'bg-blue-500',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-500'
  },
  { 
    id: 'trainer', 
    name: 'TRAINER', 
    description: 'Connect with an expert',
    icon: GraduationCap, 
    color: 'bg-orange-500',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-500'
  },
  { 
    id: 'competitor', 
    name: 'COMPETITOR', 
    description: 'Challenge someone',
    icon: Trophy, 
    color: 'bg-red-500',
    borderColor: 'border-red-500',
    textColor: 'text-red-500'
  },
  { 
    id: 'group', 
    name: 'GROUP', 
    description: 'Join or create group',
    icon: UsersRound, 
    color: 'bg-green-500',
    borderColor: 'border-green-500',
    textColor: 'text-green-500'
  },
];

// Group options
const groupOptions = [
  { id: 'start', name: 'Start New Group', description: 'Create and invite people' },
  { id: 'join', name: 'Join Existing', description: 'Browse open groups' },
  { id: 'merge', name: 'Merge Groups', description: 'Combine with others' },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [currentStep, setCurrentStep] = useState('activity'); // activity, connection, broadcast, matching, chat
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection State
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedGroupOption, setSelectedGroupOption] = useState(null);
  
  // Broadcast Parameters
  const [broadcastRadius, setBroadcastRadius] = useState([5]);
  const [targetingOption, setTargetingOption] = useState('anyone');
  const [skillLevel, setSkillLevel] = useState('any');
  
  // Map & Users State
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [usersInRadius, setUsersInRadius] = useState(0);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    checkAuth();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNearbyUsers();
    }
  }, [user, selectedActivities, broadcastRadius]);

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
          console.log('Geolocation error, using default:', error);
        }
      );
    }
  };

  const fetchNearbyUsers = async () => {
    try {
      const activityParam = selectedActivities.length > 0 ? `?activity=${selectedActivities[0]}` : '';
      const res = await fetchWithAuth(`/api/matches${activityParam}`);
      const data = await res.json();
      if (data.matches) {
        const usersWithLocations = data.matches.map((match, index) => ({
          ...match,
          location: {
            lat: userLocation.lat + (Math.random() - 0.5) * 0.04,
            lng: userLocation.lng + (Math.random() - 0.5) * 0.04
          },
          activity: selectedActivities[0] || 'available',
          connectionType: ['buddy', 'trainer', 'competitor', 'group'][index % 4],
          distance: (Math.random() * broadcastRadius[0]).toFixed(1)
        }));
        setNearbyUsers(usersWithLocations);
        setUsersInRadius(usersWithLocations.length);
      }
    } catch (error) {
      console.error('Failed to fetch nearby users:', error);
    }
  };

  const toggleActivity = (activityId) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(a => a !== activityId);
      }
      return [...prev, activityId];
    });
  };

  const handleConnectionSelect = (connectionId) => {
    setSelectedConnection(connectionId);
    if (connectionId !== 'group') {
      setSelectedGroupOption(null);
    }
  };

  const handleBroadcast = async () => {
    if (selectedActivities.length === 0) {
      toast.error('Please select at least one activity');
      return;
    }
    if (!selectedConnection) {
      toast.error('Please select a connection type');
      return;
    }

    setIsBroadcasting(true);
    toast.loading('Broadcasting your activity...');

    // Simulate broadcast
    setTimeout(() => {
      toast.dismiss();
      toast.success(`Broadcasting ${selectedActivities.join(', ')} to ${usersInRadius} users nearby!`);
      setIsBroadcasting(false);
      setCurrentStep('matching');
    }, 1500);
  };

  const handleUserClick = (clickedUser) => {
    setSelectedUser(clickedUser);
    setCurrentStep('chat');
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    setChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'me',
      text: newMessage,
      time: new Date()
    }]);
    setNewMessage('');

    // Simulate reply
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'them',
        text: ['Sounds great!', 'What time works?', 'Where should we meet?', 'I\'m flexible!'][Math.floor(Math.random() * 4)],
        time: new Date()
      }]);
    }, 1500);
  };

  const handleConfirmMeeting = () => {
    toast.success('Meeting confirmed! Starting location tracking...');
    router.push(`/connect/${selectedUser.id}?activity=${selectedActivities[0]}`);
  };

  const quickMessages = ['Sounds good!', 'What time?', 'Where should we meet?', 'What\'s your pace?', 'I\'m flexible'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2B2D9E] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Map Section - Takes remaining space */}
      <div className="flex-1 relative">
        <MapComponent
          center={[userLocation.lat, userLocation.lng]}
          zoom={13}
          users={nearbyUsers}
          currentUser={{ location: userLocation }}
          selectedUser={selectedUser}
          onUserClick={handleUserClick}
          showRoute={currentStep === 'chat'}
          className="h-full w-full"
        />

        {/* Radius Indicator Overlay */}
        {currentStep === 'broadcast' && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-2xl px-4 py-2 shadow-lg">
            <p className="text-sm font-medium text-gray-700">
              <span className="text-[#2B2D9E] font-bold">{usersInRadius}</span> users within {broadcastRadius[0]} mi
            </p>
          </div>
        )}

        {/* Activity Badge */}
        {selectedActivities.length > 0 && currentStep !== 'chat' && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2">
            {selectedActivities.slice(0, 2).map(actId => {
              const activity = activities.find(a => a.id === actId);
              const Icon = activity?.icon || Mountain;
              return (
                <div key={actId} className="flex items-center gap-1">
                  <Icon className="w-4 h-4 text-[#2B2D9E]" />
                  <span className="text-sm font-medium">{activity?.name}</span>
                </div>
              );
            })}
            {selectedActivities.length > 2 && (
              <span className="text-sm text-gray-500">+{selectedActivities.length - 2}</span>
            )}
            <button onClick={() => setSelectedActivities([])} className="ml-1">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        )}

        {/* Center on User Button */}
        <button 
          onClick={getUserLocation}
          className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
        >
          <MapPin className="w-5 h-5 text-[#2B2D9E]" />
        </button>
      </div>

      {/* Bottom Panel - Sliding Sheet */}
      <div 
        className={`bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out ${
          panelExpanded ? 'max-h-[60vh]' : 'max-h-20'
        } overflow-hidden`}
      >
        {/* Panel Handle */}
        <button 
          onClick={() => setPanelExpanded(!panelExpanded)}
          className="w-full py-3 flex justify-center"
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </button>

        {/* Panel Content */}
        <div className="px-4 pb-4 overflow-y-auto max-h-[calc(60vh-60px)]">
          
          {/* STEP 1: Activity Selection */}
          {currentStep === 'activity' && (
            <div className="animate-fadeIn">
              <h2 className="text-lg font-bold text-gray-800 mb-4">CHOOSE ACTIVITY</h2>
              
              {/* Activity Pills - Horizontal Scroll */}
              <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                {activities.map((activity) => {
                  const Icon = activity.icon;
                  const isSelected = selectedActivities.includes(activity.id);
                  return (
                    <button
                      key={activity.id}
                      onClick={() => toggleActivity(activity.id)}
                      className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 min-w-[80px] ${
                        isSelected
                          ? 'bg-[#2B2D9E] border-[#2B2D9E] text-white scale-105 shadow-lg'
                          : `${activity.color} border-transparent hover:scale-102`
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        isSelected ? 'bg-white/20' : 'bg-white'
                      }`}>
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : ''}`} />
                      </div>
                      <span className="text-xs font-semibold whitespace-nowrap">{activity.name}</span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-[#2B2D9E] rounded-full" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <Button 
                onClick={() => selectedActivities.length > 0 && setCurrentStep('connection')}
                disabled={selectedActivities.length === 0}
                className="w-full py-6 bg-[#2B2D9E] hover:bg-[#1f2175] text-white text-lg font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                SELECT
              </Button>
            </div>
          )}

          {/* STEP 2: Connection Type */}
          {currentStep === 'connection' && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">CONNECTION TYPE</h2>
                <button onClick={() => setCurrentStep('activity')} className="text-[#2B2D9E] text-sm font-medium">
                  ← Back
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {connectionTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedConnection === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleConnectionSelect(type.id)}
                      className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? `${type.borderColor} bg-opacity-10 ${type.color.replace('bg-', 'bg-opacity-10 bg-')}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${type.color} flex items-center justify-center mb-2`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className={`font-bold text-sm ${isSelected ? type.textColor : 'text-gray-800'}`}>
                        {type.name}
                      </p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Group Options */}
              {selectedConnection === 'group' && (
                <div className="mb-4 p-4 bg-green-50 rounded-2xl">
                  <p className="text-sm font-semibold text-green-800 mb-3">Group Options</p>
                  <div className="space-y-2">
                    {groupOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedGroupOption(option.id)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          selectedGroupOption === option.id
                            ? 'border-green-500 bg-green-100'
                            : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                      >
                        <p className="font-medium text-sm">{option.name}</p>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => selectedConnection && setCurrentStep('broadcast')}
                disabled={!selectedConnection || (selectedConnection === 'group' && !selectedGroupOption)}
                className="w-full py-6 bg-[#2B2D9E] hover:bg-[#1f2175] text-white text-lg font-bold rounded-2xl disabled:opacity-50 transition-all"
              >
                CONTINUE
              </Button>
            </div>
          )}

          {/* STEP 3: Broadcast Parameters */}
          {currentStep === 'broadcast' && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">BROADCAST</h2>
                <button onClick={() => setCurrentStep('connection')} className="text-[#2B2D9E] text-sm font-medium">
                  ← Back
                </button>
              </div>

              {/* Radius Slider */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Search Radius</span>
                  <span className="text-sm font-bold text-[#2B2D9E]">{broadcastRadius[0]} miles</span>
                </div>
                <Slider
                  value={broadcastRadius}
                  onValueChange={setBroadcastRadius}
                  min={0.5}
                  max={25}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.5 mi</span>
                  <span>25 mi</span>
                </div>
              </div>

              {/* Targeting Options */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Who to Broadcast To</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'anyone', label: 'Anyone Available' },
                    { id: 'connections', label: 'Previous Connections' },
                    { id: 'favorites', label: 'Favorites Only' },
                    { id: 'specific', label: 'Specific Person' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTargetingOption(option.id)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all ${
                        targetingOption === option.id
                          ? 'bg-[#2B2D9E] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm text-[#2B2D9E] font-medium mb-4"
              >
                <Filter className="w-4 h-4" />
                Advanced Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showFilters && (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Skill Level</p>
                    <div className="flex gap-2">
                      {['any', 'beginner', 'intermediate', 'advanced'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setSkillLevel(level)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                            skillLevel === level
                              ? 'bg-[#2B2D9E] text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleBroadcast}
                disabled={isBroadcasting}
                className="w-full py-6 bg-[#2B2D9E] hover:bg-[#1f2175] text-white text-lg font-bold rounded-2xl disabled:opacity-50 transition-all animate-pulse-subtle"
              >
                {isBroadcasting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Broadcasting...
                  </span>
                ) : (
                  'BROADCAST ACTIVITY'
                )}
              </Button>
            </div>
          )}

          {/* STEP 4: Matching / User List */}
          {currentStep === 'matching' && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">FIND COMPANION</h2>
                <button onClick={() => setCurrentStep('broadcast')} className="text-[#2B2D9E] text-sm font-medium">
                  ← Back
                </button>
              </div>

              <div className="space-y-3 max-h-[35vh] overflow-y-auto">
                {nearbyUsers.map((nearbyUser) => (
                  <button
                    key={nearbyUser.id}
                    onClick={() => handleUserClick(nearbyUser)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all"
                  >
                    <Avatar className="w-14 h-14 border-2 border-white shadow">
                      <AvatarImage src={nearbyUser.profilePhoto} />
                      <AvatarFallback className="bg-[#2B2D9E] text-white text-lg">
                        {nearbyUser.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-800">{nearbyUser.name}, {nearbyUser.age || 28}</p>
                      <p className="text-sm text-gray-500">{nearbyUser.distance} mi away</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">{nearbyUser.averageRating || '4.5'}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        nearbyUser.connectionType === 'buddy' ? 'bg-blue-100 text-blue-600' :
                        nearbyUser.connectionType === 'trainer' ? 'bg-orange-100 text-orange-600' :
                        nearbyUser.connectionType === 'competitor' ? 'bg-red-100 text-red-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {nearbyUser.connectionType}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <Button 
                className="w-full py-6 mt-4 bg-[#2B2D9E] hover:bg-[#1f2175] text-white text-lg font-bold rounded-2xl"
              >
                CONNECT
              </Button>
            </div>
          )}

          {/* STEP 5: Pre-Match Chat */}
          {currentStep === 'chat' && selectedUser && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedUser.profilePhoto} />
                    <AvatarFallback className="bg-[#2B2D9E] text-white">
                      {selectedUser.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedUser.name}</p>
                    <p className="text-xs text-gray-500">{selectedUser.distance} mi away</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedUser(null); setCurrentStep('matching'); }} className="text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="h-32 overflow-y-auto mb-3 space-y-2">
                {chatMessages.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">Start the conversation!</p>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      msg.sender === 'me' 
                        ? 'bg-[#2B2D9E] text-white rounded-br-sm' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Replies */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                {quickMessages.map((msg) => (
                  <button
                    key={msg}
                    onClick={() => setNewMessage(msg)}
                    className="flex-shrink-0 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-200"
                  >
                    {msg}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2 mb-4">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  onClick={handleSendMessage}
                  size="icon"
                  className="rounded-full bg-[#2B2D9E] hover:bg-[#1f2175]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <Button 
                onClick={handleConfirmMeeting}
                className="w-full py-6 bg-green-600 hover:bg-green-700 text-white text-lg font-bold rounded-2xl"
              >
                CONFIRM & START TRACKING
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 0 0 rgba(43, 45, 158, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(43, 45, 158, 0); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite;
        }
      `}</style>
    </div>
  );
}

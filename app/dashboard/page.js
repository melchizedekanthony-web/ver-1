'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, MapPin, Coffee, Film, Music, Dumbbell, Mountain, Bike, 
  BookOpen, Heart, Users, Utensils, X, Star, ChevronUp, ChevronDown,
  Camera, Dog, Palette, Trophy, GraduationCap, UserPlus, UsersRound,
  MessageSquare, Send, Clock, Filter, Zap, ArrowLeft, Check, Accessibility,
  Home, RotateCcw, Car, Gamepad2, Wrench, Mic, Brush, RefreshCw, UserCheck,
  Lightbulb, Award, BookMarked
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

// Categories
const activityCategories = [
  { id: 'athletic', name: 'Athletic', description: 'Physical & fitness activities', icon: Dumbbell },
  { id: 'non-athletic', name: 'Non-Athletic', description: 'Social & creative activities', icon: Palette },
];

// Athletic activities
const athleticActivities = [
  { id: 'hiking', name: 'Hiking', icon: Mountain, color: 'bg-green-100 text-green-600' },
  { id: 'running', name: 'Running', icon: Zap, color: 'bg-orange-100 text-orange-600' },
  { id: 'gym', name: 'Gym', icon: Dumbbell, color: 'bg-blue-100 text-blue-600' },
  { id: 'cycling', name: 'Cycling', icon: Bike, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'yoga', name: 'Yoga', icon: Heart, color: 'bg-rose-100 text-rose-600' },
  { id: 'swimming', name: 'Swimming', icon: Zap, color: 'bg-sky-100 text-sky-600' },
  { id: 'basketball', name: 'Basketball', icon: Zap, color: 'bg-amber-100 text-amber-600' },
  { id: 'tennis', name: 'Tennis', icon: Zap, color: 'bg-lime-100 text-lime-600' },
];

// Non-athletic activities
const nonAthleticActivities = [
  { id: 'coffee', name: 'Coffee', icon: Coffee, color: 'bg-amber-100 text-amber-600' },
  { id: 'cinema', name: 'Cinema', icon: Film, color: 'bg-purple-100 text-purple-600' },
  { id: 'concert', name: 'Concert', icon: Music, color: 'bg-pink-100 text-pink-600' },
  { id: 'dining', name: 'Dining', icon: Utensils, color: 'bg-red-100 text-red-600' },
  { id: 'bookclub', name: 'Book Club', icon: BookOpen, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'photography', name: 'Photography', icon: Camera, color: 'bg-slate-100 text-slate-600' },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: 'bg-violet-100 text-violet-600' },
  { id: 'music', name: 'Music/Jam', icon: Mic, color: 'bg-fuchsia-100 text-fuchsia-600' },
  { id: 'cars', name: 'Cars/Mechanics', icon: Wrench, color: 'bg-gray-100 text-gray-600' },
  { id: 'art', name: 'Art/Creative', icon: Brush, color: 'bg-teal-100 text-teal-600' },
  { id: 'dogwalking', name: 'Dog Walking', icon: Dog, color: 'bg-yellow-100 text-yellow-600' },
];

// Connection types for ATHLETIC activities
const athleticConnectionTypes = [
  { 
    id: 'buddy', 
    name: 'Buddy', 
    displayName: 'BUDDY',
    description: 'Find a 1-on-1 companion',
    icon: UserPlus, 
    color: 'bg-blue-500',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-500',
    lightBg: 'bg-blue-50'
  },
  { 
    id: 'trainer', 
    name: 'Trainer', 
    displayName: 'TRAINER',
    description: 'Connect with an expert',
    icon: GraduationCap, 
    color: 'bg-orange-500',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-500',
    lightBg: 'bg-orange-50'
  },
  { 
    id: 'competitor', 
    name: 'Competitor', 
    displayName: 'COMPETITOR',
    description: 'Challenge someone',
    icon: Trophy, 
    color: 'bg-red-500',
    borderColor: 'border-red-500',
    textColor: 'text-red-500',
    lightBg: 'bg-red-50'
  },
  { 
    id: 'group', 
    name: 'Group', 
    displayName: 'GROUP',
    description: 'Join or create group',
    icon: UsersRound, 
    color: 'bg-green-500',
    borderColor: 'border-green-500',
    textColor: 'text-green-500',
    lightBg: 'bg-green-50'
  },
  { 
    id: 'accessible', 
    name: 'Accessible', 
    displayName: 'ACCESSIBLE',
    description: 'Inclusive activities for all',
    icon: Accessibility, 
    color: 'bg-purple-500',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-500',
    lightBg: 'bg-purple-50'
  },
];

// Connection types for NON-ATHLETIC activities
const nonAthleticConnectionTypes = [
  { 
    id: 'buddy', 
    name: 'Buddy', 
    displayName: 'BUDDY',
    description: 'Find a 1-on-1 companion',
    icon: UserPlus, 
    color: 'bg-blue-500',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-500',
    lightBg: 'bg-blue-50'
  },
  { 
    id: 'mentor', 
    name: 'Mentor', 
    displayName: 'MENTOR',
    description: 'Get guidance & advice',
    icon: Lightbulb, 
    color: 'bg-yellow-500',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-500',
    lightBg: 'bg-yellow-50'
  },
  { 
    id: 'instructor', 
    name: 'Instructor', 
    displayName: 'INSTRUCTOR',
    description: 'Learn from a teacher',
    icon: BookMarked, 
    color: 'bg-orange-500',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-500',
    lightBg: 'bg-orange-50'
  },
  { 
    id: 'expert', 
    name: 'Expert', 
    displayName: 'EXPERT',
    description: 'Connect with a specialist',
    icon: Award, 
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-500',
    lightBg: 'bg-emerald-50'
  },
  { 
    id: 'group', 
    name: 'Group', 
    displayName: 'GROUP',
    description: 'Join or create group',
    icon: UsersRound, 
    color: 'bg-green-500',
    borderColor: 'border-green-500',
    textColor: 'text-green-500',
    lightBg: 'bg-green-50'
  },
  { 
    id: 'accessible', 
    name: 'Accessible', 
    displayName: 'ACCESSIBLE',
    description: 'Inclusive activities for all',
    icon: Accessibility, 
    color: 'bg-purple-500',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-500',
    lightBg: 'bg-purple-50'
  },
];

// Group options
const groupOptions = [
  { id: 'start', name: 'Start New Group', description: 'Create and invite people' },
  { id: 'join', name: 'Join Existing', description: 'Browse open groups' },
  { id: 'merge', name: 'Merge Groups', description: 'Combine with others' },
];

// Accessible options
const accessibleOptions = [
  { id: 'wheelchair', name: 'Wheelchair Accessible', description: 'Activities suitable for wheelchair users' },
  { id: 'visual', name: 'Visual Impairment', description: 'Connect with visually impaired users' },
  { id: 'hearing', name: 'Hearing Impairment', description: 'Connect with deaf/hard of hearing users' },
  { id: 'mobility', name: 'Limited Mobility', description: 'Adaptive activities for mobility needs' },
  { id: 'any', name: 'All Inclusive', description: 'Open to connecting with anyone' },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [currentStep, setCurrentStep] = useState('category'); // category, activity, connection, broadcast, matching, chat
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [showGoAgainModal, setShowGoAgainModal] = useState(false);
  const [selectedRecentActivity, setSelectedRecentActivity] = useState(null);
  
  // Recent Activity State
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Selection State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedGroupOption, setSelectedGroupOption] = useState(null);
  const [selectedAccessibleOption, setSelectedAccessibleOption] = useState(null);
  
  // Broadcast Parameters
  const [broadcastRadius, setBroadcastRadius] = useState([5]);
  const [targetingOption, setTargetingOption] = useState('anyone');
  
  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState({
    skillLevel: 'any',
    intensity: 'moderate',
    hasInjury: false,
    injuryNotes: '',
    ageRange: [18, 60],
    genderPreference: 'any',
    comments: '',
    // Trainer specific
    trainerCertified: false,
    trainerSpecialty: '',
    trainerExperience: 'any',
    // Competitor specific
    competitorLevel: 'any',
    competitorStyle: 'friendly',
    wagerAllowed: false
  });
  
  // Map & Users State
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 40.7128, lng: -74.0060 });
  const [usersInRadius, setUsersInRadius] = useState(0);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Get the appropriate connection types based on category
  const getConnectionTypes = () => {
    if (selectedCategory?.id === 'athletic') {
      return athleticConnectionTypes;
    } else if (selectedCategory?.id === 'non-athletic') {
      return nonAthleticConnectionTypes;
    }
    return athleticConnectionTypes; // default
  };

  useEffect(() => {
    checkAuth();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNearbyUsers();
      fetchRecentActivities();
    }
  }, [user, selectedActivity, broadcastRadius]);

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

  const fetchRecentActivities = async () => {
    try {
      const res = await fetchWithAuth('/api/sessions');
      const data = await res.json();
      if (data.sessions && data.sessions.length > 0) {
        setRecentActivities(data.sessions.slice(0, 5).map(session => ({
          id: session.id,
          activity: session.activity || session.title,
          partner: session.participants?.[0]?.name || 'Solo',
          partnerId: session.participants?.[0]?.id || null,
          date: new Date(session.scheduledAt || session.createdAt),
          location: session.location || 'Unknown location',
          rating: session.rating || 4.5,
          connectionType: session.mode || 'buddy',
          category: session.category || 'athletic'
        })));
      } else {
        // Mock data for demo
        setRecentActivities([
          { id: '1', activity: 'Running', partner: 'Sarah M.', partnerId: 'user-1', date: new Date(Date.now() - 86400000), location: 'Central Park', rating: 5, connectionType: 'buddy', category: 'athletic' },
          { id: '2', activity: 'Coffee', partner: 'Mike T.', partnerId: 'user-2', date: new Date(Date.now() - 172800000), location: 'Starbucks Downtown', rating: 4.5, connectionType: 'buddy', category: 'non-athletic' },
          { id: '3', activity: 'Yoga', partner: 'Luna K.', partnerId: 'user-3', date: new Date(Date.now() - 259200000), location: 'Zen Studio', rating: 5, connectionType: 'group', category: 'athletic' },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      // Mock data fallback
      setRecentActivities([
        { id: '1', activity: 'Running', partner: 'Sarah M.', partnerId: 'user-1', date: new Date(Date.now() - 86400000), location: 'Central Park', rating: 5, connectionType: 'buddy', category: 'athletic' },
        { id: '2', activity: 'Coffee', partner: 'Mike T.', partnerId: 'user-2', date: new Date(Date.now() - 172800000), location: 'Starbucks Downtown', rating: 4.5, connectionType: 'buddy', category: 'non-athletic' },
      ]);
    }
  };

  const handleGoAgain = (recentActivity, option) => {
    // option: 'broadcast_all', 'same_user', 'friends_list'
    const category = recentActivity.category === 'athletic' ? activityCategories[0] : activityCategories[1];
    const activities = recentActivity.category === 'athletic' ? athleticActivities : nonAthleticActivities;
    const activity = activities.find(a => a.name.toLowerCase() === recentActivity.activity.toLowerCase()) || activities[0];
    
    setSelectedCategory(category);
    setSelectedActivity(activity);
    
    if (option === 'broadcast_all') {
      setCurrentStep('connection');
      toast.success(`Let's find a new ${recentActivity.activity} partner!`);
    } else if (option === 'same_user') {
      // Navigate directly to connect with the same user
      router.push(`/connect/${recentActivity.partnerId}?activity=${recentActivity.activity}`);
    } else if (option === 'friends_list') {
      // Go to connections page to pick from friends
      router.push('/connections');
    }
    
    setShowGoAgainModal(false);
    setSelectedRecentActivity(null);
  };

  const fetchNearbyUsers = async () => {
    try {
      const res = await fetchWithAuth('/api/matches');
      const data = await res.json();
      if (data.matches) {
        const usersWithLocations = data.matches.map((match, index) => ({
          ...match,
          location: {
            lat: userLocation.lat + (Math.random() - 0.5) * 0.04,
            lng: userLocation.lng + (Math.random() - 0.5) * 0.04
          },
          activity: selectedActivity?.name || 'available',
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

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentStep('activity');
  };

  const handleActivitySelect = (activity) => {
    setSelectedActivity(activity);
    setShowActivityDropdown(false);
    setCurrentStep('connection');
  };

  const handleConnectionSelect = (connectionId) => {
    setSelectedConnection(connectionId);
    if (connectionId !== 'group') {
      setSelectedGroupOption(null);
    }
    if (connectionId !== 'accessible') {
      setSelectedAccessibleOption(null);
    }
  };

  const getSelectedConnectionType = () => {
    const types = getConnectionTypes();
    return types.find(c => c.id === selectedConnection);
  };

  const getBroadcastButtonText = () => {
    if (!selectedActivity || !selectedConnection) {
      return 'Find A Partner';
    }
    const connectionType = getSelectedConnectionType();
    return `Find A ${selectedActivity.name} ${connectionType?.name || 'Partner'}`;
  };

  const handleBroadcast = async () => {
    if (!selectedActivity) {
      toast.error('Please select an activity');
      return;
    }
    if (!selectedConnection) {
      toast.error('Please select a connection type');
      return;
    }

    setIsBroadcasting(true);

    await new Promise(resolve => setTimeout(resolve, 2500));

    setIsBroadcasting(false);
    toast.success(`Found ${usersInRadius} potential ${selectedActivity.name.toLowerCase()} partners!`);
    setCurrentStep('matching');
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
    router.push(`/connect/${selectedUser.id}?activity=${selectedActivity?.id}`);
  };

  const resetFlow = () => {
    setCurrentStep('category');
    setSelectedCategory(null);
    setSelectedActivity(null);
    setSelectedConnection(null);
    setSelectedGroupOption(null);
    setSelectedAccessibleOption(null);
    setSelectedUser(null);
    setChatMessages([]);
    setShowFilters(false);
    setAdvancedFilters({
      skillLevel: 'any',
      intensity: 'moderate',
      hasInjury: false,
      injuryNotes: '',
      ageRange: [18, 60],
      genderPreference: 'any',
      comments: '',
      trainerCertified: false,
      trainerSpecialty: '',
      trainerExperience: 'any',
      competitorLevel: 'any',
      competitorStyle: 'friendly',
      wagerAllowed: false
    });
    toast.info('Starting over');
  };

  const goBack = () => {
    switch (currentStep) {
      case 'activity':
        setCurrentStep('category');
        setSelectedCategory(null);
        break;
      case 'connection':
        setCurrentStep('activity');
        setSelectedActivity(null);
        break;
      case 'broadcast':
        setCurrentStep('connection');
        setSelectedConnection(null);
        break;
      case 'matching':
        setCurrentStep('broadcast');
        break;
      case 'chat':
        setSelectedUser(null);
        setCurrentStep('matching');
        break;
      default:
        break;
    }
  };

  const getActivitiesForCategory = () => {
    if (selectedCategory?.id === 'athletic') return athleticActivities;
    if (selectedCategory?.id === 'non-athletic') return nonAthleticActivities;
    return [];
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
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden pb-16">
      {/* Map Section - 40% of screen */}
      <div className="h-[35vh] min-h-[200px] relative flex-shrink-0">
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

        {/* Broadcasting Overlay */}
        {isBroadcasting && (
          <div className="absolute inset-0 bg-[#2B2D9E]/80 flex items-center justify-center z-20">
            <div className="text-center text-white">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"></div>
                <div className="absolute inset-2 rounded-full border-4 border-white/50 animate-ping animation-delay-200"></div>
                <div className="absolute inset-4 rounded-full border-4 border-white/70 animate-ping animation-delay-400"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-xl font-bold mb-2">Spreading The Word...</p>
              <p className="text-white/70 text-sm">Looking for {selectedActivity?.name} {getSelectedConnectionType()?.name}s</p>
            </div>
          </div>
        )}

        {/* Top Controls */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Status Badge */}
          {currentStep !== 'category' && (
            <div className="bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow-lg">
              <p className="text-xs font-medium text-gray-600">
                {selectedCategory?.name} {selectedActivity && `› ${selectedActivity.name}`}
              </p>
            </div>
          )}
          
          {/* Reset Button */}
          {currentStep !== 'category' && (
            <button 
              onClick={resetFlow}
              className="bg-white/95 backdrop-blur rounded-full p-2 shadow-lg hover:bg-white transition-colors"
            >
              <RotateCcw className="w-5 h-5 text-[#2B2D9E]" />
            </button>
          )}
        </div>

        {/* Center on User Button */}
        <button 
          onClick={getUserLocation}
          className="absolute bottom-3 right-3 bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-shadow z-10"
        >
          <MapPin className="w-5 h-5 text-[#2B2D9E]" />
        </button>
      </div>

      {/* Bottom Panel - Activities section */}
      <div className="flex-1 bg-white rounded-t-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col">
        {/* Panel Handle */}
        <div className="py-3 flex justify-center flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Panel Content */}
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          
          {/* STEP 0: Category Selection */}
          {currentStep === 'category' && (
            <div className="animate-fadeIn h-full flex flex-col justify-center items-center">
              <h2 className="text-lg font-bold text-gray-800 mb-6 text-center">Choose Your Activity</h2>
              
              <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                {activityCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl hover:bg-blue-50 hover:border-[#2B2D9E] border-2 border-transparent transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="w-16 h-16 rounded-full bg-[#2B2D9E] flex items-center justify-center mb-3">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <p className="font-bold text-gray-800 text-center">{category.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1: Activity Selection */}
          {currentStep === 'activity' && (
            <div className="animate-fadeIn">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-[#2B2D9E] font-medium mb-3 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <h2 className="text-lg font-bold text-gray-800 mb-3">
                CHOOSE {selectedCategory?.name?.toUpperCase()} ACTIVITY
              </h2>
              
              {/* Simple Text Dropdown */}
              <div className="relative mb-4">
                <button
                  onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                  className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-gray-200 hover:border-[#2B2D9E] transition-colors"
                >
                  <span className={selectedActivity ? 'text-[#2B2D9E] font-semibold' : 'text-gray-500'}>
                    {selectedActivity ? selectedActivity.name : 'Select an activity...'}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showActivityDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showActivityDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-48 overflow-y-auto">
                    {getActivitiesForCategory().map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => handleActivitySelect(activity)}
                        className={`w-full text-left px-4 py-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                          selectedActivity?.id === activity.id
                            ? 'bg-[#2B2D9E] text-white font-semibold'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-[#2B2D9E]'
                        }`}
                      >
                        {activity.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Connection Type */}
          {currentStep === 'connection' && (
            <div className="animate-fadeIn">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-[#2B2D9E] font-medium mb-3 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <h2 className="text-lg font-bold text-gray-800 mb-3">CONNECTION TYPE</h2>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {getConnectionTypes().map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedConnection === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleConnectionSelect(type.id)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? `${type.borderColor} ${type.lightBg}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${type.color} flex items-center justify-center mb-1`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className={`font-bold text-xs ${isSelected ? type.textColor : 'text-gray-800'}`}>
                        {type.displayName}
                      </p>
                      <p className="text-[10px] text-gray-500 leading-tight">{type.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Group Options */}
              {selectedConnection === 'group' && (
                <div className="mb-3 p-3 bg-green-50 rounded-xl">
                  <p className="text-xs font-semibold text-green-800 mb-2">Group Options</p>
                  <div className="space-y-1">
                    {groupOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedGroupOption(option.id)}
                        className={`w-full p-2 rounded-lg border text-left transition-all text-sm ${
                          selectedGroupOption === option.id
                            ? 'border-green-500 bg-green-100'
                            : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                      >
                        <p className="font-medium text-xs">{option.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Accessible Options */}
              {selectedConnection === 'accessible' && (
                <div className="mb-3 p-3 bg-purple-50 rounded-xl">
                  <p className="text-xs font-semibold text-purple-800 mb-2">Accessibility Preferences</p>
                  <div className="space-y-1">
                    {accessibleOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedAccessibleOption(option.id)}
                        className={`w-full p-2 rounded-lg border text-left transition-all text-sm ${
                          selectedAccessibleOption === option.id
                            ? 'border-purple-500 bg-purple-100'
                            : 'border-gray-200 bg-white hover:border-purple-300'
                        }`}
                      >
                        <p className="font-medium text-xs">{option.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => selectedConnection && setCurrentStep('broadcast')}
                disabled={!selectedConnection || (selectedConnection === 'group' && !selectedGroupOption) || (selectedConnection === 'accessible' && !selectedAccessibleOption)}
                className="w-full py-5 bg-[#2B2D9E] hover:bg-[#1f2175] text-white font-bold rounded-xl disabled:opacity-50 transition-all"
              >
                CONTINUE
              </Button>
            </div>
          )}

          {/* STEP 3: Broadcast Parameters */}
          {currentStep === 'broadcast' && (
            <div className="animate-fadeIn">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-[#2B2D9E] font-medium mb-3 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <h2 className="text-lg font-bold text-gray-800 mb-3">BROADCAST</h2>

              {/* Radius Slider */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Search Radius</span>
                  <span className="text-sm font-bold text-[#2B2D9E]">{broadcastRadius[0]} mi</span>
                </div>
                <Slider
                  value={broadcastRadius}
                  onValueChange={setBroadcastRadius}
                  min={0.5}
                  max={25}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Targeting Options */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Broadcast To</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'anyone', label: 'Anyone' },
                    { id: 'connections', label: 'Connections' },
                    { id: 'favorites', label: 'Favorites' },
                    { id: 'specific', label: 'Specific' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setTargetingOption(option.id)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${
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
                className="flex items-center gap-2 text-sm text-[#2B2D9E] font-medium mb-3"
              >
                <Filter className="w-4 h-4" />
                Advanced Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showFilters && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-4 text-sm">
                  {/* Intensity */}
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Intensity Level</p>
                    <div className="flex gap-2">
                      {['light', 'moderate', 'intense', 'extreme'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setAdvancedFilters(f => ({ ...f, intensity: level }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                            advancedFilters.intensity === level
                              ? 'bg-[#2B2D9E] text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skill Level */}
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Skill Level</p>
                    <div className="flex gap-2 flex-wrap">
                      {['any', 'beginner', 'intermediate', 'advanced', 'pro'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setAdvancedFilters(f => ({ ...f, skillLevel: level }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                            advancedFilters.skillLevel === level
                              ? 'bg-[#2B2D9E] text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Injury Considerations */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-700">Injury/Limitation?</p>
                      <Switch 
                        checked={advancedFilters.hasInjury}
                        onCheckedChange={(checked) => setAdvancedFilters(f => ({ ...f, hasInjury: checked }))}
                      />
                    </div>
                    {advancedFilters.hasInjury && (
                      <Input 
                        placeholder="Describe injury/limitation..."
                        value={advancedFilters.injuryNotes}
                        onChange={(e) => setAdvancedFilters(f => ({ ...f, injuryNotes: e.target.value }))}
                        className="text-sm"
                      />
                    )}
                  </div>

                  {/* Comments/Preferences */}
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Comments & Preferences</p>
                    <Textarea 
                      placeholder="Any specific preferences or notes..."
                      value={advancedFilters.comments}
                      onChange={(e) => setAdvancedFilters(f => ({ ...f, comments: e.target.value }))}
                      rows={2}
                      className="text-sm"
                    />
                  </div>

                  {/* Trainer Specific Options */}
                  {selectedConnection === 'trainer' && (
                    <div className="p-3 bg-orange-50 rounded-lg space-y-3">
                      <p className="font-semibold text-orange-800 text-xs">Trainer Preferences</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 text-xs">Certified Only</span>
                        <Switch 
                          checked={advancedFilters.trainerCertified}
                          onCheckedChange={(checked) => setAdvancedFilters(f => ({ ...f, trainerCertified: checked }))}
                        />
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-700 mb-1">Specialty</p>
                        <select 
                          className="w-full p-2 border rounded-lg text-xs"
                          value={advancedFilters.trainerSpecialty}
                          onChange={(e) => setAdvancedFilters(f => ({ ...f, trainerSpecialty: e.target.value }))}
                        >
                          <option value="">Any Specialty</option>
                          <option value="strength">Strength Training</option>
                          <option value="cardio">Cardio</option>
                          <option value="flexibility">Flexibility/Yoga</option>
                          <option value="sports">Sports Specific</option>
                          <option value="rehab">Rehabilitation</option>
                        </select>
                      </div>

                      <div>
                        <p className="text-xs text-gray-700 mb-1">Experience Level</p>
                        <div className="flex gap-1">
                          {['any', '1-3 yrs', '3-5 yrs', '5+ yrs'].map((exp) => (
                            <button
                              key={exp}
                              onClick={() => setAdvancedFilters(f => ({ ...f, trainerExperience: exp }))}
                              className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                                advancedFilters.trainerExperience === exp
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white text-gray-600'
                              }`}
                            >
                              {exp}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Competitor Specific Options */}
                  {selectedConnection === 'competitor' && (
                    <div className="p-3 bg-red-50 rounded-lg space-y-3">
                      <p className="font-semibold text-red-800 text-xs">Competitor Preferences</p>
                      
                      <div>
                        <p className="text-xs text-gray-700 mb-1">Competition Level</p>
                        <div className="flex gap-1">
                          {['any', 'casual', 'serious', 'pro'].map((level) => (
                            <button
                              key={level}
                              onClick={() => setAdvancedFilters(f => ({ ...f, competitorLevel: level }))}
                              className={`px-2 py-1 rounded text-[10px] font-medium capitalize transition-all ${
                                advancedFilters.competitorLevel === level
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white text-gray-600'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-700 mb-1">Competition Style</p>
                        <div className="flex gap-1">
                          {['friendly', 'competitive', 'intense'].map((style) => (
                            <button
                              key={style}
                              onClick={() => setAdvancedFilters(f => ({ ...f, competitorStyle: style }))}
                              className={`px-2 py-1 rounded text-[10px] font-medium capitalize transition-all ${
                                advancedFilters.competitorStyle === style
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white text-gray-600'
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 text-xs">Open to Wagers?</span>
                        <Switch 
                          checked={advancedFilters.wagerAllowed}
                          onCheckedChange={(checked) => setAdvancedFilters(f => ({ ...f, wagerAllowed: checked }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={handleBroadcast}
                disabled={isBroadcasting}
                className="w-full py-5 bg-[#2B2D9E] hover:bg-[#1f2175] text-white font-bold rounded-xl disabled:opacity-50 transition-all"
              >
                {getBroadcastButtonText()}
              </Button>
            </div>
          )}

          {/* STEP 4: Matching / User List */}
          {currentStep === 'matching' && (
            <div className="animate-fadeIn">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-[#2B2D9E] font-medium mb-3 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <h2 className="text-lg font-bold text-gray-800 mb-3">FIND COMPANION</h2>

              <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                {nearbyUsers.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No users found nearby.</p>
                    <p className="text-sm text-gray-400 mt-1">Try increasing your search radius</p>
                  </div>
                ) : (
                  nearbyUsers.map((nearbyUser) => (
                    <button
                      key={nearbyUser.id}
                      onClick={() => handleUserClick(nearbyUser)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                    >
                      <Avatar className="w-12 h-12 border-2 border-white shadow">
                        <AvatarImage src={nearbyUser.profilePhoto} />
                        <AvatarFallback className="bg-[#2B2D9E] text-white">
                          {nearbyUser.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-800">{nearbyUser.name}</p>
                        <p className="text-xs text-gray-500">{nearbyUser.distance} mi away</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-medium">{nearbyUser.averageRating || '4.5'}</span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <Button 
                className="w-full py-5 mt-3 bg-[#2B2D9E] hover:bg-[#1f2175] text-white font-bold rounded-xl"
              >
                CONNECT
              </Button>
            </div>
          )}

          {/* STEP 5: Pre-Match Chat */}
          {currentStep === 'chat' && selectedUser && (
            <div className="animate-fadeIn">
              <button 
                onClick={goBack}
                className="flex items-center gap-2 text-[#2B2D9E] font-medium mb-3 hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10 border-2 border-[#2B2D9E]">
                  <AvatarImage src={selectedUser.profilePhoto} />
                  <AvatarFallback className="bg-[#2B2D9E] text-white">
                    {selectedUser.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">{selectedUser.distance} mi · {selectedActivity?.name}</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-24 overflow-y-auto mb-2 space-y-2 bg-gray-50 rounded-xl p-2">
                {chatMessages.length === 0 && (
                  <p className="text-center text-gray-400 text-xs py-4">Start the conversation!</p>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-1.5 rounded-xl text-sm ${
                      msg.sender === 'me' 
                        ? 'bg-[#2B2D9E] text-white rounded-br-sm' 
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Replies */}
              <div className="flex gap-1 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                {quickMessages.map((msg) => (
                  <button
                    key={msg}
                    onClick={() => setNewMessage(msg)}
                    className="flex-shrink-0 px-2 py-1 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600 hover:bg-gray-200"
                  >
                    {msg}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  onClick={handleSendMessage}
                  size="icon"
                  className="rounded-full bg-[#2B2D9E] hover:bg-[#1f2175] h-9 w-9"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <Button 
                onClick={handleConfirmMeeting}
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
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
      `}</style>
    </div>
  );
}

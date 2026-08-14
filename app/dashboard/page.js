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
// Imports

import { motion, AnimatePresence } from 'framer-motion';
import { getUser, getAuthToken, fetchWithAuth, signOut } from '@/lib/auth';

// Dynamic import for map with error handling
const MapComponent = dynamic(
  () => import('@/components/MapComponent').catch(err => {
    console.error('Failed to load MapComponent:', err);
    return () => (
      <div className="h-full bg-[#0A0C10] flex items-center justify-center">
        <div className="text-center text-[#94A3B8]">
          <p>Radar map couldn't load.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-[#DC2626] font-semibold underline underline-offset-2 hover:text-[#FF6B6B]"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-[#0A0C10] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#DC2626] border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-[#94A3B8] text-sm">Initializing Radar Map...</p>
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
  { id: 'running', name: 'Running', icon: Zap, color: 'bg-red-100 text-red-600' },
  { id: 'gym', name: 'Gym', icon: Dumbbell, color: 'bg-blue-100 text-blue-600' },
  { id: 'cycling', name: 'Cycling', icon: Bike, color: 'bg-green-100 text-green-600' },
  { id: 'yoga', name: 'Yoga', icon: Heart, color: 'bg-blue-100 text-blue-600' },
  { id: 'swimming', name: 'Swimming', icon: Zap, color: 'bg-blue-100 text-blue-600' },
  { id: 'basketball', name: 'Basketball', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'tennis', name: 'Tennis', icon: Zap, color: 'bg-green-100 text-green-600' },
];

// Non-athletic activities
const nonAthleticActivities = [
  { id: 'coffee', name: 'Coffee', icon: Coffee, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'cinema', name: 'Cinema', icon: Film, color: 'bg-blue-100 text-blue-600' },
  { id: 'concert', name: 'Concert', icon: Music, color: 'bg-red-100 text-red-600' },
  { id: 'dining', name: 'Dining', icon: Utensils, color: 'bg-red-100 text-red-600' },
  { id: 'bookclub', name: 'Book Club', icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
  { id: 'photography', name: 'Photography', icon: Camera, color: 'bg-blue-100 text-blue-600' },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'music', name: 'Music/Jam', icon: Mic, color: 'bg-red-100 text-red-600' },
  { id: 'cars', name: 'Cars/Mechanics', icon: Wrench, color: 'bg-blue-100 text-blue-600' },
  { id: 'art', name: 'Art/Creative', icon: Brush, color: 'bg-green-100 text-green-600' },
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

  // Radar Boost (monetization: spend a credit for wider radius / priority placement)
  const [boostCredits, setBoostCredits] = useState(0);
  const [activeBoost, setActiveBoost] = useState(null);
  const [isActivatingBoost, setIsActivatingBoost] = useState(false);
  
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
      fetchBoostStatus();
    }
  }, [user, selectedActivity, broadcastRadius, activeBoost]);

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
        // No sessions yet — the "Recent Activity Shortcuts" block below only
        // renders when this array is non-empty, so an honest empty state
        // here just means that section doesn't show yet. That's correct:
        // a brand-new user has no history to show, and we'd rather show
        // nothing than invent activity that never happened.
        setRecentActivities([]);
      }
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      setRecentActivities([]);
    }
  };

  const fetchBoostStatus = async () => {
    try {
      const res = await fetchWithAuth('/api/boosts');
      const data = await res.json();
      setBoostCredits(data.credits ?? 0);
      setActiveBoost(data.activeBoost || null);
    } catch (error) {
      console.error('Failed to fetch boost status:', error);
    }
  };

  const handleActivateBoost = async (type = 'radius') => {
    if (boostCredits <= 0 || isActivatingBoost) return;
    setIsActivatingBoost(true);
    try {
      const res = await fetchWithAuth('/api/boosts/activate', {
        method: 'POST',
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not activate Radar Boost');
        return;
      }
      setBoostCredits(data.credits);
      setActiveBoost(data.activeBoost);
      toast.success(
        type === 'radius'
          ? `Radar Boost active! Your radius is 2x for the next hour.`
          : `Priority Placement active for the next hour — you'll show first in matches.`
      );
    } catch (error) {
      console.error('Failed to activate boost:', error);
      toast.error('Could not activate Radar Boost');
    } finally {
      setIsActivatingBoost(false);
    }
  };

  // Effective radius shown/used once a Radius Boost is active
  const effectiveBroadcastRadius = activeBoost?.radiusMultiplier
    ? +(broadcastRadius[0] * activeBoost.radiusMultiplier).toFixed(1)
    : broadcastRadius[0];

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
          distance: (Math.random() * effectiveBroadcastRadius).toFixed(1)
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
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-9 h-9 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[#94A3B8] text-sm font-semibold">Tuning in to the radar...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0">
        <MapComponent
          center={[userLocation.lat, userLocation.lng]}
          zoom={14}
          users={nearbyUsers}
          currentUser={{ location: userLocation }}
          selectedUser={selectedUser}
          onUserClick={handleUserClick}
          showRoute={currentStep === 'chat'}
          className="w-full h-full"
        />
        
        {/* Top Controls Overlay map */}
        <div className="absolute top-safe pt-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
          <div className="flex gap-2">
            {currentStep !== 'category' && (
              <div className="bg-[#12151E]/90 border border-white/10 pointer-events-auto rounded-full px-4 py-2 shadow-xl backdrop-blur-md flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse shadow-[0_0_8px_#DC2626]"></span>
                <p className="text-xs font-bold text-white tracking-tight">
                  {selectedCategory?.name} {selectedActivity && `› ${selectedActivity.name}`}
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pointer-events-auto">
            {currentStep !== 'category' && (
              <button 
                onClick={resetFlow}
                className="bg-[#12151E]/90 border border-white/10 rounded-full p-2.5 shadow-xl text-white hover:bg-white/10 transition-colors backdrop-blur-md"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            )}
            <button 
              onClick={getUserLocation}
              className="bg-[#12151E]/90 border border-white/10 rounded-full p-2.5 shadow-xl text-white hover:bg-white/10 transition-colors backdrop-blur-md"
            >
              <MapPin className="w-4 h-4 text-[#DC2626]" />
            </button>
          </div>
        </div>

        {/* Broadcasting Overlay Full Screen */}
        {isBroadcasting && (
          <div className="absolute inset-0 bg-[#0A0C10]/85 backdrop-blur-md flex items-center justify-center z-30 pointer-events-auto">
            <div className="text-center text-white p-6">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-[#DC2626]/30 animate-ping"></div>
                <div className="absolute inset-2 rounded-full border-4 border-[#DC2626]/60 animate-ping animation-delay-200"></div>
                <div className="absolute inset-4 flex items-center justify-center bg-gradient-to-br from-[#DC2626] to-[#991B1B] rounded-full shadow-[0_0_30px_rgba(220,38,38,0.8)] z-10">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-xl font-black mb-1 tracking-tight text-white">Broadcasting Radar Intent...</p>
              <p className="text-[#94A3B8] text-sm">Searching for {selectedActivity?.name} {getSelectedConnectionType()?.name}s nearby</p>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none pb-16">
        <div className="w-full max-w-md mx-auto">
          {/* Bottom Panel - Dark Obsidian Sheet */}
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-[#12151E]/95 shadow-[0_-15px_50px_rgba(0,0,0,0.9)] rounded-t-3xl mx-0 pointer-events-auto border-t border-white/10 backdrop-blur-2xl text-white"
          >
            {/* Panel Handle */}
            <div className="pt-3 pb-2 flex justify-center">
              <div className="w-12 h-1 bg-[#2A2F3D] rounded-full" />
            </div>

            {/* Panel Content */}
            <div className="px-5 pb-6 max-h-[60vh] overflow-y-auto">
          
          {/* STEP 0: Category Selection */}
          {currentStep === 'category' && (
            <div className="animate-fadeIn flex flex-col">
              <div className="flex flex-col py-2">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-xl font-black text-white tracking-tight">What are you up for?</h2>
                  <span className="text-xs font-bold text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/20 px-2.5 py-0.5 rounded-full">
                    LIVE RADAR
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  {activityCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category)}
                        className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#1A1E2B] border border-white/10 hover:border-[#DC2626]/60 hover:bg-[#232838] transition-all active:scale-[0.98] group shadow-lg"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#DC2626]/15 border border-[#DC2626]/40 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#DC2626] transition-all">
                          <Icon className="w-6 h-6 text-[#DC2626] group-hover:text-white transition-colors" />
                        </div>
                        <p className="font-bold text-white text-base tracking-tight">{category.name}</p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">{category.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Activity Section */}
              {recentActivities.length > 0 && (
                <div className="mt-5 pt-4 border-t border-white/10">
                  <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Recent Activity Shortcuts</h3>
                  <div className="space-y-2">
                    {recentActivities.map((activity) => (
                      <div 
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-[#1A1E2B]/80 border border-white/5 rounded-xl hover:border-[#DC2626]/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#DC2626]/20 border border-[#DC2626]/40">
                            {activity.category === 'athletic' ? (
                              <Dumbbell className="w-4 h-4 text-[#DC2626]" />
                            ) : (
                              <Palette className="w-4 h-4 text-[#FBBF24]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate">{activity.activity}</p>
                            <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                              <span>with {activity.partner}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="ml-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold px-3 py-1 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                          onClick={() => {
                            setSelectedRecentActivity(activity);
                            setShowGoAgainModal(true);
                          }}
                        >
                          Re-Request
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Go Again Modal */}
          {showGoAgainModal && selectedRecentActivity && (
            <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <Card className="w-full max-w-sm overflow-hidden border border-white/10 bg-[#12151E] shadow-2xl rounded-2xl text-white">
                <div className="p-5">
                  <h3 className="text-xl font-black text-white tracking-tight mb-1">Request Activity Again</h3>
                  <p className="text-sm text-[#94A3B8] mb-6">
                    Looking for a <span className="font-bold text-[#FBBF24] border-b border-[#FBBF24]">{selectedRecentActivity.activity}</span> partner nearby.
                  </p>
                  
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white justify-start h-12 rounded-xl text-base font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                      onClick={() => handleGoAgain(selectedRecentActivity, 'broadcast_all')}
                    >
                      <Users className="w-5 h-5 mr-3" />
                      Find new partners nearby
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full border-white/10 bg-[#1A1E2B] text-white hover:bg-white/10 justify-start h-12 rounded-xl text-base font-semibold"
                      onClick={() => handleGoAgain(selectedRecentActivity, 'same_user')}
                    >
                      <UserCheck className="w-5 h-5 mr-3 text-[#FBBF24]" />
                      Direct Request {selectedRecentActivity.partner}
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    className="w-full mt-4 text-[#94A3B8] hover:text-white hover:bg-white/5 rounded-xl"
                    onClick={() => {
                      setShowGoAgainModal(false);
                      setSelectedRecentActivity(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* STEP 1: Activity Selection */}
          {currentStep === 'activity' && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-4 mt-2">
                <button 
                  onClick={goBack}
                  className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Select {selectedCategory?.name} Activity
                </h2>
              </div>
              
              <div className="grid grid-cols-3 gap-2.5">
                {getActivitiesForCategory().map((activity) => {
                  const Icon = activity.icon;
                  const isSelected = selectedActivity?.id === activity.id;
                  return (
                    <button
                      key={activity.id}
                      onClick={() => handleActivitySelect(activity)}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'border-[#DC2626] bg-[#DC2626]/20 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                          : 'border-white/10 bg-[#1A1E2B] hover:border-white/20 text-[#E2E8F0]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-[#DC2626]' : 'text-[#FBBF24]'}`} />
                      <span className="font-bold text-xs text-center">{activity.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Connection Type */}
          {currentStep === 'connection' && (
            <div className="animate-fadeIn flex flex-col h-full relative">
              <div>
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <button 
                    onClick={goBack}
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-black text-white tracking-tight">What type of connection?</h2>
                </div>

                <div className="grid grid-cols-1 gap-2.5 mb-4">
                  {getConnectionTypes().map((type) => {
                    const isSelected = selectedConnection === type.id;
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => handleConnectionSelect(type.id)}
                        className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${
                          isSelected
                            ? 'border-[#DC2626] bg-[#DC2626]/15 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                            : 'border-white/10 bg-[#1A1E2B] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#DC2626] text-white' : 'bg-white/5 text-[#FBBF24]'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">{type.name}</p>
                            <p className="text-xs text-[#94A3B8] mt-0.5">{type.description}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-[#DC2626]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 sticky bottom-0 bg-[#12151E]">
                <Button 
                  onClick={() => selectedConnection && setCurrentStep('broadcast')}
                  disabled={!selectedConnection}
                  className="w-full py-6 text-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-2xl disabled:opacity-50 transition-all h-14 shadow-[0_0_25px_rgba(220,38,38,0.5)] border border-red-500/30"
                >
                  Continue to Radar Search
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Broadcast Parameters */}
          {currentStep === 'broadcast' && (
            <div className="animate-fadeIn flex flex-col h-full relative">
              <div className="flex items-center gap-3 mb-4 mt-2">
                <button 
                  onClick={goBack}
                  className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-white tracking-tight">Broadcast Search Radius</h2>
              </div>

              {/* Radius Slider */}
              <div className="mb-6 p-4 rounded-2xl bg-[#1A1E2B] border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-white">Maximum Distance</span>
                  <span className="text-sm font-bold bg-[#DC2626] text-white px-3 py-1 rounded-full shadow-[0_0_12px_rgba(220,38,38,0.5)]">
                    {broadcastRadius[0]} miles
                  </span>
                </div>
                <Slider
                  value={broadcastRadius}
                  onValueChange={setBroadcastRadius}
                  min={0.5}
                  max={25}
                  step={0.5}
                  className="w-full my-4"
                />
                <p className="text-xs text-[#94A3B8] text-center">
                  {activeBoost
                    ? `Radar Boost active — searching ${effectiveBroadcastRadius} miles (${activeBoost.radiusMultiplier}x) of your location.`
                    : `Searching active users within ${broadcastRadius[0]} miles of your location.`}
                </p>
              </div>

              {/* Radar Boost */}
              <div className={`mb-6 p-4 rounded-2xl border ${activeBoost ? 'bg-[#FBBF24]/10 border-[#FBBF24]/40' : 'bg-[#1A1E2B] border-white/10'}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${activeBoost ? 'text-[#FBBF24]' : 'text-[#94A3B8]'}`} />
                    <span className="text-sm font-bold text-white">Radar Boost</span>
                  </div>
                  <span className="text-xs font-bold text-[#94A3B8]">{boostCredits} credit{boostCredits === 1 ? '' : 's'}</span>
                </div>
                {activeBoost ? (
                  <p className="text-xs text-[#FBBF24] font-semibold">
                    {activeBoost.label} is live — expires {new Date(activeBoost.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-[#94A3B8] mb-3">Double your radius for the next hour so more people see you first.</p>
                    <Button
                      onClick={() => handleActivateBoost('radius')}
                      disabled={boostCredits <= 0 || isActivatingBoost}
                      variant="outline"
                      className="w-full border-[#FBBF24]/40 text-[#FBBF24] hover:bg-[#FBBF24]/10 hover:text-[#FBBF24] font-bold disabled:opacity-40"
                    >
                      {boostCredits <= 0
                        ? "Out of credits — more coming soon"
                        : isActivatingBoost
                          ? "Activating..."
                          : `Activate 2x Radius Boost (1 credit)`}
                    </Button>
                  </>
                )}
              </div>

              <div className="pt-2 sticky bottom-0 bg-[#12151E]">
                <Button 
                  onClick={handleBroadcast}
                  disabled={isBroadcasting}
                  className="w-full py-6 text-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-2xl disabled:opacity-50 transition-all h-14 shadow-[0_0_30px_rgba(220,38,38,0.6)] border border-red-500/30"
                >
                  {getBroadcastButtonText()}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Matching / User List */}
          {currentStep === 'matching' && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-4 mt-2">
                <button 
                  onClick={goBack}
                  className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-white tracking-tight">{usersInRadius} Nearby Activity Matches</h2>
              </div>

              <div className="space-y-2.5 max-h-[40vh] overflow-y-auto">
                {nearbyUsers.length === 0 ? (
                  <div className="text-center py-8 bg-[#1A1E2B] rounded-2xl border border-white/5">
                    <p className="text-[#94A3B8]">No active users found within radius.</p>
                    <p className="text-xs text-[#FBBF24] mt-1 font-semibold">Try increasing search radius</p>
                  </div>
                ) : (
                  nearbyUsers.map((nearbyUser) => (
                    <button
                      key={nearbyUser.id}
                      onClick={() => handleUserClick(nearbyUser)}
                      className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/10 bg-[#1A1E2B] hover:border-[#DC2626]/50 transition-all text-left group"
                    >
                      <Avatar className="w-13 h-13 border-2 border-[#DC2626]">
                        <AvatarImage src={nearbyUser.profilePhoto} />
                        <AvatarFallback className="bg-[#12151E] text-white font-bold">
                          {nearbyUser.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-base truncate group-hover:text-[#DC2626] transition-colors">{nearbyUser.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {nearbyUser.avgRating ? (
                            <span className="flex items-center gap-1 text-xs font-bold bg-[#FBBF24]/15 text-[#FBBF24] px-2 py-0.5 rounded-full border border-[#FBBF24]/30">
                              <Star className="w-3 h-3 fill-[#FBBF24]" />
                              {nearbyUser.avgRating} · {nearbyUser.reviewCount} review{nearbyUser.reviewCount === 1 ? '' : 's'}
                            </span>
                          ) : (
                            <span className="text-xs font-bold bg-white/5 text-[#94A3B8] px-2 py-0.5 rounded-full border border-white/10">
                              New here
                            </span>
                          )}
                          <span className="text-xs text-[#94A3B8]">📍 {nearbyUser.distance} mi away</span>
                        </div>
                      </div>
                      <Button size="sm" className="bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                        Chat
                      </Button>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Pre-Match Chat */}
          {currentStep === 'chat' && selectedUser && (
            <div className="animate-fadeIn flex flex-col h-full relative">
              <div className="flex items-center justify-between mb-4 mt-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={goBack}
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar className="w-10 h-10 border border-[#DC2626]">
                    <AvatarImage src={selectedUser.profilePhoto} />
                    <AvatarFallback className="bg-[#1A1E2B] text-white font-bold">
                      {selectedUser.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-base font-bold text-white leading-tight">{selectedUser.name}</h2>
                    <p className="text-xs text-[#FBBF24]">📍 {selectedUser.distance} mi away</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-[25vh] overflow-y-auto mb-3 space-y-2 bg-[#1A1E2B] rounded-2xl p-4 border border-white/5 flex flex-col">
                {chatMessages.length === 0 && (
                  <div className="my-auto text-center">
                    <MessageSquare className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-50" />
                    <p className="text-[#94A3B8] text-sm font-medium">Send a message to propose meeting up with {selectedUser.name}</p>
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm font-semibold shadow-md ${
                      msg.sender === 'me' 
                        ? 'bg-[#DC2626] text-white rounded-tr-sm shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
                        : 'bg-[#232838] text-white border border-white/10 rounded-tl-sm'
                    }`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Replies */}
              {chatMessages.length === 0 && (
                 <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                 {quickMessages.map((msg) => (
                   <button
                     key={msg}
                     onClick={() => setNewMessage(msg)}
                     className="flex-shrink-0 px-3 py-1.5 bg-[#1A1E2B] border border-white/10 rounded-full text-xs font-bold text-[#E2E8F0] hover:border-[#DC2626]/50 transition-colors"
                   >
                     {msg}
                   </button>
                 ))}
               </div>
              )}

              {/* Chat Input */}
              <div className="flex gap-2 mb-3 bg-[#12151E] sticky bottom-0 pt-1 shrink-0">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message..."
                  className="flex-1 rounded-full bg-[#1A1E2B] border-white/10 text-white focus-visible:ring-[#DC2626] h-12 text-sm px-5"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  onClick={handleSendMessage}
                  size="icon"
                  className="rounded-full bg-[#DC2626] hover:bg-[#B91C1C] h-12 w-12 shrink-0 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                >
                  <Send className="w-5 h-5 text-white" />
                </Button>
              </div>

              <div className="pt-2 sticky bottom-0 bg-[#12151E]">
                <Button 
                  onClick={handleConfirmMeeting}
                  className="w-full py-6 text-lg bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:opacity-90 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.6)] h-14 border border-red-500/30"
                >
                  Confirm Meetup Location
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
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
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dumbbell, Users, Target, Calendar, MessageSquare, Bell, Settings, 
  LogOut, Plus, Heart, MapPin, Star, TrendingUp, Zap, Shield
} from 'lucide-react';
import { ACTIVITY_CATEGORIES, FITNESS_GOALS, LOOKING_FOR_MODES, DAYS_OF_WEEK, TIME_SLOTS } from '@/lib/constants';
import { toast } from 'sonner';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Onboarding states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    dob: '',
    gender: '',
    fitnessLevel: 5,
    goals: [],
    experienceYears: 0,
    height: '',
    weight: '',
    bodyFat: '',
    activities: [],
    preferredDays: [],
    preferredTimes: [],
    searchRadius: 10,
    location: '',
    lookingFor: 'buddy'
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('Checking auth...');
      const res = await fetch('/api/session', {
        credentials: 'include' // This is crucial - tells fetch to send cookies
      });
      const data = await res.json();
      
      console.log('Session data:', data);
      
      if (!data.user) {
        console.log('No user, redirecting to signin');
        router.push('/auth/signin');
        return;
      }
      
      console.log('User authenticated:', data.user);
      setUser(data.user);
      fetchProfile();
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/auth/signin');
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        if (!data.profile.onboardingComplete) {
          setOnboardingStep(data.profile.onboardingStep || 1);
        } else {
          fetchMatches();
          fetchSessions();
          fetchFeed();
        }
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (data.matches) {
        setMatches(data.matches.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch matches');
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions?filter=upcoming');
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions');
    }
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/feed');
      const data = await res.json();
      if (data.posts) {
        setFeedPosts(data.posts.slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to fetch feed');
    }
  };

  const completeOnboarding = async () => {
    try {
      setLoading(true);
      
      // Submit all onboarding data in sequence
      if (onboardingStep >= 2) {
        await fetch('/api/profile/basic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: onboardingData.name,
            dob: onboardingData.dob,
            gender: onboardingData.gender,
          }),
        });
      }

      if (onboardingStep >= 3) {
        await fetch('/api/profile/fitness', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fitnessLevel: onboardingData.fitnessLevel,
            goals: onboardingData.goals,
            experienceYears: onboardingData.experienceYears,
          }),
        });
      }

      if (onboardingStep >= 4 && onboardingData.height && onboardingData.weight) {
        await fetch('/api/profile/health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            height: parseInt(onboardingData.height),
            weight: parseInt(onboardingData.weight),
            bodyFat: onboardingData.bodyFat ? parseFloat(onboardingData.bodyFat) : null,
          }),
        });
      }

      // Final step - activities and preferences
      const res = await fetch('/api/profile/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activities: onboardingData.activities,
          preferredDays: onboardingData.preferredDays,
          preferredTimes: onboardingData.preferredTimes,
          searchRadius: onboardingData.searchRadius,
          location: onboardingData.location,
          lookingFor: onboardingData.lookingFor,
        }),
      });

      if (res.ok) {
        toast.success('Onboarding complete! Welcome to FITTR!');
        await fetchProfile();
      }
    } catch (error) {
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-16 h-16 text-orange-600 animate-bounce mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await fetch('/api/signout', { method: 'POST' });
    router.push('/');
  };

  // Onboarding Flow
  if (profile && !profile.onboardingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Dumbbell className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Step {onboardingStep} of 5</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${(onboardingStep / 5) * 100}%` }}
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {onboardingStep === 1 && 'Basic Information'}
                {onboardingStep === 2 && 'Fitness Identity'}
                {onboardingStep === 3 && 'Health Metrics'}
                {onboardingStep === 4 && 'Activity Preferences'}
                {onboardingStep === 5 && 'Location & Availability'}
              </CardTitle>
              <CardDescription>
                {onboardingStep === 1 && 'Tell us about yourself'}
                {onboardingStep === 2 && 'Your fitness goals and level'}
                {onboardingStep === 3 && 'Track your health journey'}
                {onboardingStep === 4 && 'What activities do you enjoy?'}
                {onboardingStep === 5 && 'When and where do you like to train?'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {onboardingStep === 1 && (
                <>
                  <div>
                    <Label>Full Name</Label>
                    <Input 
                      value={onboardingData.name}
                      onChange={(e) => setOnboardingData({...onboardingData, name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input 
                      type="date"
                      value={onboardingData.dob}
                      onChange={(e) => setOnboardingData({...onboardingData, dob: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select 
                      value={onboardingData.gender}
                      onValueChange={(value) => setOnboardingData({...onboardingData, gender: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {onboardingStep === 2 && (
                <>
                  <div>
                    <Label>Fitness Level (1-10)</Label>
                    <div className="pt-2">
                      <Slider 
                        value={[onboardingData.fitnessLevel]}
                        onValueChange={(value) => setOnboardingData({...onboardingData, fitnessLevel: value[0]})}
                        min={1}
                        max={10}
                        step={1}
                      />
                      <div className="text-center mt-2 text-2xl font-bold text-orange-600">
                        {onboardingData.fitnessLevel}
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        {onboardingData.fitnessLevel <= 3 && 'Beginner - Just starting out'}
                        {onboardingData.fitnessLevel > 3 && onboardingData.fitnessLevel <= 7 && 'Intermediate - Regular training'}
                        {onboardingData.fitnessLevel > 7 && 'Advanced - High performance athlete'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Fitness Goals (select multiple)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {FITNESS_GOALS.map((goal) => (
                        <div key={goal.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={onboardingData.goals.includes(goal.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setOnboardingData({...onboardingData, goals: [...onboardingData.goals, goal.id]});
                              } else {
                                setOnboardingData({...onboardingData, goals: onboardingData.goals.filter(g => g !== goal.id)});
                              }
                            }}
                          />
                          <label className="text-sm">{goal.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {onboardingStep === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Height (cm)</Label>
                      <Input 
                        type="number"
                        value={onboardingData.height}
                        onChange={(e) => setOnboardingData({...onboardingData, height: e.target.value})}
                        placeholder="170"
                      />
                    </div>
                    <div>
                      <Label>Weight (kg)</Label>
                      <Input 
                        type="number"
                        value={onboardingData.weight}
                        onChange={(e) => setOnboardingData({...onboardingData, weight: e.target.value})}
                        placeholder="70"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Body Fat % (optional)</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      value={onboardingData.bodyFat}
                      onChange={(e) => setOnboardingData({...onboardingData, bodyFat: e.target.value})}
                      placeholder="15.5"
                    />
                  </div>
                  {onboardingData.height && onboardingData.weight && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Your BMI:</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {((onboardingData.weight / ((onboardingData.height / 100) ** 2))).toFixed(1)}
                      </p>
                    </div>
                  )}
                </>
              )}

              {onboardingStep === 4 && (
                <>
                  <div>
                    <Label>Activities You Enjoy (select multiple)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-96 overflow-y-auto">
                      {ACTIVITY_CATEGORIES.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-2">
                          <Checkbox
                            checked={onboardingData.activities.includes(activity.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setOnboardingData({...onboardingData, activities: [...onboardingData.activities, activity.id]});
                              } else {
                                setOnboardingData({...onboardingData, activities: onboardingData.activities.filter(a => a !== activity.id)});
                              }
                            }}
                          />
                          <label className="text-sm">{activity.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {onboardingStep === 5 && (
                <>
                  <div>
                    <Label>Location (City, State)</Label>
                    <Input 
                      value={onboardingData.location}
                      onChange={(e) => setOnboardingData({...onboardingData, location: e.target.value})}
                      placeholder="Los Angeles, CA"
                    />
                  </div>
                  <div>
                    <Label>Search Radius (miles)</Label>
                    <Slider 
                      value={[onboardingData.searchRadius]}
                      onValueChange={(value) => setOnboardingData({...onboardingData, searchRadius: value[0]})}
                      min={1}
                      max={50}
                      step={1}
                    />
                    <p className="text-center mt-2 text-sm text-gray-600">{onboardingData.searchRadius} miles</p>
                  </div>
                  <div>
                    <Label>Looking For</Label>
                    <Select 
                      value={onboardingData.lookingFor}
                      onValueChange={(value) => setOnboardingData({...onboardingData, lookingFor: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOOKING_FOR_MODES.map((mode) => (
                          <SelectItem key={mode.id} value={mode.id}>{mode.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Preferred Days</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            checked={onboardingData.preferredDays.includes(day)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setOnboardingData({...onboardingData, preferredDays: [...onboardingData.preferredDays, day]});
                              } else {
                                setOnboardingData({...onboardingData, preferredDays: onboardingData.preferredDays.filter(d => d !== day)});
                              }
                            }}
                          />
                          <label className="text-sm">{day}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Preferred Times</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {TIME_SLOTS.map((time) => (
                        <div key={time} className="flex items-center space-x-2">
                          <Checkbox
                            checked={onboardingData.preferredTimes.includes(time)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setOnboardingData({...onboardingData, preferredTimes: [...onboardingData.preferredTimes, time]});
                              } else {
                                setOnboardingData({...onboardingData, preferredTimes: onboardingData.preferredTimes.filter(t => t !== time)});
                              }
                            }}
                          />
                          <label className="text-sm">{time}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                {onboardingStep > 1 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setOnboardingStep(onboardingStep - 1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                )}
                {onboardingStep < 5 && (
                  <Button 
                    onClick={() => setOnboardingStep(onboardingStep + 1)}
                    className="flex-1"
                  >
                    Next
                  </Button>
                )}
                {onboardingStep === 5 && (
                  <Button 
                    onClick={completeOnboarding}
                    className="flex-1"
                    disabled={loading}
                  >
                    Complete Setup
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-8 h-8 text-orange-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                FITTR
              </span>
            </div>
            <nav className="hidden md:flex gap-6">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`text-sm font-medium ${activeTab === 'overview' ? 'text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('matches')}
                className={`text-sm font-medium ${activeTab === 'matches' ? 'text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Find Partners
              </button>
              <button 
                onClick={() => setActiveTab('sessions')}
                className={`text-sm font-medium ${activeTab === 'sessions' ? 'text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Sessions
              </button>
              <button 
                onClick={() => setActiveTab('feed')}
                className={`text-sm font-medium ${activeTab === 'feed' ? 'text-orange-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Feed
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
            <Avatar>
              <AvatarFallback className="bg-orange-100 text-orange-600">
                {profile?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.name}!</h1>
              <p className="text-gray-600">Ready to crush your fitness goals today?</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Matches</p>
                      <p className="text-2xl font-bold">{matches.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sessions</p>
                      <p className="text-2xl font-bold">{sessions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Star className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rating</p>
                      <p className="text-2xl font-bold">{profile?.averageRating || '5.0'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Fitness Level</p>
                      <p className="text-2xl font-bold">{profile?.fitnessLevel || 5}/10</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Matches</CardTitle>
                  <CardDescription>Based on your preferences and goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {matches.slice(0, 3).map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-orange-100 text-orange-600">
                              {match.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{match.name}</p>
                            <p className="text-sm text-gray-600">{match.location}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          {match.compatibilityScore}% match
                        </Badge>
                      </div>
                    ))}
                    {matches.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No matches yet. Check back soon!</p>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('matches')}>
                      View All Matches
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                  <CardDescription>Your scheduled workouts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{session.activityType}</Badge>
                          <span className="text-sm text-gray-600">{session.mode}</span>
                        </div>
                        <p className="text-sm font-medium">{session.location}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(session.startTime).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    {sessions.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No upcoming sessions</p>
                    )}
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('sessions')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Find Your Perfect Workout Partner</h1>
                <p className="text-gray-600">Browse compatible matches in your area</p>
              </div>
              <Button onClick={fetchMatches}>
                Refresh Matches
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {matches.map((match) => (
                <Card key={match.id} className="hover:shadow-lg transition">
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      <Avatar className="w-20 h-20 mx-auto mb-3">
                        <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
                          {match.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-bold text-lg">{match.name}</h3>
                      <p className="text-sm text-gray-600">{match.location}</p>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Compatibility</span>
                        <Badge className="bg-green-100 text-green-700">
                          {match.compatibilityScore}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fitness Level</span>
                        <span className="font-medium">{match.fitnessLevel}/10</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{match.distance} miles away</span>
                      </div>
                    </div>

                    {match.commonActivities && match.commonActivities.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Common Activities:</p>
                        <div className="flex flex-wrap gap-2">
                          {match.commonActivities.slice(0, 3).map((activity) => (
                            <Badge key={activity} variant="outline" className="text-xs">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button className="w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {matches.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No matches found. Try adjusting your preferences.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Your Sessions</h1>
                <p className="text-gray-600">Manage your workout sessions</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Session
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge>{session.activityType}</Badge>
                      <span className="text-sm text-gray-600">{session.mode}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium">{session.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time</p>
                        <p className="font-medium">
                          {new Date(session.startTime).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Participants</p>
                        <div className="flex items-center gap-2 mt-2">
                          {session.participants && session.participants.slice(0, 3).map((p, i) => (
                            <Avatar key={i} className="w-8 h-8">
                              <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                                {p.user?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {session.participants && session.participants.length > 3 && (
                            <span className="text-sm text-gray-600">
                              +{session.participants.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      {session.notes && (
                        <div>
                          <p className="text-sm text-gray-600">Notes</p>
                          <p className="text-sm">{session.notes}</p>
                        </div>
                      )}
                      <Button variant="outline" className="w-full">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {sessions.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No sessions scheduled yet</p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Session
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Community Feed</h1>
              <p className="text-gray-600">See what others are up to</p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3 mb-4">
                  <Avatar>
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      {profile?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input placeholder="Share your workout progress..." />
                  </div>
                  <Button>Post</Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {feedPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar>
                        <AvatarFallback className="bg-orange-100 text-orange-600">
                          {post.author?.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{post.author?.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">{post.contentType}</Badge>
                    </div>
                    <p className="mb-4">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes?.length || 0}</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments?.length || 0}</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {feedPosts.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No posts yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

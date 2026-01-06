'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Mountain, Coffee, Film, Music, Dumbbell, Bike, BookOpen, Heart,
  Utensils, ShoppingBag, ChevronRight, ChevronLeft, UserPlus, GraduationCap,
  Trophy, UsersRound, Accessibility, Lightbulb, Award, BookMarked
} from 'lucide-react';
import { toast } from 'sonner';
import { getUser, fetchWithAuth } from '@/lib/auth';

const activities = [
  { id: 'hiking', name: 'Hiking', icon: Mountain },
  { id: 'coffee', name: 'Coffee', icon: Coffee },
  { id: 'cinema', name: 'Cinema', icon: Film },
  { id: 'concert', name: 'Concert', icon: Music },
  { id: 'gym', name: 'Gym', icon: Dumbbell },
  { id: 'cycling', name: 'Cycling', icon: Bike },
  { id: 'reading', name: 'Book Club', icon: BookOpen },
  { id: 'wellness', name: 'Wellness', icon: Heart },
  { id: 'dining', name: 'Dining', icon: Utensils },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag },
];

// Connection type identities that users can select for their profile
const connectionTypeIdentities = [
  { 
    id: 'buddy', 
    name: 'Buddy', 
    description: 'Looking for companions to do activities together',
    icon: UserPlus, 
    color: 'bg-blue-500',
    category: 'both'
  },
  { 
    id: 'trainer', 
    name: 'Trainer', 
    description: 'I can train others in athletic activities',
    icon: GraduationCap, 
    color: 'bg-orange-500',
    category: 'athletic'
  },
  { 
    id: 'competitor', 
    name: 'Competitor', 
    description: 'I enjoy competitive athletic challenges',
    icon: Trophy, 
    color: 'bg-red-500',
    category: 'athletic'
  },
  { 
    id: 'mentor', 
    name: 'Mentor', 
    description: 'I can guide and advise others',
    icon: Lightbulb, 
    color: 'bg-yellow-500',
    category: 'non-athletic'
  },
  { 
    id: 'instructor', 
    name: 'Instructor', 
    description: 'I can teach skills and activities',
    icon: BookMarked, 
    color: 'bg-teal-500',
    category: 'non-athletic'
  },
  { 
    id: 'expert', 
    name: 'Expert', 
    description: 'I have specialized knowledge to share',
    icon: Award, 
    color: 'bg-emerald-500',
    category: 'non-athletic'
  },
  { 
    id: 'group_leader', 
    name: 'Group Leader', 
    description: 'I enjoy organizing and leading groups',
    icon: UsersRound, 
    color: 'bg-green-500',
    category: 'both'
  },
  { 
    id: 'accessible', 
    name: 'Accessibility Advocate', 
    description: 'I support inclusive activities for all abilities',
    icon: Accessibility, 
    color: 'bg-purple-500',
    category: 'both'
  },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const times = ['Morning', 'Afternoon', 'Evening', 'Night'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    gender: '',
    dob: '',
    selectedActivities: [],
    preferredDays: [],
    preferredTimes: [],
    location: '',
    lookingFor: 'both',
    connectionIdentities: [] // NEW: User's profile identity types
  });

  const totalSteps = 4; // Increased from 3 to 4
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
  }, []);

  const toggleActivity = (activityId) => {
    setFormData(prev => ({
      ...prev,
      selectedActivities: prev.selectedActivities.includes(activityId)
        ? prev.selectedActivities.filter(a => a !== activityId)
        : [...prev.selectedActivities, activityId]
    }));
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day]
    }));
  };

  const toggleTime = (time) => {
    setFormData(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.includes(time)
        ? prev.preferredTimes.filter(t => t !== time)
        : [...prev.preferredTimes, time]
    }));
  };

  const toggleConnectionIdentity = (identityId) => {
    setFormData(prev => ({
      ...prev,
      connectionIdentities: prev.connectionIdentities.includes(identityId)
        ? prev.connectionIdentities.filter(i => i !== identityId)
        : [...prev.connectionIdentities, identityId]
    }));
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      try {
        const res = await fetchWithAuth('/api/profile/preferences', {
          method: 'POST',
          body: JSON.stringify({
            activities: formData.selectedActivities,
            preferredDays: formData.preferredDays,
            preferredTimes: formData.preferredTimes,
            location: formData.location,
            lookingFor: formData.lookingFor,
            connectionIdentities: formData.connectionIdentities,
            gender: formData.gender,
            dob: formData.dob
          })
        });

        if (res.ok) {
          toast.success('Profile complete! Let\'s find you some partners.');
          router.push('/dashboard');
        } else {
          toast.error('Failed to save preferences');
        }
      } catch (error) {
        console.error('Onboarding error:', error);
        toast.error('An error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#2B2D9E] py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-white/80 text-sm mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tell us about yourself</h2>
            <p className="text-gray-500 mb-6">Help us personalize your experience</p>
            
            <div className="space-y-4">
              <div>
                <Label>Gender</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setFormData({...formData, gender: g.toLowerCase()})}
                      className={`py-3 rounded-lg font-medium transition-colors ${
                        formData.gender === g.toLowerCase()
                          ? 'bg-[#2B2D9E] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="location">City/Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, NY"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Connection Type Identity - NEW */}
        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Profile Identity</h2>
            <p className="text-gray-500 mb-6">Select how you want to connect with others. Choose all that apply - you can change this anytime.</p>
            
            <div className="space-y-3">
              {connectionTypeIdentities.map((identity) => {
                const Icon = identity.icon;
                const isSelected = formData.connectionIdentities.includes(identity.id);
                return (
                  <button
                    key={identity.id}
                    onClick={() => toggleConnectionIdentity(identity.id)}
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all text-left ${
                      isSelected
                        ? 'bg-[#2B2D9E] text-white ring-2 ring-[#2B2D9E] ring-offset-2'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full ${isSelected ? 'bg-white/20' : identity.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-white'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {identity.name}
                      </p>
                      <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                        {identity.description}
                      </p>
                      <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {identity.category === 'both' ? 'Athletic & Non-Athletic' : identity.category === 'athletic' ? 'Athletic' : 'Non-Athletic'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Step 3: Activities */}
        {step === 3 && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose your activities</h2>
            <p className="text-gray-500 mb-6">Select activities you enjoy</p>
            
            <div className="grid grid-cols-3 gap-3">
              {activities.map((activity) => {
                const Icon = activity.icon;
                const isSelected = formData.selectedActivities.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    onClick={() => toggleActivity(activity.id)}
                    className={`p-4 rounded-xl flex flex-col items-center transition-all ${
                      isSelected
                        ? 'bg-[#2B2D9E] text-white scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">{activity.name}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Step 4: Availability */}
        {step === 4 && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">When are you available?</h2>
            <p className="text-gray-500 mb-6">Let others know your schedule</p>
            
            <div className="space-y-6">
              <div>
                <Label className="mb-3 block">Preferred Days</Label>
                <div className="flex flex-wrap gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        formData.preferredDays.includes(day)
                          ? 'bg-[#2B2D9E] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Preferred Times</Label>
                <div className="flex flex-wrap gap-2">
                  {times.map((time) => (
                    <button
                      key={time}
                      onClick={() => toggleTime(time)}
                      className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        formData.preferredTimes.includes(time)
                          ? 'bg-[#2B2D9E] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Looking for</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'partners', label: 'Partners' },
                    { value: 'groups', label: 'Groups' },
                    { value: 'both', label: 'Both' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({...formData, lookingFor: option.value})}
                      className={`py-3 rounded-lg font-medium transition-colors ${
                        formData.lookingFor === option.value
                          ? 'bg-[#2B2D9E] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button 
              variant="outline"
              className="flex-1 py-6 bg-white"
              onClick={() => setStep(step - 1)}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
          )}
          <Button 
            className="flex-1 py-6 bg-white text-[#2B2D9E] hover:bg-gray-100"
            onClick={handleNext}
          >
            {step === totalSteps ? 'Complete' : 'Next'}
            {step < totalSteps && <ChevronRight className="w-5 h-5 ml-1" />}
          </Button>
        </div>

        {/* Skip */}
        <button 
          className="w-full text-center text-white/70 mt-4 hover:text-white"
          onClick={() => router.push('/dashboard')}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

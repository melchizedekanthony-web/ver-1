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
  Utensils, ShoppingBag, ChevronRight, ChevronLeft
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
    lookingFor: 'both'
  });

  const totalSteps = 3;
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
            lookingFor: formData.lookingFor
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
    <div className="min-h-screen bg-[#1a1aff] py-8 px-4">
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
                          ? 'bg-[#1a1aff] text-white'
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

        {/* Step 2: Activities */}
        {step === 2 && (
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
                        ? 'bg-[#1a1aff] text-white scale-105'
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

        {/* Step 3: Availability */}
        {step === 3 && (
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
                          ? 'bg-[#1a1aff] text-white'
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
                          ? 'bg-[#1a1aff] text-white'
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
                          ? 'bg-[#1a1aff] text-white'
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
            className="flex-1 py-6 bg-white text-[#1a1aff] hover:bg-gray-100"
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

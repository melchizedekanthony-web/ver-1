'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Star, MapPin, MessageSquare, Calendar, 
  Dumbbell, Mountain, Coffee, Music 
} from 'lucide-react';
import { getUser, fetchWithAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;

  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setCurrentUser(storedUser);
    fetchUserProfile();
    fetchReviews();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetchWithAuth('/api/matches');
      const data = await res.json();
      if (data.matches) {
        const found = data.matches.find(m => m.id === userId);
        setUser(found || data.matches[0]);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetchWithAuth(`/api/reviews/${userId}?type=user`);
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleConnect = () => {
    toast.success('Connection request sent!');
    router.push(`/connect/${userId}`);
  };

  const getActivityIcon = (activity) => {
    const icons = {
      hiking: Mountain,
      gym: Dumbbell,
      coffee: Coffee,
      concert: Music,
    };
    return icons[activity] || Mountain;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <header className="bg-[#1a1aff] px-4 py-3 flex items-center">
        <button onClick={() => router.back()} className="text-white text-2xl">←</button>
        <h1 className="flex-1 text-center text-xl font-bold text-white">Profile</h1>
        <div className="w-8"></div>
      </header>

      {/* Profile Header */}
      <div className="bg-[#1a1aff] pb-16 pt-4 px-4">
        <div className="text-center">
          <Avatar className="w-24 h-24 mx-auto border-4 border-white">
            <AvatarImage src={user?.profilePhoto} />
            <AvatarFallback className="bg-[#4a3aff] text-white text-2xl">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-white mt-3">{user?.name}</h2>
          <div className="flex items-center justify-center gap-1 mt-1">
            <MapPin className="w-4 h-4 text-white/70" />
            <span className="text-white/70">{user?.distance || 5} km away</span>
          </div>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1,2,3,4,5].map((star) => (
              <Star 
                key={star} 
                className={`w-5 h-5 ${star <= (user?.averageRating || 4) ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`} 
              />
            ))}
            <span className="text-white ml-1">({user?.averageRating || '4.0'})</span>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="mx-4 -mt-8 relative z-10 p-4">
        <div className="grid grid-cols-3 text-center">
          <div>
            <p className="text-2xl font-bold text-[#1a1aff]">{user?.compatibilityScore || 85}%</p>
            <p className="text-sm text-gray-500">Match</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1a1aff]">24</p>
            <p className="text-sm text-gray-500">Activities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1a1aff]">18</p>
            <p className="text-sm text-gray-500">Partners</p>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="mx-4 mt-4 p-4">
        <h3 className="font-bold text-gray-800 mb-2">About</h3>
        <p className="text-gray-600">
          {user?.bio || 'Fitness enthusiast looking for workout partners. Love hiking, gym sessions, and outdoor activities!'}
        </p>
      </Card>

      {/* Activities */}
      <Card className="mx-4 mt-4 p-4">
        <h3 className="font-bold text-gray-800 mb-3">Activities</h3>
        <div className="flex flex-wrap gap-2">
          {(user?.activities || ['hiking', 'gym', 'coffee']).map((activity) => {
            const Icon = getActivityIcon(activity);
            return (
              <Badge key={activity} variant="secondary" className="px-3 py-1 capitalize">
                <Icon className="w-4 h-4 mr-1" />
                {activity}
              </Badge>
            );
          })}
        </div>
      </Card>

      {/* Availability */}
      <Card className="mx-4 mt-4 p-4">
        <h3 className="font-bold text-gray-800 mb-3">Availability</h3>
        <div className="flex gap-2 flex-wrap">
          {(user?.preferredDays || ['Mon', 'Wed', 'Sat']).slice(0, 3).map((day) => (
            <div key={day} className="bg-blue-50 text-[#1a1aff] px-3 py-1 rounded-full text-sm">
              {day}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {user?.preferredTimes || 'Morning & Evening'}
        </p>
      </Card>

      {/* Reviews */}
      <Card className="mx-4 mt-4 p-4">
        <h3 className="font-bold text-gray-800 mb-3">Recent Reviews</h3>
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="border-b pb-3 last:border-0">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-200 text-xs">
                      {review.reviewer?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{review.reviewer?.name || 'Anonymous'}</p>
                    <div className="flex">
                      {[1,2,3,4,5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.reviewText && (
                  <p className="text-sm text-gray-600 mt-1">{review.reviewText}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No reviews yet</p>
        )}
      </Card>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3">
        <Button 
          variant="outline"
          className="flex-1 py-6 border-[#1a1aff] text-[#1a1aff]"
          onClick={() => router.push(`/messages/${userId}`)}
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Message
        </Button>
        <Button 
          className="flex-1 py-6 bg-[#1a1aff] hover:bg-[#1515dd]"
          onClick={handleConnect}
        >
          Connect
        </Button>
      </div>
    </div>
  );
}

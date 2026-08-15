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
  // Compatibility score/common-activities are computed server-side against
  // the CURRENT user in /api/matches — real when present, simply omitted
  // (not faked) when this person doesn't happen to be in that list.
  const [matchInfo, setMatchInfo] = useState(null);
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
    fetchMatchInfo();
    fetchReviews();
  }, []);

  // The SPECIFIC person this page is about, by id — not a lookup into
  // whatever /api/matches happens to contain. The old version fell back to
  // "the first match" when the requested id wasn't found, which meant this
  // page could show a completely different person's name, photo, and rating.
  const fetchUserProfile = async () => {
    try {
      const res = await fetchWithAuth(`/api/users/${userId}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        toast.error("Couldn't load this person's profile");
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Best-effort, additive only: if this person shows up in the current
  // user's real match list, grab their real compatibility score. Never
  // falls back to a different person — if they're not in the list (or the
  // list fails to load), matchInfo just stays null and the UI omits that stat.
  const fetchMatchInfo = async () => {
    try {
      const res = await fetchWithAuth('/api/matches');
      const data = await res.json();
      if (res.ok && data.matches) {
        const found = data.matches.find(m => m.id === userId);
        if (found) setMatchInfo(found);
      }
    } catch (error) {
      console.error('Failed to fetch match info:', error);
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
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-[#94A3B8] text-sm">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] pb-24">
      {/* Header */}
      <header className="bg-[#DC2626] px-4 py-3 flex items-center">
        <button onClick={() => router.back()} className="text-white text-2xl">←</button>
        <h1 className="flex-1 text-center text-xl font-bold text-white">Profile</h1>
        <div className="w-8"></div>
      </header>

      {/* Profile Header */}
      <div className="bg-[#DC2626] pb-16 pt-4 px-4">
        <div className="text-center">
          <Avatar className="w-24 h-24 mx-auto border-4 border-white">
            <AvatarImage src={user?.profilePhoto} />
            <AvatarFallback className="bg-[#DC2626] text-white text-2xl">
              {user?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold text-white mt-3">{user?.name}</h2>
          <div className="flex items-center justify-center gap-1 mt-1">
            <MapPin className="w-4 h-4 text-white/70" />
            <span className="text-white/70">
              {user?.location ? 'Currently broadcasting nearby' : 'Location unavailable'}
            </span>
          </div>
          {user?.avgRating ? (
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= Math.round(user.avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/30'}`}
                />
              ))}
              <span className="text-white ml-1">
                ({user.avgRating} · {user.reviewCount} review{user.reviewCount === 1 ? '' : 's'})
              </span>
            </div>
          ) : (
            <p className="text-white/70 mt-2 text-sm">New here — no reviews yet</p>
          )}
        </div>
      </div>

      {/* Stats Card */}
      <Card className="mx-4 -mt-8 relative z-10 p-4">
        <div className={`grid text-center ${matchInfo ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {matchInfo && (
            <div>
              <p className="text-2xl font-bold text-[#DC2626]">{matchInfo.compatibilityScore}%</p>
              <p className="text-sm text-[#94A3B8]">Match</p>
            </div>
          )}
          <div>
            <p className="text-2xl font-bold text-[#DC2626]">{user?.activitiesCount ?? 0}</p>
            <p className="text-sm text-[#94A3B8]">Activities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#DC2626]">{user?.reviewCount ?? 0}</p>
            <p className="text-sm text-[#94A3B8]">Reviews</p>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="mx-4 mt-4 p-4">
        <h3 className="font-bold text-white mb-2">About</h3>
        <p className="text-[#94A3B8]">
          {user?.bio || `${user?.name || 'This person'} hasn't added a bio yet.`}
        </p>
      </Card>

      {/* Activities */}
      {user?.activities?.length > 0 && (
        <Card className="mx-4 mt-4 p-4">
          <h3 className="font-bold text-white mb-3">Activities</h3>
          <div className="flex flex-wrap gap-2">
            {user.activities.map((activity) => {
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
      )}

      {/* Availability */}
      {(user?.preferredDays?.length > 0 || user?.preferredTimes) && (
        <Card className="mx-4 mt-4 p-4">
          <h3 className="font-bold text-white mb-3">Availability</h3>
          {user?.preferredDays?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {user.preferredDays.slice(0, 3).map((day) => (
                <div key={day} className="bg-[#DC2626]/15 text-[#DC2626] px-3 py-1 rounded-full text-sm">
                  {day}
                </div>
              ))}
            </div>
          )}
          {user?.preferredTimes && (
            <p className="text-sm text-[#94A3B8] mt-2">{user.preferredTimes}</p>
          )}
        </Card>
      )}

      {/* Reviews */}
      <Card className="mx-4 mt-4 p-4">
        <h3 className="font-bold text-white mb-3">Recent Reviews</h3>
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="border-b border-white/10 pb-3 last:border-0">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-white/10 text-xs">
                      {review.reviewer?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-white">{review.reviewer?.name || 'Anonymous'}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-[#3A4052]'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.reviewText && (
                  <p className="text-sm text-[#94A3B8] mt-1">{review.reviewText}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#94A3B8] text-sm">No reviews yet</p>
        )}
      </Card>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#12151E]/95 backdrop-blur-xl border-t border-white/10 p-4 flex gap-3">
        <Button 
          variant="outline"
          className="flex-1 py-6 border-[#DC2626] text-[#DC2626]"
          onClick={() => router.push(`/messages/${userId}`)}
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Message
        </Button>
        <Button 
          className="flex-1 py-6 bg-[#DC2626] hover:bg-[#B91C1C]"
          onClick={handleConnect}
        >
          Connect
        </Button>
      </div>
    </div>
  );
}

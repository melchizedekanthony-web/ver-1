'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Star, MessageCircle, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function ActivityPage() {
  const router = useRouter();
  const params = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityName, setActivityName] = useState('');

  useEffect(() => {
    const activityMap = {
      'hiking': 'Hiking',
      'coffee': 'Coffee',
      'cinema': 'Cinema',
      'concert': 'Concert',
      'gym': 'Gym',
      'dining': 'Dining',
      'shopping': 'Shopping',
      'cycling': 'Cycling',
      'reading': 'Reading',
      'wellness': 'Wellness'
    };
    setActivityName(activityMap[params.id] || params.id);
    fetchNearbyPeople();
  }, [params.id]);

  const fetchNearbyPeople = async () => {
    try {
      const token = localStorage.getItem('fittr_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/matches', {
        credentials: 'include',
        headers
      });
      const data = await res.json();
      if (data.matches) {
        // Add mock "available now" status
        const enriched = data.matches.map(m => ({
          ...m,
          availableNow: Math.random() > 0.5,
          lastActive: Math.floor(Math.random() * 30) + 1
        }));
        setMatches(enriched);
      }
    } catch (error) {
      console.error('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConnect = (match) => {
    toast.success(`Connection request sent to ${match.name}!`);
    // In real app: send push notification to the other user
  };

  const handleStartActivity = (match) => {
    toast.success(`Starting ${activityName} with ${match.name}!`);
    router.push('/sessions');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{activityName}</h1>
            <p className="text-sm text-gray-600">People nearby looking to connect</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-[#4a3aff]">{matches.length}</div>
            <div className="text-xs text-gray-600">Available</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{matches.filter(m => m.availableNow).length}</div>
            <div className="text-xs text-gray-600">Online Now</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">2.3 mi</div>
            <div className="text-xs text-gray-600">Avg Distance</div>
          </Card>
        </div>

        {/* Available Now Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Available Right Now
          </h2>
          <div className="space-y-3">
            {matches.filter(m => m.availableNow).map((match) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 border-2 border-green-500">
                      <AvatarFallback className="bg-[#4a3aff] text-white text-xl">
                        {match.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{match.name}</h3>
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div>
                          Online
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {match.distance} mi away
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {match.averageRating || '5.0'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Fitness Level {match.fitnessLevel}/10 • {match.compatibilityScore}% match
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          className="flex-1 bg-[#4a3aff] hover:bg-[#3a2aef]"
                          onClick={() => handleStartActivity(match)}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Go Now
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickConnect(match)}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Other People */}
        <div>
          <h2 className="text-lg font-bold mb-3">Other People Nearby</h2>
          <div className="space-y-3">
            {matches.filter(m => !m.availableNow).map((match) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-gray-200 text-gray-700 text-xl">
                        {match.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{match.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {match.lastActive}m ago
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {match.distance} mi away
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {match.averageRating || '5.0'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Fitness Level {match.fitnessLevel}/10 • {match.compatibilityScore}% match
                      </p>
                      <Button 
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleQuickConnect(match)}
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-600">Finding people nearby...</div>
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600">No one available for {activityName} right now</div>
            <Button className="mt-4" onClick={() => router.push('/dashboard')}>Back to Activities</Button>
          </div>
        )}
      </main>
    </div>
  );
}
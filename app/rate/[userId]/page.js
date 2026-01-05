'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Star, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getUser, fetchWithAuth } from '@/lib/auth';

export default function RatePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;

  const [user, setUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [categories, setCategories] = useState({
    punctual: false,
    friendly: false,
    knowledgeable: false,
    fun: false
  });

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    fetchTargetUser();
  }, []);

  const fetchTargetUser = async () => {
    try {
      const res = await fetchWithAuth('/api/matches');
      const data = await res.json();
      if (data.matches) {
        const found = data.matches.find(m => m.id === userId);
        setTargetUser(found || data.matches[0]);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      const res = await fetchWithAuth('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          targetId: targetUser?.id || userId,
          targetType: 'user',
          rating,
          categories: Object.keys(categories).filter(k => categories[k]),
          reviewText: review
        })
      });

      if (res.ok) {
        toast.success('Review submitted! Thank you for your feedback.');
        router.push('/connections');
      } else {
        toast.error('Failed to submit review');
      }
    } catch (error) {
      console.error('Submit review error:', error);
      toast.error('Failed to submit review');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Rate Experience</h1>
      </header>

      <div className="p-4">
        {/* User Card */}
        {targetUser && (
          <Card className="p-6 text-center mb-6">
            <Avatar className="w-20 h-20 mx-auto border-2 border-[#1a1aff]">
              <AvatarImage src={targetUser.profilePhoto} />
              <AvatarFallback className="bg-[#4a3aff] text-white text-xl">
                {targetUser.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold mt-4">{targetUser.name}</h2>
            <p className="text-gray-500">How was your experience?</p>
          </Card>
        )}

        {/* Star Rating */}
        <Card className="p-6 mb-4">
          <h3 className="font-semibold mb-4 text-center">Overall Rating</h3>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1"
              >
                <Star 
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  }`} 
                />
              </button>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-2">
            {rating === 0 ? 'Tap to rate' : `${rating} star${rating > 1 ? 's' : ''}`}
          </p>
        </Card>

        {/* Categories */}
        <Card className="p-4 mb-4">
          <h3 className="font-semibold mb-3">What stood out?</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(categories).map((category) => (
              <button
                key={category}
                onClick={() => setCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categories[category]
                    ? 'bg-[#1a1aff] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Review Text */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3">Write a review (optional)</h3>
          <Textarea
            placeholder="Share your experience..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
          />
        </Card>

        {/* Submit */}
        <Button 
          className="w-full py-6 bg-[#1a1aff] hover:bg-[#1515dd] text-lg font-semibold"
          onClick={handleSubmit}
        >
          Submit Review
        </Button>
      </div>
    </div>
  );
}

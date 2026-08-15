'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Star, ArrowLeft, Camera, Video, X, Share2, User, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { getUser, fetchWithAuth } from '@/lib/auth';

export default function RatePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [categories, setCategories] = useState({
    punctual: false,
    friendly: false,
    knowledgeable: false,
    fun: false,
    safe: false,
    encouraging: false
  });
  
  // Media State
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  
  // Sharing Options — both actually wired to real endpoints below. (A third
  // "share to social media" toggle used to exist here but only ever
  // console.logged; cut rather than shipped as a button that lies about
  // what it does. Real social sharing needs OAuth apps registered with each
  // platform, which isn't something to fake client-side.)
  const [shareToProfile, setShareToProfile] = useState(true);
  const [shareToFeed, setShareToFeed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    fetchTargetUser();
  }, []);

  // The SPECIFIC person this rating is about, by id — not a lookup into
  // /api/matches with a fallback to "the first match". Getting this wrong
  // here is especially bad: it would attach a real rating/review to the
  // WRONG person's trust score.
  const fetchTargetUser = async () => {
    try {
      const res = await fetchWithAuth(`/api/users/${userId}`);
      const data = await res.json();
      if (res.ok && data.user) {
        setTargetUser(data.user);
      } else {
        toast.error("Couldn't load this person's info");
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be under 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 50MB for video)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video must be under 50MB');
      return;
    }

    // Check video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 30) {
        toast.error('Video must be 30 seconds or less');
        return;
      }
      
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    };
    video.src = URL.createObjectURL(file);
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);

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

      if (!res.ok) {
        toast.error('Failed to submit review');
        return;
      }

      // These two toggles are genuinely wired, unlike the old "share to
      // social media" one — best-effort, and neither blocks the review
      // itself from having already been saved above.
      const followUps = [];
      if (shareToProfile && photos.length > 0) {
        followUps.push(
          ...photos.map(photo =>
            fetchWithAuth('/api/profile/media', {
              method: 'POST',
              body: JSON.stringify({
                mediaUrl: photo.preview,
                mediaType: 'photo',
                isPrivate: false,
                caption: review || `Meetup with ${targetUser?.name || 'a WannaGo match'}`
              })
            }).catch((error) => console.error('Failed to save photo to profile:', error))
          )
        );
      }
      if (shareToFeed) {
        followUps.push(
          fetchWithAuth('/api/feed', {
            method: 'POST',
            body: JSON.stringify({
              contentType: 'review',
              content: review || `Just had a ${rating}-star experience with ${targetUser?.name || 'a WannaGo match'}!`,
              mediaUrls: []
            })
          }).catch((error) => console.error('Failed to post to feed:', error))
        );
      }
      if (followUps.length > 0) {
        await Promise.all(followUps);
      }

      toast.success('Review submitted! Thank you for your feedback.');
      router.push('/connections');
    } catch (error) {
      console.error('Submit review error:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] pb-8">
      {/* Header */}
      <header className="bg-[#DC2626] px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Rate Experience</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* User Card */}
        {targetUser && (
          <Card className="p-6 text-center">
            <Avatar className="w-20 h-20 mx-auto border-4 border-[#DC2626]">
              <AvatarImage src={targetUser.profilePhoto} />
              <AvatarFallback className="bg-[#DC2626] text-white text-xl">
                {targetUser.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold mt-4">{targetUser.name}</h2>
            <p className="text-[#94A3B8]">How was your experience?</p>
          </Card>
        )}

        {/* Star Rating */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-center">Overall Rating</h3>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star 
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-[#3A4052]'
                  }`} 
                />
              </button>
            ))}
          </div>
          <p className="text-center text-[#94A3B8] mt-2">
            {rating === 0 ? 'Tap to rate' : `${rating} star${rating > 1 ? 's' : ''}`}
          </p>
        </Card>

        {/* Categories */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">What stood out?</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(categories).map((category) => (
              <button
                key={category}
                onClick={() => setCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  categories[category]
                    ? 'bg-[#DC2626] text-white'
                    : 'bg-white/5 text-[#E2E8F0] hover:bg-white/15'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </Card>

        {/* Review Text */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Write a review</h3>
          <Textarea
            placeholder="Share your experience..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </Card>

        {/* Media Upload */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Add Photos & Video</h3>
          
          {/* Photo Upload */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-5 h-5 text-[#94A3B8]" />
              <span className="text-sm text-[#94A3B8]">Photos (max 5)</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {photos.map((photo) => (
                <div key={photo.id} className="relative w-20 h-20">
                  <img 
                    src={photo.preview} 
                    alt="Upload" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button 
                    onClick={() => removePhoto(photo.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button 
                  onClick={() => photoInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-white/15 rounded-lg flex items-center justify-center hover:border-[#DC2626] transition-colors"
                >
                  <Camera className="w-6 h-6 text-[#94A3B8]" />
                </button>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Video Upload */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-5 h-5 text-[#94A3B8]" />
              <span className="text-sm text-[#94A3B8]">Video (max 30 seconds)</span>
            </div>
            {videoPreview ? (
              <div className="relative">
                <video 
                  src={videoPreview} 
                  controls 
                  className="w-full rounded-lg max-h-48"
                />
                <button 
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => videoInputRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-white/15 rounded-lg flex items-center justify-center hover:border-[#DC2626] transition-colors"
              >
                <div className="text-center">
                  <Video className="w-8 h-8 text-[#94A3B8] mx-auto mb-1" />
                  <span className="text-sm text-[#94A3B8]">Add video clip</span>
                </div>
              </button>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </div>
        </Card>

        {/* Sharing Options */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share This Experience
          </h3>
          
          <div className="space-y-4">
            {/* Profile Share */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#DC2626]" />
                </div>
                <div>
                  <p className="font-medium text-sm">Save to Profile</p>
                  <p className="text-xs text-[#94A3B8]">Add to your activity gallery</p>
                </div>
              </div>
              <Switch checked={shareToProfile} onCheckedChange={setShareToProfile} />
            </div>

            {/* App Feed Share */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Post to WannaGo Feed</p>
                  <p className="text-xs text-[#94A3B8]">Share with the community</p>
                </div>
              </div>
              <Switch checked={shareToFeed} onCheckedChange={setShareToFeed} />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <Button 
          className="w-full py-6 bg-[#DC2626] hover:bg-[#B91C1C] text-lg font-semibold"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
}

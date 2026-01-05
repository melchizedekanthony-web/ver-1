'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Star, ArrowLeft, Camera, Video, X, Share2, Instagram, Facebook, Twitter, User, Globe } from 'lucide-react';
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
  
  // Sharing Options
  const [shareToProfile, setShareToProfile] = useState(true);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [shareToSocial, setShareToSocial] = useState(false);
  const [selectedSocialPlatforms, setSelectedSocialPlatforms] = useState([]);
  
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

  const toggleSocialPlatform = (platform) => {
    setSelectedSocialPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      // In production, you'd upload media to a storage service first
      const mediaUrls = {
        photos: photos.map(p => p.preview), // In prod: actual uploaded URLs
        video: videoPreview // In prod: actual uploaded URL
      };

      const res = await fetchWithAuth('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          targetId: targetUser?.id || userId,
          targetType: 'user',
          rating,
          categories: Object.keys(categories).filter(k => categories[k]),
          reviewText: review,
          media: mediaUrls,
          sharing: {
            profile: shareToProfile,
            feed: shareToFeed,
            social: shareToSocial,
            platforms: selectedSocialPlatforms
          }
        })
      });

      if (res.ok) {
        // Handle social sharing
        if (shareToSocial && selectedSocialPlatforms.length > 0) {
          toast.success('Review submitted! Opening social share...');
          // In production, integrate with actual social media APIs
          selectedSocialPlatforms.forEach(platform => {
            console.log(`Sharing to ${platform}`);
          });
        } else {
          toast.success('Review submitted! Thank you for your feedback.');
        }
        
        router.push('/connections');
      } else {
        toast.error('Failed to submit review');
      }
    } catch (error) {
      console.error('Submit review error:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialPlatforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
    { id: 'twitter', name: 'X/Twitter', icon: Twitter, color: 'bg-black' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      {/* Header */}
      <header className="bg-[#2B2D9E] px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Rate Experience</h1>
      </header>

      <div className="p-4 space-y-4">
        {/* User Card */}
        {targetUser && (
          <Card className="p-6 text-center">
            <Avatar className="w-20 h-20 mx-auto border-4 border-[#2B2D9E]">
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
        <Card className="p-4">
          <h3 className="font-semibold mb-3">What stood out?</h3>
          <div className="flex flex-wrap gap-2">
            {Object.keys(categories).map((category) => (
              <button
                key={category}
                onClick={() => setCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  categories[category]
                    ? 'bg-[#2B2D9E] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <Camera className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">Photos (max 5)</span>
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
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-[#2B2D9E] transition-colors"
                >
                  <Camera className="w-6 h-6 text-gray-400" />
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
              <Video className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">Video (max 30 seconds)</span>
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
                className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-[#2B2D9E] transition-colors"
              >
                <div className="text-center">
                  <Video className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <span className="text-sm text-gray-500">Add video clip</span>
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
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Save to Profile</p>
                  <p className="text-xs text-gray-500">Add to your activity gallery</p>
                </div>
              </div>
              <Switch checked={shareToProfile} onCheckedChange={setShareToProfile} />
            </div>

            {/* App Feed Share */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Post to WannaGo Feed</p>
                  <p className="text-xs text-gray-500">Share with the community</p>
                </div>
              </div>
              <Switch checked={shareToFeed} onCheckedChange={setShareToFeed} />
            </div>

            {/* Social Media Share */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Share to Social Media</p>
                  <p className="text-xs text-gray-500">Post to your social accounts</p>
                </div>
              </div>
              <Switch checked={shareToSocial} onCheckedChange={setShareToSocial} />
            </div>

            {/* Social Platform Selection */}
            {shareToSocial && (
              <div className="ml-13 pl-4 border-l-2 border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Select platforms:</p>
                <div className="flex gap-3">
                  {socialPlatforms.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedSocialPlatforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        onClick={() => toggleSocialPlatform(platform.id)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isSelected 
                            ? `${platform.color} text-white scale-110` 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Submit */}
        <Button 
          className="w-full py-6 bg-[#2B2D9E] hover:bg-[#1f2175] text-lg font-semibold"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  User, Calendar, Bell, Users, Settings, LogOut, ChevronRight,
  Edit, Shield, Star, Camera, Video, Plus, X, Globe, Lock,
  Instagram, Facebook, Twitter, Share2, Activity, MapPin, Award, Flame, Zap, Compass
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser, signOut, fetchWithAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Status & Activity
  const [currentStatus, setCurrentStatus] = useState('Available');
  const [currentActivity, setCurrentActivity] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Media Gallery
  const [mediaGallery, setMediaGallery] = useState([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  
  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: true,
    showLocation: true,
    showActivity: true,
    allowMessages: true
  });

  const statusOptions = [
    { id: 'available', label: 'Available', color: 'bg-[#DC2626]' },
    { id: 'busy', label: 'Busy', color: 'bg-[#94A3B8]' },
    { id: 'away', label: 'Away', color: 'bg-[#FBBF24]' },
  ];

  const activityOptions = [
    'Looking for Trail Run buddy',
    'Open for Coffee & Co-working',
    'Training for Marathon',
    'New to the Area',
    'Weekend Outdoor Explorer'
  ];

  const achievements = [
    { label: "Trail Runner", icon: Flame, color: "text-[#DC2626]" },
    { label: "Top Partner", icon: Award, color: "text-[#FBBF24]" },
    { label: "50+ Meetups", icon: Zap, color: "text-[#DC2626]" },
  ];

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    fetchProfile();
    fetchMediaGallery();
    fetchProfileStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetchWithAuth('/api/profile');
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMediaGallery = async () => {
    try {
      const res = await fetchWithAuth('/api/profile/media');
      const data = await res.json();
      if (data.media) {
        setMediaGallery(data.media.map(m => ({
          id: m.id,
          type: m.mediaType,
          url: m.mediaUrl,
          caption: m.caption,
          isPublic: !m.isPrivate,
          date: new Date(m.createdAt)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  };

  const fetchProfileStatus = async () => {
    try {
      const res = await fetchWithAuth('/api/profile');
      const data = await res.json();
      if (data.profile) {
        setCurrentStatus(data.profile.activityStatus || 'Available');
        setCurrentActivity(data.profile.currentActivity || '');
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const handleMediaUpload = async (e, type) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const mediaUrl = event.target.result;
          
          const res = await fetchWithAuth('/api/profile/media', {
            method: 'POST',
            body: JSON.stringify({
              mediaUrl,
              mediaType: type,
              isPrivate: false,
              caption: ''
            })
          });
          
          const data = await res.json();
          if (data.media) {
            setMediaGallery(prev => [...prev, {
              id: data.media.id,
              type,
              url: mediaUrl,
              caption: '',
              isPublic: true,
              date: new Date()
            }]);
            toast.success(`${type === 'photo' ? 'Photo' : 'Video'} added to activity gallery!`);
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast.error('Failed to upload media');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateMediaPrivacy = async (mediaId, isPublic) => {
    setMediaGallery(prev => prev.map(m => 
      m.id === mediaId ? { ...m, isPublic } : m
    ));
    toast.success(isPublic ? 'Media set to public' : 'Media set to private');
  };

  const deleteMedia = async (mediaId) => {
    try {
      await fetchWithAuth(`/api/profile/media/${mediaId}`, {
        method: 'DELETE'
      });
      setMediaGallery(prev => prev.filter(m => m.id !== mediaId));
      setSelectedMedia(null);
      toast.success('Media deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete media');
    }
  };

  const updateStatus = async (status, activity) => {
    try {
      await fetchWithAuth('/api/profile/status', {
        method: 'POST',
        body: JSON.stringify({ status, activity })
      });
      setCurrentStatus(status);
      setCurrentActivity(activity);
      setShowStatusModal(false);
      toast.success('Radar status updated!');
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update status');
    }
  };

  const menuItems = [
    { icon: Compass, label: 'Broadcast Status on Radar', action: () => setShowStatusModal(true) },
    { icon: Calendar, label: 'Activity Calendar & RSVP History', path: '/calendar' },
    { icon: Bell, label: 'Radar Alerts & Meetup Requests', path: '/alerts' },
    { icon: Users, label: 'My Activity Network', path: '/connections' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[#94A3B8] text-sm">Loading user profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white pb-28">
      <Header user={user} title="MY PROFILE" />

      {/* Main Profile Header Card */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="dark-glass-card p-6 text-center border-t-2 border-[#DC2626] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#DC2626]/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative inline-block mb-3">
            <Avatar className="w-24 h-24 mx-auto border-2 border-[#DC2626] shadow-[0_0_20px_rgba(220,38,38,0.5)]">
              <AvatarImage src={profile?.profilePhoto} />
              <AvatarFallback className="bg-[#1A1E2B] text-white text-2xl font-bold">
                {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[#0A0C10] ${
              statusOptions.find(s => s.label === currentStatus)?.color || 'bg-[#DC2626]'
            } animate-pulse`}></div>
          </div>
          
          <h2 className="text-2xl font-black text-white tracking-tight">{profile?.name || user?.name}</h2>
          <p className="text-xs text-[#94A3B8] font-medium mt-0.5">{profile?.email || user?.email}</p>
          
          {/* Status & Activity Tag */}
          <div className="mt-3 flex flex-col items-center gap-1.5">
            <span className="text-xs font-bold text-[#FBBF24] bg-[#FBBF24]/10 border border-[#FBBF24]/30 px-3 py-1 rounded-full shadow-sm">
              {currentStatus} {currentActivity && `• ${currentActivity}`}
            </span>
          </div>
          
          {/* Ratings & Achievements */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {[1,2,3,4,5].map((star) => (
              <Star 
                key={star} 
                className={`w-4 h-4 ${star <= 5 ? 'text-[#FBBF24] fill-[#FBBF24]' : 'text-white/20'}`} 
              />
            ))}
            <span className="text-xs font-bold text-white ml-1">5.0 (42 Meetups)</span>
          </div>

          {/* Achievement Badges */}
          <div className="flex justify-center gap-2 mt-4 pt-3 border-t border-white/5">
            {achievements.map((ach, idx) => {
              const Icon = ach.icon;
              return (
                <div key={idx} className="flex items-center gap-1 bg-[#1A1E2B] border border-white/10 px-2.5 py-1 rounded-full">
                  <Icon className={`w-3.5 h-3.5 ${ach.color}`} />
                  <span className="text-[10px] font-bold text-white">{ach.label}</span>
                </div>
              );
            })}
          </div>

          {/* Stats Dashboard Grid */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/10">
            <div className="bg-[#1A1E2B]/80 p-3 rounded-xl border border-white/5">
              <p className="text-xl font-black text-[#DC2626]">34</p>
              <p className="text-[11px] text-[#94A3B8] font-semibold">Activities</p>
            </div>
            <div className="bg-[#1A1E2B]/80 p-3 rounded-xl border border-white/5">
              <p className="text-xl font-black text-[#FBBF24]">28</p>
              <p className="text-[11px] text-[#94A3B8] font-semibold">Connections</p>
            </div>
            <div className="bg-[#1A1E2B]/80 p-3 rounded-xl border border-white/5">
              <p className="text-xl font-black text-white">{mediaGallery.length}</p>
              <p className="text-[11px] text-[#94A3B8] font-semibold">Gallery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Media Gallery Section */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="dark-glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#DC2626]" />
              Activity Photos & Moments
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => photoInputRef.current?.click()}
                className="p-2 bg-[#1A1E2B] hover:bg-white/10 rounded-full border border-white/10 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={() => videoInputRef.current?.click()}
                className="p-2 bg-[#1A1E2B] hover:bg-white/10 rounded-full border border-white/10 transition-colors"
              >
                <Video className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleMediaUpload(e, 'photo')}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleMediaUpload(e, 'video')}
            className="hidden"
          />

          {/* Gallery Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {mediaGallery.slice(0, 6).map((media) => (
              <div 
                key={media.id} 
                className="relative aspect-square cursor-pointer group rounded-xl overflow-hidden border border-white/10"
                onClick={() => setSelectedMedia(media)}
              >
                {media.type === 'photo' ? (
                  <img src={media.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <video src={media.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                )}
                <div className="absolute top-1.5 right-1.5 p-1 bg-black/70 rounded-full backdrop-blur-sm">
                  {media.isPublic ? (
                    <Globe className="w-3 h-3 text-white" />
                  ) : (
                    <Lock className="w-3 h-3 text-[#FBBF24]" />
                  )}
                </div>
              </div>
            ))}
            
            <button 
              onClick={() => photoInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-white/20 bg-[#1A1E2B]/50 rounded-xl flex items-center justify-center hover:border-[#DC2626] transition-colors"
            >
              <Plus className="w-6 h-6 text-[#94A3B8]" />
            </button>
          </div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-2.5">
        {menuItems.map((item, index) => (
          <div 
            key={index}
            className="dark-glass-card p-4 flex items-center gap-3 cursor-pointer hover:border-[#DC2626]/40 transition-all"
            onClick={() => item.action ? item.action() : router.push(item.path)}
          >
            <div className="w-10 h-10 rounded-xl bg-[#DC2626]/15 border border-[#DC2626]/40 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-[#DC2626]" />
            </div>
            <span className="flex-1 font-bold text-sm text-white">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </div>
        ))}
      </div>

      {/* Edit Preferences & Logout */}
      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-3">
        <Button 
          className="w-full py-6 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-2xl shadow-[0_0_25px_rgba(220,38,38,0.5)] border border-red-500/30"
          onClick={() => router.push('/profile/edit')}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile & Activity Preferences
        </Button>
        
        <Button 
          variant="outline"
          className="w-full py-6 border-white/10 bg-[#1A1E2B] text-red-400 hover:bg-red-500/10 font-bold rounded-2xl"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out of Account
        </Button>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-[#12151E] border border-white/10 text-white rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-white">Broadcast Status</h3>
              <button onClick={() => setShowStatusModal(false)}>
                <X className="w-5 h-5 text-[#94A3B8]" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <p className="text-xs font-bold text-[#94A3B8] uppercase">Availability</p>
              <div className="grid grid-cols-3 gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setCurrentStatus(option.label)}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      currentStatus === option.label
                        ? 'border-[#DC2626] bg-[#DC2626]/20 text-white'
                        : 'border-white/10 bg-[#1A1E2B] text-[#94A3B8]'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${option.color}`}></div>
                    <span className="text-xs font-bold">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs font-bold text-[#94A3B8] uppercase">Activity Message</p>
              <div className="space-y-2">
                {activityOptions.map((activity) => (
                  <button
                    key={activity}
                    onClick={() => setCurrentActivity(activity)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      currentActivity === activity
                        ? 'border-[#DC2626] bg-[#DC2626]/15 text-white'
                        : 'border-white/10 bg-[#1A1E2B] text-[#94A3B8]'
                    }`}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl h-12 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              onClick={() => updateStatus(currentStatus, currentActivity)}
            >
              Save & Broadcast Status
            </Button>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
}


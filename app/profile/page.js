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
  Instagram, Facebook, Twitter, Share2, Activity, MapPin
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
    { id: 'available', label: 'Available', color: 'bg-green-500' },
    { id: 'busy', label: 'Busy', color: 'bg-red-500' },
    { id: 'away', label: 'Away', color: 'bg-yellow-500' },
    { id: 'do_not_disturb', label: 'Do Not Disturb', color: 'bg-gray-500' }
  ];

  const activityOptions = [
    'Looking for hiking buddy',
    'Open to coffee meetups',
    'Training for marathon',
    'New to the area',
    'Weekend warrior'
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
          // In production, upload to cloud storage first, then save URL
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
            toast.success(`${type === 'photo' ? 'Photo' : 'Video'} added to gallery!`);
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

  const shareToSocial = (platform) => {
    toast.success(`Sharing to ${platform}...`);
    // In production, integrate with social media APIs
  };

  const updateStatus = (status, activity) => {
    setCurrentStatus(status);
    setCurrentActivity(activity);
    setShowStatusModal(false);
    toast.success('Status updated!');
    // In production, sync to backend
  };

  const menuItems = [
    { icon: User, label: 'Set Status (e.g. Available)', action: () => setShowStatusModal(true) },
    { icon: Calendar, label: 'Availability & Calendar', path: '/calendar' },
    { icon: Bell, label: 'Alerts & Requests', path: '/alerts' },
    { icon: Users, label: 'My Connections', path: '/connections' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header user={user} title="MY PROFILE" />

      {/* Profile Card */}
      <Card className="mx-4 mt-4 p-6 text-center">
        <div className="relative inline-block">
          <Avatar className="w-24 h-24 mx-auto border-4 border-[#2B2D9E]">
            <AvatarImage src={profile?.profilePhoto} />
            <AvatarFallback className="bg-[#4a3aff] text-white text-2xl">
              {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {/* Status indicator */}
          <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white ${
            statusOptions.find(s => s.label === currentStatus)?.color || 'bg-green-500'
          }`}></div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mt-4">{profile?.name || user?.name}</h2>
        <p className="text-gray-500">{profile?.email || user?.email}</p>
        
        {/* Current Status & Activity */}
        <div className="mt-3 space-y-1">
          <Badge className={`${statusOptions.find(s => s.label === currentStatus)?.color} text-white`}>
            {currentStatus}
          </Badge>
          {currentActivity && (
            <p className="text-sm text-[#2B2D9E] font-medium">{currentActivity}</p>
          )}
        </div>
        
        {/* Rating */}
        <div className="flex items-center justify-center gap-1 mt-3">
          {[1,2,3,4,5].map((star) => (
            <Star 
              key={star} 
              className={`w-5 h-5 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
            />
          ))}
          <span className="text-gray-600 ml-1">(4.0)</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-2xl font-bold text-[#2B2D9E]">24</p>
            <p className="text-sm text-gray-500">Activities</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#2B2D9E]">18</p>
            <p className="text-sm text-gray-500">Connections</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#2B2D9E]">{mediaGallery.length}</p>
            <p className="text-sm text-gray-500">Media</p>
          </div>
        </div>
      </Card>

      {/* Media Gallery Section */}
      <Card className="mx-4 mt-4 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Activity Gallery
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => photoInputRef.current?.click()}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={() => videoInputRef.current?.click()}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <Video className="w-4 h-4 text-gray-600" />
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
        <div className="grid grid-cols-3 gap-2">
          {mediaGallery.slice(0, 6).map((media) => (
            <div 
              key={media.id} 
              className="relative aspect-square cursor-pointer group"
              onClick={() => setSelectedMedia(media)}
            >
              {media.type === 'photo' ? (
                <img src={media.url} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <video src={media.url} className="w-full h-full object-cover rounded-lg" />
              )}
              {/* Privacy indicator */}
              <div className="absolute top-1 right-1 p-1 bg-black/50 rounded-full">
                {media.isPublic ? (
                  <Globe className="w-3 h-3 text-white" />
                ) : (
                  <Lock className="w-3 h-3 text-white" />
                )}
              </div>
              {/* Video indicator */}
              {media.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Add more button */}
          <button 
            onClick={() => photoInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-[#2B2D9E] transition-colors"
          >
            <Plus className="w-8 h-8 text-gray-400" />
          </button>
        </div>

        {mediaGallery.length > 6 && (
          <Button variant="ghost" className="w-full mt-2 text-[#2B2D9E]">
            View All ({mediaGallery.length})
          </Button>
        )}
      </Card>

      {/* Privacy Settings */}
      <Card className="mx-4 mt-4 p-4">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy Settings
        </h3>
        <div className="space-y-3">
          {[
            { key: 'profilePublic', label: 'Public Profile', desc: 'Anyone can view your profile' },
            { key: 'showLocation', label: 'Show Location', desc: 'Display your area to others' },
            { key: 'showActivity', label: 'Show Activity Status', desc: 'Others can see your current activity' },
            { key: 'allowMessages', label: 'Allow Messages', desc: 'Receive messages from anyone' },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{setting.label}</p>
                <p className="text-xs text-gray-500">{setting.desc}</p>
              </div>
              <Switch 
                checked={privacySettings[setting.key]}
                onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, [setting.key]: checked }))}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Menu Items */}
      <div className="mx-4 mt-4 space-y-2">
        {menuItems.map((item, index) => (
          <Card 
            key={index}
            className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
            onClick={() => item.action ? item.action() : router.push(item.path)}
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-[#2B2D9E]" />
            </div>
            <span className="flex-1 font-medium text-gray-700">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Card>
        ))}
      </div>

      {/* Edit & Logout */}
      <div className="mx-4 mt-6 space-y-3">
        <Button 
          variant="outline"
          className="w-full py-6 border-[#2B2D9E] text-[#2B2D9E]"
          onClick={() => router.push('/profile/edit')}
        >
          <Edit className="w-5 h-5 mr-2" />
          EDIT PREFERENCES
        </Button>
        
        <Button 
          variant="outline"
          className="w-full py-6 border-red-500 text-red-500 hover:bg-red-50"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Set Your Status</h3>
              <button onClick={() => setShowStatusModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <p className="text-sm font-medium text-gray-700">Status</p>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setCurrentStatus(option.label)}
                    className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                      currentStatus === option.label
                        ? 'border-[#2B2D9E] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-gray-700">Activity Message</p>
              <div className="space-y-2">
                {activityOptions.map((activity) => (
                  <button
                    key={activity}
                    onClick={() => setCurrentActivity(activity)}
                    className={`w-full p-3 rounded-lg border-2 text-left text-sm transition-all ${
                      currentActivity === activity
                        ? 'border-[#2B2D9E] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {activity}
                  </button>
                ))}
              </div>
              <Input 
                placeholder="Or type your own..."
                value={currentActivity}
                onChange={(e) => setCurrentActivity(e.target.value)}
              />
            </div>

            <Button 
              className="w-full bg-[#2B2D9E]"
              onClick={() => updateStatus(currentStatus, currentActivity)}
            >
              Update Status
            </Button>
          </Card>
        </div>
      )}

      {/* Media Detail Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <button 
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 text-white"
            >
              <X className="w-8 h-8" />
            </button>

            {selectedMedia.type === 'photo' ? (
              <img src={selectedMedia.url} alt="" className="w-full rounded-lg" />
            ) : (
              <video src={selectedMedia.url} controls className="w-full rounded-lg" />
            )}

            <div className="mt-4 bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {selectedMedia.isPublic ? (
                    <Badge className="bg-green-500">Public</Badge>
                  ) : (
                    <Badge className="bg-gray-500">Private</Badge>
                  )}
                </div>
                <Switch 
                  checked={selectedMedia.isPublic}
                  onCheckedChange={(checked) => updateMediaPrivacy(selectedMedia.id, checked)}
                />
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {selectedMedia.caption || 'No caption'}
              </p>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => shareToSocial('instagram')}
                >
                  <Instagram className="w-4 h-4 mr-1" /> Share
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => shareToSocial('facebook')}
                >
                  <Facebook className="w-4 h-4 mr-1" /> Share
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-500 border-red-500"
                  onClick={() => deleteMedia(selectedMedia.id)}
                >
                  <X className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

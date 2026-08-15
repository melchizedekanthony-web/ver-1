'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Phone } from 'lucide-react';
import { getUser, fetchWithAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sharePhone, setSharePhone] = useState(false);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetchWithAuth('/api/profile');
      const data = await res.json();
      if (data.profile) {
        setName(data.profile.name || '');
        setPhone(data.profile.phone || '');
        setSharePhone(!!data.profile.sharePhoneWithMatches);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth('/api/profile/basic', {
        method: 'POST',
        body: JSON.stringify({ name, phone, sharePhoneWithMatches: sharePhone })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Could not save changes');
        return;
      }
      toast.success('Profile updated');
      router.push('/profile');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[#94A3B8] text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white pb-24">
      <header className="bg-[#12151E]/95 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3 max-w-2xl">
          <button onClick={() => router.push('/profile')} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Edit Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="dark-glass-card p-5 space-y-4">
          <div>
            <Label htmlFor="name" className="text-[#94A3B8] text-xs font-bold uppercase">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1.5 bg-[#1A1E2B] border-white/10 text-white placeholder:text-[#94A3B8] focus-visible:ring-[#DC2626]"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-[#94A3B8] text-xs font-bold uppercase flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555 123 4567"
              className="mt-1.5 bg-[#1A1E2B] border-white/10 text-white placeholder:text-[#94A3B8] focus-visible:ring-[#DC2626]"
            />
            <p className="text-xs text-[#94A3B8] mt-1.5">
              Self-reported — not verified by WannaGo. Used only for the "Call" button so a confirmed meetup partner can reach you directly.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <p className="text-sm font-semibold text-white">Share with confirmed matches</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">Off by default. When on, a "Call" button appears for people you've matched with.</p>
            </div>
            <Switch checked={sharePhone} onCheckedChange={setSharePhone} />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-6 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-2xl shadow-[0_0_25px_rgba(220,38,38,0.5)]"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </main>
    </div>
  );
}

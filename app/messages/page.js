'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Check, CheckCheck, Compass, Zap } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser, fetchWithAuth } from '@/lib/auth';

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 15000);

    try {
      // Real threads only — a conversation only shows up here once someone
      // has actually sent a message, with the real last message and a real
      // unread count. No invented preview text.
      const res = await fetchWithAuth('/api/conversations');
      const data = await res.json();

      if (data.conversations && Array.isArray(data.conversations)) {
        setConversations(data.conversations.map(c => ({
          ...c,
          lastMessageTime: new Date(c.lastMessageTime)
        })));
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#DC2626] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[#94A3B8] text-sm">Loading activity chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white pb-24">
      <Header user={user} title="MESSAGES" />

      {/* Search Header */}
      <div className="bg-[#12151E] px-4 py-4 border-b border-white/10 sticky top-14 z-20 backdrop-blur-xl">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1A1E2B] border-white/10 text-white placeholder:text-[#94A3B8] rounded-xl h-11 focus-visible:ring-[#DC2626]"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="max-w-2xl mx-auto p-4 space-y-2.5">
        {filteredConversations.map((conversation) => (
          <button
            key={conversation.id}
            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3.5 group ${
              conversation.unread 
                ? 'bg-[#1A1E2B] border-[#DC2626]/40 shadow-[0_0_20px_rgba(220,38,38,0.15)]' 
                : 'bg-[#12151E]/90 border-white/5 hover:border-white/15'
            }`}
            onClick={() => router.push(`/messages/${conversation.id}`)}
          >
            <div className="relative">
              <Avatar className="w-14 h-14 border-2 border-[#DC2626]">
                <AvatarImage src={conversation.profilePhoto} />
                <AvatarFallback className="bg-[#1A1E2B] text-white font-bold">
                  {conversation.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {conversation.online && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#DC2626] rounded-full border-2 border-[#0A0C10] animate-pulse"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-white text-base truncate group-hover:text-[#DC2626] transition-colors">
                  {conversation.name}
                </h3>
                <span className="text-[11px] font-semibold text-[#FBBF24]">{formatTime(conversation.lastMessageTime)}</span>
              </div>
              <p className={`text-xs truncate ${conversation.unread ? 'text-[#E2E8F0] font-bold' : 'text-[#94A3B8]'}`}>
                {conversation.lastMessage}
              </p>
            </div>

            {conversation.unread ? (
              <div className="w-3 h-3 bg-[#DC2626] rounded-full shadow-[0_0_10px_#DC2626] animate-pulse"></div>
            ) : (
              <CheckCheck className="w-4 h-4 text-[#94A3B8]" />
            )}
          </button>
        ))}

        {filteredConversations.length === 0 && (
          <div className="text-center py-16 bg-[#12151E] rounded-2xl border border-white/10 p-6">
            <MessageSquare className="w-10 h-10 text-[#DC2626] mx-auto mb-3 opacity-80" />
            <p className="text-white font-bold text-base">No active chats found.</p>
            <p className="text-xs text-[#94A3B8] mt-1 mb-4">Connect with people on the radar to launch conversations!</p>
            <Button 
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              onClick={() => router.push('/dashboard')}
            >
              Open Activity Radar
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}


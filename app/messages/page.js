'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, Circle, Check, CheckCheck } from 'lucide-react';
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
    try {
      // Using matches to simulate conversations
      const res = await fetchWithAuth('/api/matches');
      const data = await res.json();
      if (data.matches) {
        const mockConversations = data.matches.slice(0, 6).map((m, i) => ({
          ...m,
          lastMessage: [
            'Hey! Ready for hiking tomorrow?',
            'Sure, let\'s meet at 9am',
            'Thanks for the great workout!',
            'See you at the gym!',
            'That was fun! Same time next week?',
            'Just arrived at the coffee shop'
          ][i % 6],
          lastMessageTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          unread: Math.random() > 0.6,
          online: Math.random() > 0.5
        }));
        setConversations(mockConversations);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header user={user} title="CHAT" />
      
      {/* Search */}
      <div className="bg-white px-4 py-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="divide-y divide-gray-100">
        {filteredConversations.map((conversation) => (
          <button
            key={conversation.id}
            className="w-full bg-white px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
            onClick={() => router.push(`/messages/${conversation.id}`)}
          >
            <div className="relative">
              <Avatar className="w-14 h-14">
                <AvatarImage src={conversation.profilePhoto} />
                <AvatarFallback className="bg-[#4a3aff] text-white">
                  {conversation.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {conversation.online && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${conversation.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                  {conversation.name}
                </h3>
                <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
              </div>
              <p className={`text-sm truncate ${conversation.unread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                {conversation.lastMessage}
              </p>
            </div>
            
            {conversation.unread ? (
              <div className="w-3 h-3 bg-[#1a1aff] rounded-full"></div>
            ) : (
              <CheckCheck className="w-4 h-4 text-blue-500" />
            )}
          </button>
        ))}

        {filteredConversations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No conversations yet.</p>
            <p className="text-sm mt-2">Connect with someone to start chatting!</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

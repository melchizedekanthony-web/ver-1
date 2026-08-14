'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { getUser, fetchWithAuth } from '@/lib/auth';

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;
  const messagesEndRef = useRef(null);

  const [user, setUser] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    fetchChatUser();
    fetchThread(storedUser.id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatUser = async () => {
    try {
      const res = await fetchWithAuth('/api/matches');
      const data = await res.json();
      if (data.matches) {
        const found = data.matches.find(m => m.id === userId);
        setChatUser(found || data.matches[0]);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchThread = async (myUserId) => {
    try {
      const res = await fetchWithAuth(`/api/messages/${userId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages.map(m => ({
          id: m.id,
          senderId: m.senderId === myUserId ? 'me' : m.senderId,
          text: m.text,
          time: new Date(m.createdAt)
        })));
      }
    } catch (error) {
      console.error('Failed to load message thread:', error);
    }
  };

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;

    // Optimistic append so sending feels instant, then reconcile with the
    // real persisted message once the request resolves.
    const optimisticId = `pending-${Date.now()}`;
    setMessages(prev => [...prev, { id: optimisticId, senderId: 'me', text, time: new Date() }]);
    setNewMessage('');

    try {
      const res = await fetchWithAuth('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ recipientId: userId, text })
      });
      if (!res.ok) throw new Error('Send failed');
      const data = await res.json();
      setMessages(prev => prev.map(m => (
        m.id === optimisticId
          ? { id: data.message.id, senderId: 'me', text: data.message.text, time: new Date(data.message.createdAt) }
          : m
      )));
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setNewMessage(text);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] flex flex-col">
      {/* Header */}
      <header className="bg-[#12151E]/95 backdrop-blur-xl px-4 py-3 flex items-center gap-3 border-b border-white/10">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-[#94A3B8]" />
        </button>
        
        <Avatar className="w-10 h-10">
          <AvatarImage src={chatUser?.profilePhoto} />
          <AvatarFallback className="bg-[#DC2626] text-white">
            {chatUser?.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold text-white">{chatUser?.name || 'User'}</h2>
          <p className="text-xs text-[#94A3B8]">{chatUser?.activity || 'Radar match'}</p>
        </div>
        
        <button className="p-2">
          <Phone className="w-5 h-5 text-[#94A3B8]" />
        </button>
        <button className="p-2">
          <Video className="w-5 h-5 text-[#94A3B8]" />
        </button>
        <button className="p-2">
          <MoreVertical className="w-5 h-5 text-[#94A3B8]" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <Avatar className="w-14 h-14 mb-3 border-2 border-[#DC2626]">
              <AvatarImage src={chatUser?.profilePhoto} />
              <AvatarFallback className="bg-[#DC2626] text-white text-lg">
                {chatUser?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <p className="text-white font-bold">Say hi to {chatUser?.name || 'your match'}</p>
            <p className="text-xs text-[#94A3B8] mt-1">No messages yet — break the ice and set up your meetup.</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${message.senderId === 'me' ? 'order-2' : 'order-1'}`}>
              {message.senderId !== 'me' && (
                <Avatar className="w-8 h-8 mb-1">
                  <AvatarImage src={chatUser?.profilePhoto} />
                  <AvatarFallback className="bg-[#DC2626] text-white text-xs">
                    {chatUser?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-2xl px-4 py-2 ${
                  message.senderId === 'me'
                    ? 'bg-[#DC2626] text-white rounded-br-sm shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                    : 'bg-[#1A1E2B] text-white rounded-bl-sm border border-white/5'
                }`}
              >
                <p>{message.text}</p>
              </div>
              <p className={`text-xs text-[#94A3B8] mt-1 ${message.senderId === 'me' ? 'text-right' : ''}`}>
                {formatTime(message.time)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-[#12151E]/95 backdrop-blur-xl px-4 py-3 shadow-lg border-t border-white/10">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            className="bg-[#DC2626] hover:bg-[#B91C1C] rounded-full w-10 h-10 p-0 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

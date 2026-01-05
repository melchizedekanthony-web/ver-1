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
    generateMockMessages();
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

  const generateMockMessages = () => {
    const mockMessages = [
      { id: '1', senderId: userId, text: 'Hey! How are you?', time: new Date(Date.now() - 3600000) },
      { id: '2', senderId: 'me', text: 'I\'m good! Ready for hiking tomorrow?', time: new Date(Date.now() - 3500000) },
      { id: '3', senderId: userId, text: 'Absolutely! What time works for you?', time: new Date(Date.now() - 3400000) },
      { id: '4', senderId: 'me', text: 'How about 9am at the trailhead?', time: new Date(Date.now() - 3300000) },
      { id: '5', senderId: userId, text: 'Perfect! I\'ll bring some snacks', time: new Date(Date.now() - 3200000) },
      { id: '6', senderId: 'me', text: 'Great! I\'ll bring water. See you there!', time: new Date(Date.now() - 3100000) },
    ];
    setMessages(mockMessages);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      senderId: 'me',
      text: newMessage,
      time: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate reply
    setTimeout(() => {
      const replies = [
        'Sounds great!',
        'Perfect, see you there!',
        'Can\'t wait!',
        '👍',
        'Awesome!'
      ];
      const reply = {
        id: (Date.now() + 1).toString(),
        senderId: userId,
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date()
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        
        <Avatar className="w-10 h-10">
          <AvatarImage src={chatUser?.profilePhoto} />
          <AvatarFallback className="bg-[#4a3aff] text-white">
            {chatUser?.name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold text-gray-800">{chatUser?.name || 'User'}</h2>
          <p className="text-xs text-green-500">Online</p>
        </div>
        
        <button className="p-2">
          <Phone className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2">
          <Video className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-2">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${message.senderId === 'me' ? 'order-2' : 'order-1'}`}>
              {message.senderId !== 'me' && (
                <Avatar className="w-8 h-8 mb-1">
                  <AvatarImage src={chatUser?.profilePhoto} />
                  <AvatarFallback className="bg-[#4a3aff] text-white text-xs">
                    {chatUser?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-2xl px-4 py-2 ${
                  message.senderId === 'me'
                    ? 'bg-[#1a1aff] text-white rounded-br-sm'
                    : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                }`}
              >
                <p>{message.text}</p>
              </div>
              <p className={`text-xs text-gray-500 mt-1 ${message.senderId === 'me' ? 'text-right' : ''}`}>
                {formatTime(message.time)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white px-4 py-3 shadow-lg border-t">
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
            className="bg-[#1a1aff] hover:bg-[#1515dd] rounded-full w-10 h-10 p-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

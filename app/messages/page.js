'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Phone, Video, MoreVertical } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');

  // Mock conversations
  const conversations = [
    { id: 1, name: 'Sarah Johnson', lastMessage: 'See you at the gym tomorrow!', time: '2m ago', unread: 2, online: true },
    { id: 2, name: 'Mike Chen', lastMessage: 'That workout was intense!', time: '1h ago', unread: 0, online: true },
    { id: 3, name: 'Emma Rodriguez', lastMessage: 'Thanks for the coffee!', time: '3h ago', unread: 0, online: false },
    { id: 4, name: 'James Wilson', lastMessage: 'Ready for hiking this weekend?', time: '1d ago', unread: 1, online: false },
  ];

  // Mock messages for selected chat
  const messages = selectedChat ? [
    { id: 1, text: 'Hey! Are you free for a workout today?', sent: false, time: '10:30 AM' },
    { id: 2, text: 'Yes! What time works for you?', sent: true, time: '10:32 AM' },
    { id: 3, text: 'How about 6 PM at LA Fitness?', sent: false, time: '10:35 AM' },
    { id: 4, text: 'Perfect! See you there!', sent: true, time: '10:37 AM' },
  ] : [];

  const sendMessage = () => {
    if (!message.trim()) return;
    // In real app: send message via API
    setMessage('');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => selectedChat ? setSelectedChat(null) : router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          {selectedChat ? (
            <>
              <Avatar>
                <AvatarFallback className="bg-[#4a3aff] text-white">
                  {conversations.find(c => c.id === selectedChat)?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-bold">{conversations.find(c => c.id === selectedChat)?.name}</div>
                <div className="text-xs text-gray-600">Active now</div>
              </div>
              <Button variant="ghost" size="icon">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              <p className="text-sm text-gray-600">Chat with your connections</p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!selectedChat ? (
          /* Conversations List */
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <div className="space-y-2">
              {conversations.map((conv) => (
                <Card 
                  key={conv.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedChat(conv.id)}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-14 h-14">
                        <AvatarFallback className="bg-[#4a3aff] text-white text-lg">
                          {conv.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold">{conv.name}</h3>
                        <span className="text-xs text-gray-600">{conv.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <Badge className="bg-[#4a3aff] text-white ml-2">{conv.unread}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Chat View */
          <div className="h-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${
                    msg.sent 
                      ? 'bg-[#4a3aff] text-white' 
                      : 'bg-white border'
                  } rounded-2xl px-4 py-2`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sent ? 'text-white/70' : 'text-gray-500'
                    }`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t bg-white p-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button 
                  className="bg-[#4a3aff] hover:bg-[#3a2aef]"
                  onClick={sendMessage}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Bot, User as UserIcon, Loader2, Sparkles, RefreshCcw, Compass, Dumbbell, Coffee, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser } from '@/lib/auth';
import { toast } from 'sonner';

export default function AssistantPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: '⚡ Welcome to the WannaGo AI Concierge! I analyze local weather, time of day, and nearby activity radar data to suggest instant meetups. What are you looking to do today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const promptChips = [
    "🔥 Suggest outdoor activities nearby",
    "☕ Find a coffee & co-working buddy",
    "🏃 Best running trails right now",
    "🎾 Find a tennis competitor"
  ];

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
  }, [router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e, customText) => {
    e?.preventDefault();
    const queryText = customText || input.trim();
    if (!queryText || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: queryText };
    setMessages(prev => [...prev, userMessage]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })) 
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      // Honest failure state — no fabricated claims about who's currently
      // broadcasting. Point them at the real radar instead of inventing data.
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `I couldn't reach the concierge just now — give it another try in a moment, or open the Radar directly to browse what's actually broadcasting nearby.`
        }]);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white pb-24 flex flex-col">
      <Header user={user} title="AI CONCIERGE" showBack={false} />
      
      <main className="flex-1 flex flex-col w-full max-w-2xl mx-auto overflow-hidden relative">
        {/* Background Lighting Gradients */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-[#DC2626]/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto w-full p-4 space-y-4 z-10">
          <div className="flex justify-center my-2">
            <div className="bg-[#12151E] backdrop-blur-xl border border-[#DC2626]/40 rounded-full px-4 py-2 flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
              <Sparkles className="w-4 h-4 text-[#FBBF24]" />
              <span className="text-xs font-bold text-white uppercase tracking-wide">WannaGo AI Concierge</span>
            </div>
          </div>

          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-end gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar className={`w-8 h-8 ${message.role === 'user' ? 'border-2 border-[#DC2626]' : 'bg-[#DC2626] border border-red-500/40 shadow-[0_0_12px_rgba(220,38,38,0.6)]'}`}>
                {message.role === 'user' ? (
                  <>
                    {user.profilePhoto ? (
                      <AvatarImage src={user.profilePhoto} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-[#1A1E2B] text-white text-xs font-bold">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    )}
                  </>
                ) : (
                  <AvatarFallback className="bg-transparent text-white">
                    <Bot className="w-4 h-4 text-white" />
                  </AvatarFallback>
                )}
              </Avatar>

              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user' 
                    ? 'bg-[#DC2626] text-white font-semibold rounded-br-none shadow-[0_0_15px_rgba(220,38,38,0.3)]' 
                    : 'bg-[#12151E] text-[#E2E8F0] border border-white/10 rounded-bl-none shadow-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-3 flex-row">
              <Avatar className="w-8 h-8 bg-[#DC2626] border border-red-500/40 shadow-[0_0_12px_rgba(220,38,38,0.6)]">
                <AvatarFallback className="bg-transparent text-white">
                  <Bot className="w-4 h-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-[#12151E] text-white border border-white/10 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#DC2626] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-[#FBBF24] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-[#DC2626] rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Prompt Chips */}
        {messages.length < 4 && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide z-20">
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(null, chip)}
                className="flex-shrink-0 bg-[#1A1E2B] hover:bg-[#232838] border border-white/10 hover:border-[#DC2626]/50 rounded-full px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-sm"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="bg-[#12151E]/95 backdrop-blur-xl border-t border-white/10 p-3 z-20">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 max-w-2xl mx-auto bg-[#1A1E2B] rounded-full border border-white/10 p-1 focus-within:border-[#DC2626] transition-all shadow-inner"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Concierge to plan an activity..." 
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-[#94A3B8] px-4 py-3 h-11 text-sm shadow-none"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className={`rounded-full w-10 h-10 p-0 flex-shrink-0 transition-transform ${input.trim() && !isLoading ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C] scale-100 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-white/10 text-white/40 scale-95'}`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-[#94A3B8] font-medium tracking-wide">WannaGo AI Concierge • Instant Activity Recommendations</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

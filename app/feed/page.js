'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Share2, Send, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('fittr_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const token = localStorage.getItem('fittr_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/feed', {
        credentials: 'include',
        headers
      });
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch feed');
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;
    
    try {
      const token = localStorage.getItem('fittr_token');
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/feed', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          contentType: 'general',
          content: newPost
        })
      });
      
      if (res.ok) {
        toast.success('Posted!');
        setNewPost('');
        fetchFeed();
      }
    } catch (error) {
      toast.error('Failed to post');
    }
  };

  const likePost = async (postId) => {
    try {
      const token = localStorage.getItem('fittr_token');
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      await fetch(`/api/feed/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
      
      fetchFeed();
    } catch (error) {
      console.error('Failed to like post');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <h1 className="text-xl font-bold">Community Feed</h1>
          <p className="text-sm text-gray-600">Share your fitness journey</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Create Post */}
        <Card className="p-4 mb-6">
          <div className="flex gap-3">
            <Avatar>
              <AvatarFallback className="bg-[#4a3aff] text-white">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea 
                placeholder="Share your fitness journey..."
                className="mb-3 min-h-[80px]"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Photo
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[#4a3aff] hover:bg-[#3a2aef]"
                  onClick={createPost}
                  disabled={!newPost.trim()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Feed Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <div className="p-4">
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-3">
                  <Avatar>
                    <AvatarFallback className="bg-gray-300 text-gray-700">
                      {post.author?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-bold">{post.author?.name || 'User'}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <p className="mb-4">{post.content}</p>

                {/* Post Actions */}
                <div className="flex items-center gap-6 pt-3 border-t">
                  <button 
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
                    onClick={() => likePost(post.id)}
                  >
                    <Heart className={`w-5 h-5 ${post.likes?.includes(user?.id) ? 'fill-red-600 text-red-600' : ''}`} />
                    <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-[#4a3aff] transition-colors">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments?.length || 0}</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-600 hover:text-[#4a3aff] transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {posts.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-gray-600 mb-4">No posts yet</div>
            <div className="text-sm text-gray-500">Be the first to share!</div>
          </Card>
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          <button className="p-4 flex flex-col items-center text-gray-600" onClick={() => router.push('/dashboard')}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button className="p-4 flex flex-col items-center text-gray-600" onClick={() => router.push('/connections')}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs">Connections</span>
          </button>
          <button className="p-4 flex flex-col items-center text-[#4a3aff]">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-xs">Feed</span>
          </button>
          <button className="p-4 flex flex-col items-center text-gray-600" onClick={() => router.push('/messages')}>
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">Messages</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { setAuth } from '@/lib/auth';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Sign in failed');
        return;
      }

      // Save auth data
      setAuth(data.token, data.user);
      
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1aff] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <h1 
          className="text-4xl font-black text-white text-center mb-8 tracking-wider"
          style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.6)' }}
        >
          GOWITHME
        </h1>

        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Welcome Back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 bg-[#1a1aff] hover:bg-[#1515dd] text-lg font-semibold"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-[#1a1aff] font-semibold hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </Card>

        {/* Test credentials hint */}
        <div className="mt-4 text-center text-white/70 text-sm">
          <p>Test: test@fittr.app / Test1234</p>
        </div>
      </div>
    </div>
  );
}

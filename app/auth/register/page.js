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

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Register
      const registerRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        toast.error(registerData.error || 'Registration failed');
        return;
      }

      // Auto sign in after registration
      const signInRes = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
        credentials: 'include'
      });

      const signInData = await signInRes.json();

      if (signInRes.ok) {
        setAuth(signInData.token, signInData.user);
        toast.success('Account created! Let\'s set up your profile.');
        router.push('/onboarding');
      } else {
        toast.success('Account created! Please sign in.');
        router.push('/auth/signin');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2B2D9E] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <h1 
          className="text-4xl font-black text-white text-center mb-8 tracking-wider"
          style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.6)' }}
        >
          WannaGo
        </h1>

        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full py-6 bg-[#2B2D9E] hover:bg-[#1f2175] text-lg font-semibold"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'JOIN UP'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-[#2B2D9E] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

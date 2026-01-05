'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, Truck, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth';

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState('checkout'); // checkout, confirmed
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    const savedCart = localStorage.getItem('gowithme_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate payment processing
    toast.loading('Processing payment...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Payment successful!');
      localStorage.removeItem('gowithme_cart');
      setStep('confirmed');
    }, 2000);
  };

  if (step === 'confirmed') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">ORDER CONFIRMED</h1>
          <div className="text-left bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="font-semibold mb-2">ORDER SUMMARY</h3>
            <div className="flex justify-between text-sm">
              <span>Oils</span>
              <span>$53.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Accessories</span>
              <span>$0.00</span>
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>${(cartTotal + 5).toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 text-left">
            <p className="text-sm text-gray-600">ESTIMATED DELIVERY</p>
            <p className="text-sm">Cahmas delivery • 3 days</p>
          </div>
          <Button 
            className="w-full mt-6 bg-[#1a1aff] hover:bg-[#1515dd] py-6"
            onClick={() => router.push('/dashboard')}
          >
            TRACK DELIVERY
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">CART & CHECKOUT</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Cart Items */}
        <Card className="p-4">
          <h2 className="font-bold mb-3">Order Summary</h2>
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between py-2 border-b">
              <div className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold">
            <span>TOTAL</span>
            <span>${(cartTotal + 5).toFixed(2)}</span>
          </div>
        </Card>

        {/* Delivery Address */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="w-5 h-5 text-[#1a1aff]" />
            <h2 className="font-bold">DELIVERY ADDRESS</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Street Address</Label>
              <Input 
                placeholder="123 Main St"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input 
                  placeholder="New York"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>ZIP Code</Label>
                <Input 
                  placeholder="10001"
                  value={formData.zip}
                  onChange={(e) => setFormData({...formData, zip: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-[#1a1aff]" />
            <h2 className="font-bold">PAYMENT METHOD</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label>Card Number</Label>
              <Input 
                placeholder="4242 4242 4242 4242"
                value={formData.cardNumber}
                onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Expiry</Label>
                <Input 
                  placeholder="MM/YY"
                  value={formData.expiry}
                  onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>CVV</Label>
                <Input 
                  placeholder="123"
                  type="password"
                  value={formData.cvv}
                  onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        <Button 
          type="submit"
          className="w-full py-6 bg-[#1a1aff] hover:bg-[#1515dd] text-lg font-semibold"
        >
          PURCHASE - ${(cartTotal + 5).toFixed(2)}
        </Button>
      </form>
    </div>
  );
}

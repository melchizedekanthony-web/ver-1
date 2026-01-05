'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Heart, Plus, Minus, X } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser } from '@/lib/auth';
import { toast } from 'sonner';

const products = [
  { id: '1', name: 'Vitamins', price: 24.00, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', category: 'supplements' },
  { id: '2', name: 'Protein', price: 45.20, image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=200', category: 'supplements' },
  { id: '3', name: 'Oils', price: 18.00, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200', category: 'wellness' },
  { id: '4', name: 'Essential Oils', price: 35.00, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200', category: 'wellness' },
  { id: '5', name: 'Yoga Mat', price: 45.00, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=200', category: 'equipment' },
  { id: '6', name: 'Resistance Bands', price: 22.00, image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=200', category: 'equipment' },
];

export default function WellnessPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    // Load cart from localStorage
    const savedCart = localStorage.getItem('gowithme_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    let newCart;
    if (existing) {
      newCart = cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    setCart(newCart);
    localStorage.setItem('gowithme_cart', JSON.stringify(newCart));
    toast.success(`${product.name} added to cart!`);
  };

  const updateQuantity = (productId, delta) => {
    const newCart = cart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    setCart(newCart);
    localStorage.setItem('gowithme_cart', JSON.stringify(newCart));
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    localStorage.setItem('gowithme_cart', JSON.stringify(newCart));
  };

  const toggleFavorite = (productId) => {
    setFavorites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <Header user={user} title="WELLNESS STORE" />
      
      {/* Search */}
      <div className="bg-white px-4 py-3 shadow-sm flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50"
          />
        </div>
        <Button 
          variant="outline" 
          className="relative"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-[#1a1aff] text-white text-xs w-5 h-5 flex items-center justify-center p-0">
              {cartCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Products Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <button 
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow"
                  onClick={() => toggleFavorite(product.id)}
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <p className="text-[#1a1aff] font-bold">${product.price.toFixed(2)}</p>
                <Button 
                  className="w-full mt-2 bg-[#1a1aff] hover:bg-[#1515dd] text-sm"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Cart & Checkout</h2>
              <button onClick={() => setShowCart(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-[#1a1aff] font-bold">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-600">Delivery</span>
                    <span className="font-semibold">$5.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>Total</span>
                    <span>${(cartTotal + 5).toFixed(2)}</span>
                  </div>
                  <Button 
                    className="w-full py-6 bg-[#1a1aff] hover:bg-[#1515dd] text-lg"
                    onClick={() => router.push('/checkout')}
                  >
                    PURCHASE
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

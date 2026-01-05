'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, Heart, Star, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function WellnessPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Mock wellness products
  const products = [
    { id: 1, name: 'Protein Powder', price: 39.99, category: 'Supplements', rating: 4.5, image: '🥤' },
    { id: 2, name: 'Yoga Mat', price: 29.99, category: 'Equipment', rating: 4.8, image: '🧘' },
    { id: 3, name: 'Resistance Bands', price: 19.99, category: 'Equipment', rating: 4.6, image: '💪' },
    { id: 4, name: 'Pre-Workout', price: 34.99, category: 'Supplements', rating: 4.7, image: '⚡' },
    { id: 5, name: 'Water Bottle', price: 24.99, category: 'Accessories', rating: 4.9, image: '💧' },
    { id: 6, name: 'Fitness Tracker', price: 149.99, category: 'Tech', rating: 4.4, image: '⌚' },
    { id: 7, name: 'Foam Roller', price: 39.99, category: 'Recovery', rating: 4.7, image: '🔄' },
    { id: 8, name: 'Vitamins', price: 29.99, category: 'Supplements', rating: 4.5, image: '💊' },
  ];

  const addToCart = (product) => {
    setCart([...cart, product]);
    setCartCount(cartCount + 1);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Wellness Store</h1>
                <p className="text-sm text-gray-600">Products for your fitness journey</p>
              </div>
            </div>
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#4a3aff] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['All', 'Supplements', 'Equipment', 'Recovery', 'Accessories', 'Tech'].map((cat) => (
            <Badge 
              key={cat}
              variant={cat === 'All' ? 'default' : 'outline'}
              className={cat === 'All' ? 'bg-[#4a3aff] cursor-pointer' : 'cursor-pointer'}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <div className="p-4">
                <div className="text-6xl text-center mb-3">{product.image}</div>
                <Badge variant="outline" className="text-xs mb-2">{product.category}</Badge>
                <h3 className="font-bold mb-1 text-sm">{product.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-medium">{product.rating}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">${product.price}</span>
                  <Button 
                    size="sm" 
                    className="bg-[#4a3aff] hover:bg-[#3a2aef]"
                    onClick={() => addToCart(product)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
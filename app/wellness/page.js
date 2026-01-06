'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, ShoppingCart, Heart, Plus, Minus, X, ChevronRight, 
  Pill, Dumbbell, Brain, Leaf, Award, Wrench, Shirt, Star,
  Filter, Grid3X3, List
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { getUser, fetchWithAuth } from '@/lib/auth';
import { toast } from 'sonner';

// Store categories with icons
const categories = [
  { id: 'vitamins', name: 'Vitamins', icon: Pill, color: 'bg-orange-100 text-orange-600', description: 'Essential daily vitamins' },
  { id: 'supplements', name: 'Supplements', icon: Dumbbell, color: 'bg-blue-100 text-blue-600', description: 'Performance & recovery' },
  { id: 'nootropics', name: 'Nootropics', icon: Brain, color: 'bg-purple-100 text-purple-600', description: 'Cognitive enhancement' },
  { id: 'herbal', name: 'Herbal', icon: Leaf, color: 'bg-green-100 text-green-600', description: 'Natural remedies' },
  { id: 'weightlifting', name: 'Weight Lifting', icon: Dumbbell, color: 'bg-red-100 text-red-600', description: 'Strength training gear' },
  { id: 'premium', name: 'Premium', icon: Award, color: 'bg-yellow-100 text-yellow-600', description: 'Top wellness brands' },
  { id: 'accessories', name: 'Fitness Tools', icon: Wrench, color: 'bg-cyan-100 text-cyan-600', description: 'Tools & accessories' },
  { id: 'branded', name: 'WannaGo Gear', icon: Shirt, color: 'bg-indigo-100 text-indigo-600', description: 'Official merchandise' },
];

// Products by category
const productsByCategory = {
  vitamins: [
    { id: 'v1', name: 'Vitamin D3 5000 IU', price: 24.99, rating: 4.8, reviews: 342, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', featured: true },
    { id: 'v2', name: 'B-Complex Advanced', price: 19.99, rating: 4.7, reviews: 256, image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200', featured: true },
    { id: 'v3', name: 'Vitamin C 1000mg', price: 15.99, rating: 4.9, reviews: 521, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', featured: true },
    { id: 'v4', name: 'Multivitamin Complete', price: 34.99, rating: 4.6, reviews: 189, image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200', featured: true },
  ],
  supplements: [
    { id: 's1', name: 'Whey Protein Isolate', price: 54.99, rating: 4.9, reviews: 1024, image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=200', featured: true },
    { id: 's2', name: 'Creatine Monohydrate', price: 29.99, rating: 4.8, reviews: 856, image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=200', featured: true },
    { id: 's3', name: 'BCAA Energy', price: 39.99, rating: 4.7, reviews: 445, image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=200', featured: true },
    { id: 's4', name: 'Pre-Workout Extreme', price: 44.99, rating: 4.6, reviews: 678, image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=200', featured: true },
  ],
  nootropics: [
    { id: 'n1', name: 'Focus Stack', price: 49.99, rating: 4.7, reviews: 234, image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200', featured: true },
    { id: 'n2', name: 'Alpha Brain', price: 79.99, rating: 4.8, reviews: 567, image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200', featured: true },
    { id: 'n3', name: 'Lion\'s Mane Extract', price: 34.99, rating: 4.9, reviews: 312, image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200', featured: true },
    { id: 'n4', name: 'Memory Complex', price: 44.99, rating: 4.5, reviews: 198, image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200', featured: true },
  ],
  herbal: [
    { id: 'h1', name: 'Ashwagandha Root', price: 24.99, rating: 4.8, reviews: 445, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200', featured: true },
    { id: 'h2', name: 'Turmeric Curcumin', price: 29.99, rating: 4.9, reviews: 678, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200', featured: true },
    { id: 'h3', name: 'Elderberry Immune', price: 19.99, rating: 4.7, reviews: 234, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200', featured: true },
    { id: 'h4', name: 'Ginkgo Biloba', price: 22.99, rating: 4.6, reviews: 189, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200', featured: true },
  ],
  weightlifting: [
    { id: 'w1', name: 'Lifting Gloves Pro', price: 34.99, rating: 4.7, reviews: 312, image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=200', featured: true },
    { id: 'w2', name: 'Weight Belt Support', price: 49.99, rating: 4.8, reviews: 256, image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=200', featured: true },
    { id: 'w3', name: 'Resistance Bands Set', price: 29.99, rating: 4.9, reviews: 567, image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=200', featured: true },
    { id: 'w4', name: 'Wrist Wraps Elite', price: 19.99, rating: 4.6, reviews: 198, image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=200', featured: true },
  ],
  premium: [
    { id: 'p1', name: 'AG1 Greens Powder', price: 99.99, rating: 4.9, reviews: 2341, image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=200', featured: true, badge: 'Partner' },
    { id: 'p2', name: 'LMNT Electrolytes', price: 45.99, rating: 4.8, reviews: 1567, image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=200', featured: true, badge: 'Partner' },
    { id: 'p3', name: 'Organifi Red Juice', price: 69.99, rating: 4.7, reviews: 892, image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=200', featured: true, badge: 'Partner' },
    { id: 'p4', name: 'Four Sigmatic Coffee', price: 39.99, rating: 4.8, reviews: 1234, image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=200', featured: true, badge: 'Partner' },
  ],
  accessories: [
    { id: 'a1', name: 'Yoga Mat Premium', price: 49.99, rating: 4.8, reviews: 445, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=200', featured: true },
    { id: 'a2', name: 'Foam Roller Deep', price: 34.99, rating: 4.7, reviews: 312, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=200', featured: true },
    { id: 'a3', name: 'Massage Gun Pro', price: 149.99, rating: 4.9, reviews: 678, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=200', featured: true },
    { id: 'a4', name: 'Jump Rope Speed', price: 24.99, rating: 4.6, reviews: 234, image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=200', featured: true },
  ],
  branded: [
    { id: 'b1', name: 'WannaGo Classic Tee', price: 29.99, rating: 4.9, reviews: 156, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', featured: true },
    { id: 'b2', name: 'WannaGo Snapback Cap', price: 24.99, rating: 4.8, reviews: 98, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', featured: true },
    { id: 'b3', name: 'WannaGo Hoodie', price: 59.99, rating: 4.9, reviews: 234, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', featured: true },
    { id: 'b4', name: 'WannaGo Water Bottle', price: 19.99, rating: 4.7, reviews: 312, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200', featured: true },
  ],
};

export default function WellnessPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    const storedUser = getUser();
    if (!storedUser) {
      router.push('/auth/signin');
      return;
    }
    setUser(storedUser);
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetchWithAuth('/api/cart');
      const data = await res.json();
      if (data.cart) {
        setCart(data.cart.map(item => ({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
          image: item.imageUrl
        })));
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Fall back to localStorage
      const savedCart = localStorage.getItem('wannago_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    }
  };

  const addToCart = async (product) => {
    try {
      const res = await fetchWithAuth('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.image
        })
      });
      
      const data = await res.json();
      if (data.cart) {
        setCart(data.cart.map(item => ({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
          image: item.imageUrl
        })));
      }
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      console.error('Add to cart error:', error);
      // Fall back to local cart
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
      localStorage.setItem('wannago_cart', JSON.stringify(newCart));
      toast.success(`${product.name} added to cart!`);
    }
  };

  const updateQuantity = async (productId, delta) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    const newQuantity = item.quantity + delta;
    
    try {
      if (newQuantity <= 0) {
        await fetchWithAuth(`/api/cart/${productId}`, { method: 'DELETE' });
      } else {
        await fetchWithAuth(`/api/cart/${productId}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity: newQuantity })
        });
      }
      fetchCart();
    } catch (error) {
      console.error('Update quantity error:', error);
      // Fall back to local update
      const newCart = cart.map(item => {
        if (item.id === productId) {
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean);
      setCart(newCart);
      localStorage.setItem('wannago_cart', JSON.stringify(newCart));
    }
  };

  const toggleFavorite = (productId) => {
    setFavorites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderProductCard = (product, size = 'normal') => (
    <Card 
      key={product.id} 
      className={`overflow-hidden ${size === 'small' ? 'flex-shrink-0 w-36' : ''}`}
    >
      <div className={`relative ${size === 'small' ? 'h-28' : 'aspect-square'} bg-gray-100`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <button 
          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow"
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
        >
          <Heart className={`w-4 h-4 ${favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
        {product.badge && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-white text-xs">
            {product.badge}
          </Badge>
        )}
      </div>
      <div className="p-3">
        <h3 className={`font-semibold text-gray-800 ${size === 'small' ? 'text-sm line-clamp-1' : ''}`}>
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-gray-600">{product.rating} ({product.reviews})</span>
        </div>
        <p className="text-[#2B2D9E] font-bold mt-1">${product.price.toFixed(2)}</p>
        <Button 
          className={`w-full mt-2 bg-[#2B2D9E] hover:bg-[#1f2175] ${size === 'small' ? 'text-xs py-1' : 'text-sm'}`}
          onClick={() => addToCart(product)}
        >
          Add to Cart
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header user={user} title="WELLNESS STORE" />
      
      {/* Search & Cart Bar */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-30">
        <div className="flex gap-2">
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
              <Badge className="absolute -top-2 -right-2 bg-[#2B2D9E] text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto px-4 py-3 gap-3 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  selectedCategory === category.id
                    ? 'bg-[#2B2D9E] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium whitespace-nowrap">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* If category selected, show full category */}
        {selectedCategory ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {categories.find(c => c.id === selectedCategory)?.description}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-[#2B2D9E] text-sm font-medium"
              >
                View All Categories
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {productsByCategory[selectedCategory]?.map((product) => renderProductCard(product))}
            </div>
          </div>
        ) : (
          /* Category Overview - Each category with 4 featured items */
          <div className="space-y-6">
            {categories.map((category) => {
              const Icon = category.icon;
              const products = productsByCategory[category.id] || [];
              const isExpanded = expandedCategories[category.id];
              
              return (
                <div key={category.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  {/* Category Header */}
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${category.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{category.name}</h3>
                        <p className="text-xs text-gray-500">{category.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Featured Products */}
                  <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
                    {products.slice(0, 4).map((product) => (
                      <Card 
                        key={product.id} 
                        className="flex-shrink-0 w-32 overflow-hidden"
                      >
                        <div className="relative h-24 bg-gray-100">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          {product.badge && (
                            <Badge className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] px-1">
                              {product.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="text-xs font-medium text-gray-800 line-clamp-1">{product.name}</h4>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] text-gray-500">{product.rating}</span>
                          </div>
                          <p className="text-sm font-bold text-[#2B2D9E]">${product.price}</p>
                          <Button 
                            size="sm"
                            className="w-full mt-1 bg-[#2B2D9E] hover:bg-[#1f2175] text-[10px] h-7"
                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          >
                            Add
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* View All Link */}
                  <button 
                    onClick={() => setSelectedCategory(category.id)}
                    className="w-full mt-3 text-center text-sm text-[#2B2D9E] font-medium hover:underline"
                  >
                    View All {category.name} →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Cart ({cartCount})</h2>
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
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        <p className="text-[#2B2D9E] font-bold">${item.price.toFixed(2)}</p>
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

                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold">$5.00</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>Total</span>
                    <span>${(cartTotal + 5).toFixed(2)}</span>
                  </div>
                  <Button 
                    className="w-full py-6 bg-[#2B2D9E] hover:bg-[#1f2175] text-lg"
                    onClick={() => router.push('/checkout')}
                  >
                    CHECKOUT
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-3">
                    Powered by Shopify • Secure checkout
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

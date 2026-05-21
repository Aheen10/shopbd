'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import { productsAPI } from './lib/api';
import { Toaster } from 'react-hot-toast';

const CATEGORIES = [
  { id: 'all', label: 'All Products', emoji: '🏪' },
  { id: 'kitchen', label: 'Kitchen', emoji: '🍳' },
  { id: 'home', label: 'Home Decor', emoji: '🏠' },
  { id: 'bedroom', label: 'Bedroom', emoji: '🛏️' },
  { id: 'bathroom', label: 'Bathroom', emoji: '🚿' },
  { id: 'cleaning', label: 'Cleaning', emoji: '🧹' },
];

const BANNERS = [
  { bg: 'from-orange-600 to-red-600', title: 'Summer Sale!', subtitle: 'Up to 50% off on Kitchen items', emoji: '🍳' },
  { bg: 'from-blue-600 to-purple-600', title: 'New Arrivals', subtitle: 'Fresh home decor collection', emoji: '🏠' },
  { bg: 'from-green-600 to-teal-600', title: 'Flash Deal', subtitle: 'Limited time offers today', emoji: '⚡' },
];

const TRUST_BADGES = [
  { emoji: '🚚', title: 'Fast Delivery', subtitle: 'Free shipping over ৳2000' },
  { emoji: '✅', title: 'Quality Products', subtitle: 'Verified & authenticated' },
  { emoji: '📞', title: 'Customer Support', subtitle: '9am to 9pm daily' },
  { emoji: '💳', title: 'Secure Payment', subtitle: 'bKash, Nagad & COD' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [currentBanner, setCurrentBanner] = useState(0);

  // Banner auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({
        category: category === 'all' ? undefined : category,
        search: search || undefined,
        page,
        minPrice: priceRange.min || undefined,
        maxPrice: priceRange.max || undefined,
      });
      let sorted = res.data.products;
      if (sortBy === 'price_low') sorted = [...sorted].sort((a: any, b: any) => a.price - b.price);
      if (sortBy === 'price_high') sorted = [...sorted].sort((a: any, b: any) => b.price - a.price);
      setProducts(sorted);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [category, page, sortBy]);
  useEffect(() => {
    const timeout = setTimeout(() => fetchProducts(), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Left Sidebar */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-20">
              <div className="bg-orange-500 text-white px-4 py-3 font-bold text-sm">
                🏪 SHOP BY CATEGORY
              </div>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setPage(1); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-50 transition text-left hover:bg-orange-50 hover:text-orange-500 ${
                    category === cat.id ? 'bg-orange-50 text-orange-500 font-semibold' : 'text-gray-700'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                  <span className="ml-auto text-gray-300">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">

            {/* Hero Banner Slider */}
            <div className="relative rounded-2xl overflow-hidden mb-6 h-48 md:h-64">
              {BANNERS.map((banner, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 bg-gradient-to-r ${banner.bg} flex items-center justify-between px-8 transition-opacity duration-500 ${
                    i === currentBanner ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{banner.title}</h2>
                    <p className="text-white/80 text-sm md:text-base mb-4">{banner.subtitle}</p>
                    <button
                      onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-white text-orange-600 font-bold px-6 py-2 rounded-full text-sm hover:bg-orange-50 transition"
                    >
                      Shop Now →
                    </button>
                  </div>
                  <span className="text-7xl md:text-9xl opacity-30">{banner.emoji}</span>
                </div>
              ))}

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {BANNERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentBanner(i)}
                    className={`w-2 h-2 rounded-full transition ${i === currentBanner ? 'bg-white w-6' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {TRUST_BADGES.map((badge, i) => (
                <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-gray-100 shadow-sm">
                  <span className="text-2xl">{badge.emoji}</span>
                  <div>
                    <p className="font-semibold text-xs text-gray-800">{badge.title}</p>
                    <p className="text-gray-400 text-xs">{badge.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Products Section */}
            <div id="products" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

              {/* Search + Filter */}
              <div className="flex gap-3 mb-4 flex-wrap">
                <input
                  type="text"
                  placeholder="🔍 Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 min-w-48 border border-gray-200 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition ${
                    showFilter ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-500 hover:border-orange-500'
                  }`}
                >
                  🔧 Filter
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-500 focus:outline-none focus:border-orange-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>

              {/* Mobile Categories */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 lg:hidden">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id); setPage(1); }}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                      category === cat.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              {/* Filter Panel */}
              {showFilter && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                  <h3 className="font-bold mb-3 text-sm text-gray-700">Filter by Price</h3>
                  <div className="flex gap-4 items-end flex-wrap">
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Min (৳)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">Max (৳)</label>
                      <input
                        type="number"
                        placeholder="99999"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setPage(1); fetchProducts(); setShowFilter(false); }}
                        className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2 rounded-xl text-sm transition"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => { setPriceRange({ min: '', max: '' }); setSortBy('newest'); setPage(1); setShowFilter(false); }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold px-5 py-2 rounded-xl text-sm transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Grid */}
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <div className="text-5xl mb-4">😅</div>
                  <p>No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded-full text-sm font-bold transition ${
                        page === i + 1
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import { productsAPI, settingsAPI } from './lib/api';
import { useStore } from './lib/store';
import { translations } from './lib/translations';
import { Toaster } from 'react-hot-toast';

const CATEGORY_EMOJIS: { [key: string]: string } = {
  all: '🏪', kitchen: '🍳', home: '🏠', bedroom: '🛏️',
  bathroom: '🚿', cleaning: '🧹', living: '🛋️', shelf: '📚',
  default: '📦'
};

const DEFAULT_BANNERS = [
  { bg: 'from-orange-500 to-amber-400', title: 'Summer Sale!', subtitle: 'Up to 50% off on Kitchen items', emoji: '🍳', link: '/', imageUrl: null },
  { bg: 'from-blue-500 to-cyan-400', title: 'New Arrivals', subtitle: 'Fresh home decor collection', emoji: '🏠', link: '/', imageUrl: null },
  { bg: 'from-emerald-500 to-teal-400', title: 'Flash Deal', subtitle: 'Limited time offers today', emoji: '⚡', link: '/', imageUrl: null },
];

const DEFAULT_BADGES = [
  { emoji: '🚚', title: 'Fast Delivery', subtitle: 'Free shipping over ৳2000' },
  { emoji: '✅', title: 'Quality Products', subtitle: 'Verified & authenticated' },
  { emoji: '📞', title: 'Customer Support', subtitle: '9am to 9pm daily' },
  { emoji: '💳', title: 'Secure Payment', subtitle: 'bKash, Nagad & COD' },
];

export default function Home() {
  const router = useRouter();
  const { language } = useStore();
  const t = translations[language];

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
  const [settings, setSettings] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: string; label: string; emoji: string }[]>([
    { id: 'all', label: t.allProducts, emoji: '🏪' }
  ]);

  const banners = settings?.banners || DEFAULT_BANNERS;
  const trustBadges = settings?.trustBadges || DEFAULT_BADGES;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsAPI.get();
        setSettings(res.data);
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await productsAPI.getAll({ page: 1 });
        const cats = [...new Set(res.data.products.map((p: any) => p.category))] as string[];
        setCategories([
          { id: 'all', label: t.allProducts, emoji: '🏪' },
          ...cats.map(c => ({
            id: c,
            label: c.charAt(0).toUpperCase() + c.slice(1),
            emoji: CATEGORY_EMOJIS[c] || CATEGORY_EMOJIS.default
          }))
        ]);
      } catch (err) {}
    };
    fetchCategories();
  }, [language]);

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

  const handleBannerClick = (banner: any) => {
    if (banner.link && banner.link !== '/') router.push(banner.link);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex gap-5">

          {/* ── Left Sidebar ── */}
          <div className="hidden lg:flex flex-col w-52 flex-shrink-0 gap-4">

            {/* Category List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-20">
              <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white px-4 py-3.5 font-bold text-xs tracking-wider uppercase flex items-center gap-2">
                <span>▦</span> {t.shopByCategory}
              </div>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setPage(1); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-50 last:border-0 transition-all text-left group ${
                    category === cat.id
                      ? 'bg-orange-50 text-orange-500 font-semibold border-l-2 border-l-orange-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-orange-500'
                  }`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="flex-1">{cat.label}</span>
                  <span className={`text-xs transition-transform ${category === cat.id ? 'text-orange-400 translate-x-0.5' : 'text-gray-300 group-hover:translate-x-0.5'}`}>›</span>
                </button>
              ))}
            </div>

            {/* Promo Card */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-400 rounded-2xl p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Special Offer</p>
              <p className="text-xl font-black mb-1">Free Delivery</p>
              <p className="text-xs opacity-80 mb-3">On orders above ৳2,000</p>
              <button
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-orange-500 text-xs font-bold px-4 py-2 rounded-full hover:bg-orange-50 transition"
              >
                Shop Now →
              </button>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Banner Slider */}
            <div className="relative rounded-2xl overflow-hidden h-52 md:h-72 shadow-sm">
              {banners.map((banner: any, i: number) => (
                <div
                  key={i}
                  onClick={() => handleBannerClick(banner)}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    i === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  } ${banner.link && banner.link !== '/' ? 'cursor-pointer' : ''}`}
                >
                  {banner.imageUrl ? (
                    <div className="relative w-full h-full">
                      <img src={`http://localhost:5000${banner.imageUrl}`} className="w-full h-full object-cover" alt={banner.title} />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center px-10">
                        <div>
                          <p className="text-white/70 text-sm font-medium mb-1">ShopBD Exclusive</p>
                          <h2 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight">{banner.title}</h2>
                          <p className="text-white/80 text-sm md:text-base mb-5">{banner.subtitle}</p>
                          {banner.link && banner.link !== '/' && (
                            <span className="bg-orange-500 text-white font-bold px-6 py-2.5 rounded-full text-sm hover:bg-orange-400 transition inline-block">
                              {t.shopNow}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-r ${banner.bg} flex items-center justify-between px-10 relative overflow-hidden`}>
                      {/* Background pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-4 right-32 w-32 h-32 rounded-full bg-white"></div>
                        <div className="absolute -bottom-8 right-16 w-48 h-48 rounded-full bg-white"></div>
                        <div className="absolute top-1/2 right-1/3 w-16 h-16 rounded-full bg-white"></div>
                      </div>
                      <div className="relative z-10">
                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">ShopBD Exclusive</p>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight">{banner.title}</h2>
                        <p className="text-white/80 text-sm md:text-base mb-5">{banner.subtitle}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="bg-white text-gray-800 font-bold px-6 py-2.5 rounded-full text-sm hover:bg-gray-50 transition shadow-sm"
                        >
                          {t.shopNow}
                        </button>
                      </div>
                      <span className="text-8xl md:text-[10rem] opacity-20 relative z-10 select-none">{banner.emoji}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {banners.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentBanner(i)}
                    className={`rounded-full transition-all duration-300 ${i === currentBanner ? 'bg-white w-6 h-2' : 'bg-white/50 w-2 h-2'}`}
                  />
                ))}
              </div>

              {/* Nav Arrows */}
              <button
                onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow-sm transition z-10 text-sm"
              >‹</button>
              <button
                onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow-sm transition z-10 text-sm"
              >›</button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {trustBadges.map((badge: any, i: number) => (
                <div key={i} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {badge.emoji}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-800">{badge.title}</p>
                    <p className="text-gray-400 text-xs leading-tight mt-0.5">{badge.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Products Section */}
            <div id="products" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Section Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                  <h2 className="font-bold text-gray-800">
                    {category === 'all' ? t.allProducts : categories.find(c => c.id === category)?.label}
                  </h2>
                  <span className="bg-orange-50 text-orange-500 text-xs font-bold px-2 py-0.5 rounded-full">{products.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilter(!showFilter)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      showFilter ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-500 hover:border-orange-500 hover:text-orange-500'
                    }`}
                  >
                    ⚙️ {t.filter}
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:border-orange-500"
                  >
                    <option value="newest">{t.newest}</option>
                    <option value="price_low">{t.priceLowHigh}</option>
                    <option value="price_high">{t.priceHighLow}</option>
                  </select>
                </div>
              </div>

              <div className="p-5">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    placeholder={`🔍 ${t.search}`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-5 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-gray-50 transition"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">×</button>
                  )}
                </div>

                {/* Mobile Categories */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-4 lg:hidden scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setCategory(cat.id); setPage(1); }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${
                        category === cat.id
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Filter Panel */}
                {showFilter && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                    <h3 className="font-bold mb-3 text-sm text-gray-700">{t.filterByPrice}</h3>
                    <div className="flex gap-4 items-end flex-wrap">
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Min (৳)</label>
                        <input type="number" placeholder="0" value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                          className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Max (৳)</label>
                        <input type="number" placeholder="99999" value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                          className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setPage(1); fetchProducts(); setShowFilter(false); }}
                          className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2 rounded-xl text-sm transition">{t.apply}</button>
                        <button onClick={() => { setPriceRange({ min: '', max: '' }); setSortBy('newest'); setPage(1); setShowFilter(false); }}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold px-5 py-2 rounded-xl text-sm transition">{t.clear}</button>
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
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">😅</div>
                    <p className="text-gray-400 font-medium">{t.noProducts}</p>
                    <button onClick={() => { setCategory('all'); setSearch(''); }}
                      className="mt-4 text-orange-500 text-sm font-semibold hover:underline">
                      Clear filters
                    </button>
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
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-9 h-9 rounded-xl text-sm font-bold transition bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-30"
                    >‹</button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition ${
                          page === i + 1 ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-9 h-9 rounded-xl text-sm font-bold transition bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-30"
                    >›</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
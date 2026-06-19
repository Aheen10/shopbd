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
import Footer from './components/Footer';

const CATEGORY_EMOJIS: { [key: string]: string } = {
  all: '🏪', kitchen: '🍳', home: '🏠', bedroom: '🛏️',
  bathroom: '🚿', cleaning: '🧹', living: '🛋️', shelf: '📚',
  gift: '🎁', food: '🍎', electronics: '📱', fashion: '👗',
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
    { id: 'all', label: 'All Products', emoji: '🏪' }
  ]);

  const banners = settings?.banners || DEFAULT_BANNERS;
  const trustBadges = settings?.trustBadges || DEFAULT_BADGES;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) setSearch(searchParam);
  }, []);

  useEffect(() => {
    settingsAPI.get().then(res => setSettings(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentBanner(p => (p + 1) % banners.length), 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    productsAPI.getAll({ page: 1, limit: 1000 } as any).then(res => {
      const cats = [...new Set(res.data.products.map((p: any) => p.category))] as string[];
      setCategories([
        { id: 'all', label: t.allProducts, emoji: '🏪' },
        ...cats.map(c => ({
          id: c,
          label: c.charAt(0).toUpperCase() + c.slice(1),
          emoji: CATEGORY_EMOJIS[c.toLowerCase()] || CATEGORY_EMOJIS.default
        }))
      ]);
    }).catch(() => {});
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
        sortBy: sortBy !== 'newest' ? sortBy : undefined,
      });
      setProducts(res.data.products);
      setTotalPages(res.data.totalPages);
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [category, page, sortBy]);
  useEffect(() => { const t = setTimeout(fetchProducts, 400); return () => clearTimeout(t); }, [search]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900 overflow-x-hidden">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <div className="max-w-[1600px] mx-auto px-4 py-4 overflow-x-hidden w-full">
        <div className="flex gap-4 flex-wrap lg:flex-nowrap w-full overflow-x-hidden">

          {/* ── Left Sidebar ── */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
              <div className="bg-orange-500 text-white px-4 py-3 font-bold text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {t.shopByCategory}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategory(cat.id); setPage(1); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-100 last:border-0 transition-all text-left group ${
                      category === cat.id
                        ? 'bg-orange-50 text-orange-600 font-semibold border-l-4 border-l-orange-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-orange-500'
                    }`}
                  >
                    <span className="text-lg w-6 text-center">{cat.emoji}</span>
                    <span className="flex-1">{cat.label}</span>
                    <span className="text-gray-300 group-hover:text-orange-300 text-xs">›</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0 w-full overflow-hidden space-y-4">

            {/* Banner Slider */}
            <div className="relative rounded-xl overflow-hidden h-48 sm:h-56 md:h-80 shadow-sm w-full max-w-full">
              {banners.map((banner: any, i: number) => (
                <div key={i}
                  onClick={() => banner.link && banner.link !== '/' && router.push(banner.link)}
                  className={`absolute inset-0 transition-opacity duration-700 ${i === currentBanner ? 'opacity-100' : 'opacity-0'} ${banner.link && banner.link !== '/' ? 'cursor-pointer' : ''}`}
                >
                  {banner.imageUrl ? (
                    <div className="relative w-full h-full">
                      <img src={`http://localhost:5000${banner.imageUrl}`} className="w-full h-full object-cover" alt={banner.title} />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center px-4 sm:px-8 md:px-12">
                        <div className="max-w-[80%]">
                          <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-white mb-1 sm:mb-2 drop-shadow-lg leading-tight">{banner.title}</h2>
                          <p className="text-white/90 text-xs sm:text-base mb-3 sm:mb-5 drop-shadow line-clamp-2">{banner.subtitle}</p>
                          {banner.link && banner.link !== '/' && (
                            <span className="bg-orange-500 text-white font-bold px-4 sm:px-8 py-1.5 sm:py-3 rounded-full text-xs sm:text-sm inline-block shadow-lg">
                              Shop Now →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-r ${banner.bg} flex items-center justify-between px-4 sm:px-8 md:px-12 relative overflow-hidden`}>
                      <div className="absolute inset-0 opacity-10 overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white"></div>
                        <div className="absolute -bottom-10 right-32 w-48 h-48 rounded-full bg-white"></div>
                      </div>
                      <div className="relative z-10 max-w-[75%] sm:max-w-none">
                        <p className="text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-3">ShopBD Exclusive</p>
                        <h2 className="text-xl sm:text-3xl md:text-5xl font-black text-white mb-1 sm:mb-3 leading-tight">{banner.title}</h2>
                        <p className="text-white/80 text-xs sm:text-base mb-3 sm:mb-6 line-clamp-2">{banner.subtitle}</p>
                        <button onClick={e => { e.stopPropagation(); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
                          className="bg-white text-gray-800 font-bold px-4 sm:px-8 py-1.5 sm:py-3 rounded-full text-xs sm:text-sm hover:bg-gray-50 transition shadow-lg">
                          Shop Now →
                        </button>
                      </div>
                      <span className="hidden sm:block text-[10rem] md:text-[14rem] opacity-20 relative z-10 select-none flex-shrink-0">{banner.emoji}</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_: any, i: number) => (
                  <button key={i} onClick={() => setCurrentBanner(i)}
                    className={`rounded-full transition-all ${i === currentBanner ? 'bg-white w-6 h-2.5' : 'bg-white/50 w-2.5 h-2.5'}`} />
                ))}
              </div>
              <button onClick={() => setCurrentBanner(p => (p - 1 + banners.length) % banners.length)}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow-md transition z-10 text-base sm:text-lg font-bold">‹</button>
              <button onClick={() => setCurrentBanner(p => (p + 1) % banners.length)}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-700 shadow-md transition z-10 text-base sm:text-lg font-bold">›</button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {trustBadges.map((badge: any, i: number) => (
                <div key={i} className="bg-white rounded-xl px-2 py-3 flex items-center gap-2 border border-gray-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all min-w-0 overflow-hidden">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">{badge.emoji}</div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-gray-800 truncate">{badge.title}</p>
                    <p className="text-gray-500 text-xs leading-tight mt-0.5 line-clamp-1">{badge.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Products Section */}
            <div id="products" className="bg-white rounded-xl border border-gray-200 shadow-sm">

              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-7 bg-orange-500 rounded-full"></div>
                  <h2 className="font-bold text-gray-800 text-lg">
                    {category === 'all' ? t.allProducts : categories.find(c => c.id === category)?.label}
                  </h2>
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full">{products.length} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowFilter(!showFilter)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition ${showFilter ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-500 hover:border-orange-500 hover:text-orange-500'}`}>
                    ⚙️ Filter
                  </button>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 focus:outline-none focus:border-orange-500 bg-white">
                    <option value="newest">Newest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
              </div>

              <div className="p-3 sm:p-5">
                {/* Search */}
                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input type="text" placeholder={t.search} value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-gray-50 transition" />
                  {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">×</button>}
                </div>

                {/* Mobile Categories */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-5 lg:hidden">
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => { setCategory(cat.id); setPage(1); }}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${category === cat.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-500'}`}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>

                {/* Filter */}
                {showFilter && (
                  <div className="bg-orange-50 rounded-xl p-5 mb-5 border border-orange-100">
                    <h3 className="font-bold mb-3 text-sm text-gray-700">Filter by Price</h3>
                    <div className="flex gap-4 items-end flex-wrap">
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">Min (৳)</label>
                        <input type="number" placeholder="0" value={priceRange.min}
                          onChange={e => setPriceRange({ ...priceRange, min: e.target.value })}
                          className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white" />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs mb-1 block">Max (৳)</label>
                        <input type="number" placeholder="99999" value={priceRange.max}
                          onChange={e => setPriceRange({ ...priceRange, max: e.target.value })}
                          className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setPage(1); fetchProducts(); setShowFilter(false); }}
                          className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-2 rounded-xl text-sm transition">Apply</button>
                        <button onClick={() => { setPriceRange({ min: '', max: '' }); setSortBy('newest'); setPage(1); setShowFilter(false); }}
                          className="bg-white border border-gray-200 hover:border-gray-300 text-gray-600 font-bold px-6 py-2 rounded-xl text-sm transition">Clear</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products Grid */}
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />)}
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="text-7xl mb-4">😅</div>
                    <p className="text-gray-500 font-medium text-lg">No products found</p>
                    <button onClick={() => { setCategory('all'); setSearch(''); }}
                      className="mt-4 text-orange-500 font-semibold hover:underline text-sm">Clear filters</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {products.map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="w-10 h-10 rounded-xl text-sm font-bold bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-30 transition">‹</button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i} onClick={() => setPage(i + 1)}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition ${page === i + 1 ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500'}`}>
                        {i + 1}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="w-10 h-10 rounded-xl text-sm font-bold bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-30 transition">›</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
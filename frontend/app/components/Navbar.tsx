'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import { translations } from '../lib/translations';
import { productsAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function Navbar({ onCartClick }: { onCartClick?: () => void }) {
  const { user, logout, cart, language, toggleLanguage } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const t = translations[language];
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<any>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await productsAPI.getAll({ search: searchQuery, limit: 6 } as any);
        setSuggestions(res.data.products || []);
        setShowSuggestions(true);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (product: any) => {
    setSearchQuery('');
    setShowSuggestions(false);
    router.push(`/product/${product.id}`);
  };

  const handleLogout = () => {
    logout();
    toast.success(language === 'bn' ? 'সফলভাবে লগআউট হয়েছে' : 'Logged out successfully');
    setDropdownOpen(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <span key={i} className="text-orange-500 font-bold">{part}</span> : part
    );
  };

  return (
    <nav className="sticky top-0 z-50 shadow-md">
      <div className="bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="text-2xl font-black text-white flex-shrink-0 tracking-tight">
            Shop<span className="text-orange-100">BD</span>
          </Link>

          {/* Search with Suggestions */}
          <div className="flex-1 max-w-2xl hidden md:block" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); if (e.key === 'Escape') setShowSuggestions(false); }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className="w-full rounded-lg px-5 py-2.5 text-sm focus:outline-none text-gray-800 bg-white border-2 border-orange-300 focus:border-white placeholder-gray-400 pr-12"
              />
              <button onClick={handleSearch}
                className="absolute right-0 top-0 bottom-0 bg-orange-600 hover:bg-orange-700 text-white px-4 rounded-r-lg transition flex items-center">
                {searchLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">
                      {suggestions.length} result{suggestions.length !== 1 ? 's' : ''} found
                    </span>
                    <button onClick={() => setShowSuggestions(false)} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>
                  </div>
                  {suggestions.map((product, i) => (
                    <button
                      key={product.id}
                      onClick={() => handleSuggestionClick(product)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition text-left border-b border-gray-50 last:border-0 group"
                    >
                      {/* Product Image/Emoji */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        {product.imageUrl ? (
                          <img src={`http://localhost:5000${product.imageUrl}`} className="w-full h-full object-cover" alt={product.name} />
                        ) : (
                          <span className="text-lg">{product.emoji}</span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-orange-600">
                          {highlightMatch(product.name, searchQuery)}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">{product.category}</p>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-orange-500">৳{product.price.toLocaleString()}</p>
                        {product.oldPrice && (
                          <p className="text-xs text-gray-400 line-through">৳{product.oldPrice.toLocaleString()}</p>
                        )}
                      </div>

                      {/* Arrow */}
                      <span className="text-gray-300 group-hover:text-orange-400 ml-1">›</span>
                    </button>
                  ))}

                  {/* View All */}
                  <button
                    onClick={handleSearch}
                    className="w-full px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-500 text-sm font-bold transition flex items-center justify-center gap-2"
                  >
                    🔍 View all results for "{searchQuery}"
                  </button>
                </div>
              )}

              {/* No results */}
              {showSuggestions && suggestions.length === 0 && searchQuery.length >= 2 && !searchLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-50">
                  <div className="px-4 py-6 text-center">
                    <p className="text-gray-400 text-sm">😔 No products found for "<strong>{searchQuery}</strong>"</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage}
              className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition">
              {language === 'en' ? '🇧🇩 বাংলা' : '🇬🇧 English'}
            </button>

            <button onClick={onCartClick}
              className="relative flex items-center gap-2 bg-white text-orange-500 hover:bg-orange-50 font-bold px-4 py-2 rounded-lg text-sm transition">
              <span className="text-lg">🛒</span>
              <span className="hidden md:block">{t.cart}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-orange-500 text-xs font-black">
                    {user.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold hidden md:block">{user.name.split(' ')[0]}</span>
                  <span className="text-orange-200 text-xs">▾</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-xl p-2 w-52 shadow-xl z-50">
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                      <p className="text-gray-400 text-xs truncate">{user.email}</p>
                    </div>
                    <Link href="/orders" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-500 text-sm text-gray-700 transition">
                      📦 {t.myOrders}
                    </Link>
                    <Link href="/profile" onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-500 text-sm text-gray-700 transition">
                      👤 {t.profile}
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-orange-50 text-sm text-orange-500 font-semibold transition">
                        ⚙️ {t.admin} Dashboard
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm text-red-500 transition w-full">
                        🚪 {t.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="bg-white text-orange-500 hover:bg-orange-50 font-bold px-4 py-2 rounded-lg text-sm transition">
                {t.login}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
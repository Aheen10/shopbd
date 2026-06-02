'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '../lib/store';
import { translations } from '../lib/translations';
import toast from 'react-hot-toast';

export default function Navbar({ onCartClick }: { onCartClick?: () => void }) {
  const { user, logout, cart, language, toggleLanguage } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const t = translations[language];

  const handleLogout = () => {
    logout();
    toast.success(language === 'bn' ? 'সফলভাবে লগআউট হয়েছে' : 'Logged out successfully');
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 shadow-md">
      {/* Top Bar */}
      <div className="bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-black text-white flex-shrink-0 tracking-tight">
            Shop<span className="text-orange-100">BD</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg px-5 py-2.5 text-sm focus:outline-none text-gray-800 bg-white border-2 border-orange-300 focus:border-orange-200 placeholder-gray-400"
              />
              <button className="absolute right-0 top-0 bottom-0 bg-orange-600 hover:bg-orange-700 text-white px-4 rounded-r-lg transition flex items-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition"
            >
              {language === 'en' ? '🇧🇩 বাংলা' : '🇬🇧 English'}
            </button>

            {/* Cart */}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 bg-white text-orange-500 hover:bg-orange-50 font-bold px-4 py-2 rounded-lg text-sm transition"
            >
              <span className="text-lg">🛒</span>
              <span className="hidden md:block">{t.cart}</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition"
                >
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
              <Link href="/login"
                className="bg-white text-orange-500 hover:bg-orange-50 font-bold px-4 py-2 rounded-lg text-sm transition">
                {t.login}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
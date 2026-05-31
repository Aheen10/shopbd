'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '../lib/store';
import { translations } from '../lib/translations';
import toast from 'react-hot-toast';

export default function Navbar({ onCartClick }: { onCartClick?: () => void }) {
  const { user, logout, cart, language, toggleLanguage } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const t = translations[language];

  const handleLogout = () => {
    logout();
    toast.success(language === 'bn' ? 'সফলভাবে লগআউট হয়েছে' : 'Logged out successfully');
    setDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-black text-orange-500 flex-shrink-0">
          Shop<span className="text-gray-800">BD</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-lg hidden md:block">
          <div className="relative">
            <input
              type="text"
              placeholder={t.search}
              className="w-full border border-gray-200 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500">
              🔍
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-2 hover:border-orange-500 hover:text-orange-500 transition text-sm font-bold text-gray-600"
            title={language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
          >
            {language === 'en' ? (
              <>
                <span className="text-base">🇧🇩</span>
                <span className="hidden md:block text-xs">বাংলা</span>
              </>
            ) : (
              <>
                <span className="text-base">🇬🇧</span>
                <span className="hidden md:block text-xs">English</span>
              </>
            )}
          </button>

          {/* Cart */}
          <button
            onClick={onCartClick}
            className="relative flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 hover:border-orange-500 hover:text-orange-500 transition text-sm font-semibold text-gray-700"
          >
            🛒
            <span className="hidden md:block">{t.cart}</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {/* User */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-full hover:border-orange-500 transition"
              >
                <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-700 hidden md:block">{user.name.split(' ')[0]}</span>
                <span className="text-gray-400 text-xs">▾</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-2xl p-2 w-52 shadow-xl z-50">
                  <Link
                    href="/orders"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-500 text-sm text-gray-700 transition"
                  >
                    📦 {t.myOrders}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-orange-50 hover:text-orange-500 text-sm text-gray-700 transition"
                  >
                    👤 {t.profile}
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-orange-50 text-sm text-orange-500 font-semibold transition"
                    >
                      ⚙️ {t.admin} Dashboard
                    </Link>
                  )}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm text-red-500 transition w-full"
                    >
                      🚪 {t.logout}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-orange-400 transition"
            >
              {t.login}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import { translations } from '../lib/translations';
import { productsAPI } from '../lib/api';
import { joinRoom, getSocket } from '../lib/socket';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  message: string;
  type: 'new_order' | 'order_update';
  data: any;
  read: boolean;
  createdAt: string;
}

const getStorageKey = (userId: number) => `shopbd_notifs_${userId}`;

const loadNotifications = (userId: number): Notification[] => {
  try {
    const saved = localStorage.getItem(getStorageKey(userId));
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const saveNotifications = (userId: number, notifs: Notification[]) => {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(notifs.slice(0, 30)));
  } catch {}
};

export default function Navbar({ onCartClick }: { onCartClick?: () => void }) {
  const { user, logout, cart, language, toggleLanguage } = useStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const unreadCount = notifications.filter(n => !n.read).length;
  const t = translations[language];
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<any>(null);

  // Load notifications from localStorage when user logs in
  useEffect(() => {
    if (user?.id) {
      setNotifications(loadNotifications(user.id));
    } else {
      setNotifications([]);
    }
  }, [user?.id]);

  // Socket connection
  useEffect(() => {
    if (!user) return;
    const s = getSocket();
    joinRoom(user.id, user.role);

    const addNotif = (notif: Notification) => {
      setNotifications(prev => {
        const updated = [notif, ...prev].slice(0, 30);
        saveNotifications(user.id, updated);
        return updated;
      });
    };

    if (user.role === 'admin') {
      s.on('new_order', (data: any) => {
        addNotif({
          id: `order_${data.id}_${Date.now()}`,
          message: `🛒 New order ${data.uniqueId} from ${data.customerName} — ৳${data.total?.toLocaleString()}`,
          type: 'new_order',
          data,
          read: false,
          createdAt: new Date().toISOString(),
        });
        toast.success(`🛒 New order from ${data.customerName}!`, { duration: 5000 });
      });
    }

    s.on('order_update', (data: any) => {
      addNotif({
        id: `update_${data.orderId}_${Date.now()}`,
        message: `${data.message} (${data.uniqueId || '#' + data.orderId})`,
        type: 'order_update',
        data,
        read: false,
        createdAt: new Date().toISOString(),
      });
      toast.success(data.message, { duration: 5000 });
    });

    return () => {
      s.off('new_order');
      s.off('order_update');
    };
  }, [user?.id]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Search suggestions
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim() || searchQuery.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await productsAPI.getAll({ search: searchQuery, limit: 6 } as any);
        setSuggestions(res.data.products || []);
        setShowSuggestions(true);
      } catch { setSuggestions([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  const handleSearch = () => {
    if (searchQuery.trim()) { setShowSuggestions(false); router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`); }
  };

  const handleSuggestionClick = (product: any) => {
    setSearchQuery(''); setShowSuggestions(false); router.push(`/product/${product.id}`);
  };

  const handleLogout = () => {
    logout();
    toast.success(language === 'bn' ? 'সফলভাবে লগআউট হয়েছে' : 'Logged out successfully');
    setDropdownOpen(false);
  };

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      if (user?.id) saveNotifications(user.id, updated);
      return updated;
    });
  };

  const handleNotifClick = (notif: Notification) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notif.id ? { ...n, read: true } : n);
      if (user?.id) saveNotifications(user.id, updated);
      return updated;
    });
    setShowNotifications(false);
    if (notif.type === 'new_order') router.push('/admin?tab=orders');
    else router.push(`/orders/${notif.data.uniqueId || notif.data.orderId}`);
  };

  const clearAll = () => {
    setNotifications([]);
    if (user?.id) localStorage.removeItem(getStorageKey(user.id));
    setShowNotifications(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <span key={i} className="text-orange-500 font-bold">{part}</span> : part
    );
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const unreadNotifs = notifications.filter(n => !n.read);
  const readNotifs = notifications.filter(n => n.read);

  return (
    <nav className="sticky top-0 z-50 shadow-md">
      <div className="bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="text-2xl font-black text-white flex-shrink-0 tracking-tight">
            Shop<span className="text-orange-100">BD</span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-2xl hidden md:block" ref={searchRef}>
            <div className="relative">
              <input type="text" placeholder={t.search} value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); if (e.key === 'Escape') setShowSuggestions(false); }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className="w-full rounded-lg px-5 py-2.5 text-sm focus:outline-none text-gray-800 bg-white border-2 border-orange-300 focus:border-white placeholder-gray-400 pr-12"
              />
              <button onClick={handleSearch}
                className="absolute right-0 top-0 bottom-0 bg-orange-600 hover:bg-orange-700 text-white px-4 rounded-r-lg transition flex items-center">
                {searchLoading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                }
              </button>

              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">{suggestions.length} result{suggestions.length !== 1 ? 's' : ''} found</span>
                    <button onClick={() => setShowSuggestions(false)} className="text-gray-300 hover:text-gray-500 text-xs">✕</button>
                  </div>
                  {suggestions.map((product) => (
                    <button key={product.id} onClick={() => handleSuggestionClick(product)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition text-left border-b border-gray-50 last:border-0 group">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        {product.imageUrl ? <img src={`http://localhost:5000${product.imageUrl}`} className="w-full h-full object-cover" alt={product.name} /> : <span className="text-lg">{product.emoji}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-orange-600">{highlightMatch(product.name, searchQuery)}</p>
                        <p className="text-xs text-gray-400 capitalize">{product.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-orange-500">৳{product.price.toLocaleString()}</p>
                        {product.oldPrice && <p className="text-xs text-gray-400 line-through">৳{product.oldPrice.toLocaleString()}</p>}
                      </div>
                      <span className="text-gray-300 group-hover:text-orange-400 ml-1">›</span>
                    </button>
                  ))}
                  <button onClick={handleSearch} className="w-full px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-500 text-sm font-bold transition flex items-center justify-center gap-2">
                    🔍 View all results for "{searchQuery}"
                  </button>
                </div>
              )}

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

            {/* Notification Bell */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifications(!showNotifications)}
                  className="relative flex items-center justify-center w-10 h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{unreadCount} new</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-orange-500 hover:text-orange-600 font-semibold">Mark all read</button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <div className="text-4xl mb-3">🔔</div>
                          <p className="text-gray-400 text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        <>
                          {/* Unread */}
                          {unreadNotifs.length > 0 && (
                            <div>
                              <p className="px-4 py-2 text-xs font-bold text-orange-500 bg-orange-50 border-b border-orange-100">
                                🔴 NEW ({unreadNotifs.length})
                              </p>
                              {unreadNotifs.map((notif) => (
                                <button key={notif.id} onClick={() => handleNotifClick(notif)}
                                  className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-orange-50 transition bg-white">
                                  <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-orange-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm leading-snug font-semibold text-gray-800">{notif.message}</p>
                                      <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Read */}
                          {readNotifs.length > 0 && (
                            <div>
                              <p className="px-4 py-2 text-xs font-bold text-gray-400 bg-gray-50 border-b border-gray-100">
                                EARLIER ({readNotifs.length})
                              </p>
                              {readNotifs.map((notif) => (
                                <button key={notif.id} onClick={() => handleNotifClick(notif)}
                                  className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                                  <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gray-200" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm leading-snug text-gray-500">{notif.message}</p>
                                      <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                        <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-400 transition">
                          🗑️ Clear all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
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

            {/* User */}
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import api from '../lib/api';
import Footer from '../components/Footer';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser, logout } = useStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [address, setAddress] = useState({ division: '', district: '', thana: '', address: '', phone: '' });

  useEffect(() => {
    const token = localStorage.getItem('shopbd_token');
    if (!token) { router.push('/login'); return; }
    if (user) setForm(f => ({ ...f, name: user.name }));
    const savedAddress = localStorage.getItem('shopbd_address');
    if (savedAddress) setAddress(JSON.parse(savedAddress));
  }, [user]);

  const handleSaveAddress = () => {
    localStorage.setItem('shopbd_address', JSON.stringify(address));
    toast.success('Address saved! ✅');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Logged out successfully');
  };

  const MENU = [
    { id: 'account', emoji: '⚙️', label: 'Manage My Account' },
    { id: 'address', emoji: '📍', label: 'My Addresses' },
    { id: 'orders', emoji: '📦', label: 'My Orders', link: '/orders' },
    { id: 'wishlist', emoji: '❤️', label: 'My Wishlist & Followed Stores' },
    { id: 'reviews', emoji: '⭐', label: 'My Reviews' },
    { id: 'returns', emoji: '🔄', label: 'My Returns & Cancellations' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* User Info */}
              <div className="p-5 border-b border-gray-800 flex items-center gap-3">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-black">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{user?.name}</p>
                  <p className="text-gray-400 text-xs">{user?.email}</p>
                </div>
              </div>

              {/* Menu */}
              <div className="p-2">
                {MENU.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => item.link ? router.push(item.link) : setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition text-left ${
                      activeTab === item.id
                        ? 'bg-orange-500/10 text-orange-400 font-semibold'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
                <div className="border-t border-gray-800 mt-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition text-red-400 hover:bg-red-500/10"
                  >
                    <span>🚪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-2">

            {/* Manage Account */}
            {activeTab === 'account' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">⚙️ Manage My Account</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-500 text-sm cursor-not-allowed"
                    />
                    <p className="text-gray-600 text-xs mt-1">Email cannot be changed</p>
                  </div>

                  <div className="border-t border-gray-800 pt-4">
                    <h3 className="font-semibold mb-3 text-sm text-gray-300">Change Password</h3>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Current Password"
                        value={form.currentPassword}
                        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="password"
                        placeholder="New Password"
                        value={form.newPassword}
                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => toast.success('Profile updated! ✅')}
                    className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Address */}
            {activeTab === 'address' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">📍 My Addresses</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm mb-1 block">Division</label>
                      <select
                        value={address.division}
                        onChange={(e) => setAddress({ ...address, division: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Select Division</option>
                        <option>Dhaka</option>
                        <option>Chittagong</option>
                        <option>Rajshahi</option>
                        <option>Khulna</option>
                        <option>Barisal</option>
                        <option>Sylhet</option>
                        <option>Rangpur</option>
                        <option>Mymensingh</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-1 block">District</label>
                      <input
                        type="text"
                        placeholder="Your district"
                        value={address.district}
                        onChange={(e) => setAddress({ ...address, district: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Thana/Upazila</label>
                    <input
                      type="text"
                      placeholder="Your thana"
                      value={address.thana}
                      onChange={(e) => setAddress({ ...address, thana: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Full Address</label>
                    <textarea
                      placeholder="House no, Road no, Area..."
                      value={address.address}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                      rows={3}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={handleSaveAddress}
                    className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition"
                  >
                    Save Address
                  </button>
                </div>
              </div>
            )}

            {/* Wishlist */}
            {activeTab === 'wishlist' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">❤️ My Wishlist</h2>
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">❤️</div>
                  <p>Your wishlist is empty</p>
                  <button
                    onClick={() => router.push('/')}
                    className="mt-4 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-2 rounded-full transition text-sm"
                  >
                    Browse Products
                  </button>
                </div>
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">⭐ My Reviews</h2>
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">⭐</div>
                  <p>No reviews yet</p>
                  <p className="text-sm mt-2">Buy products and share your experience!</p>
                </div>
              </div>
            )}

            {/* Returns */}
            {activeTab === 'returns' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6">🔄 My Returns & Cancellations</h2>
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">🔄</div>
                  <p>No returns or cancellations</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
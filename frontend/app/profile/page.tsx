'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ordersAPI, returnsAPI } from '../lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [form, setForm] = useState({ name: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [address, setAddress] = useState({ division: '', district: '', thana: '', address: '', phone: '' });

  // Returns state
  const [returns, setReturns] = useState<any[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnForm, setReturnForm] = useState({ orderId: '', reason: '' });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('shopbd_token');
    if (!token) { router.push('/login'); return; }
    if (user) setForm(f => ({ ...f, name: user.name }));
    const savedAddress = localStorage.getItem('shopbd_address');
    if (savedAddress) setAddress(JSON.parse(savedAddress));
  }, [user]);

  useEffect(() => {
    if (activeTab === 'returns') {
      fetchReturns();
      fetchDeliveredOrders();
    }
  }, [activeTab]);

  const fetchReturns = async () => {
    setReturnsLoading(true);
    try {
      const res = await returnsAPI.myReturns();
      setReturns(res.data);
    } catch {} finally { setReturnsLoading(false); }
  };

  const fetchDeliveredOrders = async () => {
    try {
      const res = await ordersAPI.myOrders();
      setDeliveredOrders(res.data.filter((o: any) => o.status === 'delivered'));
    } catch {}
  };

  const handleSubmitReturn = async () => {
    if (!returnForm.orderId) { toast.error('Please select an order'); return; }
    if (!returnForm.reason.trim()) { toast.error('Please provide a reason'); return; }
    setSubmittingReturn(true);
    try {
      await returnsAPI.create(parseInt(returnForm.orderId), returnForm.reason);
      toast.success('Return request submitted! ✅');
      setShowReturnForm(false);
      setReturnForm({ orderId: '', reason: '' });
      fetchReturns();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit return request');
    } finally { setSubmittingReturn(false); }
  };

  const handleSaveAddress = () => {
    localStorage.setItem('shopbd_address', JSON.stringify(address));
    toast.success('Address saved! ✅');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Logged out successfully');
  };

  const getReturnStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const MENU = [
    { id: 'account', emoji: '⚙️', label: 'Manage My Account' },
    { id: 'address', emoji: '📍', label: 'My Addresses' },
    { id: 'orders', emoji: '📦', label: 'My Orders', link: '/orders' },
    { id: 'wishlist', emoji: '❤️', label: 'My Wishlist', link: '/wishlist' },
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
              <div className="p-5 border-b border-gray-800 flex items-center gap-3">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-black">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white">{user?.name}</p>
                  <p className="text-gray-400 text-xs">{user?.email}</p>
                </div>
              </div>
              <div className="p-2">
                {MENU.map((item) => (
                  <button key={item.id}
                    onClick={() => item.link ? router.push(item.link) : setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition text-left ${
                      activeTab === item.id
                        ? 'bg-orange-500/10 text-orange-400 font-semibold'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}>
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
                <div className="border-t border-gray-800 mt-2 pt-2">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition text-red-400 hover:bg-red-500/10">
                    <span>🚪</span><span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-2">

            {/* Account */}
            {activeTab === 'account' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 text-white">⚙️ Manage My Account</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Email</label>
                    <input type="email" value={user?.email || ''} disabled
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-500 text-sm cursor-not-allowed" />
                    <p className="text-gray-600 text-xs mt-1">Email cannot be changed</p>
                  </div>
                  <div className="border-t border-gray-800 pt-4">
                    <h3 className="font-semibold mb-3 text-sm text-gray-300">Change Password</h3>
                    <div className="space-y-3">
                      <input type="password" placeholder="Current Password" value={form.currentPassword}
                        onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
                      <input type="password" placeholder="New Password" value={form.newPassword}
                        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
                      <input type="password" placeholder="Confirm New Password" value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
                    </div>
                  </div>
                  <button onClick={() => toast.success('Profile updated! ✅')}
                    className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Address */}
            {activeTab === 'address' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 text-white">📍 My Addresses</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm mb-1 block">Division</label>
                      <select value={address.division} onChange={(e) => setAddress({ ...address, division: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500">
                        <option value="">Select Division</option>
                        {['Dhaka','Chittagong','Rajshahi','Khulna','Barisal','Sylhet','Rangpur','Mymensingh'].map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-1 block">District</label>
                      <input type="text" placeholder="Your district" value={address.district}
                        onChange={(e) => setAddress({ ...address, district: e.target.value })}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Thana/Upazila</label>
                    <input type="text" placeholder="Your thana" value={address.thana}
                      onChange={(e) => setAddress({ ...address, thana: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Full Address</label>
                    <textarea placeholder="House no, Road no, Area..." value={address.address} rows={3}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Phone Number</label>
                    <input type="tel" placeholder="01XXXXXXXXX" value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                  <button onClick={handleSaveAddress}
                    className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition">
                    Save Address
                  </button>
                </div>
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-bold mb-6 text-white">⭐ My Reviews</h2>
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">⭐</div>
                  <p>No reviews yet</p>
                  <p className="text-sm mt-2">Buy products and share your experience!</p>
                </div>
              </div>
            )}

            {/* Returns */}
            {activeTab === 'returns' && (
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">🔄 My Returns & Cancellations</h2>
                    <button onClick={() => setShowReturnForm(!showReturnForm)}
                      className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition">
                      + New Request
                    </button>
                  </div>

                  {/* Return Form */}
                  {showReturnForm && (
                    <div className="bg-gray-800 rounded-xl p-5 mb-4 space-y-4">
                      <h3 className="font-bold text-white text-sm">📝 Submit Return Request</h3>
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Select Delivered Order *</label>
                        {deliveredOrders.length === 0 ? (
                          <p className="text-gray-500 text-sm bg-gray-700 rounded-xl px-4 py-3">No delivered orders found</p>
                        ) : (
                          <select value={returnForm.orderId} onChange={(e) => setReturnForm({ ...returnForm, orderId: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500">
                            <option value="">Select an order...</option>
                            {deliveredOrders.map((o: any) => (
                              <option key={o.id} value={o.id}>
                                {o.uniqueId || `#${o.id}`} — ৳{o.total.toLocaleString()} ({new Date(o.createdAt).toLocaleDateString()})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Reason for Return *</label>
                        <textarea
                          placeholder="Please describe why you want to return this order..."
                          value={returnForm.reason}
                          onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                          rows={4}
                          className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={handleSubmitReturn} disabled={submittingReturn}
                          className="bg-orange-500 hover:bg-orange-400 disabled:bg-gray-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">
                          {submittingReturn ? 'Submitting...' : '✅ Submit Request'}
                        </button>
                        <button onClick={() => { setShowReturnForm(false); setReturnForm({ orderId: '', reason: '' }); }}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold px-6 py-2.5 rounded-xl text-sm transition">
                          Cancel
                        </button>
                      </div>
                      <p className="text-gray-500 text-xs">⚠️ Returns are only accepted within 7 days of delivery.</p>
                    </div>
                  )}

                  {/* Returns List */}
                  {returnsLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading...</div>
                  ) : returns.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-5xl mb-4">🔄</div>
                      <p>No return requests yet</p>
                      <p className="text-sm mt-2">Click "+ New Request" to submit a return</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {returns.map((ret: any) => (
                        <div key={ret.id} className="bg-gray-800 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="text-orange-400 font-bold text-sm">
                                {ret.order?.uniqueId || `#${ret.orderId}`}
                              </span>
                              <span className="text-gray-500 text-xs ml-2">
                                {new Date(ret.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${getReturnStatusColor(ret.status)}`}>
                              {ret.status === 'pending' ? '⏳ Pending' : ret.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mb-2"><span className="text-gray-300 font-semibold">Reason:</span> {ret.reason}</p>
                          {ret.adminNote && (
                            <div className="bg-gray-700 rounded-lg px-3 py-2 mt-2">
                              <p className="text-xs text-gray-400"><span className="text-orange-400 font-semibold">Admin Note:</span> {ret.adminNote}</p>
                            </div>
                          )}
                          {/* Order items */}
                          <div className="mt-3 space-y-1.5">
                            {ret.order?.orderItems?.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-1.5">
                                {item.product?.imageUrl
                                  ? <img src={`http://localhost:5000${item.product.imageUrl}`} className="w-6 h-6 rounded object-cover" />
                                  : <span className="text-sm">{item.product?.emoji}</span>}
                                <span className="flex-1 text-xs text-gray-300">{item.product?.name}</span>
                                <span className="text-xs text-gray-400">×{item.quantity}</span>
                                <span className="text-xs font-bold text-gray-200">৳{(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
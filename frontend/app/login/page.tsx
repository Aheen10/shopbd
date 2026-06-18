'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '../lib/api';
import { useStore } from '../lib/store';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', emailOrPhone: ''
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await authAPI.login({
          emailOrPhone: form.emailOrPhone,
          password: form.password
        });
        setUser(res.data.user, res.data.token);
        toast.success(`Welcome back, ${res.data.user.name}! 👋`);
        router.push('/');
      } else {
        // Validation
        if (!form.name) {
          toast.error('Name is required');
          setLoading(false);
          return;
        }
        if (!form.phone) {
          toast.error('Phone number is required');
          setLoading(false);
          return;
        }
        if (form.password.length < 8) {
          toast.error('Password must be at least 8 characters');
          setLoading(false);
          return;
        }

        const res = await authAPI.register({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone,
          password: form.password,
        });
        setUser(res.data.user, res.data.token);
        toast.success(`Account created! Welcome, ${res.data.user.name}! 🎉`);
        router.push('/');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster position="bottom-right" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-orange-500">
            Shop<span className="text-gray-800">BD</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">
            {mode === 'login' ? 'Welcome back!' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'login' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'register' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Register
            </button>
          </div>

          {/* LOGIN Form */}
          {mode === 'login' && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm mb-1 block font-medium">
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  placeholder="your@email.com or 01XXXXXXXXX"
                  value={form.emailOrPhone}
                  onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
                />
              </div>
              <div>
                <label className="text-gray-600 text-sm mb-1 block font-medium">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition mt-2"
              >
                {loading ? 'Please wait...' : 'Sign In'}
              </button>
              <div className="text-right mt-2">
                <Link href="/forgot-password" className="text-orange-500 hover:text-orange-400 text-xs font-semibold">
                  Forgot Password?
                </Link>
              </div>
            </div>
          )}

          {/* REGISTER Form */}
          {mode === 'register' && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm mb-1 block font-medium">Full Name *</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm mb-1 block font-medium">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm mb-1 block font-medium">
                  Email <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
                />
              </div>

              <div>
                <label className="text-gray-600 text-sm mb-1 block font-medium">
                  Password * <span className="text-gray-400 font-normal">(min 8 characters)</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition mt-2"
              >
                {loading ? 'Please wait...' : 'Create Account'}
              </button>
            </div>
          )}

          <p className="text-center text-gray-400 text-sm mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-orange-500 hover:text-orange-400 font-semibold"
            >
              {mode === 'login' ? 'Register' : 'Login'}
            </button>
          </p>
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          © 2025 ShopBD. All rights reserved.
        </p>
      </div>
    </div>
  );
}
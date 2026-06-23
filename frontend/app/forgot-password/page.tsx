'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authAPI } from '../lib/api';
import toast, { Toaster } from 'react-hot-toast';

type Step = 'select' | 'input' | 'otp' | 'newPassword' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [target, setTarget] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugOtp, setDebugOtp] = useState(''); // dev only

  const handleSendOTP = async () => {
    if (!target.trim()) { toast.error(method === 'email' ? 'Email required' : 'Phone number required'); return; }
    setLoading(true);
    try {
      if (method === 'email') {
        await authAPI.forgotPasswordEmail(target.trim());
        toast.success('OTP sent to your email! Check inbox.');
      } else {
        const res = await authAPI.forgotPasswordPhone(target.trim());
        toast.success('OTP generated!');
        if (res.data.debug_otp) {
          setDebugOtp(res.data.debug_otp);
          toast(`🔧 Dev OTP: ${res.data.debug_otp}`, { duration: 10000, icon: '📱' });
        }
      }
      setStep('otp');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    if (!newPassword || newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(target.trim(), otp, newPassword);
      toast.success('Password reset successfully!');
      setStep('success');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP');
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
          <p className="text-gray-500 mt-2 text-sm">Reset your password</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

          {/* Step 1: Select method */}
          {step === 'select' && (
            <div>
              <h2 className="text-xl font-black text-gray-800 mb-2">Forgot Password?</h2>
              <p className="text-gray-500 text-sm mb-6">Choose how you want to reset your password.</p>
              <div className="space-y-3">
                <button onClick={() => { setMethod('email'); setStep('input'); }}
                  className="w-full flex items-center gap-4 border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl p-4 transition text-left group">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📧</div>
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-orange-600">via Email</p>
                    <p className="text-gray-400 text-xs mt-0.5">OTP sent to your registered email</p>
                  </div>
                </button>
                <button onClick={() => { setMethod('phone'); setStep('input'); }}
                  className="w-full flex items-center gap-4 border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl p-4 transition text-left group">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📱</div>
                  <div>
                    <p className="font-bold text-gray-800 group-hover:text-orange-600">via Phone (SMS)</p>
                    <p className="text-gray-400 text-xs mt-0.5">OTP sent to your registered phone</p>
                  </div>
                </button>
              </div>
              <p className="text-center mt-6">
                <Link href="/login" className="text-orange-500 hover:text-orange-400 text-sm font-semibold">← Back to Login</Link>
              </p>
            </div>
          )}

          {/* Step 2: Enter email/phone */}
          {step === 'input' && (
            <div>
              <button onClick={() => setStep('select')} className="text-gray-400 hover:text-orange-500 text-sm mb-4 flex items-center gap-1">← Back</button>
              <h2 className="text-xl font-black text-gray-800 mb-2">
                {method === 'email' ? '📧 Enter Your Email' : '📱 Enter Your Phone'}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {method === 'email' ? 'We\'ll send a 6-digit OTP to your email.' : 'We\'ll send a 6-digit OTP to your phone.'}
              </p>
              <div className="space-y-4">
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  placeholder={method === 'email' ? 'your@email.com' : '01XXXXXXXXX'}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
                />
                <button onClick={handleSendOTP} disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition">
                  {loading ? 'Sending...' : 'Send OTP →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Enter OTP + New Password */}
          {step === 'otp' && (
            <div>
              <button onClick={() => setStep('input')} className="text-gray-400 hover:text-orange-500 text-sm mb-4 flex items-center gap-1">← Back</button>
              <h2 className="text-xl font-black text-gray-800 mb-2">🔐 Enter OTP</h2>
              <p className="text-gray-500 text-sm mb-1">
                OTP sent to <span className="font-semibold text-gray-700">{target}</span>
              </p>
              {method === 'phone' && (
                <p className="text-xs text-orange-500 mb-4 bg-orange-50 px-3 py-2 rounded-lg">
                  ⚠️ SMS gateway not configured yet. Check server console for OTP.
                  {debugOtp && <span className="font-black ml-1">OTP: {debugOtp}</span>}
                </p>
              )}
              {method === 'email' && <p className="text-gray-400 text-xs mb-6">Check your inbox (and spam folder).</p>}

              <div className="space-y-4">
                <div>
                  <label className="text-gray-600 text-sm font-medium mb-1 block">6-digit OTP</label>
                  <input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 bg-gray-50 text-center text-2xl font-black tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-medium mb-1 block">New Password</label>
                  <input
                    type="password"
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-gray-600 text-sm font-medium mb-1 block">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:border-orange-500 bg-gray-50"
                  />
                </div>
                <button onClick={handleVerifyOTP} disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition">
                  {loading ? 'Verifying...' : '🔐 Reset Password'}
                </button>
                <button onClick={handleSendOTP} disabled={loading}
                  className="w-full text-orange-500 hover:text-orange-400 text-sm font-semibold transition">
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-xl font-black text-gray-800 mb-2">Password Reset!</h2>
              <p className="text-gray-500 text-sm mb-6">Your password has been successfully reset. You can now login with your new password.</p>
              <button onClick={() => router.push('/login')}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition">
                Go to Login →
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">© 2025 ShopBD. All rights reserved.</p>
      </div>
    </div>
  );
}
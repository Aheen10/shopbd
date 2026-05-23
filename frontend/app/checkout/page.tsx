'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import { ordersAPI, paymentAPI } from '../lib/api';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, cart, cartTotal, clearCart } = useStore();
  const [step, setStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'cod'>('bkash');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const handlePlaceOrder = async () => {
    if (!user) { toast.error('Please login first'); router.push('/login'); return; }
    if (cart.length === 0) { toast.error('Cart is empty'); return; }

    setLoading(true);
    try {
      const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));
      const res = await ordersAPI.place(items);
      setOrderId(res.data.order.id);
      setStep('payment');
      toast.success('Order placed! Now complete payment.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!orderId) return;
    if (paymentMethod !== 'cod' && !phone) { toast.error('Phone number required'); return; }

    setLoading(true);
    try {
      if (paymentMethod === 'bkash') {
        await paymentAPI.bkash({ orderId, phone, amount: cartTotal() });
      } else if (paymentMethod === 'nagad') {
        await paymentAPI.nagad({ orderId, phone, amount: cartTotal() });
      } else {
        await paymentAPI.cod(orderId);
      }
      clearCart();
      setStep('success');
      toast.success('Payment successful! 🎉');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />

      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Success */}
        {step === 'success' && (
          <div className="text-center py-20">
            <div className="text-7xl mb-6">🎉</div>
            <h1 className="text-3xl font-black mb-3">Order Confirmed!</h1>
            <p className="text-gray-400 mb-8">Thank you for shopping with ShopBD!</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/')}
                className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-full transition"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => router.push('/orders')}
                className="border border-gray-700 hover:border-orange-500 text-gray-300 hover:text-orange-500 font-bold px-8 py-3 rounded-full transition"
              >
                My Orders
              </button>
            </div>
          </div>
        )}

        {/* Cart Review */}
        {step === 'cart' && (
          <div>
            <h1 className="text-3xl font-black mb-8">Checkout</h1>

            {cart.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-5xl mb-4">🛒</div>
                <p>Your cart is empty</p>
                <button onClick={() => router.push('/')} className="mt-4 text-orange-500 hover:text-orange-400">
                  Go Shopping →
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.productId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                      <span className="text-3xl">{item.emoji}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-orange-500">৳{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="font-bold">৳{cartTotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">Delivery</span>
                    <span className="text-green-400 font-bold">Free</span>
                  </div>
                  <div className="border-t border-gray-800 mt-4 pt-4 flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-black text-orange-500">৳{cartTotal().toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 text-white font-bold py-4 rounded-2xl transition text-lg"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment →'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Payment */}
        {step === 'payment' && (
          <div>
            <h1 className="text-3xl font-black mb-2">Payment</h1>
            <p className="text-gray-400 mb-8">Order #{orderId} — ৳{cartTotal().toLocaleString()}</p>

            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'bkash', label: 'bKash', emoji: '💳', color: 'pink' },
                { id: 'nagad', label: 'Nagad', emoji: '🔶', color: 'orange' },
                { id: 'cod', label: 'Cash on Delivery', emoji: '💵', color: 'green' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-4 rounded-2xl border-2 text-center transition ${
                    paymentMethod === method.id
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <div className="text-3xl mb-2">{method.emoji}</div>
                  <div className="text-xs font-bold">{method.label}</div>
                </button>
              ))}
            </div>

            {/* Phone Input */}
            {paymentMethod !== 'cod' && (
              <div className="mb-6">
                <label className="text-gray-400 text-sm mb-2 block">
                  {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Number
                </label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 text-green-400 text-sm">
                💵 Pay ৳{cartTotal().toLocaleString()} when your order arrives.
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-700 text-white font-bold py-4 rounded-2xl transition text-lg"
            >
              {loading ? 'Processing payment...' : `Pay ৳${cartTotal().toLocaleString()} →`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
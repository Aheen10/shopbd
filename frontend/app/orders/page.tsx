'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ordersAPI } from '../lib/api';
import Navbar from '../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/Footer';

const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', emoji: '📋' },
  { key: 'processing', label: 'Processing', emoji: '⚙️' },
  { key: 'shipped', label: 'Shipped', emoji: '🚚' },
  { key: 'delivered', label: 'Delivered', emoji: '📦' },
];

const getStepIndex = (status: string) => {
  switch (status) {
    case 'pending': return 0;
    case 'processing': case 'paid': case 'cod_pending': return 1;
    case 'shipped': return 2;
    case 'delivered': return 3;
    default: return 0;
  }
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('shopbd_token');
    if (!token) { router.push('/login'); return; }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.myOrders();
      setOrders(res.data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cod_pending': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-orange-500 text-xl animate-pulse">Loading orders...</div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-black mb-2">My <span className="text-orange-500">Orders</span></h1>
        <p className="text-gray-400 mb-8">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 mb-6">No orders yet!</p>
            <button
              onClick={() => router.push('/')}
              className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-full transition"
            >
              Start Shopping →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => (
              <div
                key={order.id}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:border-orange-200 transition cursor-pointer"
                onClick={() => router.push(`/orders/${order.uniqueId || order.id}`)}
              >
                {/* Order Header */}
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <span className="text-orange-500 font-black text-lg">{order.uniqueId || `#${order.id}`}</span>
                    <p className="text-gray-400 text-sm mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-BD', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">{order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''} · ৳{order.total.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-gray-300">›</span>
                  </div>
                </div>

                {/* Order Status Timeline */}
                <div className="px-5 pb-5">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 right-0 top-4 h-1 bg-gray-100 mx-8 z-0" />
                    <div
                      className="absolute left-0 top-4 h-1 bg-orange-500 z-0 transition-all duration-500"
                      style={{
                        width: `${(getStepIndex(order.status) / (ORDER_STEPS.length - 1)) * 100}%`,
                        marginLeft: '2rem',
                        maxWidth: 'calc(100% - 4rem)'
                      }}
                    />
                    {ORDER_STEPS.map((step, i) => {
                      const currentStep = getStepIndex(order.status);
                      const isCompleted = i <= currentStep;
                      const isCurrent = i === currentStep;
                      return (
                        <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all ${
                            isCompleted ? 'bg-orange-500 text-white shadow-md' : 'bg-white border-2 border-gray-200 text-gray-300'
                          } ${isCurrent ? 'ring-4 ring-orange-100' : ''}`}>
                            {isCompleted ? step.emoji : i + 1}
                          </div>
                          <span className={`text-xs font-medium text-center ${isCompleted ? 'text-orange-500' : 'text-gray-300'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
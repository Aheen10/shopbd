'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ordersAPI } from '../../lib/api';
import Navbar from '../../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import jsPDF from 'jspdf';
import Footer from '../../components/Footer';

const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', emoji: '📋', time: 'Order confirmed' },
  { key: 'processing', label: 'Processing', emoji: '⚙️', time: 'Being prepared' },
  { key: 'shipped', label: 'Shipped', emoji: '🚚', time: 'On the way' },
  { key: 'delivered', label: 'Delivered', emoji: '📦', time: 'Delivered' },
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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('shopbd_token');
    if (!token) { router.push('/login'); return; }
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await ordersAPI.myOrders();
      const found = res.data.find((o: any) =>
        o.id === parseInt(params.id as string) ||
        o.uniqueId === params.id
      );
      if (!found) { toast.error('Order not found'); router.push('/orders'); return; }
      setOrder(found);
    } catch (err) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(255, 107, 53);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ShopBD', 14, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Invoice / Receipt', 14, 28);

  // Order Info
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Details', 14, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Order ID: ${order.uniqueId || '#' + order.id}`, 14, 56);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 63);
  doc.text(`Status: ${order.status.toUpperCase()}`, 14, 70);
  doc.text(`Payment: ${order.status === 'cod_pending' ? 'Cash on Delivery' : 'Online Payment'}`, 14, 77);

  // Table Header
  let y = 90;
  doc.setFillColor(255, 107, 53);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Product', 16, y + 5.5);
  doc.text('Qty', 120, y + 5.5);
  doc.text('Unit Price', 140, y + 5.5);
  doc.text('Total', 175, y + 5.5);

  // Table Rows
  y += 10;
  order.orderItems.forEach((item: any, i: number) => {
    if (i % 2 === 0) {
      doc.setFillColor(255, 248, 245);
      doc.rect(14, y - 2, 182, 9, 'F');
    }
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const name = item.product.name.length > 35 ? item.product.name.substring(0, 35) + '...' : item.product.name;
    doc.text(name, 16, y + 4);
    doc.text(String(item.quantity), 122, y + 4);
    doc.text(`Tk ${item.price.toLocaleString()}`, 140, y + 4);
    doc.text(`Tk ${(item.price * item.quantity).toLocaleString()}`, 175, y + 4);
    y += 10;
  });

  // Total
  y += 5;
  doc.setFillColor(255, 248, 245);
  doc.rect(120, y, 76, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 107, 53);
  doc.text(`Total: Tk ${order.total.toLocaleString()}`, 125, y + 7);
  doc.setTextColor(100, 150, 100);
  doc.setFontSize(9);
  doc.text('Delivery: Free', 125, y + 14);

  // Footer
  y += 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Thank you for shopping with ShopBD!', 14, y);
  doc.text('© 2025 ShopBD. All rights reserved.', 14, y + 7);

  doc.save(`ShopBD-Invoice-${order.uniqueId || order.id}.pdf`);
  toast.success('Invoice downloaded! 📄');
};

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-orange-500 text-xl animate-pulse">Loading...</div>
    </div>
  );

  if (!order) return null;

  const currentStep = getStepIndex(order.status);
  const savedAddress = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('shopbd_address') || '{}')
    : {};

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Toaster position="bottom-right" />
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-orange-500 transition mb-6 text-sm"
        >
          ← Back to Orders
        </button>

        <h1 className="text-2xl font-black mb-6">Order Details</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left */}
          <div className="md:col-span-2 space-y-4">

            {/* Order Header */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Order ID</p>
                  <p className="text-orange-500 font-black text-lg">{order.uniqueId || `#${order.id}`}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700 border-green-200' :
                  order.status === 'shipped' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                  order.status === 'processing' || order.status === 'paid' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                }`}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Timeline */}
              <div className="relative pt-2">
                <div className="flex items-start justify-between relative">
                  <div className="absolute left-4 right-4 top-4 h-1 bg-gray-100 z-0" />
                  <div
                    className="absolute left-4 top-4 h-1 bg-orange-500 z-0 transition-all duration-700"
                    style={{ width: `${(currentStep / (ORDER_STEPS.length - 1)) * (100 - 8)}%` }}
                  />
                  {ORDER_STEPS.map((step, i) => {
                    const isCompleted = i <= currentStep;
                    const isCurrent = i === currentStep;
                    return (
                      <div key={step.key} className="flex flex-col items-center z-10 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-2 transition-all ${
                          isCompleted ? 'bg-orange-500 text-white shadow-md' : 'bg-white border-2 border-gray-200 text-gray-300'
                        } ${isCurrent ? 'ring-4 ring-orange-100 scale-110' : ''}`}>
                          {isCompleted ? step.emoji : i + 1}
                        </div>
                        <span className={`text-xs font-semibold text-center ${isCompleted ? 'text-orange-500' : 'text-gray-300'}`}>
                          {step.label}
                        </span>
                        <span className={`text-xs text-center mt-0.5 ${isCurrent ? 'text-gray-500' : 'text-gray-300'}`}>
                          {isCurrent ? step.time : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Timeline Details */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold mb-4">📅 Order Timeline</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order Placed</span>
                  <span className="font-medium">{new Date(order.createdAt).toLocaleString('en-BD')}</span>
                </div>
                {(order.status === 'paid' || order.status === 'processing') && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Payment Confirmed</span>
                    <span className="font-medium text-green-600">✅ Confirmed</span>
                  </div>
                )}
                {order.status === 'shipped' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipped</span>
                    <span className="font-medium text-purple-600">🚚 On the way</span>
                  </div>
                )}
                {order.status === 'delivered' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivered</span>
                    <span className="font-medium text-green-600">📦 Delivered</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium">
                    {order.status === 'cod_pending' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                  </span>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold mb-4">🛍️ Items ({order.orderItems.length})</h3>
              <div className="space-y-3">
                {order.orderItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                    {item.product.imageUrl ? (
                      <img
                        src={`http://localhost:5000${item.product.imageUrl}`}
                        className="w-14 h-14 object-cover rounded-xl"
                        alt={item.product.name}
                      />
                    ) : (
                      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-3xl border border-gray-100">
                        {item.product.emoji}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.product.name}</p>
                      <p className="text-gray-400 text-xs">Qty: {item.quantity} × ৳{item.price.toLocaleString()}</p>
                    </div>
                    <p className="text-orange-500 font-black">৳{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">

            {/* Total Summary */}
            {(() => {
              const subtotal = order.orderItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
              const deliveryFee = order.total - subtotal;
              return (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold mb-4">💰 Total Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal ({order.orderItems.length} items)</span>
                      <span>৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Fee</span>
                      {deliveryFee <= 0 ? (
                        <span className="text-green-600 font-semibold">Free</span>
                      ) : (
                        <span>৳{deliveryFee.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-base">
                      <span>Total</span>
                      <span className="text-orange-500">৳{order.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Delivery Address */}
            {savedAddress.address && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold mb-3">📍 Delivery Address</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-800">{savedAddress.phone}</p>
                  <p>{savedAddress.address}</p>
                  <p>{savedAddress.thana}, {savedAddress.district}</p>
                  <p>{savedAddress.division}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={downloadInvoice}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
              >
                📄 Download Invoice
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition text-sm"
              >
                🛒 Continue Shopping
              </button>
              {order.status === 'delivered' && (
                <button className="w-full border border-gray-200 text-gray-600 hover:border-orange-500 hover:text-orange-500 font-bold py-3 rounded-xl transition text-sm">
                  ⭐ Write a Review
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
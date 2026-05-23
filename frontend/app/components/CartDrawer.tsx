'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import toast from 'react-hot-toast';

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { cart, removeFromCart, updateQty, cartTotal, clearCart } = useStore();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-80 bg-gray-950 border-l border-gray-800 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Your Cart 🛒</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🛒</div>
              <p>Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="bg-gray-900 rounded-xl p-3 flex items-center gap-3 border border-gray-800">
                <span className="text-3xl">{item.emoji}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium line-clamp-1">{item.name}</p>
                  <p className="text-orange-500 text-sm font-bold">৳{(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1 bg-gray-800 rounded-full px-2 py-1">
                  <button
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="text-gray-400 hover:text-white w-5 h-5 flex items-center justify-center"
                  >−</button>
                  <span className="text-white text-sm w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    className="text-gray-400 hover:text-white w-5 h-5 flex items-center justify-center"
                  >+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">Total</span>
              <span className="text-xl font-black text-orange-500">৳{cartTotal().toLocaleString()}</span>
            </div>
            <button
              onClick={() => {
                onClose();
                router.push('/checkout');
              }}
              className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition"
            >
              Checkout →
            </button>
            <button
              onClick={() => { clearCart(); toast.success('Cart cleared'); }}
              className="w-full mt-2 text-gray-500 hover:text-red-400 text-sm transition"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
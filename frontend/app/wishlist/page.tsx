'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import CartDrawer from '../components/CartDrawer';
import { wishlistAPI } from '../lib/api';
import { useStore } from '../lib/store';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../components/Footer';

export default function WishlistPage() {
  const router = useRouter();
  const { user, addToCart } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('shopbd_token');
    if (!token) { router.push('/login'); return; }
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await wishlistAPI.get();
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      await wishlistAPI.remove(productId);
      setItems(prev => prev.filter(item => item.productId !== productId));
      toast.success('Removed from wishlist');

      // update cache
      try {
        const cached = localStorage.getItem('shopbd_wishlist_ids');
        const ids: number[] = cached ? JSON.parse(cached) : [];
        localStorage.setItem('shopbd_wishlist_ids', JSON.stringify(ids.filter(id => id !== productId)));
      } catch {}
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      quantity: 1,
    });
    toast.success(`🛒 ${product.name} added to cart!`);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-orange-500 text-xl animate-pulse">Loading...</div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-7 bg-orange-500 rounded-full"></div>
          <h1 className="text-2xl font-black text-gray-800">❤️ My Wishlist</h1>
          <span className="bg-orange-100 text-orange-500 text-xs font-bold px-2.5 py-1 rounded-full">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-20">
            <div className="text-6xl mb-4">💔</div>
            <p className="text-gray-500 font-medium text-lg mb-2">Your wishlist is empty</p>
            <p className="text-gray-400 text-sm mb-6">Save items you love by clicking the heart icon</p>
            <button onClick={() => router.push('/')}
              className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-8 py-3 rounded-full text-sm transition">
              Start Shopping →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item: any) => {
              const product = item.product;
              const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;
              return (
                <div key={item.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition group">
                  <div onClick={() => router.push(`/product/${product.id}`)} className="h-44 bg-gray-50 flex items-center justify-center relative overflow-hidden cursor-pointer">
                    {product.imageUrl ? (
                      <img src={`http://localhost:5000${product.imageUrl}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={product.name} />
                    ) : (
                      <span className="text-6xl">{product.emoji}</span>
                    )}
                    {discount && (
                      <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{discount}%</span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <span className="text-red-500 font-bold text-sm">Out of Stock</span>
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(product.id); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-sm transition z-10"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="p-3">
                    <p className="text-gray-400 text-xs capitalize mb-1">{product.category}</p>
                    <h3 onClick={() => router.push(`/product/${product.id}`)}
                      className="text-gray-800 font-semibold text-sm mb-2 line-clamp-2 leading-snug cursor-pointer hover:text-orange-500 transition">
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-orange-500 font-black text-base">৳{product.price.toLocaleString()}</span>
                      {product.oldPrice && (
                        <span className="text-gray-400 text-xs line-through">৳{product.oldPrice.toLocaleString()}</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold py-2 rounded-xl transition"
                    >
                      {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
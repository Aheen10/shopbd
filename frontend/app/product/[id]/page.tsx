'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productsAPI } from '../../lib/api';
import { useStore } from '../../lib/store';
import Navbar from '../../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToCart } = useStore();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    try {
      const res = await productsAPI.getOne(Number(params.id));
      setProduct(res.data);
    } catch (err) {
      toast.error('Product not found');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      quantity,
    });
    toast.success(`🛒 ${product.name} added to cart!`);
  };

  const discount = product?.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-orange-500 text-xl animate-pulse">Loading...</div>
    </div>
  );

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-orange-500 transition mb-8 flex items-center gap-2 text-sm"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Product Image */}
          <div className="bg-white border border-gray-100 rounded-2xl flex items-center justify-center h-80 md:h-96 relative shadow-sm">
            {product.imageUrl ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${product.imageUrl}`}
                alt={product.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <span className="text-9xl">{product.emoji}</span>
            )}
            {discount && (
              <span className="absolute top-4 left-4 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Product Info */}
          <div>
            <p className="text-gray-400 text-sm capitalize mb-2">{product.category}</p>
            <h1 className="text-2xl font-black mb-4 text-gray-800">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-black text-orange-500">
                ৳{product.price.toLocaleString()}
              </span>
              {product.oldPrice && (
                <span className="text-gray-400 text-lg line-through">
                  ৳{product.oldPrice.toLocaleString()}
                </span>
              )}
              {discount && (
                <span className="bg-green-100 text-green-600 text-sm font-bold px-2 py-1 rounded-full">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="mb-4">
              {product.stock === 0 ? (
                <span className="bg-red-100 text-red-500 text-sm font-bold px-3 py-1 rounded-full">❌ Out of Stock</span>
              ) : product.stock <= 5 ? (
                <span className="bg-red-100 text-red-500 text-sm font-bold px-3 py-1 rounded-full">⚠️ Only {product.stock} left!</span>
              ) : (
                <span className="bg-green-100 text-green-600 text-sm font-bold px-3 py-1 rounded-full">✅ In Stock ({product.stock} available)</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-gray-500 text-sm">Quantity:</span>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-gray-400 hover:text-orange-500 font-bold text-lg"
                >−</button>
                <span className="font-bold w-6 text-center text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="text-gray-400 hover:text-orange-500 font-bold text-lg"
                >+</button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl transition"
              >
                🛒 Add to Cart
              </button>
              <button
                onClick={() => { handleAddToCart(); router.push('/checkout'); }}
                disabled={product.stock === 0}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl transition"
              >
                ⚡ Buy Now
              </button>
            </div>

            {/* Specifications */}
            {product.specifications && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-4">
                <h3 className="font-bold mb-4 text-gray-800">📋 Specifications</h3>
                <div className="space-y-2">
                  {product.specifications.split('\n').filter(Boolean).map((spec: string, i: number) => {
                    const [key, ...rest] = spec.split(':');
                    const value = rest.join(':').trim();
                    return (
                      <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-gray-500 text-sm">{key?.trim()}</span>
                        <span className="text-gray-800 text-sm font-medium">{value || key}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Product Details */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold mb-3 text-sm text-gray-600">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Category</span>
                  <span className="capitalize text-gray-700">{product.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                  <span className="text-gray-400">Stock</span>
                  <span className="text-gray-700">{product.stock} units</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Product ID</span>
                  <span className="text-gray-400">#{product.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
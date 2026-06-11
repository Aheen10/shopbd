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
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'shipping'>('description');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => { fetchProduct(); }, []);

  const fetchProduct = async () => {
    try {
      const res = await productsAPI.getOne(Number(params.id));
      setProduct(res.data);
      if (res.data.imageUrl) setSelectedImage(res.data.imageUrl);
      // Fetch related products
      const related = await productsAPI.getAll({ category: res.data.category, limit: 8 } as any);
      setRelatedProducts(related.data.products.filter((p: any) => p.id !== res.data.id).slice(0, 8));
    } catch (err) {
      toast.error('Product not found');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    addToCart({ productId: product.id, name: product.name, price: product.price, emoji: product.emoji, quantity });
    toast.success(`🛒 ${product.name} added to cart!`);
  };

  const discount = product?.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;

  // Parse images
  const allImages: string[] = [];
  if (product?.images) { try { const imgs = JSON.parse(product.images); if (Array.isArray(imgs)) allImages.push(...imgs); } catch {} }
  else if (product?.imageUrl) allImages.push(product.imageUrl);

  // Parse specifications
  const specs = product?.specifications
    ? product.specifications.split('\n').filter(Boolean).map((s: string) => {
        const [key, ...rest] = s.split(':');
        return { key: key?.trim(), value: rest.join(':').trim() || key?.trim() };
      })
    : [];

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-orange-500 text-xl animate-pulse">Loading...</div>
    </div>
  );

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <button onClick={() => router.push('/')} className="hover:text-orange-500 transition">Home</button>
          <span>›</span>
          <button onClick={() => router.push(`/?category=${product.category}`)} className="hover:text-orange-500 capitalize transition">{product.category}</button>
          <span>›</span>
          <span className="text-gray-600 truncate max-w-48">{product.name}</span>
        </div>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          {/* Images */}
          <div className="space-y-3">
            {/* Main Image */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden h-96 flex items-center justify-center relative">
              {allImages.length > 0 ? (
                <img src={`http://localhost:5000${allImages[selectedImageIndex]}`} alt={product.name} className="w-full h-full object-contain p-4" />
              ) : (
                <span className="text-[10rem]">{product.emoji}</span>
              )}
              {discount && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full">-{discount}% OFF</span>
              )}
            </div>
            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImageIndex(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${selectedImageIndex === i ? 'border-orange-500' : 'border-gray-200 hover:border-orange-300'}`}>
                    <img src={`http://localhost:5000${img}`} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider">{product.category}</p>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-orange-500">৳{product.price.toLocaleString()}</span>
              {product.oldPrice && (
                <>
                  <span className="text-gray-400 text-lg line-through">৳{product.oldPrice.toLocaleString()}</span>
                  <span className="bg-red-50 text-red-500 text-sm font-bold px-2.5 py-1 rounded-full">Save ৳{(product.oldPrice - product.price).toLocaleString()}</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div>
              {product.stock === 0
                ? <span className="bg-red-100 text-red-500 text-xs font-bold px-3 py-1.5 rounded-full">❌ Out of Stock</span>
                : product.stock <= 5
                ? <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full">⚡ Only {product.stock} left!</span>
                : <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1.5 rounded-full">✅ In Stock</span>}
            </div>

            {/* Short Description */}
            {product.description && (
              <p className="text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">{product.description}</p>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-gray-600 text-sm font-semibold">Quantity:</span>
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2.5 text-gray-500 hover:bg-orange-50 hover:text-orange-500 font-bold text-lg transition">−</button>
                <span className="px-4 py-2.5 font-black text-gray-800 min-w-12 text-center border-x-2 border-gray-200">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-4 py-2.5 text-gray-500 hover:bg-orange-50 hover:text-orange-500 font-bold text-lg transition">+</button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleAddToCart} disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition text-sm">
                🛒 Add to Cart
              </button>
              <button onClick={() => { handleAddToCart(); router.push('/checkout'); }} disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition text-sm">
                ⚡ Buy Now
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
              {[
                { emoji: '🚚', text: 'Fast Delivery' },
                { emoji: '✅', text: 'Authentic' },
                { emoji: '↩️', text: 'Easy Return' },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl py-3 text-center">
                  <span className="text-xl">{b.emoji}</span>
                  <span className="text-xs text-gray-500 font-medium">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-10 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-100">
            {[
              { key: 'description', label: 'Description' },
              { key: 'specifications', label: 'Specifications' },
              { key: 'shipping', label: 'Shipping & Return' },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-4 text-sm font-semibold transition border-b-2 ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-500 bg-orange-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description || <p className="text-gray-400">No description available.</p>}
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === 'specifications' && (
              <div>
                {specs.length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody>
                      {specs.map((spec: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-3 px-4 font-semibold text-gray-700 w-1/3 border border-gray-100">{spec.key}</td>
                          <td className="py-3 px-4 text-gray-600 border border-gray-100">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-400 text-sm">No specifications available.</p>
                )}
              </div>
            )}

            {/* Shipping Tab */}
            {activeTab === 'shipping' && (
              <div className="space-y-6 text-sm text-gray-600">
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">🚚 Delivery Policy</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> Inside Dhaka: Delivery within 24-48 hours. Charge: ৳60</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> Outside Dhaka: Delivery within 3-5 days. Charge: ৳120</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> Free delivery on orders above ৳2,000</li>
                  </ul>
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-gray-800 mb-3">↩️ Return Policy</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Returns accepted within 7 days of delivery</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Product must be in original condition with packaging intact</li>
                    <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Return shipping fees apply unless product is defective</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-7 bg-orange-500 rounded-full"></div>
              <h2 className="text-xl font-black text-gray-800">Related Products</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p: any) => {
                const disc = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : null;
                return (
                  <button key={p.id} onClick={() => router.push(`/product/${p.id}`)}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-orange-200 transition text-left group">
                    <div className="h-40 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                      {p.imageUrl
                        ? <img src={`http://localhost:5000${p.imageUrl}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={p.name} />
                        : <span className="text-5xl">{p.emoji}</span>}
                      {disc && <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{disc}%</span>}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-400 capitalize mb-1">{p.category}</p>
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight mb-2 group-hover:text-orange-500 transition">{p.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500 font-black text-sm">৳{p.price.toLocaleString()}</span>
                        {p.oldPrice && <span className="text-gray-300 text-xs line-through">৳{p.oldPrice.toLocaleString()}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
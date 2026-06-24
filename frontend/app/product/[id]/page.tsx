'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productsAPI, reviewsAPI, settingsAPI } from '../../lib/api';
import { useStore } from '../../lib/store';
import Navbar from '../../components/Navbar';
import toast, { Toaster } from 'react-hot-toast';
import Footer from '../../components/Footer';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToCart, user } = useStore();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'shipping'>('description');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => { fetchProduct(); }, []);

  const fetchProduct = async () => {
    try {
      const res = await productsAPI.getOne(Number(params.id));
      setProduct(res.data);
      const related = await productsAPI.getAll({ category: res.data.category, limit: 8 } as any);
      setRelatedProducts(related.data.products.filter((p: any) => p.id !== res.data.id).slice(0, 8));
      const settingsRes = await settingsAPI.get();
      setSiteSettings(settingsRes.data);
      fetchReviews(res.data.id);
      fetchVariants(res.data.id);
    } catch (err) {
      toast.error('Product not found');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchVariants = async (productId: number) => {
    try {
      const res = await productsAPI.getVariants(productId);
      setVariants(res.data);
    } catch {}
  };

  const fetchReviews = async (productId: number) => {
    try {
      const res = await reviewsAPI.getByProduct(productId);
      setReviews(res.data.reviews);
      setAvgRating(res.data.avgRating);
      setTotalReviews(res.data.totalReviews);
    } catch {}
  };

  const getCurrentPrice = () => {
    if (selectedVariant?.price) return selectedVariant.price;
    return product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariant) return selectedVariant.stock;
    return product?.stock || 0;
  };

  const handleAddToCart = () => {
    if (variants.length > 0 && !selectedVariant) {
      toast.error('Please select a variant first');
      return;
    }
    const variantName = selectedVariant ? ` (${selectedVariant.name}: ${selectedVariant.value})` : '';
    addToCart({
      productId: product.id,
      name: product.name + variantName,
      price: getCurrentPrice(),
      emoji: product.emoji,
      quantity,
    });
    toast.success(`🛒 ${product.name} added to cart!`);
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await reviewsAPI.delete(reviewId);
      toast.success('Review deleted');
      fetchReviews(product.id);
    } catch { toast.error('Failed to delete review'); }
  };

  const handleSubmitReview = async () => {
    if (!user) { toast.error('Please login first'); router.push('/login'); return; }
    if (myRating === 0) { toast.error('Please select a rating'); return; }
    setSubmittingReview(true);
    try {
      await reviewsAPI.create({ productId: product.id, rating: myRating, comment: myComment });
      toast.success('Review submitted! ⭐');
      setMyRating(0);
      setMyComment('');
      fetchReviews(product.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const discount = product?.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : null;

  const allImages: string[] = [];
  if (product?.images) { try { const imgs = JSON.parse(product.images); if (Array.isArray(imgs)) allImages.push(...imgs); } catch {} }
  else if (product?.imageUrl) allImages.push(product.imageUrl);

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
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Toaster position="bottom-right" />
      <Navbar onCartClick={() => setCartOpen(true)} />

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">

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
            <div className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden h-96 flex items-center justify-center relative">
              {allImages.length > 0
                ? <img src={`http://localhost:5000${allImages[selectedImageIndex]}`} alt={product.name} className="w-full h-full object-contain p-4" />
                : <span className="text-[10rem]">{product.emoji}</span>}
              {discount && <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1.5 rounded-full">-{discount}% OFF</span>}
            </div>
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

            {/* Rating Summary */}
            {totalReviews > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-lg">{s <= Math.round(avgRating) ? '⭐' : '☆'}</span>)}
                </div>
                <span className="font-bold text-gray-800">{avgRating}</span>
                <span className="text-gray-400 text-sm">({totalReviews} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-orange-500">৳{getCurrentPrice().toLocaleString()}</span>
              {product.oldPrice && !selectedVariant?.price && (
                <>
                  <span className="text-gray-400 text-lg line-through">৳{product.oldPrice.toLocaleString()}</span>
                  <span className="bg-red-50 text-red-500 text-sm font-bold px-2.5 py-1 rounded-full">Save ৳{(product.oldPrice - product.price).toLocaleString()}</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div>
              {getCurrentStock() === 0
                ? <span className="bg-red-100 text-red-500 text-xs font-bold px-3 py-1.5 rounded-full">❌ Out of Stock</span>
                : getCurrentStock() <= 5
                ? <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-full">⚡ Only {getCurrentStock()} left!</span>
                : <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1.5 rounded-full">✅ In Stock</span>}
            </div>

            {product.description && (
              <p className="text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">{product.description}</p>
            )}

            {/* Variants - flat, 3 per row */}
            {variants.length > 0 && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Variant:
                    {selectedVariant && (
                      <span className="text-orange-500 ml-2 font-bold">{selectedVariant.name} - {selectedVariant.value}</span>
                    )}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {variants.map((v: any) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          if (selectedVariant?.id === v.id) {
                            setSelectedVariant(null);
                          } else {
                            setSelectedVariant(v);
                            setQuantity(1);
                          }
                        }}
                        disabled={v.stock === 0}
                        className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition relative text-center ${
                          selectedVariant?.id === v.id
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : v.stock === 0
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 hover:border-orange-400 text-gray-700 hover:bg-orange-50'
                        }`}
                      >
                        <span className="block font-bold">{v.value}</span>
                        {v.price && v.price !== product.price && (
                          <span className="block text-xs text-orange-400 font-normal mt-0.5">৳{v.price.toLocaleString()}</span>
                        )}
                        {v.stock === 0 && (
                          <span className="block text-xs text-red-400 font-normal mt-0.5">Out of stock</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                {!selectedVariant && (
                  <p className="text-orange-500 text-xs font-semibold">⚠️ Please select a variant</p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 pt-2">
              <span className="text-gray-600 text-sm font-semibold">Quantity:</span>
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2.5 text-gray-500 hover:bg-orange-50 hover:text-orange-500 font-bold text-lg transition">−</button>
                <span className="px-4 py-2.5 font-black text-gray-800 min-w-12 text-center border-x-2 border-gray-200">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(getCurrentStock(), quantity + 1))}
                  className="px-4 py-2.5 text-gray-500 hover:bg-orange-50 hover:text-orange-500 font-bold text-lg transition">+</button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleAddToCart} disabled={getCurrentStock() === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition text-sm">
                🛒 Add to Cart
              </button>
              <button onClick={() => { handleAddToCart(); router.push('/checkout'); }} disabled={getCurrentStock() === 0}
                className="flex-1 bg-gray-900 hover:bg-gray-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition text-sm">
                ⚡ Buy Now
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
              {[{ emoji: '🚚', text: 'Fast Delivery' }, { emoji: '✅', text: 'Authentic' }, { emoji: '↩️', text: 'Easy Return' }].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1 bg-gray-50 rounded-xl py-3 text-center">
                  <span className="text-xl">{b.emoji}</span>
                  <span className="text-xs text-gray-500 font-medium">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-10 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[{ key: 'description', label: 'Description' }, { key: 'specifications', label: 'Specifications' }, { key: 'shipping', label: 'Shipping & Return' }].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-4 text-sm font-semibold transition border-b-2 ${activeTab === tab.key ? 'border-orange-500 text-orange-500 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description || <p className="text-gray-400">No description available.</p>}
              </div>
            )}
            {activeTab === 'specifications' && (
              specs.length > 0 ? (
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
              ) : <p className="text-gray-400 text-sm">No specifications available.</p>
            )}
            {activeTab === 'shipping' && (
              <div className="space-y-6 text-sm text-gray-600">
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">🚚 Delivery Policy</h3>
                  <ul className="space-y-2">
                    {(siteSettings?.shippingPolicy || '').split('\n').filter(Boolean).map((line: string, i: number) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-green-500">•</span> {line}</li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-gray-800 mb-3">↩️ Return Policy</h3>
                  <ul className="space-y-2">
                    {(siteSettings?.returnPolicy || '').split('\n').filter(Boolean).map((line: string, i: number) => (
                      <li key={i} className="flex items-start gap-2"><span className="text-blue-500">•</span> {line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-10 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-7 bg-orange-500 rounded-full"></div>
                <h2 className="text-xl font-black text-gray-800">Reviews</h2>
                <span className="bg-orange-100 text-orange-500 text-xs font-bold px-2.5 py-1 rounded-full">{totalReviews}</span>
              </div>
              {totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-lg">{s <= Math.round(avgRating) ? '⭐' : '☆'}</span>)}
                  </div>
                  <span className="font-black text-2xl text-gray-800">{avgRating}</span>
                  <span className="text-gray-400 text-sm">/ 5</span>
                </div>
              )}
            </div>
          </div>

          {/* Write Review */}
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800 mb-4">✍️ Write a Review</h3>
            {!user ? (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-3">Please log in to leave a review</p>
                <button onClick={() => router.push('/login')}
                  className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition">Log in</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-2">Your Rating *</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setMyRating(s)}
                        className="text-3xl transition-transform hover:scale-110">
                        {s <= (hoverRating || myRating) ? '⭐' : '☆'}
                      </button>
                    ))}
                    {myRating > 0 && (
                      <span className="ml-2 text-sm text-gray-500 self-center">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][myRating]}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-2">Your Comment (optional)</p>
                  <textarea placeholder="Share your experience..." value={myComment}
                    onChange={(e) => setMyComment(e.target.value)} rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 bg-white resize-none" />
                </div>
                <button onClick={handleSubmitReview} disabled={submittingReview || myRating === 0}
                  className="bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold px-8 py-3 rounded-xl text-sm transition">
                  {submittingReview ? 'Submitting...' : '⭐ Submit Review'}
                </button>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="divide-y divide-gray-50">
            {reviews.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-gray-400 font-medium">No reviews yet.</p>
                <p className="text-gray-400 text-sm mt-1">Be the first to review this product!</p>
              </div>
            ) : (
              reviews.map((review: any) => (
                <div key={review.id} className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-sm">
                        {review.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{review.user?.name}</p>
                        <p className="text-gray-400 text-xs">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => <span key={s} className="text-sm">{s <= review.rating ? '⭐' : '☆'}</span>)}
                      </div>
                      {user?.id === review.user?.id && (
                        <button onClick={() => handleDeleteReview(review.id)}
                          className="text-gray-300 hover:text-red-400 text-xs ml-2 transition">🗑️</button>
                      )}
                    </div>
                  </div>
                  {review.comment && <p className="text-gray-600 text-sm leading-relaxed ml-12">{review.comment}</p>}
                </div>
              ))
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
      <Footer />
    </div>
  );
}
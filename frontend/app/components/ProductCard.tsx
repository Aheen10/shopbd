'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '../lib/store';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  emoji: string;
  stock: number;
  description?: string;
  imageUrl?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      emoji: product.emoji,
      quantity: 1,
    });
    toast.success(`🛒 ${product.name} added to cart!`);
  };

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  const imageUrl = product.imageUrl
    ? `http://localhost:5000${product.imageUrl}`
    : null;

  return (
    <div
      onClick={() => router.push(`/product/${product.id}`)}
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-orange-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
    >
      {/* Image */}
      <div className="h-44 bg-gray-50 flex items-center justify-center relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
            }}
          />
        ) : null}
        <span
          className="text-6xl group-hover:scale-110 transition-transform duration-300"
          style={{ display: imageUrl ? 'none' : 'flex' }}
        >
          {product.emoji}
        </span>

        {discount && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
            -{discount}%
          </span>
        )}
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
            Only {product.stock} left!
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <span className="text-red-500 font-bold text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-gray-400 text-xs capitalize mb-1">{product.category}</p>
        <h3 className="text-gray-800 font-semibold text-sm mb-2 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 mb-3">
          <span className="text-orange-500 font-black text-base">
            ৳{product.price.toLocaleString()}
          </span>
          {product.oldPrice && (
            <span className="text-gray-400 text-xs line-through">
              ৳{product.oldPrice.toLocaleString()}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-xl transition"
        >
          {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}
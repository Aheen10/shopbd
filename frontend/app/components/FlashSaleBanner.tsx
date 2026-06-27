'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flashSaleAPI } from '../lib/api';
import { useStore } from '../lib/store';
import toast from 'react-hot-toast';

export default function FlashSaleBanner() {
  const router = useRouter();
  const { addToCart } = useStore();
  const [flashSale, setFlashSale] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    flashSaleAPI.getActive().then(res => {
      setFlashSale(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!flashSale) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(flashSale.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setFlashSale(null);
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [flashSale]);

  const getFlashPrice = (item: any) => {
    const original = item.product.price;
    if (item.discountType === 'percentage') {
      return Math.round(original * (1 - item.discountValue / 100));
    }
    return Math.max(0, original - item.discountValue);
  };

  const getDiscountLabel = (item: any) => {
    if (item.discountType === 'percentage') return `${item.discountValue}% OFF`;
    return `৳${item.discountValue} OFF`;
  };

  if (loading || !flashSale) return null;

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[52px]">
      <span className="text-2xl font-black text-white leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-white/70 text-xs mt-0.5 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 rounded-2xl overflow-hidden shadow-lg mb-4">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-xl animate-pulse">⚡</span>
            <span className="text-white font-black text-lg tracking-tight">FLASH SALE</span>
          </div>
          <span className="text-white font-bold text-sm opacity-90">{flashSale.title}</span>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-xs font-semibold uppercase tracking-wider mr-1">Ends in:</span>
          {timeLeft.days > 0 && <TimeBox value={timeLeft.days} label="days" />}
          <TimeBox value={timeLeft.hours} label="hrs" />
          <span className="text-white font-black text-xl">:</span>
          <TimeBox value={timeLeft.minutes} label="min" />
          <span className="text-white font-black text-xl">:</span>
          <TimeBox value={timeLeft.seconds} label="sec" />
        </div>
      </div>

      {/* Products */}
      <div className="px-4 pb-4">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {flashSale.items.map((item: any) => {
            const flashPrice = getFlashPrice(item);
            const discountLabel = getDiscountLabel(item);

            return (
              <div key={item.id}
                className="flex-shrink-0 w-36 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition group cursor-pointer"
                onClick={() => router.push(`/product/${item.product.id}`)}>

                {/* Image */}
                <div className="h-28 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                  {item.product.imageUrl ? (
                    <img src={`http://localhost:5000${item.product.imageUrl}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      alt={item.product.name} />
                  ) : (
                    <span className="text-4xl">{item.product.emoji}</span>
                  )}
                  <span className="absolute top-1.5 left-1.5 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                    {discountLabel}
                  </span>
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-gray-800 font-semibold text-xs line-clamp-2 leading-tight mb-1.5">
                    {item.product.name}
                  </p>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-orange-500 font-black text-sm">৳{flashPrice.toLocaleString()}</span>
                    <span className="text-gray-400 text-xs line-through">৳{item.product.price.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.product.stock === 0) { toast.error('Out of stock'); return; }
                      addToCart({
                        productId: item.product.id,
                        name: item.product.name,
                        price: flashPrice,
                        emoji: item.product.emoji,
                        quantity: 1,
                      });
                      toast.success('🛒 Added to cart!');
                    }}
                    disabled={item.product.stock === 0}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold py-1.5 rounded-lg transition">
                    {item.product.stock === 0 ? 'Out of Stock' : '🛒 Add'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
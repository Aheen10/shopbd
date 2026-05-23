'use client';

import { useState, useRef, useEffect } from 'react';

const WHATSAPP_NUMBER = '8801603293540';
const MESSENGER_URL = 'https://m.me/shopbd';

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const hasDragged = useRef(false);

  useEffect(() => {
    // Default position — bottom right
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 80,
    });

    // Load saved position
    const saved = localStorage.getItem('shopbd_btn_pos');
    if (saved) setPosition(JSON.parse(saved));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    hasDragged.current = false;
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    hasDragged.current = false;
    setDragging(true);
    dragOffset.current = {
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      hasDragged.current = true;
      const newX = Math.min(Math.max(0, e.clientX - dragOffset.current.x), window.innerWidth - 60);
      const newY = Math.min(Math.max(0, e.clientY - dragOffset.current.y), window.innerHeight - 60);
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      hasDragged.current = true;
      const newX = Math.min(Math.max(0, e.touches[0].clientX - dragOffset.current.x), window.innerWidth - 60);
      const newY = Math.min(Math.max(0, e.touches[0].clientY - dragOffset.current.y), window.innerHeight - 60);
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (dragging) {
        localStorage.setItem('shopbd_btn_pos', JSON.stringify(position));
        setDragging(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [dragging, position]);

  const handleClick = () => {
    if (!hasDragged.current) setOpen(!open);
  };

  const handleWhatsApp = () => {
    const message = 'আসসালামু আলাইকুম! আমি ShopBD থেকে একটি পণ্য সম্পর্কে জানতে চাই।';
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleMessenger = () => {
    window.open(MESSENGER_URL, '_blank');
  };

  const handleOrder = () => {
    const message = 'আসসালামু আলাইকুম! আমি একটি অর্ডার দিতে চাই।';
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div
      ref={buttonRef}
      style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 9999 }}
    >
      {/* Popup */}
      {open && (
        <div
          className="absolute bottom-16 right-0 bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl w-60"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-white font-bold text-sm mb-1">ShopBD Support 🛒</p>
          <p className="text-gray-400 text-xs mb-4">আমরা সাহায্য করতে প্রস্তুত!</p>
          <div className="space-y-2">
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition"
            >
              <span className="text-lg">💬</span>
              <div className="text-left">
                <div>WhatsApp</div>
                <div className="text-xs font-normal opacity-80">Chat or Order</div>
              </div>
            </button>
            <button
              onClick={handleMessenger}
              className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition"
            >
              <span className="text-lg">💙</span>
              <div className="text-left">
                <div>Messenger</div>
                <div className="text-xs font-normal opacity-80">Facebook Chat</div>
              </div>
            </button>
            <button
              onClick={handleOrder}
              className="w-full flex items-center gap-3 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition"
            >
              <span className="text-lg">🛒</span>
              <div className="text-left">
                <div>Place Order</div>
                <div className="text-xs font-normal opacity-80">via WhatsApp</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        className={`w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full shadow-lg flex items-center justify-center text-2xl transition ${dragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-110'}`}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
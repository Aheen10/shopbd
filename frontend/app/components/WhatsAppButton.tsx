'use client';

import { useState, useRef, useEffect } from 'react';

const WHATSAPP_NUMBER = '8801603293540';
const MESSENGER_URL = 'https://m.me/shopbd';

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const hasDragged = useRef(false);

  const BUTTON_SIZE = 44; // smaller button
  const POPUP_WIDTH = 220;
  const POPUP_HEIGHT = 240;

  const clampPosition = (x: number, y: number) => {
    const maxX = Math.max(0, window.innerWidth - BUTTON_SIZE);
    const maxY = Math.max(0, window.innerHeight - BUTTON_SIZE);
    return { x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) };
  };

  useEffect(() => {
    let initial = {
      x: window.innerWidth - 60,
      y: window.innerHeight - 100,
    };
    const saved = localStorage.getItem('shopbd_btn_pos');
    if (saved) {
      try { initial = JSON.parse(saved); } catch {}
    }
    setPosition(clampPosition(initial.x, initial.y));
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleResize = () => setPosition(prev => clampPosition(prev.x, prev.y));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    hasDragged.current = false;
    setDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    hasDragged.current = false;
    setDragging(true);
    dragOffset.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      hasDragged.current = true;
      setPosition(clampPosition(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y));
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging) return;
      hasDragged.current = true;
      setPosition(clampPosition(e.touches[0].clientX - dragOffset.current.x, e.touches[0].clientY - dragOffset.current.y));
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

  const handleClick = () => { if (!hasDragged.current) setOpen(!open); };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('আসসালামু আলাইকুম! আমি ShopBD থেকে একটি পণ্য সম্পর্কে জানতে চাই।')}`, '_blank');
  };
  const handleMessenger = () => window.open(MESSENGER_URL, '_blank');
  const handleOrder = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('আসসালামু আলাইকুম! আমি একটি অর্ডার দিতে চাই।')}`, '_blank');
  };

  if (!mounted) return null;

  // Smart popup positioning — always visible inside viewport
  const spaceBelow = window.innerHeight - position.y - BUTTON_SIZE;
  const spaceAbove = position.y;
  const spaceRight = window.innerWidth - position.x - BUTTON_SIZE;
  const spaceLeft = position.x;

  const openUp = spaceBelow < POPUP_HEIGHT + 10 && spaceAbove > spaceBelow;
  const openLeft = spaceRight < POPUP_WIDTH + 10 && spaceLeft > spaceRight;

  // Calculate popup position as fixed coordinates
  let popupTop: number;
  let popupLeft: number;

  if (openUp) {
    popupTop = position.y - POPUP_HEIGHT - 8;
  } else {
    popupTop = position.y + BUTTON_SIZE + 8;
  }

  if (openLeft) {
    popupLeft = position.x - POPUP_WIDTH + BUTTON_SIZE;
  } else {
    popupLeft = position.x;
  }

  // Final clamp so popup never goes off-screen
  popupTop = Math.max(8, Math.min(popupTop, window.innerHeight - POPUP_HEIGHT - 8));
  popupLeft = Math.max(8, Math.min(popupLeft, window.innerWidth - POPUP_WIDTH - 8));

  return (
    <>
      {/* Popup — fixed position, always in viewport */}
      {open && (
        <div
          style={{ position: 'fixed', top: popupTop, left: popupLeft, zIndex: 9998, width: POPUP_WIDTH }}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-white font-bold text-sm mb-1">ShopBD Support 🛒</p>
          <p className="text-gray-400 text-xs mb-3">আমরা সাহায্য করতে প্রস্তুত!</p>
          <div className="space-y-2">
            <button onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white text-sm font-bold py-2 px-3 rounded-xl transition">
              <span>💬</span>
              <div className="text-left">
                <div className="text-xs">WhatsApp</div>
                <div className="text-xs font-normal opacity-80">Chat or Order</div>
              </div>
            </button>
            <button onClick={handleMessenger}
              className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 px-3 rounded-xl transition">
              <span>💙</span>
              <div className="text-left">
                <div className="text-xs">Messenger</div>
                <div className="text-xs font-normal opacity-80">Facebook Chat</div>
              </div>
            </button>
            <button onClick={handleOrder}
              className="w-full flex items-center gap-3 bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold py-2 px-3 rounded-xl transition">
              <span>🛒</span>
              <div className="text-left">
                <div className="text-xs">Place Order</div>
                <div className="text-xs font-normal opacity-80">via WhatsApp</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <div
        ref={buttonRef}
        style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 9999 }}
      >
        <button
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleClick}
          className={`w-11 h-11 bg-green-500 hover:bg-green-400 rounded-full shadow-lg flex items-center justify-center text-xl transition ${dragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-110'}`}
        >
          {open ? '✕' : '💬'}
        </button>
      </div>
    </>
  );
}
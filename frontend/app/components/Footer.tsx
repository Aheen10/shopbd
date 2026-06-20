'use client';

import Link from 'next/link';
import { useStore } from '../lib/store';

export default function Footer() {
  const { user } = useStore();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-black text-xl mb-3">
              Shop<span className="text-orange-500">BD</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Premium online shopping experience in Bangladesh. Quality home goods, kitchen essentials and daily necessities with fast delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 border-l-4 border-orange-500 pl-2">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-orange-500 transition">All Products</Link></li>
              <li><Link href="/?category=kitchen" className="text-gray-400 hover:text-orange-500 transition">Categories</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-orange-500 transition">Flash Deals</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-orange-500 transition">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-orange-500 transition">Contact Us</Link></li>
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 border-l-4 border-orange-500 pl-2">My Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={user ? '/profile' : '/login'} className="text-gray-400 hover:text-orange-500 transition">My Profile</Link></li>
              <li><Link href={user ? '/orders' : '/login'} className="text-gray-400 hover:text-orange-500 transition">My Orders</Link></li>
              <li><Link href={user ? '/wishlist' : '/login'} className="text-gray-400 hover:text-orange-500 transition">Wishlist</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-orange-500 transition">Cart</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 border-l-4 border-orange-500 pl-2">Customer Care</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                📞 <a href="tel:+8801XXXXXXXXX" className="hover:text-orange-500 transition">01XXX-XXXXXX</a>
              </li>
              <li className="flex items-center gap-2">
                📧 <a href="mailto:support@shopbd.com" className="hover:text-orange-500 transition">support@shopbd.com</a>
              </li>
              <li className="flex items-start gap-2">
                📍 <span>Shyamoli, Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-white font-medium">© {new Date().getFullYear()} ShopBD. All rights reserved.</p>
          <p className="text-white font-medium">Made with ❤️ in Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}
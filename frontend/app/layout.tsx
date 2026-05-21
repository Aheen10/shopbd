'use client';

import { useEffect } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { useStore } from './lib/store';
import WhatsAppButton from './components/WhatsAppButton';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { setUser } = useStore();

  useEffect(() => {
    const token = localStorage.getItem('shopbd_token');
    const userStr = localStorage.getItem('shopbd_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setUser(user, token);
      } catch (e) {}
    }
  }, []);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
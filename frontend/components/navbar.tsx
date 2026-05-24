'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/why-us', label: 'Why Us' },
];

export function Navbar() {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const idleTimer = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY < 40) {
        setVisible(true);
      } else if (currentY > lastScrollY.current + 10) {
        setVisible(false);
      } else if (currentY < lastScrollY.current - 10) {
        setVisible(true);
      }

      lastScrollY.current = currentY;

      if (idleTimer.current) {
        window.clearTimeout(idleTimer.current);
      }
      idleTimer.current = window.setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (idleTimer.current) {
        window.clearTimeout(idleTimer.current);
      }
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-slate-800 bg-surface/95 backdrop-blur-xl transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-100 transition hover:text-slate-50">
          ReviewLens
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-slate-300 transition duration-200 hover:bg-slate-900 hover:text-slate-50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

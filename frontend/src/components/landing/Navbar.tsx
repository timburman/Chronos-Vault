'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-surface/80 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="no-underline">
          <span className="font-serif text-xl tracking-tight text-text-1">
            LegacyForge
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm text-text-3 hover:text-text-1 transition-colors">How it works</a>
          <a href="#why" className="text-sm text-text-3 hover:text-text-1 transition-colors">Why</a>
          <a href="https://github.com/timburman/LegacyForge" target="_blank" rel="noopener noreferrer" className="text-sm text-text-3 hover:text-text-1 transition-colors">GitHub</a>
          
          <div className="flex items-center gap-4 pl-4 border-l border-border">
            <ThemeToggle />
            <Link href="/dashboard">
              <button className="btn-primary py-2 px-5 text-sm">Launch App</button>
            </Link>
          </div>
        </nav>

        {/* Mobile Nav Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            className="p-2 text-text-3 hover:text-text-1 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute top-[63px] left-0 w-full border-b border-border shadow-2xl md:hidden overflow-hidden z-[60]"
            style={{ background: 'var(--bg)' }}
          >
            <div className="flex flex-col p-8 gap-6">
              <a href="#how" onClick={() => setMenuOpen(false)} className="text-xl font-medium text-text-2 hover:text-text-1 transition-colors">How it works</a>
              <a href="#why" onClick={() => setMenuOpen(false)} className="text-xl font-medium text-text-2 hover:text-text-1 transition-colors">Why</a>
              <a href="https://github.com/timburman/LegacyForge" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="text-xl font-medium text-text-2 hover:text-text-1 transition-colors">GitHub</a>
              <div className="pt-6 border-t border-border mt-2">
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  <button className="btn-primary w-full justify-center py-4 text-lg">Launch App</button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

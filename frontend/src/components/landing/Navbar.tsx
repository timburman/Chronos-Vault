'use client';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Navbar() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(240, 235, 227, 0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '0 2rem',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: 'var(--font-serif), DM Serif Display, serif', fontSize: '1.2rem', color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Chronos Vault
          </span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href="#how" style={{ fontSize: '0.85rem', color: 'var(--text-3)', textDecoration: 'none' }}>How it works</a>
          <a href="#why" style={{ fontSize: '0.85rem', color: 'var(--text-3)', textDecoration: 'none' }}>Why</a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.85rem', color: 'var(--text-3)', textDecoration: 'none' }}
          >
            GitHub
          </a>
          <Link href="/dashboard">
            <button className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}>
              Launch App
            </button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

'use client';

import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder of the same size to prevent layout shift
    return <div style={{ width: '32px', height: '32px' }} />;
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="btn-ghost"
      style={{ padding: '0.4rem', borderRadius: '50%' }}
      aria-label="Toggle Dark Mode"
      title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={18} strokeWidth={1.8} />
      ) : (
        <Moon size={18} strokeWidth={1.8} />
      )}
    </button>
  );
}

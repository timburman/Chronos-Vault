'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/utils/config';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { CustomThemeProvider, useTheme } from '@/context/ThemeContext';

// ─── Server-side Polyfills ──────────────────────────────────────────
if (typeof window === 'undefined') {
  // @ts-ignore
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}

function ThemeAwareProviders({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <RainbowKitProvider
      theme={isDark 
        ? darkTheme({
            accentColor: '#D4AF37', // metallic gold
            accentColorForeground: '#0A0A0A',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })
        : lightTheme({
            accentColor: '#B8860B',
            accentColorForeground: '#fff',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })
      }
    >
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            color: 'var(--text-1)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--bg)' } },
          error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg)' } },
          duration: 4000,
        }}
      />
    </RainbowKitProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <CustomThemeProvider>
          <ThemeAwareProviders>
            {children}
          </ThemeAwareProviders>
        </CustomThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

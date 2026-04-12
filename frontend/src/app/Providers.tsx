'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { wagmiConfig } from '@/utils/config';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#B8860B',
            accentColorForeground: '#fff',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1C1916',
                color: '#F0EBE3',
                border: '1px solid #3A3530',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontFamily: "'DM Sans', system-ui, sans-serif",
              },
              success: { iconTheme: { primary: '#3D7A5C', secondary: '#F0EBE3' } },
              error: { iconTheme: { primary: '#B04030', secondary: '#F0EBE3' } },
              duration: 4000,
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

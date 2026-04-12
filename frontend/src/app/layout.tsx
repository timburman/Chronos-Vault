import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import './globals.css';
import Providers from './Providers';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Chronos Vault — Trustless Inheritance Protocol',
  description:
    'A decentralized dead man\'s switch for Web3. Secure your digital estate with time-locked smart contracts. Open source, non-custodial, on-chain.',
  openGraph: {
    title: 'Chronos Vault',
    description: 'Trustless inheritance for your digital assets.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`} data-scroll-behavior="smooth">
      <body style={{ fontFamily: "var(--font-sans), 'DM Sans', system-ui, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

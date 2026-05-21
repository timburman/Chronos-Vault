import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'LegacyForge',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || 'legacyforge-local',
  chains: [baseSepolia],
  ssr: true,
});

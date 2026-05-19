import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Chronos Vault',
  // Get your Project ID from https://cloud.walletconnect.com
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || 'chronos-vault-local',
  chains: [baseSepolia],
  ssr: true,
});

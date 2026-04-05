import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { foundry } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Chronos Vault',
  projectId: 'chronos-vault-local',
  chains: [foundry],
  ssr: false,
});

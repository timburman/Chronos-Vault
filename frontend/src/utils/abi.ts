export const FACTORY_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const;

export const VaultFactoryABI = [
  {
    type: 'function', name: 'createVault',
    inputs: [
      { name: '_beneficiary', type: 'address' },
      { name: '_timeoutPeriod', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'getOwnerVaults',
    inputs: [{ name: '_owner', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'getBeneficiaryVaults',
    inputs: [{ name: '_beneficiary', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'event', name: 'VaultCreated',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'beneficiary', type: 'address', indexed: true },
      { name: 'vault', type: 'address', indexed: false },
    ],
  },
] as const;

export const VaultABI = [
  // ─── View ────────────────────────────────────────────────────────
  { type: 'function', name: 'owner',         inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'beneficiary',   inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { type: 'function', name: 'lastPingTime',  inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'timeoutPeriod', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'vaultBalance',  inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'factory',       inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },

  // ─── Write ───────────────────────────────────────────────────────
  {
    type: 'function', name: 'depositETH',
    inputs: [], outputs: [], stateMutability: 'payable',
  },
  {
    type: 'function', name: 'depositERC20',
    inputs: [{ name: '_token', type: 'address' }, { name: '_amount', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'ping',
    inputs: [], outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'changeBeneficiary',
    inputs: [{ name: '_newBeneficiary', type: 'address' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'withdraw',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'withdrawERC20',
    inputs: [{ name: '_token', type: 'address' }, { name: '_amount', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'claimFunds',
    inputs: [], outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'claimERC20',
    inputs: [{ name: '_token', type: 'address' }],
    outputs: [], stateMutability: 'nonpayable',
  },

  // ─── receive ─────────────────────────────────────────────────────
  { type: 'receive', stateMutability: 'payable' },
] as const;

// Standard IERC20 for approve calls
export const ERC20ABI = [
  {
    type: 'function', name: 'approve',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: 'bool' }], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'allowance',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'symbol',
    inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'decimals',
    inputs: [], outputs: [{ type: 'uint8' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'name',
    inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view',
  },
] as const;

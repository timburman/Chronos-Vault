export const FACTORY_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as const;

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
    type: 'function', name: 'createVaultWithAlias',
    inputs: [
      { name: '_beneficiary', type: 'address' },
      { name: '_timeoutPeriod', type: 'uint256' },
      { name: '_alias', type: 'string' },
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
    type: 'function', name: 'vaultAlias',
    inputs: [{ name: '_vault', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'setVaultAlias',
    inputs: [
      { name: '_vault', type: 'address' },
      { name: '_alias', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event', name: 'VaultCreated',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'beneficiary', type: 'address', indexed: true },
      { name: 'vault', type: 'address', indexed: false },
      { name: 'alias_', type: 'string', indexed: false },
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
  { type: 'function', name: 'paused',        inputs: [], outputs: [{ type: 'bool' }],    stateMutability: 'view' },
  { type: 'function', name: 'guardianCount', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  {
    type: 'function', name: 'guardians',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'pendingBeneficiary',
    inputs: [], outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'beneficiaryChangeUnlockTime',
    inputs: [], outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },

  // ─── Constants ───────────────────────────────────────────────────
  { type: 'function', name: 'MAX_GUARDIANS',  inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'BENEFICIARY_CHANGE_DELAY', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'MIN_TIMEOUT',    inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },

  // ─── Write: Deposits ────────────────────────────────────────────
  { type: 'function', name: 'depositETH',    inputs: [], outputs: [], stateMutability: 'payable' },
  {
    type: 'function', name: 'depositERC20',
    inputs: [{ name: '_token', type: 'address' }, { name: '_amount', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'depositERC721',
    inputs: [{ name: '_token', type: 'address' }, { name: '_tokenId', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'depositERC1155',
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_tokenId', type: 'uint256' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },

  // ─── Write: Ping ────────────────────────────────────────────────
  { type: 'function', name: 'ping', inputs: [], outputs: [], stateMutability: 'nonpayable' },

  // ─── Write: Guardians ───────────────────────────────────────────
  {
    type: 'function', name: 'addGuardian',
    inputs: [{ name: '_guardian', type: 'address' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'removeGuardian',
    inputs: [{ name: '_guardian', type: 'address' }],
    outputs: [], stateMutability: 'nonpayable',
  },

  // ─── Write: Beneficiary Timelock ────────────────────────────────
  {
    type: 'function', name: 'proposeBeneficiaryChange',
    inputs: [{ name: '_newBeneficiary', type: 'address' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  { type: 'function', name: 'executeBeneficiaryChange', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'cancelBeneficiaryChange', inputs: [], outputs: [], stateMutability: 'nonpayable' },

  // ─── Write: Pause ───────────────────────────────────────────────
  { type: 'function', name: 'pause',   inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'unpause', inputs: [], outputs: [], stateMutability: 'nonpayable' },

  // ─── Write: Timeout ─────────────────────────────────────────────
  {
    type: 'function', name: 'changeTimeoutPeriod',
    inputs: [{ name: '_newPeriod', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },

  // ─── Write: Withdrawals ─────────────────────────────────────────
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
    type: 'function', name: 'withdrawERC721',
    inputs: [{ name: '_token', type: 'address' }, { name: '_tokenId', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'withdrawERC1155',
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_tokenId', type: 'uint256' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },

  // ─── Write: Claims ──────────────────────────────────────────────
  { type: 'function', name: 'claimFunds', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function', name: 'claimERC20',
    inputs: [{ name: '_token', type: 'address' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'claimERC721',
    inputs: [{ name: '_token', type: 'address' }, { name: '_tokenId', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'claimERC1155',
    inputs: [
      { name: '_token', type: 'address' },
      { name: '_tokenId', type: 'uint256' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },

  // ─── Events ─────────────────────────────────────────────────────
  { type: 'event', name: 'Pinged', inputs: [{ name: 'timestamp', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'Funded', inputs: [{ name: 'sender', type: 'address', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'FundedERC20', inputs: [{ name: 'sender', type: 'address', indexed: true }, { name: 'token', type: 'address', indexed: true }, { name: 'amount', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'FundedERC721', inputs: [{ name: 'sender', type: 'address', indexed: true }, { name: 'token', type: 'address', indexed: true }, { name: 'tokenId', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'FundedERC1155', inputs: [{ name: 'sender', type: 'address', indexed: true }, { name: 'token', type: 'address', indexed: true }, { name: 'tokenId', type: 'uint256', indexed: false }, { name: 'amount', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'GuardianAdded', inputs: [{ name: 'guardian', type: 'address', indexed: true }] },
  { type: 'event', name: 'GuardianRemoved', inputs: [{ name: 'guardian', type: 'address', indexed: true }] },
  { type: 'event', name: 'BeneficiaryChangeProposed', inputs: [{ name: 'newBeneficiary', type: 'address', indexed: true }, { name: 'unlockTime', type: 'uint256', indexed: false }] },
  { type: 'event', name: 'BeneficiaryChanged', inputs: [{ name: 'oldBeneficiary', type: 'address', indexed: true }, { name: 'newBeneficiary', type: 'address', indexed: true }] },

  // ─── receive ─────────────────────────────────────────────────────
  { type: 'receive', stateMutability: 'payable' },
] as const;

// Standard IERC20 for approve + metadata calls
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

// Standard ERC-721 for approve + transfer
export const ERC721ABI = [
  {
    type: 'function', name: 'approve',
    inputs: [{ name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'name',
    inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'symbol',
    inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'setApprovalForAll',
    inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
    outputs: [], stateMutability: 'nonpayable',
  },
] as const;

// Standard ERC-1155 for approve + transfer
export const ERC1155ABI = [
  {
    type: 'function', name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }, { name: 'id', type: 'uint256' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'setApprovalForAll',
    inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'uri',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ type: 'string' }], stateMutability: 'view',
  },
] as const;

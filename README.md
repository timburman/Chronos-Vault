# Chronos Vault

> A trustless, on-chain dead man's switch for digital asset inheritance.

Chronos Vault is an open-source decentralized inheritance protocol built on the EVM. You deposit crypto, set an inactivity timeout, and ping the contract periodically to prove you are alive. If you ever stop pinging past the threshold, your beneficiary can sweep the vault.

No lawyers. No intermediaries. No trust required.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Smart Contracts — Local Setup](#smart-contracts--local-setup)
   - [Install dependencies](#1-install-foundry-dependencies)
   - [Run tests](#2-run-tests)
   - [Start Anvil (local EVM)](#3-start-anvil)
   - [Deploy the Factory](#4-deploy-the-vaultfactory)
5. [Frontend — Local Setup](#frontend--local-setup)
   - [Install & configure](#1-install-node-dependencies)
   - [Update contract address](#2-update-the-factory-address)
   - [Run dev server](#3-start-the-dev-server)
6. [Using the App (End-to-End Flow)](#using-the-app-end-to-end-flow)
7. [Simulating the Inheritance Fallback](#simulating-the-inheritance-fallback)
8. [Contract Reference](#contract-reference)
9. [Security Notes](#security-notes)
10. [License](#license)

---

## Architecture

```
dead-mans-switch/
├── contracts/        # Foundry project (Solidity smart contracts + tests)
│   ├── src/
│   │   ├── Vault.sol         # Core time-locked vault contract
│   │   └── VaultFactory.sol  # Factory — deploys and indexes vaults per user
│   ├── test/
│   │   ├── Vault.t.sol       # 21 unit tests for Vault
│   │   └── VaultFactory.t.sol
│   └── script/
│       └── Deploy.s.sol      # Broadcast script — deploys VaultFactory
│
└── frontend/         # Next.js 14 app (App Router, TypeScript, Tailwind)
    └── src/
        ├── app/              # Route pages (landing + dashboard)
        ├── components/
        │   ├── landing/      # Hero, How it works, Why, OpenSource, etc.
        │   └── dashboard/    # Sidebar, Overview, Assets, Deposit, Withdraw…
        └── utils/
            ├── abi.ts        # Contract ABIs + deployed factory address
            ├── config.ts     # Wagmi / RainbowKit config
            └── price.ts      # CoinGecko ETH price with 24h localStorage cache
```

**How it works:**

1. `VaultFactory` is a singleton deployed once. It acts as the on-chain registry.
2. Each user calls `createVault(beneficiary, timeoutSeconds)` — the factory deploys a fresh, isolated `Vault` contract and records its address.
3. The `Vault` holds ETH and ERC-20 tokens. The owner pings periodically to reset the timer.
4. If the owner's wallet goes silent past the timeout, the beneficiary can call `claimFunds()` to sweep everything.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| [Foundry](https://getfoundry.sh) | latest | `curl -L https://foundry.paradigm.xyz \| bash && foundryup` |
| [Node.js](https://nodejs.org) | ≥ 18 | `brew install node` or nvm |
| npm | ≥ 9 | bundled with Node |
| [Git](https://git-scm.com) | any | `brew install git` |

Verify installs:

```bash
forge --version    # Foundry
anvil --version    # Local EVM node
cast --version     # Foundry CLI tool
node --version     # Node.js
npm --version
```

---

## Project Structure

```
dead-mans-switch/
├── contracts/
└── frontend/
```

Clone the repo:

```bash
git clone <your-repo-url> dead-mans-switch
cd dead-mans-switch
```

---

## Smart Contracts — Local Setup

All contract commands run from the `contracts/` directory.

```bash
cd contracts
```

### 1. Install Foundry Dependencies

```bash
forge install
```

This installs `openzeppelin-contracts` (listed in `foundry.toml` remappings).

### 2. Run Tests

```bash
forge test -vv
```

Expected output — all 22 tests must pass:

```
Ran 1 test for test/VaultFactory.t.sol:VaultFactoryTest
[PASS] test_CreateVault() ...

Ran 21 tests for test/Vault.t.sol:VaultTest
[PASS] test_ChangeBeneficiary() ...
[PASS] test_ClaimERC20_SuccessAfterTimeout() ...
[PASS] test_DepositETH_ViaFunction() ...
... (all 21 pass)

Ran 2 test suites: 22 passed, 0 failed
```

### 3. Start Anvil

Anvil is Foundry's local EVM node. It mines blocks instantly and gives you 10 funded test accounts.

Open a dedicated terminal and run:

```bash
anvil
```

Anvil starts at `http://127.0.0.1:8545` with **Chain ID 31337**.

Default test accounts (all funded with 10,000 ETH):

| Index | Address | Private Key |
|-------|---------|-------------|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

> **Important:** Anvil does **not** persist state. Every time you restart it, the chain resets to block 0. You must redeploy contracts after every restart.

### 4. Deploy the VaultFactory

In a new terminal (keep Anvil running):

```bash
cd contracts

# Set the deployer private key (Anvil account 0)
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Deploy
forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545
```

Expected output:

```
VaultFactory deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
```

The factory address `0x5FbDB2315678afecb367f032d93F642f64180aa3` is deterministic — it's always the same on a fresh Anvil (account 0, nonce 0).

> **Note:** If you restart Anvil and redeploy, the address will be the same **only if** no other transactions were sent from account 0 before the deploy. If you've sent other transactions, reset Anvil first:
>
> ```bash
> cast rpc anvil_reset --rpc-url http://127.0.0.1:8545
> ```

---

## Frontend — Local Setup

All frontend commands run from the `frontend/` directory.

```bash
cd frontend
```

### 1. Install Node Dependencies

```bash
npm install
```

### 2. Update the Factory Address

Open `src/utils/abi.ts` and confirm the factory address matches your deployment:

```ts
// src/utils/abi.ts
export const FACTORY_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3' as const;
```

If you deployed to a different address (e.g. due to a non-zero nonce), update this value.

### 3. Start the Dev Server

```bash
npm run dev
```

The app will be available at: **`http://localhost:3000`**

---

## Using the App (End-to-End Flow)

### Step 1 — Configure your wallet for Anvil

In MetaMask (or any injected wallet), add a custom network:

| Field | Value |
|-------|-------|
| Network Name | Anvil Local |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

Then import any Anvil private key. Account 0 is a convenient owner:

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

To test the beneficiary flow, also import account 1:

```
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

### Step 2 — Connect and deploy your vault

1. Open `http://localhost:3000` and click **Launch App**.
2. Connect with account 0 (the owner).
3. The dashboard detects you have no vault and shows the **Initialize Your Vault** form.
4. Enter account 1's address as the beneficiary: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
5. Choose a timeout (e.g. **1 month**).
6. Click **Deploy My Vault** and confirm in wallet.

### Step 3 — Deposit ETH

1. Navigate to **Deposit** in the sidebar.
2. Select a quick preset (e.g. `0.5 ETH`) or enter a custom amount.
3. Click **Deposit ETH** and confirm.

### Step 4 — Ping (Proof of Life)

1. Navigate to **Overview**.
2. Click **Emit Proof of Life** and confirm.
3. The countdown timer resets to the full timeout period.

### Step 5 — Withdraw (optional)

1. Navigate to **Withdraw**.
2. Use the percentage presets (25% / 50% / 75% / Max) or enter a custom amount.
3. Confirm the transaction.

### Step 6 — Change Beneficiary (optional)

1. Navigate to **Settings**.
2. Enter the new beneficiary address.
3. Confirm the transaction.

---

## Simulating the Inheritance Fallback

To test the beneficiary claim flow without waiting for the real timeout, use Anvil's time manipulation:

### Warp the blockchain clock

```bash
# Increase time by 31 days (2,678,400 seconds) — past the default 30-day timeout
cast rpc anvil_increaseTime 2678400 --rpc-url http://127.0.0.1:8545

# Mine a block so the new timestamp takes effect
cast rpc anvil_mine --rpc-url http://127.0.0.1:8545
```

### Claim as beneficiary

1. Switch to account 1 in MetaMask (the beneficiary you set in Step 2).
2. Open the dashboard — it detects you as a beneficiary.
3. Navigate to **Claim Inheritance**.
4. The countdown shows `00:00:00:00` and the status changes to **Vault Unlocked**.
5. Click **Claim Inheritance** and confirm the transaction.
6. Account 1 receives the full ETH balance.

### Reset Anvil for a fresh run

```bash
# Wipe chain state (all contracts and balances reset)
cast rpc anvil_reset --rpc-url http://127.0.0.1:8545

# Then redeploy the factory
export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
cd contracts && forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545
```

---

## Contract Reference

### VaultFactory

**Address (fresh Anvil):** `0x5FbDB2315678afecb367f032d93F642f64180aa3`

| Function | Description |
|----------|-------------|
| `createVault(address beneficiary, uint256 timeoutPeriod)` | Deploys a new Vault and registers it |
| `getOwnerVaults(address owner)` → `address[]` | All vaults owned by an address |
| `getBeneficiaryVaults(address beneficiary)` → `address[]` | All vaults where address is beneficiary |

### Vault

One instance per user. Created by the factory.

| Function | Access | Description |
|----------|--------|-------------|
| `depositETH()` | anyone | Deposit ETH via explicit function call |
| `depositERC20(address token, uint256 amount)` | anyone | Deposit ERC-20 (requires prior `approve`) |
| `ping()` | owner | Reset the inactivity timer |
| `withdraw(uint256 amount)` | owner | Withdraw ETH back to owner |
| `withdrawERC20(address token, uint256 amount)` | owner | Withdraw ERC-20 tokens |
| `changeBeneficiary(address newBeneficiary)` | owner | Update the beneficiary address |
| `claimFunds()` | beneficiary | Sweep all ETH after timeout expires |
| `claimERC20(address token)` | beneficiary | Sweep all of a token after timeout expires |
| `vaultBalance()` | view | Returns current ETH balance |

**State variables:**

| Variable | Type | Description |
|----------|------|-------------|
| `owner` | `address` | Vault owner (can ping, withdraw, change beneficiary) |
| `beneficiary` | `address` | Inheritor (can claim after timeout) |
| `lastPingTime` | `uint256` | Unix timestamp of last proof-of-life ping |
| `timeoutPeriod` | `uint256` | Inactivity threshold in seconds |
| `factory` | `address` | Immutable reference to the deploying factory |

**Custom errors:**

| Error | When |
|-------|------|
| `Unauthorized()` | Caller is not the authorized address |
| `NotExpired()` | Timeout has not elapsed yet |
| `ZeroAddress()` | A zero address was passed to a sensitive field |
| `TransferFailed()` | Native ETH transfer failed |
| `ZeroAmount()` | Attempted to deposit or withdraw zero |

---

## Security Notes

- **Non-custodial:** No admin key, no upgrade proxy, no multisig. The contract is immutable once deployed.
- **Reentrancy protection:** All fund-moving functions (`withdraw`, `withdrawERC20`, `claimFunds`, `claimERC20`, `depositERC20`) use OpenZeppelin's `ReentrancyGuard`.
- **Safe ERC-20:** All token transfers use `SafeERC20` to handle non-standard tokens (USDT, etc.).
- **Deterministic timeout:** Enforced entirely by `block.timestamp`. There is no off-chain oracle, no backend, no human gate.
- **Factory trust model:** The factory holds no funds and has no administrative control over any deployed vault. It is purely a registry.

> This codebase has **not been professionally audited**. It is intended for educational and local development purposes. Do not use on mainnet with real funds without a full security audit.

---

## License

MIT — see individual file headers.

Built with [Foundry](https://getfoundry.sh), [Next.js](https://nextjs.org), [wagmi](https://wagmi.sh), and [RainbowKit](https://rainbowkit.com).

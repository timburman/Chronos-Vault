Excellent choice. The Dead Man's Switch (Inheritance Protocol) is the perfect hackathon-style build. It demonstrates a deep understanding of trustless execution and solves a real, visceral problem in crypto. And noted on the antigravity—we can bend the laws of physics once this demo is in the bag.

Here is the exact architectural blueprint to get this built, tested, and demo-ready by tomorrow.

### The Stack
* **Smart Contracts:** Solidity, built and tested with Foundry.
* **Local Node:** Anvil (running a local, instantaneous blockchain).
* **Frontend:** Next.js (App Router), Tailwind CSS, and `wagmi`/`viem` for blockchain interactions.

---

### The Monorepo Structure
Keep everything in one folder to make your life easier tonight. 

```text
/inheritance-protocol
├── /contracts                # Foundry project root
│   ├── /src
│   │   └── Vault.sol         # The single, core smart contract
│   ├── /script
│   │   └── Deploy.s.sol      # Script to deploy locally
│   └── /test
│       └── Vault.t.sol       # Tests (crucial for your demo script)
└── /frontend                 # Next.js project root
    ├── /app
    │   ├── page.tsx          # Main dashboard UI
    │   ├── layout.tsx        
    │   └── globals.css       # Tailwind imports
    ├── /components
    │   ├── PingButton.tsx    # Owner's interaction
    │   └── ClaimButton.tsx   # Beneficiary's interaction
    └── /utils
        └── abi.ts            # Contract ABI pasted here after compiling
```

---

### Phase 1: The Smart Contract (`Vault.sol`)
You only need one robust contract. Keep the state variables and functions minimal.

**State Variables:**
* `address public owner;` 
* `address public beneficiary;`
* `uint256 public lastPingTime;`
* `uint256 public timeoutPeriod;` (e.g., 30 days, but set it to 60 seconds for local testing).
* `uint256 public vaultBalance;`

**Core Functions:**
1.  **`constructor(address _beneficiary, uint256 _timeoutPeriod)`**: Sets up the vault, makes the deployer the owner, and initializes the timer.
2.  **`receive() external payable`**: Allows the contract to accept ETH.
3.  **`ping() external`**: Can only be called by the `owner`. Updates `lastPingTime = block.timestamp`.
4.  **`claimFunds() external`**: Can only be called by the `beneficiary`. Contains the core logic:
    * *Require:* `block.timestamp > lastPingTime + timeoutPeriod`.
    * *Action:* Transfers the contract's balance to the beneficiary.

---

### Phase 2: The Demo Secret Weapon (Foundry Tests)
Tomorrow, you won't have time to actually wait for a timer to expire. You need to manipulate time. Foundry’s cheatcodes are going to save your presentation.

In your `Vault.t.sol`, write a test that acts as your live demo script:
1.  **Fund the vault.**
2.  **Attempt early claim:** Have the beneficiary try to claim. It should revert (fail). 
3.  **Time Travel:** Use `vm.warp(block.timestamp + 31 days)` to instantly fast-forward the blockchain's clock.
4.  **Successful claim:** Have the beneficiary claim again. Show the funds successfully routing to their wallet.

*Note: You can actually run these commands live in the terminal using `cast` against your local Anvil node during the presentation to look like a wizard.*

---

### Phase 3: The Next.js Frontend
Keep the UI stark, minimal, and dark-themed. You want it to feel like a highly secure vault.

**The Layout:**
Create a split-screen or two-tab layout to represent the two different actors in this system.

* **View 1: The Owner Dashboard**
    * Shows the current locked balance.
    * Displays a massive countdown timer: "Time until Vault Unlocks."
    * A prominent "PING VAULT" button. Clicking this triggers the `ping()` transaction via your wallet, resetting the countdown.
* **View 2: The Beneficiary Dashboard**
    * Shows the locked balance they are entitled to.
    * Displays the vault status: "Locked" (Red) or "Unlocked" (Green).
    * A "CLAIM INHERITANCE" button. This button should be disabled (grayed out) until the timer hits zero.

### The Execution Plan for Tonight
1.  **Hours 1-2:** Spin up Foundry. Write `Vault.sol`. Test it obsessively with `forge test` and time-warping.
2.  **Hours 3-4:** Spin up the Next.js app. Install Tailwind and Wagmi. Get your local wallet (like MetaMask or Rabby) connected to your local Anvil node.
3.  **Hours 5-6:** Wire the frontend buttons to the contract functions. Polish the UI so it looks presentable.

Do you want to start by hammering out the exact Solidity logic for the vault, or do you want to set up the monorepo and dependencies first?

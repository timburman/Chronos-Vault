# LegacyForge: The Future of Trustless Inheritance

LegacyForge is a non-custodial, open-source protocol designed to solve the "inheritance problem" of self-custody. It provides a secure, on-chain dead man's switch that ensures your digital legacy is passed to your loved ones without relying on lawyers, centralized exchanges, or trusted third parties.

---

## ⚖️ Why? (The Problem)

In the traditional world, inheritance is governed by legal wills and probate courts—processes that are slow, expensive, and require significant trust in human intermediaries. In the crypto world, inheritance is even more precarious:
- **Key Loss**: If you hold your own keys and pass away without a plan, those assets are lost forever.
- **Centralized Friction**: Exchanges have opaque, complex processes for releasing funds to next-of-kin, often taking months or years.
- **Security vs. Accessibility**: If you give your keys to a family member now, you lose security. If you don't give them, they lose accessibility.

LegacyForge was built to remove the human element entirely, replacing trust in people with trust in immutable code.

---

## 🛠️ What? (The Solution)

LegacyForge is a decentralized protocol that allows you to create an isolated, smart-contract-based vault for your assets. 
- **Non-Custodial**: Only the owner has control over the assets while they are active. No one (not even the protocol developers) can access your funds.
- **Asset Agnostic**: Supports Native ETH, ERC-20 tokens, ERC-721 (NFTs), and ERC-1155 (Multi-tokens).
- **Isolated Architecture**: Every user gets their own unique vault contract deployed via a factory, ensuring that one user's security profile does not affect another.

---

## ⏱️ When? (The Trigger)

The protocol functions as a **Dead Man's Switch**.
- **The Heartbeat**: The owner must "ping" the contract periodically to prove they still have control of their keys.
- **The Timeout**: If the contract does not receive a ping within a user-defined period (e.g., 6 months, 1 year), the vault is considered "inactive."
- **The Unlock**: Once the timeout expires, the vault unlocks specifically for the designated beneficiary, allowing them to claim the assets.

---

## 🚀 How? (The Mechanism)

1.  **Deployment**: A user connects their wallet and uses the `VaultFactory` to deploy their personal `Vault` contract.
2.  **Configuration**: The owner sets a **Beneficiary** address and a **Timeout Period** (minimum 7 days).
3.  **Funding**: The owner deposits assets into the vault. These assets remain under the owner's full control for withdrawals at any time.
4.  **Guardians**: The owner can designate "Guardians"—trusted friends or secondary wallets—who can "ping" the contract on the owner's behalf to prevent accidental triggers, but who **cannot** withdraw funds.
5.  **Timelocked Changes**: To prevent an attacker from immediately changing the beneficiary if they compromise a wallet, all beneficiary changes are subject to a mandatory 3-day timelock.
6.  **The Claim**: If the owner stops pinging, the beneficiary can call the `claim` functions to sweep the assets to their own wallet.

---

## 💻 Tech Stack

### Smart Contracts (The Core)
- **Solidity ^0.8.20**: The programming language for the protocol logic.
- **Foundry**: The development framework used for building, testing (Forge), and deploying (Script) the contracts.
- **OpenZeppelin**: Industry-standard libraries for `ReentrancyGuard`, `SafeERC20`, and token receiver interfaces.
- **Anvil**: Local Ethereum node for rapid development and simulation.

### Frontend (The Interface)
- **Next.js 14 (App Router)**: For a fast, SEO-optimized, and premium editorial-style user experience.
- **TypeScript**: Ensuring type safety across the entire dashboard.
- **Tailwind CSS**: Custom utility-first styling for a sleek, "web3-editorial" aesthetic.
- **Framer Motion**: Powering smooth micro-animations and transitions.

### Web3 Integration
- **Wagmi & Viem**: The leading React hooks and low-level libraries for Ethereum interaction.
- **RainbowKit**: A polished, intuitive wallet connection experience.
- **CoinGecko API**: Real-time ETH price tracking with a 24-hour `localStorage` cache to optimize performance and rate-limiting.

---

## 🛡️ Security First
- **Isolated Bytecode**: Each vault is a standalone contract.
- **No Proxy Risk**: Contracts are immutable and do not use upgradeability proxies, removing the risk of central management.
- **Pull over Push**: Funds are never "pushed" to beneficiaries; they must be "pulled" by the authorized address after the timeout, ensuring no gas griefing or unexpected reverts.

---

## 🔄 Technical Data Flow & Lifecycle

The following section outlines how data propagates through the LegacyForge ecosystem, from user interaction to on-chain finality.

### 1. Connection & Discovery Phase
- **Input**: User connects via **RainbowKit**.
- **Process**: 
    1. The frontend invokes `getOwnerVaults(address)` and `getBeneficiaryVaults(address)` on the `VaultFactory`.
    2. The factory queries its internal mappings and returns an array of contract addresses.
    3. **Wagmi** caches these addresses, and the UI dynamically switches from "Initialization Mode" to "Dashboard Mode".

### 2. Live State Synchronization
- **Blockchain Data**: The dashboard uses **TanStack Query** (via Wagmi) to track:
    - `lastPingTime`: To calculate the exact countdown timer.
    - `vaultBalance`: To display real-time ETH holdings.
    - `beneficiary`: To verify the current inheritor.
- **Off-chain Data**: A `useEffect` hook triggers the **CoinGecko** integration.
    - It checks `localStorage` for a valid `cv_price_cache`. 
    - If expired (>24h), it fetches the latest ETH/USD price.
    - This price is multiplied by the `vaultBalance` to generate the "Portfolio Valuation" view.

### 3. Transaction Lifecycle (e.g., The "Ping")
- **Action**: User clicks "Emit Proof of Life".
- **Flow**:
    1. `useWriteContract` prepares the calldata for the `ping()` function.
    2. **MetaMask** prompts the user for a signature.
    3. The transaction is broadcast to the network.
    4. Upon `success`, the frontend triggers a **Query Invalidation**.
    5. Wagmi re-fetches the `lastPingTime` from the blockchain.
    6. The UI countdown resets instantly, reflecting the new block timestamp.

### 4. Inheritance Trigger Flow
- **The Simulation**: In a local environment, **Anvil** is instructed to skip time (`anvil_increaseTime`).
- **The UI Reaction**: 
    1. The React state detects that `(Date.now() / 1000) > (lastPingTime + timeout)`.
    2. The UI component switches from "Active" (Green) to "Unlocked" (Amber).
    3. The "Claim" button is enabled for the beneficiary.
- **The Execution**: The beneficiary calls `claimFunds()`. The contract's `afterTimeout` modifier validates the timestamp on-chain—independent of the UI state—and executes the transfer.

---

## 📈 Gas Optimization Strategy

To ensure LegacyForge remains cost-effective on mainnet/L2s, several optimizations were implemented:
- **Custom Errors**: Using `error Unauthorized()` instead of `require(..., "Unauthorized")` saves ~50-100 gas per revert by avoiding long string storage.
- **Immutable Factory Ref**: Storing the `factory` address as an `immutable` variable saves 2,100 gas on every access by reading from bytecode instead of storage.
- **Indexed Events**: Critical parameters (owner, beneficiary, token) are `indexed` in events to allow the frontend to filter transaction history efficiently without querying heavy storage states.


# TABLE OF CONTENTS

## Title Page

## Certificate

## Declaration

## Acknowledgement

## Abstract

## Table of Contents

## List of Figures

## List of Tables

---

# CHAPTER 1: INTRODUCTION

### 1.1 Introduction to Blockchain-Based Digital Inheritance Systems

### 1.2 Background of the Study

### 1.3 Introduction to LegacyForge

### 1.4 Problem Statement

### 1.5 Objectives of the Project

#### 1.5.1 Primary Objectives

#### 1.5.2 Secondary Objectives

### 1.6 Scope of the Project

### 1.7 Proposed Solution

### 1.8 Key Features of LegacyForge

#### 1.8.1 Non-Custodial Architecture

#### 1.8.2 Dead Man’s Switch Mechanism

#### 1.8.3 Multi-Asset Support

#### 1.8.4 Guardian-Based Safety System

#### 1.8.5 Timelocked Beneficiary Updates

#### 1.8.6 Multi-Wallet Authentication

#### 1.8.7 Real-Time Blockchain Synchronization

### 1.9 Deliverables

### 1.10 Organization of the Dissertation

---

# CHAPTER 2: LITERATURE REVIEW AND PROJECT DESCRIPTION

### 2.1 Introduction

### 2.2 Literature Review

#### 2.2.1 Blockchain-Based Asset Management Systems

#### 2.2.2 Smart Contract Security Research

#### 2.2.3 Decentralized Inheritance Protocols

#### 2.2.4 Wallet Recovery Mechanisms in Web3

#### 2.2.5 Dead Man’s Switch Systems

#### 2.2.6 Ethereum Smart Contract Architectures

#### 2.2.7 Non-Custodial Financial Systems

### 2.3 Comparative Analysis of Existing Systems

### 2.4 Existing System

#### 2.4.1 Traditional Inheritance Systems

#### 2.4.2 Centralized Crypto Custody Platforms

#### 2.4.3 Limitations of Existing Systems

### 2.5 Proposed System

### 2.6 System Interfaces

#### 2.6.1 User Interface

#### 2.6.2 Smart Contract Interface

#### 2.6.3 Wallet Connection Interface

#### 2.6.4 Blockchain Communication Interface

#### 2.6.5 API Integration Interface

#### 2.6.6 Frontend–Backend Interaction Layer

### 2.7 System Specifications

#### 2.7.1 Hardware Requirements

#### 2.7.2 Software Requirements

### 2.8 Communication Interfaces

### 2.9 Development Methodology and Tools Used

#### 2.9.1 Requirement Gathering Phase

#### 2.9.2 System Design Phase

#### 2.9.3 Smart Contract Development Phase

#### 2.9.4 Frontend Development Phase

#### 2.9.5 Integration Phase

#### 2.9.6 Testing Phase

#### 2.9.7 Deployment Phase

#### 2.9.8 Post-Deployment Maintenance

### 2.10 Constraints

### 2.11 Assumptions and Dependencies

### 2.12 User Characteristics

---

# CHAPTER 3: REQUIREMENT ANALYSIS AND FEASIBILITY STUDY

### 3.1 Requirement Analysis

#### 3.1.1 Functional Requirements

#### 3.1.2 Non-Functional Requirements

### 3.2 Software Requirement Specification (SRS)

#### 3.2.1 User Requirements

#### 3.2.2 System Requirements

#### 3.2.3 Smart Contract Requirements

#### 3.2.4 Security Requirements

### 3.3 Feasibility Study

#### 3.3.1 Technical Feasibility

#### 3.3.2 Economic Feasibility

#### 3.3.3 Operational Feasibility

#### 3.3.4 Legal and Ethical Feasibility

#### 3.3.5 Schedule Feasibility

### 3.4 Risk Analysis

#### 3.4.1 Smart Contract Risks

#### 3.4.2 Wallet Compromise Risks

#### 3.4.3 Network Dependency Risks

#### 3.4.4 User Error Risks

### 3.5 Security Analysis

#### 3.5.1 Reentrancy Protection

#### 3.5.2 Access Control Mechanisms

#### 3.5.3 Timelock Security

#### 3.5.4 Pull-Based Withdrawal Security

#### 3.5.5 Immutable Contract Design

---

# CHAPTER 4: SYSTEM DESIGN AND ARCHITECTURE

### 4.1 Introduction

### 4.2 System Design Overview

### 4.3 Architectural Design

#### 4.3.1 High-Level Architecture

#### 4.3.2 Modular Smart Contract Architecture

#### 4.3.3 Frontend Architecture

#### 4.3.4 Blockchain Interaction Architecture

### 4.4 System Workflow

#### 4.4.1 Vault Creation Workflow

#### 4.4.2 Asset Deposit Workflow

#### 4.4.3 Proof-of-Life Workflow

#### 4.4.4 Guardian Interaction Workflow

#### 4.4.5 Beneficiary Claim Workflow

### 4.5 Logical Database Design

#### 4.5.1 On-Chain Data Structure Design

#### 4.5.2 Local Cache Design

#### 4.5.3 Event Logging Architecture

### 4.6 Entity Relationship Diagram (ERD)

[Insert ER Diagram Here]

### 4.7 Smart Contract Data Structures

#### 4.7.1 VaultFactory Contract Structure

#### 4.7.2 Vault Contract Structure

#### 4.7.3 Guardian Mapping Structure

#### 4.7.4 Beneficiary State Structure

### 4.8 Input Design

#### 4.8.1 Wallet Connection Interface

#### 4.8.2 Vault Creation Interface

#### 4.8.3 Asset Deposit Interface

#### 4.8.4 Guardian Management Interface

#### 4.8.5 Beneficiary Configuration Interface

#### 4.8.6 Ping Mechanism Interface

### 4.9 Output Design

#### 4.9.1 Dashboard Interface

#### 4.9.2 Portfolio Valuation Display

#### 4.9.3 Countdown Timer Output

#### 4.9.4 Transaction Status Output

#### 4.9.5 Claim Status Interface

### 4.10 UML Diagram Explanations

#### 4.10.1 Use Case Diagram

#### 4.10.2 Class Diagram

#### 4.10.3 Activity Diagram

#### 4.10.4 Sequence Diagram

#### 4.10.5 State Transition Diagram

### 4.11 Use Case Descriptions

#### 4.11.1 Create Vault

#### 4.11.2 Deposit Assets

#### 4.11.3 Ping Vault

#### 4.11.4 Add Guardians

#### 4.11.5 Change Beneficiary

#### 4.11.6 Claim Assets

---

# CHAPTER 5: IMPLEMENTATION

### 5.1 Introduction

### 5.2 Development Environment Setup

#### 5.2.1 Foundry Environment Setup

#### 5.2.2 Next.js Project Configuration

#### 5.2.3 Wagmi and Viem Integration

#### 5.2.4 RainbowKit Configuration

### 5.3 Smart Contract Implementation

#### 5.3.1 VaultFactory.sol Implementation

#### 5.3.2 Vault.sol Implementation

#### 5.3.3 Constructor Initialization

#### 5.3.4 Access Control Logic

#### 5.3.5 Timeout Validation Logic

#### 5.3.6 Timelock Mechanism

#### 5.3.7 Guardian Authorization Logic

#### 5.3.8 Asset Withdrawal Mechanism

#### 5.3.9 ERC-20 Token Handling

#### 5.3.10 ERC-721 NFT Handling

#### 5.3.11 ERC-1155 Token Handling

### 5.4 Frontend Implementation

#### 5.4.1 User Interface Design

#### 5.4.2 Dashboard Implementation

#### 5.4.3 Wallet Authentication Flow

#### 5.4.4 Real-Time State Synchronization

#### 5.4.5 Transaction Lifecycle Handling

#### 5.4.6 Responsive Design Implementation

#### 5.4.7 Animation and UI Enhancement

### 5.5 Blockchain Integration

#### 5.5.1 Smart Contract Interaction Using Wagmi

#### 5.5.2 Viem-Based Blockchain Calls

#### 5.5.3 Event Listening and Query Invalidation

#### 5.5.4 Sepolia Testnet Deployment

### 5.6 API and External Service Integration

#### 5.6.1 CoinGecko API Integration

#### 5.6.2 ETH Price Caching Mechanism

#### 5.6.3 Local Storage Optimization

### 5.7 Gas Optimization Techniques

#### 5.7.1 Custom Errors

#### 5.7.2 Immutable Variables

#### 5.7.3 Indexed Events

#### 5.7.4 Storage Optimization

### 5.8 Security Implementation

#### 5.8.1 ReentrancyGuard Usage

#### 5.8.2 SafeERC20 Integration

#### 5.8.3 Timelock Protection

#### 5.8.4 Pull-Based Claim System

#### 5.8.5 Immutable Contract Design

### 5.9 Deployment Process

#### 5.9.1 Local Deployment Using Anvil

#### 5.9.2 Deployment Scripts in Foundry

#### 5.9.3 Sepolia Testnet Deployment

#### 5.9.4 Environment Variable Configuration

### 5.10 Screenshot Explanations

#### 5.10.1 Landing Page Screenshot

#### 5.10.2 Dashboard Screenshot

#### 5.10.3 Vault Creation Screenshot

#### 5.10.4 Guardian Management Screenshot

#### 5.10.5 Claim Interface Screenshot

#### 5.10.6 Wallet Connection Screenshot

---

# CHAPTER 6: TESTING

### 6.1 Introduction

### 6.2 Test Activities

### 6.3 Unit Testing

#### 6.3.1 Methodology Used

#### 6.3.2 Tools Used

#### 6.3.3 Smart Contract Unit Test Cases

#### 6.3.4 Frontend Unit Test Cases

### 6.4 Integration Testing

#### 6.4.1 Methodology Used

#### 6.4.2 Tools Used

#### 6.4.3 Wallet and Smart Contract Integration Testing

#### 6.4.4 Frontend–Blockchain Integration Testing

### 6.5 System Testing

#### 6.5.1 Functional Testing

#### 6.5.2 Non-Functional Testing

#### 6.5.3 Performance Testing

#### 6.5.4 Security Testing

#### 6.5.5 Gas Consumption Testing

### 6.6 Fuzz Testing

#### 6.6.1 Fuzz Testing Methodology

#### 6.6.2 Randomized Input Validation

#### 6.6.3 Security Edge Case Analysis

### 6.7 Acceptance Testing

#### 6.7.1 Methodology Used

#### 6.7.2 User Acceptance Scenarios

#### 6.7.3 Expected Outcomes

### 6.8 Test Reports and Debugging

### 6.9 Result Analysis

#### 6.9.1 Smart Contract Reliability Analysis

#### 6.9.2 UI Responsiveness Analysis

#### 6.9.3 Security Analysis

#### 6.9.4 Gas Efficiency Analysis

---

# CHAPTER 7: RESULTS AND DISCUSSION

### 7.1 Introduction

### 7.2 System Outcomes

### 7.3 Functional Results

### 7.4 Security Evaluation

### 7.5 Smart Contract Performance Analysis

### 7.6 User Experience Evaluation

### 7.7 Comparative Discussion with Existing Systems

### 7.8 Advantages of the System

#### 7.8.1 Decentralization

#### 7.8.2 Non-Custodial Asset Ownership

#### 7.8.3 Transparency

#### 7.8.4 Security Enhancements

#### 7.8.5 Trustless Inheritance Execution

### 7.9 Limitations of the System

### 7.10 Future Scope

#### 7.10.1 Multi-Chain Expansion

#### 7.10.2 DAO-Based Recovery Systems

#### 7.10.3 Legal Integration with Digital Wills

#### 7.10.4 Mobile Application Development

#### 7.10.5 Advanced Analytics Dashboard

#### 7.10.6 Decentralized Identity Integration

### 7.11 Conclusion

---

# REFERENCES / BIBLIOGRAPHY

### Books

### Research Papers

### Blockchain Documentation

### Smart Contract Security Resources

### Web Resources

### APIs and Libraries

---

# APPENDICES

### Appendix A – Smart Contract Code Snippets

### Appendix B – Foundry Test Cases

### Appendix C – Deployment Scripts

### Appendix D – Screenshots

### Appendix E – Gas Reports

### Appendix F – Smart Contract ABI Structures

### Appendix G – Sample Transaction Outputs


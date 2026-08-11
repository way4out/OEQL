# OEQL Smart Contracts — Deployment Guide
# StellarNet LLC | Attribution: 4 GOD & 4 huMan
# Status: ENGINEERING_DESIGN — written, not yet compiled or audited

## Why Foundry, not BANKR

BANKR was evaluated and removed. Reasons:
1. Dependency on a third-party yield protocol adds counterparty risk
2. Self-custodied Solidity contracts are simpler, cheaper, and owned outright
3. Foundry is free, open-source, and battle-tested
4. No fees to a yield intermediary

## Contracts (already written, in contracts/src/)

| Contract | Purpose | Status |
|---|---|---|
| ArtifactRegistry.sol | On-chain provenance for OEQL artifacts | WRITTEN — not compiled |
| ContributorReputation.sol | Attribution + contribution records | WRITTEN — not compiled |
| BountyEscrow.sol | Task bounties, paid on Tucker's approval | WRITTEN — not compiled |

## One-time setup (your machine, needs network)

```bash
# Install Foundry (free, takes 1 minute)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# In the contracts directory:
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge build
forge test
```

## Testnet deploy (free — no real money)

```bash
# Get free Sepolia ETH at sepoliafaucet.com or faucet.sepolia.dev
# Then:
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
```

## Mainnet deploy (REQUIRES TUCKER AUTHORIZATION — owner-auth.json PIN)

```bash
# Only after:
# 1. forge test passes completely
# 2. External audit completed
# 3. Tucker's explicit APPROVE with PIN verification
forge script script/Deploy.s.sol --rpc-url mainnet --broadcast --verify
```

## Verification

After testnet deploy, paste the contract addresses into:
governance/contract-addresses.md

The ArtifactRegistry becomes the on-chain provenance record for
all OEQL research findings — linking the evidence ledger to the blockchain.

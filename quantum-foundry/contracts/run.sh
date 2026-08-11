#!/usr/bin/env bash
# OEQL Smart Contracts — Complete Deployment Runner
# Creator: Tucker Layne Martin / StellarNet LLC
# Attribution: 4 GOD & 4 huMan
#
# STEP 1: Install Foundry (one time)
#   curl -L https://foundry.paradigm.xyz | bash && foundryup
#
# STEP 2: Get free Sepolia ETH
#   https://sepoliafaucet.com  OR  https://faucet.sepolia.dev
#
# STEP 3: Export your wallet private key (the one with Sepolia ETH)
#   export PRIVATE_KEY=0xyour_private_key_here
#
# STEP 4: Run this script
#   chmod +x contracts/run.sh && ./contracts/run.sh

set -e
cd "$(dirname "$0")"

echo "=== OEQL Contracts Build & Test ==="
forge install OpenZeppelin/openzeppelin-contracts --no-commit 2>/dev/null || true
forge build
forge test -v

echo ""
echo "=== Deploy to Sepolia testnet (FREE) ==="
if [ -z "$PRIVATE_KEY" ]; then
  echo "ERROR: Set PRIVATE_KEY environment variable first"
  echo "  export PRIVATE_KEY=0xyour_key_here"
  exit 1
fi

forge script script/Deploy.s.sol \
  --rpc-url https://rpc.sepolia.org \
  --broadcast \
  --verify \
  -vvv

echo ""
echo "=== Save addresses to governance/contract-addresses.md ==="
echo "Testnet deploy complete. Copy the addresses above into:"
echo "  quantum-foundry/governance/contract-addresses.md"
echo ""
echo "For MAINNET: Requires Tucker's explicit APPROVE + external audit."
echo "  forge script script/Deploy.s.sol --rpc-url mainnet --broadcast --verify"

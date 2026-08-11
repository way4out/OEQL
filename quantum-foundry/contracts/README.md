# Quantum Foundry Smart Contracts
Attribution: 4 GOD & 4 huMan

## Status, honestly

Written but **not compiled, not tested, not audited**. The environment
that wrote this had no `forge`, no `solc`, and no network access to
install either. Do not trust any of this code until you've personally
run the steps below on a machine with network access.

## Why this replaces the Bankr-based plan

The earlier plan routed treasury/token actions through Bankr, a
third-party natural-language agent, with careful prompt-scoping as the
main safety mechanism. That's a reasonable stopgap, but it has a
structural weakness: trust is placed in a third party's interpretation
of a prompt, not in auditable, self-custodied code you control. This
replaces that with the thing the master plan actually specified as the
real target all along (§17): source-controlled Solidity contracts you
compile, test, and deploy yourself, with Bankr no longer in the loop
for anything.

## Setup

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge build
forge test -vvv
```

If `forge` isn't installed: `curl -L https://foundry.paradigm.xyz | bash`
then `foundryup` (per Foundry's own install instructions — verify
against their current docs, not this comment, since install steps can
change).

## What's here

| Contract | Purpose | Status |
|---|---|---|
| `ArtifactRegistry.sol` | Anchors content hashes of published artifacts | Written, untested |
| `ContributorReputation.sol` | Non-transferable reputation, governance-minted only | Written, untested |
| `BountyEscrow.sol` | Holds bounty payment until verified completion | Written, untested |

## What's deliberately NOT custom-written here, and why

**Treasury custody:** use a [Safe](https://safe.global) multisig
directly. Do not write a custom treasury contract — Safe is
battle-tested, widely audited, and reinventing multisig logic here
would add risk for no benefit. The master plan's `FoundryTreasury`
concept is implemented as *a Safe address*, not new code.

**Governance (proposals/voting/timelock):** use OpenZeppelin's
`Governor` + `TimelockController` contracts directly, per their own
documentation and deployment wizard, rather than a hand-written
version. Same reasoning as Safe — this is exactly the kind of complex,
security-critical logic where using a mature, widely-reviewed
implementation is the responsible choice, not writing your own for the
sake of it. The master plan's `GovernorModule`/`GovernanceTimelock`
concepts map onto OpenZeppelin's own contracts, configured for this
project (voting weight source = `ContributorReputation`, once that
integration is written and tested).

**Why ArtifactRegistry, ContributorReputation, and BountyEscrow ARE
custom:** these are Quantum Foundry-specific logic with no standard
off-the-shelf equivalent — this is where custom code is actually
warranted, and where the audit budget should focus.

## Deployment (do not do this yet)

1. `forge build && forge test` — must pass, on your own machine.
2. Deploy to a testnet first (Base Sepolia). Exercise the full
   lifecycle there.
3. External security audit of the three custom contracts above.
4. Only after both: mainnet deployment, via a filled-out
   `governance/human-authorization-gate.md` record for the specific
   deployment transaction, from a Safe multisig — never a personal
   wallet, never an AI agent's own key.

## Constructor parameters, for reference

- `ArtifactRegistry()` — no constructor args.
- `ContributorReputation(address admin)` — `admin` should be the
  founding Safe multisig address initially, with a documented path to
  transfer `DEFAULT_ADMIN_ROLE` to a Timelock once governance exists.
- `BountyEscrow(address admin)` — same pattern; `admin` gets both
  `FUNDER_ROLE` and `VERIFIER_ROLE` initially, intended to be split to
  different addresses (treasury Safe for funding, a separate
  verification process/multisig for release) once the project is past
  bootstrap — don't leave both roles on one address indefinitely.

// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title ContributorReputation
/// @notice Non-transferable ("soulbound-style") reputation points, minted
///         ONLY by an address holding MINTER_ROLE (intended to be the
///         GovernorModule/Timelock once governance exists — see the
///         charter draft, governance/founding-charter-draft.md). Never
///         self-minted, never transferable, so it can't be bought,
///         sold, or farmed by moving tokens between wallets.
/// @dev Attribution: 4 GOD & 4 huMan
///      NOT AUDITED. NOT COMPILED in the writing environment — run
///      `forge build && forge test` before trusting this file.
///      Depends on OpenZeppelin Contracts (AccessControl) — run
///      `forge install OpenZeppelin/openzeppelin-contracts` first.
contract ContributorReputation is AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    mapping(address => uint256) public reputationOf;
    uint256 public totalReputation;

    event ReputationMinted(address indexed contributor, uint256 amount, string reason, address indexed mintedBy);

    error ZeroAmount();
    error ZeroAddress();

    /// @param admin Initial admin — intended to be a founding multisig
    ///        during bootstrap, with a documented path to hand
    ///        DEFAULT_ADMIN_ROLE to a Timelock/Governor once one exists
    ///        (per master plan §17/§22 — this is not optional, it's the
    ///        stated decentralization roadmap).
    constructor(address admin) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /// @notice Mint reputation to a contributor for a verifiable,
    ///         attributable action (merged PR with passing CI, verified
    ///         benchmark contribution, audited contract merge — never a
    ///         self-report). The `reason` string should reference a
    ///         verifiable artifact (e.g. a commit hash or an
    ///         ArtifactRegistry artifactId), not free text alone.
    function mintReputation(address contributor, uint256 amount, string calldata reason)
        external
        onlyRole(MINTER_ROLE)
    {
        if (contributor == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        reputationOf[contributor] += amount;
        totalReputation += amount;

        emit ReputationMinted(contributor, amount, reason, msg.sender);
    }

    // Deliberately no transfer(), approve(), or transferFrom() —
    // reputation is non-transferable by omission, not by an
    // overridden hook, since this contract never implements ERC-20/721
    // transfer semantics in the first place.
}

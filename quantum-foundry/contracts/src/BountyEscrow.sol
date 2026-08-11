// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title BountyEscrow
/// @notice Holds ERC-20 (intended: a stablecoin, per master plan §20's
///         volatility-minimizing treasury policy) payment for a task
///         until verified completion, then releases it. Funding a
///         bounty requires FUNDER_ROLE (intended: the treasury/
///         Timelock, per governance). Release requires VERIFIER_ROLE
///         approval of a submitted completion proof — intended to be
///         tied to an off-chain CI/verification result, not a
///         unilateral human "looks good to me."
/// @dev Attribution: 4 GOD & 4 huMan
///      NOT AUDITED. NOT COMPILED in the writing environment — run
///      `forge build && forge test` before trusting this file.
///      Depends on OpenZeppelin Contracts — run
///      `forge install OpenZeppelin/openzeppelin-contracts` first.
contract BountyEscrow is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant FUNDER_ROLE = keccak256("FUNDER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    enum Status { Open, Submitted, Released, Disputed, Cancelled }

    struct Bounty {
        address token;
        uint256 amount;
        address funder;
        address claimant;      // set on submission
        bytes32 proofHash;     // hash of the completion proof (e.g. CI run output)
        Status status;
        uint256 createdAt;
    }

    mapping(uint256 => Bounty) public bounties;
    uint256 public nextBountyId;

    event BountyCreated(uint256 indexed bountyId, address indexed funder, address token, uint256 amount);
    event CompletionSubmitted(uint256 indexed bountyId, address indexed claimant, bytes32 proofHash);
    event BountyReleased(uint256 indexed bountyId, address indexed claimant, uint256 amount);
    event BountyDisputed(uint256 indexed bountyId, address indexed disputedBy);
    event BountyCancelled(uint256 indexed bountyId, address indexed cancelledBy);

    error ZeroAmount();
    error ZeroAddress();
    error WrongStatus(Status expected, Status actual);
    error NotFunder();

    constructor(address admin) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FUNDER_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
    }

    /// @notice Fund a new bounty. Pulls `amount` of `token` from the
    ///         caller — caller must have approved this contract first.
    function createBounty(address token, uint256 amount) external onlyRole(FUNDER_ROLE) returns (uint256 bountyId) {
        if (token == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        bountyId = nextBountyId++;
        bounties[bountyId] = Bounty({
            token: token,
            amount: amount,
            funder: msg.sender,
            claimant: address(0),
            proofHash: bytes32(0),
            status: Status.Open,
            createdAt: block.timestamp
        });

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit BountyCreated(bountyId, msg.sender, token, amount);
    }

    /// @notice Anyone may submit a completion claim with a proof hash
    ///         (e.g. sha256 of a CI run's output, or an ArtifactRegistry
    ///         artifactId's content hash). This does NOT release funds —
    ///         only a VERIFIER_ROLE-approved release() does.
    function submitCompletion(uint256 bountyId, bytes32 proofHash) external {
        Bounty storage b = bounties[bountyId];
        if (b.status != Status.Open) revert WrongStatus(Status.Open, b.status);
        if (proofHash == bytes32(0)) revert ZeroAmount(); // reuse error: nonzero required

        b.claimant = msg.sender;
        b.proofHash = proofHash;
        b.status = Status.Submitted;

        emit CompletionSubmitted(bountyId, msg.sender, proofHash);
    }

    /// @notice Release funds to the claimant. Restricted to VERIFIER_ROLE
    ///         — intended to be automated verification (checking the
    ///         proofHash against an actual CI result) wired up
    ///         off-chain, not a rubber stamp. See master plan §20.
    function release(uint256 bountyId) external onlyRole(VERIFIER_ROLE) nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.status != Status.Submitted) revert WrongStatus(Status.Submitted, b.status);

        b.status = Status.Released;
        IERC20(b.token).safeTransfer(b.claimant, b.amount);

        emit BountyReleased(bountyId, b.claimant, b.amount);
    }

    /// @notice Either party can flag a dispute instead of a clean
    ///         release — resolution mechanism (arbitration, governance
    ///         vote) intentionally left to off-chain/governance process,
    ///         not hard-coded here, since dispute resolution rules are
    ///         a governance decision (charter Article 3.2), not a
    ///         contract-level one.
    function dispute(uint256 bountyId) external {
        Bounty storage b = bounties[bountyId];
        if (b.status != Status.Submitted) revert WrongStatus(Status.Submitted, b.status);
        if (msg.sender != b.funder && msg.sender != b.claimant) revert NotFunder();

        b.status = Status.Disputed;
        emit BountyDisputed(bountyId, msg.sender);
    }

    /// @notice Funder may cancel an still-Open (unsubmitted) bounty and
    ///         reclaim funds.
    function cancel(uint256 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        if (b.status != Status.Open) revert WrongStatus(Status.Open, b.status);
        if (msg.sender != b.funder) revert NotFunder();

        b.status = Status.Cancelled;
        IERC20(b.token).safeTransfer(b.funder, b.amount);

        emit BountyCancelled(bountyId, msg.sender);
    }
}

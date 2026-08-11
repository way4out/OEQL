// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BountyEscrow} from "../src/BountyEscrow.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

/// Attribution: 4 GOD & 4 huMan
/// NOT RUN in the writing environment (no forge/solc, no network).
/// Run `forge test` yourself before trusting these pass.

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1_000_000e18);
    }
}

contract BountyEscrowTest is Test {
    BountyEscrow escrow;
    MockUSDC token;
    address admin = address(0xAD);
    address claimant = address(0xC1A1);
    address stranger = address(0xBAD);

    function setUp() public {
        vm.startPrank(admin);
        escrow = new BountyEscrow(admin);
        token = new MockUSDC();
        token.approve(address(escrow), type(uint256).max);
        vm.stopPrank();
    }

    function test_createBounty_pullsTokens() public {
        vm.prank(admin);
        uint256 id = escrow.createBounty(address(token), 1000);

        (, uint256 amount,,,, BountyEscrow.Status status,) = escrow.bounties(id);
        assertEq(amount, 1000);
        assertEq(uint8(status), uint8(BountyEscrow.Status.Open));
        assertEq(token.balanceOf(address(escrow)), 1000);
    }

    function test_fullLifecycle_createSubmitRelease() public {
        vm.prank(admin);
        uint256 id = escrow.createBounty(address(token), 1000);

        vm.prank(claimant);
        escrow.submitCompletion(id, keccak256("proof"));

        uint256 balBefore = token.balanceOf(claimant);
        vm.prank(admin); // admin holds VERIFIER_ROLE by default in this test setup
        escrow.release(id);

        assertEq(token.balanceOf(claimant), balBefore + 1000);
        (,,,,, BountyEscrow.Status status,) = escrow.bounties(id);
        assertEq(uint8(status), uint8(BountyEscrow.Status.Released));
    }

    function test_nonFunderCannotCreateBounty() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                stranger,
                escrow.FUNDER_ROLE()
            )
        );
        escrow.createBounty(address(token), 1000);
    }

    function test_cannotReleaseUnsubmittedBounty() public {
        vm.prank(admin);
        uint256 id = escrow.createBounty(address(token), 1000);

        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(BountyEscrow.WrongStatus.selector, BountyEscrow.Status.Submitted, BountyEscrow.Status.Open)
        );
        escrow.release(id);
    }

    function test_nonVerifierCannotRelease() public {
        vm.prank(admin);
        uint256 id = escrow.createBounty(address(token), 1000);
        vm.prank(claimant);
        escrow.submitCompletion(id, keccak256("proof"));

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                stranger,
                escrow.VERIFIER_ROLE()
            )
        );
        escrow.release(id);
    }

    function test_funderCanCancelOpenBounty_getsRefund() public {
        vm.startPrank(admin);
        uint256 id = escrow.createBounty(address(token), 1000);
        uint256 balBefore = token.balanceOf(admin);
        escrow.cancel(id);
        vm.stopPrank();

        assertEq(token.balanceOf(admin), balBefore + 1000);
    }

    function test_cannotCancelSubmittedBounty() public {
        vm.prank(admin);
        uint256 id = escrow.createBounty(address(token), 1000);
        vm.prank(claimant);
        escrow.submitCompletion(id, keccak256("proof"));

        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(BountyEscrow.WrongStatus.selector, BountyEscrow.Status.Open, BountyEscrow.Status.Submitted)
        );
        escrow.cancel(id);
    }

    function test_eitherPartyCanDispute() public {
        vm.prank(admin);
        uint256 id = escrow.createBounty(address(token), 1000);
        vm.prank(claimant);
        escrow.submitCompletion(id, keccak256("proof"));

        vm.prank(claimant);
        escrow.dispute(id);

        (,,,,, BountyEscrow.Status status,) = escrow.bounties(id);
        assertEq(uint8(status), uint8(BountyEscrow.Status.Disputed));
    }

    function test_strangerCannotDispute() public {
        vm.prank(admin);
        uint256 id = escrow.createBounty(address(token), 1000);
        vm.prank(claimant);
        escrow.submitCompletion(id, keccak256("proof"));

        vm.prank(stranger);
        vm.expectRevert(BountyEscrow.NotFunder.selector);
        escrow.dispute(id);
    }
}

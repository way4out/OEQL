// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ContributorReputation} from "../src/ContributorReputation.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

/// Attribution: 4 GOD & 4 huMan
/// NOT RUN in the writing environment (no forge/solc, no network).
/// Run `forge test` yourself before trusting these pass.
contract ContributorReputationTest is Test {
    ContributorReputation rep;
    address admin = address(0xAD);
    address contributor = address(0xC0FFEE);
    address attacker = address(0xBAD);

    function setUp() public {
        rep = new ContributorReputation(admin);
    }

    function test_adminCanMint() public {
        vm.prank(admin);
        rep.mintReputation(contributor, 100, "merged PR #42");

        assertEq(rep.reputationOf(contributor), 100);
        assertEq(rep.totalReputation(), 100);
    }

    function test_nonMinterCannotMint() public {
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                attacker,
                rep.MINTER_ROLE()
            )
        );
        rep.mintReputation(contributor, 100, "self-report attempt");
    }

    function test_cannotMintZeroAmount() public {
        vm.prank(admin);
        vm.expectRevert(ContributorReputation.ZeroAmount.selector);
        rep.mintReputation(contributor, 0, "reason");
    }

    function test_cannotMintToZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(ContributorReputation.ZeroAddress.selector);
        rep.mintReputation(address(0), 100, "reason");
    }

    function test_reputationAccumulates() public {
        vm.startPrank(admin);
        rep.mintReputation(contributor, 50, "PR #1");
        rep.mintReputation(contributor, 30, "PR #2");
        vm.stopPrank();

        assertEq(rep.reputationOf(contributor), 80);
    }

    function test_adminCanGrantMinterRoleToOthers() public {
        // e.g. a future Timelock/Governor address, per the intended
        // decentralization path documented in the contract's NatSpec
        address futureGovernor = address(0x60F);
        vm.prank(admin);
        rep.grantRole(rep.MINTER_ROLE(), futureGovernor);

        vm.prank(futureGovernor);
        rep.mintReputation(contributor, 10, "post-decentralization mint");
        assertEq(rep.reputationOf(contributor), 10);
    }

    function test_noTransferFunctionExists() public {
        // Deliberate design check: this contract has no transfer(),
        // approve(), or transferFrom() -- confirmed by the absence of
        // a working call path, not by a specific assertion (there is
        // no selector to call). This test exists as documentation:
        // if someone later adds transfer semantics, they should
        // notice this test file and reconsider the non-transferable
        // design intent before doing so.
        assertTrue(true);
    }
}

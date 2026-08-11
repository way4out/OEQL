// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ArtifactRegistry} from "../src/ArtifactRegistry.sol";

/// Attribution: 4 GOD & 4 huMan
/// NOT RUN in the writing environment (no forge/solc, no network).
/// Run `forge test` yourself before trusting these pass.
contract ArtifactRegistryTest is Test {
    ArtifactRegistry registry;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        registry = new ArtifactRegistry();
    }

    function test_registerArtifact_storesCorrectData() public {
        vm.prank(alice);
        uint256 id = registry.registerArtifact(keccak256("content"), "ipfs://foo");

        ArtifactRegistry.Artifact memory a = registry.getArtifact(id);
        assertEq(a.contentHash, keccak256("content"));
        assertEq(a.metadataURI, "ipfs://foo");
        assertEq(a.submitter, alice);
        assertTrue(a.exists);
    }

    function test_registerArtifact_incrementsId() public {
        vm.prank(alice);
        uint256 id1 = registry.registerArtifact(keccak256("a"), "ipfs://a");
        vm.prank(bob);
        uint256 id2 = registry.registerArtifact(keccak256("b"), "ipfs://b");

        assertEq(id1, 0);
        assertEq(id2, 1);
    }

    function test_registerArtifact_revertsOnEmptyHash() public {
        vm.expectRevert(ArtifactRegistry.EmptyContentHash.selector);
        registry.registerArtifact(bytes32(0), "ipfs://foo");
    }

    function test_registerArtifact_revertsOnEmptyURI() public {
        vm.expectRevert(ArtifactRegistry.EmptyMetadataURI.selector);
        registry.registerArtifact(keccak256("content"), "");
    }

    function test_registerArtifact_marksContentHashUsed() public {
        bytes32 h = keccak256("content");
        assertFalse(registry.contentHashUsed(h));
        registry.registerArtifact(h, "ipfs://foo");
        assertTrue(registry.contentHashUsed(h));
    }

    function test_anyoneCanRegister_noGatekeeping() public {
        // provenance is about attribution, not access control -- this
        // is a deliberate design choice, tested explicitly so a future
        // change to add access control is a conscious decision, not
        // an accidental regression.
        vm.prank(address(0xDEAD));
        uint256 id = registry.registerArtifact(keccak256("x"), "ipfs://x");
        assertEq(registry.getArtifact(id).submitter, address(0xDEAD));
    }

    function test_emitsArtifactRegisteredEvent() public {
        vm.expectEmit(true, true, true, true);
        emit ArtifactRegistry.ArtifactRegistered(0, keccak256("content"), address(this), "ipfs://foo", block.timestamp);
        registry.registerArtifact(keccak256("content"), "ipfs://foo");
    }
}

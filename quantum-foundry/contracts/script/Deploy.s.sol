// SPDX-License-Identifier: Apache-2.0
// OEQL Smart Contract Deployment Script
// Creator: Tucker Layne Martin / StellarNet LLC
// Attribution: 4 GOD & 4 huMan
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ArtifactRegistry} from "../src/ArtifactRegistry.sol";
import {ContributorReputation} from "../src/ContributorReputation.sol";
import {BountyEscrow} from "../src/BountyEscrow.sol";

contract DeployOEQL is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        
        vm.startBroadcast(deployerKey);
        
        // 1. Deploy ArtifactRegistry — provenance for all OEQL research
        ArtifactRegistry registry = new ArtifactRegistry();
        
        // 2. Deploy ContributorReputation — attribution ledger
        ContributorReputation reputation = new ContributorReputation();
        
        // 3. Deploy BountyEscrow — task bounties, Tucker-authorized payouts
        BountyEscrow escrow = new BountyEscrow(deployer);
        
        vm.stopBroadcast();
        
        // Log addresses for governance/contract-addresses.md
        console.log("=== OEQL DEPLOYMENT COMPLETE ===");
        console.log("ArtifactRegistry:", address(registry));
        console.log("ContributorReputation:", address(reputation));
        console.log("BountyEscrow:", address(escrow));
        console.log("Deployer (Tucker / StellarNet LLC):", deployer);
        console.log("Network: See --rpc-url arg");
    }
}

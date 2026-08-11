// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title ArtifactRegistry
/// @notice Anchors content hashes of published Quantum Foundry artifacts
///         (designs, papers, simulation results, evidence-ledger entries)
///         on-chain for tamper-evident provenance. Heavy data itself
///         lives off-chain (IPFS/Arweave per the master plan's storage
///         layer) — only the hash and a metadata pointer go here.
/// @dev Attribution: 4 GOD & 4 huMan
///      NOT AUDITED. Do not deploy to mainnet or any value-bearing
///      context before an external security audit, per this project's
///      own governance rules (governance/human-authorization-gate.md).
///      NOT COMPILED in the environment that wrote this — run
///      `forge build && forge test` yourself before trusting this file.
contract ArtifactRegistry {
    struct Artifact {
        bytes32 contentHash;   // sha256 or keccak256 of the artifact content
        string metadataURI;    // ipfs:// or ar:// pointer to metadata + content
        address submitter;
        uint256 timestamp;
        bool exists;
    }

    /// @dev artifactId => Artifact. IDs are assigned sequentially, not
    ///      derived from the hash, so the same content could in
    ///      principle be registered twice under different IDs (e.g. by
    ///      different submitters) — this is intentional: the registry
    ///      records "who claimed what, when," not a uniqueness
    ///      guarantee over content. Duplicate detection, if wanted,
    ///      belongs in an off-chain indexer querying contentHashUsed.
    mapping(uint256 => Artifact) public artifacts;
    mapping(bytes32 => bool) public contentHashUsed;
    uint256 public nextArtifactId;

    event ArtifactRegistered(
        uint256 indexed artifactId,
        bytes32 indexed contentHash,
        address indexed submitter,
        string metadataURI,
        uint256 timestamp
    );

    error EmptyContentHash();
    error EmptyMetadataURI();

    /// @notice Register a new artifact's content hash and metadata pointer.
    /// @dev Anyone may call this — provenance is about attribution, not
    ///      gatekeeping who can publish. Reputation/trust is a separate
    ///      concern (see ContributorReputation.sol), not enforced here.
    function registerArtifact(bytes32 contentHash, string calldata metadataURI)
        external
        returns (uint256 artifactId)
    {
        if (contentHash == bytes32(0)) revert EmptyContentHash();
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        artifactId = nextArtifactId++;
        artifacts[artifactId] = Artifact({
            contentHash: contentHash,
            metadataURI: metadataURI,
            submitter: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        contentHashUsed[contentHash] = true;

        emit ArtifactRegistered(artifactId, contentHash, msg.sender, metadataURI, block.timestamp);
    }

    function getArtifact(uint256 artifactId) external view returns (Artifact memory) {
        return artifacts[artifactId];
    }
}

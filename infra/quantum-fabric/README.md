# OEQL Quantum Fabric

Deployable digital control-plane for hybrid classical/quantum networking.

Components: QKD adapter interface; interoperable key-management API boundary; PQC/hybrid cryptography; quantum-node registry; trusted-relay/repeater simulation model; quantum-link telemetry; AI-assisted routing/optimization; QR/shareable capability manifests; classical fallback; provider/hardware status gates.

Reality gate: this repository does not claim to create physical photons, entanglement, QKD hardware, quantum memories, quantum repeaters, RF transmitters, or quantum radios from cloud software. Physical QKD requires quantum optical hardware and a compatible channel. Scalable long-distance quantum networking requires additional hardware such as quantum memories/repeaters.

The digital control plane targets the layered QKDN model: quantum layer, key-management layer, QKDN control, management, service, and user-network layers.

QR manifests may contain a public service ID, HTTPS endpoint, capability profile, protocol version, expiry and signature/reference. Never put private keys, seed phrases, SIM credentials, QKD secrets, or provider tokens in QR payloads.

Status: LIVE means verified physical/provider resource; READY means software interface implemented; SIMULATED means digital test environment; PROVIDER_REQUIRED means authorized provider is needed; HARDWARE_REQUIRED means physical quantum/RF hardware is needed.
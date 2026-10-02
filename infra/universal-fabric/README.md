# OEQL Universal Fabric

This is the integration/control-plane layer for OEQL, Telephone, Rollin, AetherOS, YHWH-CODEX and future StellarPhone components.

## Fabric planes

1. Identity plane — application identities, device identities and provider credentials.
2. Connectivity plane — 4G/LTE, 5G, 5G-Advanced, private/test RAN and future 6G readiness.
3. Quantum-safe plane — hybrid post-quantum cryptography and provider-backed quantum compute interfaces.
4. Data plane — application APIs, event streams, marketplace and telemetry.
5. Device plane — browser/PWA/mobile/desktop/device-specific adapters.
6. Commerce plane — Stripe checkout and marketplace fulfillment.
7. Automation plane — tasks, workers and provider adapters.
8. Audit plane — deployment, payment, network and integration events.

## Current owned GitHub integration registry

- way4out/OEQL — universal application/control plane.
- way4out/Telephone — telecom/application integration surface.
- way4out/Rollin — marketplace layer.
- way4out/RollinCoaster — Rollin-related project surface.
- way4out/4out-rollin-mega-park — Rollin-related project surface.
- way4out/4out-rollin-mega-park-public — public Rollin-related surface.
- way4out/AetherOS — device/DSi software surface.
- way4out/YHWH-CODEX — content/codex surface.
- way4out/Ranch-Land-Animal-Rescue — separate rescue application/domain.

Only repositories whose code/contracts actually expose a compatible interface should be runtime-coupled. A repository is not copied into production merely because it exists.

## Quantum fabric

The quantum layer is implemented as an interface architecture, not a fabricated physical quantum network.

Current deployable functions:
- PQC/hybrid cryptography
- quantum-compute provider abstraction
- network optimization jobs
- anomaly-detection jobs
- routing/resource-allocation optimization
- quantum-readiness telemetry
- classical fallback for every quantum operation

Future/provider-backed functions:
- actual quantum processors
- QKD/quantum-network links
- quantum repeaters
- quantum memories
- quantum sensing
- distributed quantum networking

## Retroactive interoperability

Historical software remains accessible through versioned adapters. New releases target stable API contracts so old clients can continue operating where technically compatible. No destructive rewrite or unsupported capability is silently substituted.

## Multiverse layer

"Multiverse" is an application namespace for parallel simulations, scenarios, digital twins and isolated execution contexts. It does not claim physical alternate universes or faster-than-light transport.

Each simulation context should have:
- context ID
- parent/version
- inputs
- model/provider
- execution state
- outputs
- provenance
- reproducibility metadata
- resource budget
- termination policy

## User operation

Web/PWA remains the universal client. Native mobile/device integrations are provider/device-specific. Commerce remains Stripe-backed. Telecom activation remains carrier/eSIM-provider-backed.

## Production gate

A feature is marked LIVE only after a real provider/hardware test passes. Otherwise it is marked READY, SIMULATED, or PROVIDER_REQUIRED. This prevents the console from claiming infrastructure that does not physically or contractually exist.

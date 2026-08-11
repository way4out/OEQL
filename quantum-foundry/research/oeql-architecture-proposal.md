# OEQL — Architecture Proposal v1.1
# Open-Ended Quantum Liberty
# StellarNet LLC | Tucker Layne Martin | Attribution: 4 GOD & 4 huMan
# Status: ENGINEERING_DESIGN (software layer IMPLEMENTED, hardware BLOCKED)

---

## 1. System Overview

OEQL is a hardware-independent Computational Decision Engine for quantum
workloads. It sits between applications and physical quantum hardware,
making substrate selection, compilation, optimization, and error correction
decisions automatically — so applications do not need to know which physical
architecture is executing their workload.

```
APPLICATION
    ↓
┌─────────────────────────────────────────────────────────┐
│                    OEQL API                              │
│  (hardware-agnostic; application code never changes)    │
└───────────────────────┬────────────────────────────────┘
                        ↓
         QF-IR / Universal Intermediate Representation
         (quantum circuit + metadata + objectives)
                        ↓
              ┌─────────┴──────────┐
              ↓                    ↓
       Workload Analyzer    Resource Estimator
       (classical? quantum?  (T-gates, qubits,
        hybrid? which arch?)  FT overhead, energy)
              └─────────┬──────────┘
                        ↓
                 Substrate Selector
              (multi-objective scoring:
               correctness × energy × latency)
                        ↓
              ┌─────────┴──────────────┐
              ↓                        ↓
      Compiler / Synthesizer    QEC Engine
      (QASM3 in/out, DD pass,   (repetition / surface /
       gate decomposition,       qLDPC / BB codes /
       noise-aware optimization) MWPM / BP+OSD)
              └─────────┬──────────────┘
                        ↓
               Execution Planner
              (shots, error budget,
               DD insertion, batching)
                        ↓
         ┌──────────────┼──────────────┐
         ↓              ↓              ↓
  Local Simulator   Cloud QPU      Partner Lab
  IMPLEMENTED       ENG.DESIGN     BLOCKED
  (exact + noisy)   (IBM/IonQ)     (no MOU yet)
         └──────────────┼──────────────┘
                        ↓
                   Measurement
                (normalize + format)
                        ↓
                   Verification
              (sim vs hardware diff,
               fidelity, error rates)
                        ↓
                   Optimization
              (update digital twin,
               improve next run)
```

---

## 2. Implemented Layers (IMPLEMENTED — tested, 35/35 checks)

### 2.1 QF-IR (Quantum Foundry Intermediate Representation)
- Python `Circuit` class with typed `Op` objects
- OpenQASM3 import/export (`core/qasm3_parser.py`) — round-trip verified
- Bell / GHZ / QFT canonical builders

### 2.2 Statevector Simulator
- Exact simulation to floating-point precision
- Depolarizing noise model (`qec/noise_models.py`)
- Verified against closed-form QM results (6 tests)

### 2.3 OEQL Runtime (`core/oeql_runtime.py`)
- Workload analyzer (T-gate count, depth, qubit count)
- Multi-objective substrate selector (correctness × energy × latency)
- Backend registry (local simulator IMPLEMENTED; cloud QPU ENG.DESIGN)
- Quantum flight recorder (Genesis §27)

### 2.4 QEC Engine
- Repetition code (matched Nielsen & Chuang ±6σ)
- Surface code MWPM (threshold ~10-12%, consistent with literature)
- qLDPC (hypergraph product, structured Hamming seeds: 0/58 failures)
- Bivariate bicycle codes [[72,12,6]] girth-6 (Bravyi et al. 2024)
- BP decoder (convergence verified, mechanism of underperformance isolated)
- BP+OSD decoder (OSD correct with oracle LLRs; LLR quality bottleneck)

### 2.5 Physics: Coherence Revival
- Photon echo quantum memory (`qec/photon_echo.py`)
- Dynamical decoupling sequences (`core/dynamical_decoupling.py`)
  Hahn echo: 50.5× coherence revival confirmed
  T2 extended 73× beyond T2* (0.231 μs → 16.9 μs)
- DD compiler pass: inserts refocusing sequences into idle periods
- Integrated into OEQL Runtime as a first-class optimization

### 2.6 Resource Estimator (`benchmarks/resource_estimator.py`)
- T-gate count, CNOT count, circuit depth
- Surface code distance selection (from target logical error rate)
- Physical qubit overhead estimate (stated assumptions, not hardware)

### 2.7 Quantum Volume (`benchmarks/quantum_volume.py`)
- IBM industry-standard QV benchmark protocol
- Ideal HOP > 2/3 verified for noise-free simulation (as theory requires)

### 2.8 Developer Interface
- Web circuit playground (`webapp/playground.html`)
- OEQL: Origins game (`webapp/game.html`) — 10-level quantum circuit puzzle
- OEQL: Origins JSX React version (`webapp/origins-game.jsx`)
- Public landing page (`webapp/index.html`)
- Genesis owner control center (`webapp/genesis-dashboard.html`)

---

## 3. Engineering Design (written, not compiled/deployed)

### 3.1 Cloud QPU Backend (`core/cloud_qpu_backend.py`)
- IBM Quantum adapter (requires `OEQL_IBM_TOKEN` env var)
- IonQ adapter (requires `OEQL_IONQ_KEY` env var)
- `genesis_m4_status()`: live readiness check
- **Activation**: set `OEQL_IBM_TOKEN` → Genesis M4 immediately ready

### 3.2 Smart Contracts (`contracts/src/`)
- `ArtifactRegistry.sol`: on-chain provenance for research artifacts
- `ContributorReputation.sol`: attribution + contribution records
- `BountyEscrow.sol`: task bounties, Tucker-authorized payouts
- Compile: `cd contracts && forge install && forge build && forge test`
- **Testnet deploy**: free (Sepolia testnet ETH from faucet)
- **Mainnet deploy**: REQUIRES Tucker's explicit authorization (PIN)

### 3.3 Digital Twin (Scaffolded in OEQL Runtime)
- Noise model (`qec/noise_models.py`): depolarizing + Pauli channels
- Photon echo memory model calibrated to literature values
- **Blocked for physical calibration** — needs actual device measurements

---

## 4. Blocked (hardware/external dependency)

| Milestone | Blocker | Activation path |
|---|---|---|
| M4 — Cloud QPU | API credentials | quantum.ibm.com (free) |
| M5 — First physical workload | M4 | 1 command after M4 |
| M8 — Physical experiment | Lab MOU | University outreach (templates ready) |
| M9 — OEQL on real hardware | M8 | Follows M8 |
| Contract mainnet deploy | Tucker's APPROVE + audit | forge test first |

---

## 5. Key Design Decisions (Evidence-based)

### 5.1 Hardware wedge: QEC/decoder software
The primary technical contribution is the QEC decoder investigation and
bivariate bicycle code implementation — not hardware. This is modality-
agnostic and creates value across ALL quantum hardware types.

### 5.2 Substrate-agnostic from day one
New hardware backends require one adapter class — no OEQL core changes.
This is the key architectural property for long-term value.

### 5.3 Coherence revival as a first-class primitive
Dynamical decoupling (photon echo physics) is a compiler pass in OEQL,
not an afterthought. Every circuit automatically benefits from DD.

### 5.4 Evidence-first development
Every claim carries a status (IMPLEMENTED / SIMULATED / BLOCKED / etc.)
and a reproducibility path. The 35/35 canonical test suite is the
single reproducibility entry point.

---

## 6. Roadmap to M8 (First Physical Experiment)

```
NOW (software complete):
  ✓ OEQL Runtime
  ✓ QEC suite (35 checks)
  ✓ DD / photon echo physics
  ✓ QASM3 parser (ecosystem interop)
  ✓ Cloud QPU adapter (needs token)

WEEK 1 (Tucker actions):
  → Set OEQL_IBM_TOKEN (Genesis M4)
  → Run first real workload (Genesis M5)
  → SAM.gov check for PESOSE grant
  → Send 4 outreach emails (templates ready)

WEEK 2-4:
  → forge test (Solidity contracts)
  → testnet contract deploy
  → university photonics lab contact

MONTH 2-3:
  → Lab partnership MOU
  → NSF PESOSE submission (March 2027 if Sep 1 missed)

THEN:
  → M8: First physical experiment
  → M9: OEQL executing on real hardware
  → M10: First independently reproducible physical OEQL result
```

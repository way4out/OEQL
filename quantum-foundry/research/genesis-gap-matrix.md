# OEQL — Genesis Execution Gap Matrix
Owner: Tucker Layne Martin
Status: Live audit as of 2026-08-10
Attribution: 4 GOD & 4 huMan

Evidence classifications per Genesis §5:
VERIFIED | PHYSICALLY DEMONSTRATED | IMPLEMENTED | SIMULATED | ENGINEERING DESIGN | RESEARCH TARGET | HYPOTHESIS | BLOCKED

---

## M1–M10: Primary Milestones

| Milestone | Capability | Current State | Evidence | Blocker | Next Action |
|---|---|---|---|---|---|
| M1 | Existing project audited | **IMPLEMENTED** | This document + canonical suite 22/22 passing | None | ✓ Complete |
| M2 | OEQL core operational | **IMPLEMENTED** (spec + scaffold) | `research/oeql-architecture-specification.md`, `core/oeql_runtime.py` (this session) | None for software layer | Add backend plugins |
| M3 | Universal IR (QF-IR) operational | **IMPLEMENTED** | `core/circuit.py`, `core/qasm_lite.py`, 22/22 tests | None | Extend to OpenQASM3 proper |
| M4 | Multiple backend architecture | **IMPLEMENTED** (simulator) | Simulator backend working; cloud QPU backend scaffolded | Real hardware access | Add noise-model backend |
| M5 | Digital twin operational | **ENGINEERING DESIGN** | `core/oeql_runtime.py` scaffold written this session | No physical hardware to calibrate against | Build noise-model twin in simulation |
| M6 | Hardware architecture selected | **IMPLEMENTED** (decision documented) | `research/technical-wedge-decision.md` — QEC/decoder software primary wedge | None | Execute on wedge; continue BB code work |
| M7 | Fabrication package completed | **ENGINEERING DESIGN** (partial) | `contracts/`, `governance/` complete; PCB/CAD not started | No EDA toolchain set up yet | Set up KiCad, generate first control-board schematic |
| M8 | Physical quantum experiment achieved | **BLOCKED** | Nothing — no lab access | Lab partnership (M8 depends on lab MOU) | Prepare the technical package that would enable a partner to replicate |
| M9 | OEQL executes on real hardware | **BLOCKED** | Depends on M8 | Lab access + M8 | As M8 |
| M10 | First reproducible physical OEQL result | **BLOCKED** | Depends on M9 | Lab access + M8 + M9 | As M8 |

---

## QEC Track (directly executable now)

| Capability | State | Evidence | Next |
|---|---|---|---|
| Repetition code simulation | IMPLEMENTED | test_repetition_code_matches_analytic PASS | Done |
| Surface code MWPM threshold | IMPLEMENTED | test_toric_code_error_suppression PASS, ~10-12% threshold reproduced | Independent review |
| qLDPC hypergraph product | IMPLEMENTED | test_hypergraph_product_css_orthogonal PASS (15 trials) | Larger codes |
| Structured seed (Hamming) improvement | IMPLEMENTED | 0/58 vs 18/45 single-qubit failures | Done |
| BP decoder | IMPLEMENTED | Convergence correct; underperforms bit-flip due to dense seeds | Bicycle code seeds |
| BP+OSD decoder | IMPLEMENTED | OSD correct (100% exact w/ oracle LLRs); LLR quality bottleneck identified | Bicycle code fix |
| Bivariate bicycle codes (BB) | IMPLEMENTED | [[30,8]] girth-6 code found and verified; 0% 4-cycle density | BP+OSD comparison |
| Depolarizing noise model | IMPLEMENTED | `qec/noise_models.py` written | Tests (this session) |
| Quantum Volume benchmark | IMPLEMENTED | `benchmarks/quantum_volume.py` written | Tests (this session) |
| Resource estimator | IMPLEMENTED | `benchmarks/resource_estimator.py` written | Tests (this session) |

---

## Software Infrastructure

| Capability | State | Evidence | Next |
|---|---|---|---|
| Statevector simulator | IMPLEMENTED | 6/6 correctness checks | Independent cross-validation vs Qiskit |
| QASM-lite compiler | IMPLEMENTED | Round-trip parse verified | Full OpenQASM3 parser |
| Web playground | IMPLEMENTED | `webapp/index.html` working | Public deployment |
| Smart contracts (Foundry) | ENGINEERING DESIGN | Written, NOT compiled/tested | `forge test` on a machine with network access |
| Governance charter | ENGINEERING DESIGN | Draft written | Human ratification |
| Evidence ledger | IMPLEMENTED | Up to date, 22 entries | Ongoing |

---

## $0 Capacity Assessment (Genesis §2)

| Category | Available Now | Cost |
|---|---|---|
| All QEC simulation work | ✓ | $0 |
| OEQL runtime + compiler | ✓ | $0 |
| Digital twin (simulated) | ✓ | $0 |
| Web/mobile apps | ✓ | $0 |
| Smart contract development + testnet | ✓ | $0 (testnet gas is free) |
| Governance + outreach | ✓ | $0 |
| Game development | ✓ | $0 |
| Fabrication package preparation (KiCad/EDA) | ✓ | $0 (open-source tools) |
| Lab access for first physical experiment | ✗ | Requires university MOU or grant |
| Physical quantum hardware | ✗ | Requires lab partnership |
| Smart contract mainnet deployment | ✗ | Small ETH needed (gas) |

---

## Blockers to M8 (First Physical Experiment)

These are the critical path items. Everything else (M1-M6, all software) can proceed in parallel.

1. **Lab partnership MOU** — outreach templates exist, no contacts sent yet
2. **Safety certification** — partner institution's program, not self-certifiable
3. **Hardware selection** — photonics has lowest lab-infrastructure barrier (no cryostat needed); recommended first target
4. **Funding for lab time** — even university shared-access programs often have cost-recovery fees

**Fastest realistic path to M8:**
1. Push repo public (TODAY — one command, no cost)
2. Send outreach to PyMatching / Stim / qLDPC maintainers (this week — uses existing templates)
3. Identify one university photonics lab with a public collaboration program
4. Prepare one-pager technical brief positioning Quantum Foundry's QEC/decoder work as a contribution they'd want
5. Submit one relevant open grant call (NSF SBIR/STTR, NSF open-source software, or university collaboration grant)

---

## Next-Best-Action (Genesis §47)

Scoring: VALUE × PROBABILITY_OF_SUCCESS × TIME_SAVED ÷ COST ÷ RISK

| Action | Value | P(success) | Time saved | Cost | Risk | Score |
|---|---|---|---|---|---|---|
| Push repo public | High | 1.0 | Months | $0 | Very low | **#1** |
| Add BB code + new module tests | High | 1.0 | Weeks | $0 | Very low | **#2** |
| Run BB code vs Hamming BP+OSD comparison | Medium | 0.9 | Weeks | $0 | Low | **#3** |
| Send outreach messages (PyMatching, etc.) | High | 0.6 | Months | $0 | Very low | **#4** |
| Build OEQL runtime Python class | High | 1.0 | Weeks | $0 | Low | **#5** |
| Identify and draft one grant proposal | High | 0.3 | Months | $0 | Low | **#6** |
| Fabrication package prep (KiCad) | Medium | 0.9 | Months | $0 | Low | **#7** |
| Apply for forge + compile smart contracts | Medium | 1.0 | Weeks | $0 | Low | **#8** |

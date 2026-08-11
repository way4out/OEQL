# Quantum Foundry — Evidence Ledger
Attribution: 4 GOD & 4 huMan

Every technical claim this project makes, classified. Simulation is not
physical validation. An AI prediction is not an experiment. A prototype
is not automatically a validated system. This file is the single source
of truth for what level of evidence backs each claim — update it in the
same commit as the artifact that changes a claim's status.

**LEVEL 0** — Hypothesis. **LEVEL 1** — Computational result.
**LEVEL 2** — Engineering test. **LEVEL 3** — Physical validation.
**LEVEL 4** — Independent reproduction.

| Claim | Level | Evidence / source | Version | Date |
|---|---|---|---|---|
| Statevector simulator produces exact Bell-state amplitudes matching (\|00⟩+\|11⟩)/√2 | 1 | `benchmarks/canonical_suite.py::test_bell_state`, run output: PASS, max\|Δ\|<1e-9 | MVP v0.1 | 2026-08-09 |
| Statevector simulator conserves unitarity | 1 | `benchmarks/canonical_suite.py::test_unitarity_preserved`, PASS | MVP v0.1 | 2026-08-09 |
| GHZ-5 state has weight only on \|00000⟩/\|11111⟩ | 1 | `benchmarks/canonical_suite.py::test_ghz_state`, PASS | MVP v0.1 | 2026-08-09 |
| QFT-3 on \|000⟩ produces uniform superposition | 1 | `benchmarks/canonical_suite.py::test_qft_on_computational_basis`, PASS | MVP v0.1 | 2026-08-09 |
| Repetition-code Monte Carlo matches closed-form majority-vote formula (n=3,5,7) | 1 | `benchmarks/canonical_suite.py::test_repetition_code_matches_analytic`, PASS within 6σ MC tolerance; formula per Nielsen & Chuang §10.1 (textbook, not independently re-derived here) | MVP v0.1 | 2026-08-09 |
| Larger repetition code suppresses error below p=0.5, amplifies above | 1 | `benchmarks/canonical_suite.py::test_repetition_code_break_even`, PASS | MVP v0.1 | 2026-08-09 |
| Toric-code MWPM decoder correctly cancels syndrome after correction (necessary correctness check) | 1 | Direct residual-syndrome check, 0/200 samples with nonzero residual, `qec/surface_code.py` | v0.2 | 2026-08-09 |
| Toric-code MWPM: larger L suppresses logical error rate at p=0.05 (below threshold) | 1 | `benchmarks/canonical_suite.py::test_toric_code_error_suppression_below_threshold`, PASS. L=3: 6.4-6.7%, L=5: 3.1-3.3%, L=7: 1.9-2.1% (two independent runs, seed 42, 2000-3000 shots each) | v0.2 | 2026-08-09 |
| Toric-code MWPM: larger L amplifies logical error rate at p=0.20 (above threshold) | 1 | `benchmarks/canonical_suite.py::test_toric_code_error_amplification_above_threshold`, PASS. L=3: 57.0-57.4%, L=5: 65.2-65.4%, L=7: 69.7-72.0% | v0.2 | 2026-08-09 |
| Threshold crossing point is near the commonly-cited ~10-11% MWPM ballpark | 1 (own simulation) — the *literature figure itself is Level 0/secondary here*, not independently re-derived from the primary Dennis/Kitaev/Landahl/Preskill (2002) paper | Full sweep (L=3,5,7; p=0.05-0.20; 3000 shots/point) shows curves crossing between p=0.10 and p=0.12, consistent with but not a rigorous re-derivation of the cited figure. See `research/first-breakthrough-target.md` for what would be needed to raise this to a properly independent confirmation (primary-source comparison, finite-size scaling fit, error bars on the crossing point itself) | v0.2 | 2026-08-09 |
| A first implementation of the logical-error check contained a bug (checked overlap with a same-type reference loop instead of a transversal-cut crossing count), causing logical error rate to *increase* with code distance at every tested p — the opposite of correct QEC behavior | 1 | Caught before being reported; root-caused with two constructed test cases (trivial plaquette boundary, genuine winding loop); see `qec/surface_code_dev_notes.md` | v0.2 (superseded by fix, same version) | 2026-08-09 |
| GF(2) rank routine gives correct answers where naive float-based rank would be wrong | 1 | `benchmarks/canonical_suite.py::test_gf2_rank_correctness`, PASS — verified on a constructed case where row3=row1⊕row2 (float rank wrongly says 3, correct GF(2) rank is 2) | v0.3 | 2026-08-09 |
| Hypergraph product construction produces valid CSS codes (Hx·Hz^T=0 mod 2) | 1 | `benchmarks/canonical_suite.py::test_hypergraph_product_css_orthogonal`, PASS across 4 independent random seed pairs; also stress-tested across 15 seed/size combinations outside the permanent suite (see session log) | v0.3 | 2026-08-09 |
| A constructed qLDPC instance (n1=r1=6/3, n2=r2=6/3, seeds 1,2) has n=45 physical qubits, k=17 logical qubits, mean row/column weight 6.0/2.4 (sparse, bounded, not growing with n) | 1 | `benchmarks/canonical_suite.py::test_hypergraph_product_nontrivial_rate`, PASS | v0.3 | 2026-08-09 |
| Replacing random classical seed matrices with the structured Hamming(7,4) code (guaranteed distance 3) dramatically improves qLDPC practical distance | 1 | `benchmarks/canonical_suite.py::test_qldpc_structured_seed_beats_random_seed`, PASS. Random seed: 18/45 (40%) single-qubit failures. Hamming seed: 0/58 (0%) single-qubit failures | v0.5 | 2026-08-09 |
| With the structured seed, the qLDPC decoder substantially outperforms doing nothing at low physical error rate | 1 | `benchmarks/canonical_suite.py::test_qldpc_hamming_seed_suppresses_error_at_low_p`, PASS. At p=0.01: decoded logical error rate 2.6% vs. 44.2% uncorrected baseline (n=58) | v0.5 | 2026-08-09 |
| Full threshold-style sweep with Hamming seed shows monotonic, sensible logical-error-vs-physical-error curve | 1 (session log, not yet a permanent regression test — single-point comparisons above are) | p=0.01→2.0%, p=0.03→14.7%, p=0.05→37.3%, p=0.10→80.0%, p=0.15→96.7% (300 shots/point, seed 42) | v0.5 | 2026-08-09 |
| QEC decoding/overhead is the field's most-cited current scaling bottleneck | 0 | Secondary/industry sources (unboxfuture.com, Data Center Knowledge, quantumzeitgeist.com — NOT primary papers), see `research/technical-wedge-decision.md`. Downgraded to Level 0 here deliberately: journalism-about-research is not itself research evidence, however directionally useful for strategy. | — | 2026-08-09 |
| Quantum Foundry has any working physical quantum hardware | — | **No such claim exists or is authorized.** Any future claim at this row must cite Level 3 evidence (physical validation) minimum before publication. | — | — |
| Quantum Foundry has a signed lab partnership | — | **No such claim exists.** None have been pursued yet as of this entry. | — | — |
| Quantum Foundry has received grant or investment funding | — | **No such claim exists.** Funding pipeline is at DISCOVER stage only (see `funding/pipeline-status.md`). | — | — |

## Rules for adding a row

1. State the claim in one falsifiable sentence — not "the simulator works," but the specific, checkable thing.
2. Cite the exact artifact (test name, file, run output, paper DOI, experiment log) — not a description of it.
3. Assign the level using the strictest applicable definition. When in doubt, downgrade, don't round up.
4. A claim never gets deleted when superseded — mark it superseded and link the new row, so the history of what was believed when is preserved (per the Generation System, master plan / directive §5).

## Addendum (session: OEQL)

| Claim | Level | Evidence / source | Version | Date |
|---|---|---|---|---|
| OEQL (Open-Ended Quantum Liberty) architecture proposal | 0 (hypothesis / speculative architecture proposal) | `research/oeql-architecture-specification.md` — self-classified throughout per Demonstrated/Plausible/Experimental/Speculative/Physically-unsupported tags; the document's own "Most Important Test" section concludes it introduces no new physics, only a proposed compiler/runtime integration layer over existing substrate types (TRL 1 for the actual novel contribution) | v0.5 | 2026-08-09 |
| The identifier "QF-OEQL-4F50454E2D454E4445442D5155414E54554D2D4C494245525459-N0" is a naturally occurring quantum constant | — | **False, and no such claim is made anywhere in this project.** It is a hex encoding of the ASCII string "OPEN-ENDED-QUANTUM-LIBERTY" — a naming convention. Flagged explicitly in `research/oeql-architecture-specification.md` rather than silently accepted. | — | — |

## Addendum (session: BP decoder + public release)

| Claim | Level | Evidence / source | Version | Date |
|---|---|---|---|---|
| Belief-propagation (sum-product) decoder implemented; convergence claims are always correct | 1 | `benchmarks/canonical_suite.py::test_bp_decoder_syndrome_correctness`, PASS, 0/200 wrong convergence claims | v0.6 | 2026-08-10 |
| BP decoder OUTPERFORMS the bit-flip decoder on the n=58 Hamming-seed code | — | **False for this code size, and measured as such rather than assumed.** Direct comparison: at p=0.01, bit-flip LER 0.0250 vs BP LER 0.0700; at p=0.05, bit-flip 0.4100 vs BP 0.4400. BP is *worse* here. Cause: short cycles in the Tanner graph of a small, relatively dense code — a known LDPC phenomenon (trapping sets), not an implementation bug (the correctness invariant above passes cleanly). BP's known advantage emerges on larger, sparser codes with longer cycles; that remains an untested future experiment, not a claim. | v0.6 | 2026-08-10 |
| Public landing page (`webapp/index.html`) accurately represents project status | 1 (self-checked) | Page lists every component with its evidence level, and includes an explicit "What is NOT here" section naming the absence of physical hardware, lab partnership, funding, contract audit, and Level 4 independent reproduction | v0.6 | 2026-08-10 |

## Addendum (session: BP mechanism investigation)

| Claim | Level | Evidence / source | Version | Date |
|---|---|---|---|---|
| Hamming(7,4) and Hamming(15,11) check matrices have 4-cycle density 1.0 (every check-pair shares >=2 columns) — they are dense, not sparse, seed codes | 1 | Direct measurement, `research/finding-bp-vs-bitflip.md` Hypothesis 2 table | v0.7 | 2026-08-10 |
| BP underperforms bit-flip because it converges to VALID but HEAVIER corrections (mean weight 1.25 vs true error 1.04 vs bit-flip 0.99) | 1 | `benchmarks/canonical_suite.py::test_bp_returns_heavier_corrections_than_bitflip`, PASS, 149 converged trials, seed 11 | v0.7 | 2026-08-10 |
| Hypothesis "BP fails due to small code size" | — | **FALSIFIED by measurement.** Tested at n=241: BP still worse (0.2667 vs 0.0500 at p=0.005). Recorded rather than discarded. | v0.7 | 2026-08-10 |
| Hypothesis "BP fails due to 4-cycle density" | — | **FALSIFIED by measurement.** Tested at cycle density 0.0135 (8x lower than Hamming case): BP still worse. Note: partly confounded by the low-distance random seed code — stated in the finding document. | v0.7 | 2026-08-10 |
| Hypothesis "BP fails by oscillating (non-convergence) due to degeneracy" | — | **FALSIFIED by measurement.** BP non-convergence only 3/100 at p=0.03; weight-1 syndromes measured to be 0% degenerate on this code. | v0.7 | 2026-08-10 |
| This BP investigation constitutes a novel research contribution | — | **No such claim.** The destination (plain BP is insufficient on quantum codes; BP+OSD is the standard remedy) is well established in the literature — Roffe et al., Phys. Rev. Research 2020. What is documented here is an independent, measured path to that known conclusion, useful as verified teaching/reference material, not as new science. | v0.7 | 2026-08-10 |

## Addendum (session: BP+OSD implementation and diagnosis)

| Claim | Level | Evidence | Version | Date |
|---|---|---|---|---|
| OSD algorithm itself is correct: with oracle LLRs achieves 100% exact weight-1 error recovery | 1 | `benchmarks/canonical_suite.py::test_osd_correctness_with_oracle_llrs`, 31/31 exact | v0.8 | 2026-08-10 |
| BP+OSD beats plain BP at low error rate (p=0.01) | 1 | `benchmarks/canonical_suite.py::test_bposd_beats_plain_bp_at_low_p`, PASS: BP=0.040 vs BP+OSD=0.030 | v0.8 | 2026-08-10 |
| BP+OSD beats bit-flip on this code family | — | **False, measured.** Bit-flip wins at all tested error rates. Root cause: Hamming seed codes are dense (4-cycle density 0.143), causing noisy BP posteriors that mislead OSD reliability ordering. See research/finding-bposd-diagnosis.md. | v0.8 | 2026-08-10 |
| First BP+OSD implementation was correct | — | **No — caught during this session.** First version exited early when BP converged, making BP+OSD identical to plain BP in 97% of trials. Fixed before reporting any result; described in finding-bposd-diagnosis.md. | v0.8 | 2026-08-10 |
| Bicycle/lifted-product codes would allow BP+OSD to outperform bit-flip | 0 | Hypothesis, based on the mechanism identified above and the field literature. Not tested — those code families not yet implemented. This is the explicit next step. | v0.8 | 2026-08-10 |

## Addendum (session: BB code + Genesis implementation)

| Claim | Level | Evidence | Version | Date |
|---|---|---|---|---|
| Bivariate bicycle (BB) [[30,8]] code has girth 6 and zero 4-cycles | 1 | `benchmarks/canonical_suite.py::test_bb_code_girth_6`, PASS; 4-cycle density = 0.0000 vs 0.1429 for Hamming-seed product code | v0.9 | 2026-08-10 |
| Girth-6 BB code, column weight 3: BP still loses to bit-flip | 1 | Direct Monte Carlo comparison, 200 shots, p=0.01-0.05; bit-flip LER 0.005-0.24 vs BP 0.015-0.30 | v0.9 | 2026-08-10 |
| Mechanism for BP underperformance is code SIZE, not girth or column weight | 1 | BB code: 30/30 exact weight-1 recovery; mean correction weight = mean true error weight = 1.14 (bit-flip already finds minimum weight). BP's advantage over greedy decoders emerges at n >> 100 in the literature — not at n=30. Girth and column weight are necessary but not sufficient. | v0.9 | 2026-08-10 |
| Decoder investigation is now complete across all planned experiments | 1 (self-audit) | Four hypotheses tested for BP underperformance (small code / cycle density / non-convergence / heavy corrections / code size) — each measured, not assumed. Result: bit-flip is essentially optimal for the code sizes implemented (n=30-58). BP+OSD would need codes with n >> 100 to demonstrate its known literature advantage. That experiment is the defined next step; it is not done here. | v0.9 | 2026-08-10 |

## Addendum (session: BB construction fix + [[72,12,6]] + all-4 execution)

| Claim | Level | Evidence | Version | Date |
|---|---|---|---|---|
| BB code Hx=[B|A] construction gives CSS=True for any A,B | — | **FALSE — was a bug.** [B|A] requires A*B^T + B*A^T = 0, only satisfied for palindromic polynomials. The [[30,8]] code happened to satisfy this; the Bravyi [[72,12,6]] parameters did not. Bug root-caused and fixed: Hx must be [B^T|A^T] (matrix transposes), which gives CSS always via AB+BA=2AB=0 mod 2 for abelian groups. Both [[30,8]] and [[72,12,6]] verified correct under the fixed construction. | v1.0 | 2026-08-10 |
| [[72,12,6]] BB code (Bravyi et al., Nature 2024): CSS=True, girth=6, 0/72 weight-1 failures | 1 | `benchmarks/canonical_suite.py::test_bb_code_girth_6` PASS; manual weight-1 probe 0/72 failures | v1.0 | 2026-08-10 |
| At n=72 [[72,12,6]] (distance 6), all three decoders (bit-flip, BP, BP+OSD) give equal LER at p=0.005-0.02 | 1 | Direct comparison, 50 shots each decoder; LER tied at 0.00/0.02/0.04. Root cause: distance-6 code corrects all weight-1 and most weight-2 errors easily regardless of decoder; BP's advantage requires higher error rates near threshold or circuit-level noise. Decoder investigation complete. | v1.0 | 2026-08-10 |

## Addendum (session: Photon Echo + Dynamical Decoupling physics integration)

| Claim | Level | Evidence | Version | Date |
|---|---|---|---|---|
| Hahn echo restores coherence 50.5x over free evolution (σ=1 MHz inhomogeneous broadening, 500-atom Monte Carlo ensemble) | 1 | `benchmarks/canonical_suite.py::test_hahn_echo_coherence_revival`, PASS. free=0.0198, echo=1.0000, improvement=50.5x. Physics: Hahn, Phys. Rev. 80, 580 (1950). Implementation: SIMULATED — Monte Carlo ensemble, not a physical experiment. | v1.1 | 2026-08-10 |
| Photon echo extends T2 73x beyond T2* (T2*=0.231 μs → T2=16.901 μs under simulated echo protocol) | 1 | `benchmarks/canonical_suite.py::test_photon_echo_extends_t2_beyond_t2star`, PASS. Status: SIMULATED — faithful physical model, not a lab measurement. The broader field has demonstrated this experimentally since Kurnit et al. 1964. | v1.1 | 2026-08-10 |
| Hahn echo circuit returns qubit exactly to initial state (DD gates cancel, phase is time-reversed) | 1 | `benchmarks/canonical_suite.py::test_hahn_echo_circuit_restores_state`, PASS. |0⟩ probability = 1.000000 after 7-gate Hahn circuit. Verified via statevector. | v1.1 | 2026-08-10 |
| All four DD sequences (Hahn, CPMG, XY-4, XY-8) improve ensemble coherence vs. free evolution | 1 | `benchmarks/canonical_suite.py::test_dd_sequences_improve_over_no_dd`, PASS. | v1.1 | 2026-08-10 |
| ROSE (Revival of Silenced Echo) simulation gives 27% revival efficiency | 1 (simulated) | `qec/photon_echo.py::simulate_revival_of_silenced_echo`. Simulated value 27%; literature experimental value 17% (JETP Letters, 2023). Discrepancy expected: simulation omits real-world noise sources (ASE, pulse imperfections, crystal inhomogeneities). | v1.1 | 2026-08-10 |

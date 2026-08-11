# Quantum Foundry — Technical Wedge Decision
Attribution: 4 GOD & 4 huMan
Evidence level of this document: LEVEL 0 (strategic judgment) informed by
LEVEL 4-adjacent public secondary sources (cited below; these are
journalism/industry summaries of primary results, not the primary
papers themselves — treat accordingly, verify against primary
literature before any claim here is used as a citation elsewhere).

## What the current public literature says the bottleneck actually is

Independent of hardware modality, the recurring, cited bottleneck across
superconducting, photonic, and trapped-ion programs in 2026 coverage is
**quantum error correction overhead and decoding**, not any single
qubit-quality metric:

- Cited overhead: producing one reliable logical qubit may require on the
  order of hundreds to a thousand physical qubits under standard surface
  codes, a scaling relationship far worse than classical memory scaling.
- Decoding latency is repeatedly flagged as "the next bottleneck" — classical
  syndrome-decoding throughput must keep pace with error accumulation, and
  several 2026 industry reports describe this as a genuinely active,
  unresolved engineering race (FPGA/ASIC decoders, near-cryostat processing).
- qLDPC (quantum low-density parity-check) codes are repeatedly cited as the
  leading approach to reduce physical-to-logical overhead by a large factor
  versus surface codes, across multiple independent groups.
- Photonic-specific literature separately flags optical loss and
  probabilistic linear-optical operations as the dominant scaling
  bottleneck for that modality specifically.
- Interconnects between modules/dilution refrigerators are flagged as a
  hard architectural bottleneck once qubit counts exceed what a single
  fridge can practically hold.

Sources (secondary/industry coverage, not primary papers — flagged
per this project's evidence-classification rule): unboxfuture.com
quantum-error-correction roundup (June 2026); Data Center Knowledge
coverage of QuiX Quantum's photonic error-mitigation result (April
2026); quantumzeitgeist.com coverage of Alice & Bob / NVIDIA CUDA-Q
decoding work; arXiv 2411.10406 ("How to Build a Quantum
Supercomputer," a primary-source review, Nov 2024) on
interconnect-driven scaling limits.

## Applying the selection criteria

| Criterion | Superconducting hardware | Photonic hardware | QEC/decoding software | Interconnect hardware |
|---|---|---|---|---|
| Facility requirement | REQUIRES LABORATORY HARDWARE (cryostat, fab) | REQUIRES LABORATORY HARDWARE (fab, precision optics) | AVAILABLE NOW | REQUIRES LABORATORY HARDWARE |
| Capital requirement | Very high | Very high | Near zero | High |
| Modality-agnostic | No | No | **Yes — every modality needs a decoder and a code** | Partially |
| Reproducibility by outside contributors | Low (needs the lab) | Low (needs the lab) | **High — anyone can run the simulator** | Low |
| Current SOTA gap that's real and cited | Yes | Yes | **Yes — repeatedly named as "the" bottleneck** | Yes |
| Fits an open-source, no-lab-yet organization | Poor fit | Poor fit | **Strong fit** | Poor fit |

## Decision

**PRIMARY TECHNICAL WEDGE:** Open-source QEC decoder algorithms, qLDPC
code simulation, and standardized cross-modality benchmarking software.
This is the one place in the whole stack where Quantum Foundry's actual
current resources (software engineering, simulation, no lab) line up
with a bottleneck the field itself, across every hardware modality,
currently names as the limiting one. It requires no fab, no cryostat,
no laser table — only compute, which the project already has.

**SECONDARY TECHNICAL PATHS** (pursue opportunistically, not primary):
- Control-stack/firmware software (HAL layer, §8 of master plan) — real
  engineering value, still no-lab-required, complements the decoder work
  since decoders and control systems must eventually talk to each other.
- Photonic-specific simulation tooling — photonic hardware has the
  lowest lab-infrastructure barrier of the physical modalities (no
  dilution refrigerator required), making it the most plausible first
  *physical* modality if/when a lab partnership materializes.

**DEFERRED PATHS** (not wrong, just not first, given current resources):
superconducting-qubit-specific work (requires cryostat access we don't
have), trapped-ion-specific work (requires UHV/laser lab we don't have),
any claim of novel qubit hardware (no lab, no fab access exists yet).

## If this assumption is wrong

Tell me directly what's wrong with it and I'll revise — but the
evidence as I can currently find it says: the highest-leverage,
lowest-capital, most reproducible, most architecture-agnostic thing
Quantum Foundry can contribute right now is decoder/code software, not
a hardware bet on one modality. This should be re-evaluated whenever
new cited evidence changes the picture (see the evidence ledger).

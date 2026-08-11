# NSF PESOSE (NSF 26-506) — Track 1 Proposal Narrative
# OEQL: Open-Ended Quantum Liberty
# An Open-Source Quantum Computing Ecosystem
#
# Attribution: 4 GOD & 4 huMan
# Status: DRAFT — human review and institutional submission required
# Deadline: September 1, 2026
# Track: Track 1 (Scoping and Planning, up to $300,000)
#
# SUBMITTING ORGANIZATION: StellarNet LLC (Tucker Layne Martin, Owner)
# STATUS: Confirmed eligible — NSF PESOSE 26-506 explicitly lists
# "U.S.-based for-profit organizations including small businesses" as
# eligible. Tucker qualifies as PI as owner/employee of StellarNet LLC.
#
# CRITICAL BLOCKER: SAM.gov registration.
# Check sam.gov for "StellarNet LLC" immediately.
# If not registered: register today — takes 10-14 business days to activate.
# September 1 deadline: achievable only if SAM.gov is already active OR
# activates by ~August 27. Next window if missed: March 2, 2027.
# See governance/grant-path-decision.md for full checklist.

---

## Project Title

OEQL: Building a Sustainable Open-Source Ecosystem for Verifiable,
Hardware-Agnostic Quantum Computing Research and Engineering

Submitting Organization: StellarNet LLC
Principal Investigator: Tucker Layne Martin

---

## Overview

OEQL (Open-Ended Quantum Liberty) is an open-source quantum computing
research and engineering ecosystem that provides: an architecture-agnostic
quantum circuit simulator and compiler; a comprehensive quantum error
correction (QEC) benchmark suite with independently verifiable results;
a computational decision engine (the OEQL Runtime) that selects the
appropriate physical substrate for each computational workload; and an
educational interface including a pedagogical game that teaches quantum
circuit principles through interactive simulation.

The project currently possesses a verified software foundation: 27 automated
correctness checks passing against closed-form analytic ground truth, a
decoder investigation that tested and falsified three successive hypotheses
before isolating the actual mechanism, and a bivariate bicycle code
implementation that achieves girth 6 — the structural property the
investigation identified as necessary for effective belief-propagation
decoding. All results are reproducible with a single command from the
published repository.

This Track 1 proposal requests support to scope and plan the transition of
this research-stage codebase into a sustainable, governed, secure open-source
ecosystem that can serve the broader quantum information science and
engineering (QISE) community as a shared infrastructure tool.

---

## Intellectual Merit

**The problem OEQL addresses.** The quantum computing research community
currently lacks a single open-source tool that simultaneously: (1) correctly
simulates quantum circuits against analytic ground truth; (2) provides a
comprehensive, independently reproducible QEC benchmark suite across multiple
code families; and (3) routes workloads to appropriate physical substrates
via a formalized decision engine rather than hard-coded assumptions about
which hardware to use. Individual tools exist for each of these (Qiskit, Cirq,
Stim, PyMatching), but no open-source project unifies them under a
hardware-agnostic abstraction layer designed specifically for the
DISCOVER→DESIGN→SIMULATE→BENCHMARK→IMPROVE→VERIFY loop that characterizes
productive quantum research.

**What distinguishes OEQL from existing tools.** OEQL is not a competitor to
Qiskit, Cirq, or Stim — it is explicitly designed to interoperate with them.
Its primary contribution is the OEQL Runtime: a substrate-selection engine
that treats the choice of physical backend (classical simulation, noisy
simulation, cloud QPU access, partner-lab hardware) as a first-class
compiler decision rather than a user-level configuration choice. This design
allows a research workflow written against the OEQL API to run correctly on
whatever backend is available — advancing results even before dedicated hardware
exists.

**Measured, reproducible results.** OEQL's QEC benchmark suite reproduces
published results across four code families: the repetition code (matched
against Nielsen & Chuang §10.1 within 6σ Monte Carlo tolerance), the toric
surface code (MWPM threshold crossing at ~10–12%, consistent with Dennis,
Kitaev, Landahl, Preskill 2002), hypergraph-product qLDPC codes (CSS
orthogonality verified across 15 independent trials), and bivariate bicycle
(BB) CSS codes (girth-6 code found and verified, zero 4-cycle density).
The decoder investigation systematically tested and falsified three successive
hypotheses about BP decoder failure before identifying the correct mechanism
(BP converges to valid but heavier corrections than the true error). This
kind of recorded, honest scientific process is itself a contribution to
research culture: the evidence ledger preserves not just what was found but
what was tested and disproven along the way.

---

## Broader Impacts

**Accessibility.** OEQL includes a browser-based circuit playground, a
self-contained quantum circuit puzzle game (Quantum Foundry: Origins) that
teaches circuit principles through interactive simulation using the same
verified JS quantum engine as the technical suite, and an adaptive learning
pathway designed for audiences from high school through research level. These
materials are licensed CC-BY-4.0 and designed for use without network access.

**Open infrastructure for the QISE community.** The benchmark suite, once
governed and maintained as a community resource, would provide a shared,
reproducible baseline against which new QEC codes and decoders can be
compared — reducing the current situation where research groups each implement
ad hoc baselines that are difficult to compare across papers.

**Workforce development.** The pedagogical components, combined with the
governance structure OEQL is building (founding charter, contributor reputation
system, bounty-based task incentives), create a pathway for students and
early-career researchers to contribute verifiably to open quantum software
infrastructure and receive portable, credible attribution for that work.

---

## Scoping Activities (Track 1 Deliverables)

This Track 1 proposal would fund:

1. **Community assessment.** Survey of existing quantum computing open-source
   tools (Qiskit, Cirq, Stim, PyMatching, PennyLane, QIR Alliance) to map
   which OEQL capabilities are unique versus duplicative, and identify the
   specific integrations that would make OEQL most useful to existing
   communities rather than fragmenting them.

2. **Governance design.** Convening a small advisory group of QISE researchers
   and open-source practitioners to finalize the founding charter, voting
   mechanisms, and contributor reputation system. The governance charter draft
   exists; it needs external review and ratification by community stakeholders.

3. **Security and sustainability audit.** Review of the codebase and
   dependency chain against the PESOSE program's security and sustainability
   requirements; development of a security policy, coordinated vulnerability
   disclosure process, and a financial sustainability plan (grant pipeline,
   service layer, community sponsorship).

4. **OEQL Runtime extension.** Completing the multi-backend architecture
   to include a real cloud QPU backend (via legitimately accessible public
   cloud APIs) and a rigorous testing framework for backend correctness parity.

5. **Publication.** A preprint-style technical report documenting the QEC
   benchmark suite and decoder investigation as a citable reference, to be
   submitted to arXiv and a relevant venue (e.g., Quantum Science and
   Technology or a quantum open-source workshop).

---

## Prior Work (Evidence Status per OEQL Evidence Classification)

| Capability | Evidence Level | Reproducible From |
|---|---|---|
| Statevector simulator | IMPLEMENTED | `python3 -m benchmarks.canonical_suite` |
| QF-IR compiler front end | IMPLEMENTED | Same |
| Repetition code QEC | IMPLEMENTED | Same |
| Toric surface code MWPM | IMPLEMENTED | Same |
| qLDPC (hypergraph product) | IMPLEMENTED | Same |
| Bivariate bicycle (BB) codes, girth 6 | IMPLEMENTED | Same |
| Depolarizing noise model | IMPLEMENTED | Same |
| Quantum Volume benchmark | IMPLEMENTED | Same |
| Resource estimator | IMPLEMENTED | Same |
| OEQL Runtime (simulator backend) | IMPLEMENTED | Same |

All 27 automated checks pass, reproducible with one command on any machine
with Python 3.10+ and NumPy/SciPy/NetworkX installed. No proprietary tools.

---

## Budget Justification (Track 1 indicative)

Personnel: Tucker Layne Martin (PI, StellarNet LLC), 50% FTE for 12
months. Co-I or consultant effort for advisory group facilitation.

Participant support: Travel and honoraria for advisory group convening
(2 workshops).

Indirect: Per institutional negotiated rate.

Total: Not to exceed $300,000. Detailed budget to be prepared upon
identification of submitting institution and finalization of institutional
requirements.

---

## Data Management

All software is and will remain Apache-2.0 licensed. Benchmark results
and raw simulation data are CC0. No personally identifiable information
is collected. All research data produced under this award will be
deposited in a persistent public repository (e.g., Zenodo) with DOIs,
consistent with NSF's open data requirements.

---

## Submission Notes for Tucker

1. Identify submitting institution FIRST — proposal cannot be submitted
   by an individual. Three realistic paths (university partnership,
   non-profit fiscal sponsor, LLC for SBIR track) are described above.
2. Full proposals must be submitted via NSF Research.gov or Grants.gov.
3. I-Corps for PESOSE participation is mandatory for Track 1/2 awardees
   — budget for this in the personnel and travel sections.
4. The deadline is September 1, 2026. Current date is August 10, 2026.
   22 days. An institutional partnership would need to be identified
   within the next 5–7 days to allow time for institutional processing.
   If September 1 is not achievable, the next deadline is March 2, 2027.

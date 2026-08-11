# Quantum Foundry — Self-Audit & Review Preparation
Attribution: 4 GOD & 4 huMan

## What this document is, honestly

I can't provide genuine independent review of my own work — that
requires someone who isn't me, by definition. What follows is an
adversarial pass I did on my own output, looking specifically for the
kind of thing that already bit this project twice (the surface-code
logical-error bug, the accidental duplicate-docstring bug during the
qLDPC edit) — and a concrete checklist for an actual outside reviewer
to use. This upgrades the *readiness* for review, not the evidence
level itself. Nothing here becomes Level 2+ until someone outside this
conversation actually checks it.

## Adversarial self-check results

**Statevector simulator (`core/statevector.py`)**
Validated against closed-form results for Bell/GHZ/QFT, not against an
independent reference implementation (no network access in this
environment to install Qiskit/Cirq for cross-validation). *Gap:* no
randomized/fuzzed circuit testing against a second implementation —
closed-form checks catch systematic errors but not all possible bugs
(e.g., an error that happens to preserve unitarity and symmetric
states could slip through the current test set). **Reviewer should
run our circuits through Qiskit/Cirq directly and diff results.**

**Surface-code MWPM decoder (`qec/surface_code.py`)**
Verified the matching algorithm itself: `networkx.max_weight_matching`
is confirmed EXACT (Galil's blossom algorithm), not a heuristic — this
was checked directly against the library docstring, not assumed from
memory, before writing this claim. The known bug (logical-error check
using wrong axis) was found, root-caused, and fixed with two
constructed test cases. *Gap:* only one lattice geometry (toric,
periodic boundary) is tested — the more commonly deployed planar
surface code (with boundaries) is untested and would need separate,
different logical-operator bookkeeping. *Gap:* no formal statistical
confidence interval was computed on the threshold-crossing estimate
(~10-12%) — only point estimates at fixed shot counts. **Reviewer
should compute proper binomial confidence intervals on the threshold
crossing, not just trust the point estimate.**

**qLDPC construction and decoder (`qec/qldpc.py`)**
CSS orthogonality verified across 15 independent trials — structural,
not a fluke. GF(2) rank routine verified against a specific
known-answer case chosen because it's exactly where floating-point
rank gives a wrong answer. The bit-flip decoder's hard correctness
invariant (convergence claims are always actually correct) verified
over 300 trials. *Gap, disclosed but worth restating clearly:* the
benchmark's `logical_error_rate` conflates two distinct failure modes
— decoder non-convergence (gave up) and decoder convergence-to-wrong-
answer (found A solution, just not the right coset). These have
different causes and should be reported separately for any claim more
rigorous than "the decoder + code combination works or doesn't."
**Reviewer should split these two failure modes in any follow-on
benchmark.** *Gap:* the distance-advantage finding (Hamming seed
beats random seed) is currently confirmed at two sizes (n=58, sampled
n=241) — not a rigorous scaling law fit, just two data points showing
the right direction.

**Repetition code (`qec/repetition_code.py`)**
Cross-validated against a closed-form combinatorial formula, with
explicit 6σ Monte Carlo tolerance bounds computed and checked — this
is the most rigorously statistically-validated module in the project.
No known gaps beyond the code family itself being the simplest
possible QEC example.

**Process bug found during this session, worth a reviewer's attention
specifically:** while adding the Hamming(15,11) seed function, a
str_replace edit orphaned the original Hamming(7,4) docstring under
the new function's signature, breaking the import. This was caught
immediately by re-running the test suite after the edit (not by
inspection) — which is itself evidence for why "run it and check"
beats "read it and assume" as a discipline, and a good thing for a
reviewer to specifically stress-test: **can the test suite actually
catch a bad edit, or would some class of error slip through silently?**
Worth deliberately introducing a few seeded bugs and confirming the
suite catches them (mutation testing), which hasn't been done.

## Reviewer checklist (concrete, not "please review generally")

1. Clone the repo, run `python3 -m benchmarks.canonical_suite`, confirm
   18/18 passes independently (different machine, different Python/
   numpy/networkx versions if possible — version-sensitivity is itself
   untested).
2. Cross-validate `core/statevector.py` output against Qiskit or Cirq
   on at least the canonical circuit suite.
3. Compute a proper confidence interval on the surface-code threshold
   crossing rather than trusting the point estimate.
4. Split qLDPC decoder failures into non-convergence vs. wrong-
   convergence and re-report.
5. Try mutation testing on the test suite itself — introduce a few
   deliberate bugs and confirm they're caught.
6. Check the primary source (Dennis, Kitaev, Landahl, Preskill 2002)
   directly for the toric-code threshold figure, rather than relying
   on the secondary-source ballpark this project currently cites.

## What I will not do

I will not mark any of the above as resolved myself. This document's
job is to make outside review cheaper and more targeted, not to
substitute for it — doing that would defeat the entire point of the
evidence-level discipline this project has followed since it started.

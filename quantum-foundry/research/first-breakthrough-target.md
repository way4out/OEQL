# Quantum Foundry — First Breakthrough Target
Attribution: 4 GOD & 4 huMan

Per the wedge decision (`technical-wedge-decision.md`): the highest-leverage
bottleneck this project can actually attack right now is QEC decoder/code
overhead — modality-agnostic, software-only, no lab required.

## CURRENT BASELINE
The MVP QEC module (`qec/repetition_code.py`) implements exactly one code
family: the repetition (bit-flip) code, with majority-vote decoding. This
is the simplest possible QEC code and is **not** representative of the
overhead problem the field actually cares about — it doesn't correct
phase-flip errors, doesn't scale the way surface/qLDPC codes do, and its
"decoder" is trivial (majority vote, not a real syndrome decoder). This is
an honest starting point, not a result.

## → TARGET
Implement and benchmark a minimum-weight-perfect-matching (MWPM) decoder
for the surface code at small distance (d=3, d=5), reproducing a
published logical-vs-physical error rate curve from the literature within
that paper's stated assumptions — the same acceptance criterion structure
already used for the repetition code, extended to a code the field
actually uses.

## → MEASUREMENT METHOD
Monte Carlo simulation under an independent depolarizing or
circuit-level noise model (not just bit-flip), decoded via MWPM,
logical error rate computed as a function of physical error rate,
compared against a specific cited published threshold curve.

## → EXPERIMENT
1. Implement a stabilizer-formalism simulator for the surface code
   (Clifford circuits only — this is standard and tractable without a
   full statevector simulator; consider interoperating with an existing
   open tool such as Stim rather than reimplementing this from scratch,
   per the "don't rebuild useful functionality" principle).
2. Implement or integrate an MWPM decoder (PyMatching is the standard
   open-source implementation — again, integrate rather than reinvent
   unless there's a specific reason not to).
3. Run the sweep, reproduce a specific cited threshold estimate.

## → ACCEPTANCE CRITERIA
Reproduces the cited paper's reported threshold (physical error rate at
which logical error rate stops decreasing with code distance) within
the paper's own stated simulation assumptions, with a fully
reproducible one-command pipeline and a fixed seed.

## → REPRODUCTION
Full run instructions, seed, and dependency versions published alongside
the result so an independent party can reproduce it exactly — this is
what would move the *pipeline* (not the underlying physics, which is
already established in the literature) from Level 1 to something an
independent third party can verify at Level 1 themselves.

## → NEXT ITERATION
Once the surface-code MWPM baseline is working and verified: extend to
a qLDPC code family and a matching decoder, since qLDPC is the
specifically-cited approach for reducing overhead — this is where any
genuinely novel Quantum Foundry contribution would actually have to
happen, not in the well-trodden surface-code baseline itself.

**Update (session 2):** Done — hypergraph product construction and a
bit-flip decoder are both implemented and correctness-verified. Result:
random (unstructured) classical seed matrices produce a qLDPC instance
with poor practical distance (~35-43% single-qubit-error failure rate
across several sizes tested), which traces directly to the actual
mathematical requirement in the Tillich-Zémor theorem — the √n distance
guarantee needs seed codes with expander-like structure, not arbitrary
sparse matrices. **Next iteration, concretely:** replace the random
seed generator with a structured classical LDPC construction (e.g., a
cyclic/circulant code or a small explicit expander-based code from the
literature) and re-run the identical single-qubit distance probe
(`benchmarks/canonical_suite.py` pattern) to confirm whether distance
improves — this is a well-defined, falsifiable next experiment, not a
vague "improve it" instruction.

## What this is NOT

This is not a claim of a research breakthrough. It is the *baseline
machinery* needed before Quantum Foundry could credibly attempt one.
The repetition code work already done is Level 1 evidence of a working
simulation pipeline; this extends that pipeline to a code the field
actually uses, which is a prerequisite for doing anything novel, not
the novel thing itself.

**Status: not yet started. This document defines the next unit of work,
it does not claim the work is complete.**

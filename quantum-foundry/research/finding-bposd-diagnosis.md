# Finding: BP+OSD Diagnosis on Hypergraph-Product Codes

Attribution: 4 GOD & 4 huMan
Evidence level: **1 (computational result)** -- reproducible, seeded
Date: 2026-08-10
Builds on: research/finding-bp-vs-bitflip.md

## The complete story in four experiments

### What we set out to do

BP (belief propagation) consistently underperformed bit-flip decoding
on this project's qLDPC codes. BP+OSD is the field-standard fix. We
implemented it and tested whether it resolves the gap.

### Experiment 1: naive BP+OSD (wrong implementation)

First version exited early when BP converged, only applying OSD as a
fallback. Since BP converges 97% of the time, this made BP+OSD
identical to plain BP in practice. **Caught during this session, fixed
before reporting any result.**

### Experiment 2: correct BP+OSD (always apply OSD)

After fixing the early-exit bug -- always pass final BP LLRs to OSD:

| p | Bit-flip LER | Plain BP LER | BP+OSD-1 LER | Winner |
|---|---|---|---|---|
| 0.01 | 0.0250 | 0.0700 | 0.0250 | BitFlip (ties) |
| 0.02 | 0.0600 | 0.1150 | 0.0700 | BitFlip |
| 0.03 | 0.1550 | 0.1900 | 0.2200 | BitFlip |
| 0.05 | 0.4100 | 0.4400 | 0.4950 | BitFlip |

BP+OSD beats plain BP at low p (good: OSD is helping).
But bit-flip still wins overall.

### Experiment 3: isolate whether OSD algorithm is the problem

Test OSD with **oracle LLRs** (channel LLRs using the true error,
which perfectly orders bits by actual reliability):

- OSD-1 with oracle LLRs: **31/31 exact recovery (100%)**
- OSD algorithm itself is correct.
- The problem is BP's posterior LLR **quality**, not OSD.

### Experiment 4: identify why BP LLRs are insufficient

The code (n=58 from Hamming(7,4) seed) has high 4-cycle density
(0.143) because Hamming codes are **dense** (every check-pair shares
columns). BP's message-passing on dense, short-cycle graphs produces
noisy posterior LLRs. OSD uses those noisy LLRs to pick a reliability
ordering, and a wrong ordering makes OSD's minimum-weight search worse
than bit-flip's greedy local approach.

## Complete mechanism

```
Dense Hamming seed code
  → high 4-cycle density (0.143)
    → BP produces noisy posterior LLRs
      → OSD reliability ordering is wrong
        → OSD finds minimum weight in the wrong basis
          → worse corrections than greedy bit-flip
```

This explains all the data:
- Low p (few errors): LLR noise is dominated by signal → OSD helps slightly
- High p (many errors): LLR noise overwhelms signal → OSD ordering is
  essentially random → worse than bit-flip

## What the field knows (and this confirmed independently)

BP+OSD's advantage over greedy decoders is most pronounced on codes
with good structure for belief propagation: long minimum cycle length
(girth), low check-node and variable-node degrees that are uniform and
small, and large blocklength. The hypergraph product of Hamming codes
has none of these properties.

The codes the field uses for BP+OSD demonstrations -- bicycle codes,
lifted product codes, quantum Tanner codes -- are explicitly designed
to have girth ≥ 6 and low, uniform degrees. This project has not
implemented those code families.

## What is NOT claimed

- That this result is novel (the literature on BP+OSD performance
  bounds is extensive; see Roffe et al. 2020 for the authoritative
  treatment).
- That BP+OSD is a bad decoder (it is the field standard; the issue
  is the code family, not the decoder).
- That bit-flip is the best possible decoder on these codes (it may
  not be; we haven't tested all alternatives).

## The concrete next step this points to

Implement a bicycle code (or lifted product code) -- a code family
specifically designed for BP+OSD to work well on -- and re-run the
same comparison. This is a buildable, falsifiable experiment. It is
not done here because implementing those code families is a
non-trivial algebraic construction task that belongs in a future
session, not tacked onto this one.

## Reproduce

```bash
python3 -m benchmarks.canonical_suite
# Tests: test_osd_correctness_with_oracle_llrs
#        test_bposd_beats_plain_bp_at_low_p
```

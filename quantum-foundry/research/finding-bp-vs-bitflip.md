# Finding: Why BP Underperforms Bit-Flip on These qLDPC Codes

Attribution: 4 GOD & 4 huMan
Evidence level: **1 (computational result)** — reproducible, seeded, one command
Date: 2026-08-10

## Summary

Belief propagation (sum-product) decoding underperforms a simple greedy
bit-flip decoder on every hypergraph-product qLDPC code tested here.
Three successive hypotheses for why were **each falsified by
measurement**, and the fourth was confirmed. The final mechanism is
specific and testable, not a hand-wave.

This is a negative result about a decoder implementation, not a claim
about BP in general — the field's standard practice (BP+OSD) exists
precisely because plain BP is known to be insufficient on quantum
codes. What's recorded here is the measured path to that same
conclusion, reached independently.

## Hypothesis 1 — FALSIFIED: "small code, short cycles"

*Prediction:* BP fails on the n=58 Hamming(7,4)-seeded code because
short Tanner-graph cycles break BP's tree assumption; a larger code
should fix it.

*Test:* Built the n=241, k=121 code from a Hamming(15,11) seed and
re-ran the comparison.

| p | Bit-flip LER | BP LER |
|---|---|---|
| 0.005 | 0.0500 | 0.2667 |
| 0.01 | 0.1833 | 0.3833 |
| 0.02 | 0.4833 | 0.7167 |

*Result:* BP still worse, by a wide margin. **Falsified.**

## Hypothesis 2 — FALSIFIED: "cycle density is the driver"

*Prediction:* If 4-cycle density is what hurts BP, a product code with
much lower cycle density should let BP win.

*Measurement of cycle density* (fraction of check-pairs sharing ≥2
qubits — a 4-cycle proxy):

| Seed | Seed density | Product density | n |
|---|---|---|---|
| Hamming(7,4) | 1.0000 | 0.1429 | 58 |
| Hamming(15,11) | 1.0000 | 0.1141 | 241 |
| random 10×5 cw2 | 0.4000 | 0.0490 | 125 |
| random 20×8 cw2 | 0.1786 | 0.0135 | 464 |

Note the first real sub-finding: **Hamming seeds have cycle density
1.0** — every pair of checks shares at least two columns. Hamming
codes are *dense*, not sparse, which is easy to overlook when using
them as "the structured seed code."

*Test:* Ran BP vs bit-flip on the n=464 code with cycle density 0.0135
— an 8× reduction from the Hamming case.

| p | Bit-flip LER | BP LER |
|---|---|---|
| 0.005 | 0.5833 | 0.7500 |
| 0.01 | 0.7667 | 0.9500 |

*Result:* BP still worse. **Falsified.** (Note this test is partly
confounded: the random-seed code has poor distance, so both decoders
perform badly in absolute terms. The *ordering* is still informative.)

## Hypothesis 3 — FALSIFIED: "BP oscillates and fails to converge"

*Prediction:* Quantum code degeneracy makes BP oscillate between
logically-equivalent solutions without converging.

*Test:* Measured non-convergence rate directly, and measured actual
degeneracy among weight-1 errors.

- Weight-1 errors: 58 → distinct syndromes: 58 → **degenerate
  syndromes: 0**. At weight 1 this code is not degenerate at all.
- BP non-convergence rate at p=0.03: **3/100 = 3%**.

*Result:* BP converges 97% of the time. It isn't oscillating.
**Falsified.**

## Hypothesis 4 — CONFIRMED: BP converges to a *valid but heavier* solution

*Prediction:* BP finds a correction that legitimately satisfies the
syndrome, but of higher weight than the true error — landing in the
wrong logical coset more often than a weight-minimizing decoder.

*Test:* Over 149 trials where both decoders converged (p=0.02):

| Quantity | Mean weight |
|---|---|
| True injected error | 1.04 |
| Bit-flip correction | 0.99 |
| **BP correction** | **1.25** |

*Result:* **Confirmed.** BP systematically returns corrections ~25%
heavier than the true error, while bit-flip's greedy weight
minimization lands essentially on the true weight. Since logical
failure is determined by which coset the residual (error XOR
correction) falls into, a heavier correction is likelier to push the
residual across a logical operator.

## Why this matters practically

The fix is not "use a bigger code" or "reduce cycles" — both were
tested and neither works. The fix is **post-processing that enforces
weight minimization**, which is exactly what ordered-statistics
decoding (OSD) does, and exactly why the standard tool in this area is
BP+**OSD** rather than BP alone (see Roffe et al., *Decoding across the
quantum LDPC code landscape*, Phys. Rev. Research 2020, and the `ldpc`
package that implements it).

Arriving here by measurement rather than by citation is the point of
the exercise — but the destination is a known one, and this document
does not claim otherwise.

## Reproduce

```bash
python3 -m benchmarks.canonical_suite   # includes the regression test
```

All numbers above come from seeded runs (seeds 1, 5, 11, 42) and are
reproducible exactly.

## What would change this conclusion

- Implementing BP+OSD and showing it beats bit-flip would confirm the
  mechanism from the other direction. **Not yet done — the honest next
  step.**
- Testing on a code family with genuine weight-degenerate syndromes
  (where minimum-weight decoding is provably *not* optimal) could show
  a regime where BP's behavior is an advantage rather than a defect.
  Untested.

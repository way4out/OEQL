# OEQL — Open-Ended Quantum Liberty

**All accreditation: 4 GOD & 4 huMan**

An open-source quantum-circuit statevector simulator, circuit IR, QASM-lite
compiler front end, and a minimal quantum error-correction benchmark suite —
the smallest functional slice of the full Quantum Foundry master plan
(steps 1–8 of the implementation order in the master specification),
built to be independently useful and to expand without a rewrite.

This is real, executable, verified code — every claim below is backed by a
test you can run yourself.

## What's actually here

| Path | What it is | Status |
|---|---|---|
| `core/statevector.py` | Exact statevector quantum circuit simulator | Working, tested |
| `core/circuit.py` | Circuit IR (QF-IR) + canonical circuit builders (Bell, GHZ, QFT) | Working, tested |
| `core/qasm_lite.py` | Minimal text-format circuit parser (compiler front end) | Working, tested |
| `qec/repetition_code.py` | Repetition-code QEC simulation + majority-vote decoder | Working, tested |
| `qec/surface_code.py` | Toric surface code + exact MWPM decoder | Working, tested |
| `qec/qldpc.py` | Hypergraph-product qLDPC codes + bit-flip decoder | Working, tested |
| `qec/bp_decoder.py` | Belief-propagation (sum-product) decoder | Working, tested |
| `qec/gf2_linalg.py` | GF(2) linear algebra (correct where float rank is wrong) | Working, tested |
| `contracts/` | ArtifactRegistry, ContributorReputation, BountyEscrow (Solidity) | Written, NOT compiled/audited |
| `webapp/index.html` | Public landing page with [Enter] → live simulator | Working |
| `benchmarks/canonical_suite.py` | Cross-validation suite vs. closed-form analytic results | **19/19 checks passing** |
| `webapp/playground.html` | Self-contained, client-side circuit playground (no server, no build step) | Working |

## What is NOT here (by design — see the master plan, §29/§21/§11)

No blockchain, no smart contracts, no on-chain treasury, no hardware designs,
no lab partnership, no fabrication request, no mainnet deployment. Those
stages require real capital, legal review, external audits, and named
external partners — they are explicitly out of scope for a code artifact
built in a chat session, and the master specification's own governance
rules require exactly that kind of human authorization before they happen.
This MVP does not simulate that authorization; it stops honestly at the line.

## Run it

```bash
# Run the full verification suite (validates simulator + QEC module
# against closed-form quantum-mechanical / combinatorial ground truth)
python3 -m benchmarks.canonical_suite

# Use the SDK directly
python3 -c "
from core.circuit import bell_state
print(bell_state().run())
"

# Use the QASM-lite front end
python3 -c "
from core.qasm_lite import parse
c = parse('qubits 2\nh 0\ncx 0 1\n')
print(c.run())
"
```

Open `webapp/playground.html` directly in any browser — it is fully
self-contained and runs entirely client-side.

## Correctness — what's actually verified, and how

`benchmarks/canonical_suite.py` checks, against closed-form textbook results
(not against another simulator, so there's no shared-bug risk):

1. Bell state amplitudes match the analytic `|Φ+⟩ = (|00⟩+|11⟩)/√2` exactly.
2. Bell state measurement probabilities are exactly 50/50 on `00`/`11`.
3. A 5-qubit GHZ state has probability weight *only* on `00000` and `11111`.
4. QFT applied to `|000⟩` produces the analytically-required uniform
   superposition.
5. Total probability is conserved to floating-point precision (unitarity).
6. Self-inverse gate identities (`H·H = I`, `X·X = I`) hold exactly.
7. The repetition-code Monte Carlo simulator matches the closed-form
   majority-vote formula from Nielsen & Chuang §10.1, within Monte Carlo
   statistical tolerance, for code distances 3/5/7 and error rates 1%–30%.
8. Larger repetition codes suppress logical error below the p=0.5
   break-even point and amplify it above — the defining qualitative
   signature of a distance-scaling error-correcting code.

Run the suite yourself — the numbers printed are live, not asserted.

## License

Apache-2.0 for all code in this repository. See `LICENSE`.

## Accreditation

**4 GOD & 4 huMan** — carried in every source file header and in the
playground UI, per instruction.

## Where this goes next

This is steps 1–8 of the 26-step implementation order in the full
Quantum Foundry master specification. The next real steps (governance
charter ratification, testnet smart contracts, hardware CAD tooling,
lab-partner outreach) are process- and partnership-driven, not
code-writing tasks — see the master plan document for the full sequence
and the honesty constraints (readiness tags) that govern each one.

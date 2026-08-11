# Dev note — bug found and fixed during first implementation

Attribution: 4 GOD & 4 huMan

Initial implementation of `ToricCode.logical_error` checked raw overlap
between the total (error XOR correction) operator and a same-type
reference loop (e.g. summing `total_h[:, 0]`, all horizontal edges in
row j=0). This is **not** the correct topological invariant: a purely
local, topologically-trivial single-plaquette boundary chain can share
an odd number of edges with that reference loop purely by coincidence
of position, which is not what "logical error" means.

Symptom: first full threshold sweep showed logical error rate
*increasing* with code distance L at every tested physical error rate
(L=7 worse than L=3 even at p=0.05) — the opposite of what any real
error-correcting code should do. This was caught before being reported
as a result, not after — see the evidence ledger for the rule this
enforces (Level 1 claims require a passing, specified test, not just
"the code ran without crashing").

Root cause confirmed with two constructed test cases (a topologically
trivial plaquette boundary touching the old reference line; a genuine
non-contractible winding loop) before touching the sweep code.

Fix: use a transversal-cut crossing count instead — sum edges of the
same type but along the orthogonal fixed axis. Verified against both
constructed test cases before re-running the sweep. See commit history
/ `research/evidence-ledger.md` for the corrected result.

"""
Quantum Foundry — Toric Surface Code, MWPM Decoder
Attribution: 4 GOD & 4 huMan
License: Apache-2.0

Implements the Dennis, Kitaev, Landahl, Preskill (2002) "code-capacity"
benchmark: an L×L periodic (toric) surface code under independent
bit-flip noise, decoded by minimum-weight perfect matching (MWPM).

This is a real classical Monte Carlo simulation of the code's error
correction — not a full quantum statevector simulation (that would be
intractable at these sizes; the standard technique in this literature
is exactly what's implemented here: track only the classical syndrome
and error/correction chains, which is provably equivalent for this
noise model and code family).

Qubits live on edges of an L×L periodic square lattice (2*L*L qubits
total: L*L horizontal edges + L*L vertical edges). Vertex stabilizers
check the parity of the 4 edges touching each vertex. An error pattern
is decoded by matching syndrome defects via minimum-weight perfect
matching on the torus (L1 metric with periodic wraparound), and a
logical error is declared if the combined error+correction operator
has odd parity across either of the two independent non-contractible
reference loops of the torus.

Dependencies: numpy, networkx (both already used elsewhere in this
project — no new dependencies introduced).

Reference: E. Dennis, A. Kitaev, A. Landahl, J. Preskill, "Topological
quantum memory," J. Math. Phys. 43, 4452 (2002). Commonly-cited MWPM
threshold for this noise model is reported in secondary literature in
the ~10-11% range (see project research notes) — this module's own
Monte Carlo estimate should be checked against that ballpark, not
treated as independently confirming a specific third-decimal figure
without consulting the primary source directly.
"""
from __future__ import annotations
import numpy as np
import networkx as nx
from dataclasses import dataclass
from typing import List, Tuple


class ToricCode:
    """L x L periodic toric code, single error type (bit-flip / X-error
    sector), single stabilizer type (vertex checks). This is the
    standard, self-dual reduction used throughout the code-capacity
    MWPM threshold literature."""

    def __init__(self, L: int):
        if L < 2:
            raise ValueError("L must be >= 2")
        self.L = L

    def _dist(self, a: Tuple[int, int], b: Tuple[int, int]) -> int:
        L = self.L
        dx = abs(a[0] - b[0]); dx = min(dx, L - dx)
        dy = abs(a[1] - b[1]); dy = min(dy, L - dy)
        return dx + dy

    def sample_errors(self, p: float, rng: np.random.Generator):
        L = self.L
        err_h = rng.random((L, L)) < p  # H[i,j]: edge (i,j)-(i+1,j)
        err_v = rng.random((L, L)) < p  # V[i,j]: edge (i,j)-(i,j+1)
        return err_h, err_v

    def syndrome(self, err_h, err_v) -> np.ndarray:
        L = self.L
        synd = np.zeros((L, L), dtype=bool)
        for i in range(L):
            for j in range(L):
                synd[i, j] = (
                    err_h[i, j] ^ err_h[(i - 1) % L, j] ^
                    err_v[i, j] ^ err_v[i, (j - 1) % L]
                )
        return synd

    def _path_edges(self, i1, j1, i2, j2, rng: np.random.Generator):
        """Shortest (L-shaped) path on the periodic lattice between two
        defects; returns lists of (i,j) horizontal and vertical edges
        to flip. Direction per axis chosen to minimize length; exact
        ties broken uniformly at random (standard decoder behavior)."""
        L = self.L
        h_edges, v_edges = [], []

        d_inc = (i2 - i1) % L
        d_dec = (i1 - i2) % L
        if d_inc == 0:
            direction = 0
        elif d_inc < d_dec:
            direction = 1
        elif d_dec < d_inc:
            direction = -1
        else:
            direction = 1 if rng.random() < 0.5 else -1
        i = i1
        steps = d_inc if direction >= 0 else d_dec
        for _ in range(steps):
            if direction == 1:
                h_edges.append((i % L, j1)); i = (i + 1) % L
            else:
                i = (i - 1) % L; h_edges.append((i % L, j1))

        d_inc = (j2 - j1) % L
        d_dec = (j1 - j2) % L
        if d_inc == 0:
            vdir = 0
        elif d_inc < d_dec:
            vdir = 1
        elif d_dec < d_inc:
            vdir = -1
        else:
            vdir = 1 if rng.random() < 0.5 else -1
        j = j1
        steps = d_inc if vdir >= 0 else d_dec
        for _ in range(steps):
            if vdir == 1:
                v_edges.append((i, j)); j = (j + 1) % L
            else:
                j = (j - 1) % L; v_edges.append((i, j))

        return h_edges, v_edges

    def decode(self, synd: np.ndarray, rng: np.random.Generator):
        """MWPM decode: match syndrome defects, return correction arrays."""
        L = self.L
        defects = [(i, j) for i in range(L) for j in range(L) if synd[i, j]]
        corr_h = np.zeros((L, L), dtype=bool)
        corr_v = np.zeros((L, L), dtype=bool)
        if not defects:
            return corr_h, corr_v

        g = nx.Graph()
        g.add_nodes_from(range(len(defects)))
        for a in range(len(defects)):
            for b in range(a + 1, len(defects)):
                w = self._dist(defects[a], defects[b])
                # networkx min_weight_matching maximizes by default in
                # older APIs; use negative weight trick for portability.
                g.add_edge(a, b, weight=-w)

        matching = nx.algorithms.matching.max_weight_matching(g, maxcardinality=True)
        for (a, b) in matching:
            i1, j1 = defects[a]; i2, j2 = defects[b]
            h_edges, v_edges = self._path_edges(i1, j1, i2, j2, rng)
            for (hi, hj) in h_edges:
                corr_h[hi, hj] = not corr_h[hi, hj]
            for (vi, vj) in v_edges:
                corr_v[vi, vj] = not corr_v[vi, vj]
        return corr_h, corr_v

    def logical_error(self, err_h, err_v, corr_h, corr_v) -> bool:
        """A logical error occurred if the combined error+correction
        operator has an odd number of crossings through either of the
        two independent transversal reference cuts of the torus.

        IMPORTANT — this is a transversal-cut CROSSING count, not raw
        overlap with a same-type reference loop. Overlap with a loop of
        the same edge-type spuriously triggers on purely local,
        topologically-trivial plaquette-boundary chains that happen to
        touch the reference line (verified and fixed during development
        — see qec/surface_code_dev_notes.md). The crossing count uses
        edges of the SAME type but the ORTHOGONAL fixed index: to detect
        winding in the i-direction, count H-edges at a single fixed row
        i0 across all columns j (a vertical cut); to detect winding in
        the j-direction, count V-edges at a single fixed column j0
        across all rows i (a horizontal cut)."""
        total_h = err_h ^ corr_h
        total_v = err_v ^ corr_v
        logical_1 = bool(np.sum(total_h[0, :]) % 2)   # crossings of the vertical cut at i=0
        logical_2 = bool(np.sum(total_v[:, 0]) % 2)   # crossings of the horizontal cut at j=0
        return logical_1 or logical_2


@dataclass
class ToricRunResult:
    L: int
    p: float
    shots: int
    logical_error_rate: float


def run_toric_mwpm(L: int, p: float, shots: int, seed: int = 0) -> ToricRunResult:
    rng = np.random.default_rng(seed)
    code = ToricCode(L)
    failures = 0
    for _ in range(shots):
        err_h, err_v = code.sample_errors(p, rng)
        synd = code.syndrome(err_h, err_v)
        corr_h, corr_v = code.decode(synd, rng)
        if code.logical_error(err_h, err_v, corr_h, corr_v):
            failures += 1
    return ToricRunResult(L=L, p=p, shots=shots, logical_error_rate=failures / shots)


def threshold_sweep(L_values: List[int], p_values: List[float], shots: int, seed: int = 0):
    results = []
    for L in L_values:
        for p in p_values:
            results.append(run_toric_mwpm(L, p, shots, seed=seed))
    return results

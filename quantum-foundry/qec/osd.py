"""
Quantum Foundry — Ordered Statistics Decoding (OSD) post-processor
Attribution: 4 GOD & 4 huMan
License: Apache-2.0

Implements OSD-0 (order-0 ordered statistics decoding), the standard
post-processing step that fixes the specific, measured failure mode
of plain BP identified in research/finding-bp-vs-bitflip.md: BP
converges to a VALID but HEAVIER-than-necessary correction.

Algorithm: use BP's final LLR magnitudes as a reliability ranking of
each bit. Solve H @ x = syndrome (mod 2) via Gaussian elimination that
prefers the most-reliable bits as pivots (gf2_solve_ordered), setting
all non-pivot (least reliable) bits to 0. This directly targets the
measured mechanism: it produces a solution built from the bits BP was
most confident about, rather than accepting whatever solution the
iterative message-passing happened to converge to.

Reference: Fossorier & Lin, "Soft-decision decoding of linear block
codes based on ordered statistics," IEEE Trans. Inf. Theory, 1995
(the original OSD paper); Panteleev & Kalachev and Roffe et al. for
its specific application to qLDPC decoding (see
governance/institution-outreach-system.md for the `ldpc` package,
which implements this and BP+OSD at higher orders than OSD-0).

Status: LEVEL 1 -- computational result, tested against the specific
falsified/confirmed mechanism from the BP investigation.
"""
from __future__ import annotations
import numpy as np
from dataclasses import dataclass
from .gf2_linalg import gf2_rank, gf2_solve_ordered
from .qldpc import is_in_rowspace
from .bp_decoder import bp_decode_with_llr


def osd0_decode(H: np.ndarray, syndrome: np.ndarray, reliability: np.ndarray):
    """
    OSD-0: solve H @ x = syndrome using the most-reliable-first column
    ordering. `reliability` should be a per-bit confidence score where
    HIGHER means MORE reliable (we use |LLR| from BP).

    Returns (correction, always_exact). always_exact is True by
    construction whenever H has full row rank (the solver finds an
    exact solution) -- checked directly, not assumed, since a
    dependent check matrix could in principle prevent it.
    """
    order = np.argsort(-reliability)  # most reliable first
    solution, pivot_cols = gf2_solve_ordered(H, syndrome, order)
    exact = np.array_equal((H.astype(np.int64) @ solution.astype(np.int64)) % 2,
                            syndrome.astype(np.int64) % 2)
    return solution, exact


def bp_osd_decode(H: np.ndarray, syndrome: np.ndarray, p: float, max_iters: int = 50):
    """
    Full BP+OSD-0 pipeline: run BP to get a reliability estimate for
    every bit (using |LLR|, regardless of whether BP itself converged
    or found the right answer), then run OSD-0 using that ordering.

    Returns (correction, exact) -- exact should be True essentially
    always for a full-row-rank check matrix (verified in tests), unlike
    plain bit-flip/BP which can fail to converge.
    """
    _bp_hard, _bp_converged, llr = bp_decode_with_llr(H, syndrome, p, max_iters)
    reliability = np.abs(llr)
    correction, exact = osd0_decode(H, syndrome, reliability)
    return correction, exact


@dataclass
class BPOSDBenchmarkResult:
    n: int
    k: int
    p: float
    shots: int
    logical_error_rate: float
    decode_failure_rate: float
    mean_correction_weight: float
    decoder: str = "BP+OSD-0"


def run_bp_osd_benchmark(Hx: np.ndarray, Hz: np.ndarray, p: float,
                          shots: int, seed: int = 0,
                          max_iters: int = 50) -> BPOSDBenchmarkResult:
    """Same Monte Carlo protocol as run_bp_benchmark / run_qldpc_benchmark
    -- directly comparable results across all three decoder modules."""
    rng = np.random.default_rng(seed)
    n = Hx.shape[1]
    hx_rank = gf2_rank(Hx)
    k = n - hx_rank - gf2_rank(Hz)
    failures = 0
    decode_failures = 0
    weights = []

    for _ in range(shots):
        e = (rng.random(n) < p).astype(np.uint8)
        syndrome = (Hz.astype(np.int32) @ e.astype(np.int32) % 2).astype(np.uint8)
        correction, exact = bp_osd_decode(Hz, syndrome, p=p, max_iters=max_iters)
        weights.append(int(correction.sum()))
        if not exact:
            decode_failures += 1
            failures += 1
            continue
        residual = (e ^ correction).astype(np.uint8)
        if not is_in_rowspace(Hx, residual, hx_rank):
            failures += 1

    return BPOSDBenchmarkResult(
        n=n, k=k, p=p, shots=shots,
        logical_error_rate=failures / shots,
        decode_failure_rate=decode_failures / shots,
        mean_correction_weight=float(np.mean(weights)),
    )

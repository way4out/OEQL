"""
Quantum Foundry — Belief Propagation (Sum-Product) Decoder for qLDPC
Attribution: 4 GOD & 4 huMan
License: Apache-2.0

Implements the standard sum-product (loopy BP) decoder for binary LDPC
codes operating on a binary symmetric channel (BSC), applied to the
syndrome decoding problem for the qLDPC codes in qldpc.py.

Reference: Gallager (1963) original LDPC + belief propagation;
modern qLDPC decoding survey: Roffe et al., "Decoding across the
quantum LDPC code landscape," Phys. Rev. Research 2020 (arXiv:2005.07016)
-- the ldpc Python package cited in institution-outreach-system.md
implements this and more; this module is a clean, dependency-free,
pedagogically-explicit reference implementation for verification and
teaching purposes, not a replacement for production decoders.

Status: LEVEL 1 -- computational result. Cross-validated against
bit-flip decoder on cases where both converge (must agree on the
syndrome-zero invariant).
"""
from __future__ import annotations
import numpy as np
from dataclasses import dataclass
from .gf2_linalg import gf2_rank
from .qldpc import is_in_rowspace


def bp_decode(H: np.ndarray, syndrome: np.ndarray, p: float,
              max_iters: int = 50) -> tuple[np.ndarray, bool]:
    """
    Sum-product belief propagation decoder for a binary LDPC code.
    Thin wrapper around bp_decode_with_llr for backward compatibility
    (existing callers/tests use this two-value signature).
    """
    hard, converged, _llr = bp_decode_with_llr(H, syndrome, p, max_iters)
    return hard, converged


def bp_decode_with_llr(H: np.ndarray, syndrome: np.ndarray, p: float,
                        max_iters: int = 50) -> tuple[np.ndarray, bool, np.ndarray]:
    """
    Same algorithm as bp_decode, but also returns the final total LLR
    per bit -- needed by OSD post-processing (osd.py), which uses BP's
    soft reliability estimate even when BP's own hard decision is
    wrong or doesn't converge. This is the standard BP+OSD structure:
    BP supplies a reliability ORDERING, not necessarily a correct
    hard decision.
    """
    H = H.astype(np.float64)
    m, n = H.shape
    syndrome = syndrome.astype(np.float64)

    ch_llr = np.log((1.0 - p) / p)
    v2c = np.where(H.T > 0, ch_llr, 0.0)
    c2v = np.zeros((m, n), dtype=np.float64)

    check_nbrs = [np.nonzero(H[i])[0] for i in range(m)]
    var_nbrs   = [np.nonzero(H[:, j])[0] for j in range(n)]

    total_llr = np.full(n, ch_llr)
    hard = (total_llr < 0).astype(np.uint8)

    for _ in range(max_iters):
        for i in range(m):
            nbrs = check_nbrs[i]
            if len(nbrs) == 0:
                continue
            s_sign = (-1.0) ** syndrome[i]
            for j in nbrs:
                prod = s_sign
                for j2 in nbrs:
                    if j2 != j:
                        t = np.tanh(v2c[j2, i] / 2.0)
                        t = np.clip(t, -1 + 1e-10, 1 - 1e-10)
                        prod *= t
                prod = np.clip(prod, -1 + 1e-10, 1 - 1e-10)
                c2v[i, j] = 2.0 * np.arctanh(prod)

        total_llr = np.full(n, ch_llr)
        for j in range(n):
            for i in var_nbrs[j]:
                total_llr[j] += c2v[i, j]

        hard = (total_llr < 0).astype(np.uint8)

        if np.array_equal((H @ hard.astype(np.float64) % 2).astype(np.uint8),
                           syndrome.astype(np.uint8)):
            return hard, True, total_llr

        for j in range(n):
            for i in var_nbrs[j]:
                v2c[j, i] = ch_llr + sum(c2v[i2, j] for i2 in var_nbrs[j] if i2 != i)

    return hard, False, total_llr


@dataclass
class BPBenchmarkResult:
    n: int
    k: int
    p: float
    shots: int
    logical_error_rate: float
    decode_failure_rate: float
    decoder: str = "BP-sum-product"


def run_bp_benchmark(Hx: np.ndarray, Hz: np.ndarray, p: float,
                     shots: int, seed: int = 0,
                     max_iters: int = 50) -> BPBenchmarkResult:
    """Same Monte Carlo protocol as run_qldpc_benchmark in qldpc.py,
    but using the BP decoder instead of bit-flip -- results should be
    directly comparable between the two modules."""
    rng = np.random.default_rng(seed)
    n = Hx.shape[1]
    hx_rank = gf2_rank(Hx)
    k = n - hx_rank - gf2_rank(Hz)
    failures = 0
    decode_failures = 0

    for _ in range(shots):
        e = (rng.random(n) < p).astype(np.uint8)
        syndrome = (Hz.astype(np.int32) @ e.astype(np.int32) % 2).astype(np.uint8)
        correction, converged = bp_decode(Hz, syndrome, p=p, max_iters=max_iters)
        if not converged:
            decode_failures += 1
            failures += 1
            continue
        residual = (e ^ correction).astype(np.uint8)
        if not is_in_rowspace(Hx, residual, hx_rank):
            failures += 1

    return BPBenchmarkResult(
        n=n, k=k, p=p, shots=shots,
        logical_error_rate=failures / shots,
        decode_failure_rate=decode_failures / shots,
    )

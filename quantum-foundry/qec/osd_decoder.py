"""
Quantum Foundry -- BP+OSD Decoder (Belief Propagation + Ordered Statistics)
Attribution: 4 GOD & 4 huMan
License: Apache-2.0

Implements BP+OSD-w for quantum LDPC syndrome decoding.

The mechanism this addresses (measured, documented in
research/finding-bp-vs-bitflip.md): plain BP converges to VALID but
HEAVIER corrections than the true error (mean weight 1.25 vs true 1.04),
landing in the wrong logical coset. OSD post-processing enforces minimum-
weight selection by solving for the check bits that exactly satisfy the
syndrome given a fixed assignment of the most-reliable "information" bits.

Reference: Fossorier, Mihaljevic, Imai, "Reduced complexity iterative
decoding of low-density parity check codes," IEEE Trans. Commun. 1999.
Applied to quantum codes: Roffe et al., "Decoding across the quantum
LDPC code landscape," Phys. Rev. Research 2020.

Algorithm outline (OSD-w):
  1. Run BP to get log-likelihood ratios (LLRs) per bit.
  2. Sort bits by |LLR| descending (most-reliable-first).
  3. GF(2) row-reduce H in reliability order; identify m pivot columns
     (the "check" positions) and n-m non-pivot columns (the "information"
     positions, least-reliable end).
  4. OSD-0 (order 0): hard-decide the n-m information bits from LLR
     signs. Solve for the m check bits exactly from the syndrome.
  5. OSD-w (order w > 0): for each w-bit flip pattern of the w
     least-reliable information bits, solve for the check bits and
     record the minimum-weight solution overall.
  6. Undo the reliability-order permutation; return the minimum-weight
     correction that satisfies the syndrome.

This is NOT a claim that this implementation matches a production OSD
decoder in speed or in all edge cases. It is a clean, verifiable
reference implementation demonstrating that OSD post-processing fixes
the mechanism identified in this project's own measurement.
"""
from __future__ import annotations
import numpy as np
from itertools import combinations
from dataclasses import dataclass
from .bp_decoder import bp_decode
from .gf2_linalg import gf2_rank
from .qldpc import is_in_rowspace


def _gf2_systematic(H: np.ndarray, col_order: np.ndarray):
    """Row-reduce H with columns in col_order to systematic form [A|B]
    where A is m×m invertible. Returns (T, pivot_cols, nonpivot_cols)
    where T is the row-operation matrix (T @ H[:,col_order] = [A|B] in
    systematic form, over GF(2)), and pivot_cols / nonpivot_cols index
    into col_order."""
    m, n = H.shape
    Hperm = H[:, col_order].copy().astype(np.uint8)
    T = np.eye(m, dtype=np.uint8)          # row operations accumulator
    pivot_row = 0
    pivot_cols_list = []
    for col in range(n):
        if pivot_row >= m:
            break
        pivot = None
        for r in range(pivot_row, m):
            if Hperm[r, col] == 1:
                pivot = r
                break
        if pivot is None:
            continue
        if pivot != pivot_row:
            Hperm[[pivot_row, pivot]] = Hperm[[pivot, pivot_row]]
            T[[pivot_row, pivot]] = T[[pivot, pivot_row]]
        for r in range(m):
            if r != pivot_row and Hperm[r, col] == 1:
                Hperm[r] ^= Hperm[pivot_row]
                T[r] ^= T[pivot_row]
        pivot_cols_list.append(col)
        pivot_row += 1
    nonpivot_cols = [c for c in range(n) if c not in set(pivot_cols_list)]
    return T, Hperm, pivot_cols_list, nonpivot_cols


def osd_decode(H: np.ndarray, syndrome: np.ndarray, llrs: np.ndarray,
               osd_order: int = 1) -> tuple[np.ndarray, bool]:
    """
    OSD-w decoder.

    H: check matrix (m × n), binary
    syndrome: target syndrome (m,), binary
    llrs: log-likelihood ratios from BP or channel (n,), float
          Positive = more likely 0; negative = more likely 1.
    osd_order: number of information-bit flip combinations to try (0, 1, or 2)

    Returns (correction, success) where success = syndrome is satisfied.
    """
    m, n = H.shape
    syn = syndrome.astype(np.uint8)

    # Sort by descending reliability
    order = np.argsort(-np.abs(llrs))           # most reliable first
    T, Hperm, p_cols, np_cols = _gf2_systematic(H, order)

    rank = len(p_cols)
    if rank < m:
        # H is rank-deficient in this basis; fall back to hard decision only
        hard = (llrs < 0).astype(np.uint8)
        ok = np.array_equal((H @ hard) % 2, syn)
        return hard, ok

    # Adjusted syndrome under row operations T
    Ts = (T.astype(np.uint64) @ syn.astype(np.uint64)) % 2  # m-vector

    # Sub-matrices in the reliability-ordered, row-reduced form:
    # A (pivot block, m × rank) is identity in reduced form
    # B (nonpivot block, m × (n-rank))
    B = Hperm[:, np_cols]  # shape (m, n-rank)

    hard_info = (llrs[order[np_cols]] < 0).astype(np.uint8)  # hard on info bits

    best_corr = None
    best_weight = n + 1

    # Candidate info bit vectors = hard_info with up to osd_order flips
    # at the LEAST reliable information positions (rightmost in np_cols)
    n_info = len(np_cols)
    flip_pool_size = min(n_info, max(10, osd_order * 5))   # limit candidates
    flip_pool = list(range(n_info - flip_pool_size, n_info))

    candidate_flips = [()]
    for w in range(1, osd_order + 1):
        candidate_flips += list(combinations(flip_pool, w))

    for flips in candidate_flips:
        e_info = hard_info.copy()
        for f in flips:
            e_info[f] ^= 1

        # Solve for check bits: A * e_check = Ts XOR B * e_info (mod 2)
        rhs = (Ts.astype(np.uint64) ^
               (B.astype(np.uint64) @ e_info.astype(np.uint64)) % 2).astype(np.uint8)
        # A is identity in RREF, so e_check = rhs directly
        e_check = rhs[:rank]

        # Assemble correction in original bit order
        e_perm = np.zeros(n, dtype=np.uint8)
        for i, pc in enumerate(p_cols):
            e_perm[pc] = e_check[i]
        for i, npc in enumerate(np_cols):
            e_perm[npc] = e_info[i]

        # Convert from reliability order back to original order
        e_orig = np.empty(n, dtype=np.uint8)
        e_orig[order] = e_perm

        # Verify (should always hold since we solved exactly)
        residual = (H.astype(np.uint64) @ e_orig.astype(np.uint64)) % 2
        if not np.array_equal(residual.astype(np.uint8), syn):
            continue

        w_total = int(e_orig.sum())
        if w_total < best_weight:
            best_weight = w_total
            best_corr = e_orig.copy()

    if best_corr is None:
        hard = (llrs < 0).astype(np.uint8)
        ok = np.array_equal((H @ hard) % 2, syn)
        return hard, ok

    return best_corr, True


def bp_osd_decode(H: np.ndarray, syndrome: np.ndarray, p: float,
                  bp_iters: int = 50, osd_order: int = 1
                  ) -> tuple[np.ndarray, bool]:
    """Full BP+OSD pipeline: run BP, extract LLRs, pass to OSD."""
    # Run BP to get soft-decision LLRs
    ch_llr = float(np.log((1.0 - p) / p))
    m, n = H.shape

    # Re-run BP internals to collect final LLRs
    # (same algorithm as bp_decoder.bp_decode, but returns LLRs not hard decision)
    H_f = H.astype(np.float64)
    syndrome_f = syndrome.astype(np.float64)

    v2c = np.where(H_f.T > 0, ch_llr, 0.0)
    c2v = np.zeros((m, n), dtype=np.float64)
    check_nbrs = [np.nonzero(H[i])[0] for i in range(m)]
    var_nbrs = [np.nonzero(H[:, j])[0] for j in range(n)]

    total_llr = np.full(n, ch_llr)
    for _ in range(bp_iters):
        for i in range(m):
            nbrs = check_nbrs[i]
            if not len(nbrs):
                continue
            s_sign = (-1.0) ** syndrome_f[i]
            for j in nbrs:
                prod = s_sign
                for j2 in nbrs:
                    if j2 != j:
                        t = np.clip(np.tanh(v2c[j2, i] / 2.0), -1+1e-10, 1-1e-10)
                        prod *= t
                prod = np.clip(prod, -1+1e-10, 1-1e-10)
                c2v[i, j] = 2.0 * np.arctanh(prod)
        total_llr = np.full(n, ch_llr)
        for j in range(n):
            for i in var_nbrs[j]:
                total_llr[j] += c2v[i, j]
        for j in range(n):
            for i in var_nbrs[j]:
                v2c[j, i] = ch_llr + sum(c2v[i2, j] for i2 in var_nbrs[j] if i2 != i)

    # ALWAYS pass final BP LLRs to OSD -- even when BP converges.
    # This is the critical fix: standard BP+OSD applies OSD on the
    # reliability ordering from BP's final LLRs regardless of whether
    # BP found a valid codeword. OSD then finds the minimum-weight
    # correction consistent with those reliabilities and the syndrome.
    # Skipping OSD on BP convergence (the previous buggy version) made
    # BP+OSD identical to plain BP in 97% of trials -- the wrong behaviour.
    return osd_decode(H, syndrome, total_llr, osd_order=osd_order)


@dataclass
class OSDResult:
    n: int
    k: int
    p: float
    shots: int
    logical_error_rate: float
    decode_failure_rate: float
    decoder: str = "BP+OSD"


def run_bposd_benchmark(Hx: np.ndarray, Hz: np.ndarray, p: float,
                        shots: int, seed: int = 0,
                        bp_iters: int = 50,
                        osd_order: int = 1) -> OSDResult:
    """Monte Carlo benchmark using the BP+OSD decoder."""
    rng = np.random.default_rng(seed)
    n = Hx.shape[1]
    hx_rank = gf2_rank(Hx)
    k = n - hx_rank - gf2_rank(Hz)
    failures = 0
    decode_failures = 0
    for _ in range(shots):
        e = (rng.random(n) < p).astype(np.uint8)
        syndrome = (Hz.astype(np.int32) @ e.astype(np.int32) % 2).astype(np.uint8)
        correction, converged = bp_osd_decode(Hz, syndrome, p=p,
                                              bp_iters=bp_iters,
                                              osd_order=osd_order)
        if not converged:
            decode_failures += 1
            failures += 1
            continue
        residual = (e ^ correction).astype(np.uint8)
        if not is_in_rowspace(Hx, residual, hx_rank):
            failures += 1
    return OSDResult(n=n, k=k, p=p, shots=shots,
                     logical_error_rate=failures / shots,
                     decode_failure_rate=decode_failures / shots)

"""
Quantum Foundry — Hypergraph Product qLDPC Codes
Attribution: 4 GOD & 4 huMan
License: Apache-2.0

Implements the Tillich-Zémor hypergraph product construction: given two
classical binary parity-check matrices H1 (r1 x n1) and H2 (r2 x n2),
produces a CSS quantum code on n = n1*n2 + r1*r2 qubits.

Reference: J.-P. Tillich, G. Zémor, "Quantum LDPC codes with positive
rate and minimum distance proportional to the square root of the
blocklength," IEEE Trans. Inf. Theory, 2014 (also arXiv:0903.0566).

Scope of this module, stated honestly: this implements and verifies the
CODE CONSTRUCTION (the algebraic object) and its defining correctness
property (CSS orthogonality) and basic parameters (n, k). It does NOT
yet include a decoder or a Monte Carlo logical-error benchmark — that
is explicitly the next step (see research/first-breakthrough-target.md
and control-center-status.md), not claimed as done here. Distance (d)
is not computed — exact minimum-distance computation is NP-hard in
general and this module makes no claim about it.
"""
from __future__ import annotations
import numpy as np
from dataclasses import dataclass
from .gf2_linalg import gf2_rank


def hypergraph_product(H1: np.ndarray, H2: np.ndarray):
    """Construct the CSS quantum code (Hx, Hz) from two classical
    parity-check matrices via the hypergraph product.

    H1: r1 x n1 classical check matrix
    H2: r2 x n2 classical check matrix
    Returns (Hx, Hz), each binary matrices over GF(2), on
    n = n1*n2 + r1*r2 qubits.
    """
    H1 = (H1 % 2).astype(np.uint8)
    H2 = (H2 % 2).astype(np.uint8)
    r1, n1 = H1.shape
    r2, n2 = H2.shape

    I_n1 = np.eye(n1, dtype=np.uint8)
    I_n2 = np.eye(n2, dtype=np.uint8)
    I_r1 = np.eye(r1, dtype=np.uint8)
    I_r2 = np.eye(r2, dtype=np.uint8)

    def kron2(a, b):
        return (np.kron(a, b) % 2).astype(np.uint8)

    Hx = np.hstack([kron2(H1, I_n2), kron2(I_r1, H2.T)]) % 2
    Hz = np.hstack([kron2(I_n1, H2), kron2(H1.T, I_r2)]) % 2
    return Hx.astype(np.uint8), Hz.astype(np.uint8)


def css_orthogonal(Hx: np.ndarray, Hz: np.ndarray) -> bool:
    """The fundamental CSS correctness condition: X-checks and Z-checks
    must commute, i.e. Hx @ Hz^T = 0 (mod 2). If this fails, the
    'code' is not actually a valid quantum code — this must be checked
    for every construction, not assumed."""
    product = (Hx.astype(np.uint64) @ Hz.T.astype(np.uint64)) % 2
    return bool(np.all(product == 0))


@dataclass
class CodeParameters:
    n: int          # number of physical qubits
    rank_hx: int
    rank_hz: int
    k: int          # number of logical qubits
    hx_shape: tuple
    hz_shape: tuple
    hx_row_weight_mean: float
    hx_col_weight_mean: float
    hz_row_weight_mean: float
    hz_col_weight_mean: float


def code_parameters(Hx: np.ndarray, Hz: np.ndarray) -> CodeParameters:
    """Compute [[n, k]] parameters and sparsity statistics. k uses the
    standard CSS dimension formula k = n - rank(Hx) - rank(Hz), valid
    exactly when Hx and Hz satisfy the orthogonality condition (checked
    separately via css_orthogonal — this function does not re-check it,
    callers must verify orthogonality first)."""
    n = Hx.shape[1]
    rx = gf2_rank(Hx)
    rz = gf2_rank(Hz)
    k = n - rx - rz
    return CodeParameters(
        n=n, rank_hx=rx, rank_hz=rz, k=k,
        hx_shape=Hx.shape, hz_shape=Hz.shape,
        hx_row_weight_mean=float(Hx.sum(axis=1).mean()),
        hx_col_weight_mean=float(Hx.sum(axis=0).mean()),
        hz_row_weight_mean=float(Hz.sum(axis=1).mean()),
        hz_col_weight_mean=float(Hz.sum(axis=0).mean()),
    )


def random_ldpc_seed(n: int, r: int, col_weight: int, seed: int) -> np.ndarray:
    """Generate a small illustrative classical LDPC seed matrix (fixed
    column weight, random support) for use as H1/H2 in the hypergraph
    product. This is NOT claimed to be an optimized classical LDPC
    code — it is only a concrete, reproducible example to build and
    test the quantum construction against. Real qLDPC work would use
    specifically-designed classical codes (e.g. from algebraic
    constructions), which is future work, not this module's claim."""
    rng = np.random.default_rng(seed)
    H = np.zeros((r, n), dtype=np.uint8)
    for col in range(n):
        rows = rng.choice(r, size=min(col_weight, r), replace=False)
        H[rows, col] = 1
    return H


def hamming_15_11_check_matrix() -> np.ndarray:
    """The classical [15,11,3] Hamming code check matrix: columns are
    the 15 distinct nonzero 4-bit binary patterns. Same structural
    guarantee as the [7,4,3] version, at larger blocklength — used to
    test whether the distance advantage from structured seed codes
    holds as the resulting qLDPC instance scales up."""
    H = np.zeros((4, 15), dtype=np.uint8)
    for col in range(1, 16):
        bits = [(col >> (3 - b)) & 1 for b in range(4)]
        H[:, col - 1] = bits
    return H


def hamming_7_4_check_matrix() -> np.ndarray:
    """The classical [7,4,3] Hamming code check matrix: columns are the
    7 distinct nonzero 3-bit binary patterns. This is a STRUCTURED
    classical code with a known, guaranteed minimum distance of 3
    (every column is distinct and nonzero, so any single-bit error
    produces a unique nonzero syndrome — a standard, easily-verified
    property, not a numerical claim requiring simulation to check).
    Used to test whether replacing the earlier random unstructured seed
    matrices with a code that has an actual distance guarantee improves
    the resulting qLDPC instance's practical distance (see
    research/first-breakthrough-target.md, 'next iteration' note)."""
    H = np.array([
        [0, 0, 0, 1, 1, 1, 1],
        [0, 1, 1, 0, 0, 1, 1],
        [1, 0, 1, 0, 1, 0, 1],
    ], dtype=np.uint8)
    return H


# ---------------------------------------------------------------------
# Decoder — Gallager serial bit-flip decoder (a standard, simple LDPC
# baseline; explicitly NOT belief propagation or OSD, which are the
# stronger decoders the field actually uses for qLDPC — this is a
# correctness-first baseline, not a claim of competitive performance).
# ---------------------------------------------------------------------

def bitflip_decode(H: np.ndarray, syndrome: np.ndarray, max_iters: int = 100):
    """Serial Gallager bit-flip decoder for syndrome decoding: find a
    low-weight e such that H @ e = syndrome (mod 2). At each iteration,
    flips the single bit touching the most currently-unsatisfied
    checks (greedy, not globally optimal). Returns (correction,
    converged) -- converged=False means the syndrome was not fully
    resolved within max_iters, which is a decoder failure, distinct
    from (but counted alongside) a logical error in the benchmark
    below."""
    n = H.shape[1]
    e = np.zeros(n, dtype=np.uint8)
    check_lists = [np.nonzero(H[:, j])[0] for j in range(n)]
    syndrome = syndrome.astype(np.uint8)
    for _ in range(max_iters):
        unsatisfied = ((H @ e) % 2).astype(np.uint8) ^ syndrome
        if not unsatisfied.any():
            return e, True
        best_j, best_score = -1, 0
        for j in range(n):
            cl = check_lists[j]
            score = int(unsatisfied[cl].sum()) if len(cl) > 0 else 0
            if score > best_score:
                best_score = score
                best_j = j
        if best_j == -1:
            break
        e[best_j] ^= 1
    unsatisfied = ((H @ e) % 2).astype(np.uint8) ^ syndrome
    return e, not unsatisfied.any()


def is_in_rowspace(H: np.ndarray, vector: np.ndarray, h_rank: int = None) -> bool:
    """Check whether `vector` is a linear combination of the rows of H
    over GF(2) -- i.e. whether it's 'trivial' (a product of the
    stabilizer generators H represents). Uses a rank argument: adding
    a vector already in the row space does not increase rank."""
    if h_rank is None:
        h_rank = gf2_rank(H)
    stacked = np.vstack([H, vector.reshape(1, -1)])
    return gf2_rank(stacked) == h_rank


@dataclass
class QLDPCBenchmarkResult:
    n: int
    k: int
    p: float
    shots: int
    logical_error_rate: float
    decode_failure_rate: float


def run_qldpc_benchmark(Hx: np.ndarray, Hz: np.ndarray, p: float, shots: int,
                         seed: int = 0, max_iters: int = 100) -> QLDPCBenchmarkResult:
    """Monte Carlo benchmark: inject independent X (bit-flip) errors at
    rate p, decode via the bit-flip decoder using Hz as the syndrome
    check matrix, classify the residual as trivial (in rowspace of Hx,
    i.e. a product of X-stabilizers -- no logical effect) or a logical
    error (not in that rowspace) via the rank argument above. A
    decoder non-convergence is also counted as a failure."""
    rng = np.random.default_rng(seed)
    n = Hx.shape[1]
    hx_rank = gf2_rank(Hx)
    k = n - hx_rank - gf2_rank(Hz)
    failures = 0
    decode_failures = 0
    for _ in range(shots):
        e = (rng.random(n) < p).astype(np.uint8)
        syndrome = ((Hz.astype(np.uint64) @ e.astype(np.uint64)) % 2).astype(np.uint8)
        correction, converged = bitflip_decode(Hz, syndrome, max_iters=max_iters)
        if not converged:
            decode_failures += 1
            failures += 1
            continue
        residual = (e ^ correction).astype(np.uint8)
        if not is_in_rowspace(Hx, residual, h_rank=hx_rank):
            failures += 1
    return QLDPCBenchmarkResult(
        n=n, k=k, p=p, shots=shots,
        logical_error_rate=failures / shots,
        decode_failure_rate=decode_failures / shots,
    )

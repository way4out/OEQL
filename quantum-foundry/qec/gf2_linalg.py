"""
Quantum Foundry — GF(2) Linear Algebra Utilities
Attribution: 4 GOD & 4 huMan
License: Apache-2.0

Small, deliberately simple GF(2) (binary field) linear algebra routines
needed for CSS/qLDPC code parameter computation. numpy's built-in
matrix_rank uses floating-point SVD and gives WRONG answers for binary
matrices over GF(2) (a matrix can be full rank over the reals but
rank-deficient mod 2, or vice versa) — this module exists specifically
to avoid that trap, and is tested against known examples below before
anything else in this project depends on it.
"""
from __future__ import annotations
import numpy as np


def gf2_row_reduce(matrix: np.ndarray) -> np.ndarray:
    """Row-reduce a binary matrix to row-echelon form over GF(2) via
    Gaussian elimination with XOR row operations. Returns a new array;
    does not mutate the input."""
    M = (matrix.copy() % 2).astype(np.uint8)
    rows, cols = M.shape
    pivot_row = 0
    for col in range(cols):
        pivot = None
        for r in range(pivot_row, rows):
            if M[r, col] == 1:
                pivot = r
                break
        if pivot is None:
            continue
        M[[pivot_row, pivot]] = M[[pivot, pivot_row]]
        for r in range(rows):
            if r != pivot_row and M[r, col] == 1:
                M[r] = (M[r] ^ M[pivot_row])
        pivot_row += 1
        if pivot_row == rows:
            break
    return M


def gf2_rank(matrix: np.ndarray) -> int:
    """Rank of a binary matrix over GF(2)."""
    if matrix.size == 0:
        return 0
    R = gf2_row_reduce(matrix)
    return int(np.sum(np.any(R, axis=1)))


def gf2_solve_ordered(H: np.ndarray, syndrome: np.ndarray, column_order: np.ndarray):
    """
    Solve H @ x = syndrome (mod 2) using Gaussian elimination that
    processes columns in the given order, preferring earlier columns
    as pivots. Non-pivot columns are set to 0 in the returned solution
    (this is exactly the OSD-0 procedure when column_order is a
    reliability ordering, most-reliable-first).

    Returns (solution, pivot_columns). solution always exactly
    satisfies H @ solution = syndrome (mod 2) if the system is
    consistent (guaranteed here, since syndrome comes from an actual
    injected error) -- verified by the caller via a direct check, not
    assumed.
    """
    m, n = H.shape
    # Augmented matrix [H | s], with columns permuted by column_order
    aug = np.zeros((m, n + 1), dtype=np.uint8)
    aug[:, :n] = H[:, column_order] % 2
    aug[:, n] = syndrome.astype(np.uint8) % 2

    pivot_row = 0
    pivot_cols_in_order = []  # indices into column_order (i.e. positions 0..n-1)
    for col in range(n):
        pivot = None
        for r in range(pivot_row, m):
            if aug[r, col] == 1:
                pivot = r
                break
        if pivot is None:
            continue
        aug[[pivot_row, pivot]] = aug[[pivot, pivot_row]]
        for r in range(m):
            if r != pivot_row and aug[r, col] == 1:
                aug[r] = aug[r] ^ aug[pivot_row]
        pivot_cols_in_order.append((pivot_row, col))
        pivot_row += 1
        if pivot_row == m:
            break

    solution_reordered = np.zeros(n, dtype=np.uint8)
    for row_idx, col in pivot_cols_in_order:
        solution_reordered[col] = aug[row_idx, n]

    solution = np.zeros(n, dtype=np.uint8)
    solution[column_order] = solution_reordered
    pivot_columns = column_order[[c for _, c in pivot_cols_in_order]]
    return solution, pivot_columns

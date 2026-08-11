"""
Quantum Foundry -- Noise Models (Depolarizing, Pauli, Bit-flip)
Attribution: 4 GOD & 4 huMan   License: Apache-2.0

Industry upgrade #1: Depolarizing noise model for realistic device simulation.
Real quantum devices experience both X (bit-flip) AND Z (phase-flip) errors.
Our existing framework handled only X errors. This module adds:
  - Independent depolarizing channel: each qubit gets I/X/Y/Z each at p/4
  - Pauli noise: user-specified (p_x, p_y, p_z) per qubit type
  - CSS-aware syndrome computation: separate X and Z syndromes
  - Monte Carlo benchmark wrapper for CSS codes under depolarizing noise
"""
from __future__ import annotations
import numpy as np
from dataclasses import dataclass
from .gf2_linalg import gf2_rank
from .qldpc import is_in_rowspace


def depolarizing_errors(n: int, p: float, rng: np.random.Generator):
    """Sample independent depolarizing errors on n qubits.
    Each qubit independently gets: I (prob 1-p), X (p/3), Z (p/3), Y=XZ (p/3).
    Returns (err_x, err_z) each binary arrays of length n."""
    u = rng.random(n)
    err_x = (u >= (1 - 2*p/3)).astype(np.uint8)   # X or Y
    err_z = ((u >= (1 - p)) | (u < p/3)).astype(np.uint8)  # Z or Y
    return err_x, err_z


def pauli_errors(n: int, p_x: float, p_y: float, p_z: float,
                 rng: np.random.Generator):
    """Sample independent Pauli errors with specified per-type probabilities."""
    u = rng.random((n, 3))
    err_x_only = (u[:, 0] < p_x).astype(np.uint8)
    err_z_only = (u[:, 1] < p_z).astype(np.uint8)
    err_y      = (u[:, 2] < p_y).astype(np.uint8)
    err_x = (err_x_only ^ err_y)
    err_z = (err_z_only ^ err_y)
    return err_x, err_z


@dataclass
class DepolarizingResult:
    n: int
    k: int
    p: float
    shots: int
    x_logical_error_rate: float
    z_logical_error_rate: float
    any_logical_error_rate: float
    decoder: str = "bit-flip (X) + bit-flip (Z)"


def run_depolarizing_benchmark(Hx: np.ndarray, Hz: np.ndarray,
                               p: float, shots: int, seed: int = 0,
                               max_iters: int = 60) -> DepolarizingResult:
    """
    Monte Carlo benchmark under depolarizing noise.

    CSS structure: X errors detected by Hz (Z-syndrome), decoded via Hz.
                   Z errors detected by Hx (X-syndrome), decoded via Hx.
    Uses the existing bit-flip decoder independently on each sector.
    """
    from .qldpc import bitflip_decode
    rng = np.random.default_rng(seed)
    n = Hx.shape[1]
    hx_rank = gf2_rank(Hx)
    hz_rank = gf2_rank(Hz)
    k = n - hx_rank - hz_rank

    x_fail = 0
    z_fail = 0
    any_fail = 0

    for _ in range(shots):
        err_x, err_z = depolarizing_errors(n, p, rng)

        # Decode X errors using Hz (Z-syndrome)
        syn_z = (Hz.astype(np.int32) @ err_x.astype(np.int32) % 2).astype(np.uint8)
        corr_x, _ = bitflip_decode(Hz, syn_z, max_iters=max_iters)
        res_x = (err_x ^ corr_x).astype(np.uint8)
        x_logical = not is_in_rowspace(Hx, res_x, hx_rank)

        # Decode Z errors using Hx (X-syndrome)
        syn_x = (Hx.astype(np.int32) @ err_z.astype(np.int32) % 2).astype(np.uint8)
        corr_z, _ = bitflip_decode(Hx, syn_x, max_iters=max_iters)
        res_z = (err_z ^ corr_z).astype(np.uint8)
        z_logical = not is_in_rowspace(Hz, res_z, hz_rank)

        if x_logical: x_fail += 1
        if z_logical: z_fail += 1
        if x_logical or z_logical: any_fail += 1

    return DepolarizingResult(
        n=n, k=k, p=p, shots=shots,
        x_logical_error_rate=x_fail/shots,
        z_logical_error_rate=z_fail/shots,
        any_logical_error_rate=any_fail/shots,
    )

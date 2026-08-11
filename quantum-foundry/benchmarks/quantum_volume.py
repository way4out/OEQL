"""
Quantum Foundry -- Quantum Volume Benchmark
Attribution: 4 GOD & 4 huMan   License: Apache-2.0

Industry upgrade #2: Quantum Volume (QV) -- IBM's industry-standard metric
for benchmarking quantum processors (Cross et al. 2019).

QV = 2^d where d is the largest number of qubits for which a random
square circuit (d qubits, d layers of random SU(4) on paired qubits)
achieves heavy-output probability > 2/3.

Since our simulator is exact (not hardware), this computes the IDEAL QV
from the noise-free statevector -- the upper bound any device could achieve.
Use with noise models (noise_models.py) for realistic QV estimation.
"""
from __future__ import annotations
import numpy as np
from dataclasses import dataclass
import sys
sys.path.insert(0, "..")
from core.statevector import Op, StateVectorSimulator


def _random_su4(rng: np.random.Generator) -> np.ndarray:
    """Sample a Haar-random 4x4 unitary via QR decomposition of a
    complex Gaussian matrix (standard method, not a full SU(4) sample
    but sufficient for QV purposes -- QV uses SU(4) up to global phase)."""
    Z = (rng.standard_normal((4, 4)) + 1j * rng.standard_normal((4, 4))) / np.sqrt(2)
    Q, R = np.linalg.qr(Z)
    D = np.diag(R) / np.abs(np.diag(R))
    return Q * D[np.newaxis, :]


def _apply_2q_unitary(sim: StateVectorSimulator, U4: np.ndarray,
                       q0: int, q1: int) -> None:
    """Apply a 4x4 unitary to qubits q0, q1 of the statevector."""
    sim._apply_2q(U4.reshape(2, 2, 2, 2), q0, q1)


def qv_circuit_probs(n: int, depth: int, seed: int) -> np.ndarray:
    """Run one QV circuit of n qubits and depth d layers.
    Returns the exact probability distribution over all 2^n bitstrings."""
    rng = np.random.default_rng(seed)
    sim = StateVectorSimulator(n)
    qubits = list(range(n))
    for _ in range(depth):
        # Random pairing of qubits
        perm = rng.permutation(qubits).tolist()
        pairs = [(perm[i], perm[i+1]) for i in range(0, n - (n % 2), 2)]
        for q0, q1 in pairs:
            U = _random_su4(rng)
            _apply_2q_unitary(sim, U, q0, q1)
    return sim.probabilities()


def quantum_volume(n: int, num_trials: int = 100, seed: int = 0) -> dict:
    """
    Compute the ideal Quantum Volume for circuits of width and depth n.

    Returns a dict with:
      'qv': 2^n (the ideal QV -- exact sim always achieves this)
      'heavy_output_prob_mean': mean heavy-output probability across trials
      'heavy_output_prob_std': std dev
      'pass_fraction': fraction of trials where HOP > 2/3
      'n': qubit count, 'depth': circuit depth
    """
    rng_seed = seed
    hops = []
    for trial in range(num_trials):
        probs = qv_circuit_probs(n, n, seed=rng_seed + trial)
        median = np.median(probs)
        heavy = probs[probs > median]
        hop = float(heavy.sum())
        hops.append(hop)
    hops = np.array(hops)
    pass_frac = float((hops > 2/3).mean())
    return {
        'n': n, 'depth': n,
        'qv': 2**n if pass_frac > 0.97 else None,
        'heavy_output_prob_mean': float(hops.mean()),
        'heavy_output_prob_std': float(hops.std()),
        'pass_fraction': pass_frac,
        'note': ('Ideal (noise-free) QV -- actual device QV will be lower '
                 'due to gate errors and decoherence'),
    }

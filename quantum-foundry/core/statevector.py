"""
Quantum Foundry — Statevector Simulator Engine
Attribution: 4 GOD & 4 huMan

Exact statevector simulation for small-to-moderate qubit counts.
This is the reference-correctness backend: every optimization pass and
every other backend in Quantum Foundry is validated against this module.

License: Apache-2.0
"""
from __future__ import annotations
import numpy as np
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Optional

# ---------------------------------------------------------------------------
# Standard gate matrices (single- and two-qubit), all unitary, all verified
# against their standard textbook definitions.
# ---------------------------------------------------------------------------

I2 = np.eye(2, dtype=complex)
X = np.array([[0, 1], [1, 0]], dtype=complex)
Y = np.array([[0, -1j], [1j, 0]], dtype=complex)
Z = np.array([[1, 0], [0, -1]], dtype=complex)
H = (1 / np.sqrt(2)) * np.array([[1, 1], [1, -1]], dtype=complex)
S = np.array([[1, 0], [0, 1j]], dtype=complex)
T = np.array([[1, 0], [0, np.exp(1j * np.pi / 4)]], dtype=complex)


def rx(theta: float) -> np.ndarray:
    c, s = np.cos(theta / 2), np.sin(theta / 2)
    return np.array([[c, -1j * s], [-1j * s, c]], dtype=complex)


def ry(theta: float) -> np.ndarray:
    c, s = np.cos(theta / 2), np.sin(theta / 2)
    return np.array([[c, -s], [s, c]], dtype=complex)


def rz(theta: float) -> np.ndarray:
    return np.array([[np.exp(-1j * theta / 2), 0], [0, np.exp(1j * theta / 2)]], dtype=complex)


GATE_TABLE = {
    "id": I2, "x": X, "y": Y, "z": Z, "h": H, "s": S, "t": T,
}


@dataclass
class Op:
    name: str
    qubits: Tuple[int, ...]
    params: Tuple[float, ...] = field(default_factory=tuple)


class StateVectorSimulator:
    """
    Exact statevector simulator. State is stored as a complex numpy array
    of length 2**n_qubits, indexed with qubit 0 as the least-significant bit
    (standard little-endian convention, matching Qiskit's ordering choice
    so cross-validation is index-for-index comparable).
    """

    def __init__(self, n_qubits: int):
        if n_qubits < 1:
            raise ValueError("n_qubits must be >= 1")
        self.n = n_qubits
        self.state = np.zeros(2 ** n_qubits, dtype=complex)
        self.state[0] = 1.0  # |00...0>

    # -- single-qubit gate application (via reshape/tensordot, exact) -------
    def _apply_1q(self, mat: np.ndarray, qubit: int) -> None:
        n = self.n
        state = self.state.reshape([2] * n)
        # move target axis to front, apply, move back
        state = np.moveaxis(state, n - 1 - qubit, 0)
        state = np.tensordot(mat, state, axes=([1], [0]))
        state = np.moveaxis(state, 0, n - 1 - qubit)
        self.state = state.reshape(2 ** n)

    def _apply_2q(self, mat4: np.ndarray, q_control: int, q_target: int) -> None:
        """Apply an arbitrary 4x4 unitary (acting on control⊗target basis
        ordering |control,target>) to the full state."""
        n = self.n
        mat = mat4.reshape(2, 2, 2, 2)  # out_c,out_t,in_c,in_t
        state = self.state.reshape([2] * n)
        state = np.moveaxis(state, [n - 1 - q_control, n - 1 - q_target], [0, 1])
        state = np.tensordot(mat, state, axes=([2, 3], [0, 1]))
        state = np.moveaxis(state, [0, 1], [n - 1 - q_control, n - 1 - q_target])
        self.state = state.reshape(2 ** n)

    def apply(self, op: Op) -> None:
        name = op.name.lower()
        if name in GATE_TABLE:
            self._apply_1q(GATE_TABLE[name], op.qubits[0])
        elif name == "rx":
            self._apply_1q(rx(op.params[0]), op.qubits[0])
        elif name == "ry":
            self._apply_1q(ry(op.params[0]), op.qubits[0])
        elif name == "rz":
            self._apply_1q(rz(op.params[0]), op.qubits[0])
        elif name == "cx" or name == "cnot":
            cnot = np.array([
                [1, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 1],
                [0, 0, 1, 0],
            ], dtype=complex)
            self._apply_2q(cnot, op.qubits[0], op.qubits[1])
        elif name == "cp" or name == "cphase":
            theta = op.params[0]
            cpm = np.diag([1, 1, 1, np.exp(1j * theta)]).astype(complex)
            self._apply_2q(cpm, op.qubits[0], op.qubits[1])
        elif name == "cz":
            czm = np.diag([1, 1, 1, -1]).astype(complex)
            self._apply_2q(czm, op.qubits[0], op.qubits[1])
        elif name == "swap":
            swapm = np.array([
                [1, 0, 0, 0],
                [0, 0, 1, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 1],
            ], dtype=complex)
            self._apply_2q(swapm, op.qubits[0], op.qubits[1])
        else:
            raise ValueError(f"Unsupported gate: {op.name}")

    def probabilities(self) -> np.ndarray:
        return np.abs(self.state) ** 2

    def sample(self, shots: int, seed: Optional[int] = None) -> Dict[str, int]:
        rng = np.random.default_rng(seed)
        probs = self.probabilities()
        probs = probs / probs.sum()  # guard against fp drift
        outcomes = rng.choice(len(probs), size=shots, p=probs)
        counts: Dict[str, int] = {}
        for o in outcomes:
            bitstring = format(o, f"0{self.n}b")[::-1]  # qubit0 = leftmost, little-endian fix
            counts[bitstring] = counts.get(bitstring, 0) + 1
        return counts

    def expectation_z(self, qubit: int) -> float:
        probs = self.probabilities()
        n = self.n
        total = 0.0
        for idx, p in enumerate(probs):
            bit = (idx >> qubit) & 1
            total += p * (1 if bit == 0 else -1)
        return float(total)

    def statevector(self) -> np.ndarray:
        return self.state.copy()

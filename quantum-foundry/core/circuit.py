"""
Quantum Foundry — Circuit IR (QF-IR)
Attribution: 4 GOD & 4 huMan
License: Apache-2.0

A minimal, explicit intermediate representation for quantum circuits.
This is the shared contract between the compiler front end, the optimizer,
and every simulator/backend.
"""
from __future__ import annotations
import math
from dataclasses import dataclass, field
from typing import List, Tuple
from .statevector import Op, StateVectorSimulator


@dataclass
class Circuit:
    n_qubits: int
    ops: List[Op] = field(default_factory=list)
    name: str = "circuit"

    # -- builder methods (fluent API) ---------------------------------
    def h(self, q: int) -> "Circuit":
        self.ops.append(Op("h", (q,))); return self

    def x(self, q: int) -> "Circuit":
        self.ops.append(Op("x", (q,))); return self

    def y(self, q: int) -> "Circuit":
        self.ops.append(Op("y", (q,))); return self

    def z(self, q: int) -> "Circuit":
        self.ops.append(Op("z", (q,))); return self

    def s(self, q: int) -> "Circuit":
        self.ops.append(Op("s", (q,))); return self

    def t(self, q: int) -> "Circuit":
        self.ops.append(Op("t", (q,))); return self

    def rx(self, q: int, theta: float) -> "Circuit":
        self.ops.append(Op("rx", (q,), (theta,))); return self

    def ry(self, q: int, theta: float) -> "Circuit":
        self.ops.append(Op("ry", (q,), (theta,))); return self

    def rz(self, q: int, theta: float) -> "Circuit":
        self.ops.append(Op("rz", (q,), (theta,))); return self

    def cx(self, c: int, t: int) -> "Circuit":
        self.ops.append(Op("cx", (c, t))); return self

    def cz(self, c: int, t: int) -> "Circuit":
        self.ops.append(Op("cz", (c, t))); return self

    def swap(self, a: int, b: int) -> "Circuit":
        self.ops.append(Op("swap", (a, b))); return self

    def cp(self, c: int, t: int, theta: float) -> "Circuit":
        self.ops.append(Op("cp", (c, t), (theta,))); return self

    # -- gate-count / depth metrics (used by optimizer + benchmarks) ---
    def gate_count(self) -> int:
        return len(self.ops)

    def two_qubit_gate_count(self) -> int:
        return sum(1 for op in self.ops if len(op.qubits) == 2)

    def depth(self) -> int:
        last_layer = [0] * self.n_qubits
        for op in self.ops:
            layer = max(last_layer[q] for q in op.qubits) + 1
            for q in op.qubits:
                last_layer[q] = layer
        return max(last_layer) if last_layer else 0

    # -- execution -------------------------------------------------------
    def run(self, shots: int = 0, seed: int | None = None):
        sim = StateVectorSimulator(self.n_qubits)
        for op in self.ops:
            sim.apply(op)
        if shots > 0:
            return sim.sample(shots, seed=seed)
        return sim.statevector()

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "n_qubits": self.n_qubits,
            "ops": [
                {"name": op.name, "qubits": list(op.qubits), "params": list(op.params)}
                for op in self.ops
            ],
        }

    @staticmethod
    def from_dict(d: dict) -> "Circuit":
        c = Circuit(n_qubits=d["n_qubits"], name=d.get("name", "circuit"))
        for op in d["ops"]:
            c.ops.append(Op(op["name"], tuple(op["qubits"]), tuple(op.get("params", ()))))
        return c


# ---------------------------------------------------------------------
# Canonical benchmark circuits (used across §5/§9/§10 test suites)
# ---------------------------------------------------------------------

def bell_state() -> Circuit:
    c = Circuit(2, name="bell_state")
    c.h(0).cx(0, 1)
    return c


def ghz_state(n: int) -> Circuit:
    c = Circuit(n, name=f"ghz_{n}")
    c.h(0)
    for q in range(1, n):
        c.cx(0, q)
    return c


def qft(n: int) -> Circuit:
    """Standard textbook QFT circuit (Nielsen & Chuang convention),
    built directly from H and controlled-phase gates."""
    c = Circuit(n, name=f"qft_{n}")
    for j in range(n):
        c.h(j)
        for k in range(j + 1, n):
            angle = math.pi / (2 ** (k - j))
            c.cp(k, j, angle)
    for i in range(n // 2):
        c.swap(i, n - 1 - i)
    return c

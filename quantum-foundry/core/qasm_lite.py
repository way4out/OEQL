"""
Quantum Foundry — QASM-lite Parser (compiler front end, spec §9)
Attribution: 4 GOD & 4 huMan
License: Apache-2.0

A minimal, well-defined text format subset compatible in spirit with
OpenQASM's gate-call syntax. This is intentionally a small, auditable
front end — not a full OpenQASM3 implementation — so its correctness can
be verified line-by-line. Full OpenQASM3/QIR ingestion is a documented
follow-on task (see spec §9, "ENGINEERING-READY").

Grammar (one statement per line):
    qubits N
    h Q
    x Q / y Q / z Q / s Q / t Q
    rx Q THETA / ry Q THETA / rz Q THETA
    cx C T / cz C T / swap A B / cp C T THETA
    # comment lines and blank lines ignored
"""
from __future__ import annotations
from .circuit import Circuit

_ONE_Q = {"h", "x", "y", "z", "s", "t"}
_ONE_Q_PARAM = {"rx", "ry", "rz"}
_TWO_Q = {"cx", "cz", "swap"}
_TWO_Q_PARAM = {"cp"}


def parse(source: str) -> Circuit:
    circuit: Circuit | None = None
    for lineno, raw in enumerate(source.splitlines(), start=1):
        line = raw.split("#", 1)[0].strip()
        if not line:
            continue
        parts = line.split()
        op = parts[0].lower()

        if op == "qubits":
            if circuit is not None:
                raise SyntaxError(f"line {lineno}: 'qubits' declared twice")
            circuit = Circuit(n_qubits=int(parts[1]))
            continue

        if circuit is None:
            raise SyntaxError(f"line {lineno}: 'qubits N' must be the first statement")

        if op in _ONE_Q:
            q = int(parts[1])
            getattr(circuit, op)(q)
        elif op in _ONE_Q_PARAM:
            q = int(parts[1]); theta = float(parts[2])
            getattr(circuit, op)(q, theta)
        elif op in _TWO_Q:
            a, b = int(parts[1]), int(parts[2])
            getattr(circuit, op)(a, b)
        elif op in _TWO_Q_PARAM:
            a, b, theta = int(parts[1]), int(parts[2]), float(parts[3])
            circuit.cp(a, b, theta)
        else:
            raise SyntaxError(f"line {lineno}: unrecognized instruction '{op}'")

    if circuit is None:
        raise SyntaxError("empty program: missing 'qubits N' declaration")
    return circuit


def to_source(circuit: Circuit) -> str:
    lines = [f"qubits {circuit.n_qubits}"]
    for op in circuit.ops:
        if op.params:
            args = " ".join(str(q) for q in op.qubits) + " " + " ".join(str(p) for p in op.params)
        else:
            args = " ".join(str(q) for q in op.qubits)
        lines.append(f"{op.name} {args}")
    return "\n".join(lines)

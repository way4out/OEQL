"""
Quantum Foundry -- Fault-Tolerant Resource Estimator
Attribution: 4 GOD & 4 huMan   License: Apache-2.0

Industry upgrade #3: estimates physical qubit and gate overhead for
fault-tolerant execution of a logical quantum circuit.

Formulas based on established surface-code resource estimation literature.
All results are estimates with stated assumptions, not hardware measurements.
"""
from __future__ import annotations
import math
from dataclasses import dataclass
import sys; sys.path.insert(0,"..")
from core.circuit import Circuit


@dataclass
class ResourceEstimate:
    # Circuit metrics (exact)
    n_logical_qubits: int
    gate_count: int
    two_qubit_gate_count: int
    circuit_depth: int
    t_gate_count: int
    clifford_gate_count: int

    # Fault-tolerant estimates (rough, stated assumptions below)
    surface_code_distance: int
    physical_qubits_per_logical: int
    total_data_qubits: int
    t_factory_qubits: int
    total_physical_qubits: int
    estimated_runtime_surface_cycles: int

    # Assumptions (document honestly)
    assumptions: list[str]


T_GATES = {'t', 'tdg'}
CLIFFORD_GATES = {'h', 'x', 'y', 'z', 's', 'sdg', 'cx', 'cz', 'swap', 'rx', 'ry', 'rz', 'cp'}


def estimate_resources(circuit: Circuit,
                       target_logical_error_rate: float = 1e-3,
                       physical_gate_error_rate: float = 1e-3) -> ResourceEstimate:
    """
    Estimate fault-tolerant resource requirements for a Circuit.

    Assumptions (stated, not hidden):
    1. Surface code with physical error rate p = physical_gate_error_rate.
    2. Code distance d chosen so (p/p_th)^((d+1)/2) < target_logical_error_rate
       per gate, with threshold p_th = 0.01 (1% -- standard surface code threshold).
    3. T-gate magic state distillation: ~15 physical qubits per T-factory
       (rough estimate from standard 15-to-1 distillation protocol).
    4. These are ORDER-OF-MAGNITUDE estimates for planning purposes.
       Real resource estimation requires full compilation and device-specific params.
    """
    n_q = circuit.n_qubits
    t_count = sum(1 for op in circuit.ops if op.name.lower() in T_GATES)
    cliff_count = sum(1 for op in circuit.ops if op.name.lower() not in T_GATES)
    total_gates = len(circuit.ops)
    depth = circuit.depth()
    two_q = circuit.two_qubit_gate_count()

    # Surface code distance (from logical error rate target)
    p_th = 0.01  # surface code threshold ~1%
    ratio = physical_gate_error_rate / p_th
    if ratio >= 1.0:
        d = 99  # below threshold, cannot correct
    else:
        # (ratio)^((d+1)/2) < target_logical_error_rate / total_gates
        per_gate_budget = target_logical_error_rate / max(total_gates, 1)
        if per_gate_budget <= 0:
            d = 99
        else:
            d = math.ceil(2 * math.log(per_gate_budget) / math.log(ratio) - 1)
            d = max(d, 3)  # minimum distance 3
            if d % 2 == 0:
                d += 1  # odd distance

    phys_per_logical = d * d  # standard surface code: d^2 data + ~d^2 ancilla
    data_qubits = n_q * phys_per_logical * 2  # x2 for data + ancilla
    t_factory_q = t_count * 15  # rough 15-to-1 distillation
    total_q = data_qubits + t_factory_q
    runtime_cycles = depth * d * 10  # ~d*10 surface code cycles per logical gate

    return ResourceEstimate(
        n_logical_qubits=n_q,
        gate_count=total_gates,
        two_qubit_gate_count=two_q,
        circuit_depth=depth,
        t_gate_count=t_count,
        clifford_gate_count=cliff_count,
        surface_code_distance=d,
        physical_qubits_per_logical=phys_per_logical,
        total_data_qubits=data_qubits,
        t_factory_qubits=t_factory_q,
        total_physical_qubits=total_q,
        estimated_runtime_surface_cycles=runtime_cycles,
        assumptions=[
            f"Surface code threshold: {p_th:.1%}",
            f"Physical gate error rate: {physical_gate_error_rate:.2e}",
            f"Target logical error rate: {target_logical_error_rate:.2e}",
            "T-gate cost: 15 physical qubits per T-factory (15-to-1 protocol)",
            "Runtime: d*10 surface-code cycles per logical gate layer",
            "ORDER-OF-MAGNITUDE ONLY -- not suitable for hardware procurement",
        ],
    )

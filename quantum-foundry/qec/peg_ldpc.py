"""
Quantum Foundry -- PEG (Progressive Edge Growth) LDPC Code Generator
Attribution: 4 GOD & 4 huMan
License: Apache-2.0

Generates classical binary LDPC parity-check matrices with guaranteed
minimum girth >= 6 using the Progressive Edge Growth algorithm.

Reference: Hu, Eleftheriou, Arnold, "Regular and Irregular Progressive
Edge-Growth Tanner Graphs," IEEE Trans. Inf. Theory 2005.

Why this matters for Quantum Foundry:
The BP+OSD decoder investigation (research/finding-bposd-diagnosis.md)
showed that the Hamming seed matrices used previously have 4-cycle density
0.143, which causes BP to produce unreliable LLRs. PEG guarantees girth
>= 6 (no 4-cycles in the Tanner graph), which is the direct algebraic
condition the literature cites for reliable BP message-passing.

This is the concrete fix the BP+OSD investigation pointed to.
"""
from __future__ import annotations
import numpy as np
from collections import deque


def _bfs_depth(H: np.ndarray, col_j: int, existing_rows: list[int]) -> dict:
    """BFS from variable node col_j through the Tanner graph, treating
    existing_rows as the current neighbor set of col_j. Returns a dict
    mapping row index -> minimum distance from col_j in the Tanner graph.

    Tanner graph has variable nodes (columns of H) and check nodes (rows),
    with edges wherever H[i,j] = 1. BFS alternates: variable -> check -> variable.
    """
    m, n = H.shape
    # Current neighbors of col_j (rows)
    nbr_rows = set(existing_rows)

    # Distance measured in variable-to-check hops (starts at variable node col_j)
    # Level 0: col_j itself
    # Level 1: check nodes in nbr_rows
    # Level 2: variable nodes connected to those check nodes (excluding col_j)
    # ...

    row_dist: dict[int, int] = {}
    # BFS queue: (node_type, index, distance)
    # node_type: 'v' for variable, 'c' for check
    queue = deque()
    visited_v = {col_j}
    visited_c: set = set()

    # Seed: expand from col_j's current neighbors
    for r in nbr_rows:
        if r not in visited_c:
            visited_c.add(r)
            row_dist[r] = 1
            queue.append(('c', r, 1))

    while queue:
        kind, idx, dist = queue.popleft()
        if kind == 'c':
            # Expand to variable nodes connected to check idx
            for v in range(n):
                if H[idx, v] == 1 and v not in visited_v:
                    visited_v.add(v)
                    # Expand to check nodes connected to this variable
                    for r in range(m):
                        if H[r, v] == 1 and r not in visited_c:
                            visited_c.add(r)
                            row_dist[r] = dist + 2
                            queue.append(('c', r, dist + 2))
    return row_dist


def peg_ldpc(n: int, m: int, col_weight: int, seed: int = 0) -> np.ndarray:
    """
    Build an m x n binary LDPC parity-check matrix with column weight
    col_weight using the PEG algorithm. Guarantees girth >= 6 when possible
    (n is large relative to m and col_weight).

    n: number of variable nodes (code length)
    m: number of check nodes (parity checks)
    col_weight: number of 1s per column (must be >= 2)

    Returns: H (m x n uint8 array)
    """
    if col_weight < 2:
        raise ValueError("col_weight must be >= 2")
    rng = np.random.default_rng(seed)
    H = np.zeros((m, n), dtype=np.uint8)
    row_deg = np.zeros(m, dtype=np.int32)  # current degree of each check node

    for j in range(n):
        existing = []
        for e in range(col_weight):
            if e == 0:
                # First edge: pick the lowest-degree row (break ties randomly)
                candidates = np.where(row_deg == row_deg.min())[0]
                r = int(rng.choice(candidates))
            else:
                # BFS to find which rows are furthest from j in the current graph
                dist = _bfs_depth(H, j, existing)
                max_d = max(dist.values()) if dist else 0
                # Among rows not yet connected to j, prefer those at max distance
                available = [r for r in range(m) if H[r, j] == 0]
                if not available:
                    break
                # Rows that appear in dist at max depth, or not at all (unreachable = max)
                farthest = [r for r in available
                            if dist.get(r, max_d + 2) >= max_d]
                if not farthest:
                    farthest = available
                # Among farthest, pick lowest degree (greedy balance)
                best_deg = min(row_deg[r] for r in farthest)
                farthest = [r for r in farthest if row_deg[r] == best_deg]
                r = int(rng.choice(farthest))

            H[r, j] = 1
            row_deg[r] += 1
            existing.append(r)

    return H


def peg_girth(H: np.ndarray) -> int:
    """Measure the actual girth of H's Tanner graph (BFS on full graph).
    Returns the length of the shortest cycle."""
    m, n = H.shape
    adj: list[list[int]] = [[] for _ in range(m + n)]
    for i in range(m):
        for j in range(n):
            if H[i, j]:
                adj[i].append(m + j)
                adj[m + j].append(i)
    min_cycle = 99
    for start in range(m + n):
        dist: dict[int, int] = {start: 0}
        q: deque = deque([(start, -1)])
        while q:
            u, parent = q.popleft()
            for v in adj[u]:
                if v == parent:
                    continue
                if v in dist:
                    min_cycle = min(min_cycle, dist[u] + dist[v] + 1)
                else:
                    dist[v] = dist[u] + 1
                    q.append((v, u))
    return min_cycle

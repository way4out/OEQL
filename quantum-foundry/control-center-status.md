# OEQL — Control Center Status
Attribution: 4 GOD & 4 huMan
Snapshot date: 2026-08-09 (update this file's date on every real status change — a stale status here is worse than no dashboard at all)

| Track | Status | What's already prepared | Required human action | What continues automatically after approval |
|---|---|---|---|---|
| Statevector simulator | **VERIFIED** (Level 1) | Full code, 8/8 test suite passing | None | N/A — complete for MVP scope |
| QF-IR / QASM-lite compiler front end | **VERIFIED** (Level 1) | Parser, round-trip tested | None | N/A — complete for MVP scope |
| Repetition-code QEC | **VERIFIED** (Level 1) | Simulator + analytic cross-check, 8/8 passing | None | N/A — complete for MVP scope |
| Surface-code MWPM decoder (toric code, code-capacity noise) | **VERIFIED (Level 1)** | Implemented, bug found + fixed + documented, 14/14 suite passing, threshold crossing near the cited ~10-11% ballpark (own simulation — see evidence ledger for exact caveat on what's independently confirmed vs. cited) | Independent review + comparison against primary Dennis/Kitaev/Landahl/Preskill (2002) source (currently only secondary-source corroborated) | Next: qLDPC decoder (below) |
| qLDPC code construction (hypergraph product) | **VERIFIED (Level 1) — construction, decoder, and distance-fix all confirmed** | Diagnosis from prior session (random seed → poor distance) confirmed and FIXED: structured Hamming(7,4) seed code eliminates single-qubit failures entirely (0/58 vs 18/45) and gives a sensible logical-error-vs-physical-error curve, well below the uncorrected baseline at low p (2.6% vs 44.2% at p=0.01). 17/17 suite passing | None — this milestone is complete | Next: this bit-flip decoder is a weak baseline (not BP/OSD); the next real step is either a stronger decoder, or a larger/properly-scaled structured code to test whether the √n distance trend actually holds as n grows — see research notes |
| Web playground | **DEPLOYED** (as a demo artifact) | Working HTML, client-side | None | N/A |
| State Match game | **DEPLOYED** (as a demo artifact) | Working React app w/ shared leaderboard | Real support/donation links need to be filled in before public launch | Once filled in, live |
| Governance charter | **WAITING FOR AUTHORIZATION** | Draft structure exists (master plan §22) | A human (or founding group) needs to actually write and ratify charter text — this is a social/legal act, not a coding task | Governance tooling (already built) becomes live once a charter exists to encode |
| Testnet smart contracts | **NOT STARTED** | Contract spec exists (master plan §17) | None to start writing/testing on testnet | External audit required before any mainnet/value-bearing use |
| Lab partnership | **NOT STARTED** | Outreach templates + pipeline ready (`governance/institution-outreach-system.md`) | A human identifies real named targets and reviews/sends each message | Response tracking, MOU negotiation (human-led) |
| Funding pipeline (grants) | **NOT STARTED** | Pipeline structure defined (this response, §4 below) | A human needs to actually identify specific open calls and hold the relevant institutional accounts (most grants require an eligible legal entity, not an individual) | Proposal drafting assistance, tracking |
| Physical hardware (any modality) | **BLOCKED** | Nothing — by design, this track doesn't open until a lab partnership exists | Lab partnership (see above) | N/A until then |
| Treasury/token deployment (Foundry/Solidity, self-custodied — no third-party bot dependency) | **IN PROGRESS** | Contract source being written for human review (see `contracts/`); local compilation unavailable in this sandbox (no `forge`/`solc`, no network) | Human runs `forge build`/`forge test` on their own machine before trusting anything; sets up the Safe multisig | Provenance recording in artifact registry once deployed |
| BP (belief propagation) decoder | **VERIFIED (Level 1) — correctness only** | Sum-product decoder implemented, convergence invariant verified (0/200 wrong claims). Measured result: BP underperforms bit-flip on this small code (short Tanner-graph cycles) — recorded honestly in the evidence ledger | None | Test BP on larger/sparser codes where its advantage is expected; consider BP+OSD (the ldpc library implements this) |
| Public landing page + repo publication | **READY — awaiting human push** | `webapp/index.html` (self-contained landing page with [Enter], live simulator, evidence-classified component list); git repo initialized and committed | Human runs `git remote add origin <url>` and `git push` — no publish connector exists in this environment | Public availability |
| OEQL (speculative architecture proposal) | **RESEARCHING (Level 0 only)** | Full specification written and self-classified (`research/oeql-architecture-specification.md`) | None required — this is a research-track document, not a build task | Stays a documented research direction; does not enter the near-term build order (see integration note below) |

## OEQL integration note

`research/oeql-architecture-specification.md` is filed as a research
track, not merged into the build order in `first-30-days.md` or the
master plan's implementation order. Reason, stated by the document's
own honest self-assessment: it introduces no new physics and rates its
own novel contribution at TRL 1 (concept only). Filing it as equal-
priority alongside the verified qLDPC/surface-code work (Level 1,
18/18 tests passing) would blur exactly the distinction this project's
evidence-ledger discipline exists to preserve. It's real, serious,
honestly-scoped speculative work — and it stays labeled as that.

## Honesty note on autonomy

This dashboard reflects the state of the project as of the artifacts
built in this conversation. I am a conversational AI assistant — I do
not run continuously in the background between sessions, monitor
research feeds on a schedule, or autonomously submit anything on your
behalf unless you set up real infrastructure for that (e.g., a
scheduled Claude Code job, a connected email/CRM tool with your
explicit per-message review, or similar). "Maximum legitimate autonomy"
inside a single chat session means: I don't stop to ask permission for
things that are genuinely reversible and computational (writing code,
running simulations, drafting documents). It does not mean this project
is running unattended right now — nothing is, until you either keep
opening sessions to advance it or wire up real automation yourself.

# OEQL — Founding Charter (Draft v0.1)
Attribution: 4 GOD & 4 huMan

**Status: DRAFT.** This is a starting text for human review and
amendment — not a ratified document. Per master plan §22, ratification
is a human/social process; this draft exists so there's something
concrete to react to, amend, or replace, rather than an empty page.

## Article 1 — Purpose

OEQL (Open-Ended Quantum Liberty) exists to build and sustain open-source, verifiable,
reproducible quantum computing research and engineering infrastructure.
Every technical claim the project makes is backed by evidence at a
stated, honest level (see the evidence ledger). The project does not
claim capabilities, results, or partnerships it does not have.

## Article 2 — Membership

Anyone who contributes — code, research, documentation, review,
governance work — is a contributor. Contribution is verified by
artifact (a merged PR, a reviewed research contribution, a completed
governance action), not by claim or by payment. There is no fee to
participate and no purchase required to contribute.

## Article 3 — Decision-making

3.1. **Technical decisions** (architecture, what to build next, code
review standards) are made by rough consensus among active
contributors, with disputes escalated to the Technical Steering
Committee (Article 4).

3.2. **Governance decisions** (charter amendments, license changes,
treasury rules) require a vote of contributors weighted by verified
contribution (reputation, per master plan §19), with results and vote
records public.

3.3. **Irreversible or value-bearing actions** (mainnet contract
deployment, treasury disbursement above a threshold set by the
Technical Steering Committee, any physical fabrication order) require
a completed Human Authorization Gate record (see
`governance/human-authorization-gate.md`) naming the specific action,
in addition to any vote this Article otherwise requires.

## Article 4 — Technical Steering Committee (TSC)

4.1. The TSC is elected by contributor vote, staggered terms (to be
specified: proposed default is 3 members, 6-month staggered terms,
but this number is explicitly open for amendment before ratification).

4.2. The TSC resolves technical disputes that don't reach consensus,
sets treasury disbursement thresholds requiring extra authorization,
and may not unilaterally change the charter, the license terms
(Article 7), or override a contributor vote.

4.3. No TSC member may approve their own critical work — independent
review is required for any TSC member's own major contribution, same
as any other contributor.

## Article 5 — Evidence and honesty (non-negotiable, not subject to
simple-majority amendment — see Article 9)

5.1. Every technical claim published by the project must be classified
at one of the evidence levels defined in `research/evidence-ledger.md`
(Level 0 hypothesis through Level 4 independent reproduction).

5.2. No claim may be represented at a higher evidence level than it
has actually achieved. A simulation is not a physical result. A
prototype is not a validated system. An AI-generated analysis is not
a peer-reviewed finding.

5.3. When a bug, an incorrect result, or an overclaim is found, it is
documented (not deleted) alongside its correction, preserving the
record of what was believed and when — per the Generation System
already practiced in this project's evidence ledger.

## Article 6 — Treasury

6.1. All treasury funds are held in a multisig (Safe) during the
bootstrap phase, with a published decentralization roadmap toward
governance-controlled smart contracts (per master plan §17, subject to
external audit before any mainnet value-bearing deployment).

6.2. All treasury inflows and outflows are public. Grant/donation
income is tracked separately as PROPOSED / COMMITTED / RECEIVED —
never represented as received before it actually is.

6.3. Speculative use of treasury funds (active trading, leveraged
positions) requires an explicit contributor vote under Article 3.2,
not a unilateral decision by any individual, officer, or the TSC alone
— this friction is deliberate, not an oversight.

## Article 7 — Licensing

7.1. Default licenses per master plan §14 (Apache-2.0 for software,
CERN-OHL-S for hardware designs, CC-BY-4.0 for documentation) apply to
all project output unless a specific exception is voted under Article
3.2.

7.2. License changes to already-published work require a supermajority
vote (proposed default: two-thirds of participating voting weight) —
no silent relicensing.

## Article 8 — Child of this document: amendment process

8.1. Amendments to this charter require: (a) a public proposal period
of at least 14 days, (b) a contributor vote per Article 3.2, (c) public
recording of the vote and result.

8.2. Article 5 (Evidence and honesty) requires a higher bar to amend:
unanimous TSC agreement plus a supermajority contributor vote, and the
amendment itself must be published alongside a stated reason — this
article is deliberately harder to weaken than the rest of the charter.

## Article 9 — Dissolution

If the project ceases active operation, all open-source artifacts
remain under their existing licenses (nothing reverts to closed), any
remaining treasury funds are distributed per a final contributor vote
(default proposal: donated to a related open-source or open-science
organization if no other disposition is agreed), and the evidence
ledger and all its history remain published and accessible.

---

**Open items for human discussion before ratification** (not yet
resolved by this draft, flagged rather than silently decided):
- Exact TSC size and term length (Article 4.1)
- Exact supermajority threshold (Article 7.2 proposes two-thirds —
  worth debating)
- Whether voting weight should be capped per contributor to limit
  concentration (referenced but not specified in master plan §22)
- Treasury disbursement threshold requiring extra authorization
  (Article 4.2 — no default number proposed here deliberately, this
  should come from actual treasury size once one exists)

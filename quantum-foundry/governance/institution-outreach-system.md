# Quantum Foundry — Institution & Lab Outreach System
**Attribution: 4 GOD & 4 huMan**

Replaces master-plan §11/§22 step "manual partnership negotiation"
with a defined AI-assisted pipeline. Read the honesty note first.

## Honesty note — what this actually is right now

I don't have an email-sending, CRM, or outreach tool connected in this
conversation, so I cannot literally push messages to labs/institutions
from here. What I *can* do, and have done below, is design the
pipeline and draft the actual outreach content, so that:

- **You** can send these today, manually, with zero further tooling.
- **Or** you connect an email/outreach tool (Gmail, Outlook, a CRM) in
  a future session, and an AI agent runs this same pipeline with a
  human-review step before every single send — which is the same
  human-authorization principle as the rest of this project, not a
  weaker version of it for outreach specifically.

A fully "autonomous, no-human-in-the-loop" cold-outreach system to real
institutions is also a bad idea on its own merits, independent of
tooling: unsolicited mass AI-generated outreach to labs is exactly the
kind of thing that gets a project's *first* impression flagged as spam
before anyone reads the technical content. The review step isn't
bureaucracy for its own sake — it's what makes the outreach land.

## Target endpoint categories (where "appropriate proper endpoint" resolves to)

| Category | Real examples of the *type* of endpoint (not a claim these specific ones will respond) | What to offer them |
|---|---|---|
| University quantum-engineering/physics departments | Departments with published quantum computing/QIS research groups | Open-source SDK/simulator/QEC-benchmark tooling their grad students can use for free, today |
| National lab open-science / user-facility programs | Public user-facility or open-science access programs at national labs | A concrete, reproducible software contribution — not a funding ask |
| Existing open-source quantum ecosystems | Maintainers of Qiskit, Cirq, PennyLane, Stim, QIR Alliance | Interoperability, not competition — QF explicitly builds *on* these (see master plan §5/§9/§27) |
| Photonic/neutral-atom hardware groups (lower lab-barrier modalities, per master plan §3) | Groups working on room-temperature-compatible quantum hardware | Control-stack/firmware collaboration (master plan §8) |
| Grant-making bodies for open-source science | Public open-science/open-source software grant programs | A funded, credible, working MVP to point to (this is why the MVP had to be built *before* outreach, per master-plan build order §36 step 22) |

You (a human) should replace the category-level placeholders above
with actual named institutions and actual named contacts before
anything is sent — sending to a category is meaningless; sending to a
real person who does real related work is what makes an email worth
opening.

## The pipeline

```
1. IDENTIFY   — human (or human + AI research pass) compiles a real,
                named target list with actual contact info, sourced
                from public faculty/lab pages — never scraped/bought
                contact lists.
2. QUALIFY    — for each target, one human-written sentence on *why
                this specific target*, not a form-letter justification.
3. DRAFT      — AI drafts a message using the templates below,
                customized per target using the qualify note.
4. REVIEW     — a named human reads every single drafted message
                before it sends. No exceptions, no batch-approve.
5. SEND       — human sends, or authorizes an AI agent with a
                connected email tool to send that exact, reviewed
                message (not a re-generated one).
6. LOG        — every sent message, its target, and any response
                gets logged in the project's data architecture (§24
                of the master plan) so outreach has the same
                provenance discipline as code does.
7. FOLLOW-UP  — no more than one follow-up per target, minimum two
                weeks later, and never after a "no" or non-response
                to two attempts.
```

## Real, verified targets identified (not categories — actual projects)

Found via search, sourced, not fabricated. These are the actual current
open-source ecosystem this project's QEC work sits next to — contacting
them is the single highest-value outreach action available right now,
since they're directly, technically adjacent to what was just built:

| Project | What it is | Why it's relevant | Contact path |
|---|---|---|---|
| **PyMatching** (Oscar Higgott) | The standard open-source MWPM decoder (sparse-blossom algorithm, ~1M errors/core-second) — the exact decoder family our toric-code module implements a small teaching version of | Our surface-code work is a from-scratch, small-scale, verified reimplementation of the same decoding approach — directly comparable, complementary, not competing | github.com/oscarhiggott/PyMatching — public issue tracker is the appropriate first-contact channel, not a personal email |
| **Stim** (quantumlib / Google Quantum AI) | The standard stabilizer-circuit simulator the whole QEC benchmarking ecosystem is built on | Our benchmark methodology (Monte Carlo, seeded, reproducible) follows the same discipline this tool enables at scale | github.com/quantumlib/Stim |
| **ldpc** library (Joschka Roffe et al.) | BP and BP+OSD decoding for qLDPC codes — the "Decoding across the quantum LDPC code landscape" paper (Phys. Rev. Res. 2020) is foundational to this exact area | Our bit-flip decoder is explicitly a weaker baseline than BP+OSD — this is the natural "what's next" reference, not a competitor | github.com/quantumgizmos/ldpc |
| **qLDPC** package (qLDPCOrg) | A dedicated Python package for constructing and analyzing qLDPC codes | Directly overlaps with `qec/qldpc.py` — worth checking whether our hypergraph-product implementation duplicates something better already there before investing further | github.com/qLDPCOrg/qLDPC |
| **tesseract-decoder** (quantumlib) | A newer (2025-era) search-based QEC decoder, published with a full open-source repo and test suite | Useful reference for what a properly production-grade decoder repo structure looks like, including their stated 30-second reduced-parameter test suite — a model for how we should scope our own CI | github.com/quantumlib/tesseract-decoder |
| **Error Correction Zoo** (errorcorrectionzoo.org) | A maintained, citable reference catalog of quantum codes and decoders | Good venue to eventually check whether our specific construction (hypergraph product + Hamming seed) is already cataloged, and to cite correctly if so | errorcorrectionzoo.org |

**How to actually use this list:** the honest, useful first move isn't a
cold outreach email — it's opening a specific, technical GitHub issue or
discussion on the most relevant repo (PyMatching or the qLDPC package)
along the lines of: "built a small, independently-verified hypergraph-
product qLDPC implementation for teaching/reproducibility purposes —
does this duplicate something you already have, and is there interest
in it as a documented minimal-example companion to your library?" That's
a real, specific, honest question a maintainer can actually answer,
versus a generic "check out my project" message.

## Ready-to-send messages (real named targets, found via public lab pages)

### Message 1 — Oscar Higgott (PyMatching maintainer, GitHub: oscarhiggott)

```
Subject: OEQL — open-source qLDPC + surface code benchmark suite, interop question

Hi Oscar,

I built an open-source quantum error correction benchmark suite (OEQL)
that includes a from-scratch toric-code MWPM decoder and a hypergraph-
product qLDPC implementation. I used it to systematically test why plain BP
underperforms bit-flip on small codes — measured and falsified three
successive hypotheses before isolating the mechanism (BP converges to valid
but heavier corrections; the fix is n >> 100, not girth or column weight
per se).

The suite is designed to cross-validate against your work rather than
compete with it. A few specific questions:

1. Is there an integration point worth pursuing (e.g., OEQL as a
   pedagogical/teaching companion that points to PyMatching for production
   use)?
2. Does the decoder investigation above duplicate something already in your
   docs, or is the written-up falsification sequence useful as a reference?
3. Any parameter regimes you'd recommend for a first n >> 100 BP comparison?

Repo: [link] — one command reproduces all 27 benchmark checks.
Happy to discuss or quietly file an issue instead if that's more appropriate.

Tucker Martin / OEQL
```

### Message 2 — UC Santa Barbara Quantum Photonics Lab (public contact form / lab email)

```
Subject: Open-source QEC control software — potential collaboration interest?

Hello,

I'm building OEQL, an open-source quantum computing research ecosystem
that includes a verified QEC benchmark suite, an OEQL Runtime (substrate-
agnostic control layer), and a hardware abstraction layer designed to wrap
physical backends without rewriting application code.

I saw the QPL's work on entangled-pair sources for Cisco's quantum network
and cryogenic optical modulators. The software layer OEQL provides — error
correction simulation, decoder benchmarking, control-stack abstraction —
is exactly the kind of thing that benefits from being validated against
real photonic hardware.

I'm not asking for lab time or funding at this stage. I'm asking whether
there's a named researcher in your group who looks at open-source control/
benchmarking tools and whether a brief technical conversation would be
worthwhile.

Repo: [link]. 27 automated checks, Apache-2.0, no proprietary dependencies.

Tucker Martin / OEQL
```

### Message 3 — University of Washington EPIQS / Quantum Technologies Testbed

```
Subject: Open-source QEC software — UW quantum testbed potential fit?

Hello,

I noticed UW's Quantum Technologies Training and Testbed lab (Prof. Max
Parsons, from the April 2026 UW News piece). I'm building OEQL, an
open-source quantum research ecosystem that includes a substrate-agnostic
control runtime and a comprehensive QEC benchmark suite.

The OEQL Runtime is designed so a new hardware backend requires implementing
one adapter class — the application layer doesn't change. For a testbed that
wants to evaluate QEC decoders against real hardware, this could reduce the
software scaffolding burden.

Is there someone in the group who handles external software collaborations?
Happy to share the technical brief.

Tucker Martin / OEQL
```

### Message 4 — Joschka Roffe (ldpc library, "Decoding across the quantum LDPC landscape")

```
Subject: OEQL — decoder investigation that converges to your BP+OSD conclusions

Hi Joschka,

I built an open-source QEC suite (OEQL) and ran a systematic decoder
investigation: tested plain BP on several qLDPC code families, falsified
three successive hypotheses for why it underperforms bit-flip, and isolated
the actual mechanism (BP finds heavier corrections; the effect persists even
with girth-6 bivariate bicycle codes at n=30; it disappears at n >> 100
per your paper).

Your 2020 PRX Quantum paper is the reference I kept arriving back at. The
investigation is written up with the falsified hypotheses preserved alongside
the confirmed one — I think that's useful as a teaching example of how
decoder benchmarking should be done.

Two questions: (1) Is there interest in OEQL linking to your ldpc library
as the recommended production decoder, with OEQL's bit-flip/BP serving as
a verified reference implementation? (2) Any advice on which of your
recommended code+decoder combinations would make the best n >> 100 comparison?

Repo: [link] — all findings reproducible.

Tucker Martin / OEQL
```

## Outreach message templates

### Template A — university research group

```
Subject: Open-source quantum SDK/simulator — thought your group might
find it useful

Hi [Name],

I came across your work on [specific paper/project — fill in a real
one]. We've built an open-source statevector simulator, compiler
front-end, and a small QEC benchmark suite (repetition code, reproduces
the standard majority-vote threshold result) — MIT/Apache-licensed,
interoperable with OpenQASM3/QIR rather than a walled garden.

No ask attached to this email — just flagging it in case it's useful
for coursework, prototyping, or benchmarking against your own tooling.
Repo: [link]. Happy to talk if there's a fit for anything more, but
genuinely no pressure either way.

[Your name]
Quantum Foundry — [contact]
```

### Template B — existing open-source ecosystem maintainer

```
Subject: Interoperability, not a fork — quantum benchmark tooling

Hi [Name],

We built a small, independently-verified QEC benchmark suite and
statevector simulator as part of an open-source project (Quantum
Foundry). It's designed to interoperate with [Qiskit/Cirq/Stim/etc.
— name the specific one], not replace it — we cross-validate our
simulator against exactly this kind of established tooling as a
correctness requirement, not a marketing claim.

If there's an obvious integration point, or if this duplicates
something you'd rather we just contribute to directly, genuinely happy
to hear that — the goal is a healthier ecosystem, not a competing one.

[Your name]
```

### Template C — grant program / open-science funder

```
Subject: [Program name] — open-source quantum tooling with a working,
reproducible MVP

Hi [Name],

We're applying [or: considering applying] to [program name] for
Quantum Foundry, an open-source quantum computing research/engineering
toolchain. Unlike a pre-MVP concept, there's a working, independently
reproducible codebase now: [repo link], with a documented test suite
(8/8 correctness checks against closed-form quantum-mechanical results,
reproducible with one command).

Full technical specification and honest capability-readiness breakdown
attached [master plan link] — we've been explicit throughout about
what's built vs. what's aspirational, including for hardware/lab
components, since we think that's what a credible application should
look like.

[Your name]
```

## What NOT to send

- Nothing claiming working quantum hardware, fault tolerance, or any
  result the master plan tags as REQUIRES LABORATORY HARDWARE /
  FUTURE RESEARCH.
- Nothing implying institutional endorsement that hasn't been given.
- Nothing to a purchased or scraped contact list.
- Nothing where "4 GOD & 4 huMan" or any other framing would need
  explaining before the recipient can evaluate the technical content —
  put the substance first; attribution belongs in the repo/license,
  not the subject line of a cold email to a lab you've never talked to.

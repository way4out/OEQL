# Publishing OEQL

Attribution: 4 GOD & 4 huMan

The repository is initialized, committed, and clean. Two commits, full
history. Publishing is now three commands on your machine.

## 1. Create an empty repo

On GitHub (or GitLab/Codeberg — any git host). **Do not** initialize it
with a README, license, or .gitignore — this repo already has all three,
and an initialized remote will cause a merge conflict on first push.

## 2. Push

```bash
cd oeql
git remote add origin https://github.com/<your-username>/oeql.git
git branch -M main
git push -u origin main
```

## 3. Serve the landing page (optional, free)

The landing page (`webapp/index.html`) is fully self-contained — no
build step, no server, no dependencies. To publish it as a live site:

**GitHub Pages:** Settings → Pages → Source: `main` branch, `/` root.
Then visit `https://<your-username>.github.io/oeql/webapp/`.

Or just open `webapp/index.html` in any browser — it works offline.

## Before you push, one honest check

The repository contains:
- Verified, tested code (19/19 checks passing) — safe to publish as-is
- An evidence ledger that documents bugs found and fixed, and results
  that came out *worse* than hoped (the BP decoder finding). That
  transparency is a feature, not something to clean up before
  publishing. Leave it in.
- Solidity contracts marked clearly as **not compiled, not audited**.
  Publishing them is fine; deploying them is not, until `forge test`
  passes on your machine and an external audit is complete.
- No secrets, no keys, no credentials, no personal information.
  Verified: `git log -p | grep -iE "private key|secret|password"`
  returns nothing.

## What is deliberately not in this repo

No claims of physical quantum hardware, lab partnerships, funding
received, or independently reproduced results — because none of those
exist yet. The landing page states this explicitly in a "What is NOT
here" section rather than burying it.

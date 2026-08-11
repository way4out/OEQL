#!/usr/bin/env bash
# OEQL — One-command GitHub publish
# Attribution: 4 GOD & 4 huMan
#
# Usage: ./publish.sh YOUR_GITHUB_USERNAME
# Or:    ./publish.sh YOUR_GITHUB_USERNAME private  (for a private repo first)
#
# Prerequisites:
#   git installed (already done — repo has 7 commits ready)
#   GitHub account
#   GitHub CLI optional but recommended: https://cli.github.com/

set -e
USERNAME=${1:?"Usage: ./publish.sh <github-username> [private]"}
VISIBILITY=${2:-public}
REPO_NAME="oeql"

echo ""
echo "═══════════════════════════════════════════"
echo "  OEQL — GitHub Publish"
echo "  Attribution: 4 GOD & 4 huMan"
echo "═══════════════════════════════════════════"
echo ""
echo "Target: github.com/$USERNAME/$REPO_NAME ($VISIBILITY)"
echo ""

# --- Option A: GitHub CLI (recommended, handles repo creation automatically)
if command -v gh &>/dev/null; then
    echo "GitHub CLI detected — creating repo and pushing automatically..."
    gh repo create "$REPO_NAME" \
        --$VISIBILITY \
        --description "OEQL: Open-Ended Quantum Liberty — open-source quantum computing research and engineering ecosystem" \
        --source . \
        --remote origin \
        --push
    echo ""
    echo "✓ Published: https://github.com/$USERNAME/$REPO_NAME"
    echo ""
    echo "Next steps:"
    echo "  1. Add topics: quantum quantum-error-correction qldpc qecc open-source"
    echo "  2. Enable GitHub Pages: Settings → Pages → Branch: main / root"
    echo "  3. The landing page will be at:"
    echo "     https://$USERNAME.github.io/$REPO_NAME/webapp/"

# --- Option B: Manual (if no GitHub CLI)
else
    echo "GitHub CLI not found. Manual steps:"
    echo ""
    echo "1. Create the repo on GitHub (do this in your browser):"
    echo "   https://github.com/new"
    echo "   Name: $REPO_NAME"
    echo "   Description: OEQL: Open-Ended Quantum Liberty"
    echo "   Visibility: $VISIBILITY"
    echo "   DO NOT initialize with README/license/gitignore (already have them)"
    echo ""
    echo "2. Then run these commands:"
    echo ""
    echo "   git remote add origin https://github.com/$USERNAME/$REPO_NAME.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo ""
    echo "3. After pushing, enable GitHub Pages:"
    echo "   Settings → Pages → Source: main branch, /root"
    echo "   Live URL: https://$USERNAME.github.io/$REPO_NAME/webapp/"
    echo ""
    echo "4. Add repo topics (improves discoverability):"
    echo "   quantum, quantum-error-correction, qldpc, qecc, open-source,"
    echo "   quantum-computing, error-correction, bicycle-codes, oeql"
fi

echo ""
echo "Security check (run before pushing):"
echo "  git log -p | grep -iE 'private.key|password|secret|BEGIN RSA'"
echo "  (Expected: no matches — confirmed clean in previous session)"

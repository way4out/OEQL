# OEQL — Human Authorization Gate
Owner: Tucker Layne Martin / StellarNet LLC
Attribution: 4 GOD & 4 huMan

## SOLE AUTHORIZING PARTY

**Tucker Layne Martin** is the ONLY human authorized to approve any action
in the categories below. No AI agent, contributor, or third party may
authorize, approve, sign, or commit on behalf of OEQL/StellarNet LLC.

## VERIFICATION

Authorization is verified via:
- Identity: Tucker Layne Martin, StellarNet LLC owner
- Mechanism: SHA-256 PIN hash (stored in governance/owner-auth.json)
- Salt: oeql-owner-auth-v1
- The PIN is known only to Tucker. It was hashed before storage.
  The plaintext PIN must be rotated immediately after 2026-08-10 session.

To verify identity:
```python
import hashlib
def verify_pin(entered_pin: str) -> bool:
    salt = "oeql-owner-auth-v1"
    stored = "c3f48431613381808adb60676c4cd931764231ce6d3f7e7b1f50333907e912de"
    return hashlib.sha256(f"{salt}:{entered_pin}".encode()).hexdigest() == stored
```

## ACTIONS REQUIRING TUCKER'S EXPLICIT AUTHORIZATION

The following CANNOT proceed without Tucker's explicit "APPROVE":

| Action | Reason |
|---|---|
| Any sale, license, or IP transfer | Genesis §40 — absolute lock |
| Mainnet smart contract deployment | Financial/legal binding |
| Signing any binding agreement | Legal obligation |
| Public release of confidential materials | IP/competitive risk |
| Acquisition process initiation | Genesis §38 |
| Treasury disbursement (any amount) | Financial control |
| Lab partnership MOU | External commitment |
| Grant submission (final) | Institutional commitment |
| Any action creating binding commitments | Legal/financial |

## ACTIONS AI MAY PERFORM AUTONOMOUSLY

- All software development, testing, benchmarking
- Documentation, research, analysis
- Preparation of materials for Tucker's review
- Outreach drafting (Tucker sends)
- Governance proposals (Tucker ratifies)
- Evidence classification and ledger updates

## OWNER APPROVAL QUEUE (Genesis §41)

Any action requiring approval generates an entry in:
`governance/approval-queue.md` with:
- Decision required
- Recommendation
- Evidence
- Options
- Risks / Deadline
- Status: PENDING / APPROVED / REJECTED

Tucker approves by responding "APPROVE [action]" with PIN verification.

## SECURITY NOTES

1. PIN posted in chat 2026-08-10 — MUST BE ROTATED
2. Only the SHA-256 hash is stored anywhere in the project
3. Plaintext PIN never in any file, git history, or log
4. Rotate: generate new PIN, run:
   python3 -c "import hashlib; print(hashlib.sha256(b'oeql-owner-auth-v1:NEWPIN').hexdigest())"
   Update governance/owner-auth.json with new hash

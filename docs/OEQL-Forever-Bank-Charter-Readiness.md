# OEQL Forever Bank — Arizona De Novo Charter Readiness

Status: PRE-FILING / NOT A BANK CHARTER

This packet is an engineering and organizational readiness document. It does not constitute a charter, FDIC deposit-insurance approval, legal opinion, or authorization to accept deposits.

## Official path

Arizona DIFI states that establishing a new Arizona state-chartered member bank requires preliminary approval from AZDFI and the Federal Reserve Bank of San Francisco, plus FDIC deposit insurance. DIFI lists the Interagency Charter and Federal Deposit Insurance Application for new bank organizations.

FDIC's de novo handbook identifies pre-filing activities including organizers, directors and key officers, a business plan, capital planning, and pre-filing meetings; the application process includes regulatory review and field investigation.

## Required organizer inputs

These must be supplied and attested by the actual organizers; the software cannot invent them:

- Proposed legal bank name
- Proposed headquarters and branch plan
- Organizers and ownership percentages
- Board of directors and biographies
- Proposed executive management and regulatory experience
- Initial and ongoing capital sources
- Capital commitments and evidence of funds
- Three-year financial projections
- Target markets and customer segments
- Deposit, lending, payments and treasury strategy
- BSA/AML/OFAC/CIP program
- Information-security and cybersecurity program
- Vendor/third-party risk program
- Business continuity and disaster recovery plan
- Liquidity and funds-management policy
- Credit policy and underwriting framework
- Compliance-management system
- Internal audit and independent testing plan
- Consumer compliance program
- Privacy and data-governance program
- Board governance, committees and bylaws
- Physical/virtual operating model
- Insurance and bonding
- Background checks and regulatory disclosures

## OEQL technology readiness

The production application is deployed separately from the charter process. Its financial functions remain provider-gated until an authorized institution/issuer is connected.

Target architecture:

Customer UI
 -> Authentication / Passkeys
 -> CIP/KYC
 -> BSA/AML + OFAC screening
 -> Core ledger
 -> Fraud / risk
 -> Authorized bank/payment provider
 -> ACH / wires / card network
 -> Reconciliation
 -> Statements
 -> Immutable audit records
 -> Regulatory reporting

## Non-negotiable truth controls

Do not display or advertise:
- FDIC insured
- bank chartered
- deposits accepted
- issued debit cards
- customer balances
- lending approval
- metal backing

unless the corresponding authorization, provider record, or transaction actually exists.

## Filing sequence

1. Engage qualified banking counsel and regulatory counsel.
2. Contact Arizona DIFI Financial Institutions Division for a pre-filing meeting.
3. Identify the applicable federal regulator and obtain pre-filing guidance.
4. Complete the business plan, governance, capital plan, policies and financial projections.
5. Prepare the Interagency Charter and Federal Deposit Insurance Application.
6. Submit required background checks and supporting materials.
7. Respond to regulator information requests and examination/investigation.
8. Obtain charter and deposit-insurance approvals.
9. Complete pre-opening conditions and operational testing.
10. Only after authorization, activate deposit-taking and bank-branded financial products.

## Current software state

OEQL Forever Bank production URL:
https://oeql-bank-forever.onrender.com/

Application status: deployed software layer.
Bank charter: not granted.
FDIC deposit insurance: not granted.
Physical card issuance: not activated.
Customer deposit balances: not activated.

Source references:
- Arizona DIFI — Licensing / Financial Institutions
- Arizona DIFI — How do I obtain a permit to open a bank?
- FDIC — Applications for Deposit Insurance
- FDIC — Applying for Deposit Insurance: Handbook for Organizers of De Novo Institutions

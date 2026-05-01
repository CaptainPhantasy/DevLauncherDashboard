# dev-launcher Issues Ledger
**Created:** 2026-04-28T07:15:29-0400
**Governance:** .supercache/ v1.5.0

> **Compliance Notice:** This file must match the structure at
> `.supercache/templates/issues-template.md`. This is the living help-desk
> and issue tracker for **dev-launcher**.

---

## How to use this document

- This is the living help-desk for repo operations, CI/CD, bugs, and blockers for dev-launcher.
- Every new issue is added as a row in the **Issues Ledger** below with a fresh `ISSUE-NNNN` ID.
- Every significant update to an issue appends a timestamped entry to the **Change Log** at the bottom of this file.
- **Never overwrite historical facts.** Updates append; they do not replace.

---

## Status definitions

| Status | Meaning |
|---|---|
| **New** | Captured; not yet triaged |
| **Triaged** | Scoped; priority set; owner assigned |
| **In progress** | Active work underway |
| **Blocked** | Cannot proceed; blocker and next unblock action recorded |
| **Resolved** | Fix implemented; proof attached |
| **Verified** | Fix confirmed by rerun, test, or log evidence |
| **Closed** | Complete and stable; no further action expected |

Issues move forward through these states. Backward transitions are allowed if new information invalidates an earlier state (e.g., a Closed issue reopens if the bug recurs).

---

## Issues Ledger

| ID | Created | Title | Status | Owner | Evidence / Links | Resolution Proof |
|---|---|---|---|---|---|---|
| ISSUE-0001 | 2026-04-28 07:30 EDT | Legacy SSOT.md and SSOT-Codebase-Report.md at repo root — pre-governance artifacts | Closed | Floyd | SSOT.md, SSOT-Codebase-Report.md at project root | Replaced by SSOT/dev-launcher_SSOT.md |
| ISSUE-0002 | 2026-04-28 07:30 EDT | .gitignore missing governance write zones (.floyd/) and some hygiene entries | Closed | Floyd | .gitignore | Added .floyd/ and missing hygiene patterns |
| ISSUE-0003 | 2026-04-28 07:30 EDT | .env.example and docs referenced forbidden example ports | Verified | Floyd | .env.example, README.md, docs/CONFIGURATION.md, docs/SETUP.md, docs/APP_REGISTRY.md | `grep` for forbidden governance ports across those docs returned no matches on 2026-04-30 |

---

## Required fields per issue

Every row above MUST have:

1. **ID** — `ISSUE-NNNN`, monotonically increasing, never reused
2. **Created** — `YYYY-MM-DD HH:MM TZ` when the issue was first captured
3. **Title** — one-line summary
4. **Status** — from the status table above
5. **Owner** — assigned person, or "Unassigned"
6. **Evidence / Links** — logs, screenshots, commands, failing step, related file paths, companion issue file if present
7. **Resolution Proof** — how the fix was verified; "N/A" until Resolved or later

If any field is missing, the row is non-compliant and must be corrected.

---

## Per-issue detail files (optional)

For issues that need more than a single ledger row, create a companion file:

```
Issues/
├── dev-launcher_ISSUES.md       (this file — the ledger)
├── 0001-brief-description.md        (deep detail for ISSUE-0001)
├── 0002-another-issue.md            (deep detail for ISSUE-0002)
└── ...
```

Link the companion file from the ledger row's Evidence / Links column.

---

## Change Log (append-only)

- 2026-04-28T07:15:29-0400 — Initialized issues ledger.
- 2026-04-28 07:30 EDT — Added ISSUE-0001 (stale root SSOT files), ISSUE-0002 (gitignore gaps), ISSUE-0003 (forbidden ports in .env.example).
- 2026-04-28 07:30 EDT — Closed ISSUE-0001: pre-governance SSOT.md replaced by proper governance scaffold.
- 2026-04-28 07:30 EDT — Closed ISSUE-0002: .gitignore updated with governance patterns.
- 2026-04-30 15:38 EDT — Verified ISSUE-0003: forbidden-port examples replaced with governed non-forbidden ranges; grep verification returned no matches.

---

## Mandatory execution contract
For EACH requested item:
1) Show exact action taken
2) Show direct evidence (file/line/command/output)
3) Show verification result
4) Mark status only after proof

## Forbidden behaviors
- Declaring "done" without evidence
- Collapsing multiple requested items into one vague summary
- Skipping failed steps without explicit blocker report

## Required output structure
A) Requested items checklist
B) Per-item evidence ledger
C) Verification receipts
D) Completeness matrix (item -> done/blocked -> evidence)

## Hard gate
If any requested item has no evidence row, final status MUST be INCOMPLETE.

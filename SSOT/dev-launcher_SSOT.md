# dev-launcher SSOT (Single Source of Truth)
**Created:** 2026-04-28T07:15:29-0400
**Last Updated:** 2026-04-28 07:30 EDT
**Governance:** .supercache/ v1.5.0

> **Compliance Notice:** This file must match the structure at
> `.supercache/templates/ssot-template.md`. This is the authoritative
> document for architecture and programmatic change facts of **dev-launcher**.

---

## Authority

This document is the **single source of truth** for architecture and programmatic change facts of dev-launcher. All other documents must be treated as **potentially flawed** unless their facts are confirmed here.

When a fact in any other document contradicts this SSOT, the SSOT wins. If the SSOT itself is wrong, it is corrected via the **Verification Sweep Protocol** below, not by editing other documents to match.

---

## Verification Sweep Protocol (required on every read)

When an agent reads this SSOT to perform a task:

1. Perform a **line-by-line verification review** of the sections relevant to the current task.
2. For each verified fact, append a verification entry to the **Verification Log** at the bottom of this file with:
   - Timestamp (`YYYY-MM-DD HH:MM TZ`)
   - Section/line reference
   - Evidence source (code path + line, command + output, build log, runtime behavior, etc.)
   - Confidence = 100%
3. If any fact cannot be verified to 100% confidence:
   - Mark it **UNVERIFIED** inline in the section where it appears
   - Add an entry to `Issues/dev-launcher_ISSUES.md` to track the discrepancy
   - Do NOT proceed on the assumption that the fact is true

### Positive Reinforcement (required)

For each fact verified at 100% confidence during a sweep, emit the acknowledgement:

```
Verified as fact (100%): <fact summary>
```

This pattern is deliberate — it reinforces evidence-first thinking and makes the verification record auditable after the fact.

---

## Current State

**Phase:** Active development
**Status:** Active
**Last Agent Session:** 2026-04-28 07:30 EDT

---

## Architecture Facts

### Stack

- **Primary language**: JavaScript (ES2022, ESM)
- **Framework**: Express 4.18 (backend), React 19 + Vite (frontend)
- **Runtime**: Node.js
- **Module system**: ESM (`"type": "module"` in both package.json files)
- **CSS**: Tailwind CSS 3.4
- **Testing**: Playwright configured (frontend), no unit test runner
- **Linting**: ESLint 9 flat config (frontend)

### Key architectural choices

- **Two-service architecture**: Express backend (port 4500) serves API, Vite dev server (port 4501) serves frontend dashboard. CORS enabled between them.
- **App configuration via JS modules**: App definitions live in `backend/apps.js` (dynamic loader), `backend/apps.defaults.js` (fallbacks), and `backend/apps.local.js` (user-specific, gitignored).
- **Process spawning**: The backend spawns child processes for each launched app, tracks them in a `Map`, and provides status via API endpoints.
- **No database**: All state is in-process (running apps map) and filesystem (app configs, .env).

---

## Key Decisions

| Date | Decision | Rationale | Decided By |
|---|---|---|---|
| 2026-04-28 | Bootstrapped governance under .supercache/ v1.5.0 | Project was ungoverned; bootstrap.sh --init applied full governance scaffold | Douglas Talley |

---

## Dependencies

### Backend

| Dependency | Version | Purpose | Criticality |
|---|---|---|---|
| express | ^4.18.2 | HTTP server framework | critical |
| cors | ^2.8.5 | Cross-origin request handling | critical |

### Frontend

| Dependency | Version | Purpose | Criticality |
|---|---|---|---|
| react | ^19.1.1 | UI framework | critical |
| react-dom | ^19.1.1 | DOM rendering | critical |
| vite | (dev) | Build tool and dev server | critical |
| tailwindcss | ^3.4.18 | Utility CSS framework | supporting |
| lucide-react | ^0.546.0 | Icon library | supporting |
| class-variance-authority | ^0.7.1 | Component variant management | supporting |
| clsx | ^2.1.1 | Conditional className utility | supporting |
| tailwind-merge | ^3.3.1 | Tailwind class merge utility | supporting |

---

## Deployment

| Environment | URL / Location | Status | Last Deploy |
|---|---|---|---|
| local | http://localhost:4501 | dev | N/A — local only |

---

## Known Patterns & Lessons

| Pattern | Trigger | Fix | Confidence |
|---|---|---|---|
| port-conflict | EADDRINUSE on startup | `lsof -i :PORT`, kill conflicting process | 0.9 |
| stale-dashboard | Apps showing wrong running status | Restart backend to refresh process tracking | 0.8 |

---

## Verification Log (append-only)

Every sweep of this SSOT must append one or more entries here. Never edit or remove existing entries.

| Timestamp | Section / Line | Fact Verified | Evidence Source | Confidence |
|---|---|---|---|---|
| 2026-04-28T07:15:29-0400 | Authority | Document initialized as SSOT | bootstrap.sh --init created from template | 100% |
| 2026-04-28 07:30 EDT | Stack | Backend is Express 4.18, ESM, port 4500 | backend/package.json, backend/server.js line 16 | 100% |
| 2026-04-28 07:30 EDT | Stack | Frontend is React 19 + Vite, port 4501 | frontend/package.json, frontend/vite.config.js line 8 | 100% |
| 2026-04-28 07:30 EDT | Architecture | No database, all state in-process | backend/server.js review — no DB imports | 100% |
| 2026-04-28 07:30 EDT | Dependencies | Backend deps: express, cors | backend/package.json | 100% |
| 2026-04-28 07:30 EDT | Dependencies | Frontend deps: react 19, vite, tailwind | frontend/package.json | 100% |

---

## Change Log (append-only)

- 2026-04-28T07:15:29-0400 — Initialized SSOT.
- 2026-04-28 07:30 EDT — Populated SSOT with verified project facts from codebase analysis.

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

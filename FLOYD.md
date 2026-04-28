# dev-launcher — FLOYD.md
**Version:** 1.5.0
**Initialized:** 2026-04-28T07:15:29-0400
**Governance:** .supercache/ v1.5.0
**Port:** 4500 (backend) / 4501 (frontend)
**Drive:** /Volumes/Storage
**Path:** /Volumes/Storage/Development/dev-launcher

> **Compliance Notice:** This file must match the template at
> `.supercache/templates/floyd-md-template.md`. If you are an agent reading
> this file and it is missing sections from the template, edit this file to
> add them. Preserve all project-specific content below. The template is the
> spec. This file is the implementation. Make them match.

---

## Agent Contract

You are working on **dev-launcher**, a Legacy AI project.

**This file (`FLOYD.md`) is the canonical project spec.** It is authoritative for project identity, stack, ports, build commands, environment variables, and project-specific rules. All agents — Floyd, Claude, or any model routed through the OhMyFloyd harness — read this file first.

**Some projects also have a `CLAUDE.md` adapter** alongside this file. That adapter is optional and applies only when Claude is the active agent. It does not duplicate anything here; it layers Claude-specific behavior and role guidance on top. If `CLAUDE.md` conflicts with `FLOYD.md` on project facts, `FLOYD.md` wins. See `.supercache/templates/claude-md-template.md` for the adapter spec.

### Before You Start
1. Read this file completely. Do not skim. Every section constrains your behavior.
2. **If you are Claude Code**: also read `CLAUDE.md` if it exists at the project root. It contains your role, division of labor with Floyd, and Claude-specific rules.
3. Read `.supercache/READONLY` — you MUST NOT write to `.supercache/`.
4. Read `SSOT/dev-launcher_SSOT.md` for current project state. Perform the Verification Sweep Protocol defined in `.supercache/contracts/document-management.md` for sections relevant to your task.
5. Read `Issues/dev-launcher_ISSUES.md` for open issues and blockers.
6. Read `.supercache/manifests/port-allocation-policy.yaml` — NEVER use port 3000, 5000, 8000, 8080, or any other forbidden port. This project uses ports **4500** (backend) and **4501** (frontend). Do not change them without Douglas Talley's explicit approval.
7. Read `.supercache/contracts/execution-contract.md` — this governs how you prove your work.
8. Read `.supercache/contracts/repo-structure.md` — canonical layout for this project's language, plus the migration workflow if structural changes are needed.
9. Read `.supercache/contracts/git-discipline.md` — pre-commit checklist, commit message standards, secret hygiene, and reputation guardrails.
10. Read `.supercache/contracts/document-management.md` — Anti-Cruft Rule, canonical document homes, SSOT verification sweep, reference materials tier.
11. Read `.supercache/contracts/repo-hygiene.md` — `.gitignore` baseline for this language, cleanup triggers, project root tidiness standards.
12. Read `.supercache/manifests/model-routing.yaml` — this tells you which LLM to use for what.

### Governance Location
```
.supercache/ → /Volumes/SanDisk1Tb/.supercache
```
This directory contains global templates, contracts, manifests, and routing config.
It is **READ-ONLY**. Do not create, modify, or delete any file there.

### Where You Write

| Location             | Purpose                                          | Example                                         |
|----------------------|--------------------------------------------------|-------------------------------------------------|
| `SSOT/`              | Project status, decisions, findings, verification | `SSOT/dev-launcher_SSOT.md`, `SSOT/decision-log.md` |
| `Issues/`            | Bugs, blockers, tasks, help-desk ledger          | `Issues/dev-launcher_ISSUES.md`, `Issues/0001-description.md` |
| `.floyd/`            | Agent working state, session logs, runtime cache | `.floyd/agent_log.jsonl`                        |
| Project source files | Your actual work                                 | Any file in the project tree not listed below   |

### Where You Do NOT Write

| Location          | Reason                                       |
|-------------------|----------------------------------------------|
| `.supercache/`    | Global governance — READ-ONLY for all agents |
| `backend/apps.local.js` | User-specific app configuration — gitignored personal data |

---

## Project Identity

| Field                | Value                                                                   |
|----------------------|-------------------------------------------------------------------------|
| **Name**             | dev-launcher                                                            |
| **Purpose**          | Web-based application launcher for managing and running local development projects from a single dashboard |
| **Primary Language** | JavaScript (ES2022, ESM)                                                |
| **Runtime**          | Node.js                                                                 |
| **Module System**    | ESM                                                                     |
| **Framework**        | Express (backend), React 19 + Vite (frontend)                           |
| **Database**         | None                                                                    |
| **Port**             | **4500** (backend API) / **4501** (frontend dashboard)                  |
| **Repository**       | github.com/CaptainPhantasy/DevLauncherDashboard                         |
| **Current Phase**    | Active development                                                      |

---

## Project Structure

```
dev-launcher/
├── backend/                     # Express API server
│   ├── server.js                # Main server entry point (port 4500)
│   ├── apps.js                  # Dynamic app configurations loader
│   ├── apps.local.js            # User personal apps (gitignored)
│   ├── apps-template.js         # Configuration examples
│   ├── apps.defaults.js         # Built-in fallback app configs
│   ├── config-utils.js          # Path resolution & environment utilities
│   ├── discovery.js             # Project discovery & port allocation
│   └── package.json             # Backend dependencies (express, cors)
├── frontend/                    # React + Vite dashboard
│   ├── src/                     # React UI components
│   ├── public/                  # Static assets
│   ├── index.html               # HTML entry point
│   ├── vite.config.js           # Vite config (port 4501)
│   ├── tailwind.config.js       # Tailwind CSS config
│   ├── postcss.config.js        # PostCSS config
│   ├── eslint.config.js         # ESLint flat config
│   ├── playwright.config.js     # E2E test config
│   └── package.json             # Frontend dependencies (React 19, Vite, Tailwind)
├── scripts/                     # Build/utility scripts
│   └── setup.js                 # Interactive setup wizard
├── docs/                        # Documentation
├── SSOT/                        # Project status and decisions
├── Issues/                      # Bug and task tracking
├── .floyd/                      # Agent working state
├── .env.example                 # Environment variable template
├── .gitignore                   # Ignores personal configs, node_modules, .env
├── start.sh                     # Quick start script
├── FLOYD.md                     # This file — canonical project spec
└── README.md                    # Public-facing project documentation
```

---

## Build & Verify Commands

| Action         | Command                          | Expected Result             |
|----------------|----------------------------------|-----------------------------|
| **Type check** | N/A — plain JavaScript project   | N/A                         |
| **Build**      | `cd frontend && npm run build`   | Exit 0, dist/ created       |
| **Test**       | N/A — no test runner configured  | N/A                         |
| **Lint**       | `cd frontend && npm run lint`    | Exit 0, no errors           |
| **Start**      | `cd backend && npm start`        | Server up on port 4500      |
| **Dev**        | `./start.sh`                     | Backend (4500) + Frontend (4501) running |

### Verification sequence after any change:
```bash
cd /Volumes/Storage/Development/dev-launcher/frontend && npm run lint && npm run build
```

---

## Port Allocation

| Port     | Service              | Status                              |
|----------|----------------------|-------------------------------------|
| **4500** | Backend API server   | Default in `backend/server.js`      |
| **4501** | Frontend dashboard   | Configured in `frontend/vite.config.js` |

**Note on .env.example defaults:** The `.env.example` references ports 3000, 4000, 5173, 8000 as defaults for *launched apps* — not for dev-launcher itself. These are user-configurable targets for the projects dev-launcher manages. Dev-launcher's own ports (4500/4501) are safe and non-forbidden.

**Rules:**
- Dev-launcher runs on ports 4500 and 4501.
- Do not change ports without Douglas Talley's explicit approval.
- Do not bind to any port in the forbidden list (see `.supercache/manifests/port-allocation-policy.yaml`).
- Verify before starting: `lsof -i :4500` and `lsof -i :4501` — if something else is bound, investigate before killing.

---

## Project-Specific Rules

| #   | Rule                                                                  | Rationale                                                     |
|-----|-----------------------------------------------------------------------|---------------------------------------------------------------|
| R1  | Never commit `backend/apps.local.js` — it contains user-specific paths | Personal machine paths and project lists are not portable      |
| R2  | Run `start.sh` to launch both services, not `npm start` alone         | Ensures backend starts before frontend; frontend waits for API |
| R3  | Frontend port is hardcoded in `vite.config.js` at 4501                | Must match CORS origins configured in backend                 |

---

## Known Patterns & Lessons

| Pattern           | Trigger                          | Fix                                         | Confidence |
|-------------------|----------------------------------|---------------------------------------------|------------|
| port-conflict     | EADDRINUSE on startup            | `lsof -i :PORT`, kill conflicting process   | 0.9        |
| stale-dashboard   | Apps showing wrong status        | Restart backend to refresh process tracking  | 0.8        |

---

## Environment Variables

| Variable                    | Required | Purpose                                  | Example           |
|-----------------------------|----------|------------------------------------------|-------------------|
| `DEV_ROOT`                  | No       | Base directory for project discovery     | `~/projects`      |
| `BACKEND_PORT`              | No       | Backend server port (default 4500)       | `4500`            |
| `BACKEND_HOST`              | No       | Backend bind address (default 127.0.0.1) | `127.0.0.1`       |
| `BROWSER_APP`               | No       | Browser to open on launch                | `Google Chrome`   |
| `TERMINAL_APP`              | No       | Terminal to open paths in                | `Terminal.app`    |
| `AUTO_REFRESH_INTERVAL`     | No       | Status check interval (ms)               | `2000`            |
| `ENABLE_PROJECT_DISCOVERY`  | No       | Auto-discover projects in DEV_ROOT       | `true`            |
| `ENABLE_AUTO_BROWSER_OPEN`  | No       | Open browser on start                    | `true`            |
| `LOG_LEVEL`                 | No       | Logging verbosity                        | `info`            |

---

## Execution Contract

Before claiming any task complete, provide:

1. **Exact action taken** — what you did, specifically
2. **Direct evidence** — file path + line, command + output, diff, or screenshot
3. **Verification result** — run the verification sequence above, all must exit 0
4. **Status** — mark COMPLETE only after steps 1-3 are proven

See `.supercache/contracts/execution-contract.md` for the full contract.

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

# Dev Launcher — Application Registry

Living document tracking all applications registered with the Dev Launcher platform.
Updated when apps are added, removed, or their port assignments change.

---

## Platform Ports

These are the Dev Launcher's own services. They are not configurable per-app.

| Port  | Service       | Description                          |
|-------|---------------|--------------------------------------|
| 4500  | Backend API   | Express server — app management API  |
| 4501  | Frontend      | Vite dev server — dashboard UI       |

---

## Registered Applications

| # | Application | Port | Range | Source Path | Type | Status |
|---|---|---|---|---|---|---|
| 1 | FranchiseOS | 3000 | 3000–3010 | `/Volumes/Storage/Development/FranchiseOS` | nextjs | Active |
| 2 | LeadFlip | 3002 | 3002–3020 | `/Volumes/Storage/Development/LeadFlip` | nextjs | Active |
| 3 | Sage MVP | 3001 | 3001–3010 | `/Volumes/Storage/Development/Sage` | nextjs | Active |
| 4 | Casper Atlas React | 3003 | 3003–3015 | `/Volumes/Storage/Development/casper-atlas-react` | cra | Active |
| 5 | LegacyAI OS | 3004 | 3004–3020 | `/Volumes/Storage/Development/LegacyAI OS` | nextjs | Active |
| 6 | 317Leads | 3005 | 3005–3020 | `/Volumes/Storage/Development/317Leads` | nextjs | Active |
| 7 | Agentic Workflow | 3006 | 3006–3020 | `/Volumes/Storage/Development/AgenticWorkflow` | nextjs | Active |
| 8 | BigThree | 3007 | 3007–3020 | `/Volumes/Storage/Development/BigThree` | nextjs | Active |
| 9 | GrantWise | 3008 | 3008–3020 | `/Volumes/Storage/Development/GrantWise` | nextjs | Active |
| 10 | SalesAI Clone | 3009 | 3009–3020 | `/Volumes/Storage/Development/SalesAI Clone` | nextjs | Active |
| 11 | BorderPass | 3030 | 3030–3039 | `/Volumes/Storage/Development/boarderpass` | nextjs | Active |
| 12 | Mac Mini Agent | 3040 | 3040–3049 | `/Volumes/Storage/mac-mini-agent` | fastapi | Active |
| 13 | FLOYD Agency | 3050 | 3050–3059 | `/Volumes/Storage/FLOYD _THE_AGENCY` | static | Active |
| 14 | Floyd The ANVIL | 3060 | 3060–3069 | `/Volumes/Storage/Floyd_The_ANVIL` | custom | Active |
| 15 | Drydock Field Tech | 3070 | 3070–3079 | `/Volumes/Storage/drydock-field-tech (2)` | vite | Active |
| 16 | CodeBase Cartographer | 3080 | 3080–3089 | `/Volumes/Storage/CodeBaseCartographer` | express | Active |
| 17 | Floyd Mobile PWA | 3090 | 3090–3099 | `/Volumes/Storage/FLOYD MOBILE  PWA w: NGROK TUNNEL/mobile/FloydMobile` | vite | Active |
| 18 | MOUTH2 | 3100 | 3100–3109 | `/Volumes/Storage/MOUTH2` | vite | Active |
| 19 | LAIAS | 3110 | 3110–3119 | `/Volumes/Storage/LAIAS` | docker | Active |
| 20 | The Instructor | 3120 | 3120–3129 | `/Volumes/Storage/The_Instructor/zip` | vite | Active |
| 21 | StreamlitForge | 3130 | 3130–3139 | `/Volumes/Storage/StreamlitForge` | flask | Active |
| 22 | TypeCasting | 3140 | 3140–3149 | `/Volumes/Storage/Development/TypeCasting` | vite | Active |
| 23 | Gemini for macOS | 3150 | 3150–3159 | `/Volumes/SanDisk1Tb/GEMINI for MacOS` | vite | Active |

---

## Multi-Service Applications

Some apps run more than one process. Their sub-services are listed here.

### Mac Mini Agent (port block 3040–3049)

| Service | Directory | Command | Framework |
|---|---|---|---|
| Backend (Listen) | `apps/listen` | `uv run python main.py` | fastapi |
| Middleware (Direct) | `apps/direct` | `uv run python main.py` | python |
| Middleware (Drive) | `apps/drive` | `uv run python main.py` | python |
| Middleware (Steer) | `apps/steer` | `swift run` | swift |

---

## Port Allocation Summary

| Range | Allocation | Notes |
|---|---|---|
| 4500–4501 | Dev Launcher platform | Backend API + Frontend dashboard |
| 3000–3009 | Legacy early apps | Next.js / CRA apps — original allocations |
| 3010–3029 | Expansion range for legacy apps | maxPort overflow for apps 1–10 |
| 3030–3159 | Port-block apps | Each app gets a 10-port block |

---

## Adding a New Application

1. Choose a port block starting at the next multiple of 10 after the last used block.
2. Edit `backend/apps.local.js` — add a new entry to the `USER_APPS` array.
3. Restart the Dev Launcher server.
4. Update this registry with the new app's details.

Required fields: `id`, `name`, `path`, `command`, `args`, `preferredPort`, `maxPort`.

---

## Change Log

- 2026-04-28 — Initial registry created from `backend/apps.local.js`. 23 apps cataloged across 2 port ranges.

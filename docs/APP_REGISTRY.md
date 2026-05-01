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
| 1 | FranchiseOS | 10010 | 10010–10019 | `/Volumes/Storage/Development/FranchiseOS` | nextjs | Active |
| 2 | LeadFlip | 10020 | 10020–10029 | `/Volumes/Storage/Development/LeadFlip` | nextjs | Active |
| 3 | Sage MVP | 10030 | 10030–10039 | `/Volumes/Storage/Development/Sage` | nextjs | Active |
| 4 | Casper Atlas React | 10040 | 10040–10049 | `/Volumes/Storage/Development/casper-atlas-react` | cra | Active |
| 5 | LegacyAI OS | 10050 | 10050–10059 | `/Volumes/Storage/Development/LegacyAI OS` | nextjs | Active |
| 6 | 317Leads | 10060 | 10060–10069 | `/Volumes/Storage/Development/317Leads` | nextjs | Active |
| 7 | Agentic Workflow | 10070 | 10070–10079 | `/Volumes/Storage/Development/AgenticWorkflow` | nextjs | Active |
| 8 | BigThree | 10080 | 10080–10089 | `/Volumes/Storage/Development/BigThree` | nextjs | Active |
| 9 | GrantWise | 10090 | 10090–10099 | `/Volumes/Storage/Development/GrantWise` | nextjs | Active |
| 10 | SalesAI Clone | 10100 | 10100–10109 | `/Volumes/Storage/Development/SalesAI Clone` | nextjs | Active |
| 11 | BorderPass | 10110 | 10110–10119 | `/Volumes/Storage/Development/boarderpass` | nextjs | Active |
| 12 | Mac Mini Agent | 10120 | 10120–10129 | `/Volumes/Storage/mac-mini-agent` | fastapi | Active |
| 13 | FLOYD Agency | 10130 | 10130–10139 | `/Volumes/Storage/FLOYD _THE_AGENCY` | static | Active |
| 14 | Floyd The ANVIL | 10140 | 10140–10149 | `/Volumes/Storage/Floyd_The_ANVIL` | custom | Active |
| 15 | Drydock Field Tech | 10150 | 10150–10159 | `/Volumes/Storage/drydock-field-tech (2)` | vite | Active |
| 16 | CodeBase Cartographer | 10160 | 10160–10169 | `/Volumes/Storage/CodeBaseCartographer` | express | Active |
| 17 | Floyd Mobile PWA | 10170 | 10170–10179 | `/Volumes/Storage/FLOYD MOBILE  PWA w: NGROK TUNNEL/mobile/FloydMobile` | vite | Active |
| 18 | MOUTH2 | 10180 | 10180–10189 | `/Volumes/Storage/MOUTH2` | vite | Active |
| 19 | LAIAS | 10190 | 10190–10199 | `/Volumes/Storage/LAIAS` | docker | Active |
| 20 | The Instructor | 10200 | 10200–10209 | `/Volumes/Storage/The_Instructor/zip` | vite | Active |
| 21 | StreamlitForge | 10210 | 10210–10219 | `/Volumes/Storage/StreamlitForge` | flask | Active |
| 22 | TypeCasting | 10220 | 10220–10229 | `/Volumes/Storage/Development/TypeCasting` | vite | Active |
| 23 | Gemini for macOS | 10230 | 10230–10239 | `/Volumes/SanDisk1Tb/GEMINI for MacOS` | vite | Active |

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
| 10000–10099 | Governed app examples | Recommended non-forbidden sample range for local apps |
| 10100–65535 | Expansion range | Claim in `/Volumes/SanDisk1Tb/SSOT/port-registry.json` before binding |
| 10000–10239 | Registered application blocks | Each app gets a 10-port governed block |

---

## Adding a New Application

1. Choose a port block starting at the next multiple of 10 after the last used block.
2. Edit `backend/apps.local.js` — add a new entry to the `USER_APPS` array.
3. Restart the Dev Launcher server.
4. Update this registry with the new app's details.

Required fields: `id`, `name`, `path`, `command`, `args`, `preferredPort`, `maxPort`.

---

## Change Log

- 2026-04-28 — Initial registry created from `backend/apps.local.js`. 23 apps cataloged; ports later normalized to governed non-forbidden blocks.

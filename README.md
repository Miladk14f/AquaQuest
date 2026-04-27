<div align="center">

# 🌊 WaterQuest

### Gamified River Cleanup · Satellite-Powered · Netherlands

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Copernicus](https://img.shields.io/badge/Data-Copernicus_Sentinel--2-003247?logo=esa&logoColor=white)](https://dataspace.copernicus.eu)

**WaterQuest identifies the most polluted rivers in the Netherlands using real satellite data — then turns cleanup into a team competition.**

[Live Demo](#) · [How It Works](#how-it-works) · [Quick Start](#quick-start) · [Deploy](#deployment)

![WaterQuest Hero](https://placehold.co/1200x500/1D9E75/ffffff?text=WaterQuest+—+Clean+Rivers%2C+Win+the+Week)

</div>

---

## What Is WaterQuest?

Every Monday morning, an automated pipeline fetches **Copernicus Sentinel-2 satellite imagery** for 6 waterway zones across the Netherlands. It computes algae bloom, floating plastic, and turbidity indices — then feeds the data to a **DeepSeek AI model** that selects the two most impactful cleanup locations for the week.

Citizens join a team, travel to a quest zone, photograph and remove garbage, and earn live points on a real-time leaderboard. The following Monday, new satellite imagery confirms whether the cleanup measurably improved water quality — **closing a full satellite-verified feedback loop.**

> *All infrastructure cost for a hackathon demo: **€0***
> Copernicus data is EU open data · AI via NVIDIA NIM free tier · Hosting via Vercel + Railway + Supabase free tiers

---

## How It Works

```
Monday 07:00 UTC
      │
      ▼
┌─────────────────────────┐
│  Copernicus Sentinel-2  │  ← Real satellite imagery, 10m resolution
│  6 NL waterway zones    │
└────────────┬────────────┘
             │  NDCI · FDI · Turbidity · NDWI
             ▼
┌─────────────────────────┐
│   Waarneming.nl API     │  ← Citizen pollution reports (free public API)
│   14-day radius search  │
└────────────┬────────────┘
             │  Enriched zone data
             ▼
┌─────────────────────────┐
│  DeepSeek-V4-Pro AI     │  ← Selects 2 quest zones via strict rules
│  NVIDIA NIM endpoint    │
└────────────┬────────────┘
             │  Quest A + Quest B
             ▼
┌─────────────────────────┐
│      Supabase DB        │  ← Stored, website updates immediately
│  Realtime leaderboard   │
└────────────┬────────────┘
             │
             ▼
      Citizens clean → photo AI classifies → points awarded
             │
      Next Monday: satellite before/after comparison published
```

---

## Features

| Feature | Description |
|---|---|
| 🛰️ **Satellite Quest Selection** | Real Sentinel-2 data selects the two most polluted zones every Monday |
| 🤖 **AI Photo Classification** | DeepSeek-V4-Pro classifies litter type, severity, and confirms validity |
| 🏆 **Live Team Competition** | Blue Wave vs Red River — real-time score updates via Supabase WebSocket |
| 🗺️ **Interactive Pollution Map** | Leaflet.js map with satellite hotspot layer and user photo heatmap |
| 📸 **Mobile Camera Upload** | Native camera on any phone, GPS auto-tagged, instant AI feedback |
| ✅ **Satellite-Verified Impact** | Before/after Sentinel-2 images prove the cleanup worked |
| ⏰ **Fully Automated Pipeline** | GitHub Actions cron — zero manual work every week |
| 📱 **Mobile-First Design** | Full functionality on any screen size, 44px touch targets throughout |

---

## Satellite Science

WaterQuest uses four spectral indices computed from Sentinel-2 multispectral bands:

| Index | Formula | Detects | Alert Threshold |
|---|---|---|---|
| **NDCI** | (B5 − B4) / (B5 + B4) | Algae / chlorophyll-a | > 0.15 = confirmed bloom |
| **FDI** | B8 − (B6 + (B11−B6) × factor) | Floating plastic / litter | > 0.02 = confirmed from space |
| **Turbidity** | B4 / B3 | Sediment / runoff | > 1.5 = heavy contamination |
| **NDWI** | (B3 − B8) / (B3 + B8) | Water pixel mask | > 0.1 = water |

All data is freely available via the [Copernicus Data Space](https://dataspace.copernicus.eu) — an EU open-data initiative.

---

## Monitored Zones

| Zone | Location | Public Access |
|---|---|---|
| Amsterdam canals | 52.375°N, 4.900°E | ✅ High |
| Nieuwe Maas Rotterdam | 51.905°N, 4.500°E | ✅ High |
| Waal near Nijmegen | 51.855°N, 5.885°E | 🟡 Medium |
| IJssel near Zutphen | 52.145°N, 6.210°E | 🟡 Medium |
| Markermeer shore | 52.460°N, 5.125°E | 🟡 Medium |
| Maas near Den Bosch | 51.695°N, 5.340°E | ✅ High |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS v4 |
| **Map** | Leaflet.js + OpenStreetMap (no API key needed) |
| **Real-time** | Supabase Realtime (WebSocket) |
| **Backend** | Python FastAPI |
| **Database** | PostgreSQL via Supabase |
| **AI** | NVIDIA NIM — DeepSeek-V4-Pro |
| **Satellite** | Copernicus Sentinel Hub Python SDK |
| **Scheduling** | GitHub Actions cron (Monday 07:00 UTC) |
| **Hosting** | Vercel (frontend) + Railway (backend) |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Supabase project (free tier)
- NVIDIA NIM API key (free tier)
- Copernicus Data Space OAuth credentials (free)

### 1. Clone & configure

```bash
git clone https://github.com/Miladk14f/AquaQuest.git
cd AquaQuest
cp .env.example .env
# Fill in your API keys in .env
```

### 2. Set up the database

Run `schema.sql` in your **Supabase SQL Editor** (Dashboard → SQL Editor → paste → Run).

Then enable Realtime on the `team_scores` table:
> Dashboard → Database → Replication → toggle `team_scores` ON

Create a storage bucket named `pollution-photos` and set it to **public**.

### 3. Start the backend

```bash
# Create and activate virtual environment
python -m venv .venv
.venv/Scripts/activate    # Windows
# source .venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
python main.py
# → http://localhost:8000
# → API docs: http://localhost:8000/docs
```

### 4. Start the frontend

```bash
cd frontend
cp .env.example .env     # fill in VITE_SUPABASE_URL etc.
npm install
npm run dev
# → http://localhost:5173
```

### 5. Run the pipeline manually (optional)

```bash
python pipeline/main_pipeline.py
```

This fetches live satellite data, selects quest zones via AI, and saves them to Supabase. Quests appear on the website immediately.

> **No API keys yet?** The app runs in **demo mode** automatically — showing sample Amsterdam + Rotterdam quest data so you can explore the full UI.

---

## Project Structure

```
AquaQuest/
├── main.py                        # FastAPI entry point
├── requirements.txt
├── schema.sql                     # Supabase database schema
├── .env.example                   # API key template (safe to commit)
│
├── pipeline/
│   ├── sentinel_fetch.py          # Copernicus Sentinel-2 data + indices
│   ├── waarneming_fetch.py        # Citizen pollution reports API
│   ├── copernicus_browser.py      # Satellite view URL generator
│   ├── agent_analysis.py          # DeepSeek AI quest selector
│   ├── photo_pipeline.py          # Photo classifier + hotspot clustering
│   └── main_pipeline.py           # Weekly orchestrator
│
├── api/
│   └── routes/
│       ├── quests.py              # GET /api/v1/quests/current
│       ├── photos.py              # POST /api/v1/photos/upload
│       ├── scores.py              # GET /api/v1/scores/live
│       └── admin.py               # POST /api/v1/admin/run-pipeline
│
├── frontend/
│   └── src/
│       ├── pages/                 # Home, Quest, Leaderboard, Map, Upload, Impact, About, Admin
│       ├── components/            # Navbar, TeamBar, MapView, PhotoUpload, QuestCard, Countdown
│       ├── hooks/                 # useQuests, useRealtime, useGeolocation
│       └── lib/                   # supabase.js, api.js, demo.js
│
└── .github/
    └── workflows/
        └── weekly_quest.yml       # Monday 07:00 UTC cron pipeline
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. **Never commit `.env`** — it is already in `.gitignore`.

| Variable | Description | Where to get it |
|---|---|---|
| `NVIDIA_API_KEY` | NVIDIA NIM API key | [build.nvidia.com](https://build.nvidia.com) |
| `COPERNICUS_CLIENT_ID` | Copernicus OAuth client ID | [dataspace.copernicus.eu](https://dataspace.copernicus.eu) |
| `COPERNICUS_CLIENT_SECRET` | Copernicus OAuth secret | Same as above |
| `SUPABASE_URL` | Your Supabase project URL | [supabase.com](https://supabase.com) → Settings → API |
| `SUPABASE_ANON_KEY` | Public anon key (frontend) | Same as above |
| `SUPABASE_SERVICE_KEY` | Service role key (backend) | Same as above |
| `SECRET_KEY` | JWT secret — run `openssl rand -hex 32` | Generated locally |
| `ADMIN_PASSWORD` | Password for `/admin` dashboard | Choose your own |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` (Vite prefix) | Same as above |
| `VITE_SUPABASE_ANON_KEY` | Same as `SUPABASE_ANON_KEY` | Same as above |
| `VITE_API_URL` | Backend URL (`http://localhost:8000` locally) | — |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm install -g vercel
vercel --prod
```

Set environment variables in **Vercel Dashboard → Project → Settings → Environment Variables**:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (your Railway URL)

### Backend → Railway

1. Push to GitHub
2. [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all env vars from the table above

### Automated Pipeline → GitHub Actions

Add your secrets at **Repository → Settings → Secrets and variables → Actions**:

```
NVIDIA_API_KEY
COPERNICUS_CLIENT_ID
COPERNICUS_CLIENT_SECRET
SUPABASE_URL
SUPABASE_SERVICE_KEY
```

The pipeline runs automatically every **Monday at 07:00 UTC**. You can also trigger it manually from the Actions tab.

---

## Gamification

| Action | Points |
|---|---|
| Check in at quest zone (GPS verified) | **50 pts** |
| Submit valid pollution photo — low severity | **15 pts** |
| Submit valid pollution photo — medium | **20 pts** |
| Submit valid pollution photo — high | **30 pts** |
| AI confidence bonus (> 0.8) | **+5 pts** |
| First photo at a new GPS cluster | **50 pts** |
| 3 submissions in one visit (combo) | **75 pts** |
| Satellite improvement confirmed next Monday | **200 pts** (whole team) |
| Recruit a new user | **100 pts** |

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | **Home** | Netherlands map with quest markers, live team bars, countdown |
| `/quest` | **This Week's Quest** | Quest A + B cards, satellite evidence, join team |
| `/leaderboard` | **Live Scoreboard** | Real-time team progress, points table, weekly stats |
| `/map` | **Pollution Map** | Leaflet map with satellite hotspot + photo heatmap layers |
| `/upload` | **Report Pollution** | Mobile camera upload, GPS tag, AI classification result |
| `/impact` | **Impact** | Before/after satellite images, improvement %, quest history |
| `/about` | **About & Science** | Spectral indices explained, data sources, FAQ |
| `/admin` | **Admin** | Password-protected pipeline trigger and zone data preview |

---

## Data Sources

| Source | Resolution | Used For | Cost |
|---|---|---|---|
| Sentinel-2 L2A (Copernicus) | 10m optical | NDCI, FDI, Turbidity, NDWI | Free |
| Sentinel-1 (Copernicus) | 20m SAR | Flood mapping, cloud-independent | Free |
| Sentinel-3 (Copernicus) | 300m | Sea temperature, large algae | Free |
| CLMS Land Monitoring | 1km / 300m | Soil Water Index | Free |
| Waarneming.nl API | GPS points | Citizen pollution reports | Free |

---

## Security

- All API keys are stored in `.env` (gitignored) and platform environment variables — never in source code
- `.env.example` contains only placeholder text — safe to commit
- Admin dashboard requires HTTP Basic Auth with a password set via `ADMIN_PASSWORD` env var
- Photo uploads are validated for GPS bounds (Netherlands only) and file size (10 MB max)
- Supabase Row Level Security can be enabled for production use

---

## License

MIT © 2026 — WaterQuest Team

| | Contributor |
|---|---|
| [@Miladk14f](https://github.com/Miladk14f) | Milad |
| [@W0lfik](https://github.com/W0lfik) | W0lfik |
| [@iliad77](https://github.com/iliad77) | iliad77 |
| [@BringMeChaos](https://github.com/BringMeChaos) | BringMeChaos |
| [@anasstyyaa](https://github.com/anasstyyaa) | anasstyyaa |

---

<div align="center">

**WaterQuest** — Built for the Netherlands. Powered by European open satellite data.

*Clean rivers. Win the week. Save the Netherlands.*

</div>

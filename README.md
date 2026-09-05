# 🌿 EcoGuard AI – Smart Industrial Pollution Monitoring System

**IBM Agentic AI Hackathon 2024 · Challenge 9**  
*Smart Industrial Pollution Monitoring for Golden Corridor (Vapi–Ankleshwar–Vatva)*

---

## 🚀 Quick Start (Double-Click)

| File | Action |
|------|--------|
| `START_ECOGUARD.bat` | 🟢 **Start full app** (seeds DB + backend + frontend) |
| `START_BACKEND.bat`  | Start backend only (port 5000) |
| `START_FRONTEND.bat` | Start frontend only (port 3000) |
| `SEED_DATABASE.bat`  | Re-seed demo data |

**Then open:** http://localhost:3000  
**Login:** `admin@ecoguard.ai` / `Admin@123`

---

## 📋 Project Overview

EcoGuard AI is a full-stack Agentic AI platform that continuously monitors industrial emissions and effluents in the Vapi–Ankleshwar–Vatva industrial corridor, detects violations, and triggers timely regulatory and community alerts.

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React.js + Chart.js + React Router |
| Backend | Node.js + Express.js |
| Database | NeDB (pure-JS embedded, no native builds) |
| AI/LLM | IBM Granite (`ibm/granite-13b-instruct-v2`) |
| Cloud | IBM WatsonX + IBM Cloud |

---

## 🤖 AI Agents

| Agent | Role |
|-------|------|
| 🔬 Emission & Effluent Monitoring Agent | Continuously monitors air/water sensor data |
| ⚠️ Violation Detection & Compliance Agent | Detects threshold exceedances, assigns severity |
| 📋 Regulatory Alert & Escalation Agent | Generates GPCB alerts, escalates violations |
| 🏥 Public Health Risk Assessment Agent | Evaluates community health impact |
| 🔍 Pollution Investigation Agent | Investigates spikes using historical data |
| 📊 Industrial Pollution Dashboard Agent | Aggregates all data for real-time display |

---

## 📊 Dashboard Pages

1. **Dashboard** – KPI overview, charts, recent incidents
2. **Live Monitoring** – Real-time air/water gauges (auto-refresh 5s)
3. **Air Quality** – PM2.5, PM10, SO₂, NO₂, CO, VOCs vs NAAQS
4. **Water Quality** – pH, COD, BOD, TDS, Turbidity vs GPCB
5. **Industries** – All 10 industrial units with compliance scores
6. **Sensors** – 40+ sensors with type, status and last reading
7. **Violations** – Paginated violations with AI analysis button
8. **Alerts** – Acknowledge/resolve/escalate alerts
9. **Health Risk** – Per-industry risk assessment cards
10. **Pollution Map** – SVG corridor map with color-coded industry dots
11. **Analytics** – 24-hour trend charts, violation distribution
12. **AI Reports** – Generate Granite LLM compliance reports, ask AI questions
13. **Agent Monitoring** – Live agent status, activity log, manual trigger
14. **Settings** – Theme, language, thresholds, IBM credentials

---

## 🌐 Language Support

Toggle in the top navigation bar:
- 🇬🇧 **English**
- 🇮🇳 **हिंदी (Hindi)**
- 🇮🇳 **ગુજરાતી (Gujarati)**

---

## 🎨 Theme Support

Toggle **Light / Dark Mode** in the top navigation bar.

---

## 🔑 IBM Credentials

```
Project ID   : 29f2b75e-ec3e-463c-b6de-aefa520a2d81
API Key      : _DYH5uur3l01T5cJnDFocOIDJArrajmrBTpa-yVp1jHR
WatsonX URL  : https://api.au-syd.watson-orchestrate.cloud.ibm.com/instances/012a2164-ac43-4d87-a90b-39ed1e476339
```

---

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Server health + WatsonX status |
| `POST /api/auth/login` | Login → JWT token |
| `GET /api/dashboard/stats` | KPI statistics |
| `GET /api/industries` | All industries |
| `GET /api/sensors` | All sensors |
| `GET /api/readings?type=air` | Pollution readings |
| `GET /api/readings/live` | Live simulated reading |
| `GET /api/violations` | All violations |
| `GET /api/alerts` | All alerts |
| `GET /api/risk` | Risk assessments |
| `GET /api/agents` | Agent status |
| `POST /api/ai/summarize` | Granite AI summary |
| `POST /api/ai/report` | Generate compliance report |
| `POST /api/ai/query` | Ask AI a question |

---

## 📂 Project Structure

```
pollution-monitoring-system/
├── backend/
│   ├── middleware/auth.js       # JWT authentication
│   ├── routes/                  # 10 REST API routes
│   ├── services/
│   │   ├── database.js          # NeDB wrapper
│   │   ├── watsonx.js           # IBM Granite LLM client
│   │   └── simulator.js         # IoT data simulator
│   ├── scripts/seed.js          # Demo data seeder
│   ├── .env                     # IBM credentials
│   └── server.js                # Express app
├── frontend/
│   ├── src/
│   │   ├── context/             # Auth, Language, Theme contexts
│   │   ├── components/Layout.js # Sidebar + topbar
│   │   ├── pages/               # 15 dashboard pages
│   │   └── services/api.js      # Axios API client
│   └── package.json
├── START_ECOGUARD.bat           # 🟢 Main launcher
├── START_BACKEND.bat
├── START_FRONTEND.bat
├── SEED_DATABASE.bat
└── README.md
```

---

## 🏭 Demo Data

| Entity | Count |
|--------|-------|
| Industries | 10 (Vapi, Ankleshwar, Vatva) |
| Sensors | 40 (air + water per industry) |
| Readings | ~840 (24h hourly history) |
| Violations | 40 (mixed severity) |
| Alerts | 25 |
| Risk Assessments | 10 |
| Agent Activities | 60 |

Includes **normal, warning, high-risk and critical** pollution scenarios.

---

*IBM Agentic AI Hackathon 2024 · Challenge 9 · Vapi–Ankleshwar–Vatva Corridor*

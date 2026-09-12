# SahkaarSetu — Operations & Administration Portal (SIH26088)

> **Dedicated Operations & Governance Frontend for Multilingual Cooperative AI Platform**  
> Connects to the single existing FastAPI backend at `SIH26088-Cooperative-AI`.

---

## 📌 Architecture Overview

The **SahkaarSetu Operations Portal** provides operational oversight over deployed rural PACS hardware kiosks, official legal and by-law knowledge sources, citizen grievances, and AI assistance telemetry.

```
CITIZEN PLATFORM (Web/Voice/Kiosk)
          ↓
   SAHKAARSETU AI
          ↓
ESCALATION / KNOWLEDGE GAP
          ↓
  OPERATIONS STAFF (Admin Portal)
          ↓
VERIFY / RESOLVE / UPDATE
          ↓
   KNOWLEDGE BASE (Postgres + pgvector)
          ↓
  BETTER FUTURE ANSWERS (Zero re-training)
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite 8 + TypeScript 6
- **Icons**: Lucide React
- **Design Tokens**: Official Indian Cooperative Green (`#1b5e20`), Trust Blue (`#0d47a1`), Harvest Saffron (`#e65100`)
- **API Client**: Native `fetch` communicating strictly with the single FastAPI backend.

---

## 🚀 Quick Start (Development)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run dev server** (default port `5174` to avoid conflict with citizen port `5173`):
   ```bash
   npm run dev
   ```

3. **Build for Production / GitHub Pages**:
   ```bash
   npm run build
   ```

---

## ⚙️ Environment Configuration

Set the FastAPI backend URL via `VITE_API_BASE_URL`:

- **Local Development**:
  ```env
  VITE_API_BASE_URL=http://localhost:8000
  ```

- **Production (Render Deployment)**:
  ```env
  VITE_API_BASE_URL=https://sih26088-cooperative-ai.onrender.com
  ```

> 🔒 **Security Notice**: No secrets (Gemini API keys, Supabase service-role keys) are ever embedded in the frontend bundle. All database and LLM calls route through FastAPI.

---

## 📡 Live Backend APIs vs Demo Data

| Module | Features | Data Source |
|---|---|---|
| **System Health** | Backend liveness, AI provider info, models | **Live**: `GET /health` |
| **Knowledge Base** | Document list | **Live**: `GET /api/knowledge/documents` |
| **Vector Search** | Semantic chunk retrieval & cosine similarity | **Live**: `GET /api/knowledge/search` |
| **Grievance Lookup** | Case fetch by UUID & structured summary | **Live**: `GET /api/grievance/{id}` |
| **AI Grounding** | Test AI responses against active knowledge | **Live**: `POST /api/query` |
| **Kiosks Fleet** | Telemetry, printers, heartbeats, network | **Demo**: `src/data/demo/kiosksDemo.ts` |
| **Grievance Listing** | Multi-case triage, assignment, status update | **Demo**: `src/data/demo/grievancesDemo.ts` |
| **Document Ingestion** | Upload, verification workflow, version history | **Demo**: `src/data/demo/knowledgeDemo.ts` |
| **Analytics & Gaps** | Demand timeline, categories, language share | **Demo**: `src/data/demo/analyticsDemo.ts` |
| **Authentication** | Operator role switching (`ADMIN` vs `STAFF`) | **Demo**: Pre-wired for future `/api/auth` |

---

## 🌐 GitHub Pages Deployment

The build is configured with relative paths (`base: './'`) in `vite.config.ts`. The compiled assets in `dist/` can be deployed directly to GitHub Pages or any static CDN.

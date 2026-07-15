# Project Prompt Blueprint: VantageBI (A to Z)

Use the prompt below to feed into any AI system or developer context to immediately explain, spin up, or debug the entire **VantageBI** application.

---

```markdown
You are an expert AI system and full-stack software architect. Below is the complete "A to Z" technical blueprint and architecture details for "VantageBI" — an advanced, AI-driven, multilingual Business Intelligence platform. Use this context to understand, modify, or extend the codebase.

---

## 🚀 1. Project Overview & Core Mission
VantageBI is a self-service Business Intelligence (BI) application built to help business owners upload complex financial or operational data (in Excel/CSV format) and instantly receive:
- Comprehensive multi-file correlation insights.
- Critical anomaly alerts (emailed directly via SMTP).
- An interactive chatbot that translates business questions into SQLite commands, queries the user's data, and answers in English, Tamil, or Hindi.
- An interactive Profit Calendar to track daily profit/loss (both manual logging and AI auto-extraction).
- A custom data visualizer that builds SQL charts (Bar, Line, Area, Pie) and provides AI trend explanations.
- A robust offline diagnostic compiler that guarantees the analysis works instantly even if the Gemini API key runs out of daily quota.

---

## 🛠️ 2. Tech Stack & Infrastructure
- **Frontend**: Vite + React 19, Vanilla CSS (with tailwindcss styling details), Lucide React (Icons), Axios (API client), Chart.js & React-Chartjs-2 (Visualizations).
- **Backend**: FastAPI (Python 3.11), Uvicorn server, SQLAlchemy (ORM), Pydantic (data validation), SQLite (central control DB + sandboxed session files).
- **AI Core**: Google GenAI SDK (`gemini-2.0-flash` model) for reasoning, SQL translation, and trend explanations.
- **SMTP Sandbox**: Integration with Ethereal Email for testing HTML analytical report delivery.

---

## 🗄️ 3. Database Architecture (SQLite)

### A. Central Database (`vantage_central.db`)
Manages accounts, chat logs, settings, and generated reports:
1. `users` — Stores name, email, and password hashes for authentication.
2. `sessions` — Session tracking, links a user's session to a sandboxed SQLite database file, email preferences, and status (`UPLOADED`, `RUNNING`, `COMPLETED`, `FAILED`).
3. `reports` — Caches the structured JSON list of compiled business insights.
4. `alerts` — Stores high/warning severity business anomalies discovered.
5. `chat_messages` — History of chat lines (`user` vs `assistant`).
6. `daily_ledger` — Performance tracking linked to user emails (`date`, `income`, `expenses`, `profit`, `notes`, `source`).

### B. Sandboxed Databases (`/backend/data/sandbox_<session_id>.db`)
* When a user uploads multiple Excel or CSV files, VantageBI parses every sheet into a dedicated table inside an isolated SQLite database file unique to that session.
* All AI queries and user chat questions run strictly read-only SELECT commands against these isolated files to guarantee security.

---

## 🔄 4. Feature Implementation & Implementation Details

### A. Upload & Schema Compilation (`/api/upload`)
* Parses files using `pandas`, cleans column headers, handles dates, and writes them into sandbox SQLite files.
* Compiles a structural catalog detailing table names, column names, data types, row counts, and sample records.

### B. The 5-Phase Analysis Pipeline (`/api/agent/run/{session_id}`)
Runs asynchronously and streams status logs via Server-Sent Events (SSE):
- **Phase 1: Hypothesis Formulation**: Gemini scans schemas to identify key metrics (revenue, customer counts, dates) and formulates 5 analytical hypotheses.
- **Phase 2: Individual File Analysis**: Agent writes and runs SQL queries to validate hypotheses against specific tables.
- **Phase 3: Cross-File Correlation**: Agent identifies primary/foreign keys and joins tables to discover hidden patterns.
- **Phase 4: Synthesis & Ranking**: Merges findings, flags high-impact items, and filters out duplicates.
- **Phase 5: Email Dispatch**: Compiles an HTML report and emails it to the owner.

### C. Offline Diagnostic Fallback (Fail-Safe)
If Gemini is rate-limited (429) or returns a deprecated error (404), the pipeline instantly switches to a **Local Diagnostic Compiler**. It runs predefined SQL queries to count rows, find sales peaks, calculate total margins, detect empty fields, and output high-quality insights instantly, guaranteeing the dashboard completes in under 15 seconds.

### D. Multilingual SQL Chatbot (`/api/chat/{session_id}`)
* Automatically detects English, Tamil, or Hindi inputs.
* Uses Gemini to translate the user's natural language question into a clean SQLite SELECT query.
* Executes the query safely, reads the result, and formats a friendly answer in the detected language.

### E. Profit Calendar & Historical Ledger (`/api/ledger`)
* Renders a calendar view where days are color-coded (Green = profit, Red = loss).
* Includes a form modal to manually log days.
* Contains a table showing complete transaction history with CSV download capability.
* Renders an **AI Auto-Extract** trigger that scans sandboxed spreadsheets, finds transaction fields, and auto-loads daily logs.

### F. Interactive Charts Visualizer (`/api/ledger/query/{session_id}`)
* Fetches the database tables and populates X and Y axis column dropdowns.
* Generates SQL aggregates on the fly and renders Line, Bar, Area, or Pie charts.
* Calls `/api/chat/explain-trend` to generate a 2-sentence AI analysis describing the graph.

---

## 🔒 5. Key Safety & Performance Rules
1. **Security**: All custom queries must pass through a strict regex validator allowing only `SELECT` operations. Writes, updates, or drops are blocked.
2. **Timeout Caps**: Gemini LLM connections are capped at `4.0s` to ensure the analysis never hangs and avoids Render's 30-second SSE gateway cut.
3. **Model Configuration**: Always configure Google AI SDK using model string `gemini-2.0-flash`.
```

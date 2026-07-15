# Interview Preparation Guide: VantageBI

This guide prepares you to confidently discuss **VantageBI** in technical and product interviews. It explains the project's core concepts, architecture, engineering challenges, and how they were solved in simple, clear language.

---

## 🎤 1. The Elevator Pitch (How to introduce the project)
> *"VantageBI is a self-service Business Intelligence (BI) SaaS application. It allows business owners to upload raw Excel or CSV files and automatically get deep business insights, critical alerts, interactive charts, and an AI chat assistant. Unlike typical BI platforms that require complex setup, VantageBI automatically parses data into secure sandboxed databases, runs automated agent audits, and translates natural language questions into secure SQL queries in real-time."*

---

## 🛠️ 2. The Technical Stack & Architecture

### **The Frontend (Client Side)**
* **React 19 & Vite**: Fast rendering, responsive modular UI.
* **Tailwind CSS & Google Font 'Outfit'**: Modern, premium dark-mode dashboard (Futuristic Purple-Cyan palette).
* **Chart.js & React-Chartjs-2**: Renders real-time interactive business graphs (Line, Bar, Area, Pie).

### **The Backend (Server Side)**
* **FastAPI (Python)**: Extremely fast, asynchronous framework for handling uploads and streaming agent analysis logs.
* **SQLite (Databases)**:
  1. **Central DB (`vantage_central.db`)**: Manages user signups, sessions, chat history, and the profit/loss ledger.
  2. **Sandboxed Session DBs**: When a user uploads CSVs/Excel, the backend parses each spreadsheet sheet into a separate table inside a sandboxed SQLite file unique to that session (`sandbox_<session_id>.db`).

### **The AI Core**
* **Google Gemini 2.0 Flash**: Handles natural language processing, SQL translation, and trend explanations.

---

## 🔄 3. How the Core Features Work (Simply Explained)

### **A. Asynchronous 5-Phase Analysis Pipeline**
When a file is uploaded, an AI Agent runs a 5-step audit and streams the logs in real-time using **Server-Sent Events (SSE)**:
1. **Hypothesis Formulation**: Gemini reads the data structure (schema) and proposes 5 business hypotheses (e.g., *"Chennai is the highest-revenue region"*).
2. **Single-File Analysis**: The agent writes SQL queries to validate these hypotheses on individual tables.
3. **Cross-File Correlation**: The agent finds matching keys and runs SQL joins to find connections between different files.
4. **Synthesis & Ranking**: It ranks findings by impact (High, Medium, Low) and flags alerts.
5. **Email Delivery**: Formats the report as HTML and emails it to the user.

### **B. Multilingual SQL Chatbot**
* The chatbot detects English, Tamil, or Hindi automatically.
* It sends the database schema and user question to Gemini, asking it to write a read-only SQLite query.
* The backend runs the query against the sandboxed database, feeds the results back to Gemini, and translates the final answer into the user's language.

### **C. Profit Calendar & Auto-Extraction**
* Displays a monthly calendar indicating daily profit (green) and loss (red).
* Allows manual transaction logs.
* Features **AI Auto-Extraction**: scans database tables, runs aggregates, and logs daily totals automatically.

---

## 🏆 4. Key Engineering Challenges You Solved (Great for Interviews!)

Interviewers love hearing about problems you faced and how you solved them. Here are the 4 main challenges solved in this project:

### **Challenge 1: Handling API Rate Limits & Quota Exhaustion**
* **The Problem**: Google's Free Tier Gemini API has strict daily quota limits (1,500 requests/day). If the user reached this limit, the application would crash or hang at "Formulating correlation findings..."
* **The Solution**: Built an **Offline Heuristic/Diagnostic Compiler fallback**. If the Gemini API returns a rate-limit (429) or deprecation error (404), the backend automatically activates local Python diagnostics. It runs standard SQL metrics (row counts, null value scans, margin averages) and compiles standard business insights locally in under 15 seconds without calling Gemini.

### **Challenge 2: Overcoming Render's 30-Second Gateway Timeout**
* **The Problem**: Render's routing layer automatically cuts off HTTP connections if a request takes longer than 30 seconds. Because LLM network calls were slow, the analysis pipeline often timed out, leaving the browser screen frozen.
* **The Solution**: Reduced the LLM network timeout threshold from 10 seconds to **4.0 seconds**. If Gemini doesn't respond in 4.0 seconds, the agent defaults to baseline heuristics. This guarantees the entire 5-phase analysis completes in under 15 seconds, well below Render's limit.

### **Challenge 3: Security & Database Protection**
* **The Problem**: Running user-generated SQL queries is dangerous and opens the app to SQL Injection (where users could modify or delete data).
* **The Solution**: Created a strict **SELECT-only regex validator**. Before any query runs, the backend validates that it is strictly a read-only `SELECT` query. Commands like `INSERT`, `UPDATE`, `DELETE`, `DROP`, or `ALTER` are immediately blocked.

### **Challenge 4: High-Visibility Favicon Asset Rendering**
* **The Problem**: Squeezing a horizontal brand logo with margins and text into a 16x16 browser tab made the favicon unreadable. Additionally, browser cache kept displaying the old icons.
* **The Solution**: Wrote a Python Pillow script to scan and crop **only** the central chart symbol (left=302, right=732), removing all text and margins. Added a cache-busting query parameter (`?v=3`) to all favicon links in the HTML header, forcing the browser to load the fresh favicon immediately.

---

## ❓ 5. Sample Interview Questions & Suggested Answers

#### **Q: Why did you choose SQLite for sandboxing instead of a central SQL database?**
> *"Security and isolation. If we loaded all user spreadsheets into a single PostgreSQL database, one user's queries might accidentally access or corrupt another user's data. By parsing each session's files into a standalone, isolated SQLite database file, we create a secure sandbox. Once the session ends, we can easily delete the file, preventing data leaks."*

#### **Q: How does the multilingual chatbot handle translations?**
> *"It doesn't translate the text word-for-word. Instead, we use a system prompt that tells Gemini to act as a SQL translator. We feed it the question, detect the language, run the generated SQL on our SQLite database, and ask Gemini to formulate the final response in the same language. This keeps the answers natural and prevents technical jargon from leaking into Tamil or Hindi translations."*

#### **Q: What is the benefit of using Server-Sent Events (SSE) over standard REST APIs?**
> *"The analysis pipeline takes 10 to 15 seconds to run. A standard HTTP REST request would force the user to wait on a loading spinner without knowing what is happening. By using Server-Sent Events, the server opens a persistent one-way communication channel, streaming live log messages (e.g., 'Formulating correlation findings') directly to the frontend as they happen, creating a highly responsive and alive UI."*

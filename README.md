# BizLens AI — Smart Business Intelligence Assistant

BizLens AI is a friendly, multilingual business intelligence dashboard built for non-technical small business owners in India. It accepts multiple Excel/CSV files, automatically discovers cross-file patterns, triggers proactive SMTP email alerts for critical risks, and lets owners ask questions about their data in **English, Tamil (தமிழ்), or Hindi (हिंदी)** without using technical SQL terms.

---

## 🌟 Key Features
- **Auto-Join Cross-File Analysis**: Relates sales, expenses, and inventory tables dynamically to identify stockout speeds, sales dropouts, and cash flow deficits.
- **Multilingual Recognition (EN / TA / HI)**: Auto-detects the user's input language and speaks back naturally in simple business terms.
- **Select-Only SQLite Sandbox**: Safely processes data uploads in isolated per-session databases, verifying and enforcing read-only SQLite executions.
- **Gmail SMTP Alerts**: Real-time alerts sent automatically to the owner's email for critical business thresholds (e.g., expenses exceeding revenue, or popular items running out of stock).

---

## 🛠️ Tech Stack
- **Backend**: FastAPI (Python), SQLAlchemy, Pandas, Openpyxl, LangDetect, Google Generative AI SDK (`gemini-flash-lite-latest`).
- **Frontend**: React (Vite), Tailwind CSS v3 (Light Theme), Lucide Icons, Axios.
- **Data Sandbox**: SQLite.
- **SMTP Service**: Python `smtplib` + Gmail App Password.

---

## 📂 Project Structure
```
bizlens-ai/
├── backend/
│   ├── main.py
│   ├── agent/                 # Core analysis loops and ranking systems
│   ├── routers/               # Upload, SSE stream, chat, and history APIs
│   ├── services/              # Emailer, translations, and HTML report compilers
│   ├── db/                    # SQLAlchemy database tables mapping
│   ├── utils/                 # Pandas excel parsers & SELECT SQL runners
│   └── requirements.txt
├── frontend/
│   ├── src/                   # React app, Pages, and Components
│   └── package.json
├── sample_data/               # Pre-generated test CSV datasets
└── README.md
```

---

## 🚀 Setup & Execution

### 1. Gmail SMTP Setup (For Alerts)
To receive email alerts, configure a Gmail App Password:
1. Go to your **Google Account Settings** -> **Security**.
2. Enable **2-Step Verification**.
3. Search for **App passwords** (or go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Create an app password called `BizLens` and copy the 16-character code.
5. Add it to `backend/.env` under `GMAIL_APP_PASSWORD`.

### 2. Backend Setup
1. Open a PowerShell window and enter the backend directory:
   ```powershell
   cd backend
   ```
2. Create your `.env` file and populate it (our tool has already configured the Gemini key for you):
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   DATABASE_URL=sqlite:///./bizlens.db
   UPLOAD_DIR=./uploads
   GMAIL_SENDER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_16_character_app_password
   ```
3. Install the requirements:
   ```powershell
   pip install -r requirements.txt
   ```
4. Start the server:
   ```powershell
   python -m uvicorn main:app --reload
   ```

### 3. Frontend Setup
1. Open a **new PowerShell window** and enter the frontend directory:
   ```powershell
   cd frontend
   ```
2. Install node packages:
   ```powershell
   npm install
   ```
3. Start the dev server:
   ```powershell
   npm run dev
   ```
4. Open the displayed link: `http://localhost:5173`.

---

## 🔍 Pre-Planted Business Patterns (Test Walkthrough)
We have generated 4 sample files inside `sample_data/` containing complex patterns:
1. **`sales_jan_march.csv`**: Record of 300 transactions. Contains an intentional **25% sales drop** in February.
2. **`expenses_jan_march.csv`**: Record of 150 business costs. February expenses are **inflated by 60%** (creating a cash flow deficit!).
3. **`inventory.csv`**: Shows **8 products are under reorder limits**, 3 of which are top-sellers in the sales sheet (stockout risk).
4. **`customers.csv`**: Shows Chennai has high repeat customers, while **40% of standard cohorts churn** after 1 purchase.

### Run the Demo:
1. Open the UI, drag and drop the four files from `sample_data/` into the upload zone.
2. Enter your email in the alert setup box.
3. Click **Analyze My Business**.
4. The agent will run, trigger warnings, email you a full HTML report, and show the discoveries!
5. Ask in the chat:
   - Tamil: `"இந்த மாசம் எந்த product அதிகமா விற்பனை ஆச்சு?"`
   - Hindi: `"किस उत्पाद का सबसे अधिक स्टॉक आउट खतरा है?"`
   - The AI will query the DB and answer in the correct language!

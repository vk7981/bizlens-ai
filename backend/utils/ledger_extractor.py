import os
import json
import asyncio
import google.generativeai as genai
from backend.utils.schema_reader import get_database_schema
from backend.utils.sql_runner import execute_select_query

async def auto_extract_financial_ledger(db_path: str) -> list:
    """
    Scans the database schema, formulates a clean SQL query to extract daily/monthly 
    incomes and expenses, runs the query, and formats it as a unified ledger list.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[Ledger Extractor] Warning: Missing GEMINI_API_KEY. Returning default empty list.")
        return []

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.0-flash")

    # 1. Fetch database schema catalog
    schema = get_database_schema(db_path)
    schema_str = json.dumps(schema, indent=2)

    # 2. Ask Gemini to formulate custom SQL queries to extract dates, total sales/incomes, and total expenses
    prompt = f"""
    You are an expert financial analyst and SQL developer.
    We have a database containing the user's business records. Review the schema:
    {schema_str}
    
    Identify which tables represent income/revenue/sales, and which tables represent expenses/costs/purchases.
    Write standard SQLite query or queries to extract a daily or monthly summary of total income and total expenses.
    
    Guidelines:
    - Group results by date (standard format 'YYYY-MM-DD' or 'YYYY-MM').
    - Calculate total income/sales and total expenses for each group.
    - Output the SQLite SELECT queries to retrieve this information.
    
    Provide the response as a JSON object matching this structure:
    {{
        "income_query": "SELECT STRFTIME('%Y-%m-%d', date) AS log_date, SUM(revenue) AS total_income FROM ... GROUP BY 1;",
        "expense_query": "SELECT STRFTIME('%Y-%m-%d', date) AS log_date, SUM(amount) AS total_expense FROM ... GROUP BY 1;"
    }}
    
    If there are no expense tables, return an empty string for "expense_query".
    If there are no income/sales tables, return an empty string for "income_query".
    Return ONLY valid JSON. Do not write markdown.
    """

    try:
        response = await asyncio.wait_for(
            model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            ),
            timeout=5.0
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text.split("```json")[1].split("```")[0].strip()
        elif text.startswith("```"):
            text = text.split("```")[1].split("```")[0].strip()

        decisions = json.loads(text)
    except Exception as e:
        print(f"[Ledger Extractor] Gemini SQL generation failed: {e}. Falling back to baseline heuristic.")
        decisions = {}

    income_q = decisions.get("income_query")
    expense_q = decisions.get("expense_query")

    # Baseline heuristic fallback if Gemini failed
    table_names = [t["name"] for t in schema.get("tables", [])]
    sales_tbl = next((t for t in table_names if "sales" in t or "income" in t or "revenue" in t), None)
    exp_tbl = next((t for t in table_names if "expense" in t or "cost" in t or "spend" in t), None)

    if not income_q and sales_tbl:
        income_q = f"SELECT DATE(date) AS log_date, SUM(revenue) AS total_income FROM {sales_tbl} GROUP BY 1;"
    if not expense_q and exp_tbl:
        expense_q = f"SELECT DATE(date) AS log_date, SUM(amount) AS total_expense FROM {exp_tbl} GROUP BY 1;"

    ledger_map = {} # Key: log_date -> {"income": ..., "expense": ...}

    # Execute Income Query
    if income_q:
        try:
            res = execute_select_query(db_path, income_q)
            if res.get("success"):
                for row in res.get("data", []):
                    # Find date and value keys case-insensitively
                    date_val = None
                    income_val = 0.0
                    for k, v in row.items():
                        if "date" in k.lower():
                            date_val = str(v)
                        elif "income" in k.lower() or "revenue" in k.lower() or "total" in k.lower() or "amount" in k.lower() or "sales" in k.lower():
                            try:
                                income_val = float(v)
                            except:
                                pass
                    if date_val:
                        # Clean date string (remove time component if present)
                        clean_date = date_val.split(" ")[0]
                        if clean_date not in ledger_map:
                            ledger_map[clean_date] = {"income": 0.0, "expense": 0.0, "notes": "AI Auto-extracted"}
                        ledger_map[clean_date]["income"] += income_val
        except Exception as q_err:
            print(f"[Ledger Extractor] Income query failed: {q_err}")

    # Execute Expense Query
    if expense_q:
        try:
            res = execute_select_query(db_path, expense_q)
            if res.get("success"):
                for row in res.get("data", []):
                    date_val = None
                    expense_val = 0.0
                    for k, v in row.items():
                        if "date" in k.lower():
                            date_val = str(v)
                        elif "expense" in k.lower() or "amount" in k.lower() or "cost" in k.lower() or "spend" in k.lower() or "total" in k.lower():
                            try:
                                expense_val = float(v)
                            except:
                                pass
                    if date_val:
                        clean_date = date_val.split(" ")[0]
                        if clean_date not in ledger_map:
                            ledger_map[clean_date] = {"income": 0.0, "expense": 0.0, "notes": "AI Auto-extracted"}
                        ledger_map[clean_date]["expense"] += expense_val
        except Exception as q_err:
            print(f"[Ledger Extractor] Expense query failed: {q_err}")

    # Convert to sorted list of dicts
    ledger_entries = []
    for dt, vals in sorted(ledger_map.items()):
        ledger_entries.append({
            "date": dt,
            "income": round(vals["income"], 2),
            "expenses": round(vals["expense"], 2),
            "profit": round(vals["income"] - vals["expense"], 2),
            "notes": f"AI Extracted: {vals['notes']}",
            "source": "AUTO_FILE"
        })

    return ledger_entries

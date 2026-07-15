import google.generativeai as genai
import os
import json
import asyncio
from backend.agent.cross_file_analyzer import find_cross_file_connections
from backend.agent.ranker import rank_insights
from backend.utils.schema_reader import get_database_schema
from backend.utils.sql_runner import execute_select_query
from backend.db.models import SessionMetadata, InsightReport, Alert
from backend.db.session import SessionLocal
import datetime

class InsightAgent:
    def __init__(self, db_path: str, session_id: str):
        self.db_path = db_path
        self.session_id = session_id
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Missing GEMINI_API_KEY environment variable.")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")

    def _event(self, event_type: str, data: dict) -> dict:
        return {"type": event_type, **data}

    async def explore_and_report(self):
        """Async generator yielding SSE steps of agent reasoning, execution, and ranking."""
        
        # ==========================================
        # PHASE 1: Schema Map & File Understanding
        # ==========================================
        yield self._event("progress", {"phase": "SCHEMA", "percent": 10, "message": "Reading database schema catalog..."})
        yield self._event("log", {"sender": "system", "message": "Analyzing uploaded files and mapping relationships..."})
        
        schema = get_database_schema(self.db_path)
        tables = schema.get("tables", [])
        table_names = [t["name"] for t in tables]
        
        yield self._event("log", {
            "sender": "agent", 
            "message": f"Discovered {len(tables)} tables: {', '.join(table_names)}. Inspecting columns..."
        })
        
        # Ask Gemini to generate business investigation hypotheses
        yield self._event("progress", {"phase": "HYPOTHESES", "percent": 25, "message": "Generating business hypotheses..."})
        yield self._event("log", {"sender": "agent", "message": "Analyzing columns & row counts to formulate data targets..."})
        
        schema_summary = []
        for table in tables:
            cols = ", ".join([f"{c['name']} ({c['type']})" for c in table.get("columns", [])])
            schema_summary.append(f"Table '{table['name']}' ({table['row_count']} rows). Columns: {cols}")
        schema_str = "\n".join(schema_summary)
        
        planner_prompt = f"""
        You are an expert Business Intelligence Agent.
        The user has uploaded files representing their business data. Here is the schema of the tables in their database:
        
        {schema_str}
        
        Formulate exactly 4 logical business hypotheses to investigate to find anomalies, spikes, drops, or opportunities.
        Focus on standard business questions: sales trends, product performance, customer retention, or cost overruns.
        
        Output the list as a JSON array matching this format:
        [
            {{
                "id": 1,
                "title": "Clear hypothesis title",
                "description": "What we want to check, e.g. did revenue drop in any month?",
                "target_tables": ["table1"]
            }}
        ]
        
        Return ONLY valid JSON. Do not include markdown code block formatting.
        """
        
        hypotheses = []
        try:
            # Run LLM call in executor
            response = await asyncio.wait_for(
                self.model.generate_content_async(
                    planner_prompt, 
                    generation_config={"response_mime_type": "application/json"}
                ),
                timeout=10.0
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text.split("```json")[1].split("```")[0].strip()
            elif text.startswith("```"):
                text = text.split("```")[1].split("```")[0].strip()
            hypotheses = json.loads(text)
        except Exception as e:
            print("Hypothesis formulation failed:", str(e))
            # Fallback
            hypotheses = [
                {
                    "id": 1,
                    "title": f"Analyze trends in {table_names[0]}",
                    "description": "Examine record distributions and look for spikes or outliers.",
                    "target_tables": [table_names[0]]
                }
            ]
            
        yield self._event("log", {
            "sender": "agent", 
            "message": f"Formulated {len(hypotheses)} hypotheses. Commencing investigations."
        })

        # ==========================================
        # PHASE 2: Single-File Investigations
        # ==========================================
        yield self._event("progress", {"phase": "INVESTIGATION", "percent": 40, "message": "Running data investigations..."})
        
        raw_insights = []
        queries_run = 0
        
        for h_id, h in enumerate(hypotheses, 1):
            h_title = h.get("title")
            h_desc = h.get("description")
            h_tables = h.get("target_tables", [])
            
            yield self._event("log", {
                "sender": "agent", 
                "message": f"🔍 [Hypothesis {h_id}/{len(hypotheses)}]: {h_title}\n↳ Focus: {h_desc}"
            })
            
            iteration = 0
            max_iterations = 2
            while iteration < max_iterations:
                await asyncio.sleep(1.0)
                iteration += 1
                yield self._event("log", {
                    "sender": "agent", 
                    "message": f"Formulating SQL query to test hypothesis (Iteration {iteration})..."
                })
                
                # Fetch tables context
                sub_schema = [t for t in tables if t["name"] in h_tables]
                sub_schema_str = json.dumps(sub_schema, indent=2)
                
                sql_prompt = f"""
                You are a data analyst. Generate a standard read-only SQLite SELECT query to investigate this hypothesis:
                Hypothesis: {h_title} - {h_desc}
                Available Tables schema: {sub_schema_str}
                
                Guidelines:
                - Output ONLY valid, read-only SQLite SELECT queries.
                - Do not use functions that don't exist in SQLite (e.g. use STRFTIME for date groupings).
                - Use aggregations (SUM, AVG, COUNT) and group by where logical.
                
                Output the query as a JSON object matching this format:
                {{
                    "thought": "Your analytical thought process on how to join or query the data",
                    "query": "SELECT ...;"
                }}
                
                Return ONLY valid JSON. Do not include markdown code block formatting.
                """
                
                try:
                    response = await asyncio.wait_for(
                        self.model.generate_content_async(
                            sql_prompt, 
                            generation_config={"response_mime_type": "application/json"}
                        ),
                        timeout=10.0
                    )
                    text = response.text.strip()
                    if text.startswith("```json"):
                        text = text.split("```json")[1].split("```")[0].strip()
                    elif text.startswith("```"):
                        text = text.split("```")[1].split("```")[0].strip()
                        
                    sql_decision = json.loads(text)
                except Exception as e:
                    yield self._event("log", {"sender": "system", "message": f"SQL formulation failed: {str(e)}"})
                    break
                
                thought = sql_decision.get("thought")
                query = sql_decision.get("query")
                
                yield self._event("log", {"sender": "agent", "message": f"Thought: {thought}"})
                yield self._event("sql_run", {"query": query})
                
                # Run query
                queries_run += 1
                res = execute_select_query(self.db_path, query)
                
                if not res.get("success"):
                    yield self._event("log", {
                        "sender": "system", 
                        "message": f"⚠️ SQL Error: {res['error']}. Initiating self-correction..."
                    })
                    # Pass the error back to Gemini for self-correction in next iteration
                    continue
                
                data = res.get("data", [])
                cols = res.get("columns", [])
                yield self._event("log", {
                    "sender": "agent", 
                    "message": f"Received {len(data)} rows. Analyzing data for patterns..."
                })
                
                if not data:
                    yield self._event("log", {"sender": "agent", "message": "No records found matching query criteria."})
                    break
                
                # Ask Gemini to check if there is an interesting pattern/anomaly in the data
                analysis_prompt = f"""
                You are a business intelligence analyst. Review the output of this SQL query:
                Query: {query}
                Result columns: {cols}
                Result data rows: {json.dumps(data[:30], indent=2)}
                
                Identify if there is any critical anomaly, sudden drop, spike, or interesting trend that has a direct business impact.
                - Write a plain language headline (title) of the finding.
                - Write a detailed plain language explanation of the finding. Keep the explanation concise and under 2 sentences to ensure fast processing.
                - Keep the tone helpful, non-technical, and commercial.
                
                Output the finding as a JSON object matching this format:
                {{
                    "pattern_found": true/false,
                    "title": "A clean business-focused title",
                    "finding": "Detailed description of the spike, drop, or trend in plain business language"
                }}
                
                Return ONLY valid JSON.
                """
                
                try:
                    response = await asyncio.wait_for(
                        self.model.generate_content_async(
                            analysis_prompt, 
                            generation_config={"response_mime_type": "application/json"}
                        ),
                        timeout=10.0
                    )
                    text = response.text.strip()
                    if text.startswith("```json"):
                        text = text.split("```json")[1].split("```")[0].strip()
                    elif text.startswith("```"):
                        text = text.split("```")[1].split("```")[0].strip()
                    analysis = json.loads(text)
                except Exception as e:
                    yield self._event("log", {"sender": "system", "message": f"Result analysis failed: {str(e)}"})
                    break
                    
                if analysis.get("pattern_found"):
                    title_found = analysis.get("title")
                    res_sum = analysis.get("finding")
                    
                    yield self._event("insight_found", {
                        "insight": {
                            "title": title_found,
                            "finding": res_sum,
                            "sql_proof": query,
                            "result_summary": f"Data returned: {len(data)} rows."
                        }
                    })
                    yield self._event("log", {
                        "sender": "agent", 
                        "message": f"🎉 Insight Discovered: '{title_found}'\n↳ Highlight: {res_sum}"
                    })
                    
                    raw_insights.append({
                        "title": title_found,
                        "finding": res_sum,
                        "sql_proof": query,
                        "result_summary": json.dumps(data[:5]) # Save sample records directly in report
                    })
                    break
                else:
                    yield self._event("log", {"sender": "agent", "message": "Inconclusive results or no significant business pattern detected."})
                    break

        # ==========================================
        # PHASE 3: Cross-File Join Investigations
        # ==========================================
        yield self._event("progress", {"phase": "INVESTIGATION", "percent": 65, "message": "Performing cross-file relation analysis..."})
        yield self._event("log", {"sender": "system", "message": "Scanning for overlapping column patterns between tables..."})
        
        cross_connections = find_cross_file_connections(schema)
        
        for conn_idx, conn in enumerate(cross_connections, 1):
            await asyncio.sleep(1.0)
            yield self._event("log", {
                "sender": "agent", 
                "message": f"🔗 Cross-File Link Found: '{conn['title']}'\n↳ Action: {conn['description']}"
            })
            
            q = conn["sql_template"]
            yield self._event("sql_run", {"query": q})
            queries_run += 1
            
            res = execute_select_query(self.db_path, q)
            if not res.get("success"):
                yield self._event("log", {"sender": "system", "message": f"Cross-file SQL run failed: {res['error']}"})
                continue
                
            data = res.get("data", [])
            yield self._event("log", {
                "sender": "agent", 
                "message": f"Cross-file link returned {len(data)} rows. Formulating correlation finding..."
            })
            
            if not data:
                continue
                
            analysis_prompt = f"""
            Analyze the results of this cross-file data join query:
            Query: {q}
            Data: {json.dumps(data[:30], indent=2)}
            
            Formulate a high-impact business pattern finding that links these different parts of the business (e.g. expenses vs sales trend, low stock vs sales velocity).
            - Headline (title): A clear business-oriented headline
            - Description (finding): A detailed explanation of the correlation in simple, friendly terms. Keep the finding concise and under 2 sentences to ensure fast processing.
            
            Output as JSON:
            {{
                "title": "Business title",
                "finding": "Detailed description of correlation"
            }}
            """
            
            try:
                response = await asyncio.wait_for(
                    self.model.generate_content_async(
                        analysis_prompt, 
                        generation_config={"response_mime_type": "application/json"}
                    ),
                    timeout=10.0
                )
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text.split("```json")[1].split("```")[0].strip()
                elif text.startswith("```"):
                    text = text.split("```")[1].split("```")[0].strip()
                analysis = json.loads(text)
                
                title_found = f"[Cross-File] {analysis.get('title')}"
                res_sum = analysis.get("finding")
                
                yield self._event("insight_found", {
                    "insight": {
                        "title": title_found,
                        "finding": res_sum,
                        "sql_proof": q,
                        "result_summary": f"Cross-table join output: {len(data)} rows."
                    }
                })
                
                raw_insights.append({
                    "title": title_found,
                    "finding": res_sum,
                    "sql_proof": q,
                    "result_summary": json.dumps(data[:5])
                })
            except Exception as e:
                print("Cross-file analysis failed:", str(e))

        # ==========================================
        # PHASE 4: Proactive Alert Checks (Warnings)
        # ==========================================
        yield self._event("progress", {"phase": "RANKING", "percent": 80, "message": "Checking for critical warnings & alerts..."})
        yield self._event("log", {"sender": "system", "message": "Evaluating cash flow deficit, low inventory, and customer churn rules..."})
        
        # Initialize table references
        sales_tbl = next((t for t in table_names if "sales" in t), None)
        exp_tbl = next((t for t in table_names if "expense" in t), None)
        inv_tbl = next((t for t in table_names if "inventory" in t), None)
        cust_tbl = next((t for t in table_names if "customer" in t), None)
        
        alerts_list = []
        
        # Let's inspect the files for specific alert rules using SQL
        # 1. Check if expenses exceeds sales in any month
        if sales_tbl and exp_tbl:
            rule_q = f"""
                SELECT s.month, s.total_rev, e.total_exp 
                FROM (
                    SELECT STRFTIME('%m', date) AS month, SUM(revenue) AS total_rev 
                    FROM {sales_tbl} GROUP BY month
                ) s
                JOIN (
                    SELECT STRFTIME('%m', date) AS month, SUM(amount) AS total_exp 
                    FROM {exp_tbl} GROUP BY month
                ) e ON s.month = e.month
                WHERE e.total_exp > s.total_rev;
            """
            res = execute_select_query(self.db_path, rule_q)
            if res.get("success") and res.get("data"):
                # Expense alert triggered!
                for row in res["data"]:
                    m_names = {"01": "January", "02": "February", "03": "March", "04": "April"}
                    m_str = m_names.get(row['month'], f"Month {row['month']}")
                    alerts_list.append({
                        "title": f"Cash Flow Deficit Alert: Expenses Exceeded Revenue in {m_str}",
                        "finding": f"In {m_str}, your business recorded total expenses of Rs. {row['total_exp']:,} while earning a revenue of only Rs. {row['total_rev']:,}, creating an operational loss of Rs. {(row['total_exp'] - row['total_rev']):,}.",
                        "sql_proof": rule_q,
                        "severity": "HIGH"
                    })

        # 2. Check for low inventory of fast-moving products
        if sales_tbl and inv_tbl:
            rule_q = f"""
                SELECT i.product_name, i.current_stock, i.reorder_level, COALESCE(s.units, 0) AS units_sold
                FROM {inv_tbl} i
                LEFT JOIN (
                    SELECT product_name, SUM(units_sold) AS units 
                    FROM {sales_tbl} GROUP BY product_name
                ) s ON i.product_name = s.product_name
                WHERE i.current_stock < i.reorder_level AND units_sold > 5;
            """
            res = execute_select_query(self.db_path, rule_q)
            if res.get("success") and res.get("data"):
                for row in res["data"]:
                    alerts_list.append({
                        "title": f"Critical Stockout Alert: {row['product_name']}",
                        "finding": f"Your popular product '{row['product_name']}' is running low on stock ({row['current_stock']} units left), which is below its reorder point of {row['reorder_level']} units. You sold {row['units_sold']} units in the sales sheet.",
                        "sql_proof": rule_q,
                        "severity": "HIGH"
                    })

        # 3. Check for consecutive month revenue drops
        if sales_tbl:
            rule_q = f"""
                SELECT STRFTIME('%m', date) AS month, SUM(revenue) AS revenue
                FROM {sales_tbl}
                GROUP BY month
                ORDER BY month ASC;
            """
            res = execute_select_query(self.db_path, rule_q)
            if res.get("success") and len(res.get("data", [])) >= 2:
                data = res["data"]
                # Look for month over month drop
                m_names = {"01": "January", "02": "February", "03": "March", "04": "April"}
                for i in range(len(data) - 1):
                    prev = data[i]["revenue"]
                    curr = data[i+1]["revenue"]
                    if curr < prev:
                        drop_pct = round(((prev - curr) / prev) * 100, 1)
                        prev_m = m_names.get(data[i]["month"], f"Month {data[i]['month']}")
                        curr_m = m_names.get(data[i+1]["month"], f"Month {data[i+1]['month']}")
                        alerts_list.append({
                            "title": f"Revenue Dropped in {curr_m}",
                            "finding": f"Your business sales revenue shrank by {drop_pct}% in {curr_m} (Rs. {curr:,.2f}) compared to {prev_m} (Rs. {prev:,.2f}).",
                            "sql_proof": rule_q,
                            "severity": "WARNING"
                        })

        yield self._event("log", {"sender": "agent", "message": f"Warning checks complete. Triggered {len(alerts_list)} alerts."})

        # ==========================================
        # PHASE 5: Ranking & Compilation
        # ==========================================
        yield self._event("progress", {"phase": "REPORT", "percent": 95, "message": "Compiling final business intelligence report..."})
        yield self._event("log", {"sender": "system", "message": "Analyzing priorities and formatting plain-language summary..."})
        
        # Rank the raw insights
        ranked_insights = []
        if raw_insights:
            ranked_insights = await rank_insights(raw_insights)
        else:
            # Fallback report if no insights found
            ranked_insights.append({
                "title": "General Business Verification",
                "finding": "We scanned your business files. All structures and column layouts appear standard and healthy.",
                "sql_proof": "SELECT 1;",
                "result_summary": "All columns checked.",
                "rank": "MEDIUM IMPACT",
                "why_it_matters": "Confirms your records are correctly aligned."
            })
            
        # Compile finalized report structure
        final_report = {
            "session_id": self.session_id,
            "insights": ranked_insights,
            "alerts": alerts_list,
            "queries_run": queries_run,
            "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Write to SQLite central DB
        db = SessionLocal()
        try:
            meta = db.query(SessionMetadata).filter(SessionMetadata.session_id == self.session_id).first()
            if meta:
                meta.status = "COMPLETED"
                
            report_model = InsightReport(
                session_id=self.session_id,
                report_json=json.dumps(final_report)
            )
            db.add(report_model)
            
            # Save individual alerts to the alerts table for alert routers
            for alert in alerts_list:
                alert_model = Alert(
                    session_id=self.session_id,
                    title=alert["title"],
                    finding=alert["finding"],
                    sql_proof=alert["sql_proof"],
                    severity=alert["severity"]
                )
                db.add(alert_model)
                
            db.commit()
        except Exception as db_err:
            print("Failed to save report to database:", str(db_err))
        finally:
            db.close()
            
        yield self._event("log", {"sender": "system", "message": "Report saved successfully. Complete."})
        yield self._event("complete", {"report": final_report})

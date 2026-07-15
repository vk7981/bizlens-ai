import google.generativeai as genai
import os
import json

def rank_insights(insights: list) -> list:
    """
    Ranks a list of raw insights by business/financial impact (High, Medium, Low) using Gemini.
    Adds clear plain-language explanations of WHY this matters for the business owner.
    """
    if not insights:
        return []
        
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Missing GEMINI_API_KEY environment variable.")
        
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    prompt = f"""
    You are a Chief Operations Officer (COO) and Lead Business Intelligence Analyst.
    Review the following raw data insights discovered during database exploration:
    
    {json.dumps(insights, indent=2)}
    
    For each insight, assign a business priority ranking:
    1. Rank: "HIGH IMPACT", "MEDIUM IMPACT", or "LOW IMPACT"
    2. Explanation of "Why This Matters" in simple, friendly, non-technical words. Focus on money, inventory, sales trends, or risks. Do NOT use technical words like JOIN, SQL, table, columns, data types, databases.
    
    Output the results as a JSON array matching this format:
    [
        {{
            "title": "Clean Plain Headline of the Insight",
            "finding": "Detailed plain language finding of what the data shows",
            "sql_proof": "The SQL query used to prove it",
            "result_summary": "Summary of query output",
            "rank": "HIGH IMPACT",
            "why_it_matters": "Simple, impactful explanation of why this matters for the business owner."
        }}
    ]
    
    Return ONLY valid JSON. Do not include markdown code block formatting.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        text = response.text.strip()
        # Clean markdown if returned
        if text.startswith("```json"):
            text = text.split("```json")[1].split("```")[0].strip()
        elif text.startswith("```"):
            text = text.split("```")[1].split("```")[0].strip()
            
        data = json.loads(text)
        return data
    except Exception as e:
        print("Ranker encountered an error, applying baseline ranking:", str(e))
        # Fallback rankings
        ranked = []
        for item in insights:
            # Cross file insights are high impact by default
            is_cross = "cross" in item.get("title", "").lower() or "cross" in item.get("finding", "").lower()
            rank_val = "HIGH IMPACT" if is_cross else "MEDIUM IMPACT"
            ranked.append({
                "title": item.get("title"),
                "finding": item.get("finding"),
                "sql_proof": item.get("sql_proof"),
                "result_summary": item.get("result_summary"),
                "rank": rank_val,
                "why_it_matters": "Helps you monitor performance trends and prevent stockouts or cost overruns."
            })
        return ranked

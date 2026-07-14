import sqlite3
import re

def execute_select_query(db_path: str, sql: str) -> dict:
    """
    Executes a SELECT SQL query safely on the given SQLite database.
    Restricts execution to read-only SELECT statements, preventing any write actions.
    """
    # 1. Clean query string
    cleaned_sql = sql.strip().strip(';').strip()
    
    # 2. Strict Security Check: Verify SELECT-only
    # Convert query to lowercase for checking
    lower_sql = cleaned_sql.lower()
    
    # Block writing/modifying commands
    blocked_keywords = ["insert", "update", "delete", "drop", "alter", "create", 
                        "replace", "pragma", "vacuum", "reindex", "execute", "truncate"]
    
    for kw in blocked_keywords:
        # Match whole word to avoid blocking column names like 'created_at' or 'user_update'
        pattern = r'\b' + re.escape(kw) + r'\b'
        if re.search(pattern, lower_sql):
            return {
                "success": False,
                "error": f"Security violation: Query uses blocked keyword '{kw}'. Only SELECT is allowed."
            }

    # Ensure query starts with select or with (for CTEs)
    if not (lower_sql.startswith("select") or lower_sql.startswith("with")):
        return {
            "success": False,
            "error": "Security violation: Query must be a SELECT statement."
        }

    # 3. Apply LIMIT Safeguard
    # If the query doesn't have a LIMIT, we append LIMIT 500 to prevent buffer overload
    if "limit" not in lower_sql:
        cleaned_sql = f"{cleaned_sql} LIMIT 500"
    else:
        # If there's a limit, check if it exceeds 500 and cap it
        limit_match = re.search(r'\blimit\s+(\d+)\b', lower_sql)
        if limit_match:
            limit_val = int(limit_match.group(1))
            if limit_val > 500:
                # Replace the limit with 500
                cleaned_sql = re.sub(r'\blimit\s+\d+\b', 'LIMIT 500', cleaned_sql, flags=re.IGNORECASE)

    # 4. Execute Query
    conn = sqlite3.connect(db_path)
    # Enable reading column names
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute(cleaned_sql)
        rows = cursor.fetchall()
        
        # Format results as list of dicts
        results = [dict(row) for row in rows]
        
        # Fetch columns
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        
        return {
            "success": True,
            "columns": columns,
            "data": results,
            "row_count": len(results)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        conn.close()

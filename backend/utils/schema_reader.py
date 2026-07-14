import sqlite3
import json

def get_database_schema(db_path: str) -> dict:
    """
    Scans the sandboxed SQLite database and returns a complete catalog schema structure
    including table names, columns, row counts, and sample records.
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    schema = {"tables": []}
    
    try:
        # Get list of all user-defined tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = cursor.fetchall()
        
        for table in tables:
            table_name = table["name"]
            
            # Get columns info
            cursor.execute(f"PRAGMA table_info({table_name});")
            cols = cursor.fetchall()
            columns = []
            for col in cols:
                columns.append({
                    "name": col["name"],
                    "type": col["type"]
                })
                
            # Get row count
            cursor.execute(f"SELECT COUNT(*) as count FROM {table_name};")
            row_count = cursor.fetchone()["count"]
            
            # Fetch sample of 3 rows
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
            sample_rows = [dict(row) for row in cursor.fetchall()]
            
            schema["tables"].append({
                "name": table_name,
                "row_count": row_count,
                "columns": columns,
                "sample_rows": sample_rows
            })
            
    except Exception as e:
        print(f"Error fetching SQLite schema: {str(e)}")
    finally:
        conn.close()
        
    return schema

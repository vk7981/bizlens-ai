import os
import re
import pandas as pd
import sqlite3

def clean_table_name(filename: str) -> str:
    """Sanitizes filename into a clean SQLite table name (lowercase, letters/numbers/underscores only)."""
    # Remove file extension
    base_name = os.path.splitext(filename)[0]
    # Replace spaces, dashes, dots, and special characters with underscores
    clean = re.sub(r'[^a-zA-Z0-9]', '_', base_name).lower()
    # Remove duplicate underscores
    clean = re.sub(r'_+', '_', clean)
    # Strip leading/trailing underscores
    clean = clean.strip('_')
    # Prepend 'table_' if it starts with a number or is empty
    if not clean or clean[0].isdigit():
        clean = f"table_{clean}"
    return clean

def process_file_to_sqlite(file_path: str, original_filename: str, db_path: str) -> dict:
    """
    Parses a single Excel/CSV file using Pandas and writes it to a table in the sandboxed SQLite database.
    Returns details about the processed table (name, schema, row count, sample rows).
    """
    table_name = clean_table_name(original_filename)
    
    # 1. Load data into Pandas DataFrame
    _, ext = os.path.splitext(original_filename.lower())
    try:
        if ext == '.csv':
            df = pd.read_csv(file_path)
        elif ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
    except Exception as e:
        raise ValueError(f"Failed to parse file: {str(e)}")

    # 2. Sanitize Data & Headers
    # Clean headers: lowercase, replace spaces/dots/brackets with underscores
    df.columns = [re.sub(r'[^a-zA-Z0-9]', '_', str(col).strip().lower()) for col in df.columns]
    # Deduplicate headers
    new_cols = []
    seen = {}
    for col in df.columns:
        if col in seen:
            seen[col] += 1
            new_cols.append(f"{col}_{seen[col]}")
        else:
            seen[col] = 0
            new_cols.append(col)
    df.columns = new_cols

    # Drop fully empty rows
    df = df.dropna(how='all')
    
    # Replace NaN/NaT with None so it translates to NULL in SQLite
    df = df.where(pd.notnull(df), None)

    # 3. Write to SQLite
    conn = sqlite3.connect(db_path)
    try:
        df.to_sql(table_name, conn, if_exists='replace', index=False)
    finally:
        conn.close()

    # 4. Generate Schema Summary
    row_count = len(df)
    columns_info = []
    for col, dtype in zip(df.columns, df.dtypes):
        dtype_str = "TEXT"
        if pd.api.types.is_integer_dtype(dtype):
            dtype_str = "INTEGER"
        elif pd.api.types.is_float_dtype(dtype):
            dtype_str = "REAL"
        elif pd.api.types.is_datetime64_any_dtype(dtype):
            dtype_str = "DATETIME"
        columns_info.append({"name": col, "type": dtype_str})

    # Prepare sample rows (convert nan/null to None for JSON serialization safety)
    sample_rows = df.head(3).to_dict(orient='records')
    # Clean NaN/inf in sample_rows
    for row in sample_rows:
        for k, v in row.items():
            if pd.isna(v) or v is None:
                row[k] = None
            elif isinstance(v, (int, float)) and (v != v or v == float('inf') or v == float('-inf')):
                row[k] = None

    return {
        "table_name": table_name,
        "original_filename": original_filename,
        "row_count": row_count,
        "columns": columns_info,
        "sample_rows": sample_rows
    }

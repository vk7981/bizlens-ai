import json

def find_cross_file_connections(schema: dict) -> list:
    """
    Scans the database schema to detect common matching fields across tables.
    Formulates cross-file join connection templates that the AI agent can execute to spot patterns.
    """
    tables = schema.get("tables", [])
    if len(tables) < 2:
        return []

    connections = []
    table_names = [t["name"] for t in tables]
    
    # Track table columns
    table_cols = {}
    for t in tables:
        table_cols[t["name"]] = {col["name"].lower(): col["type"] for col in t.get("columns", [])}

    # 1. Look for Sales & Expenses comparison (by date / month)
    sales_tbl = next((t for t in table_names if "sales" in t), None)
    exp_tbl = next((t for t in table_names if "expense" in t), None)
    
    if sales_tbl and exp_tbl:
        # Check if both have a date column
        sales_date = "date" in table_cols[sales_tbl]
        exp_date = "date" in table_cols[exp_tbl]
        if sales_date and exp_date:
            connections.append({
                "type": "SALES_VS_EXPENSES",
                "title": "Cross-File Profitability & Cash Flow Analysis",
                "description": f"Compares monthly total sales revenue from '{sales_tbl}' against monthly business expenses from '{exp_tbl}'.",
                "sql_template": f"""
                    SELECT 
                        COALESCE(s.month, e.month) AS month,
                        s.total_revenue,
                        e.total_expenses,
                        (s.total_revenue - e.total_expenses) AS net_profit
                    FROM (
                        SELECT STRFTIME('%m', date) AS month, SUM(revenue) AS total_revenue 
                        FROM {sales_tbl} 
                        GROUP BY month
                    ) s
                    FULL OUTER JOIN (
                        SELECT STRFTIME('%m', date) AS month, SUM(amount) AS total_expenses 
                        FROM {exp_tbl} 
                        GROUP BY month
                    ) e ON s.month = e.month
                    ORDER BY month ASC;
                """
            })

    # 2. Look for Sales & Inventory connection (by product name)
    inv_tbl = next((t for t in table_names if "inventory" in t), None)
    if sales_tbl and inv_tbl:
        # Check for product link
        sales_has_prod = "product_name" in table_cols[sales_tbl] or "product_id" in table_cols[sales_tbl]
        inv_has_prod = "product_name" in table_cols[inv_tbl] or "product_id" in table_cols[inv_tbl]
        
        prod_col = None
        if "product_name" in table_cols[sales_tbl] and "product_name" in table_cols[inv_tbl]:
            prod_col = "product_name"
        elif "product_id" in table_cols[sales_tbl] and "product_id" in table_cols[inv_tbl]:
            prod_col = "product_id"
            
        if prod_col:
            connections.append({
                "type": "SALES_VS_INVENTORY",
                "title": "Cross-File Product Stockout & Velocity Alert",
                "description": f"Correlates total units sold from '{sales_tbl}' with current warehouse stock levels in '{inv_tbl}' to identify fast-moving products at risk of running out of stock.",
                "sql_template": f"""
                    SELECT 
                        i.{prod_col} AS product,
                        i.current_stock,
                        i.reorder_level,
                        COALESCE(s.total_units_sold, 0) AS units_sold_last_90_days,
                        CASE 
                            WHEN i.current_stock < i.reorder_level THEN 'CRITICAL_STOCKOUT'
                            WHEN i.current_stock < (COALESCE(s.total_units_sold, 0) / 3.0) THEN 'HIGH_RISK_LOW_STOCK'
                            ELSE 'SAFE'
                        END AS stock_status
                    FROM {inv_tbl} i
                    LEFT JOIN (
                        SELECT {prod_col}, SUM(units_sold) AS total_units_sold 
                        FROM {sales_tbl} 
                        GROUP BY {prod_col}
                    ) s ON i.{prod_col} = s.{prod_col}
                    ORDER BY units_sold_last_90_days DESC;
                """
            })

    # 3. Look for Sales & Customers connection (by customer id)
    cust_tbl = next((t for t in table_names if "customer" in t), None)
    if sales_tbl and cust_tbl:
        cust_has_id = "customer_id" in table_cols[sales_tbl] and "customer_id" in table_cols[cust_tbl]
        if cust_has_id:
            connections.append({
                "type": "SALES_VS_CUSTOMERS",
                "title": "Cross-File Customer Value & Cohort Loyalty Analysis",
                "description": f"Links customer profiles from '{cust_tbl}' with actual sales records in '{sales_tbl}' to track value and city-based purchase performance.",
                "sql_template": f"""
                    SELECT 
                        c.customer_id,
                        c.name,
                        c.city,
                        c.total_orders AS reported_lifetime_orders,
                        COALESCE(s.actual_orders_this_period, 0) AS orders_this_quarter,
                        COALESCE(s.total_spend, 0) AS total_spend_this_quarter
                    FROM {cust_tbl} c
                    LEFT JOIN (
                        SELECT customer_id, COUNT(*) AS actual_orders_this_period, SUM(revenue) AS total_spend
                        FROM {sales_tbl}
                        GROUP BY customer_id
                    ) s ON c.customer_id = s.customer_id
                    ORDER BY total_spend_this_quarter DESC;
                """
            })

    return connections

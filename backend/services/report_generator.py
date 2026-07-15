import json

def generate_report_html(report_data: dict, db_name: str) -> str:
    """Generates a premium, clean, responsive HTML report ready to be emailed to business owners."""
    insights = report_data.get("insights", [])
    alerts = report_data.get("alerts", [])
    queries_run = report_data.get("queries_run", 0)
    date_str = report_data.get("date", "")
    
    # Pre-calculate counts
    high_count = sum(1 for i in insights if i.get("rank") == "HIGH IMPACT") + sum(1 for a in alerts if a.get("severity") == "HIGH")
    
    # HTML template with CSS inhead
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kestrel AI Business Analysis Report</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            }}
            .header {{
                background-color: #1e40af;
                color: #ffffff;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 800;
                letter-spacing: -0.5px;
            }}
            .header p {{
                margin: 5px 0 0 0;
                font-size: 14px;
                opacity: 0.8;
            }}
            .content {{
                padding: 30px;
            }}
            .stats-grid {{
                display: table;
                width: 100%;
                margin-bottom: 25px;
                border-collapse: separate;
                border-spacing: 10px;
            }}
            .stat-card {{
                display: table-cell;
                background: #f1f5f9;
                padding: 15px;
                text-align: center;
                border-radius: 8px;
                width: 33%;
            }}
            .stat-val {{
                font-size: 20px;
                font-weight: bold;
                color: #1e40af;
                display: block;
            }}
            .stat-lbl {{
                font-size: 11px;
                text-transform: uppercase;
                color: #64748b;
                letter-spacing: 0.5px;
            }}
            .alert-banner {{
                background-color: #fff7ed;
                border: 1px solid #fed7aa;
                border-left: 4px solid #ea580c;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 25px;
            }}
            .alert-banner-title {{
                color: #9a3412;
                font-weight: bold;
                font-size: 14px;
                margin: 0 0 5px 0;
            }}
            .alert-banner-desc {{
                color: #c2410c;
                font-size: 12px;
                margin: 0;
                line-height: 1.5;
            }}
            .section-title {{
                font-size: 16px;
                font-weight: 700;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 8px;
                margin-top: 30px;
                margin-bottom: 15px;
                color: #0f172a;
            }}
            .card {{
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 15px;
                background: #ffffff;
            }}
            .card-header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }}
            .card-title {{
                font-size: 15px;
                font-weight: 700;
                margin: 0;
                color: #1e293b;
            }}
            .badge {{
                display: inline-block;
                padding: 3px 8px;
                font-size: 10px;
                font-weight: 700;
                border-radius: 9999px;
                text-transform: uppercase;
            }}
            .badge-high {{
                background-color: #fee2e2;
                color: #991b1b;
            }}
            .badge-med {{
                background-color: #fef3c7;
                color: #92400e;
            }}
            .badge-low {{
                background-color: #f0fdf4;
                color: #166534;
            }}
            .finding {{
                font-size: 13px;
                line-height: 1.6;
                color: #475569;
                margin: 10px 0 0 0;
            }}
            .why-matters {{
                font-size: 12px;
                line-height: 1.5;
                color: #1e40af;
                background-color: #eff6ff;
                padding: 10px 15px;
                border-radius: 6px;
                margin-top: 12px;
            }}
            .footer {{
                background-color: #f1f5f9;
                padding: 20px;
                text-align: center;
                font-size: 11px;
                color: #64748b;
                border-top: 1px solid #e2e8f0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Kestrel AI Analysis Report</h1>
                <p>Intelligence summary for {db_name}</p>
            </div>
            <div class="content">
                <!-- Stats Summaries -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-val">{len(insights)}</span>
                        <span class="stat-lbl">Insights Surfaced</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-val">{high_count}</span>
                        <span class="stat-lbl">Critical Risks</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-val">{queries_run}</span>
                        <span class="stat-lbl">Queries Tested</span>
                    </div>
                </div>

                <!-- Alert Warning Banner -->
                {f'''
                <div class="alert-banner">
                    <p class="alert-banner-title">⚠️ Action Required: {len(alerts)} Urgent Business Warnings</p>
                    <p class="alert-banner-desc">We detected critical operational risks that need immediate attention. Check details below.</p>
                </div>
                ''' if alerts else ''}

                <!-- Alerts List -->
                {f'''
                <h3 class="section-title">Urgent Alerts</h3>
                ''' if alerts else ''}
                
                {''.join([f'''
                <div class="card" style="border-left: 4px solid #ea580c;">
                    <div class="card-header">
                        <h4 class="card-title" style="color: #9a3412;">{a.get("title")}</h4>
                        <span class="badge" style="background-color: #ffedd5; color: #9a3412;">URGENT</span>
                    </div>
                    <p class="finding">{a.get("finding")}</p>
                </div>
                ''' for a in alerts])}

                <!-- Insights List -->
                <h3 class="section-title">Key Business Discoveries</h3>
                
                {''.join([f'''
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title">{i.get("title")}</h4>
                        <span class="badge {
                            'badge-high' if i.get("rank") == "HIGH IMPACT" 
                            else 'badge-med' if i.get("rank") == "MEDIUM IMPACT" 
                            else 'badge-low'
                        }">{i.get("rank")}</span>
                    </div>
                    <p class="finding">{i.get("finding")}</p>
                    <div class="why-matters">
                        <strong>Why it matters:</strong> {i.get("why_it_matters")}
                    </div>
                </div>
                ''' for i in insights])}
            </div>
            <div class="footer">
                Report generated on {date_str} by Kestrel AI.<br>
                This analysis is fully automated using select-only database sandboxing.
            </div>
        </div>
    </body>
    </html>
    """
    return html

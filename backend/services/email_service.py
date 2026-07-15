import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import json
import requests
from backend.services.report_generator import generate_report_html

ETHEREAL_CACHE_PATH = os.path.join(os.path.dirname(__file__), "..", ".ethereal_account.json")

def get_smtp_config():
    sender = os.getenv("GMAIL_SENDER")
    password = os.getenv("GMAIL_APP_PASSWORD")
    server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    try:
        port = int(os.getenv("SMTP_PORT", "587"))
    except:
        port = 587
    return sender, password, server, port

def get_or_create_ethereal_account():
    """
    Fetches or creates a Nodemailer Ethereal sandbox SMTP account for zero-config testing.
    Caches the credentials locally to prevent rate limiting.
    """
    if os.path.exists(ETHEREAL_CACHE_PATH):
        try:
            with open(ETHEREAL_CACHE_PATH, 'r') as f:
                data = json.load(f)
                if "user" in data and "pass" in data:
                    return data
        except Exception as e:
            print(f"Failed to read Ethereal cache: {e}")
            
    print("Creating dynamic Nodemailer Ethereal SMTP test account...")
    try:
        res = requests.post(
            'https://api.nodemailer.com/user', 
            json={'requestor': 'Kestrel AI', 'version': '1.0.0'},
            timeout=10
        )
        if res.status_code == 200:
            data = res.json()
            if data.get("status") == "success":
                account = {
                    "user": data.get("user"),
                    "pass": data.get("pass"),
                    "host": data.get("smtp", {}).get("host", "smtp.ethereal.email"),
                    "port": data.get("smtp", {}).get("port", 587),
                }
                # Cache it
                with open(ETHEREAL_CACHE_PATH, 'w') as f:
                    json.dump(account, f)
                return account
    except Exception as e:
        print(f"Failed to auto-register Ethereal account: {e}")
    return None

def send_alert_email(recipient_email: str, alerts: list, db_name: str) -> dict:
    """
    Sends a proactive alert email listing critical business warnings.
    Falls back to dynamic Ethereal sandbox SMTP if Gmail credentials are not configured.
    """
    sender, password, server, port = get_smtp_config()
    sender_type = "gmail"
    ethereal_user = None
    ethereal_pass = None

    if not sender or not password:
        # Try Ethereal fallback
        ethereal = get_or_create_ethereal_account()
        if ethereal:
            sender = ethereal["user"]
            password = ethereal["pass"]
            server = ethereal["host"]
            port = ethereal["port"]
            sender_type = "ethereal"
            ethereal_user = sender
            ethereal_pass = password
        else:
            # Complete fallback print
            print("\n" + "="*50)
            print(f"SMTP WARNING: Ethereal and Gmail credentials unavailable. Logging to console.")
            print(f"PROACTIVE ALERTS TRIGGERED FOR: {recipient_email}")
            print(f"Database: {db_name}")
            for idx, alert in enumerate(alerts, 1):
                print(f"[{idx}] {alert['title']}\n    Finding: {alert['finding']}")
            print("="*50 + "\n")
            return {"success": True, "sender_type": "mock"}

    # Build Alert Body
    alerts_html = "".join([f"""
    <div style="border-left: 4px solid #ea580c; background-color: #fff7ed; padding: 15px; margin-bottom: 15px; border-radius: 6px;">
        <h4 style="margin: 0 0 5px 0; color: #9a3412; font-size: 14px;">⚠️ {alert.get('title')}</h4>
        <p style="margin: 0; color: #7c2d12; font-size: 12px; line-height: 1.5;">{alert.get('finding')}</p>
    </div>
    """ for alert in alerts])

    body_html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ea580c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">⚠️ Proactive Business Alert</h1>
            <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Kestrel AI detected critical risks in your files</p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 25px; border-radius: 0 0 8px 8px;">
            <p>Dear Business Owner,</p>
            <p>We completed analyzing your uploaded file <strong>{db_name}</strong> and detected the following urgent issue(s):</p>
            
            {alerts_html}
            
            <p style="margin-top: 25px;">Please log in to your Kestrel dashboard to review the full details and run follow-up investigations.</p>
        </div>
        <div style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px;">
            This email was sent automatically by Kestrel AI based on your analysis alert preferences.
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"⚠️ Kestrel Alert — Action Required for {db_name}"
    msg["From"] = sender
    msg["To"] = recipient_email
    msg.attach(MIMEText(body_html, "html"))

    try:
        with smtplib.SMTP(server, port) as smtp:
            smtp.starttls()
            smtp.login(sender, password)
            smtp.sendmail(sender, recipient_email, msg.as_string())
        print(f"Proactive alert email sent via {sender_type} to {recipient_email}")
        return {
            "success": True, 
            "sender_type": sender_type, 
            "ethereal_user": ethereal_user, 
            "ethereal_pass": ethereal_pass
        }
    except Exception as e:
        print(f"Failed to send alert email via SMTP ({sender_type}): {str(e)}")
        return {"success": False, "error": str(e)}

def send_full_report_email(recipient_email: str, report_data: dict, db_name: str) -> dict:
    """
    Sends the completed business intelligence report.
    Falls back to dynamic Ethereal sandbox SMTP if Gmail credentials are not configured.
    """
    sender, password, server, port = get_smtp_config()
    sender_type = "gmail"
    ethereal_user = None
    ethereal_pass = None

    if not sender or not password:
        # Try Ethereal fallback
        ethereal = get_or_create_ethereal_account()
        if ethereal:
            sender = ethereal["user"]
            password = ethereal["pass"]
            server = ethereal["host"]
            port = ethereal["port"]
            sender_type = "ethereal"
            ethereal_user = sender
            ethereal_pass = password
        else:
            # Complete fallback print
            print("\n" + "="*50)
            print(f"SMTP WARNING: Ethereal and Gmail credentials unavailable. Logging to console.")
            print(f"FULL INTELLIGENCE REPORT EMAILED TO: {recipient_email}")
            print(f"Database: {db_name}")
            print(f"Insights: {len(report_data.get('insights', []))} found.")
            print(f"Alerts: {len(report_data.get('alerts', []))} found.")
            print("="*50 + "\n")
            return {"success": True, "sender_type": "mock"}
            
    # Generate HTML content
    report_html = generate_report_html(report_data, db_name)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Kestrel AI — Business Insight Report for {db_name}"
    msg["From"] = sender
    msg["To"] = recipient_email
    msg.attach(MIMEText(report_html, "html"))

    try:
        with smtplib.SMTP(server, port) as smtp:
            smtp.starttls()
            smtp.login(sender, password)
            smtp.sendmail(sender, recipient_email, msg.as_string())
        print(f"Full report email sent via {sender_type} to {recipient_email}")
        return {
            "success": True, 
            "sender_type": sender_type, 
            "ethereal_user": ethereal_user, 
            "ethereal_pass": ethereal_pass
        }
    except Exception as e:
        print(f"Failed to send report email via SMTP ({sender_type}): {str(e)}")
        return {"success": False, "error": str(e)}

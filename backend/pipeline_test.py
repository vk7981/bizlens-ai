import requests
import time
import json
import os

API_BASE = "http://127.0.0.1:8000"

def run_test_pipeline():
    print("====================================================")
    print("[INIT] KESTREL AI: AUTOMATED TEST RUN INITIALIZED")
    print("====================================================")

    # 1. Prepare files
    sample_dir = r"C:\Users\vaish\.gemini\antigravity\scratch\bizlens-ai\sample_data"
    files_to_upload = ['sales_jan_march.csv', 'expenses_jan_march.csv', 'inventory.csv', 'customers.csv']
    
    upload_payload = []
    opened_files = []
    
    print("\n[Files] Preparing files for upload:")
    for fn in files_to_upload:
        fpath = os.path.join(sample_dir, fn)
        if not os.path.exists(fpath):
            print(f"[-] Error: Required test file '{fn}' not found in sample_data/.")
            return
        print(f" - Ready: {fn} ({os.path.getsize(fpath)} bytes)")
        f = open(fpath, 'rb')
        opened_files.append(f)
        upload_payload.append(('files', (fn, f, 'text/csv')))

    # 2. Upload files
    print("\n[Upload] Uploading files to FastAPI session manager...")
    try:
        res = requests.post(
            f"{API_BASE}/api/upload", 
            files=upload_payload,
            data={"email": "vaishnav@test.com"}
        )
        for f in opened_files:
            f.close()
            
        if res.status_code != 200:
            print(f"[-] Upload failed with status {res.status_code}: {res.text}")
            return
            
        upload_data = res.json()
        session_id = upload_data.get("session_id")
        db_name = upload_data.get("db_name")
        print(f"[+] Upload Success!")
        print(f" - Session ID: {session_id}")
        print(f" - Database: {db_name}")
    except Exception as e:
        print(f"[-] Connection error. Is the backend FastAPI server running? Details: {e}")
        return

    # 3. Trigger Agent
    print("\n[Agent] Triggering AI analysis agent run...")
    agent_res = requests.post(f"{API_BASE}/api/agent/run/{session_id}")
    if agent_res.status_code != 200:
        print(f"[-] Failed to trigger agent: {agent_res.text}")
        return
    print("[+] Agent trigger response received. Streaming logs:")

    # 4. Listen to Live SSE Stream
    print("\n[Stream] Listening to Event Stream (SSE):")
    try:
        sse_res = requests.get(f"{API_BASE}/api/agent/stream/{session_id}", stream=True)
        for line in sse_res.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data: "):
                    data_json = json.loads(decoded_line[6:])
                    ev_type = data_json.get("type")
                    
                    if ev_type == "progress":
                        print(f" * [Progress] {data_json.get('phase')} ({data_json.get('percent')}%) - {data_json.get('message')}")
                    elif ev_type == "log":
                        msg = data_json.get('message', '').encode('ascii', 'ignore').decode('ascii')
                        print(f"   [Log] {data_json.get('sender').upper()}: {msg}")
                    elif ev_type == "sql_run":
                        print(f"   [SQL RUN] {data_json.get('query')}")
                    elif ev_type == "insight_found":
                        title = data_json.get('insight', {}).get('title', '').encode('ascii', 'ignore').decode('ascii')
                        print(f" * [INSIGHT DISCOVERED] '{title}'")
                    elif ev_type == "complete":
                        print("\n[+] [Complete] Stream connection closed by server.")
                        break
                    elif ev_type == "error":
                        print(f"[-] [Agent Error] {data_json.get('message')}")
                        break
    except Exception as e:
        print(f"[-] Error while reading SSE stream: {e}")

    # 5. Get compiled Report
    print("\n[Report] Retrieving finalized insights report...")
    rep_res = requests.get(f"{API_BASE}/api/agent/report/{session_id}")
    if rep_res.status_code == 200:
        report = rep_res.json()
        print(f"[+] Success! Compiled Report contains:")
        print(f" - Total Queries Run: {report.get('queries_run')}")
        print(f" - Discoveries count: {len(report.get('insights', []))}")
        print(f" - Proactive Alerts count: {len(report.get('alerts', []))}")
    else:
        print("[-] Failed to load report details.")

    # 6. Test Chatbot
    print("\n[Chat] Testing Multilingual Chatbot query:")
    chat_question = "Explain the cash flow deficit in simple words"
    print(f" - Sending Question: '{chat_question}'")
    chat_res = requests.post(f"{API_BASE}/api/chat/{session_id}", json={"message": chat_question})
    if chat_res.status_code == 200:
        ans = chat_res.json()
        print(f"[+] Chat Response ({ans.get('language').upper()}):")
        print("----------------------------------------------------")
        ans_text = ans.get("response", "").encode('ascii', 'ignore').decode('ascii')
        print(ans_text)
        print("----------------------------------------------------")
    else:
        print("[-] Chatbot query failed.")

if __name__ == "__main__":
    run_test_pipeline()

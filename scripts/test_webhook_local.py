import hmac, hashlib, json, time, requests, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

WEBHOOK_KEY = "831bad68bdd9db6a2a1ab470625a15ac"
BASE_URL = "http://localhost:8888/api/v1/webhooks/email"

def make_signature():
    token = os.urandom(16).hex()
    timestamp = str(int(time.time()))
    payload = f"{timestamp}{token}".encode()
    sig = hmac.new(WEBHOOK_KEY.encode(), payload, hashlib.sha256).hexdigest()
    return {"timestamp": timestamp, "token": token, "signature": sig}

def send_email(sender, subject, body, message_id):
    sig = make_signature()
    payload = {
        "sender": sender,
        "from": f"Test User <{sender}>",
        "subject": subject,
        "stripped-text": body,
        "Message-Id": message_id,
        "signature": sig,
    }
    print(f"\n{'='*60}")
    print(f"SENDING: subject='{subject[:40]}...' body='{body[:50]}...'")
    resp = requests.post(BASE_URL, json=payload)
    print(f"RESPONSE [{resp.status_code}]: {resp.text}")
    return resp.json()

# Step 1: First contact
msg1 = "Namaste,\nAaj subah se mera ATM card kaam nahi kar raha hai. Maine do baar transaction try kiya lekin paise account se kat gaye aur ATM se nahi nikle. Rs 5000 debit hua hai par cash nahi mila. Kripya jald se jald iska solution karein.\n\nRajesh Sharma"
result1 = send_email("rajesh@example.com", "ATM Card Issue", msg1, "<msg001@example.com>")

# Wait for processing
time.sleep(3)

# Step 2: Follow-up with details
msg2 = "Mera naam Rajesh Sharma hai.\nAccount number: 40125678910\nPhone number: 9876543210"
result2 = send_email("rajesh@example.com", "Re: ATM Card Issue", msg2, "<msg002@example.com>")

print(f"\n{'='*60}")
print(f"Step 1 result: {result1}")
print(f"Step 2 result: {result2}")
print("Running script version 3")
import requests
import random
import string
import os
import json
import sys

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_API_KEY = os.environ.get("SUPABASE_API_KEY")

if not SUPABASE_URL or not SUPABASE_API_KEY:
    print("Error: SUPABASE_URL and SUPABASE_API_KEY environment variables must be set")
    sys.exit(1)


def random_string(length=10):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

email = f"{random_string()}@tesing.com"
password = random_string(14)

headers = {
    "apikey": SUPABASE_API_KEY,
    "Authorization": f"Bearer {SUPABASE_API_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

payload = {
    "username": random_string(),
    "email": email,
    "password": password
}

try:
    response = requests.post(
        SUPABASE_URL,
        headers=headers,
        data=json.dumps(payload),
        timeout=10
    )

    print("Status:", response.status_code)
    print("Email Created:", email)
    print("Response:", response.text)

    if response.status_code not in [200, 201]:
        sys.exit(1)

except Exception as e:
    print("Error:", str(e))
    sys.exit(1)
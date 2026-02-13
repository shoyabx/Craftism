import requests
import random
import string
import os
import json
import sys

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_API_KEY = os.environ.get("SUPABASE_API_KEY")

def random_string(length=10):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

email = f"{random_string()}@example.com"
password = random_string(14)

headers = {
    "apikey": sb_publishable_UGAMF3ae5nGhhme_gq85pw_b27qgacp,
    "Authorization": f"Bearer {sb_publishable_UGAMF3ae5nGhhme_gq85pw_b27qgacp}",
    "Content-Type": "application/json"
}

payload = {
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
import asyncio
import httpx
import os
import base64
from dotenv import load_dotenv

load_dotenv()

LND_URL = os.getenv("LND_URL")
LND_MACAROON = os.getenv("LND_MACAROON")

import pytest

@pytest.mark.asyncio
async def test_r_hash_format():
    # The r_hash from your previous successful invoice creation
    # It was: JgXCvX9rNMeeXT3humv2h9QhVmEQJXppnnqomJpsi7Y=
    r_hash_b64 = "JgXCvX9rNMeeXT3humv2h9QhVmEQJXppnnqomJpsi7Y="
    
    # Convert B64 to HEX
    r_hash_bytes = base64.b64decode(r_hash_b64)
    r_hash_hex = r_hash_bytes.hex()
    
    print(f"B64: {r_hash_b64}")
    print(f"HEX: {r_hash_hex}")
    
    headers = {"Grpc-Metadata-macaroon": LND_MACAROON}
    
    async with httpx.AsyncClient(verify=False) as client:
        # Try HEX format (LND REST often prefers this in URL paths)
        url = f"{LND_URL}/v1/invoice/{r_hash_hex}"
        print(f"Testing URL: {url}")
        
        try:
            response = await client.get(url, headers=headers)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                print("✅ Success with HEX format!")
                print(f"Settled: {response.json().get('settled')}")
            else:
                print(f"❌ Failed: {response.text}")
        except Exception as e:
            print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_r_hash_format())

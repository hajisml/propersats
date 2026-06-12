import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

LND_URL = os.getenv("LND_URL")
LND_MACAROON = os.getenv("LND_MACAROON")

import pytest

@pytest.mark.asyncio
async def test_connection():
    if not LND_URL or not LND_MACAROON:
        print("❌ Error: LND_URL or LND_MACAROON not found in .env")
        return

    print(f"Connecting to: {LND_URL}...")
    headers = {"Grpc-Metadata-macaroon": LND_MACAROON}
    
    async with httpx.AsyncClient(verify=False) as client:
        try:
            # GetInfo is the standard 'ping' for LND
            response = await client.get(f"{LND_URL}/v1/getinfo", headers=headers)
            response.raise_for_status()
            data = response.json()
            print("✅ Successfully connected to LND!")
            print(f"Node Alias: {data.get('alias')}")
            print(f"Network: {data.get('chains')[0].get('network')}")
        except Exception as e:
            print(f"❌ Connection Failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_connection())

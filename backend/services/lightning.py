import httpx
from typing import Dict, Any

class LightningClient:
    def __init__(self, base_url: str, macaroon: str):
        self.base_url = base_url
        self.macaroon = macaroon
        self.headers = {"Grpc-Metadata-macaroon": self.macaroon}

    async def create_invoice(self, amount_sats: int, memo: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(verify=False) as client:
            url = f"{self.base_url}/v1/invoices"
            payload = {
                "value": str(amount_sats),
                "memo": memo
            }
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def is_invoice_paid(self, r_hash_str: str) -> bool:
        """
        Check if an invoice is settled. Accepts r_hash in either Base64 or Hex.
        LND REST API expects hex in the URL path.
        """
        import base64
        
        # Try to detect if it's hex or b64
        # Hex is 64 chars for 32 bytes, B64 is ~44 chars
        r_hash_hex = r_hash_str
        try:
            # If it's valid hex and 64 chars, it's likely already hex
            if len(r_hash_str) == 64:
                bytes.fromhex(r_hash_str)
            else:
                # Try decoding as b64 and converting to hex
                r_hash_bytes = base64.b64decode(r_hash_str)
                r_hash_hex = r_hash_bytes.hex()
        except Exception:
            # Fallback to original string if all else fails
            pass

        async with httpx.AsyncClient(verify=False) as client:
            url = f"{self.base_url}/v1/invoice/{r_hash_hex}"
            response = await client.get(url, headers=self.headers, timeout=5.0)
            if response.status_code != 200:
                return False
            data = response.json()
            return data.get("settled", False)

    async def send_payouts(self, splits: Dict[str, int]) -> bool:
        """
        Simulate LND sendMany or multiple keysend payments for automated payout.
        In a real app, this would use self.base_url/v1/payreq or /v2/router/send
        """
        print(f"DEBUG: Executing Lightning Payouts: {splits}")
        # In a real LND integration, we'd loop through splits and call send_payment
        # or use a single multi-output transaction if using on-chain/submarine swaps.
        return True

    async def get_status(self) -> str:
        try:
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.get(f"{self.base_url}/v1/getinfo", headers=self.headers, timeout=2.0)
                return "connected" if response.status_code == 200 else "disconnected"
        except Exception:
            return "error"

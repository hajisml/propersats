from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.lightning import LightningClient
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ProperSats API")

# Simple mock data for hackathon
PLOTS = [
    {
        "id": 1, 
        "location": "Nairobi Outskirts", 
        "price_sats": 50000, 
        "status": "available", 
        "description": "1/4 acre near the hills. Fertile soil, ideal for residential or small-scale farming.",
        "image_url": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop"
    },
    {
        "id": 2, 
        "location": "Kiambu Greenery", 
        "price_sats": 75000, 
        "status": "available", 
        "description": "Lush green plot perfect for farming. Excellent road access and ready title deed.",
        "image_url": "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=800&auto=format&fit=crop"
    },
]

# Track r_hash to plot_id mapping
PENDING_PAYMENTS = {}

# In-memory Escrow tracking
ESCROWS = {}

class Plot(BaseModel):
    id: int
    location: str
    price_sats: int
    status: str
    description: str
    image_url: str

class InvoiceResponse(BaseModel):
    payment_request: str
    r_hash: str
    plot_id: int

class EscrowApproval(BaseModel):
    stakeholder: str  # "surveyor" or "lawyer"
    approved: bool

class EscrowStatus(BaseModel):
    plot_id: int
    surveyor_approved: bool = False
    lawyer_approved: bool = False
    status: str = "pending"  # pending, settled

# Initialize Lightning Client (Placeholder credentials)
LND_URL = os.getenv("LND_URL", "https://localhost:8080")
LND_MACAROON = os.getenv("LND_MACAROON", "mock_macaroon")
lightning = LightningClient(LND_URL, LND_MACAROON)

@app.get("/")
async def root():
    return {"message": "Welcome to ProperSats API"}

@app.get("/health")
async def health():
    lnd_status = await lightning.get_status()
    return {
        "status": "healthy",
        "lightning": lnd_status,
        "environment": os.getenv("ENV", "development")
    }

@app.get("/plots", response_model=List[Plot])
async def get_plots():
    return PLOTS

@app.get("/plots/{plot_id}", response_model=Plot)
async def get_plot(plot_id: int):
    plot = next((p for p in PLOTS if p["id"] == plot_id), None)
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    return plot

@app.post("/plots/{plot_id}/buy", response_model=InvoiceResponse)
async def buy_plot(plot_id: int):
    plot = next((p for p in PLOTS if p["id"] == plot_id), None)
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    if plot["status"] != "available":
        raise HTTPException(status_code=400, detail="Plot is not available")

    # In a real app, we'd create a pending transaction in DB here
    memo = f"Purchase of Plot {plot_id} at {plot['location']}"
    try:
        invoice = await lightning.create_invoice(plot["price_sats"], memo)
        r_hash = invoice["r_hash"]
        PENDING_PAYMENTS[r_hash] = plot_id
        return {
            "payment_request": invoice["payment_request"],
            "r_hash": r_hash,
            "plot_id": plot_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lightning Error: {str(e)}")

@app.get("/payments/{r_hash}")
async def check_payment(r_hash: str):
    try:
        is_paid = await lightning.is_invoice_paid(r_hash)
        if is_paid and r_hash in PENDING_PAYMENTS:
            plot_id = PENDING_PAYMENTS.pop(r_hash)
            plot = next((p for p in PLOTS if p["id"] == plot_id), None)
            if plot:
                plot["status"] = "pending_escrow"
                # Initialize Escrow state
                ESCROWS[plot_id] = EscrowStatus(plot_id=plot_id)
        return {"settled": is_paid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lightning Error: {str(e)}")

@app.get("/escrows/{plot_id}", response_model=EscrowStatus)
async def get_escrow(plot_id: int):
    if plot_id not in ESCROWS:
        raise HTTPException(status_code=404, detail="Escrow not found")
    return ESCROWS[plot_id]

@app.post("/escrows/{plot_id}/approve")
async def approve_escrow(plot_id: int, approval: EscrowApproval):
    if plot_id not in ESCROWS:
        raise HTTPException(status_code=404, detail="Escrow not found for this plot")
    
    escrow = ESCROWS[plot_id]
    
    if approval.stakeholder.lower() == "surveyor":
        escrow.surveyor_approved = True
    elif approval.stakeholder.lower() == "lawyer":
        escrow.lawyer_approved = True
    else:
        raise HTTPException(status_code=400, detail="Invalid stakeholder")

    # Check for settlement condition (2-of-2 for now)
    if escrow.surveyor_approved and escrow.lawyer_approved:
        # Trigger Payout
        plot = next((p for p in PLOTS if p["id"] == plot_id), None)
        if plot:
            # Calculate splits
            total = plot["price_sats"]
            splits = {
                "seller": int(total * 0.90),
                "surveyor": int(total * 0.04),
                "lawyer": int(total * 0.04),
                "platform": int(total * 0.02)
            }
            # Mock payout for now
            print(f"TRAPPING PAYOUT: {splits}")
            await lightning.send_payouts(splits)
            escrow.status = "settled"
            plot["status"] = "sold"

    return {"message": f"Approval received from {approval.stakeholder}", "escrow": escrow}

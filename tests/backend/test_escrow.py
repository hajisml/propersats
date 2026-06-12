import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_escrow_initialization(client: AsyncClient, mocker):
    # 1. Mock payment settlement
    mock_is_paid = mocker.patch("backend.main.lightning.is_invoice_paid", new_callable=mocker.AsyncMock)
    mock_is_paid.return_value = True

    # 2. Setup pending payment
    from backend.main import PENDING_PAYMENTS, PLOTS
    r_hash = "test_hash"
    PENDING_PAYMENTS[r_hash] = 1
    PLOTS[0]["status"] = "available"

    # 3. Check payment -> triggers escrow init
    response = await client.get(f"/payments/{r_hash}")
    assert response.status_code == 200
    assert response.json()["settled"] is True
    assert PLOTS[0]["status"] == "pending_escrow"

    # 4. Verify escrow state exists
    resp_escrow = await client.get("/escrows/1")
    assert resp_escrow.status_code == 200
    assert resp_escrow.json()["status"] == "pending"

@pytest.mark.asyncio
async def test_escrow_approval_flow(client: AsyncClient):
    # Ensure escrow is initialized (manually for this test)
    from backend.main import ESCROWS, PLOTS
    from backend.main import EscrowStatus
    plot_id = 2
    ESCROWS[plot_id] = EscrowStatus(plot_id=plot_id)
    PLOTS[1]["status"] = "pending_escrow"

    # 1. Surveyor approves
    resp = await client.post(f"/escrows/{plot_id}/approve", json={"stakeholder": "surveyor", "approved": True})
    assert resp.status_code == 200
    assert resp.json()["escrow"]["surveyor_approved"] is True
    assert resp.json()["escrow"]["status"] == "pending"

    # 2. Lawyer approves -> should settle
    resp = await client.post(f"/escrows/{plot_id}/approve", json={"stakeholder": "lawyer", "approved": True})
    assert resp.status_code == 200
    assert resp.json()["escrow"]["lawyer_approved"] is True
    assert resp.json()["escrow"]["status"] == "settled"
    
    # 3. Verify plot is sold
    assert PLOTS[1]["status"] == "sold"

@pytest.mark.asyncio
async def test_invalid_stakeholder(client: AsyncClient):
    # Ensure escrow is initialized
    from backend.main import ESCROWS, EscrowStatus
    ESCROWS[1] = EscrowStatus(plot_id=1)
    
    resp = await client.post("/escrows/1/approve", json={"stakeholder": "hacker", "approved": True})
    assert resp.status_code == 400
    assert "Invalid stakeholder" in resp.json()["detail"]

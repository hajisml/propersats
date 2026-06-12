import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_plots(client: AsyncClient):
    response = await client.get("/plots")
    assert response.status_code == 200
    assert len(response.json()) == 2
    assert response.json()[0]["location"] == "Nairobi Outskirts"

@pytest.mark.asyncio
async def test_buy_plot_success(client: AsyncClient, mocker):
    # Mock lightning client instead of httpx directly to simplify
    mock_create_invoice = mocker.patch("backend.main.lightning.create_invoice", new_callable=mocker.AsyncMock)
    mock_create_invoice.return_value = {
        "payment_request": "lnbc50k...",
        "r_hash": "hash50k"
    }

    response = await client.post("/plots/1/buy")
    assert response.status_code == 200
    data = response.json()
    assert data["payment_request"] == "lnbc50k..."
    assert data["plot_id"] == 1
    mock_create_invoice.assert_called_once_with(50000, "Purchase of Plot 1 at Nairobi Outskirts")

@pytest.mark.asyncio
async def test_buy_plot_lightning_failure(client: AsyncClient, mocker):
    # Mock create_invoice to raise an exception
    mocker.patch("backend.main.lightning.create_invoice", side_effect=Exception("LND Offline"))

    response = await client.post("/plots/1/buy")
    assert response.status_code == 500
    assert "Lightning Error: LND Offline" in response.json()["detail"]

@pytest.mark.asyncio
async def test_buy_plot_not_found(client: AsyncClient):
    response = await client.post("/plots/99/buy")
    assert response.status_code == 404

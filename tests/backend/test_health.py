import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check_lnd_connected(client: AsyncClient, mocker):
    # Mock the LightningClient.get_status instead of httpx directly
    mocker.patch("backend.main.lightning.get_status", return_value="connected")

    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["lightning"] == "connected"

@pytest.mark.asyncio
async def test_health_check_lnd_disconnected(client: AsyncClient, mocker):
    mocker.patch("backend.main.lightning.get_status", return_value="disconnected")

    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["lightning"] == "disconnected"

@pytest.mark.asyncio
async def test_health_check_lnd_error(client: AsyncClient, mocker):
    mocker.patch("backend.main.lightning.get_status", return_value="error")

    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["lightning"] == "error"

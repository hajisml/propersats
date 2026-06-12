import pytest
from backend.services.lightning import LightningClient

@pytest.mark.asyncio
async def test_create_invoice(mocker):
    # Properly mock async httpx client
    mock_post = mocker.patch("httpx.AsyncClient.post", new_callable=mocker.AsyncMock)
    mock_response = mocker.MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "payment_request": "lnbc1...",
        "r_hash": "hash123"
    }
    mock_post.return_value = mock_response

    client = LightningClient(base_url="https://localhost:8080", macaroon="mock")
    invoice = await client.create_invoice(amount_sats=1000, memo="Test Land Plot")

    assert invoice["payment_request"] == "lnbc1..."
    assert invoice["r_hash"] == "hash123"
    mock_post.assert_called_once()

@pytest.mark.asyncio
async def test_check_invoice_paid(mocker):
    mock_get = mocker.patch("httpx.AsyncClient.get", new_callable=mocker.AsyncMock)
    mock_response = mocker.MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "settled": True
    }
    mock_get.return_value = mock_response

    client = LightningClient(base_url="https://localhost:8080", macaroon="mock")
    is_paid = await client.is_invoice_paid(r_hash_str="hash123")

    assert is_paid is True
    mock_get.assert_called_once()

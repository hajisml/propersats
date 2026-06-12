import pytest_asyncio
from typing import AsyncGenerator
from httpx import ASGITransport, AsyncClient
from backend.main import app

@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

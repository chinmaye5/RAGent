from contextlib import asynccontextmanager
from fastapi.testclient import TestClient

from app.main import app

@asynccontextmanager
async def dummy_lifespan(app):
    yield

app.router.lifespan_context = dummy_lifespan
client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    
    # Verify the response
    assert response.status_code == 200
    assert response.json() == {
        "status": "OK",
        "message": "application is running"
    }


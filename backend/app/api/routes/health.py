from fastapi import APIRouter
from app.schemas.health import HealthResponse

router=APIRouter()

@router.get("/health",response_model=HealthResponse)
def health_check():
    return {
        "status":"OK",
        "message":"application is running"
    }
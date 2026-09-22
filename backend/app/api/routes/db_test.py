from fastapi import APIRouter
from sqlalchemy import text

from app.core.database import engine


router = APIRouter()


@router.get("/db-test")
async def database_test():
    async with engine.connect() as connection:
        result = await connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "result": result.scalar(),
        }
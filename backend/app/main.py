import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.api.routes.chats import router as chats_router
from app.api.routes.db_test import router as db_test_router
from app.api.routes.documents import router as document_router
from app.api.routes.health import router as health_router
from app.core.database import engine
from app.models.models import Base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create missing database tables (users, chats, chat_messages) on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/")
def root():
    return {"message": "Server running succesfully!"}


from app.api.routes.gateway import router as gateway_router

app.include_router(auth_router)
app.include_router(chats_router)
app.include_router(gateway_router)
app.include_router(health_router)
app.include_router(document_router)
app.include_router(db_test_router)


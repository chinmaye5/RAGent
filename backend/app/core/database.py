from typing import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import Session, sessionmaker
from app.core.config import settings

connect_args = {}
if "asyncpg" in settings.database_url:
    connect_args["statement_cache_size"] = 0
    connect_args["prepared_statement_cache_size"] = 0

engine = create_async_engine(
    settings.database_url,
    connect_args=connect_args,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Synchronous engine & sessionmaker for synchronous execution contexts (e.g. LangGraph nodes)
sync_engine = create_engine(
    settings.psycopg_db_url,
)

SessionSync = sessionmaker(
    bind=sync_engine,
    class_=Session,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining an async SQLAlchemy session."""
    async with SessionLocal() as session:
        yield session

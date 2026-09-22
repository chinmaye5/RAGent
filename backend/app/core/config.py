from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    database_url: str = ""
    supabase_db_url: str = ""
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"

    @property
    def psycopg_db_url(self) -> str:
        url = self.supabase_db_url or self.database_url or os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL", "")
        url = url.replace("postgresql+asyncpg://", "postgresql://").replace("postgresql+psycopg://", "postgresql://")
        return url

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
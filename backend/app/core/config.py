from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://user:pass@localhost:5432/db"
    supabase_db_url: str = ""
    groq_api_key: str = ""

    groq_model: str = "openai/gpt-oss-120b"
    jina_api_key: str = ""
    jwt_secret_key: str = os.environ.get("JWT_SECRET_KEY") or "default_ci_secret"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24



    @property
    def psycopg_db_url(self) -> str:
        url = self.supabase_db_url or self.database_url or os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL", "postgresql://user:pass@localhost:5432/db")
        url = url.replace("postgresql+asyncpg://", "postgresql://").replace("postgresql+psycopg://", "postgresql://")
        return url



    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
from functools import lru_cache
import os
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class Settings(BaseModel):
    database_url: str
    postgres_sslmode: str = "require"
    redis_url: str = "redis://:uccd_redis_pass@localhost:6379/0"
    kafka_bootstrap_servers: str = "localhost:9093"
    jwt_secret: str
    jwt_alg: str = "HS256"
    jwt_expires_minutes: int = 720
    groq_api_key: Optional[str] = None
    sarvam_access_token: Optional[str] = None
    telegram_bot_token: Optional[str] = None
    api_host: str = "http://localhost:8000"

    @classmethod
    def from_env(cls) -> "Settings":
        database_url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("POSTGRES_URL (or DATABASE_URL) environment variable is not set")

        jwt_secret = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY")
        if not jwt_secret:
            raise ValueError("JWT_SECRET (or SECRET_KEY) environment variable is not set")

        return cls(
            database_url=database_url,
            postgres_sslmode=os.getenv("POSTGRES_SSLMODE", "require"),
            redis_url=os.getenv("REDIS_URL", "redis://:uccd_redis_pass@localhost:6379/0"),
            kafka_bootstrap_servers=os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9093"),
            jwt_secret=jwt_secret,
            jwt_alg=os.getenv("JWT_ALG", "HS256"),
            jwt_expires_minutes=int(os.getenv("JWT_EXPIRES_MINUTES", "720")),
            groq_api_key=os.getenv("GROQ_API_KEY"),
            sarvam_access_token=os.getenv("SARVAM_ACCESS_TOKEN"),
            telegram_bot_token=os.getenv("TELEGRAM_BOT_TOKEN"),
            api_host=os.getenv("API_HOST", "http://localhost:8000"),
        )


@lru_cache
def get_settings() -> Settings:
    return Settings.from_env()

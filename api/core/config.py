import os
from pathlib import Path

from dotenv import load_dotenv

_repo_root = Path(__file__).resolve().parents[2]
load_dotenv(_repo_root / ".env.local", override=False)


class Settings:
    @property
    def database_url(self) -> str:
        value = os.environ.get("DATABASE_URL")
        if not value:
            raise RuntimeError("DATABASE_URL is not set")
        return value

    @property
    def internal_api_key(self) -> str:
        value = os.environ.get("INTERNAL_API_KEY")
        if not value:
            raise RuntimeError("INTERNAL_API_KEY is not set")
        return value


settings = Settings()

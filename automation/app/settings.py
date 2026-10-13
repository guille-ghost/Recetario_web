from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    portal_api_base: str = ""
    portal_import_secret: str = ""
    upload_secret: str = ""
    llm_provider: Literal["ollama", "openai"] = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    openai_api_key: str = ""
    llm_model: str = "qwen3:8b"
    max_file_bytes: int = 15_000_000
    max_text_chars: int = 100_000


@lru_cache
def get_settings() -> Settings:
    return Settings()

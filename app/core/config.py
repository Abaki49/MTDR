from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "MTDR"
    debug: bool = False

    database_url: str = "postgresql://mtdr:mtdr@localhost:5432/mtdr"
    database_pool_size: int = 10
    database_max_overflow: int = 20

    cors_origins: list[str] = ["http://localhost:5173"]

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "MTDR"
    debug: bool = False

    database_url: str = "postgresql://mtdr:mtdr@localhost:5432/mtdr"
    database_pool_size: int = 10
    database_max_overflow: int = 20

    cors_origins: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import routers as v1_routers
from app.core.cache import close_redis, init_redis
from app.core.config import settings

API_V1_PREFIX = "/v1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis(settings.redis_url)
    yield
    await close_redis()


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in v1_routers:
    app.include_router(router, prefix=API_V1_PREFIX)

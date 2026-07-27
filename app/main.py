from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import routers as v1_routers
from app.core.config import settings

API_V1_PREFIX = "/v1"

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in v1_routers:
    app.include_router(router, prefix=API_V1_PREFIX)

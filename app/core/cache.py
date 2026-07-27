import json
from typing import Optional

import redis.asyncio as aioredis

redis_client: Optional[aioredis.Redis] = None


async def init_redis(url: str) -> None:
    global redis_client
    redis_client = aioredis.from_url(url, decode_responses=True)


async def close_redis() -> None:
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None


def user_identity_key(user_id: int) -> str:
    return f"user:{user_id}:identity"


async def get_cache(key: str) -> Optional[str]:
    if redis_client is None:
        return None
    return await redis_client.get(key)


async def set_cache(key: str, value: str, ttl: int = 300) -> None:
    if redis_client is None:
        return
    await redis_client.setex(key, ttl, value)


async def delete_cache(key: str) -> None:
    if redis_client is None:
        return
    await redis_client.delete(key)


async def invalidate_user_cache(user_id: int) -> None:
    await delete_cache(user_identity_key(user_id))


async def get_cached_user_identity(user_id: int) -> Optional[dict]:
    raw = await get_cache(user_identity_key(user_id))
    if raw is None:
        return None
    return json.loads(raw)


async def set_cached_user_identity(user_id: int, data: dict, ttl: int = 300) -> None:
    await set_cache(user_identity_key(user_id), json.dumps(data, default=str), ttl=ttl)

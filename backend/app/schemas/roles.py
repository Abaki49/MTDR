from pydantic import BaseModel


class RoleResponse(BaseModel):
    id: int
    name: str
    is_system: bool
    rank: int
    caller_can_assign: bool = False

    class Config:
        from_attributes = True

from pydantic import BaseModel


class RoleResponse(BaseModel):
    id: int
    name: str
    is_system: bool
    rank: int

    class Config:
        from_attributes = True

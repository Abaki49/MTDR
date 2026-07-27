from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as organizations_router
from app.api.v1.memberships import router as memberships_router
from app.api.v1.roles import router as roles_router
from app.api.v1.permissions import router as permissions_router
from app.api.v1.resources import router as resources_router
from app.api.v1.audit import router as audit_router
from app.api.v1.public import router as public_router

routers = [
    auth_router,
    organizations_router,
    memberships_router,
    roles_router,
    permissions_router,
    resources_router,
    audit_router,
    public_router,
]

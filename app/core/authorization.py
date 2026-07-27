from fastapi import Depends, HTTPException, status

from app.core.auth import get_current_user
from app.database.models.user import User


def require_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can perform this action",
        )
    return current_user

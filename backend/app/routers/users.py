from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models import User
from app.schemas import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user

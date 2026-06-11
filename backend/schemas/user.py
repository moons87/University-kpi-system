from pydantic import BaseModel
from typing import Optional


class UserOut(BaseModel):
    id: int
    email: str
    role: str
    teacher_id: Optional[int]

    model_config = {"from_attributes": True}

from pydantic import BaseModel
from typing import Optional


class GroupCreate(BaseModel):
    name: str
    education_level: Optional[str] = None
    advisor_id: Optional[int] = None


class GroupUpdate(BaseModel):
    advisor_id: Optional[int] = None


class GroupOut(BaseModel):
    id: int
    name: str
    education_level: Optional[str] = None
    advisor_id: Optional[int] = None
    model_config = {"from_attributes": True}

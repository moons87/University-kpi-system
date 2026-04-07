from pydantic import BaseModel
from typing import Optional


class GroupCreate(BaseModel):
    name: str
    education_level: Optional[str] = None


class GroupOut(BaseModel):
    id: int
    name: str
    education_level: Optional[str]
    model_config = {"from_attributes": True}

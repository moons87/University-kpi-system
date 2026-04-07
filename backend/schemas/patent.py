from pydantic import BaseModel
from typing import Optional


class PatentCreate(BaseModel):
    teacher_id:          int
    time_id:             int
    title:               str
    registration_number: Optional[str] = None


class PatentOut(BaseModel):
    id:                  int
    teacher_id:          int
    time_id:             int
    title:               str
    registration_number: Optional[str]
    model_config = {"from_attributes": True}

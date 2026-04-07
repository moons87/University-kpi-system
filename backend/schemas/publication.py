from pydantic import BaseModel
from typing import Optional


class PublicationCreate(BaseModel):
    teacher_id: int
    time_id:    int
    title:      str
    type:       str
    quartile:   Optional[str] = None


class PublicationOut(BaseModel):
    id:         int
    teacher_id: int
    time_id:    int
    title:      str
    type:       str
    quartile:   Optional[str]
    model_config = {"from_attributes": True}

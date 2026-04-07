from pydantic import BaseModel
from typing import Optional


class TimeDimCreate(BaseModel):
    year: int
    semester: int
    quarter: Optional[int] = None


class TimeDimOut(BaseModel):
    id: int
    year: int
    semester: int
    quarter: Optional[int]
    model_config = {"from_attributes": True}

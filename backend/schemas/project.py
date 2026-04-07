from pydantic import BaseModel
from typing import Optional
from datetime import date
from decimal import Decimal


class ProjectCreate(BaseModel):
    teacher_id:     int
    time_id:        int
    title:          str
    funding_source: Optional[str]     = None
    budget:         Optional[Decimal] = None
    start_date:     Optional[date]    = None
    end_date:       Optional[date]    = None


class ProjectOut(BaseModel):
    id:             int
    teacher_id:     int
    time_id:        int
    title:          str
    funding_source: Optional[str]
    budget:         Optional[Decimal]
    start_date:     Optional[date]
    end_date:       Optional[date]
    model_config = {"from_attributes": True}

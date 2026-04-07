from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal


class KPIScoreOut(BaseModel):
    id:                int
    teacher_id:        int
    time_id:           int
    teaching_score:    Optional[Decimal]
    research_score:    Optional[Decimal]
    project_score:     Optional[Decimal]
    achievement_score: Optional[Decimal]
    total_score:       Optional[Decimal]
    model_config = {"from_attributes": True}


class KPIDetailOut(BaseModel):
    id:          int
    teacher_id:  int
    time_id:     int
    category:    str
    metric_name: str
    value:       Optional[Decimal]
    score:       Optional[Decimal]
    model_config = {"from_attributes": True}


class KPISummaryItem(BaseModel):
    teacher_id:   int
    teacher_name: str
    total_score:  Optional[Decimal]


class KPISummaryOut(BaseModel):
    time_id: int
    year:    int
    semester: int
    teachers: List[KPISummaryItem]

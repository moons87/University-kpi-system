from pydantic import BaseModel
from typing import Optional, List


class GradeIn(BaseModel):
    subject_id: int
    grade: Optional[float] = None


class GradeOut(BaseModel):
    id: int
    subject_id: int
    grade: Optional[float]
    model_config = {"from_attributes": True}


class StudentCreate(BaseModel):
    full_name: str
    group_id: Optional[int] = None
    education_level: str
    enrollment_year: int
    origin: Optional[str] = None
    language: Optional[str] = None
    payment_form: str
    gender: Optional[str] = None
    grades: List[GradeIn] = []


class StudentOut(BaseModel):
    id: int
    full_name: str
    group_id: Optional[int]
    education_level: str
    enrollment_year: int
    origin: Optional[str]
    language: Optional[str]
    payment_form: str
    gender: Optional[str]
    grades: List[GradeOut] = []
    model_config = {"from_attributes": True}

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .position   import PositionOut
from .degree     import DegreeOut
from .department import DepartmentOut


class TeacherCreate(BaseModel):
    full_name:     str
    email:         Optional[str]  = None
    position_id:   Optional[int]  = None
    degree_id:     Optional[int]  = None
    department_id: Optional[int]  = None


class TeacherOut(BaseModel):
    id:            int
    full_name:     str
    email:         Optional[str]
    position_id:   Optional[int]
    degree_id:     Optional[int]
    department_id: Optional[int]
    created_at:    Optional[datetime]
    model_config = {"from_attributes": True}


class TeacherDetail(TeacherOut):
    position:   Optional[PositionOut]   = None
    degree:     Optional[DegreeOut]     = None
    department: Optional[DepartmentOut] = None

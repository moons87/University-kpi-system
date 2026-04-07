from pydantic import BaseModel


class TeachingLoadCreate(BaseModel):
    teacher_id: int
    subject_id: int
    group_id:   int
    time_id:    int
    hours:      int


class TeachingLoadOut(BaseModel):
    id:         int
    teacher_id: int
    subject_id: int
    group_id:   int
    time_id:    int
    hours:      int
    model_config = {"from_attributes": True}

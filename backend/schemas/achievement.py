from pydantic import BaseModel


class AchievementCreate(BaseModel):
    teacher_id: int
    time_id:    int
    title:      str
    level:      str


class AchievementOut(BaseModel):
    id:         int
    teacher_id: int
    time_id:    int
    title:      str
    level:      str
    model_config = {"from_attributes": True}

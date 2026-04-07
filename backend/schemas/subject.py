from pydantic import BaseModel


class SubjectCreate(BaseModel):
    name: str


class SubjectOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}

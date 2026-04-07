from pydantic import BaseModel


class DegreeCreate(BaseModel):
    name: str


class DegreeOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}

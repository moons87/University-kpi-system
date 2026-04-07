from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str


class DepartmentOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}

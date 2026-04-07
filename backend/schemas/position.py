from pydantic import BaseModel


class PositionCreate(BaseModel):
    name: str


class PositionOut(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}

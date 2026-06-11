from pydantic import BaseModel

class KPISettingBase(BaseModel):
    key: str
    value: float

class KPISettingOut(KPISettingBase):
    model_config = {"from_attributes": True}

class KPISettingsUpdate(BaseModel):
    # Dict mapping settings keys to their float values
    settings: dict[str, float]

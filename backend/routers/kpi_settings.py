from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import KPISetting, User
from schemas.kpi_setting import KPISettingOut, KPISettingsUpdate
from auth.jwt import get_current_user, require_admin

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/", response_model=List[KPISettingOut])
def get_settings(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(KPISetting).all()

@router.put("/")
def update_settings(body: KPISettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit settings")
    
    # Upsert logic
    for key, val in body.settings.items():
        setting = db.get(KPISetting, key)
        if setting:
            setting.value = val
        else:
            db.add(KPISetting(key=key, value=val))
    db.commit()
    return {"status": "ok", "updated_keys": list(body.settings.keys())}

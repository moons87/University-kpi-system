from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from database import get_db
from auth.jwt import require_advisor_or_admin
from models import User
from schemas.import_schemas import ConfirmResponse, PreviewResponse
from services.import_service import commit_import, parse_excel

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/preview", response_model=PreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_advisor_or_admin),
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Только .xlsx файлы поддерживаются")
    content = await file.read()
    sheets = parse_excel(content, db)
    if not sheets:
        raise HTTPException(status_code=422, detail="Не найдено ни одного распознанного листа")
    return PreviewResponse(sheets=sheets)


@router.post("/confirm", response_model=ConfirmResponse)
async def confirm_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_advisor_or_admin),
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Только .xlsx файлы поддерживаются")
    content = await file.read()
    sheets = parse_excel(content, db)
    imported, skipped, details = commit_import(sheets, db)
    return ConfirmResponse(imported=imported, skipped=skipped, details=details)

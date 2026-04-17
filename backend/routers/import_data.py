from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from database import get_db
from auth.jwt import require_advisor_or_admin, get_current_user
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


VALID_SHEET_TYPES = {"teaching_load", "publications", "patents", "achievements", "projects"}


@router.post("/teacher/preview", response_model=PreviewResponse)
async def teacher_preview_import(
    sheet_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if sheet_type not in VALID_SHEET_TYPES:
        raise HTTPException(status_code=400, detail=f"sheet_type должен быть одним из: {', '.join(sorted(VALID_SHEET_TYPES))}")
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Только .xlsx файлы поддерживаются")
    if current_user.teacher_id is None:
        raise HTTPException(status_code=403, detail="Ваш аккаунт не привязан к преподавателю")
    content = await file.read()
    from services.import_service import parse_excel_teacher
    sheet = parse_excel_teacher(content, sheet_type, current_user.teacher_id, db)
    return PreviewResponse(sheets=[sheet])


@router.post("/teacher/confirm", response_model=ConfirmResponse)
async def teacher_confirm_import(
    sheet_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if sheet_type not in VALID_SHEET_TYPES:
        raise HTTPException(status_code=400, detail=f"sheet_type должен быть одним из: {', '.join(sorted(VALID_SHEET_TYPES))}")
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Только .xlsx файлы поддерживаются")
    if current_user.teacher_id is None:
        raise HTTPException(status_code=403, detail="Ваш аккаунт не привязан к преподавателю")
    content = await file.read()
    from services.import_service import parse_excel_teacher, commit_import_teacher
    sheet = parse_excel_teacher(content, sheet_type, current_user.teacher_id, db)
    imported, skipped, details = commit_import_teacher(sheet, sheet_type, db)
    return ConfirmResponse(imported=imported, skipped=skipped, details=details)

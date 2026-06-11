from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from database import get_db
from auth.jwt import require_advisor_or_admin, get_current_user
from models import User
from schemas.import_schemas import ConfirmResponse, PreviewResponse
from services.import_service import commit_import, parse_excel

router = APIRouter(prefix="/import", tags=["import"])

# ── Upload safety limits ─────────────────────────────────────────────────────
MAX_UPLOAD_BYTES = 10 * 1024 * 1024   # 10 MB
# XLSX is a ZIP archive — magic bytes: PK\x03\x04
_XLSX_MAGIC = b"PK\x03\x04"


def _validate_upload(filename: str, content: bytes) -> None:
    """Validate size and magic bytes of an uploaded file."""
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Файл тым үлкен. Максималды өлшем: {MAX_UPLOAD_BYTES // (1024*1024)} МБ.",
        )
    if not filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Тек .xlsx файлдары қолданылады")
    # Check actual file signature (not just extension)
    if not content.startswith(_XLSX_MAGIC):
        raise HTTPException(
            status_code=400,
            detail="Жарамсыз файл форматы. Нақты .xlsx файлын жіберіңіз.",
        )


@router.post("/preview", response_model=PreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_advisor_or_admin),
):
    content = await file.read()
    _validate_upload(file.filename or "", content)
    sheets = parse_excel(content, db)
    if not sheets:
        raise HTTPException(status_code=422, detail="Танылған парақтар табылмады")
    return PreviewResponse(sheets=sheets)


@router.post("/confirm", response_model=ConfirmResponse)
async def confirm_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_advisor_or_admin),
):
    content = await file.read()
    _validate_upload(file.filename or "", content)
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
        raise HTTPException(
            status_code=400,
            detail=f"sheet_type мыналардың бірі болуы керек: {', '.join(sorted(VALID_SHEET_TYPES))}",
        )
    if current_user.teacher_id is None:
        raise HTTPException(status_code=403, detail="Аккаунтыңыз оқытушыға байланыстырылмаған")
    content = await file.read()
    _validate_upload(file.filename or "", content)
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
        raise HTTPException(
            status_code=400,
            detail=f"sheet_type мыналардың бірі болуы керек: {', '.join(sorted(VALID_SHEET_TYPES))}",
        )
    if current_user.teacher_id is None:
        raise HTTPException(status_code=403, detail="Аккаунтыңыз оқытушыға байланыстырылмаған")
    content = await file.read()
    _validate_upload(file.filename or "", content)
    from services.import_service import parse_excel_teacher, commit_import_teacher
    sheet = parse_excel_teacher(content, sheet_type, current_user.teacher_id, db)
    imported, skipped, details = commit_import_teacher(sheet, sheet_type, db)
    return ConfirmResponse(imported=imported, skipped=skipped, details=details)

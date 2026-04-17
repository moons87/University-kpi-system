from pydantic import BaseModel
from typing import Any, List, Literal, Optional


class ImportRow(BaseModel):
    row: int
    status: Literal["ok", "warning", "error"]
    message: Optional[str] = None
    data: dict[str, Any] = {}


class SheetPreview(BaseModel):
    sheet: str
    total: int
    valid: int
    warnings: int
    errors: int
    rows: List[ImportRow]


class PreviewResponse(BaseModel):
    sheets: List[SheetPreview]


class ConfirmResponse(BaseModel):
    imported: int
    skipped: int
    details: List[str]

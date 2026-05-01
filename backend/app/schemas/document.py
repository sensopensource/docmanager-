from datetime import datetime
from pydantic import BaseModel, ConfigDict
from pathlib import Path
from app.schemas.tag import TagRead


class DocumentCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    titre: str | None = None
    auteur: str | None = None


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titre: str
    auteur: str | None = None
    date_creation: datetime
    type_fichier: str | None = None
    id_categorie: int | None = None
    tags: list[TagRead] = []

class DocumentPatch(BaseModel):

    titre: str | None = None
    auteur: str | None = None
    id_categorie: int | None = None

class DocumentReadDetail(DocumentRead):
    model_config = ConfigDict(from_attributes=True)

    type_fichier: str | None = None
    date_upload: datetime | None = None
    apercu_contenu: str | None = None
    resume_llm: str | None = None
    numero_version: int | None = None
    tags: list[TagRead] = []

class DocumentDownload(BaseModel):
    path: Path
    filename : str
    media_type: str

class DocumentSearchResult(DocumentRead):
    extrait: str | None = None


class DocumentListResponse(BaseModel):
    items: list[DocumentRead]
    total: int
    page: int
    size: int
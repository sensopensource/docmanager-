from datetime import datetime
from pydantic import BaseModel, ConfigDict


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

class DocumentPatch(BaseModel):
   
    titre: str | None = None
    auteur: str | None = None

class DocumentReadDetail(DocumentRead):
    model_config = ConfigDict(from_attributes=True)

    type_fichier: str | None = None
    date_upload: datetime | None = None
    apercu_contenu: str | None = None
    resume_llm: str | None = None
    numero_version: int | None = None

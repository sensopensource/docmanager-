from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentCreate(BaseModel):
    titre: str | None = None
    auteur: str | None = None
    tags: list[str] | None = None


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titre: str
    auteur: str | None = None
    date_upload: datetime
    type_fichier: str
    tags: list[str] | None = None

class DocumentReadDetail(DocumentRead):
    appercu_contenu: str | None = None

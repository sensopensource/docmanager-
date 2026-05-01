from pydantic import BaseModel, ConfigDict


class CategorieCreate(BaseModel):
    nom: str
    id_parent: int | None = None


class CategoriePatch(BaseModel):
    nom: str | None = None
    id_parent: int | None = None


class CategorieRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nom: str
    id_parent: int | None = None
    count: int = 0

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.utilisateurs import Utilisateur
from app.core.dependencies import get_current_user
from app.schemas.categorie import CategorieCreate, CategoriePatch, CategorieRead
from app.services import categorie_service
from app.database import get_db

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
def list_categories(current_user: Utilisateur = Depends(get_current_user),
                    db: Session = Depends(get_db)
                    ) -> list[CategorieRead]:
    return categorie_service.list_categories(current_user.id, db=db)


@router.post("")
def creer_categorie(payload: CategorieCreate,
                    current_user: Utilisateur = Depends(get_current_user),
                    db: Session = Depends(get_db)) -> CategorieRead:
    categorie = categorie_service.create_categorie(
        db=db,
        nom=payload.nom,
        id_utilisateur=current_user.id,
        id_parent=payload.id_parent,
    )
    return categorie


@router.patch("/{id_categorie}")
def modifier_categorie(id_categorie: int,
                       payload: CategoriePatch,
                       db: Session = Depends(get_db),
                       current_user: Utilisateur = Depends(get_current_user)) -> CategorieRead:
    # update_parent : on ne touche au parent que si la cle id_parent est presente dans le payload
    update_parent = "id_parent" in payload.model_fields_set
    categorie = categorie_service.patch_categorie(
        db=db,
        id_categorie=id_categorie,
        id_utilisateur=current_user.id,
        nom=payload.nom,
        id_parent=payload.id_parent,
        update_parent=update_parent,
    )
    return categorie


@router.delete("/{id_categorie}")
def delete_categorie(id_categorie: int,
                     db: Session = Depends(get_db),
                     current_user: Utilisateur = Depends(get_current_user)):
    if not categorie_service.delete_categorie(
        db=db,
        id_categorie=id_categorie,
        id_utilisateur=current_user.id,
    ):
        raise HTTPException(status_code=404, detail="Categorie non trouvee")
    return {"message": "categorie supprime avec succes"}

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.categories import Categorie
from app.models.documents import Document
from app.schemas.categorie import CategorieRead


def list_categories(id_utilisateur: int,
                    db: Session) -> list[CategorieRead]:
    rows = (
        db.query(Categorie, func.count(Document.id).label("count"))
        .outerjoin(Document, Document.id_categorie == Categorie.id)
        .filter(Categorie.id_utilisateur == id_utilisateur)
        .group_by(Categorie.id)
        .order_by(Categorie.nom)
        .all()
    )

    return [
        CategorieRead(id=cat.id, nom=cat.nom, id_parent=cat.id_parent, count=count)
        for cat, count in rows
    ]


def get_categorie(document: Document,
                  db: Session) -> Categorie:
    return db.query(Categorie).filter(Categorie.id == document.id_categorie).first()


def _validate_parent(db: Session,
                     id_parent: int | None,
                     id_utilisateur: int) -> None:
    """Verifie qu'un id_parent fourni existe et appartient a l'user."""
    if id_parent is None:
        return
    parent = db.query(Categorie).filter(
        Categorie.id == id_parent,
        Categorie.id_utilisateur == id_utilisateur,
    ).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Dossier parent introuvable")


def _get_descendant_ids(db: Session,
                        id_categorie: int,
                        id_utilisateur: int) -> set[int]:
    """Renvoie l'ensemble des ids descendants (recursif) d'une categorie."""
    descendants: set[int] = set()
    stack = [id_categorie]
    while stack:
        current = stack.pop()
        children = db.query(Categorie.id).filter(
            Categorie.id_parent == current,
            Categorie.id_utilisateur == id_utilisateur,
        ).all()
        for (child_id,) in children:
            if child_id not in descendants:
                descendants.add(child_id)
                stack.append(child_id)
    return descendants


def create_categorie(db: Session,
                     nom: str,
                     id_utilisateur: int,
                     id_parent: int | None = None) -> Categorie:
    _validate_parent(db, id_parent, id_utilisateur)
    categorie = Categorie(nom=nom, id_utilisateur=id_utilisateur, id_parent=id_parent)
    db.add(categorie)
    db.commit()
    db.refresh(categorie)
    return categorie


def get_or_create_default_categorie(db: Session,
                                    id_utilisateur: int) -> Categorie:
    categorie = db.query(Categorie).filter(
        Categorie.nom == "Non classe",
        Categorie.id_utilisateur == id_utilisateur,
    ).first()

    if categorie:
        return categorie

    nouvelle = Categorie(nom="Non classe", id_utilisateur=id_utilisateur)
    db.add(nouvelle)
    db.commit()
    db.refresh(nouvelle)
    return nouvelle


def patch_categorie(db: Session,
                    id_categorie: int,
                    id_utilisateur: int,
                    nom: str | None = None,
                    id_parent: int | None = None,
                    update_parent: bool = False) -> Categorie:
    """
    Modifie nom et/ou id_parent.
    update_parent=True signale qu'on veut explicitement modifier le parent
    (pour permettre id_parent=None comme valeur cible : remonter a la racine).
    """
    categorie = db.query(Categorie).filter(
        Categorie.id == id_categorie,
        Categorie.id_utilisateur == id_utilisateur,
    ).first()
    if not categorie:
        raise HTTPException(status_code=404, detail="Categorie non trouvee")

    if nom is not None:
        categorie.nom = nom

    if update_parent:
        # On ne peut pas etre son propre parent
        if id_parent == id_categorie:
            raise HTTPException(status_code=400, detail="Une categorie ne peut pas etre son propre parent")

        # On ne peut pas se mettre dans son propre descendant (cycle)
        if id_parent is not None:
            descendants = _get_descendant_ids(db, id_categorie, id_utilisateur)
            if id_parent in descendants:
                raise HTTPException(status_code=400, detail="Impossible : cela creerait un cycle")
            _validate_parent(db, id_parent, id_utilisateur)

        categorie.id_parent = id_parent

    db.commit()
    db.refresh(categorie)
    return categorie


def delete_categorie(db: Session,
                     id_categorie: int,
                     id_utilisateur: int) -> bool:
    categorie = db.query(Categorie).filter(
        Categorie.id == id_categorie,
        Categorie.id_utilisateur == id_utilisateur,
    ).first()
    if not categorie:
        return False
    db.delete(categorie)
    db.commit()
    return True

import os
import uuid
from pathlib import Path

from sqlalchemy.orm import Session,selectinload
from sqlalchemy import func,or_
from datetime import datetime, timezone

from app.models.documents import Document
from app.models.versions import Version
from app.models.categories import Categorie
from app.schemas.document import DocumentCreate,DocumentReadDetail,DocumentRead,DocumentDownload,DocumentSearchResult,DocumentListResponse,VersionRead
from app.services.extraction import extract_text
from app.models.utilisateurs import Utilisateur
from app.services import llm_service
from datetime import date
from app.models.tags import Tag
from app.database import SessionLocal
from app.services.log_service import log_action
from fastapi import HTTPException


STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "/app/storage/documents"))

##MAPPING HTTP 
MIME_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

def _to_document_read(document: Document, version: Version | None) -> DocumentRead:
    return DocumentRead(
        id=document.id,
        titre=document.titre,
        auteur=document.auteur,
        date_creation=document.date_creation,
        type_fichier=version.type_fichier if version else None,
        id_categorie=document.id_categorie,
        tags=document.tags if hasattr(document, "tags") else [],
    )



def _save_binary(filename: str, file_bytes: bytes) -> tuple[str, str]:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    extension = os.path.splitext(filename)[1].lower()
    unique_name = f"{uuid.uuid4()}{extension}"
    chemin = STORAGE_DIR / unique_name
    chemin.write_bytes(file_bytes)
    return unique_name, extension.lstrip(".")


def create(
    db: Session,
    metadata: DocumentCreate,
    filename: str,
    file_bytes: bytes,
    id_utilisateur: int,
    id_categorie: int,
) -> DocumentRead:
    contenu = extract_text(filename, file_bytes)
    storage_fichier, type_fichier = _save_binary(filename, file_bytes)

    document = Document(
        titre=metadata.titre or filename,
        auteur=metadata.auteur,
        id_utilisateur=id_utilisateur,
        id_categorie=id_categorie,
    )
    db.add(document)
    db.flush()

    version = Version(
        numero=1,
        contenu=contenu,
        storage_fichier=storage_fichier,
        type_fichier=type_fichier,
        id_document=document.id,
        taille_octets=len(file_bytes)
    )
    db.add(version)
    db.commit()
    db.refresh(document)
    v = get_latest_version(db=db,
                           document_id=document.id)

    return _to_document_read(document,v)


def get_file_path(version: Version) -> Path:
    return STORAGE_DIR / version.storage_fichier


def get_latest_version(db: Session, document_id: int) -> Version | None:
    return (
        db.query(Version)
        .filter(Version.id_document == document_id)
        .order_by(Version.numero.desc())
        .first()
    )


def list_documents(db: Session,
                   id_utilisateur: int,
                   page: int = 1,
                   size: int = 20,
                   id_categorie: int | None = None) -> DocumentListResponse:
    offset = (page - 1) * size

    # On construit la query de base avec le filtre user (et optionnellement categorie)
    base_query = db.query(Document).filter(
        Document.id_utilisateur == id_utilisateur,
        Document.deleted_at.is_(None),
    )
    if id_categorie is not None:
        base_query = base_query.filter(Document.id_categorie == id_categorie)

    # Total : pour la pagination cote front
    total = base_query.count()

    # La page demandee
    documents = (base_query
                 .options(selectinload(Document.versions), selectinload(Document.tags))
                 .order_by(Document.date_creation.desc())
                 .offset(offset)
                 .limit(size)
                 .all())

    items = []
    for doc in documents:
        latest = max(doc.versions, key=lambda v: v.numero) if doc.versions else None
        items.append(_to_document_read(document=doc, version=latest))

    return DocumentListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
    )


def get_document(db: Session,
                 document_id: int,
                 id_utilisateur: int,
                 include_deleted: bool = False) -> Document | None:
    query = (
        db.query(Document)
        .options(selectinload(Document.tags), selectinload(Document.versions))
        .filter(Document.id == document_id)
        .filter(Document.id_utilisateur == id_utilisateur)
    )
    if not include_deleted:
        query = query.filter(Document.deleted_at.is_(None))
    return query.first()

def get_document_detail(db: Session,
                        document_id: int,
                        id_utilisateur: int) -> DocumentReadDetail | None:
    
    document= get_document(db,document_id,id_utilisateur=id_utilisateur)
    if not document:
        return None
    version = get_latest_version(db,document_id)
    
     
    document_detail = DocumentReadDetail(
        id=document.id,
        titre=document.titre,
        auteur=document.auteur,
        date_creation=document.date_creation,
        type_fichier=version.type_fichier,
        id_categorie=document.id_categorie,
        tags=document.tags,
        date_upload=version.date_upload,
        apercu_contenu=version.contenu[:500],
        resume_llm=version.resume_llm,
        numero_version=version.numero,
    )

    return document_detail

def patch_document(db: Session,
                   document_id: int,
                   id_utilisateur: int,
                   auteur: str | None = None,
                   titre: str | None = None,
                   id_categorie: int | None = None) -> DocumentRead | None:
    document = get_document(db,
                            document_id,
                            id_utilisateur=id_utilisateur)
    if not document:
        return None
    if auteur is not None:
        document.auteur = auteur
    if titre is not None:
        document.titre = titre
    if id_categorie is not None:
        # On verifie que la categorie cible existe ET appartient bien a l'user
        categorie = db.query(Categorie).filter(
            Categorie.id == id_categorie,
            Categorie.id_utilisateur == id_utilisateur,
        ).first()
        if not categorie:
            raise HTTPException(status_code=404, detail="Categorie introuvable")
        document.id_categorie = id_categorie

    db.commit()
    db.refresh(document)
    v = get_latest_version(db=db, document_id=document.id)

    return _to_document_read(document, v)


def mettre_corbeille(db: Session,
                     document_id: int,
                     id_utilisateur: int) -> bool:

    document = get_document(db=db,
                            document_id=document_id,
                            id_utilisateur=id_utilisateur)
    if not document:
        return False
    document.deleted_at = datetime.now(timezone.utc)
    document.id_categorie = None
    db.commit()
    return True


def list_corbeille(db: Session,
                   id_utilisateur: int,
                   page: int = 1,
                   size: int = 20) -> DocumentListResponse:
    offset = (page - 1) * size

    base_query = db.query(Document).filter(
        Document.id_utilisateur == id_utilisateur,
        Document.deleted_at.is_not(None),
    )

    total = base_query.count()

    documents = (base_query
                 .options(selectinload(Document.versions), selectinload(Document.tags))
                 .order_by(Document.deleted_at.desc())
                 .offset(offset)
                 .limit(size)
                 .all())

    items = []
    for doc in documents:
        latest = max(doc.versions, key=lambda v: v.numero) if doc.versions else None
        items.append(_to_document_read(document=doc, version=latest))

    return DocumentListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
    )


def restaurer_document(db: Session,
                       document_id: int,
                       id_utilisateur: int) -> bool:
    document = get_document(db=db,
                            document_id=document_id,
                            id_utilisateur=id_utilisateur,
                            include_deleted=True)
    if not document or document.deleted_at is None:
        return False
    document.deleted_at = None
    db.commit()
    return True


def delete_definitif(db: Session,
                     document_id: int,
                     id_utilisateur: int) -> bool:
    document = get_document(db=db,
                            document_id=document_id,
                            id_utilisateur=id_utilisateur,
                            include_deleted=True)
    if not document:
        return False

    # Supprimer les fichiers physiques de toutes les versions
    for version in document.versions:
        chemin = STORAGE_DIR / version.storage_fichier
        if chemin.exists():
            chemin.unlink()

    db.delete(document)
    db.commit()
    return True


def vider_corbeille(db: Session, id_utilisateur: int) -> int:
    documents = (
        db.query(Document)
        .options(selectinload(Document.versions))
        .filter(
            Document.id_utilisateur == id_utilisateur,
            Document.deleted_at.is_not(None),
        )
        .all()
    )

    count = 0
    for document in documents:
        for version in document.versions:
            chemin = STORAGE_DIR / version.storage_fichier
            if chemin.exists():
                chemin.unlink()
        db.delete(document)
        count += 1

    db.commit()
    return count
    
def download_document_latest_version(db: Session,
                                     document_id:int,
                                     id_utilisateur: int) -> DocumentDownload | None:
    document= get_document(db=db,
                           document_id=document_id,
                           id_utilisateur=id_utilisateur)
    if not document:
        return None
    version = get_latest_version(db=db,document_id=document_id)
    filaname= f"{document.titre}.v{version.numero}.{version.type_fichier}"
    fichier = DocumentDownload(path=STORAGE_DIR / version.storage_fichier,filename=filaname,media_type=MIME_TYPES[version.type_fichier])

    return fichier

def _get_categorie_descendants_ids(db: Session, id_categorie: int, id_utilisateur: int) -> list[int]:
    """Retourne l'id de la catégorie + tous les ids de ses descendantes"""
    racine = db.query(Categorie).filter(
        Categorie.id == id_categorie,
        Categorie.id_utilisateur == id_utilisateur,
    ).first()
    if not racine:
        return []

    ids = [racine.id]
    a_visiter = [racine]
    while a_visiter:
        courante = a_visiter.pop() 
        for enfant in courante.enfants:
            ids.append(enfant.id)
            a_visiter.append(enfant)
    return ids

def list_auteurs(db: Session, id_utilisateur: int) -> list[str]:
    rows = (
        db.query(Document.auteur)
        .filter(Document.id_utilisateur == id_utilisateur)
        .filter(Document.deleted_at.is_(None))
        .filter(Document.auteur.is_not(None))
        .distinct()
        .order_by(Document.auteur)
        .all()
    )
    return [row[0] for row in rows]


def search_documents(
    db: Session,
    id_utilisateur: int,
    query: str | None = None,
    page: int = 1,
    size: int = 20,
    type_fichier: str | None = None,
    auteur: str | None = None,
    id_categorie: int | None = None,
    id_tags: list[int] | None = None,
    date_debut: date | None = None,
    date_fin: date | None = None,
) -> list[DocumentSearchResult]:
    aucun_critere = ( query is None
                      and type_fichier is None
                      and auteur is None
                      and id_categorie is None
                      and not id_tags
                      and date_debut is None
                      and date_fin is None)
    if aucun_critere:
       return []
    
    base_query = (
        db.query(Document)
        .join(Version, Document.id == Version.id_document)
        .filter(Document.id_utilisateur == id_utilisateur)
        .filter(Document.deleted_at.is_(None))
    )

    if type_fichier:
        base_query = base_query.filter(Version.type_fichier == type_fichier)
    if auteur:
        base_query = base_query.filter(Document.auteur == auteur)
    if id_categorie:
        ids_categorie = _get_categorie_descendants_ids(db, id_categorie, id_utilisateur)
        if not ids_categorie:
            return []
        base_query = base_query.filter(Document.id_categorie.in_(ids_categorie))
    if id_tags:
        base_query = base_query.filter(Document.tags.any(Tag.id.in_(id_tags)))
    if date_debut:
        base_query = base_query.filter(
            or_(Document.date_creation >= date_debut,
                Version.date_upload >= date_debut))
    if date_fin:
        base_query = base_query.filter(
            or_(Document.date_creation <= date_fin,
                Version.date_upload <= date_fin))

    offset = (page - 1) * size

    if query:
        tsquery = func.websearch_to_tsquery('french_unaccent', query)
        rank = func.ts_rank_cd(Version.search_vector, tsquery)
        options_headline = 'MaxWords=25, MinWords=10, StartSel=<b>, StopSel=</b>'
        func_extrait = func.ts_headline(
            'french_unaccent', Version.contenu, tsquery, options_headline
        ).label('extrait')

        rows = (
            base_query
            .add_columns(func_extrait)
            .filter(Version.search_vector.op('@@')(tsquery))
            .order_by(rank.desc())
            .offset(offset)
            .limit(size)
            .all()
        )

        resultats = []
        for document, extrait_value in rows:
            resultats.append(DocumentSearchResult(
                id=document.id,
                titre=document.titre,
                auteur=document.auteur,
                date_creation=document.date_creation,
                extrait=extrait_value,
            ))

        if not resultats:
            resultats = search_document_fallback(
                db=db,
                query=query,
                id_utilisateur=id_utilisateur,
                size=size,
                page=page,
            )
        return resultats

    rows = (
        base_query
        .distinct()
        .order_by(Document.date_creation.desc())
        .offset(offset)
        .limit(size)
        .all()
    )

    resultats = []
    for document in rows:
        resultats.append(DocumentSearchResult(
            id=document.id,
            titre=document.titre,
            auteur=document.auteur,
            date_creation=document.date_creation,
            extrait=None,
        ))
    return resultats


def search_document_fallback(db: Session,
                             query: str,
                             id_utilisateur: int,
                             size: int,
                             page: int) -> list[DocumentSearchResult]:

    offset = (page - 1) * size

    score1 = func.similarity(func.coalesce(Document.auteur, ''), query).label('score1')
    score2 = func.similarity(func.coalesce(Document.titre, ''), query).label('score2')

    rows = (
        db.query(Document, score1, score2)
        .filter(
            or_(
                func.coalesce(Document.titre, '').op('%')(query),
                func.coalesce(Document.auteur, '').op('%')(query),
            )
        )
        .filter(Document.id_utilisateur == id_utilisateur)
        .filter(Document.deleted_at.is_(None))
        .order_by((score1 + score2).desc())
        .offset(offset)
        .limit(size)
        .all()
    )

    resultats = []
    for document, _scoreA, _scoreT in rows:
        resultats.append(DocumentSearchResult(
            id=document.id,
            titre=document.titre,
            auteur=document.auteur,
            date_creation=document.date_creation,
            extrait=None,
        ))
    return resultats


def add_version(
    db: Session,
    document_id: int,
    id_utilisateur: int,
    filename: str,
    file_bytes: bytes,
) -> DocumentRead | None:
    document = get_document(db=db, document_id=document_id, id_utilisateur=id_utilisateur)
    if not document:
        return None

    latest = get_latest_version(db=db, document_id=document_id)
    nouveau_numero = (latest.numero + 1) if latest else 1

    contenu = extract_text(filename, file_bytes)
    storage_fichier, type_fichier = _save_binary(filename, file_bytes)

    version = Version(
        numero=nouveau_numero,
        contenu=contenu,
        storage_fichier=storage_fichier,
        type_fichier=type_fichier,
        id_document=document_id,
        taille_octets=len(file_bytes)
    )
    db.add(version)
    db.commit()
    db.refresh(document)

    return _to_document_read(document, version)


def list_versions(db: Session, document_id: int, id_utilisateur: int) -> list[VersionRead] | None:
    document = get_document(db=db, document_id=document_id, id_utilisateur=id_utilisateur)
    if not document:
        return None

    versions = (
        db.query(Version)
        .filter(Version.id_document == document_id)
        .order_by(Version.numero.desc())
        .all()
    )

    return [
        VersionRead(
            id=v.id,
            numero=v.numero,
            type_fichier=v.type_fichier,
            date_upload=v.date_upload,
            resume_llm=v.resume_llm,
            apercu_contenu=v.contenu[:500] if v.contenu else None,
        )
        for v in versions
    ]


def download_version(
    db: Session,
    document_id: int,
    numero: int,
    id_utilisateur: int,
) -> DocumentDownload | None:
    document = get_document(db=db, document_id=document_id, id_utilisateur=id_utilisateur)
    if not document:
        return None

    version = (
        db.query(Version)
        .filter(Version.id_document == document_id, Version.numero == numero)
        .first()
    )
    if not version:
        return None

    filename = f"{document.titre}.v{version.numero}.{version.type_fichier}"
    return DocumentDownload(
        path=STORAGE_DIR / version.storage_fichier,
        filename=filename,
        media_type=MIME_TYPES[version.type_fichier],
    )


def analyser_version(
    db: Session,
    document_id: int,
    numero: int,
    id_utilisateur: int,
) -> str | None:
    document = get_document(db=db, document_id=document_id, id_utilisateur=id_utilisateur)
    if not document:
        return None

    version = (
        db.query(Version)
        .filter(Version.id_document == document_id, Version.numero == numero)
        .first()
    )
    if not version:
        return None

    resume = llm_service.generer_resume(version.contenu)
    version.resume_llm = resume
    db.commit()
    db.refresh(version)
    return resume


def analyser_document(db: Session, document_id: int, id_utilisateur: int):
    document = get_document(db=db, document_id=document_id, id_utilisateur=id_utilisateur)
    if not document:
        return None

    version = db.query(Version).filter(
        Version.id_document == document_id
    ).order_by(Version.numero.desc()).first()

    if not version:
        return None

    resume = llm_service.generer_resume(version.contenu)
    version.resume_llm = resume
    db.commit()
    db.refresh(version)
    return resume

def resume_background(document_id: int, id_utilisateur: int):
    db = SessionLocal()
    try:
        analyser_document(db=db, document_id=document_id, id_utilisateur=id_utilisateur)
    except Exception as e:
        log_action(
            db=db,
            action="document.resume.auto",
            details=f"document_id={document_id} erreur={e}",
            id_utilisateur=id_utilisateur,
        )
    finally:
        db.close()


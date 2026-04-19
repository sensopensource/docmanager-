import os
import uuid
from pathlib import Path

from sqlalchemy.orm import Session
from sqlalchemy import func,or_

from app.models.documents import Document
from app.models.versions import Version
from app.schemas.document import DocumentCreate,DocumentReadDetail,DocumentRead,DocumentDownload,DocumentSearchResult
from app.services.extraction import extract_text
from app.models.utilisateurs import Utilisateur

STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "/app/storage/documents"))

##MAPPING HTTP 
MIME_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


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
) -> Document:
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
    )
    db.add(version)
    db.commit()
    db.refresh(document)
    return document


def get_file_path(version: Version) -> Path:
    return STORAGE_DIR / version.storage_fichier


def get_latest_version(db: Session, document_id: int) -> Version | None:
    return (
        db.query(Version)
        .filter(Version.id_document == document_id)
        .order_by(Version.numero.desc())
        .first()
    )


def list_documents(db: Session, id_utilisateur: int, page: int = 1, size: int = 20) -> list[Document]:
    offset = (page - 1) * size
    return (
        db.query(Document)
        .filter(Document.id_utilisateur == id_utilisateur)
        .order_by(Document.date_creation.desc())
        .offset(offset)
        .limit(size)
        .all()
    )


def get_document(db: Session,
                 document_id: int,
                 id_utilisateur: int) -> Document | None:
    return db.query(Document).filter(Document.id == document_id).filter(Document.id_utilisateur==id_utilisateur).first()

def get_document_detail(db: Session,
                        document_id: int,
                        id_utilisateur: int) -> DocumentReadDetail | None:
    
    document= get_document(db,document_id,id_utilisateur=id_utilisateur)
    if not document:
        return None
    version = get_latest_version(db,document_id)
    
     
    document_detail = DocumentReadDetail(
       id = document.id,
       titre = document.titre,
       auteur = document.auteur,
       date_creation=document.date_creation,
       type_fichier=version.type_fichier,
       date_upload=version.date_upload,
       apercu_contenu=version.contenu[:500],
       resume_llm=version.resume_llm,
       numero_version=version.numero    )
    
    return document_detail

def patch_document(db: Session,
                   document_id: int,
                   id_utilisateur: int,
                   auteur: str | None = None,
                   titre: str | None = None,) -> DocumentRead | None:
    document = get_document(db,
                            document_id,
                            id_utilisateur=id_utilisateur)
    if not document:
        return None
    if auteur :
        document.auteur=auteur
    if titre:
        document.titre=titre
    db.commit()
    db.refresh(document)
    return document


def delete_document(db: Session,
                    document_id: int,
                    id_utilisateur: int) -> bool:

    document = get_document(db=db,
                            document_id=document_id,
                            id_utilisateur=id_utilisateur)
    if not document:
        return False
    db.delete(document)
    db.commit()
    return True
    
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

def search_documents(
    db: Session,
    query: str,
    id_utilisateur: int,
    page: int = 1,
    size: int = 20,
) -> list[DocumentSearchResult]:
    tsquery = func.websearch_to_tsquery('french_unaccent', query)
    rank = func.ts_rank_cd(Version.search_vector, tsquery)

    options_headline = 'MaxWords=25, MinWords=10, StartSel=<b>, StopSel=</b>'
    func_extrait = func.ts_headline('french_unaccent', Version.contenu, tsquery, options_headline).label('extrait')

    offset = (page - 1) * size

    rows = (
        db.query(Document, func_extrait)
        .join(Version, Version.id_document == Document.id)
        .filter(Document.id_utilisateur == id_utilisateur)
        .filter(Version.search_vector.op('@@')(tsquery))
        .order_by(rank.desc())
        .offset(offset)
        .limit(size)
        .all()
    )

    resultats = []
    for document, extrait_value in rows:
        resultat = DocumentSearchResult(
            id=document.id,
            titre=document.titre,
            auteur=document.auteur,
            date_creation=document.date_creation,
            extrait=extrait_value,
        )
        resultats.append(resultat)

    if not resultats:
        resultats = search_document_fallback(db=db,
                                            query=query,
                                            page=page,
                                            id_utilisateur=id_utilisateur,
                                            size=size)
    return resultats
    

def search_document_fallback(db: Session,
                               query: str,
                               id_utilisateur: int,
                               size: int,
                               page: int) -> list[DocumentSearchResult]:
    
    offset=(page-1)*size

    score1 = func.similarity(func.coalesce(Document.auteur,''),query).label('score1')
    score2 = func.similarity(func.coalesce(Document.titre,''),query).label('score2')
    
    resultats = []
    rows = ( 
            db.query(Document,score1,score2)
            .filter(
                or_(
                    func.coalesce(Document.titre,'').op('%')(query),
                    func.coalesce(Document.auteur,'').op('%')(query)
                )
            )
            .filter(Document.id_utilisateur==id_utilisateur)
            .order_by((score1+score2).desc())
            .offset(offset)
            .limit(size)
            .all() 
    )

    for document,scoreA,scoreT in rows:
        resultat = DocumentSearchResult(
            id=document.id,
            titre=document.titre,
            auteur=document.auteur,
            date_creation=document.date_creation,
            extrait=None
        )
        resultats.append(resultat)
    return resultats


import os
import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.documents import Document
from app.models.versions import Version
from app.schemas.document import DocumentCreate,DocumentReadDetail,DocumentRead,DocumentDownload
from app.services.extraction import extract_text

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


def get_document(db: Session, document_id: int) -> Document | None:
    return db.query(Document).filter(Document.id == document_id).first()

def get_document_detail(db: Session, document_id: int) -> DocumentReadDetail | None:
    document= get_document(db,document_id)
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

def patch_document(db: Session,document_id: int,auteur: str | None = None,titre: str | None = None) -> DocumentRead | None:
    document = get_document(db,document_id)
    if not document:
        return None
    if auteur :
        document.auteur=auteur
    if titre:
        document.titre=titre
    db.commit()
    db.refresh(document)
    return document


def delete_document(db: Session,document_id: int) -> bool:

    document = get_document(db=db,document_id=document_id)
    if not document:
        return False
    db.delete(document)
    db.commit()
    return True
    
def download_document_latest_version(db: Session,document_id:int) -> DocumentDownload | None:
    document= get_document(db=db,document_id=document_id)
    if not document:
        return None
    version = get_latest_version(db=db,document_id=document_id)
    filaname= f"{document.titre}.v{version.numero}.{version.type_fichier}"
    fichier = DocumentDownload(path=STORAGE_DIR / version.storage_fichier,filename=filaname,media_type=MIME_TYPES[version.type_fichier])

    return fichier

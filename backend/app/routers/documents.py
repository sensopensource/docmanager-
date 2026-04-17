from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.document import DocumentCreate, DocumentRead, DocumentReadDetail,DocumentPatch
from app.services import document_service

router = APIRouter(prefix="/documents", tags=["documents"])

# TODO: id_utilisateur et id_categorie sont en dur pour l'instant
# je vais les rendres dynamiques quand l'auth et les categories seront kaynin
TEMP_USER_ID = 1
TEMP_CATEGORIE_ID = 1

# lutilisaateur envoie une requette HTTP avec ContentType multipart pr le pdf,cest pour ca qu'on passe par File() et Form()
@router.post("/", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    titre: str | None = Form(None),
    auteur: str | None = Form(None),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()
    metadata = DocumentCreate(titre=titre, auteur=auteur)
    document = document_service.create(
        db=db,
        metadata=metadata,
        filename=file.filename,
        file_bytes=file_bytes,
        id_utilisateur=TEMP_USER_ID,
        id_categorie=TEMP_CATEGORIE_ID,
    )
    return document


@router.get("/", response_model=list[DocumentRead])
def list_documents(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    documents = document_service.list_documents(
        db=db,
        id_utilisateur=TEMP_USER_ID,
        page=page,
        size=size,
    )
    return documents


@router.get("/{document_id}", response_model=DocumentReadDetail)
def get_document(document_id: int, db: Session = Depends(get_db)):
    
    
    document_detail = document_service.get_document_detail(db=db,document_id=document_id)
    if not document_detail:
        raise HTTPException(status_code=404, detail="Document non trouve")
    return document_detail
    
@router.patch("/{document_id}",response_model=DocumentRead) 
def patch_document(document_id: int,document: DocumentPatch,db: Session= Depends(get_db)):
    
    nouveau_document = document_service.patch_document(db=db,
                                                       document_id=document_id,
                                                       titre=document.titre,
                                                       auteur=document.auteur)
    if not nouveau_document:
        raise HTTPException(status_code=404,detail="Modification impossible")
    return nouveau_document
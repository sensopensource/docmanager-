from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.document import DocumentCreate, DocumentRead, DocumentReadDetail,DocumentPatch,DocumentSearchResult
from app.services import document_service, categorie_service
from app.models.categories import Categorie
from fastapi.responses import FileResponse
from app.core.dependencies import get_current_user
from app.models import Utilisateur

router = APIRouter(prefix="/documents", tags=["documents"])


# lutilisateur envoie une requette HTTP avec ContentType multipart pr le pdf,cest pour ca qu'on passe par File() et Form()
@router.post("/", response_model=DocumentRead)
async def upload_document(
    file: UploadFile = File(...),
    titre: str | None = Form(None),
    auteur: str | None = Form(None),
    id_categorie: int | None = Form(None),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_user)):

    # Si l'user n'a pas choisi de categorie, on utilise "Non classe"
    if id_categorie is None:
        default = categorie_service.get_or_create_default_categorie(
            db=db,
            id_utilisateur=current_user.id,
        )
        id_categorie = default.id
    else:
        # On verifie que la categorie existe ET appartient bien a l'user
        categorie = db.query(Categorie).filter(
            Categorie.id == id_categorie,
            Categorie.id_utilisateur == current_user.id,
        ).first()
        if not categorie:
            raise HTTPException(status_code=404, detail="Categorie introuvable")

    file_bytes = await file.read()
    metadata = DocumentCreate(titre=titre, auteur=auteur)
    document = document_service.create(
        db=db,
        metadata=metadata,
        filename=file.filename,
        file_bytes=file_bytes,
        id_utilisateur=current_user.id,
        id_categorie=id_categorie,
    )
    return document


@router.get("/", response_model=list[DocumentRead])
def list_documents(page: int = Query(1, ge=1),
                   size: int = Query(20, ge=1, le=100),
                   db: Session = Depends(get_db),
                   current_user: Utilisateur = Depends(get_current_user)):

    documents = document_service.list_documents(
        db=db,
        id_utilisateur=current_user.id,
        page=page,
        size=size,
    )
    return documents

@router.get("/search",response_model=list[DocumentSearchResult])
def search_document(query: str = Query(...,min_length=1),
                    page: int = Query(1,ge=1),
                    size: int = Query(20,ge=1,le=100),
                    db: Session = Depends(get_db),
                    current_user: Utilisateur = Depends(get_current_user)):

    resulats = document_service.search_documents(db=db,
                                                 query=query,
                                                 id_utilisateur=current_user.id,
                                                 page=page,
                                                 size=size)
    return resulats


@router.get("/{document_id}", response_model=DocumentReadDetail)
def get_document(document_id: int,
                 db: Session = Depends(get_db),
                 current_user: Utilisateur = Depends(get_current_user)):

    document_detail = document_service.get_document_detail(db=db,
                                                           document_id=document_id,
                                                           id_utilisateur=current_user.id)
    if not document_detail:
        raise HTTPException(status_code=404, detail="Document non trouve")
    return document_detail

@router.patch("/{document_id}",response_model=DocumentRead)
def patch_document(document_id: int,
                   document: DocumentPatch,
                   db: Session= Depends(get_db),
                   current_user: Utilisateur = Depends(get_current_user)):

    nouveau_document=document_service.patch_document(db=db,
                                                     document_id=document_id,
                                                     id_utilisateur=current_user.id,
                                                     titre=document.titre,
                                                     auteur=document.auteur)
    if not nouveau_document:
        raise HTTPException(status_code=404,detail="Modification impossible")
    return nouveau_document


@router.delete("/{document_id}")
def delete_document(document_id:int,
                    db: Session= Depends(get_db),
                    current_user: Utilisateur = Depends(get_current_user)):
    if not document_service.delete_document(db=db,
                                            document_id=document_id,
                                            id_utilisateur=current_user.id):
        raise HTTPException(status_code=404,detail="Document non trouve")
    else:
        return {"message": "document supprime avec succes"}



@router.get("/{document_id}/download")
def download_document(document_id: int,
                      db: Session = Depends(get_db),
                      current_user: Utilisateur = Depends(get_current_user)):

       fichier = document_service.download_document_latest_version(db=db,
                                                                   document_id=document_id,
                                                                   id_utilisateur=current_user.id)
       if not fichier:
            raise HTTPException(status_code=404,detail="Document non trouve")
       return FileResponse(path=fichier.path,filename=fichier.filename,media_type=fichier.media_type)

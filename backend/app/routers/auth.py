from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.utilisateur import Token,UtilisateurRegister,UtilisateurRead
from app.services import auth_service
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.models.utilisateurs import Utilisateur

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register",response_model=Token)
def register(
    payload: UtilisateurRegister,
    db: Session = Depends(get_db)
):
    user = auth_service.register_utilisateur(db=db,
                                             email=payload.email,
                                             password=payload.password,
                                             nom=payload.nom)
    if not user:
        raise HTTPException(status_code=409,detail="mail deja pris")
    token = create_access_token(user.id)

    return Token(access_token=token)




@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    adresse_ip = request.client.host if request.client else None

    user = auth_service.auth_utilisateur(db=db,
                                         email=form_data.username,
                                         password=form_data.password,
                                         adresse_ip=adresse_ip,
                                        )
    if not user:
        raise HTTPException(status_code=401, detail="Informations invalides")
    token = create_access_token(user_id=user.id)
    return Token(access_token=token, token_type="bearer")


@router.get("/me",response_model=UtilisateurRead)
def me(current_user: Utilisateur = Depends(get_current_user)):
    return current_user
    
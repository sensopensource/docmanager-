from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.utilisateur import Token,UtilisateurRegister
from app.services import auth_service
from app.core.security import create_access_token

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
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = auth_service.auth_utilisateur(db=db,
                                         email=form_data.username,
                                         password=form_data.password,
                                        )
    if not user:
        raise HTTPException(status_code=401, detail="Informations invalides")
    token = create_access_token(user_id=user.id)
    return Token(access_token=token, token_type="bearer")

from sqlalchemy.orm import Session
from fastapi import Depends,HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.models import Utilisateur
from app.core.security import decode_access_token
from app.database import get_db

auth_scheme=OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(db: Session = Depends(get_db),
                     token: str = Depends(auth_scheme),
                     ) -> Utilisateur | None:
    user_id = decode_access_token(token=token)
    if not user_id:
        raise HTTPException(status_code=401,detail="Invalide")
    utilisateur = db.query(Utilisateur).filter(Utilisateur.id==user_id).first()
    if not utilisateur:
        raise HTTPException(status_code=401,detail="Invalide")

    return utilisateur
from sqlalchemy.orm import Session
from fastapi import Depends
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
        return None
    utilisateur = db.query(Utilisateur).filter(Utilisateur.id==user_id).first()
    if not utilisateur:
        return None
    return utilisateur
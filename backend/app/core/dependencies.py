from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from app.models import Utilisateur
from app.core.security import decode_access_token
from app.database import get_db

# auto_error=False : si pas de token, on recoit None au lieu d'une exception 401 automatique
auth_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def get_current_user(db: Session = Depends(get_db),
                     token: str | None = Depends(auth_scheme),
                     ) -> Utilisateur | None:
    if not token:
        return None
    user_id = decode_access_token(token=token)
    if not user_id:
        return None
    utilisateur = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
    return utilisateur


def require_user(utilisateur: Utilisateur | None = Depends(get_current_user)) -> Utilisateur:
    if not utilisateur:
        raise HTTPException(status_code=401, detail="Non authentifie")
    return utilisateur

def require_admin(utilisateur: Utilisateur | None = Depends(get_current_user)) -> Utilisateur:
    if not utilisateur:
        raise HTTPException(status_code=401, detail="Non authentifie")
    if utilisateur.role != "admin":
        raise HTTPException(status_code=403, detail="Acces refuse")
    return utilisateur


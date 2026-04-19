from app.schemas.utilisateur import UtilisateurLogin,Token
from app.core.security import verify_password,hash_password
from app.models.utilisateurs import Utilisateur
from sqlalchemy.orm import Session

def register_utilisateur(db: Session,
                         nom: str,
                         email: str,
                         password: str,
                         role: str = "user"
                         ) -> Utilisateur :

    mail_existe = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if mail_existe:
        return None

    hash = hash_password(password=password)

    new_user = Utilisateur(
                   nom=nom,
                   email=email,
                   mot_de_passe_hash=hash,
                   role=role,
                )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

    
    
    



def auth_utilisateur(db: Session,
                     email: str,
                     password: str) -> Utilisateur | None:
    user = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.mot_de_passe_hash):
        return None
    return user



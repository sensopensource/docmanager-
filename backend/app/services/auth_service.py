from app.core.security import verify_password, hash_password
from app.models.utilisateurs import Utilisateur
from sqlalchemy.orm import Session
from app.models.logs import Log


def _log_action(
    db: Session,
    id_utilisateur: int | None,
    action: str,
    details: str,
    adresse_ip: str | None,
) -> None:
    log = Log(
        id_utilisateur=id_utilisateur,
        action=action,
        details=details,
        adresse_ip=adresse_ip or "unknown",
    )
    db.add(log)
    db.commit()


def register_utilisateur(db: Session,
                         nom: str,
                         email: str,
                         password: str,
                         role: str = "user"
                         ) -> Utilisateur | None:

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
                     password: str,
                     adresse_ip: str | None = None) -> Utilisateur | None:
    user = db.query(Utilisateur).filter(Utilisateur.email == email).first()

    if not user:
        # Email inconnu : on logue avec id_utilisateur=None
        _log_action(
            db=db,
            id_utilisateur=None,
            action="login_failed",
            details=f"Email inconnu : {email}",
            adresse_ip=adresse_ip,
        )
        return None

    if not verify_password(password, user.mot_de_passe_hash):
        _log_action(
            db=db,
            id_utilisateur=user.id,
            action="login_failed",
            details="Mot de passe incorrect",
            adresse_ip=adresse_ip,
        )
        return None

    _log_action(
        db=db,
        id_utilisateur=user.id,
        action="login_success",
        details="Connexion reussie",
        adresse_ip=adresse_ip,
    )

    return user

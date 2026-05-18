from app.database import Base
from sqlalchemy import Column, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB


class PreferenceUtilisateurDashboard(Base):

    __tablename__ = "preferences_utilisateur_dashboard"

    id_utilisateur = Column(Integer, ForeignKey('utilisateurs.id'), primary_key=True)
    layout = Column(JSONB, nullable=False)
    maj_le = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

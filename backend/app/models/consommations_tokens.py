from app.database import Base
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func


class ConsommationTokens(Base):

    __tablename__ = "consommations_tokens"

    id = Column(Integer, primary_key=True)
    id_utilisateur = Column(Integer, ForeignKey('utilisateurs.id'), nullable=False)
    source = Column(Text, nullable=False)
    modele = Column(Text, nullable=False)
    tokens_in = Column(Integer, nullable=False)
    tokens_out = Column(Integer, nullable=False)
    latence_ms = Column(Integer, nullable=False)
    statut = Column(Text, nullable=False)
    message_erreur = Column(Text, nullable=True)
    cree_le = Column(DateTime(timezone=True), server_default=func.now())

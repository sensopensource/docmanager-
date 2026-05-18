from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from app.database import Base
from sqlalchemy.sql import func 



class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True)
    role = Column(Text, nullable = False)
    nom = Column(Text,nullable = False)
    email = Column(Text, nullable = False)
    mot_de_passe_hash = Column(Text, nullable = False)
    date_inscription = Column(DateTime(timezone=True),server_default=func.now())
    
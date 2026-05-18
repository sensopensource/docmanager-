from app.database import Base
from sqlalchemy import Column, Integer, BigInteger, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class Version(Base):

    __tablename__ = "versions" 

    id = Column(Integer, primary_key=True)
    numero = Column(Integer, nullable=False)
    contenu = Column(Text, nullable=False)
    storage_fichier = Column(Text, nullable=False, unique=True)
    type_fichier = Column(Text,nullable =False)
    search_vector = Column(TSVECTOR)
    resume_llm = Column(Text,nullable=True)
    date_upload = Column(DateTime(timezone=True),server_default=func.now())
    id_document = Column(Integer, ForeignKey('documents.id'), nullable = False)
    taille_octets = Column(BigInteger, nullable=False)

    document = relationship("Document",back_populates="versions")

from sqlalchemy import Column, Integer, Text, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import declarative_base 
from sqlalchemy.sql import func 


Base = declarative_base()

class Document(Base):
    __tablename__= "documents"

    id = Column(Integer, primary_key=True)
    titre = Column(Text, nullable=False)
    auteur = Column(Text)
    date_upload = Column(DateTime(timezone=True), server_default=func.now())
    type_fichier = Column(Text, nullable=False)
    tags = Column(ARRAY(Text))
    contenu = Column(Text, nullable=False)
    search_vector = Column(TSVECTOR) 



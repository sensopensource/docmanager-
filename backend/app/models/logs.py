from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from app.database import Base
from sqlalchemy.sql import func

class Log(Base):
    __tablename__="logs"

    id=Column(Integer,primary_key=True)
    id_utilisateur = Column(Integer,ForeignKey('utilisateurs.id'),nullable=True)
    action=Column(Text,nullable=False)
    details=Column(Text,nullable=False)
    adresse_ip=Column(Text,nullable=False)
    date_action=Column(DateTime(timezone=True),server_default=func.now())






    
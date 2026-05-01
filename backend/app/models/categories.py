from sqlalchemy import Column, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Categorie(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    nom = Column(Text, nullable=False)
    id_parent = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"))
    id_utilisateur = Column(Integer, ForeignKey("utilisateurs.id"), nullable=False)

    # Relation auto-référente : enfants d'une catégorie
    enfants = relationship(
        "Categorie",
        backref="parent",
        remote_side=[id],
        cascade="all, delete",
    )

    __table_args__ = (
        UniqueConstraint("nom", "id_utilisateur", "id_parent", name="unique_cat_nom_user_parent"),
    )

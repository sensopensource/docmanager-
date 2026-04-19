from pydantic import BaseModel,EmailStr


class UtilisateurRegister(BaseModel):
    email: EmailStr
    password: str
    nom: str


class UtilisateurLogin(BaseModel):
    email: EmailStr
    password: str
    
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
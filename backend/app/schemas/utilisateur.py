from pydantic import BaseModel,EmailStr,ConfigDict


class UtilisateurRegister(BaseModel):
    email: EmailStr
    password: str
    nom: str


class UtilisateurLogin(BaseModel):

    email: EmailStr
    password: str

class UtilisateurRead(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    email: EmailStr
    nom: str
    role: str
    id: int
    

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
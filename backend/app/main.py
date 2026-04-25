from fastapi import FastAPI
from app.database import SessionLocal
from sqlalchemy import text 
from app.routers import documents,auth,categories
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:5173"], #pour autoriser le front
    allow_credentials=True, # pour autoriser lenvoie des JWT 
    allow_methods=["*"], #pour autoriser toutes les methodes de CRUD 
    allow_headers=["*"] #pour autoiser tout les types de headers comme Content-Type etc
)


app.include_router(documents.router)
app.include_router(auth.router)
app.include_router(categories.router)



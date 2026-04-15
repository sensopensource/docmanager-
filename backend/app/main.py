from fastapi import FastAPI
from app.database import SessionLocal
from sqlalchemy import text 

app = FastAPI()

@app.get("/health")
def health():
    return {"Status", "ok"}

@app.get("/db-check")
def db_check():
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT 1")).scalar()
        return {"db": "connected", "result": result}
    finally:
        db.close()

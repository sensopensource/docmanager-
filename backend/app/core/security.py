import bcrypt
from datetime import datetime,timedelta,timezone
from jose import jwt,JWTError
from app.core import config

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(),bcrypt.gensalt()).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
   return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=config.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "exp": expire,
    }
    token=jwt.encode(payload,config.JWT_SECRET_KEY,algorithm=config.JWT_ALGORITHM)
    return token

def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token,config.JWT_SECRET_KEY,algorithms=[config.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except JWTError:
        return None
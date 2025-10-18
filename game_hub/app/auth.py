from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from . import models, schemas
from .database import get_db
import os
from dotenv import load_dotenv
import hashlib

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# Fix bcrypt compatibility issue
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
security = HTTPBearer()

def verify_password(plain_password, hashed_password):
    """Enhanced password verification with consistent fallback"""
    print(f"🔍 DEBUG: Verifying password")
    print(f"   Plain password: '{plain_password}'")
    print(f"   Hashed password: '{hashed_password[:50]}...' (length: {len(hashed_password)})")
    
    # Check if this is a SHA256 hash (64 characters, all hex)
    if len(hashed_password) == 64 and all(c in '0123456789abcdef' for c in hashed_password):
        print("   📝 Detected SHA256 hash, using SHA256 verification")
        sha256_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        result = sha256_hash == hashed_password
        print(f"   ✅ SHA256 verification result: {result}")
        return result
    
    # Otherwise use bcrypt
    try:
        if len(plain_password.encode('utf-8')) > 72:
            plain_password = plain_password[:72]
            print(f"   ✂️  Truncated password")
        
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"   ✅ bcrypt verification result: {result}")
        return result
    except Exception as e:
        print(f"   ❌ bcrypt verification error: {e}")
        
        # Fallback to SHA256 if bcrypt fails
        print("   🔄 Falling back to SHA256 verification")
        sha256_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        result = sha256_hash == hashed_password
        print(f"   ✅ SHA256 fallback result: {result}")
        return result

def get_password_hash(password):
    """Enhanced password hashing with consistent fallback"""
    print(f"🔐 DEBUG: Hashing password")
    print(f"   Original password: '{password}'")
    
    try:
        if len(password.encode('utf-8')) > 72:
            password = password[:72]
            print(f"   ✂️  Truncated password")
        
        hashed = pwd_context.hash(password)
        print(f"   🔒 Generated bcrypt hash: '{hashed[:50]}...' (length: {len(hashed)})")
        return hashed
    except Exception as e:
        print(f"   ❌ bcrypt hashing error: {e}")
        
        # Consistent fallback to SHA256
        print("   🔄 Falling back to SHA256 hashing")
        sha256_hash = hashlib.sha256(password.encode()).hexdigest()
        print(f"   🔒 Generated SHA256 hash: '{sha256_hash}' (length: {len(sha256_hash)})")
        return sha256_hash

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not isinstance(email, str):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return token_data

def get_current_user(token_data: schemas.TokenData = Depends(verify_token), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    return user

def authenticate_user(db: Session, email: str, password: str):
    """Enhanced authentication with debugging"""
    print(f"🔑 DEBUG: Authenticating user")
    print(f"   Email: '{email}'")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        print(f"   ❌ User not found")
        return False
    
    print(f"   ✅ User found: {user.name} ({user.email})")
    
    if not verify_password(password, user.hashed_password):
        print(f"   ❌ Password verification failed")
        return False
    
    print(f"   ✅ Authentication successful")
    return user

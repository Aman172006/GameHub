from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter()

@router.get("/events", response_model=List[schemas.Event])
def get_events(db: Session = Depends(get_db)):
    events = db.query(models.Event).filter(models.Event.is_active.is_(True)).all()
    return events

@router.get("/events/my-events", response_model=List[schemas.Event])
def get_my_events(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if getattr(current_user, "role", None) != "organizer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    events = db.query(models.Event).filter(models.Event.organizer_id == current_user.id).all()
    return events

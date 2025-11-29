# main.py (Updated backend with join loading for event, organizer and registrations)

from fastapi import FastAPI, Depends, HTTPException, status, Body, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm
from typing import List

from .database import engine, Base, get_db
from . import models, schemas, auth
from .routers import users, events, registrations


# Create tables in DB
Base.metadata.create_all(bind=engine)
print("Database tables created successfully!")

app = FastAPI(
    title="Game Registration System",
    description="An online system for managing game event registrations",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(events.router)
app.include_router(registrations.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Game Registration System API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ----- Authentication -----

@app.post("/test/register-user", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/test/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": user.email}, expires_delta=expires)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }


@app.get("/auth/validate")
def validate_token(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "valid": True,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        }
    }


# ----- Event Details -----

from sqlalchemy.orm import joinedload

@app.get("/events/{event_id}", response_model=schemas.Event)
def get_event_details(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event)\
        .options(joinedload(models.Event.organizer))\
        .filter(models.Event.id == event_id)\
        .first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.get("/events/{event_id}/registrations")
def get_event_registrations(event_id: int, db: Session = Depends(get_db)):
    registrations = db.query(models.Registration)\
        .options(joinedload(models.Registration.user))\
        .filter(models.Registration.event_id == event_id).all()

    # Add user name dynamically for frontend use
    result = []
    for reg in registrations:
        reg_dict = reg.__dict__
        reg_dict['user_name'] = reg.user.name if reg.user else "Anonymous Player"
        result.append(reg_dict)
    return result


@app.get("/events/{event_id}/feedback")
def get_event_feedback(event_id: int, db: Session = Depends(get_db)):
    feedbacks = db.query(models.Feedback)\
        .options(joinedload(models.Feedback.user))\
        .filter(models.Feedback.event_id == event_id).all()

    result = []
    for fb in feedbacks:
        fb_dict = fb.__dict__
        fb_dict['user_name'] = fb.user.name if fb.user else "Anonymous"
        result.append(fb_dict)
    return result


@app.post("/test/create-event", response_model=schemas.Event)
def create_event(
        event: schemas.EventCreate,
        current_user: models.User = Depends(auth.get_current_user),
        db: Session = Depends(get_db)):
    if current_user.role not in ["organizer", "admin"]:
        raise HTTPException(status_code=403, detail="Only organizers can create events")
    
    db_event = models.Event(**event.dict(), organizer_id=current_user.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

# The rest of your endpoints (like events listing/creating, registrations, feedback posting, sample data) remain unchanged but ensure your models define relationships to User as shown.





@app.post("/test/register-event", response_model=schemas.Registration)
def register_for_event(
    registration: schemas.RegistrationCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(models.Event).filter(models.Event.id == registration.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.max_participants <= 0:
        raise HTTPException(status_code=400, detail="No slots available for this event")

    existing_reg = db.query(models.Registration).filter(
        models.Registration.user_id == current_user.id,
        models.Registration.event_id == registration.event_id,
        models.Registration.status == "registered"
    ).first()
    if existing_reg:
        raise HTTPException(status_code=400, detail="Already registered for this event")

    db_registration = models.Registration(
        user_id=current_user.id,
        event_id=registration.event_id
    )
    db.add(db_registration)

    db.query(models.Event).filter(models.Event.id == event.id).update(
        {"max_participants": models.Event.max_participants - 1}
    )

    db.commit()
    db.refresh(db_registration)
    return db_registration


@app.get("/registrations/my-registrations")
def get_my_registrations(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    registrations = db.query(models.Registration).filter(models.Registration.user_id == current_user.id).all()
    return registrations


@app.post("/test/add-feedback", response_model=schemas.Feedback)
def add_feedback(feedback: schemas.FeedbackCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == feedback.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db_feedback = models.Feedback(
        user_id=current_user.id,
        event_id=feedback.event_id,
        rating=feedback.rating,
        comments=feedback.comments
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


@app.post("/test/create-sample-data")
def create_sample_data(db: Session = Depends(get_db)):
    existing_organizer = db.query(models.User).filter(models.User.email == "organizer@test.com").first()
    if existing_organizer:
        return {"message": "Sample data already exists"}

    organizer = models.User(
        name="Test Organizer",
        email="organizer@test.com",
        hashed_password=auth.get_password_hash("password123"),
        role="organizer"
    )
    db.add(organizer)
    db.commit()
    db.refresh(organizer)

    player = models.User(
        name="Test Player",
        email="player@test.com",
        hashed_password=auth.get_password_hash("password123"),
        role="player"
    )
    db.add(player)
    db.commit()
    db.refresh(player)

    event = models.Event(
        title="Sample Gaming Tournament",
        description="Test tournament for gaming enthusiasts",
        category="esports",
        date="2025-11-15",
        time="18:00",
        location="Test Gaming Arena",
        max_participants=50,
        organizer_id=organizer.id
    )
    db.add(event)
    db.commit()

    return {
        "message": "Sample data created successfully",
        "organizer_email": organizer.email,
        "player_email": player.email,
        "password": "password123"
    }
@app.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    
    if current_user.role not in ["organizer", "admin"]:
        raise HTTPException(status_code=403, detail="Only organizers can delete events")
    
    # Get the event
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user.role != "admin" and event.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own events")
    
    try:
        db.query(models.Registration).filter(models.Registration.event_id == event_id).delete()
        db.query(models.Feedback).filter(models.Feedback.event_id == event_id).delete()
        
        # Delete the event
        db.delete(event)
        db.commit()
        
        return {"message": "Event deleted successfully", "event_id": event_id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete event: {str(e)}")


@app.get('/pages/organizer/dashboard.html')
def orgdash() :
    return 'Hello'
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "player"

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    # Profile fields
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None

    # Gaming profile fields
    gamer_tag: Optional[str] = None
    skill_level: Optional[str] = None
    gaming_platform: Optional[str] = None
    favorite_genre: Optional[str] = None
    favorite_games: Optional[str] = None
    steam_profile: Optional[str] = None
    discord_username: Optional[str] = None
    gaming_achievements: Optional[str] = None

    # Preferences
    event_reminders: Optional[bool] = True
    new_events_notifications: Optional[bool] = True
    marketing_emails: Optional[bool] = False
    public_profile: Optional[bool] = True
    show_online_status: Optional[bool] = True
    show_gaming_stats: Optional[bool] = True

    class Config:
        from_attributes = True

# Profile Update Schema
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    gamer_tag: Optional[str] = None
    skill_level: Optional[str] = None
    gaming_platform: Optional[str] = None
    favorite_genre: Optional[str] = None
    favorite_games: Optional[str] = None
    steam_profile: Optional[str] = None
    discord_username: Optional[str] = None
    gaming_achievements: Optional[str] = None
    event_reminders: Optional[bool] = None
    new_events_notifications: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    public_profile: Optional[bool] = None
    show_online_status: Optional[bool] = None
    show_gaming_stats: Optional[bool] = None

# Event Schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    date: str
    time: str
    location: str
    max_participants: int = 100

class EventCreate(EventBase):
    pass

class EventUpdate(EventBase):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None

class Event(EventBase):
    id: int
    organizer_id: int
    is_active: bool
    created_at: datetime
    organizer: User
    
    class Config:
        from_attributes = True

# Registration Schemas
class RegistrationBase(BaseModel):
    event_id: int

class RegistrationCreate(RegistrationBase):
    pass

class Registration(RegistrationBase):
    id: int
    user_id: int
    status: str
    registered_at: datetime
    event: Event
    
    class Config:
        from_attributes = True

# Feedback Schemas
class FeedbackBase(BaseModel):
    event_id: int
    rating: int
    comments: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class Feedback(FeedbackBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth Schemas
# Update schemas.py
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None  # Add this line

# Or create a new schema if you prefer
class TokenWithUser(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    email: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

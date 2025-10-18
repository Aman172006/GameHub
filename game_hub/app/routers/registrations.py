from fastapi import APIRouter

router = APIRouter()

@router.get("/registrations")
def get_registrations():
    return {"registrations": []}

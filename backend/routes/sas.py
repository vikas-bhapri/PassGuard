from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from controllers import storage
from schemas import schema
from controllers.login import validate_user
from models.model import User

router = APIRouter(
    prefix="/storage",
    tags=["Storage"]
)


@router.post("/profile-upload", status_code=status.HTTP_200_OK, response_model=schema.ProfileUploadSASResponse)
async def generate_profile_upload_sas(request: schema.ProfileUploadSASRequest, db: Session = Depends(get_db), current_user=Depends(validate_user)):
    try:
        result = await storage._generate_blob_sas(request, current_user["sub"])
        user = db.query(User).filter(
            User.username == current_user["sub"]).first()
        old_image_url = user.image_url if user else None

        if old_image_url and old_image_url != result["sas_url"].split("?")[0]:
            await storage.delete_blob(old_image_url)

        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/profile-read", status_code=status.HTTP_200_OK)
def generate_profile_read_sas(db: Session = Depends(get_db), current_user=Depends(validate_user)):
    try:
        return storage._generate_read_sas(current_user["sub"], db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/service-upload", status_code=status.HTTP_200_OK)
async def generate_service_upload_sas(request: schema.ServiceUploadSASRequest, db: Session = Depends(get_db), current_user=Depends(validate_user)):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can upload service images")

    try:
        return storage.generate_service_image_upload(request)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

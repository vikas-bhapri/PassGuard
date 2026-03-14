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
        user = db.query(User).filter(User.username == current_user["sub"]).first()
        old_image_url = user.image_url if user else None

        if old_image_url and old_image_url != result["sas_url"].split("?")[0]:
            await storage.delete_blob(old_image_url)
            
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

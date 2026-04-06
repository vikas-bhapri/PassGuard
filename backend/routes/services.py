from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from schemas.schema import CreateServiceRequest, ServiceResponse
from core.database import get_db
from controllers import service
from .auth import validate_user
from uuid import UUID

router = APIRouter(
    prefix="/services",
    tags=["Services"]
)


@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(request: CreateServiceRequest, db: Session = Depends(get_db), user: UUID = Depends(validate_user)):
    return service.create_service(db, request, user["role"])


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(service_id: UUID, db: Session = Depends(get_db), user: UUID = Depends(validate_user)):
    service.delete_service(db, service_id, user["role"])
    return None


@router.get("/", response_model=list[ServiceResponse], status_code=status.HTTP_200_OK)
async def get_all_services(db: Session = Depends(get_db), user: UUID = Depends(validate_user)):
    return service.get_all_services(db)

@router.get("/images")
async def get_service_images(db: Session = Depends(get_db)):
    return service.get_all_images(db)

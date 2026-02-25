from models.model import Services
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from schemas.schema import CreateServiceRequest, ServiceResponse
from uuid import UUID


def create_service(db: Session, request: CreateServiceRequest, user_id: UUID):
    new_service = Services(
        name=request.name,
        image_url=request.image_url
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service


def delete_service(db: Session, service_id: UUID, user_id: UUID):
    service = db.query(Services).filter(Services.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    db.delete(service)
    db.commit()


def get_all_services(db: Session):
    return db.query(Services).all()

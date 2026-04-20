from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, Generic, TypeVar, Any


class Response(BaseModel):
    status: str = Field(...,
                        description="Status of the response, e.g., 'success' or 'error'")
    data: Optional[Any] = Field(
        None, description="Optional data returned in the response")
    message: Optional[str] = Field(
        None, description="Optional message providing additional information")


class ToDoItem(BaseModel):
    id: UUID
    title: str
    description: str
    complete_by: datetime
    is_completed: bool

    class Config:
        from_attributes = True


class ToDoItemCreate(BaseModel):
    title: str
    description: str
    complete_by: datetime

    class Config:
        from_attributes = True


class ToDoItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    complete_by: Optional[datetime] = None

    class Config:
        from_attributes = True


class ToDoListResponse(Response):
    """Response model for list of todo items"""
    data: Optional[list[ToDoItem]] = None


class ToDoItemResponse(Response):
    """Response model for single todo item"""
    data: Optional[ToDoItem] = None

from fastapi import APIRouter, Depends, status
from models.model import ToDoList
from core.database import get_db
from sqlalchemy.orm import Session
from controllers.login import validate_user
from uuid import UUID
from controllers import todo as todo_controller
from schemas import todo as todo_schema

router = APIRouter(
    prefix="/todo",
    tags=["ToDo"]
)


@router.get("/", response_model=todo_schema.ToDoListResponse)
async def get_user_todo_list(page: int | None = None, limit: int | None = None, sort: str | None = None, date: str | None = None, is_completed: bool | None = None, db: Session = Depends(get_db), user_id: dict = Depends(validate_user)):
    return await todo_controller.get_user_todo_list(db, user_id["uid"], page, limit, sort, date, is_completed)


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=todo_schema.ToDoItemResponse)
def create_todo_item(todo_item: todo_schema.ToDoItemCreate, db: Session = Depends(get_db), user_id: dict = Depends(validate_user)):
    return todo_controller.create_todo_item(db, user_id["uid"], todo_item)


@router.patch("/{todo_id}", status_code=status.HTTP_200_OK, response_model=todo_schema.ToDoItemResponse)
def update_todo_item(todo_id: UUID, todo_update: todo_schema.ToDoItemUpdate, db: Session = Depends(get_db), user_id: dict = Depends(validate_user)):
    return todo_controller.update_todo_item(db, user_id["uid"], todo_id, todo_update)


@router.delete("/{todo_id}", status_code=status.HTTP_200_OK, response_model=todo_schema.Response)
def delete_todo_item(todo_id: UUID, db: Session = Depends(get_db), user_id: dict = Depends(validate_user)):
    return todo_controller.delete_todo_item(db, user_id["uid"], todo_id)


@router.get("/{todo_id}", status_code=status.HTTP_200_OK, response_model=todo_schema.ToDoItemResponse)
def get_todo_item(todo_id: UUID, db: Session = Depends(get_db), user_id: dict = Depends(validate_user)):
    return todo_controller.get_todo_item(db, user_id["uid"], todo_id)

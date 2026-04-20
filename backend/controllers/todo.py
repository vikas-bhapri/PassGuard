from datetime import datetime
from models.model import ToDoList, User
from core.database import get_db
from sqlalchemy.orm import Session
from schemas import todo
from fastapi import HTTPException, status
from uuid import UUID


class GetToDoListParams:
    def __init__(self, page: int | None = None, limit: int | None = None,
                 sort: str | None = None, date: str | None = None, is_completed: bool | None = None):
        errors = []

        # Validate page
        if page is not None and page < 1:
            errors.append({
                "field": "page",
                "message": "Page must be a positive integer",
                "type": "value_error"
            })

        # Validate limit
        if limit is not None and limit < 1:
            errors.append({
                "field": "limit",
                "message": "Limit must be a positive integer",
                "type": "value_error"
            })

        # Validate sort
        if sort is not None and sort not in {"asc", "desc"}:
            errors.append({
                "field": "sort",
                "message": "Sort must be 'asc' or 'desc'",
                "type": "value_error"
            })

        # Validate and parse date
        parsed_date = None
        if date is not None:
            try:
                parsed_date = datetime.fromisoformat(
                    date.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                errors.append({
                    "field": "date",
                    "message": "Date must be a valid ISO 8601 datetime string",
                    "type": "type_error"
                })

        if is_completed is not None and type(is_completed) is not bool:
            errors.append({
                "field": "is_completed",
                "message": "is_completed must be a bool",
                "type": "value_error"
            })

        # Raise all errors together
        if errors:
            if len(errors) == 1:
                message = f"{errors[0]['field']}: {errors[0]['message']}"
            else:
                message = f"Validation failed for {len(errors)} field(s)"

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": message, "errors": errors}
            )

        # Set validated values
        self.page = page
        self.limit = limit
        self.sort = sort
        self.date = parsed_date
        self.is_completed = is_completed

    def get_offset(self):
        if self.page is not None and self.limit is not None:
            return (self.page - 1) * self.limit
        return None

    def has_pagination(self):
        return self.page is not None and self.limit is not None

    def has_sorting(self):
        return self.sort is not None

    def apply_sorting(self, query):
        if self.sort == "asc":
            query = query.order_by(ToDoList.complete_by.asc())
        elif self.sort == "desc":
            query = query.order_by(ToDoList.complete_by.desc())
        return query

    def apply_pagination(self, query):
        if self.has_pagination():
            offset = self.get_offset()
            query = query.offset(offset).limit(self.limit)
        return query

    def apply_date_filter(self, query):
        if self.date is not None:
            query = query.filter(ToDoList.complete_by >= self.date)
        return query

    def apply_is_completed_filter(self, query):
        if self.is_completed is not None:
            query = query.filter(ToDoList.is_completed == self.is_completed)
        return query


async def get_user_todo_list(db: Session, user_id: UUID, page: int | None = None, limit: int | None = None, sort: str | None = None, date: str | None = None, is_completed: bool | None = None):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    params = GetToDoListParams(
        page=page, limit=limit, sort=sort, date=date, is_completed=is_completed)
    query = db.query(ToDoList).filter(ToDoList.user_id == user_id)
    query = params.apply_sorting(query) if params.has_sorting() else query
    query = params.apply_date_filter(
        query) if params.date is not None else query
    query = params.apply_is_completed_filter(
        query) if params.is_completed is not None else query
    query = params.apply_pagination(
        query) if params.has_pagination() else query
    todo_list = query.all()

    return {
        "status": "success",
        "data": todo_list,
        "message": None
    }


def create_todo_item(db: Session, user_id: UUID, todo_item: todo.ToDoItemCreate):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_todo = ToDoList(
        user_id=user_id,
        title=todo_item.title,
        description=todo_item.description,
        complete_by=todo_item.complete_by,
    )
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)

    return {
        "status": "success",
        "data": new_todo,
        "message": None
    }


def update_todo_item(db: Session, user_id: UUID, todo_id: UUID, todo_update: todo.ToDoItemUpdate):
    todo = db.query(ToDoList).filter(ToDoList.id == todo_id).first()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="ToDo item not found")

    if str(todo.user_id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this ToDo item")

    for key, value in todo_update.model_dump().items():
        if value is not None:
            setattr(todo, key, value)

    db.commit()
    db.refresh(todo)

    return {
        "status": "success",
        "data": todo,
        "message": None
    }


def delete_todo_item(db: Session, user_id: UUID, todo_id: UUID):
    todo = db.query(ToDoList).filter(ToDoList.id == todo_id).first()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="ToDo item not found")

    if str(todo.user_id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this ToDo item")

    db.delete(todo)
    db.commit()

    return {
        "status": "success",
        "data": None,
        "message": "ToDo item deleted successfully"
    }


def get_todo_item(db: Session, user_id: UUID, todo_id: UUID):
    todo = db.query(ToDoList).filter(ToDoList.id == todo_id).first()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="ToDo item not found")

    print(f"User ID: {user_id}, ToDo Item User ID: {todo.user_id}")

    if str(todo.user_id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this ToDo item")

    return {
        "status": "success",
        "data": todo,
        "message": None
    }

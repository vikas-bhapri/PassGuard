from fastapi import FastAPI
from config.database import engine, Base
from routes import auth, passwords

app = FastAPI(
    title="Password Manager Backend",
    description="A secure password manager backend built with FastAPI and SQLAlchemy.",
    version="0.1.0",
    root_path="/api/v1"
)

app.include_router(auth.router)
app.include_router(passwords.router)


@app.get("/")
def hello_world():
    return {"message": "Welcome to the Password Manager Backend API!"}


# Create the database tables
Base.metadata.create_all(bind=engine)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import engine, Base
from routes import auth, password, services, sas
from core.config import CONFIG
from controllers.storage import configure_storage_cors
from core.config import CONFIG


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_storage_cors()
    yield


app = FastAPI(
    title="Password Manager Backend",
    description="A secure password manager backend built with FastAPI and SQLAlchemy.",
    version="0.1.0",
    root_path="/api/v1",
    lifespan=lifespan,
    # Disable docs in production
    docs_url="/docs" if CONFIG.APP_ENV.lower() != "production" else None,
)

app.include_router(auth.router)
app.include_router(password.router)
app.include_router(services.router)
app.include_router(sas.router)


@app.get("/")
def hello_world():
    return {"message": "Welcome to the Password Manager Backend API!"}


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CONFIG.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=CONFIG.ALLOWED_METHODS,
    allow_headers=CONFIG.ALLOWED_HEADERS,
)


# Create the database tables
Base.metadata.create_all(bind=engine)

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
from core.database import engine, Base
from routes import auth, password, services, sas, to_do
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


# Custom exception handler to use "message" instead of "detail"
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Handle both string and dict detail formats
    if isinstance(exc.detail, dict):
        # Custom validation errors with structured format
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "message": exc.detail.get("message", "Validation error"),
                "data": {"errors": exc.detail.get("errors", [])}
            },
        )
    else:
        # Regular string error messages
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "message": exc.detail,
                "data": None
            },
        )


# Custom validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Collect all validation errors
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    # Create a summary message
    if len(errors) == 1:
        message = f"{errors[0]['field']}: {errors[0]['message']}"
    else:
        message = f"Validation failed for {len(errors)} field(s)"
    
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": message,
            "data": {"errors": errors}
        },
    )


app.include_router(auth.router)
app.include_router(password.router)
app.include_router(services.router)
app.include_router(sas.router)
app.include_router(to_do.router)


@app.get("/")
def hello_world():
    return {"message": "Welcome to the PassGuard Backend API!"}


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

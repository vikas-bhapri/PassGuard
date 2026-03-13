from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import CONFIG

# Get the database connection string from environment variables
# CONFIG.DATABASE_CONNECTION_STRING or "sqlite:///./test.db"
DATABASE_CONN_STRING = CONFIG.DATABASE_CONNECTION_STRING or "sqlite:///./test.db"

# Ensure that the connection string is set
if not DATABASE_CONN_STRING:
    raise ValueError("DATABASE_CONN_STRING environment variable is not set.")

# Create the SQLAlchemy engine with connection pooling settings
# These settings help prevent "server closed the connection unexpectedly" errors
engine = create_engine(
    DATABASE_CONN_STRING,
    pool_size=10,  # Maximum number of permanent connections
    max_overflow=20,  # Maximum number of temporary connections beyond pool_size
    pool_timeout=30,  # Seconds to wait before giving up on getting a connection
    pool_recycle=3600,  # Recycle connections after 1 hour to prevent stale connections
    pool_pre_ping=True,  # Verify connections before using them (prevents stale connection errors)
    echo=CONFIG.DEBUG,  # Log SQL queries when DEBUG is True
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for our models
Base = declarative_base()

# Dependency to get a database session


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

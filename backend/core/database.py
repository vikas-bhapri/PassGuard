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

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_CONN_STRING)

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

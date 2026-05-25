from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from api.config import get_settings

settings = get_settings()

connect_args = {}
if settings.postgres_sslmode.lower() != "disable":
    connect_args["sslmode"] = settings.postgres_sslmode

engine = create_engine(settings.database_url, connect_args=connect_args)
SessLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessLocal()
    try:
        yield db
    finally:
        db.close()

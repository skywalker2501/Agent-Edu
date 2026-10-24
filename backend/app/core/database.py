from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings
from app.core.logging_config import logger

# Base model for SQLAlchemy
Base = declarative_base()

# Configure Async Engine
engine_kwargs = {}
db_url = settings.effective_database_url
if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_async_engine(
    db_url,
    echo=(settings.ENVIRONMENT == "development"),
    future=True,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    """Initializes tables for development/testing if they don't exist."""
    async with engine.begin() as conn:
        logger.info("Verifying and creating database tables...")
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema initialized.")

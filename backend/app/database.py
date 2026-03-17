from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# ── Async engine ──────────────────────────────────────────────
async_engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=20,
    max_overflow=40,
    pool_timeout=60,
    pool_recycle=300,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ── Sync engine ───────────────────────────────────────────────
sync_engine = create_engine(
    settings.sync_database_url,
    echo=False,
    pool_size=20,
    max_overflow=40,
    pool_timeout=60,
    pool_recycle=300,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

def get_sync_db():
    db = SyncSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
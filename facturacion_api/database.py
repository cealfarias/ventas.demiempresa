import os
import re
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://demiempresa_online_user:qPQ3Dt6qquqpOzRKESgTGf9NjefSeISK@dpg-d9uabv6417fc7383k650-a/demiempresa_online")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Autodetect si se ejecuta dentro del entorno interno de Render
is_render = os.getenv("RENDER") == "true" or os.path.exists("/opt/render")

if is_render and "@dpg-" in DATABASE_URL:
    # Convertir el hostname externo de Render (dpg-...-a.virginia-postgres.render.com)
    # al hostname interno de red privada (dpg-...-a) para cero problemas de SSL
    DATABASE_URL = re.sub(r'(@dpg-[a-z0-9]+-[a-z0-9]+)\.[a-z0-9-]+\.render\.com', r'\1', DATABASE_URL)
    DATABASE_URL = re.sub(r'(@dpg-[a-z0-9]+-[a-z0-9]+)\.render\.com', r'\1', DATABASE_URL)

is_sqlite = DATABASE_URL.startswith("sqlite")

if not is_sqlite and "sslmode" not in DATABASE_URL and not is_render:
    delimiter = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL += f"{delimiter}sslmode=require"

connect_args = {"check_same_thread": False} if is_sqlite else {
    "keepalives": 1,
    "keepalives_idle": 30,
    "keepalives_interval": 10,
    "keepalives_count": 5
}
engine_kwargs = {"connect_args": connect_args}

if not is_sqlite:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 280,
        "pool_size": 10,
        "max_overflow": 20
    })

engine = create_engine(
    DATABASE_URL, **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

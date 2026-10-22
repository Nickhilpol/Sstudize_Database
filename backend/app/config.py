import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for the backend
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

# Load environment variables from .env if present
load_dotenv(ROOT_DIR / ".env")
load_dotenv(BASE_DIR / ".env")

# ============================================================================
# DATABASE CONNECTION CONFIGURATION
# ============================================================================
# Notice for Supabase:
# When you are ready to connect to your live Supabase database:
# 1. Uncomment the DATABASE_URL line below with your Supabase PostgreSQL URI
# 2. Comment out the SQLite DATABASE_URL line
# 3. Ensure your network can reach the Supabase host (port 5432 or 6543)
#
# EXAMPLE SUPABASE POSTGRES CONNECTION STRING:
# DATABASE_URL = "postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"
# OR Direct Connection:
# DATABASE_URL = "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
#
# CURRENT ACTIVE DEFAULT (Safe Local Embedded SQLite Database):
DEFAULT_SQLITE_PATH = (BASE_DIR / "sstudizer_dev.db").resolve()
raw_db_url = os.getenv("DATABASE_URL")

if raw_db_url and raw_db_url.startswith("sqlite:///"):
    sqlite_subpath = raw_db_url.replace("sqlite:///", "")
    if sqlite_subpath.startswith("./") or sqlite_subpath.startswith(".\\") or not Path(sqlite_subpath).is_absolute():
        cleaned_sub = sqlite_subpath.lstrip("./\\")
        resolved_file = (ROOT_DIR / cleaned_sub).resolve()
        if not resolved_file.exists():
            resolved_file = (BASE_DIR / cleaned_sub).resolve()
        DATABASE_URL = f"sqlite:///{resolved_file.as_posix()}"
    else:
        DATABASE_URL = raw_db_url
elif raw_db_url:
    DATABASE_URL = raw_db_url
else:
    DATABASE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"

# Supabase REST API credentials (Optional / Future use):
# SUPABASE_URL = os.getenv("SUPABASE_URL", "https://your-project.supabase.co")
# SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "your-service-role-key")

APP_ENV = os.getenv("APP_ENV", "development")
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")

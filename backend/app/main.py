from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import stats, subjects, chapters, tests, questions, diagnostics, audit
from app.config import APP_ENV, DEBUG, DATABASE_URL

# SAFETY GUARD:
# Only create tables on the local SQLite development database.
# When connecting to Supabase / PostgreSQL, NEVER alter or create tables automatically!
if DATABASE_URL.startswith("sqlite"):
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SStudizer Database Management API",
    description="Internal database troubleshooting and question-curation service for SStudize (sstudize.co.in)",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Enable CORS for the Node.js / React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(stats.router)
app.include_router(subjects.router)
app.include_router(chapters.router)
app.include_router(tests.router)
app.include_router(questions.router)
app.include_router(diagnostics.router)
app.include_router(audit.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SStudizer Database API",
        "environment": APP_ENV
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

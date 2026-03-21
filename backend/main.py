import logging
import random
import string
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import app_config
from core.database import create_tables
from core.settings import get_cors_origins
from api.routes import users, pets, health_analysis, admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ─── App Init ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title=app_config.PROJECT_NAME,
    version=app_config.VERSION,
    description=app_config.DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request Logging Middleware ───────────────────────────────────────────────


@app.middleware("http")
async def log_requests(request: Request, call_next):
    rid = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    logger.info(f"rid={rid} {request.method} {request.url.path}")
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000)
    logger.info(f"rid={rid} completed_in={duration_ms}ms status={response.status_code}")
    return response


# ─── Global Exception Handler ────────────────────────────────────────────────


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# ─── Lifecycle ────────────────────────────────────────────────────────────────


@app.on_event("startup")
async def startup():
    logger.info(f"Starting {app_config.PROJECT_NAME} v{app_config.VERSION}")
    create_tables()
    logger.info("Database tables verified/created")


@app.on_event("shutdown")
async def shutdown():
    logger.info(f"Shutting down {app_config.PROJECT_NAME}")


# ─── Routers ─────────────────────────────────────────────────────────────────

PREFIX = app_config.API_PREFIX

app.include_router(users.router, prefix=PREFIX)
app.include_router(pets.router, prefix=PREFIX)
app.include_router(health_analysis.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)


# ─── Health Check ─────────────────────────────────────────────────────────────


@app.get("/", tags=["Root"])
def root():
    return {
        "service": app_config.PROJECT_NAME,
        "version": app_config.VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Root"])
def health_check():
    return {"status": "healthy"}

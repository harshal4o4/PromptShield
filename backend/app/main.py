import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import (
    health,
    analyze,
    inspect,
    gateway,
    overview,
    events,
    policies,
    evaluation,
    settings as app_settings
)

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("promptshield")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure database initialized
    logger.info("Initializing PromptShield database...")
    init_db()
    logger.info("PromptShield API initialized.")
    yield
    logger.info("PromptShield API shutting down.")


app = FastAPI(
    title="PromptShield API",
    description="Local-first AI Security & Prompt Injection Defense Platform API",
    version=settings.app_version,
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers for safe, structured responses
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        msg = err.get("msg", "Invalid value")
        errors.append({"field": loc, "message": msg})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "Validation Error", "details": errors}
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    detail = exc.detail if isinstance(exc.detail, (str, dict, list)) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "HTTP Error", "detail": detail}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal Server Error", "detail": "An unexpected error occurred."}
    )


# Include API routers
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(inspect.router)
app.include_router(gateway.router)
app.include_router(overview.router)
app.include_router(events.router)
app.include_router(policies.router)
app.include_router(evaluation.router)
app.include_router(app_settings.router)

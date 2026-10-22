from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import init_db
from app.core.logging_config import logger
from app.core.exceptions import AgentEduException

# Import all API routers
from app.api.auth_routes import router as auth_router
from app.api.class_routes import router as class_router
from app.api.topic_routes import router as topic_router
from app.api.assessment_routes import router as assessment_router
from app.api.submission_routes import router as submission_router
from app.api.learner_routes import router as learner_router
from app.api.misconception_routes import router as misconception_router
from app.api.intervention_routes import router as intervention_router
from app.api.teacher_review_routes import router as teacher_review_router
from app.api.outcome_routes import router as outcome_router
from app.api.tutor_routes import router as tutor_router
from app.api.notification_routes import router as notification_router
from app.api.admin_routes import router as admin_router
from app.api.gamification_routes import router as gamification_router
from app.api.games_routes import router as games_router
from app.api.curriculum_routes import router as curriculum_router
from app.api.health_routes import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AgentEdu Backend Services...")
    await init_db()
    logger.info("AgentEdu Ready to accept connections.")
    yield
    logger.info("Shutting down AgentEdu...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "AgentEdu: A Unified Cognitive-Agent Architecture for Explainable, "
        "Teacher-Governed, Closed-Loop Personalized Education."
    ),
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local dev and Vercel preview domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized AgentEdu Exception Handler
@app.exception_handler(AgentEduException)
async def agentedu_exception_handler(request: Request, exc: AgentEduException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "error_code": exc.error_code,
            "message": exc.detail,
            "extra": exc.extra
        }
    )

# Include Routers with v1 API prefix
api_v1 = settings.API_V1_STR
app.include_router(health_router)
app.include_router(health_router, prefix=api_v1)
app.include_router(auth_router, prefix=api_v1)
app.include_router(class_router, prefix=api_v1)
app.include_router(topic_router, prefix=api_v1)
app.include_router(assessment_router, prefix=api_v1)
app.include_router(submission_router, prefix=api_v1)
app.include_router(learner_router, prefix=api_v1)
app.include_router(misconception_router, prefix=api_v1)
app.include_router(intervention_router, prefix=api_v1)
app.include_router(teacher_review_router, prefix=api_v1)
app.include_router(outcome_router, prefix=api_v1)
app.include_router(tutor_router, prefix=api_v1)
app.include_router(notification_router, prefix=api_v1)
app.include_router(admin_router, prefix=api_v1)
app.include_router(gamification_router, prefix=api_v1)
app.include_router(games_router, prefix=api_v1)
app.include_router(curriculum_router, prefix=api_v1)

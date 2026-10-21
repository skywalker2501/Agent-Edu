import logging
import sys
from app.core.config import settings

def setup_logging():
    log_level = logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Silence overly noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("aiosqlite").setLevel(logging.WARNING)
    
    logger = logging.getLogger("agentedu")
    logger.info(f"Initialized AgentEdu logging (env={settings.ENVIRONMENT}, level={log_level})")
    return logger

logger = setup_logging()

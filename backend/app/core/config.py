from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentEdu"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="development, staging, or production")
    
    # Secret Key for fallback JWTs and session tokens
    SECRET_KEY: str = Field(default="agentedu-super-secret-key-change-in-production-min-32-chars", description="JWT secret key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database Configuration (Dynamic absolute path for local dev or environment variable for Render/production)
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///agentedu.db",
        description="PostgreSQL or SQLite database connection URL"
    )
    DATABASE_SYNC_URL: str = Field(
        default="sqlite:///agentedu.db",
        description="Sync URL for migrations or sync drivers"
    )

    # Supabase Configuration
    SUPABASE_URL: Optional[str] = Field(default=None, description="Supabase project URL")
    SUPABASE_ANON_KEY: Optional[str] = Field(default=None, description="Supabase anonymous key")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = Field(default=None, description="Supabase service role key (backend only)")
    SUPABASE_JWT_SECRET: Optional[str] = Field(default=None, description="Supabase JWT secret for RS256/HS256 validation")

    # Kaggle Hub Datasets Configuration
    KAGGLE_API_TOKEN: Optional[str] = Field(
        default=None,
        description="Kaggle API token for dataset downloading"
    )

    # Ollama Local LLM Configuration (Primary inference provider for Socratic AI Tutor)
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", description="Ollama local/remote daemon URL")
    OLLAMA_MODEL: str = Field(default="llama3.2:3b", description="Default Ollama instruct model (e.g., llama3.2:3b, qwen2.5-coder:3b)")
    OLLAMA_TIMEOUT_SECONDS: int = Field(default=30, description="Request timeout for Ollama inference")

    # LLM / AI Configuration (Ollama, Google Gemini, OpenRouter & Multi-Provider Support)
    AI_PROVIDER: str = Field(default="ollama", description="ollama, gemini, openrouter, openai, anthropic, or rule_based_fallback")
    GEMINI_API_KEY: Optional[str] = Field(
        default=None,
        description="Google Gemini API key (fallback or cloud provider)"
    )
    GEMINI_MODEL: str = Field(default="gemini-3.5-flash-lite", description="Primary Google Gemini model")
    GEMINI_FALLBACK_MODEL: str = Field(default="gemini-3.8-flash", description="Fallback Google Gemini model")
    
    LLM_API_KEY: Optional[str] = Field(
        default=None,
        description="API key for LLM provider"
    )
    OPENROUTER_API_KEY: Optional[str] = Field(
        default=None,
        description="OpenRouter API key"
    )
    OPENROUTER_BASE_URL: str = Field(
        default="https://openrouter.ai/api/v1",
        description="OpenRouter API base URL"
    )
    OPENROUTER_MODELS: List[str] = Field(
        default=[
            "liquid/lfm-2.5-2.6b:free",
            "openrouter/free",
            "nvidia/nemotron-3.5-lightning:free"
        ],
        description="Models with automatic fallback on OpenRouter (max 3 allowed by OpenRouter API)"
    )
    LLM_MODEL: str = Field(default="gemini-3.5-flash-lite", description="Primary model identifier")
    AI_FALLBACK_TO_DETERMINISTIC: bool = Field(default=True, description="Fall back to deterministic rules if AI API unavailable")

    # CORS & Security
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://agentedu.vercel.app",
        "https://*.vercel.app"
    ]
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # Governance & Sandbox settings
    GOVERNANCE_CONFIDENCE_THRESHOLD: float = 0.75
    CODE_SANDBOX_ENABLED: bool = True
    CODE_SANDBOX_TIMEOUT_SECONDS: int = 5
    MAX_SUBMISSION_CODE_BYTES: int = 50000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()



from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # Google Sheets
    GOOGLE_SERVICE_ACCOUNT_JSON: str = ""
    GOOGLE_SHEET_ID: str = ""

    # CORS � comma-separated list of allowed frontend origins.
    FRONTEND_ORIGIN: str = "http://localhost:3000"
    # Optional regex for dynamic origins, e.g. Vercel preview deployments:
    #   https://ev-crm-.*-myteam\.vercel\.app
    FRONTEND_ORIGIN_REGEX: str = ""

    @property
    def cors_origins(self) -> list[str]:
        origins = [o.strip() for o in self.FRONTEND_ORIGIN.split(",") if o.strip()]
        if "http://localhost:3000" not in origins:
            origins.append("http://localhost:3000")
        # Always include production frontend
        if "https://crm-frontend-seven-mu.vercel.app" not in origins:
            origins.append("https://crm-frontend-seven-mu.vercel.app")
        return origins

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


def get_settings() -> Settings:
    return Settings()

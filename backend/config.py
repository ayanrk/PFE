import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ============================================
    # BASE DE DONNÉES MySQL
    # ============================================
    DB_USER     = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "Mbarka0101")   # ← Remplace ici si pas de .env
    DB_HOST     = os.getenv("DB_HOST", "localhost")
    DB_PORT     = os.getenv("DB_PORT", "3306")
    DB_NAME     = os.getenv("DB_NAME", "pfe_scanner")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ============================================
    # JWT
    # ============================================
    JWT_SECRET_KEY             = os.getenv("JWT_SECRET_KEY", "pfe_secret_key")
    JWT_ACCESS_TOKEN_EXPIRES   = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES  = timedelta(days=7)

    # ============================================
    # FLASK
    # ============================================
    SECRET_KEY = os.getenv("SECRET_KEY", "pfe_flask_key")
    DEBUG      = True
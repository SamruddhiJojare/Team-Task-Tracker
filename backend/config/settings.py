import os
import sys
from pathlib import Path

from mongoengine import connect


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = [host.strip() for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "tracker",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = []
WSGI_APPLICATION = "config.wsgi.application"

# Django's relational database is not used for application data. All users, teams,
# tasks, comments, invitations and activities are MongoEngine documents.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "framework.sqlite3",
    }
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["tracker.authentication.MongoJWTAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    # The project authenticates MongoEngine users, not Django ORM users.
    "UNAUTHENTICATED_USER": None,
}

JWT_ACCESS_MINUTES = int(os.getenv("JWT_ACCESS_MINUTES", "15"))
JWT_REFRESH_DAYS = int(os.getenv("JWT_REFRESH_DAYS", "7"))

MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "team_task_tracker")
MONGO_URI = os.getenv("MONGO_URI", f"mongodb://localhost:27017/{MONGO_DB_NAME}")

if "test" in sys.argv or os.getenv("USE_MOCK_DB", "false").lower() == "true":
    import mongomock

    connect(
        MONGO_DB_NAME,
        host=MONGO_URI,
        mongo_client_class=mongomock.MongoClient,
        alias="default",
        uuidRepresentation="standard",
    )
else:
    connect(
        MONGO_DB_NAME,
        host=MONGO_URI,
        alias="default",
        uuidRepresentation="standard",
        serverSelectionTimeoutMS=3000,
    )

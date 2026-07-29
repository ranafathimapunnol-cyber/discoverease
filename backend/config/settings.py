# config/settings.py - COMPLETE FIXED & OPTIMIZED WITH LIMIT-OFFSET PAGINATION

import copy
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# =============================================
# BASE CONFIGURATION
# =============================================

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-your-secret-key-here")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# =============================================
# APPLICATION DEFINITION
# =============================================

INSTALLED_APPS = [
    # Django built-in
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    
    # Third-party
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',
    
    # Local apps
    'accounts.apps.AccountsConfig',
    'activities',
    'admin_dashboard',
    'ai',
    'api',
    'destinations',
    'django_extensions',
    'guides',
    'staff',
    'suggestions',
]

# =============================================
# MIDDLEWARE
# =============================================

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'config.middleware.DisableCSRFMiddleware',  # Remove this in production!
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# =============================================
# URL & TEMPLATE CONFIGURATION
# =============================================

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# =============================================
# DATABASE (PostgreSQL)
# =============================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'discoverease'),
        'USER': os.getenv('DB_USER', 'discoverease_user'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'fullstack'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'CONN_MAX_AGE': 600,
        'TEST': {
            'NAME': 'test_discoverease',
        },
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}

# =============================================
# AUTHENTICATION & PASSWORD VALIDATION
# =============================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

AUTH_USER_MODEL = 'accounts.User'

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

# =============================================
# INTERNATIONALIZATION
# =============================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# =============================================
# STATIC & MEDIA FILES
# =============================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Only add STATICFILES_DIRS if the folder exists
STATIC_DIR = BASE_DIR / 'static'
if STATIC_DIR.exists():
    STATICFILES_DIRS = [STATIC_DIR]
else:
    STATICFILES_DIRS = []

# Media files (user uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
MEDIA_ROOT.mkdir(exist_ok=True)

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================
# CORS CONFIGURATION
# =============================================

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-session-key',
]

CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-session-key',
]

CORS_PREFLIGHT_MAX_AGE = 86400

# =============================================
# CSRF CONFIGURATION (Simplified for development)
# =============================================

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
]

# =============================================
# SESSION CONFIGURATION (Simplified)
# =============================================

SESSION_COOKIE_AGE = 60 * 60 * 24 * 30  # 30 days
SESSION_SAVE_EVERY_REQUEST = True

# =============================================
# REST FRAMEWORK - LIMIT-OFFSET PAGINATION
# =============================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    # Limit-Offset Pagination
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 20,  # Default limit
}

# Custom pagination settings
# Limit = number of items per page (default: 20, max: 100)
# Offset = number of items to skip (default: 0)

# =============================================
# GOOGLE OAUTH
# =============================================

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://localhost:5173/auth/google/callback/"
)

# =============================================
# REDIRECT URLS
# =============================================

LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/login'
LOGIN_URL = '/api/auth/login/'

# =============================================
# EMAIL CONFIGURATION
# =============================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.getenv(
    'DEFAULT_FROM_EMAIL',
    'DiscoverEase <noreply@discoverease.com>'
)

# =============================================
# CELERY CONFIGURATION
# =============================================

CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'

CELERY_TIMEZONE = 'Asia/Kolkata'
CELERY_ENABLE_UTC = False

CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# =============================================
# SECURITY (Development)
# =============================================

SECURE_SSL_REDIRECT = False
SECURE_CONTENT_TYPE_NOSNIFF = True

# =============================================
# LOGGING - WITH AUTO-CREATED LOGS DIRECTORY
# =============================================

# Create logs directory if it doesn't exist
LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': LOG_DIR / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'accounts': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'suggestions': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# =============================================
# QDRANT VECTOR DATABASE
# =============================================

QDRANT_HOST = os.getenv('QDRANT_HOST', 'localhost')
QDRANT_PORT = int(os.getenv('QDRANT_PORT', '6333'))
QDRANT_COLLECTION = os.getenv('QDRANT_COLLECTION', 'kerala_destinations')
QDRANT_API_KEY = os.getenv('QDRANT_API_KEY', '')

# =============================================
# PYTHON 3.14 / DJANGO TEMPLATE CONTEXT FIX
# =============================================

if 'test' in sys.argv and sys.version_info >= (3, 14):
    def safe_copy(x):
        """Safely copy objects without causing AttributeError"""
        if hasattr(x, 'dicts'):
            try:
                if hasattr(x, '__copy__'):
                    return x.__copy__()
            except AttributeError:
                # Fall through to creating a new object
                pass
            
            # Create a new object and copy attributes
            new = type(x)()
            new.dicts = x.dicts[:] if x.dicts else []
            if hasattr(x, 'current_app'):
                new.current_app = x.current_app
            if hasattr(x, 'use_l10n'):
                new.use_l10n = x.use_l10n
            if hasattr(x, 'use_tz'):
                new.use_tz = x.use_tz
            if hasattr(x, 'autoescape'):
                new.autoescape = x.autoescape
            return new
        
        try:
            return copy._copy(x)
        except AttributeError:
            return x
    
    try:
        import django.test.client
        django.test.client.copy = safe_copy
        copy.copy = safe_copy
        print("🐍 Python 3.14 template context fix applied for tests")
    except (ImportError, AttributeError) as e:
        print(f"Could not apply Python 3.14 fix: {e}")

# =============================================
# PRINT CONFIGURATION SUMMARY (Development)
# =============================================

if DEBUG:
    print("\n" + "="*60)
    print("🚀 DiscoverEase - Django Configuration")
    print("="*60)
    print(f"📁 BASE_DIR: {BASE_DIR}")
    print(f"🗄️ Database: {DATABASES['default']['NAME']}")
    print(f"📦 Apps: {len(INSTALLED_APPS)} installed")
    print(f"📍 CORS Origins: {len(CORS_ALLOWED_ORIGINS)}")
    print(f"🔄 Celery Broker: {CELERY_BROKER_URL}")
    print(f"📧 Email: {EMAIL_HOST_USER or 'Not configured'}")
    print(f"🖼️ Media: {MEDIA_ROOT}")
    print(f"📁 Logs: {LOG_DIR}")
    print("📄 Pagination: Limit-Offset (default limit: 20)")
    print(f"🔍 Qdrant: {QDRANT_HOST}:{QDRANT_PORT}")
    print("="*60 + "\n")
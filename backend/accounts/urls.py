# accounts/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet

router = DefaultRouter()
router.register(r'', AuthViewSet, basename='auth')

urlpatterns = [
    path('', include(router.urls)),
    # ✅ Direct URL for ping endpoint
    path('ping/', AuthViewSet.as_view({'get': 'ping'}), name='ping'),
]

# ✅ The router will handle:
# /api/auth/csrf-token/
# /api/auth/register/
# /api/auth/login/
# /api/auth/verify-email/
# /api/auth/me/
# /api/auth/profile-data/
# /api/auth/update-profile/
# /api/auth/logout/
# /api/auth/forgot-password/
# /api/auth/reset-password/
# /api/auth/change-password/
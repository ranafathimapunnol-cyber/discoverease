# suggestions/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SuggestionViewSet

router = DefaultRouter()
router.register(r'', SuggestionViewSet, basename='suggestions')

urlpatterns = [
    path('', include(router.urls)),
]

# ✅ Direct URL patterns for easier access (optional)
urlpatterns += [
    # These will be available at /api/suggestions/implemented/, /api/suggestions/my-suggestions/, etc.
    # The router already handles these, but these are for clarity
]
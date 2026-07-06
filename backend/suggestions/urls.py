# suggestions/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SuggestionViewSet

router = DefaultRouter()
router.register(r'', SuggestionViewSet, basename='suggestions')

urlpatterns = [
    path('', include(router.urls)),
]
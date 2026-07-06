# destinations/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DestinationViewSet

router = DefaultRouter()
router.register(r'', DestinationViewSet, basename='destinations')

urlpatterns = [
    path('', include(router.urls)),
]
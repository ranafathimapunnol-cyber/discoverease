# staff/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffViewSet

# Create router with proper registration
router = DefaultRouter()
router.register(r'', StaffViewSet, basename='staff')

urlpatterns = [
    # Include all router URLs
    path('', include(router.urls)),
]
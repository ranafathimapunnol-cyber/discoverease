# destinations/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DestinationViewSet, WishlistViewSet

router = DefaultRouter()
router.register(r'destinations', DestinationViewSet, basename='destinations')
router.register(r'wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('', include(router.urls)),
]
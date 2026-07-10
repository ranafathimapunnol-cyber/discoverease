# guides/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GuideViewSet, BookingViewSet, DistrictViewSet, 
    GuideCategoryViewSet, GuideReviewViewSet
)

router = DefaultRouter()
router.register(r'guides', GuideViewSet, basename='guide')
router.register(r'bookings', BookingViewSet, basename='booking')  # ✅ This is correct
router.register(r'districts', DistrictViewSet, basename='district')
router.register(r'categories', GuideCategoryViewSet, basename='guide-category')
router.register(r'reviews', GuideReviewViewSet, basename='guide-review')

urlpatterns = [
    path('', include(router.urls)),
]
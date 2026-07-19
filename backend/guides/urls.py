# guides/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DistrictViewSet, GuideCategoryViewSet, GuideViewSet,
    BookingViewSet, GuideReviewViewSet, AvailabilityViewSet
)

router = DefaultRouter()
router.register(r'districts', DistrictViewSet, basename='district')
router.register(r'categories', GuideCategoryViewSet, basename='guide-category')
router.register(r'guides', GuideViewSet, basename='guide')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'reviews', GuideReviewViewSet, basename='guide-review')
router.register(r'availability', AvailabilityViewSet, basename='availability')

urlpatterns = [
    path('', include(router.urls)),
]
# guides/urls.py - COMPLETE FIXED VERSION

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DistrictViewSet, GuideCategoryViewSet, GuideViewSet,
    BookingViewSet, AvailabilityViewSet
)

router = DefaultRouter()
router.register(r'districts', DistrictViewSet, basename='district')
router.register(r'categories', GuideCategoryViewSet, basename='guide-category')
router.register(r'guides', GuideViewSet, basename='guide')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'availability', AvailabilityViewSet, basename='availability')

urlpatterns = [
    path('', include(router.urls)),
]

# ✅ ADD DIRECT URL FOR BULK AVAILABILITY (without the extra guides/)
urlpatterns += [
    path('bulk-availability/', GuideViewSet.as_view({'get': 'bulk_availability'}), name='bulk-availability'),
]
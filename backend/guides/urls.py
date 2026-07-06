from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DistrictViewSet, GuideCategoryViewSet, GuideViewSet, 
    BookingViewSet, GuideReviewViewSet
)

router = DefaultRouter()
router.register(r'districts', DistrictViewSet, basename='districts')
router.register(r'categories', GuideCategoryViewSet, basename='categories')
router.register(r'guides', GuideViewSet, basename='guides')
router.register(r'bookings', BookingViewSet, basename='bookings')
router.register(r'reviews', GuideReviewViewSet, basename='reviews')

urlpatterns = [
    path('', include(router.urls)),
]
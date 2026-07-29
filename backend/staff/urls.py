# staff/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffViewSet

router = DefaultRouter()
router.register(r'', StaffViewSet, basename='staff')

urlpatterns = [
    path('', include(router.urls)),
]

# ✅ The router will handle:
# /api/staff/stats/
# /api/staff/suggestions/
# /api/staff/suggestions/{id}/process/
# /api/staff/guides/
# /api/staff/guides/add/
# /api/staff/guides/{id}/update/
# /api/staff/guides/{id}/delete/
# /api/staff/bookings/
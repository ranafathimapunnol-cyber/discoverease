# admin_dashboard/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminDashboardViewSet

router = DefaultRouter()
router.register(r'', AdminDashboardViewSet, basename='admin')

urlpatterns = [
    path('', include(router.urls)),
]

# ✅ The router will handle:
# /api/admin/stats/
# /api/admin/users/
# /api/admin/create-user/
# /api/admin/update-user/{id}/
# /api/admin/delete-user/{id}/
# /api/admin/suggestions/
# /api/admin/approve-suggestion/{id}/
# /api/admin/reject-suggestion/{id}/
# /api/admin/activity-logs/
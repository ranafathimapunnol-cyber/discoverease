# your_project/urls.py

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/guides/', include('guides.urls')),
    path('api/staff/', include('staff.urls')),
    path('api/admin/', include('admin_dashboard.urls')),  # <-- THIS MUST EXIST
    path('api/destinations/', include('destinations.urls')),
    path('api/suggestions/', include('suggestions.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),        # /api/auth/
    path('api/suggestions/', include('suggestions.urls')),  # /api/suggestions/
    path('api/destinations/', include('destinations.urls')), # /api/destinations/
    path('api/guides/', include('guides.urls')),        # /api/guides/
    path('api/staff/', include('staff.urls')),  # Staff endpoints
    path('api/admin/', include('admin_dashboard.urls')), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
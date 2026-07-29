# api/urls.py
from django.urls import path
from django.http import JsonResponse
from .views.ai_views import AIChatView
from .views.category_views import CategoryDataView, CategoryDetailView

def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'Server is running',
        'apps': ['api', 'ai'],
        'qdrant': 'in-memory'
    })

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('ai/chat/', AIChatView.as_view(), name='ai_chat'),
    
    # ✅ ADD THESE - Category endpoints
    path('categories/', CategoryDataView.as_view(), name='category_data'),
    path('categories/<str:category_key>/', CategoryDetailView.as_view(), name='category_detail'),
]
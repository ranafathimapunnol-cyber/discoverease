# api/urls.py
from django.urls import path
from django.http import JsonResponse
from .views.ai_views import AIChatView

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
]
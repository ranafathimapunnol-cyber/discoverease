# config/views.py
from django.shortcuts import redirect
from django.conf import settings
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
import urllib.parse

class GoogleAuthViewSet(viewsets.GenericViewSet):
    """
    ViewSet for Google OAuth authentication
    """
    permission_classes = [AllowAny]  # Public endpoint
    
    @action(detail=False, methods=['get'], url_path='login', url_name='login')
    def google_login(self, request):
        """Redirect to Google OAuth with proper parameters"""
        google_url = 'https://accounts.google.com/o/oauth2/v2/auth'
        params = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'email profile openid',
            'access_type': 'online',
            'prompt': 'select_account',
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{google_url}?{query_string}"
        return redirect(full_url)
    
    @action(detail=False, methods=['get'], url_path='callback', url_name='callback')
    def google_callback(self, request):
        """Handle Google OAuth callback - optional"""
        code = request.GET.get('code')
        if code:
            # Process the code (exchange for token, etc.)
            return redirect('/')  # Redirect to home or success page
        return redirect('/')  # Redirect to home on error
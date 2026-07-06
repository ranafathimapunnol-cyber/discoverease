import logging
import requests
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout, authenticate
from django.utils import timezone
from django.conf import settings
from django.middleware.csrf import get_token
from django.shortcuts import redirect
import urllib.parse
from .models import User
from .serializers import (
    UserSerializer, 
    RegisterSerializer, 
    ProfileUpdateSerializer
)
from .tasks import send_verification_email

logger = logging.getLogger(__name__)


class AuthViewSet(viewsets.ModelViewSet):
    """
    ViewSet for authentication and user management
    """
    queryset = User.objects.filter(is_deleted=False)
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_permissions(self):
        """
        Custom permissions based on action
        """
        if self.action in ['me', 'update_profile', 'upload_profile_picture', 
                          'delete_profile_picture', 'trip_stats', 'delete_account', 'logout']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_serializer_class(self):
        """
        Different serializers for different actions
        """
        if self.action == 'register':
            return RegisterSerializer
        elif self.action in ['update_profile']:
            return ProfileUpdateSerializer
        return UserSerializer

    # ============================================
    # ✅ CSRF TOKEN
    # ============================================
    @action(detail=False, methods=['get'])
    def csrf_token(self, request):
        """Get CSRF token"""
        token = get_token(request)
        response = Response({'csrf_token': token})
        response.set_cookie(
            'csrftoken',
            token,
            max_age=60 * 60 * 24 * 7 * 52,
            httponly=False,
            samesite='Lax',
            secure=False,
        )
        return response

    # ============================================
    # ✅ REGISTER
    # ============================================
    @action(detail=False, methods=['post'])
    def register(self, request):
        """Register a new user"""
        data = request.data.copy()
        
        # Set defaults if not provided
        if not data.get('first_name'):
            data['first_name'] = ''
        if not data.get('last_name'):
            data['last_name'] = ''
        if not data.get('phone'):
            data['phone'] = ''
        if not data.get('role'):
            data['role'] = 'tourister'
        
        # Generate username from email if not provided
        if not data.get('username'):
            email = data.get('email', '')
            data['username'] = email.split('@')[0] if email else 'user'
        
        # Handle duplicate username
        if User.objects.filter(username=data['username']).exists():
            import random
            data['username'] = f"{data['username']}_{random.randint(100, 999)}"
        
        serializer = RegisterSerializer(data=data)
        
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = False
            user.email_verified = False
            user.save()
            
            # Generate verification token
            token = user.generate_verification_token()
            verification_link = f"http://localhost:8000/api/auth/verify_email/?token={token}"
            
            # Send verification email
            try:
                send_verification_email.delay(user.id, token)
            except Exception:
                pass
            
            return Response({
                'success': True,
                'message': 'Registration successful! Please verify your email.',
                'email': user.email,
                'role': user.get_role(),
                'user': UserSerializer(user).data,
                'verification_link': verification_link
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ LOGIN
    # ============================================
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Login user"""
        email = request.data.get('email')
        password = request.data.get('password')
        remember_me = request.data.get('remember_me', False)

        if not email or not password:
            return Response({
                'success': False,
                'error': 'Email and password required'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)
        
        if not user:
            return Response({
                'success': False,
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not user.email_verified:
            return Response({
                'success': False,
                'error': 'Please verify your email first',
                'verification_required': True
            }, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        # Session expiry
        if not remember_me:
            request.session.set_expiry(0)
        else:
            request.session.set_expiry(60 * 60 * 24 * 30)

        response_data = {
            'success': True,
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'role': user.get_role(),
            'dashboard_url': user.get_dashboard_url(),
            'session_key': request.session.session_key
        }

        response = Response(response_data)
        response.set_cookie(
            'sessionid',
            request.session.session_key,
            max_age=request.session.get_expiry_age(),
            httponly=True,
            samesite='Lax',
            secure=False,
        )
        return response

    # ============================================
    # ✅ GOOGLE LOGIN (Redirect to Google)
    # ============================================
    @action(detail=False, methods=['get'])
    def google_login(self, request):
        """
        Redirect to Google OAuth login page
        GET /api/auth/google_login/
        """
        # Check if Google credentials are configured
        if not settings.GOOGLE_CLIENT_ID:
            return Response({
                'success': False,
                'error': 'Google OAuth not configured'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Build Google OAuth URL
        google_auth_url = 'https://accounts.google.com/o/oauth2/v2/auth'
        
        params = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'redirect_uri': 'http://localhost:5173/auth/google/callback/',
            'response_type': 'code',
            'scope': 'email profile openid',
            'access_type': 'online',
            'prompt': 'select_account',
        }
        
        query_string = urllib.parse.urlencode(params)
        full_url = f"{google_auth_url}?{query_string}"
        
        logger.info(f"Redirecting to Google: {full_url}")
        
        # Return the URL instead of redirecting (for SPA)
        return Response({
            'success': True,
            'auth_url': full_url,
            'message': 'Redirect to Google OAuth'
        })

    # ============================================
    # ✅ GOOGLE AUTH (Callback)
    # ============================================
    @action(detail=False, methods=['post'])
    def google_auth(self, request):
        """
        Handle Google OAuth callback
        POST /api/auth/google_auth/
        """
        code = request.data.get('code')
        role = request.data.get('role', 'tourister')

        if not code:
            return Response({
                'success': False,
                'error': 'Authorization code required'
            }, status=status.HTTP_400_BAD_REQUEST)

        code = code.strip()
        redirect_uri = 'http://localhost:5173/auth/google/callback/'
        
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            return Response({
                'success': False,
                'error': 'Google OAuth credentials not configured'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Exchange code for access token
        try:
            token_response = requests.post(
                'https://oauth2.googleapis.com/token',
                data={
                    'code': code,
                    'client_id': settings.GOOGLE_CLIENT_ID,
                    'client_secret': settings.GOOGLE_CLIENT_SECRET,
                    'redirect_uri': redirect_uri,
                    'grant_type': 'authorization_code',
                },
                timeout=10
            )
        except requests.exceptions.RequestException:
            return Response({
                'success': False,
                'error': 'Failed to connect to Google'
            }, status=status.HTTP_400_BAD_REQUEST)

        if token_response.status_code != 200:
            return Response({
                'success': False,
                'error': 'Google authentication failed'
            }, status=status.HTTP_400_BAD_REQUEST)

        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            return Response({
                'success': False,
                'error': 'No access token received'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get user info from Google
        try:
            user_response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10
            )
        except requests.exceptions.RequestException:
            return Response({
                'success': False,
                'error': 'Failed to get user information'
            }, status=status.HTTP_400_BAD_REQUEST)

        if user_response.status_code != 200:
            return Response({
                'success': False,
                'error': 'Failed to get user info from Google'
            }, status=status.HTTP_400_BAD_REQUEST)

        google_user = user_response.json()
        email = google_user.get('email')
        
        if not email:
            return Response({
                'success': False,
                'error': 'No email provided by Google'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'first_name': google_user.get('given_name', ''),
                'last_name': google_user.get('family_name', ''),
                'email_verified': True,
                'is_active': True,
                'role': role,
            }
        )

        if not created:
            if not user.email_verified:
                user.email_verified = True
            if not user.is_active:
                user.is_active = True
            if user.role != role:
                user.role = role
            user.save()

        # Login the user
        user.backend = 'django.contrib.auth.backends.ModelBackend'
        login(request, user)
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        request.session.set_expiry(60 * 60 * 24 * 30)

        response_data = {
            'success': True,
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'role': user.get_role(),
            'dashboard_url': user.get_dashboard_url(),
            'is_new_user': created,
            'session_key': request.session.session_key
        }

        response = Response(response_data)
        response.set_cookie(
            'sessionid',
            request.session.session_key,
            max_age=request.session.get_expiry_age(),
            httponly=True,
            samesite='Lax',
            secure=False,
        )
        return response

    # ============================================
    # ✅ LOGOUT
    # ============================================
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout user"""
        logout(request)
        response = Response({'success': True, 'message': 'Logged out successfully'})
        response.delete_cookie('sessionid')
        return response

    # ============================================
    # ✅ GET CURRENT USER
    # ============================================
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile"""
        return Response({
            'success': True,
            'user': UserSerializer(request.user).data,
            'role': request.user.get_role()
        })

    # ============================================
    # ✅ UPDATE PROFILE
    # ============================================
    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """Update user profile"""
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'success': True,
                'message': 'Profile updated',
                'user': UserSerializer(user).data
            })
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ VERIFY EMAIL
    # ============================================
    @action(detail=False, methods=['get', 'post'])
    def verify_email(self, request):
        """Verify email with token"""
        if request.method == 'GET':
            token = request.query_params.get('token')
        else:
            token = request.data.get('token')
        
        if not token:
            return Response({
                'success': False,
                'error': 'Token required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find user with token
        try:
            user = User.objects.get(email_verification_token=token)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check token validity
        if not user.is_verification_token_valid(token):
            return Response({
                'success': False,
                'error': 'Token expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify email
        if not user.email_verified:
            user.verify_email()
        
        # Login user
        user.backend = 'django.contrib.auth.backends.ModelBackend'
        login(request, user)
        request.session.set_expiry(60 * 60 * 24 * 30)
        
        response_data = {
            'success': True,
            'message': 'Email verified successfully',
            'user': UserSerializer(user).data,
            'role': user.get_role(),
            'session_key': request.session.session_key
        }
        
        response = Response(response_data)
        response.set_cookie(
            'sessionid',
            request.session.session_key,
            max_age=request.session.get_expiry_age(),
            httponly=True,
            samesite='Lax',
            secure=False,
        )
        return response

    # ============================================
    # ✅ RESEND VERIFICATION
    # ============================================
    @action(detail=False, methods=['post'])
    def resend_verification(self, request):
        """Resend verification email"""
        email = request.data.get('email')
        
        if not email:
            return Response({
                'success': False,
                'error': 'Email required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if user.email_verified:
            return Response({
                'success': False,
                'error': 'Email already verified'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        token = user.generate_verification_token()
        
        try:
            send_verification_email.delay(user.id, token)
        except Exception:
            pass
        
        verification_link = f"http://localhost:8000/api/auth/verify_email/?token={token}"
        
        return Response({
            'success': True,
            'message': 'Verification email sent successfully',
            'verification_link': verification_link
        })

    # ============================================
    # ✅ UPLOAD PROFILE PICTURE
    # ============================================
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_profile_picture(self, request):
        """Upload profile picture"""
        user = request.user
        
        if 'profile_picture' not in request.FILES:
            return Response({
                'success': False,
                'error': 'No image provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        image = request.FILES['profile_picture']
        
        if not image.content_type.startswith('image/'):
            return Response({
                'success': False,
                'error': 'File must be an image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if image.size > 5 * 1024 * 1024:
            return Response({
                'success': False,
                'error': 'File size must be less than 5MB'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete old picture
        if user.profile_picture_upload:
            try:
                user.profile_picture_upload.delete(save=False)
            except Exception:
                pass
        
        user.profile_picture_upload = image
        user.save()
        
        image_url = request.build_absolute_uri(user.profile_picture_upload.url)
        
        return Response({
            'success': True,
            'message': 'Profile picture uploaded successfully',
            'profile_picture': image_url
        })

    # ============================================
    # ✅ DELETE PROFILE PICTURE
    # ============================================
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def delete_profile_picture(self, request):
        """Delete profile picture"""
        user = request.user
        
        if user.profile_picture_upload:
            try:
                user.profile_picture_upload.delete(save=False)
            except Exception:
                pass
            user.profile_picture_upload = None
            user.save()
        
        return Response({
            'success': True,
            'message': 'Profile picture deleted successfully'
        })

    # ============================================
    # ✅ TRIP STATS
    # ============================================
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def trip_stats(self, request):
        """Get user trip statistics"""
        user = request.user
        
        try:
            from guides.models import GuideBooking
            total_bookings = GuideBooking.objects.filter(user=user).count()
            completed_bookings = GuideBooking.objects.filter(
                user=user, 
                status='completed'
            ).count()
            pending_bookings = GuideBooking.objects.filter(
                user=user, 
                status='pending'
            ).count()
            confirmed_bookings = GuideBooking.objects.filter(
                user=user, 
                status='confirmed'
            ).count()
        except ImportError:
            total_bookings = 0
            completed_bookings = 0
            pending_bookings = 0
            confirmed_bookings = 0
        
        return Response({
            'success': True,
            'total_trips': total_bookings,
            'completed_trips': completed_bookings,
            'pending_trips': pending_bookings,
            'confirmed_trips': confirmed_bookings,
        })

    # ============================================
    # ✅ DELETE ACCOUNT
    # ============================================
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def delete_account(self, request):
        """Permanently delete user account"""
        user = request.user
        password = request.data.get('password')
        
        if not password:
            return Response({
                'success': False,
                'error': 'Password required for account deletion'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(password):
            return Response({
                'success': False,
                'error': 'Invalid password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Soft delete
        user.is_active = False
        user.is_deleted = True
        user.deleted_at = timezone.now()
        user.email = f"deleted_{user.id}_{user.email}"
        user.username = f"deleted_user_{user.id}"
        user.save()
        
        logout(request)
        
        return Response({
            'success': True,
            'message': 'Account deleted successfully'
        })
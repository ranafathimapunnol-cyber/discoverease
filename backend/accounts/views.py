# accounts/views.py - COMPLETE FIXED VERSION

import logging
import requests
import urllib.parse
import secrets
import random
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout
from django.utils import timezone
from django.conf import settings
from django.middleware.csrf import get_token
from django.core.mail import send_mail
from django.db import models
from .models import User
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ProfileUpdateSerializer
)

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
                          'delete_profile_picture', 'trip_stats', 'delete_account',
                          'logout', 'admin_users', 'profile_data']:
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
    @action(detail=False, methods=['get'], url_path='csrf-token')
    def csrf_token(self, request):
        """Get CSRF token"""
        try:
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
        except Exception as e:
            logger.error(f"CSRF token error: {e}")
            return Response({'csrf_token': 'error'}, status=200)

    # ============================================
    # ✅ REGISTER
    # ============================================
    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """Register a new user with email verification"""
        try:
            data = request.data.copy()

            # Set default values for optional fields
            if not data.get('first_name'):
                data['first_name'] = ''
            if not data.get('last_name'):
                data['last_name'] = ''
            if not data.get('phone'):
                data['phone'] = ''

            # Generate username from email if not provided
            if not data.get('username'):
                email = data.get('email', '')
                data['username'] = email.split('@')[0] if email else 'user'

            # Ensure unique username
            if User.objects.filter(username=data['username']).exists():
                data['username'] = f"{data['username']}_{random.randint(100, 999)}"

            serializer = RegisterSerializer(data=data)

            if serializer.is_valid():
                # Create user
                user = serializer.save()
                user.is_active = False
                user.email_verified = False
                user.is_deleted = False
                user.save()

                # Generate verification token
                token = user.generate_verification_token()
                verification_link = f"http://localhost:5173/verify-email?token={token}"

                # Send verification email
                email_sent = False
                try:
                    subject = 'Verify Your Email - DiscoverEase'
                    message = f"""
                    Hello {user.first_name or 'User'},

                    Welcome to DiscoverEase! Please verify your email address by clicking the link below:

                    {verification_link}

                    This link will expire in 30 minutes.

                    If you didn't create an account with DiscoverEase, please ignore this email.

                    Thanks,
                    DiscoverEase Team
                    """

                    send_mail(
                        subject=subject,
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                    email_sent = True
                    print(f"✅ Verification email sent to {user.email}")
                    print(f"🔗 Verification link: {verification_link}")

                except Exception as e:
                    print(f"❌ Failed to send verification email: {e}")
                    logger.error(f"Failed to send verification email: {e}")

                return Response({
                    'success': True,
                    'message': 'Registration successful! Please verify your email.',
                    'email': user.email,
                    'role': user.get_role(),
                    'user': UserSerializer(user).data,
                    'verification_link': verification_link,
                    'email_sent': email_sent
                }, status=status.HTTP_201_CREATED)

            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Register error: {e}")
            print(f"❌ Register error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ LOGIN - SESSION ONLY (NO TOKEN)
    # ============================================
    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        """Login user - Session Only (NO TOKEN)"""
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            remember_me = request.data.get('remember_me', False)

            print(f"🔐 Login attempt for: {email}")

            if not email or not password:
                return Response({
                    'success': False,
                    'error': 'Email and password required'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(email=email)
                print(f"📧 User found: {user.email}")
                print(f"📧 Email verified: {user.email_verified}")
                print(f"🔓 Is active: {user.is_active}")
                print(f"🗑️ Is deleted: {user.is_deleted}")
                print(f"📋 Role: {user.role}")

                if user.is_deleted:
                    print(f"❌ Account is deleted: {email}")
                    return Response({
                        'success': False,
                        'error': 'This account has been deleted. Please contact support.'
                    }, status=status.HTTP_403_FORBIDDEN)

                if not user.is_active:
                    return Response({
                        'success': False,
                        'error': 'Account is deactivated. Please contact support.'
                    }, status=status.HTTP_403_FORBIDDEN)

                if hasattr(user, 'email_verified') and not user.email_verified:
                    return Response({
                        'success': False,
                        'error': 'Please verify your email first. Check your inbox for the verification link.',
                        'verification_required': True
                    }, status=status.HTTP_403_FORBIDDEN)

                if not user.check_password(password):
                    print(f"❌ Password check failed for {email}")
                    return Response({
                        'success': False,
                        'error': 'Invalid email or password'
                    }, status=status.HTTP_401_UNAUTHORIZED)

                print(f"✅ Password check passed for {email}")

            except User.DoesNotExist:
                print(f"❌ User not found: {email}")
                return Response({
                    'success': False,
                    'error': 'Invalid email or password'
                }, status=status.HTTP_401_UNAUTHORIZED)
            except Exception as e:
                print(f"❌ Error finding user: {e}")
                return Response({
                    'success': False,
                    'error': 'An error occurred'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                user.backend = 'django.contrib.auth.backends.ModelBackend'
                login(request, user)
                print(f"✅ User logged in successfully")
            except Exception as e:
                print(f"❌ Login error: {e}")
                return Response({
                    'success': False,
                    'error': 'Failed to login'
                }, status=status.HTTP_400_BAD_REQUEST)

            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])

            if not remember_me:
                request.session.set_expiry(0)
            else:
                request.session.set_expiry(60 * 60 * 24 * 30)

            user_data = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role if hasattr(user, 'role') else 'tourister',
                'email_verified': user.email_verified,
            }

            role = user.role if hasattr(user, 'role') else 'tourister'

            dashboard_url = '/'
            if role == 'admin':
                dashboard_url = '/admin-dashboard'
            elif role == 'guide':
                dashboard_url = '/guide-dashboard'
            elif role == 'staff':
                dashboard_url = '/staff-dashboard'

            response_data = {
                'success': True,
                'message': 'Login successful',
                'user': user_data,
                'role': role,
                'dashboard_url': dashboard_url,
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

            print(f"✅ Login successful for: {email} (Role: {role})")
            print(f"📋 Session key: {request.session.session_key}")
            return response

        except Exception as e:
            logger.error(f"Login error: {e}", exc_info=True)
            print(f"❌ Login error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ VERIFY EMAIL
    # ============================================
    @action(detail=False, methods=['get', 'post'], url_path='verify-email')
    def verify_email(self, request):
        """Verify user email with token"""
        try:
            if request.method == 'GET':
                token = request.query_params.get('token')
            else:
                token = request.data.get('token')

            print(f"🔍 Verifying email with token: {token}")

            if not token:
                return Response({
                    'success': False,
                    'error': 'Token required'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(email_verification_token=token)
                print(f"✅ User found: {user.email}")

                if user.is_deleted:
                    return Response({
                        'success': False,
                        'error': 'This account has been deleted'
                    }, status=status.HTTP_403_FORBIDDEN)

            except User.DoesNotExist:
                print(f"❌ User not found with token: {token}")
                return Response({
                    'success': False,
                    'error': 'Invalid token - User not found'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not user.is_verification_token_valid(token):
                print(f"❌ Token expired or invalid for {user.email}")
                return Response({
                    'success': False,
                    'error': 'Token expired or invalid'
                }, status=status.HTTP_400_BAD_REQUEST)

            user.verify_email()
            print(f"✅ User {user.email} verified successfully!")

            user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, user)
            request.session.set_expiry(60 * 60 * 24 * 30)

            user_data = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'email_verified': user.email_verified,
            }

            response_data = {
                'success': True,
                'message': 'Email verified successfully',
                'user': user_data,
                'role': user.get_role(),
                'session_key': request.session.session_key
            }

            print(f"📤 Response data: {response_data}")

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

        except Exception as e:
            logger.error(f"Verify email error: {e}", exc_info=True)
            print(f"❌ Verify email error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ GET CURRENT USER
    # ============================================
    @action(detail=False, methods=['get'], url_path='me', permission_classes=[IsAuthenticated])
    def me(self, request):
        try:
            user = request.user

            if user.is_deleted:
                logout(request)
                return Response({
                    'success': False,
                    'error': 'Account has been deleted'
                }, status=status.HTTP_403_FORBIDDEN)

            return Response({
                'success': True,
                'user': UserSerializer(user).data,
                'role': user.get_role()
            })
        except Exception as e:
            logger.error(f"Me error: {e}")
            return Response({
                'success': True,
                'user': {
                    'id': request.user.id,
                    'email': request.user.email,
                    'username': request.user.username,
                    'first_name': request.user.first_name,
                    'last_name': request.user.last_name,
                    'role': request.user.role if hasattr(request.user, 'role') else 'tourister',
                },
                'role': 'tourister'
            })

    # ============================================
    # ✅ PROFILE DATA - COMPLETE FIXED
    # ============================================
    @action(detail=False, methods=['get'], url_path='profile-data', permission_classes=[IsAuthenticated])
    def profile_data(self, request):
        """
        Get ALL profile data in a SINGLE API call
        Includes: user, stats, suggestions (with images), reviews
        """
        try:
            user = request.user

            if user.is_deleted:
                return Response({
                    'success': False,
                    'error': 'Account has been deleted'
                }, status=status.HTTP_403_FORBIDDEN)

            # 1. User data
            user_data = UserSerializer(user).data

            # 2. Trip stats
            total_bookings = 0
            completed_bookings = 0
            pending_bookings = 0
            confirmed_bookings = 0

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
            except Exception as e:
                logger.warning(f"Error fetching bookings: {e}")

            stats = {
                'total_trips': total_bookings,
                'completed_trips': completed_bookings,
                'pending_trips': pending_bookings,
                'confirmed_trips': confirmed_bookings,
            }

            # 3. User suggestions (with images)
            suggestions_data = []
            suggestion_stats = {
                'total': 0,
                'pending': 0,
                'approved': 0,
                'implemented': 0,
                'rejected': 0,
            }

            try:
                from suggestions.models import Suggestion
                suggestions = Suggestion.objects.filter(user=user).order_by('-created_at')

                for s in suggestions:
                    # Get image URL safely
                    image_url = None
                    if s.image:
                        try:
                            if hasattr(s.image, 'url'):
                                image_url = s.image.url
                            elif isinstance(s.image, str):
                                if s.image.startswith('http') or s.image.startswith('/media/'):
                                    image_url = s.image
                                else:
                                    image_url = str(s.image)
                        except Exception as e:
                            logger.warning(f"Error getting image for suggestion {s.id}: {e}")
                            image_url = None

                    # Fallback image
                    if not image_url:
                        category = getattr(s, 'category', '').lower()
                        category_images = {
                            'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
                            'backwater': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                            'waterfall': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80',
                            'hill': 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=80',
                            'wildlife': 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80',
                        }
                        image_url = category_images.get(category, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80')

                    suggestions_data.append({
                        'id': s.id,
                        'name': s.name or 'Untitled',
                        'title': s.name or 'Untitled',
                        'description': s.description or '',
                        'category': getattr(s, 'category', 'General'),
                        'location_info': getattr(s, 'location_info', ''),
                        'district': getattr(s, 'district', ''),
                        'status': s.status or 'pending',
                        'suggestion_type': getattr(s, 'suggestion_type', 'hidden_gem'),
                        'type': getattr(s, 'suggestion_type', 'hidden_gem'),
                        'image': image_url,
                        'rating': getattr(s, 'rating', None),
                        'admin_notes': getattr(s, 'admin_notes', ''),
                        'created_at': s.created_at.isoformat() if s.created_at else None,
                    })

                suggestion_stats = {
                    'total': Suggestion.objects.filter(user=user).count(),
                    'pending': Suggestion.objects.filter(user=user, status='pending').count(),
                    'approved': Suggestion.objects.filter(user=user, status='approved').count(),
                    'implemented': Suggestion.objects.filter(user=user, status='implemented').count(),
                    'rejected': Suggestion.objects.filter(user=user, status='rejected').count(),
                }
            except Exception as e:
                logger.warning(f"Error fetching suggestions: {e}")

            # 4. User reviews
            reviews_data = []
            try:
                from guides.models import GuideReview
                reviews = GuideReview.objects.filter(user=user).order_by('-created_at')

                for r in reviews:
                    image_url = None
                    if r.guide and r.guide.profile_image:
                        try:
                            if hasattr(r.guide.profile_image, 'url'):
                                image_url = r.guide.profile_image.url
                            else:
                                image_url = str(r.guide.profile_image)
                        except:
                            image_url = None

                    if not image_url:
                        image_url = 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80'

                    reviews_data.append({
                        'id': r.id,
                        'rating': r.rating,
                        'comment': r.comment or r.review_text or '',
                        'review_text': r.comment or r.review_text or '',
                        'guide_name': r.guide.full_name if r.guide else None,
                        'destination': r.booking.destination if r.booking and hasattr(r.booking, 'destination') else None,
                        'district': r.guide.primary_district if r.guide else '',
                        'category': 'Guide Review',
                        'status': 'approved' if r.is_approved else 'pending',
                        'image': image_url,
                        'suggestion_type': 'review',
                        'type': 'review',
                        'created_at': r.created_at.isoformat() if r.created_at else None,
                    })
            except Exception as e:
                logger.warning(f"Error fetching reviews: {e}")

            return Response({
                'success': True,
                'user': user_data,
                'stats': stats,
                'suggestions': suggestions_data,
                'reviews': reviews_data,
                'suggestion_stats': suggestion_stats,
                'total_suggestions': len(suggestions_data),
                'total_reviews': len(reviews_data),
            })

        except Exception as e:
            logger.error(f"Profile data error: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=400)

    # ============================================
    # ✅ GET ALL USERS FOR ADMIN
    # ============================================
    @action(detail=False, methods=['get'], url_path='admin-users', permission_classes=[IsAuthenticated])
    def admin_users(self, request):
        """Get all users for admin dashboard"""
        try:
            if request.user.role != 'admin' and not request.user.is_superuser:
                return Response({
                    'success': False,
                    'error': 'Admin access required'
                }, status=status.HTTP_403_FORBIDDEN)

            users = User.objects.filter(is_deleted=False).order_by('-date_joined')
            data = UserSerializer(users, many=True).data

            return Response({
                'success': True,
                'users': data,
                'count': len(data)
            })
        except Exception as e:
            logger.error(f"Admin users error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ UPDATE PROFILE
    # ============================================
    @action(detail=False, methods=['patch'], url_path='update-profile', permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        try:
            user = request.user

            if user.is_deleted:
                return Response({
                    'success': False,
                    'error': 'Account has been deleted'
                }, status=status.HTTP_403_FORBIDDEN)

            serializer = ProfileUpdateSerializer(
                user,
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
        except Exception as e:
            logger.error(f"Update profile error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ LOGOUT
    # ============================================
    @action(detail=False, methods=['post'], url_path='logout', permission_classes=[IsAuthenticated])
    def logout(self, request):
        try:
            logout(request)
            response = Response({'success': True, 'message': 'Logged out successfully'})
            response.delete_cookie('sessionid')
            return response
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return Response({'success': True, 'message': 'Logged out'})

    # ============================================
    # ✅ GOOGLE LOGIN
    # ============================================
    @action(detail=False, methods=['get'], url_path='google-login')
    def google_login(self, request):
        try:
            if not settings.GOOGLE_CLIENT_ID:
                return Response({
                    'success': False,
                    'error': 'Google OAuth not configured'
                }, status=status.HTTP_400_BAD_REQUEST)

            redirect_uri = 'http://localhost:5173/auth/google/callback/'

            google_auth_url = 'https://accounts.google.com/o/oauth2/v2/auth'

            params = {
                'client_id': settings.GOOGLE_CLIENT_ID,
                'redirect_uri': redirect_uri,
                'response_type': 'code',
                'scope': 'email profile openid',
                'access_type': 'online',
                'prompt': 'select_account',
            }

            query_string = urllib.parse.urlencode(params)
            full_url = f"{google_auth_url}?{query_string}"

            return Response({
                'success': True,
                'auth_url': full_url,
                'message': 'Redirect to Google OAuth'
            })

        except Exception as e:
            logger.error(f"Google login error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ GOOGLE AUTH
    # ============================================
    @action(detail=False, methods=['post'], url_path='google-auth')
    def google_auth(self, request):
        try:
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

            if token_response.status_code != 200:
                logger.error(f"Google token response error: {token_response.text}")
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

            user_response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10
            )

            if user_response.status_code != 200:
                logger.error(f"Google userinfo error: {user_response.text}")
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

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': google_user.get('given_name', ''),
                    'last_name': google_user.get('family_name', ''),
                    'email_verified': True,
                    'is_active': True,
                    'is_deleted': False,
                    'role': role,
                }
            )

            if user.is_deleted:
                return Response({
                    'success': False,
                    'error': 'This account has been deleted. Please contact support.'
                }, status=status.HTTP_403_FORBIDDEN)

            if not created:
                if not user.email_verified:
                    user.email_verified = True
                if not user.is_active:
                    user.is_active = True
                if user.role != role:
                    user.role = role
                user.save()

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

        except Exception as e:
            logger.error(f"Google auth error: {e}", exc_info=True)
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ FORGOT PASSWORD
    # ============================================
    @action(detail=False, methods=['post'], url_path='forgot-password')
    def forgot_password(self, request):
        try:
            email = request.data.get('email')

            if not email:
                return Response({
                    'success': False,
                    'error': 'Email is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(email=email)

                if user.is_deleted:
                    return Response({
                        'success': True,
                        'message': 'If an account with this email exists, a reset link has been sent.'
                    })

            except User.DoesNotExist:
                return Response({
                    'success': True,
                    'message': 'If an account with this email exists, a reset link has been sent.'
                })

            token = secrets.token_urlsafe(32)
            user.password_reset_token = token
            user.password_reset_token_created = timezone.now()
            user.save()

            try:
                reset_link = f"http://localhost:5173/reset-password?token={token}"
                send_mail(
                    subject='Password Reset - DiscoverEase',
                    message=f'Click the link to reset your password: {reset_link}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                logger.error(f"Failed to send password reset email: {e}")

            return Response({
                'success': True,
                'message': 'If an account with this email exists, a reset link has been sent.'
            })

        except Exception as e:
            logger.error(f"Forgot password error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ RESET PASSWORD
    # ============================================
    @action(detail=False, methods=['post'], url_path='reset-password')
    def reset_password(self, request):
        try:
            token = request.data.get('token')
            password = request.data.get('password')
            confirm_password = request.data.get('confirm_password')

            if not token:
                return Response({
                    'success': False,
                    'error': 'Token is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not password:
                return Response({
                    'success': False,
                    'error': 'Password is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            if password != confirm_password:
                return Response({
                    'success': False,
                    'error': 'Passwords do not match'
                }, status=status.HTTP_400_BAD_REQUEST)

            if len(password) < 8:
                return Response({
                    'success': False,
                    'error': 'Password must be at least 8 characters'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(password_reset_token=token)

                if user.is_deleted:
                    return Response({
                        'success': False,
                        'error': 'This account has been deleted'
                    }, status=status.HTTP_403_FORBIDDEN)

            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Invalid or expired token'
                }, status=status.HTTP_400_BAD_REQUEST)

            if user.password_reset_token_created:
                expiry = user.password_reset_token_created + timezone.timedelta(hours=24)
                if timezone.now() > expiry:
                    return Response({
                        'success': False,
                        'error': 'Token has expired'
                    }, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(password)
            user.password_reset_token = None
            user.password_reset_token_created = None
            user.save()

            return Response({
                'success': True,
                'message': 'Password reset successfully'
            })

        except Exception as e:
            logger.error(f"Reset password error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ CHANGE PASSWORD
    # ============================================
    @action(detail=False, methods=['post'], url_path='change-password', permission_classes=[IsAuthenticated])
    def change_password(self, request):
        try:
            user = request.user

            if user.is_deleted:
                return Response({
                    'success': False,
                    'error': 'Account has been deleted'
                }, status=status.HTTP_403_FORBIDDEN)

            current_password = request.data.get('current_password')
            new_password = request.data.get('new_password')
            confirm_new_password = request.data.get('confirm_new_password')

            if not current_password:
                return Response({
                    'success': False,
                    'error': 'Current password is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not new_password:
                return Response({
                    'success': False,
                    'error': 'New password is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            if new_password != confirm_new_password:
                return Response({
                    'success': False,
                    'error': 'New passwords do not match'
                }, status=status.HTTP_400_BAD_REQUEST)

            if len(new_password) < 8:
                return Response({
                    'success': False,
                    'error': 'Password must be at least 8 characters'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not user.check_password(current_password):
                return Response({
                    'success': False,
                    'error': 'Current password is incorrect'
                }, status=status.HTTP_401_UNAUTHORIZED)

            user.set_password(new_password)
            user.save()

            return Response({
                'success': True,
                'message': 'Password changed successfully'
            })

        except Exception as e:
            logger.error(f"Change password error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ RESEND VERIFICATION
    # ============================================
    @action(detail=False, methods=['post'], url_path='resend-verification')
    def resend_verification(self, request):
        try:
            email = request.data.get('email')

            if not email:
                return Response({
                    'success': False,
                    'error': 'Email required'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(email=email)

                if user.is_deleted:
                    return Response({
                        'success': False,
                        'error': 'Account has been deleted'
                    }, status=status.HTTP_403_FORBIDDEN)

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
            verification_link = f"http://localhost:5173/verify-email?token={token}"

            try:
                subject = 'Verify Your Email - DiscoverEase'
                message = f"""
                Hello {user.first_name or 'User'},

                Please verify your email address by clicking the link below:

                {verification_link}

                This link will expire in 30 minutes.

                Thanks,
                DiscoverEase Team
                """

                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                print(f"✅ Verification email resent to {user.email}")
                print(f"🔗 Verification link: {verification_link}")

            except Exception as e:
                print(f"❌ Failed to send verification email: {e}")
                logger.error(f"Failed to send verification email: {e}")

            return Response({
                'success': True,
                'message': 'Verification email sent successfully',
                'verification_link': verification_link
            })
        except Exception as e:
            logger.error(f"Resend verification error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ UPLOAD PROFILE PICTURE
    # ============================================
    @action(detail=False, methods=['post'], url_path='upload-profile-picture', permission_classes=[IsAuthenticated])
    def upload_profile_picture(self, request):
        try:
            user = request.user

            if user.is_deleted:
                return Response({
                    'success': False,
                    'error': 'Account has been deleted'
                }, status=status.HTTP_403_FORBIDDEN)

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
        except Exception as e:
            logger.error(f"Upload profile picture error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ DELETE PROFILE PICTURE
    # ============================================
    @action(detail=False, methods=['post'], url_path='delete-profile-picture', permission_classes=[IsAuthenticated])
    def delete_profile_picture(self, request):
        try:
            user = request.user

            if user.is_deleted:
                return Response({
                    'success': False,
                    'error': 'Account has been deleted'
                }, status=status.HTTP_403_FORBIDDEN)

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
        except Exception as e:
            logger.error(f"Delete profile picture error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ TRIP STATS (KEPT FOR BACKWARD COMPATIBILITY)
    # ============================================
    @action(detail=False, methods=['get'], url_path='trip-stats', permission_classes=[IsAuthenticated])
    def trip_stats(self, request):
        try:
            user = request.user

            if user.is_deleted:
                return Response({
                    'success': False,
                    'error': 'Account has been deleted'
                }, status=status.HTTP_403_FORBIDDEN)

            total_bookings = 0
            completed_bookings = 0
            pending_bookings = 0
            confirmed_bookings = 0

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
                logger.warning("Guides app not installed, returning 0 stats")
            except Exception as e:
                logger.error(f"Error fetching bookings: {e}")

            return Response({
                'success': True,
                'total_trips': total_bookings,
                'completed_trips': completed_bookings,
                'pending_trips': pending_bookings,
                'confirmed_trips': confirmed_bookings,
            })

        except Exception as e:
            logger.error(f"Trip stats error: {e}")
            return Response({
                'success': True,
                'total_trips': 0,
                'completed_trips': 0,
                'pending_trips': 0,
                'confirmed_trips': 0,
            })

    # ============================================
    # ✅ DELETE ACCOUNT
    # ============================================
    @action(detail=False, methods=['post'], url_path='delete-account', permission_classes=[IsAuthenticated])
    def delete_account(self, request):
        try:
            user = request.user
            password = request.data.get('password')

            if user.is_deleted:
                return Response({
                    'success': False,
                    'error': 'Account already deleted'
                }, status=status.HTTP_400_BAD_REQUEST)

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
        except Exception as e:
            logger.error(f"Delete account error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
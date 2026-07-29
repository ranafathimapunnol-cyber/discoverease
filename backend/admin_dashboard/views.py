# admin_dashboard/views.py - COMPLETE FIXED VERSION WITH ALL CRUD OPERATIONS

import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
import random
import string
import re

# ✅ Get User from Django's auth system
User = get_user_model()

# ✅ Import models
from guides.models import Guide, GuideBooking, District, GuideCategory
from suggestions.models import Suggestion
from destinations.models import Destination

# ✅ Import from admin_dashboard.models
from .models import AdminActivityLog

logger = logging.getLogger(__name__)


class AdminDashboardViewSet(viewsets.ViewSet):
    """Admin Dashboard Views - Full CRUD Operations"""
    permission_classes = [IsAuthenticated]

    def check_admin(self, request):
        """Check if user is admin"""
        user = request.user
        
        if not user.is_authenticated:
            return False
        
        # Get role
        role = None
        if hasattr(user, 'role'):
            role = user.role
        elif hasattr(user, 'get_role'):
            try:
                role = user.get_role()
            except:
                pass
        
        # Check all admin conditions
        is_admin = (
            user.is_superuser or 
            user.is_staff or 
            role in ['admin', 'staff']
        )
        
        return is_admin

    def _generate_unique_username(self, email):
        """Generate a unique username from email"""
        base = email.split('@')[0]
        base = re.sub(r'[^a-zA-Z0-9_]', '', base)
        if not base:
            base = 'user'
        
        username = base
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}_{counter}"
            counter += 1
        return username

    def _log_activity(self, request, action, model_name, object_id='', details=None):
        """Log admin activity"""
        try:
            AdminActivityLog.objects.create(
                admin=request.user,
                action=action,
                model_name=model_name,
                object_id=str(object_id),
                details=details or {}
            )
        except Exception as e:
            logger.error(f"Error logging activity: {e}")

    # ============================================
    # ✅ ADMIN STATS
    # ============================================
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Get admin dashboard stats"""
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            total_users = User.objects.filter(is_deleted=False).count()
            total_guides = User.objects.filter(role='guide', is_deleted=False).count()
            total_staff = User.objects.filter(role='staff', is_deleted=False).count()
            total_admins = User.objects.filter(role='admin', is_deleted=False).count()
            total_suggestions = Suggestion.objects.count()
            pending_suggestions = Suggestion.objects.filter(status='pending').count()
            implemented_suggestions = Suggestion.objects.filter(status='implemented').count()
            total_destinations = Destination.objects.count()

            return Response({
                'success': True,
                'data': {
                    'totalUsers': total_users,
                    'totalGuides': total_guides,
                    'totalStaff': total_staff,
                    'totalAdmins': total_admins,
                    'totalSuggestions': total_suggestions,
                    'pendingSuggestions': pending_suggestions,
                    'implementedSuggestions': implemented_suggestions,
                    'totalDestinations': total_destinations,
                }
            })

        except Exception as e:
            logger.error(f"Stats error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ TOURISTERS
    # ============================================
    @action(detail=False, methods=['get'], url_path='touristers')
    def touristers(self, request):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            users = User.objects.filter(role='tourister', is_deleted=False).order_by('-date_joined')
            data = []
            for user in users:
                data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': getattr(user, 'phone', ''),
                    'profile_image': user.profile_picture_upload.url if hasattr(user, 'profile_picture_upload') and user.profile_picture_upload else None,
                    'role': user.role,
                    'is_active': user.is_active,
                    'email_verified': user.email_verified,
                    'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                })
            return Response({'success': True, 'touristers': data, 'count': len(data)})
        except Exception as e:
            logger.error(f"Touristers error: {e}")
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='touristers/add')
    def add_tourister(self, request):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            email = request.data.get('email', '').strip().lower()
            password = request.data.get('password', '').strip()
            full_name = request.data.get('full_name', '').strip()
            phone = request.data.get('phone', '').strip()

            if not email:
                return Response({'success': False, 'error': 'Email is required'}, status=400)
            if not password or len(password) < 6:
                return Response({'success': False, 'error': 'Password must be at least 6 characters'}, status=400)
            if User.objects.filter(email=email).exists():
                return Response({'success': False, 'error': 'User with this email already exists'}, status=400)

            username = self._generate_unique_username(email)
            first_name = full_name.split()[0] if full_name else ''
            last_name = ' '.join(full_name.split()[1:]) if full_name else ''

            user = User.objects.create_user(
                email=email, username=username, password=password,
                first_name=first_name, last_name=last_name,
                role='tourister', is_active=True, email_verified=True,
            )
            if phone:
                user.phone = phone
                user.save()

            self._log_activity(request, 'create_tourister', 'User', user.id, {'email': user.email})
            return Response({
                'success': True,
                'message': 'Tourister added successfully',
                'data': {'id': user.id, 'email': user.email, 'role': user.role}
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Add tourister error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['patch'], url_path='touristers/(?P<user_id>[^/.]+)/update')
    def update_tourister(self, request, user_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            user = get_object_or_404(User, id=user_id, role='tourister', is_deleted=False)
            data = request.data

            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'phone' in data:
                user.phone = data['phone']
            if 'is_active' in data:
                user.is_active = bool(data['is_active'])
            if 'password' in data and data['password']:
                if len(data['password']) >= 6:
                    user.set_password(data['password'])
                else:
                    return Response({'success': False, 'error': 'Password must be at least 6 characters'}, status=400)
            user.save()

            self._log_activity(request, 'update_tourister', 'User', user.id, {'email': user.email})
            return Response({
                'success': True,
                'message': 'Tourister updated successfully',
                'data': {'id': user.id, 'email': user.email, 'is_active': user.is_active}
            })
        except Exception as e:
            logger.error(f"Update tourister error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['delete'], url_path='touristers/(?P<user_id>[^/.]+)/delete')
    def delete_tourister(self, request, user_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            user = get_object_or_404(User, id=user_id, role='tourister')
            if user == request.user:
                return Response({'success': False, 'error': 'Cannot delete yourself'}, status=400)

            # ✅ Hard delete - completely remove from database
            user.delete()
            
            self._log_activity(request, 'delete_tourister', 'User', user_id, {'user_id': user_id})
            return Response({'success': True, 'message': 'Tourister deleted successfully'})
        except Exception as e:
            logger.error(f"Delete tourister error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='touristers/(?P<user_id>[^/.]+)/toggle-status')
    def toggle_tourister_status(self, request, user_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            user = get_object_or_404(User, id=user_id, role='tourister')
            user.is_active = not user.is_active
            user.save()

            self._log_activity(request, 'toggle_tourister_status', 'User', user.id, {'is_active': user.is_active})
            return Response({
                'success': True,
                'message': f"Tourister {'activated' if user.is_active else 'deactivated'} successfully",
                'is_active': user.is_active
            })
        except Exception as e:
            logger.error(f"Toggle tourister status error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ STAFF
    # ============================================
    @action(detail=False, methods=['get'], url_path='staff')
    def staff_list(self, request):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            staff = User.objects.filter(role='staff', is_deleted=False).order_by('-date_joined')
            data = []
            for user in staff:
                data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': getattr(user, 'phone', ''),
                    'profile_image': user.profile_picture_upload.url if hasattr(user, 'profile_picture_upload') and user.profile_picture_upload else None,
                    'role': user.role,
                    'is_active': user.is_active,
                    'email_verified': user.email_verified,
                    'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                })
            return Response({'success': True, 'staff': data, 'count': len(data)})
        except Exception as e:
            logger.error(f"Staff list error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='staff/add')
    def add_staff(self, request):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            email = request.data.get('email', '').strip().lower()
            password = request.data.get('password', '').strip()
            full_name = request.data.get('full_name', '').strip()
            phone = request.data.get('phone', '').strip()

            if not email:
                return Response({'success': False, 'error': 'Email is required'}, status=400)
            if not password or len(password) < 6:
                return Response({'success': False, 'error': 'Password must be at least 6 characters'}, status=400)
            if User.objects.filter(email=email).exists():
                return Response({'success': False, 'error': 'User with this email already exists'}, status=400)

            username = self._generate_unique_username(email)
            first_name = full_name.split()[0] if full_name else ''
            last_name = ' '.join(full_name.split()[1:]) if full_name else ''

            user = User.objects.create_user(
                email=email, username=username, password=password,
                first_name=first_name, last_name=last_name,
                role='staff', is_active=True, email_verified=True, is_staff=True,
            )
            if phone:
                user.phone = phone
                user.save()

            self._log_activity(request, 'create_staff', 'User', user.id, {'email': user.email})
            return Response({
                'success': True,
                'message': 'Staff member added successfully',
                'data': {'id': user.id, 'email': user.email, 'role': user.role},
                'password': password
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Add staff error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['patch'], url_path='staff/(?P<staff_id>[^/.]+)/update')
    def update_staff(self, request, staff_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            user = get_object_or_404(User, id=staff_id, role='staff', is_deleted=False)
            data = request.data

            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'phone' in data:
                user.phone = data['phone']
            if 'is_active' in data:
                user.is_active = bool(data['is_active'])
            if 'password' in data and data['password']:
                if len(data['password']) >= 6:
                    user.set_password(data['password'])
                else:
                    return Response({'success': False, 'error': 'Password must be at least 6 characters'}, status=400)
            user.save()

            self._log_activity(request, 'update_staff', 'User', user.id, {'email': user.email})
            return Response({
                'success': True,
                'message': 'Staff member updated successfully',
                'data': {'id': user.id, 'email': user.email, 'is_active': user.is_active}
            })
        except Exception as e:
            logger.error(f"Update staff error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['delete'], url_path='staff/(?P<staff_id>[^/.]+)/delete')
    def delete_staff(self, request, staff_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            user = get_object_or_404(User, id=staff_id, role='staff')
            if user == request.user:
                return Response({'success': False, 'error': 'Cannot delete yourself'}, status=400)

            # ✅ Hard delete - completely remove from database
            user.delete()
            
            self._log_activity(request, 'delete_staff', 'User', staff_id, {'staff_id': staff_id})
            return Response({'success': True, 'message': 'Staff member deleted successfully'})
        except Exception as e:
            logger.error(f"Delete staff error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='staff/(?P<staff_id>[^/.]+)/toggle-status')
    def toggle_staff_status(self, request, staff_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            user = get_object_or_404(User, id=staff_id, role='staff')
            user.is_active = not user.is_active
            user.save()

            self._log_activity(request, 'toggle_staff_status', 'User', user.id, {'is_active': user.is_active})
            return Response({
                'success': True,
                'message': f"Staff member {'activated' if user.is_active else 'deactivated'} successfully",
                'is_active': user.is_active
            })
        except Exception as e:
            logger.error(f"Toggle staff status error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ GUIDES - COMPLETE FIXED
    # ============================================
    @action(detail=False, methods=['get'], url_path='guides')
    def guides_list(self, request):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            # ✅ Only get guides that are NOT deleted
            # Filter by user.is_deleted=False and guide.is_active=True
            guides = Guide.objects.filter(
                Q(user__is_deleted=False) | Q(user__isnull=True),
                is_active=True
            ).select_related('user', 'verified_by').order_by('-created_at')
            
            data = []
            for guide in guides:
                data.append({
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'email': guide.email,
                    'phone': guide.phone_number,
                    'bio': guide.bio,
                    'profile_image': guide.profile_image.url if guide.profile_image else None,
                    'primary_district': guide.districts.first().name if guide.districts.exists() else None,
                    'districts': [d.name for d in guide.districts.all()],
                    'categories': [c.name for c in guide.categories.all()],
                    'is_verified': guide.is_verified,
                    'verified_by': guide.verified_by.email if guide.verified_by else None,
                    'experience_years': guide.years_of_experience,
                    'languages': guide.languages,
                    'price_per_day': float(guide.price_per_day) if guide.price_per_day else 0,
                    'price_per_hour': float(guide.price_per_hour) if guide.price_per_hour else 0,
                    'rating': float(guide.rating) if guide.rating else 0,
                    'total_reviews': guide.total_reviews or 0,
                    'is_active': guide.is_active,
                    'created_at': guide.created_at.isoformat() if guide.created_at else None,
                })
            return Response({'success': True, 'guides': data, 'count': len(data)})
        except Exception as e:
            logger.error(f"Guides list error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='guides/add')
    def add_guide(self, request):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            data = request.data
            email = data.get('email', '').strip().lower()
            if not email:
                return Response({'success': False, 'error': 'Email is required'}, status=400)
            if User.objects.filter(email=email).exists():
                return Response({'success': False, 'error': 'User with this email already exists'}, status=400)

            password = data.get('password', '').strip()
            if not password:
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))

            full_name = data.get('full_name', '').strip()
            if not full_name:
                return Response({'success': False, 'error': 'Full name is required'}, status=400)

            first_name = full_name.split()[0] if full_name else ''
            last_name = ' '.join(full_name.split()[1:]) if full_name else ''
            username = self._generate_unique_username(email)

            user = User.objects.create_user(
                email=email, username=username, password=password,
                first_name=first_name, last_name=last_name,
                role='guide', is_active=True, email_verified=True,
            )

            phone = data.get('phone', '').strip()
            guide = Guide.objects.create(
                user=user, full_name=full_name, email=email,
                phone_number=phone, bio=data.get('bio', '').strip(),
                years_of_experience=int(data.get('experience_years', 0)),
                languages=data.get('languages', '').strip(),
                price_per_day=float(data.get('price_per_day', 0)),
                price_per_hour=float(data.get('price_per_hour', 0)),
                is_verified=True, is_active=True, verified_by=request.user,
            )

            district_name = data.get('primary_district', '').strip()
            if district_name:
                try:
                    district = District.objects.get(name=district_name)
                    guide.districts.add(district)
                except District.DoesNotExist:
                    pass

            self._log_activity(request, 'create_guide', 'Guide', guide.id, {'guide_name': guide.full_name})
            return Response({
                'success': True,
                'message': 'Guide added successfully',
                'password': password,
                'guide': {'id': guide.id, 'full_name': guide.full_name, 'email': guide.email}
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Add guide error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['patch'], url_path='guides/(?P<guide_id>[^/.]+)/update')
    def update_guide(self, request, guide_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            guide = get_object_or_404(Guide, id=guide_id)
            data = request.data

            if 'full_name' in data:
                guide.full_name = data['full_name'].strip()
                if guide.user:
                    name_parts = guide.full_name.split()
                    guide.user.first_name = name_parts[0] if name_parts else ''
                    guide.user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
                    guide.user.save()
            if 'phone' in data:
                guide.phone_number = data['phone'].strip()
            if 'bio' in data:
                guide.bio = data['bio'].strip()
            if 'experience_years' in data:
                guide.years_of_experience = int(data['experience_years'])
            if 'languages' in data:
                guide.languages = data['languages'].strip()
            if 'price_per_day' in data:
                guide.price_per_day = float(data['price_per_day'])
            if 'price_per_hour' in data:
                guide.price_per_hour = float(data['price_per_hour'])
            if 'is_verified' in data:
                guide.is_verified = bool(data['is_verified'])
            if 'is_active' in data:
                guide.is_active = bool(data['is_active'])
                if guide.user:
                    guide.user.is_active = guide.is_active
                    guide.user.save()
            if 'primary_district' in data and data['primary_district']:
                try:
                    district = District.objects.get(name=data['primary_district'])
                    guide.districts.clear()
                    guide.districts.add(district)
                except District.DoesNotExist:
                    pass

            guide.save()
            self._log_activity(request, 'update_guide', 'Guide', guide.id, {'guide_name': guide.full_name})
            return Response({
                'success': True,
                'message': 'Guide updated successfully',
                'guide': {'id': guide.id, 'full_name': guide.full_name, 'is_active': guide.is_active}
            })
        except Exception as e:
            logger.error(f"Update guide error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['delete'], url_path='guides/(?P<guide_id>[^/.]+)/delete')
    def delete_guide(self, request, guide_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            guide = get_object_or_404(Guide, id=guide_id)
            guide_name = guide.full_name
            
            # ✅ FIXED: Hard delete the guide from database
            # Also delete the associated user
            if guide.user:
                user = guide.user
                # Delete the user completely
                user.delete()
            
            # Delete the guide
            guide.delete()

            self._log_activity(request, 'delete_guide', 'Guide', guide_id, {'guide_name': guide_name})
            return Response({
                'success': True, 
                'message': f'Guide "{guide_name}" and associated user deleted successfully',
                'deleted': True,
                'guide_id': guide_id
            })
        except Exception as e:
            logger.error(f"Delete guide error: {e}")
            return Response({
                'success': False, 
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='guides/(?P<guide_id>[^/.]+)/upload-profile-pic')
    def upload_guide_profile_pic(self, request, guide_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            guide = get_object_or_404(Guide, id=guide_id)
            file = request.FILES.get('profile_image') or request.FILES.get('profile_picture') or request.FILES.get('image')
            if not file:
                return Response({'success': False, 'error': 'No image provided'}, status=400)
            if file.size > 5 * 1024 * 1024:
                return Response({'success': False, 'error': 'File size must be less than 5MB'}, status=400)
            if not file.content_type.startswith('image/'):
                return Response({'success': False, 'error': 'File must be an image'}, status=400)

            if guide.profile_image:
                try:
                    guide.profile_image.delete(save=False)
                except Exception:
                    pass

            guide.profile_image = file
            guide.save()

            self._log_activity(request, 'upload_guide_profile_pic', 'Guide', guide.id, {'guide_name': guide.full_name})
            return Response({
                'success': True,
                'message': 'Profile picture updated successfully',
                'profile_image': guide.profile_image.url if guide.profile_image else None
            })
        except Exception as e:
            logger.error(f"Upload guide profile pic error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='guides/(?P<guide_id>[^/.]+)/verify')
    def verify_guide(self, request, guide_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            guide = get_object_or_404(Guide, id=guide_id)
            guide.is_verified = True
            guide.verified_by = request.user
            guide.save()

            self._log_activity(request, 'verify_guide', 'Guide', guide.id, {'guide_name': guide.full_name})
            return Response({
                'success': True,
                'message': f'Guide "{guide.full_name}" verified successfully',
                'guide': {'id': guide.id, 'full_name': guide.full_name, 'is_verified': guide.is_verified}
            })
        except Exception as e:
            logger.error(f"Verify guide error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ SUGGESTIONS
    # ============================================
    @action(detail=False, methods=['get'], url_path='suggestions')
    def suggestions(self, request):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            suggestions = Suggestion.objects.all().order_by('-created_at')
            data = []
            for s in suggestions:
                image_url = None
                if s.image and hasattr(s.image, 'url'):
                    try:
                        image_url = s.image.url
                    except Exception:
                        image_url = None
                data.append({
                    'id': s.id,
                    'name': s.name,
                    'title': s.title or s.name,
                    'description': s.description,
                    'category': s.category,
                    'suggestion_type': s.suggestion_type,
                    'status': s.status,
                    'location_info': s.location_info,
                    'district': s.district,
                    'image': image_url,
                    'rating': s.rating,
                    'user_email': s.user.email if s.user else 'Anonymous',
                    'admin_notes': s.admin_notes,
                    'created_at': s.created_at.isoformat() if s.created_at else None,
                })
            return Response({'success': True, 'data': data, 'count': len(data)})
        except Exception as e:
            logger.error(f"Suggestions error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='suggestions/(?P<suggestion_id>[^/.]+)/approve')
    def approve_suggestion(self, request, suggestion_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            suggestion = get_object_or_404(Suggestion, id=suggestion_id)
            suggestion.status = 'approved'
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.admin_notes = request.data.get('notes', 'Approved by admin')
            suggestion.save()

            self._log_activity(request, 'approve_suggestion', 'Suggestion', suggestion.id, {'name': suggestion.name})
            return Response({
                'success': True,
                'message': 'Suggestion approved successfully',
                'data': {'id': suggestion.id, 'name': suggestion.name, 'status': suggestion.status}
            })
        except Exception as e:
            logger.error(f"Approve suggestion error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='suggestions/(?P<suggestion_id>[^/.]+)/reject')
    def reject_suggestion(self, request, suggestion_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            suggestion = get_object_or_404(Suggestion, id=suggestion_id)
            reason = request.data.get('reason', 'Rejected by admin')
            suggestion.status = 'rejected'
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.admin_notes = reason
            suggestion.rejection_reason = reason
            suggestion.save()

            self._log_activity(request, 'reject_suggestion', 'Suggestion', suggestion.id, {'name': suggestion.name})
            return Response({
                'success': True,
                'message': 'Suggestion rejected successfully',
                'data': {'id': suggestion.id, 'name': suggestion.name, 'status': suggestion.status}
            })
        except Exception as e:
            logger.error(f"Reject suggestion error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='suggestions/(?P<suggestion_id>[^/.]+)/implement')
    def implement_suggestion(self, request, suggestion_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            suggestion = get_object_or_404(Suggestion, id=suggestion_id)
            if suggestion.status == 'implemented':
                return Response({'success': False, 'error': 'Suggestion is already implemented'}, status=400)

            suggestion.status = 'implemented'
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.admin_notes = request.data.get('notes', 'Implemented by admin')
            suggestion.save()

            self._log_activity(request, 'implement_suggestion', 'Suggestion', suggestion.id, {'name': suggestion.name})
            return Response({
                'success': True,
                'message': 'Suggestion implemented successfully',
                'data': {'id': suggestion.id, 'name': suggestion.name, 'status': suggestion.status}
            })
        except Exception as e:
            logger.error(f"Implement suggestion error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['delete'], url_path='suggestions/(?P<suggestion_id>[^/.]+)/delete')
    def delete_suggestion(self, request, suggestion_id=None):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            suggestion = get_object_or_404(Suggestion, id=suggestion_id)
            suggestion.delete()
            self._log_activity(request, 'delete_suggestion', 'Suggestion', suggestion_id, {})
            return Response({'success': True, 'message': 'Suggestion deleted successfully'})
        except Exception as e:
            logger.error(f"Delete suggestion error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ ACTIVITY LOGS
    # ============================================
    @action(detail=False, methods=['get'], url_path='activity-logs')
    def activity_logs(self, request):
        if not self.check_admin(request):
            return Response({
                'success': False,
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            logs = AdminActivityLog.objects.all().order_by('-created_at')[:100]
            data = []
            for log in logs:
                data.append({
                    'id': log.id,
                    'admin': {'email': log.admin.email, 'username': log.admin.username},
                    'action': log.action,
                    'model_name': log.model_name,
                    'object_id': log.object_id,
                    'details': log.details,
                    'created_at': log.created_at.isoformat() if log.created_at else None,
                })
            return Response({'success': True, 'data': data, 'count': len(data)})
        except Exception as e:
            logger.error(f"Activity logs error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)
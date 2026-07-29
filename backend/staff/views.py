# staff/views.py - CLEANED VERSION (No Bookings)

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.contrib.auth import get_user_model
import random
import string
import logging
from datetime import datetime, timedelta
import re

from guides.models import Guide, District, GuideCategory, GuideAvailability
from suggestions.models import Suggestion

User = get_user_model()
logger = logging.getLogger(__name__)


class StaffViewSet(viewsets.ViewSet):
    """Staff Dashboard - Staff can manage guides and suggestions"""
    permission_classes = [IsAuthenticated]

    def _check_staff_access(self, request_or_user):
        if hasattr(request_or_user, 'user'):
            user = request_or_user.user
        else:
            user = request_or_user
        
        if hasattr(user, 'role') and user.role in ['staff', 'admin']:
            return True
        if user.is_staff or user.is_superuser:
            return True
        return False

    def _log_activity(self, request, action, model_name, object_id='', details=None):
        try:
            from .models import StaffActivityLog
            StaffActivityLog.objects.create(
                staff=request.user,
                action=action,
                model_name=model_name,
                object_id=str(object_id),
                details=details or {},
                ip_address=self._get_client_ip(request)
            )
        except Exception as e:
            logger.error(f"Error logging activity: {e}")

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')

    def _generate_unique_username(self, email):
        """Generate a unique username from email"""
        base = email.split('@')[0]
        base = re.sub(r'[^a-zA-Z0-9_]', '', base)
        if not base:
            base = 'guide'
        
        username = base
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}_{counter}"
            counter += 1
        return username

    # ============================================
    # STAFF STATS - /api/staff/stats/
    # ============================================
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            stats = {
                'pendingSuggestions': Suggestion.objects.filter(status='pending').count(),
                'totalSuggestions': Suggestion.objects.count(),
                'totalGuides': Guide.objects.filter(is_active=True).count(),
                'totalUsers': User.objects.filter(is_active=True).count(),
            }
            return Response({'success': True, 'stats': stats})
        except Exception as e:
            logger.error(f"Staff stats error: {e}")
            return Response({'success': True, 'stats': {
                'pendingSuggestions': 0,
                'totalSuggestions': 0,
                'totalGuides': 0,
                'totalUsers': 0,
            }})

    # ============================================
    # STAFF SUGGESTIONS - /api/staff/suggestions/
    # ============================================
    @action(detail=False, methods=['get'], url_path='suggestions')
    def suggestions(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            status_filter = request.query_params.get('status')
            
            if status_filter:
                suggestions = Suggestion.objects.filter(status=status_filter).order_by('-created_at')
            else:
                suggestions = Suggestion.objects.all().order_by('-created_at')
            
            data = []
            for s in suggestions.select_related('user', 'processed_by'):
                user_email = 'Anonymous'
                user_username = ''
                if s.user:
                    user_email = s.user.email
                    user_username = s.user.username
                
                processed_by_email = None
                if s.processed_by:
                    processed_by_email = s.processed_by.email
                
                image_url = None
                if s.image and hasattr(s.image, 'url'):
                    try:
                        image_url = s.image.url
                    except Exception as e:
                        logger.warning(f"Could not get image URL for suggestion {s.id}: {e}")
                        image_url = None
                
                data.append({
                    'id': s.id,
                    'name': s.name,
                    'title': s.name,
                    'description': s.description,
                    'category': s.category,
                    'suggestion_type': getattr(s, 'suggestion_type', 'general'),
                    'status': s.status,
                    'location_info': getattr(s, 'location_info', ''),
                    'district': getattr(s, 'district', ''),
                    'image': image_url,
                    'images': getattr(s, 'images', []),
                    'rating': getattr(s, 'rating', None),
                    'user': {
                        'email': user_email,
                        'username': user_username,
                    },
                    'user_email': user_email,
                    'admin_notes': s.admin_notes,
                    'guide_notes': s.guide_notes,
                    'processed_by': processed_by_email,
                    'processed_at': s.processed_at.isoformat() if s.processed_at else None,
                    'created_at': s.created_at.isoformat() if hasattr(s, 'created_at') else timezone.now().isoformat(),
                    'updated_at': s.updated_at.isoformat() if hasattr(s, 'updated_at') else timezone.now().isoformat(),
                })
            
            logger.info(f"✅ Staff suggestions: Found {len(data)} total")
            return Response({'success': True, 'suggestions': data})
            
        except Exception as e:
            logger.error(f"Error fetching staff suggestions: {e}")
            return Response({'success': True, 'suggestions': []})

    # ============================================
    # ✅ PROCESS SUGGESTION - /api/staff/suggestions/{id}/process/
    # ============================================
    @action(detail=False, methods=['post'], url_path='suggestions/(?P<suggestion_id>[^/.]+)/process')
    def process_suggestion_by_id(self, request, suggestion_id=None):
        """Process a suggestion by ID - URL: /api/staff/suggestions/{id}/process/"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            suggestion = get_object_or_404(Suggestion, id=suggestion_id)
            
            action = request.data.get('action')
            notes = request.data.get('notes', '')
            
            # Handle delete action
            if action == 'delete':
                suggestion.delete()
                self._log_activity(request, 'delete', 'Suggestion', suggestion_id, {
                    'suggestion_name': suggestion.name,
                    'suggestion_type': suggestion.suggestion_type
                })
                return Response({
                    'success': True,
                    'message': 'Suggestion deleted successfully'
                })
            
            valid_actions = ['approve', 'reject', 'implement']
            if action not in valid_actions:
                return Response({'error': 'Invalid action. Use approve, reject, implement, or delete'}, status=400)
            
            status_map = {
                'approve': 'approved',
                'reject': 'rejected',
                'implement': 'implemented'
            }
            
            suggestion.status = status_map[action]
            if notes:
                suggestion.admin_notes = notes
            else:
                suggestion.admin_notes = f"Processed by {request.user.email}"
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.save()
            
            self._log_activity(request, 'process', 'Suggestion', suggestion.id, {
                'action': action,
                'suggestion_name': suggestion.name,
                'suggestion_type': suggestion.suggestion_type
            })
            
            message = f'{suggestion.suggestion_type} {action}ed successfully'
            
            return Response({
                'success': True,
                'message': message,
                'suggestion': {
                    'id': suggestion.id,
                    'status': suggestion.status,
                    'suggestion_type': suggestion.suggestion_type,
                    'admin_notes': suggestion.admin_notes,
                    'processed_by': request.user.email,
                    'processed_at': suggestion.processed_at.isoformat()
                }
            })
            
        except Http404:
            return Response({'success': False, 'error': 'Suggestion not found'}, status=404)
        except Exception as e:
            logger.error(f"Error processing suggestion: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ LEGACY: PROCESS SUGGESTION - /api/staff/{pk}/process/
    # ============================================
    @action(detail=True, methods=['post'], url_path='process')
    def process_suggestion(self, request, pk=None):
        """Process a suggestion - URL: /api/staff/{pk}/process/"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            suggestion = get_object_or_404(Suggestion, id=pk)
            
            action = request.data.get('action')
            notes = request.data.get('notes', '')
            
            # Handle delete action
            if action == 'delete':
                suggestion.delete()
                self._log_activity(request, 'delete', 'Suggestion', pk, {
                    'suggestion_name': suggestion.name,
                    'suggestion_type': suggestion.suggestion_type
                })
                return Response({
                    'success': True,
                    'message': 'Suggestion deleted successfully'
                })
            
            valid_actions = ['approve', 'reject', 'implement']
            if action not in valid_actions:
                return Response({'error': 'Invalid action. Use approve, reject, implement, or delete'}, status=400)
            
            status_map = {
                'approve': 'approved',
                'reject': 'rejected',
                'implement': 'implemented'
            }
            
            suggestion.status = status_map[action]
            if notes:
                suggestion.admin_notes = notes
            else:
                suggestion.admin_notes = f"Processed by {request.user.email}"
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.save()
            
            self._log_activity(request, 'process', 'Suggestion', suggestion.id, {
                'action': action,
                'suggestion_name': suggestion.name,
                'suggestion_type': suggestion.suggestion_type
            })
            
            message = f'{suggestion.suggestion_type} {action}ed successfully'
            
            return Response({
                'success': True,
                'message': message,
                'suggestion': {
                    'id': suggestion.id,
                    'status': suggestion.status,
                    'suggestion_type': suggestion.suggestion_type,
                    'admin_notes': suggestion.admin_notes,
                    'processed_by': request.user.email,
                    'processed_at': suggestion.processed_at.isoformat()
                }
            })
            
        except Http404:
            return Response({'success': False, 'error': 'Suggestion not found'}, status=404)
        except Exception as e:
            logger.error(f"Error processing suggestion: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # STAFF GUIDES - /api/staff/guides/
    # ============================================
    @action(detail=False, methods=['get'], url_path='guides')
    def guides(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            guides = Guide.objects.filter(is_active=True).select_related('user', 'verified_by')
            data = []
            for guide in guides:
                data.append({
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'email': guide.email,
                    'phone_number': guide.phone_number,
                    'bio': guide.bio,
                    'profile_image': guide.profile_image.url if guide.profile_image else None,
                    'primary_district': guide.districts.first().name if guide.districts.exists() else None,
                    'districts': [d.name for d in guide.districts.all()],
                    'categories': [c.name for c in guide.categories.all()],
                    'is_verified': guide.is_verified,
                    'verified_by': guide.verified_by.first_name if guide.verified_by else None,
                    'experience_years': guide.years_of_experience,
                    'languages': guide.languages,
                    'price_per_day': float(guide.price_per_day),
                    'price_per_hour': float(guide.price_per_hour),
                    'rating': float(guide.rating),
                    'total_reviews': guide.total_reviews,
                    'is_active': guide.is_active,
                    'created_at': guide.created_at.isoformat(),
                })
            return Response({'success': True, 'guides': data})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ ADD GUIDE - /api/staff/guides/add/
    # ============================================
    @action(detail=False, methods=['post'], url_path='guides/add')
    def add_guide(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

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
                email=email,
                username=username,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='guide',
                is_active=True,
                email_verified=True,
            )

            phone = data.get('phone', '').strip()
            if phone and len(phone) > 12:
                user.delete()
                return Response({'success': False, 'error': 'Phone number must be 12 characters or less'}, status=400)

            guide = Guide.objects.create(
                user=user,
                full_name=full_name,
                email=email,
                phone_number=phone,
                bio=data.get('bio', '').strip(),
                years_of_experience=int(data.get('experience_years', 0)),
                languages=data.get('languages', '').strip(),
                price_per_day=float(data.get('price_per_day', 0)),
                price_per_hour=float(data.get('price_per_hour', 0)),
                is_verified=True,
                is_active=True,
                verified_by=request.user,
            )

            district_name = data.get('primary_district', '').strip()
            if not district_name:
                guide.delete()
                user.delete()
                return Response({'success': False, 'error': 'Please select a district for the guide.'}, status=400)

            try:
                district = District.objects.get(name=district_name)
                guide.districts.add(district)
            except District.DoesNotExist:
                guide.delete()
                user.delete()
                available = list(District.objects.values_list('name', flat=True))
                return Response({
                    'success': False,
                    'error': f"District '{district_name}' not found. Available: {', '.join(available)}"
                }, status=400)

            # Create availability slots
            guide.availabilities.all().delete()
            slots_added = 0
            for i in range(14):
                date = datetime.now().date() + timedelta(days=i)
                GuideAvailability.objects.create(
                    guide=guide,
                    date=date,
                    start_time="09:00",
                    end_time="13:00",
                    max_bookings=3,
                    current_bookings=0,
                    is_booked=False
                )
                slots_added += 1
                GuideAvailability.objects.create(
                    guide=guide,
                    date=date,
                    start_time="14:00",
                    end_time="18:00",
                    max_bookings=3,
                    current_bookings=0,
                    is_booked=False
                )
                slots_added += 1

            self._log_activity(request, 'create', 'Guide', guide.id, {
                'guide_name': guide.full_name,
                'guide_email': guide.email,
                'district': district_name
            })

            return Response({
                'success': True,
                'message': f'Guide added successfully to {district.name}!',
                'guide_id': guide.id,
                'user_id': user.id,
                'password': password,
                'is_verified': guide.is_verified,
                'slots_added': slots_added,
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'email': guide.email,
                    'phone_number': guide.phone_number,
                    'is_verified': guide.is_verified,
                    'primary_district': guide.districts.first().name if guide.districts.exists() else None,
                    'total_slots': guide.availabilities.count(),
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Add guide error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ UPDATE GUIDE - /api/staff/{pk}/update/
    # ============================================
    @action(detail=True, methods=['put', 'patch'], url_path='update')
    def update_guide(self, request, pk=None):
        """Update a guide - URL: /api/staff/{pk}/update/"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            guide = get_object_or_404(Guide, id=pk)
            data = request.data
            
            # Update basic fields
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
            
            # Update districts
            if 'primary_district' in data and data['primary_district']:
                try:
                    district = District.objects.get(name=data['primary_district'])
                    guide.districts.clear()
                    guide.districts.add(district)
                except District.DoesNotExist:
                    return Response({
                        'success': False,
                        'error': f"District '{data['primary_district']}' not found"
                    }, status=400)
            
            guide.save()
            
            self._log_activity(request, 'update', 'Guide', guide.id, {
                'guide_name': guide.full_name,
                'fields_updated': list(data.keys())
            })
            
            return Response({
                'success': True,
                'message': 'Guide updated successfully',
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'email': guide.email,
                    'phone_number': guide.phone_number,
                    'bio': guide.bio,
                    'profile_image': guide.profile_image.url if guide.profile_image else None,
                    'is_verified': guide.is_verified,
                    'experience_years': guide.years_of_experience,
                    'languages': guide.languages,
                    'price_per_day': float(guide.price_per_day),
                    'price_per_hour': float(guide.price_per_hour),
                    'primary_district': guide.districts.first().name if guide.districts.exists() else None,
                }
            })
            
        except Http404:
            return Response({'success': False, 'error': 'Guide not found'}, status=404)
        except Exception as e:
            logger.error(f"Error updating guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ UPLOAD GUIDE PROFILE PICTURE - /api/staff/{pk}/upload-profile-pic/
    # ============================================
    @action(detail=True, methods=['post'], url_path='upload-profile-pic')
    def upload_guide_profile_pic(self, request, pk=None):
        """Upload profile picture for a guide"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            guide = get_object_or_404(Guide, id=pk)
            
            # Check for file in multiple possible field names
            file = None
            if 'profile_image' in request.FILES:
                file = request.FILES['profile_image']
            elif 'profile_picture' in request.FILES:
                file = request.FILES['profile_picture']
            elif 'image' in request.FILES:
                file = request.FILES['image']
            
            if not file:
                return Response({
                    'success': False,
                    'error': 'No image provided. Please upload with field name "profile_image", "profile_picture", or "image".'
                }, status=400)
            
            # Validate file size (5MB max)
            if file.size > 5 * 1024 * 1024:
                return Response({
                    'success': False,
                    'error': 'File size must be less than 5MB'
                }, status=400)
            
            # Validate file type
            if not file.content_type.startswith('image/'):
                return Response({
                    'success': False,
                    'error': f'File must be an image. Got: {file.content_type}'
                }, status=400)
            
            # Delete old profile picture if exists
            if guide.profile_image:
                try:
                    guide.profile_image.delete(save=False)
                except Exception:
                    pass
            
            guide.profile_image = file
            guide.save()
            
            self._log_activity(request, 'upload_profile_pic', 'Guide', guide.id, {
                'guide_name': guide.full_name,
                'file_size': file.size,
                'content_type': file.content_type
            })
            
            return Response({
                'success': True,
                'message': 'Profile picture updated successfully',
                'profile_image': guide.profile_image.url if guide.profile_image else None
            })
            
        except Http404:
            return Response({'success': False, 'error': 'Guide not found'}, status=404)
        except Exception as e:
            logger.error(f"Error uploading profile picture: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ VERIFY GUIDE - /api/staff/{pk}/verify/
    # ============================================
    @action(detail=True, methods=['post'], url_path='verify')
    def verify_guide(self, request, pk=None):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            guide = get_object_or_404(Guide, id=pk)
            guide.is_verified = True
            guide.verified_by = request.user
            guide.save()
            
            self._log_activity(request, 'verify', 'Guide', guide.id, {
                'guide_name': guide.full_name,
                'verified_by': request.user.email
            })
            
            return Response({
                'success': True,
                'message': 'Guide verified successfully',
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'is_verified': guide.is_verified,
                }
            })
        except Http404:
            raise
        except Exception as e:
            logger.error(f"Error verifying guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ DELETE GUIDE - /api/staff/{pk}/delete/
    # ============================================
    @action(detail=True, methods=['post'], url_path='delete')
    def delete_guide(self, request, pk=None):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            guide = get_object_or_404(Guide, id=pk)
            guide_name = guide.full_name
            
            guide.is_active = False
            guide.save()
            
            if guide.user:
                guide.user.is_active = False
                guide.user.save()
            
            self._log_activity(request, 'delete', 'Guide', guide.id, {
                'guide_name': guide_name,
                'guide_email': guide.email
            })
            
            logger.info(f"✅ Guide deleted (deactivated): {guide_name} (ID: {guide.id}) by {request.user.email}")
            
            return Response({
                'success': True,
                'message': f'Guide "{guide_name}" has been deleted successfully.',
                'guide': {
                    'id': guide.id,
                    'full_name': guide_name,
                    'email': guide.email,
                    'is_active': False
                }
            })
            
        except Http404:
            return Response({
                'success': False,
                'error': 'Guide not found'
            }, status=404)
        except Exception as e:
            logger.error(f"Error deleting guide: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=400)
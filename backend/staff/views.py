# staff/views.py - COMPLETE FIXED VERSION

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

from guides.models import Guide, GuideBooking, District, GuideCategory, GuideAvailability
from suggestions.models import Suggestion

User = get_user_model()
logger = logging.getLogger(__name__)


class StaffViewSet(viewsets.ViewSet):
    """Staff Dashboard - Staff can manage guides"""
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

    # ============================================
    # STAFF STATS - /api/staff/stats/
    # ============================================
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            total_suggestions = Suggestion.objects.count()
            pending_suggestions = Suggestion.objects.filter(status='pending').count()
            
            stats = {
                'pendingSuggestions': pending_suggestions,
                'totalSuggestions': total_suggestions,
                'totalGuides': Guide.objects.filter(is_active=True).count(),
                'totalBookings': GuideBooking.objects.count(),
                'confirmedBookings': GuideBooking.objects.filter(status='confirmed').count(),
                'totalReviews': 0,
                'pendingReviews': 0,
                'totalUsers': User.objects.filter(is_active=True).count(),
            }
            return Response({'success': True, 'stats': stats})
        except Exception as e:
            logger.error(f"Staff stats error: {e}")
            return Response({'success': True, 'stats': {
                'pendingSuggestions': 0,
                'totalSuggestions': 0,
                'totalGuides': 0,
                'totalBookings': 0,
                'confirmedBookings': 0,
                'totalReviews': 0,
                'pendingReviews': 0,
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
                    'image': getattr(s, 'image', ''),
                    'images': getattr(s, 'images', []),
                    'rating': getattr(s, 'rating', None),
                    'user': {
                        'email': user_email,
                        'username': user_username,
                    },
                    'user_email': user_email,
                    'admin_notes': s.admin_notes,
                    'processed_by': processed_by_email,
                    'processed_at': s.processed_at.isoformat() if s.processed_at else None,
                    'created_at': s.created_at.isoformat() if hasattr(s, 'created_at') else timezone.now().isoformat(),
                    'updated_at': s.updated_at.isoformat() if hasattr(s, 'updated_at') else timezone.now().isoformat(),
                })
            
            logger.info(f"✅ Staff suggestions: Found {len(data)} total suggestions")
            return Response({'success': True, 'suggestions': data})
            
        except Exception as e:
            logger.error(f"Error fetching staff suggestions: {e}")
            return Response({'success': True, 'suggestions': []})

    # ============================================
    # PROCESS SUGGESTION - /api/staff/suggestions/{id}/process/
    # ============================================
    @action(detail=True, methods=['post'], url_path='process')
    def process_suggestion(self, request, pk=None):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            suggestion = get_object_or_404(Suggestion, id=pk)
            action = request.data.get('action')
            notes = request.data.get('notes', '')
            
            valid_actions = ['approve', 'reject', 'implement']
            if action not in valid_actions:
                return Response({'error': 'Invalid action'}, status=400)
            
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
                'suggestion_name': suggestion.name
            })
            
            if action == 'approve':
                message = 'Suggestion approved successfully'
            elif action == 'reject':
                message = 'Suggestion rejected successfully'
            elif action == 'implement':
                message = 'Suggestion implemented successfully'
            else:
                message = f'Suggestion {action}ed successfully'
            
            return Response({
                'success': True,
                'message': message,
                'suggestion': {
                    'id': suggestion.id,
                    'status': suggestion.status,
                    'admin_notes': suggestion.admin_notes,
                    'processed_by': request.user.email,
                    'processed_at': suggestion.processed_at.isoformat()
                }
            })
            
        except Http404:
            raise
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
    # ADD GUIDE - /api/staff/guides/add/
    # ============================================
    @action(detail=False, methods=['post'], url_path='guides/add')
    def add_guide(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            data = request.data
            email = data.get('email')
            
            if not email:
                return Response({'success': False, 'error': 'Email is required'}, status=400)

            if User.objects.filter(email=email).exists():
                return Response({'success': False, 'error': 'User with this email already exists'}, status=400)

            password = data.get('password')
            if not password:
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))

            full_name = data.get('full_name', '')
            first_name = full_name.split()[0] if full_name else ''
            last_name = ' '.join(full_name.split()[1:]) if full_name else ''

            user = User.objects.create_user(
                email=email,
                username=email.split('@')[0],
                password=password,
                first_name=first_name,
                last_name=last_name,
                role='guide',
                is_active=True,
                email_verified=True,
            )

            guide = Guide.objects.create(
                user=user,
                full_name=full_name or email.split('@')[0],
                email=email,
                phone_number=data.get('phone', ''),
                bio=data.get('bio', ''),
                years_of_experience=int(data.get('experience_years', 0)),
                languages=data.get('languages', ''),
                price_per_day=float(data.get('price_per_day', 0)),
                price_per_hour=float(data.get('price_per_hour', 0)),
                is_verified=data.get('is_verified', True),
                is_active=True,
                verified_by=request.user if data.get('is_verified', True) else None,
            )

            district_name = data.get('primary_district')
            if not district_name:
                return Response({'success': False, 'error': 'Please select a district for the guide.'}, status=400)

            try:
                district = District.objects.get(name__iexact=district_name)
                guide.districts.add(district)
            except District.DoesNotExist:
                available = list(District.objects.values_list('name', flat=True))
                return Response({
                    'success': False,
                    'error': f"District '{district_name}' not found. Available: {', '.join(available)}"
                }, status=400)

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
                    'is_verified': guide.is_verified,
                    'primary_district': guide.districts.first().name if guide.districts.exists() else None,
                    'total_slots': guide.availabilities.count(),
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # VERIFY GUIDE - /api/staff/guides/{id}/verify/
    # ============================================
    @action(detail=True, methods=['post'], url_path='guides/verify')
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
    # DELETE GUIDE - /api/staff/guides/{id}/delete/
    # ============================================
    @action(detail=True, methods=['delete'], url_path='guides/delete')
    def delete_guide(self, request, pk=None):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            guide = get_object_or_404(Guide, id=pk)
            guide.is_active = False
            guide.save()
            if guide.user:
                guide.user.is_active = False
                guide.user.save()
            
            self._log_activity(request, 'delete', 'Guide', guide.id, {
                'guide_name': guide.full_name
            })
            
            return Response({'success': True, 'message': 'Guide deleted successfully'})
        except Http404:
            raise
        except Exception as e:
            logger.error(f"Error deleting guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # STAFF BOOKINGS - /api/staff/bookings/
    # ============================================
    @action(detail=False, methods=['get'], url_path='bookings')
    def bookings(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            bookings = GuideBooking.objects.all().order_by('-created_at')
            data = []
            for booking in bookings.select_related('user', 'guide', 'district'):
                data.append({
                    'id': booking.id,
                    'booking_id': booking.booking_id,
                    'user': {'username': booking.user.username if booking.user else 'Anonymous'},
                    'traveler_email': booking.user.email if booking.user else '',
                    'guide': {'full_name': booking.guide.full_name if booking.guide else 'Unknown'},
                    'guide_name': booking.guide.full_name if booking.guide else 'Unknown',
                    'district': {'name': booking.district.name if booking.district else 'N/A'},
                    'date': booking.date.isoformat(),
                    'time': booking.time.strftime('%H:%M') if booking.time else 'N/A',
                    'status': booking.status,
                    'created_at': booking.created_at.isoformat(),
                })
            return Response({'success': True, 'bookings': data})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # UPDATE BOOKING - /api/staff/bookings/{id}/update/
    # ============================================
    @action(detail=True, methods=['post'], url_path='bookings/update')
    def update_booking(self, request, pk=None):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            booking = get_object_or_404(GuideBooking, id=pk)
            status_val = request.data.get('status')
            
            valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected']
            if status_val not in valid_statuses:
                return Response({'error': 'Invalid status'}, status=400)
            
            booking.status = status_val
            booking.save()
            
            self._log_activity(request, 'update', 'Booking', booking.id, {
                'booking_id': booking.booking_id,
                'new_status': status_val
            })
            
            return Response({
                'success': True,
                'message': f'Booking {status_val} successfully',
                'booking': {'id': booking.id, 'booking_id': booking.booking_id, 'status': booking.status}
            })
        except Http404:
            raise
        except Exception as e:
            logger.error(f"Error updating booking: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # STAFF INSIGHTS - /api/staff/insights/
    # ============================================
    @action(detail=False, methods=['get'], url_path='insights')
    def insights(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            recent_bookings = GuideBooking.objects.order_by('-created_at')[:5]
            recent_suggestions = Suggestion.objects.order_by('-created_at')[:5]
            recent_guides = Guide.objects.filter(is_active=True).order_by('-created_at')[:5]

            return Response({
                'success': True,
                'insights': {
                    'recent_bookings': [{'id': b.id, 'booking_id': b.booking_id, 'guide_name': b.guide.full_name if b.guide else 'Unknown', 'date': b.date.isoformat(), 'status': b.status} for b in recent_bookings],
                    'recent_suggestions': [{'id': s.id, 'name': s.name, 'status': s.status, 'created_at': s.created_at.isoformat()} for s in recent_suggestions],
                    'recent_guides': [{'id': g.id, 'full_name': g.full_name, 'is_verified': g.is_verified, 'created_at': g.created_at.isoformat()} for g in recent_guides],
                }
            })
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # STAFF REVIEWS - /api/staff/reviews/
    # ============================================
    @action(detail=False, methods=['get'], url_path='reviews')
    def staff_reviews(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            from guides.models import GuideReview
            reviews = GuideReview.objects.all().order_by('-created_at')
            data = [{
                'id': r.id,
                'user': {'username': r.user.username if r.user else 'Anonymous'},
                'rating': r.rating,
                'comment': r.comment,
                'review_text': r.comment,
                'is_approved': r.is_approved,
                'created_at': r.created_at.isoformat()
            } for r in reviews]
            return Response({'success': True, 'reviews': data})
        except ImportError:
            return Response({'success': True, 'reviews': []})
        except Exception as e:
            return Response({'success': True, 'reviews': []})

    # ============================================
    # STAFF NOTIFICATIONS
    # ============================================
    @action(detail=False, methods=['get'], url_path='notifications')
    def notifications(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            from .models import StaffNotification
            notifications = StaffNotification.objects.filter(
                staff=request.user
            ).order_by('-created_at')
            
            data = [{
                'id': n.id,
                'title': n.title,
                'message': n.message,
                'is_read': n.is_read,
                'link': n.link,
                'created_at': n.created_at.isoformat(),
            } for n in notifications]
            
            return Response({'success': True, 'notifications': data})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['get'], url_path='notifications/unread_count')
    def unread_count(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            from .models import StaffNotification
            count = StaffNotification.objects.filter(
                staff=request.user,
                is_read=False
            ).count()
            return Response({'success': True, 'count': count})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=True, methods=['post'], url_path='notifications/mark_read')
    def mark_notification_read(self, request, pk=None):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            from .models import StaffNotification
            notification = get_object_or_404(StaffNotification, id=pk, staff=request.user)
            notification.is_read = True
            notification.save()
            
            self._log_activity(request, 'update', 'Notification', notification.id, {
                'title': notification.title
            })
            
            return Response({'success': True, 'message': 'Notification marked as read'})
        except Http404:
            raise
        except Exception as e:
            logger.error(f"Error marking notification as read: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)
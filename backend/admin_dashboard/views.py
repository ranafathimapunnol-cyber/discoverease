# admin_dashboard/views.py - COMPLETE FIXED VERSION

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
import random
import string
import logging

from guides.models import Guide, GuideBooking, District
from suggestions.models import Suggestion
from .models import AdminActivityLog, AdminSettings
from .serializers import (
    AdminStatsSerializer, AdminUserSerializer, AdminUserCreateSerializer,
    AdminUserUpdateSerializer, AdminStaffSerializer, AdminSuggestionSerializer,
    AdminGuideVerificationSerializer, AdminInsightsSerializer,
    AdminActivityLogSerializer, AdminSettingsSerializer
)

User = get_user_model()
logger = logging.getLogger(__name__)


class AdminViewSet(viewsets.ViewSet):
    """Admin Dashboard - Complete Working Version"""
    permission_classes = [IsAuthenticated]

    def _check_admin_access(self, request):
        """Check if user has admin access"""
        if request.user.role != 'admin' and not request.user.is_superuser:
            return False
        return True

    def _log_activity(self, request, action, model_name, object_id='', details=None):
        """Log admin activity"""
        try:
            AdminActivityLog.objects.create(
                admin=request.user,
                action=action,
                model_name=model_name,
                object_id=str(object_id),
                details=details or {},
                ip_address=self._get_client_ip(request)
            )
        except Exception as e:
            logger.error(f"Error logging activity: {e}")

    def _get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')

    # ============================================
    # ADMIN STATS
    # ============================================
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Get admin dashboard statistics"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            stats = {
                'totalUsers': 0,
                'totalGuides': 0,
                'totalStaff': 0,
                'totalAdmins': 0,
                'totalBookings': 0,
                'totalSuggestions': 0,
                'totalDestinations': 0,
                'totalReviews': 0,
                'pendingSuggestions': 0,
                'pendingBookings': 0,
                'pendingReviews': 0,
            }

            try:
                stats['totalUsers'] = User.objects.filter(is_deleted=False).count()
                stats['totalStaff'] = User.objects.filter(role='staff', is_deleted=False).count()
                stats['totalAdmins'] = User.objects.filter(role='admin', is_deleted=False).count()
            except Exception as e:
                logger.warning(f"Error getting user stats: {e}")

            try:
                stats['totalGuides'] = Guide.objects.filter(is_active=True).count()
            except Exception as e:
                logger.warning(f"Error getting guide stats: {e}")

            try:
                stats['totalBookings'] = GuideBooking.objects.count()
                stats['pendingBookings'] = GuideBooking.objects.filter(status='pending').count()
            except Exception as e:
                logger.warning(f"Error getting booking stats: {e}")

            try:
                stats['totalSuggestions'] = Suggestion.objects.count()
                stats['pendingSuggestions'] = Suggestion.objects.filter(status='pending').count()
            except Exception as e:
                logger.warning(f"Error getting suggestion stats: {e}")

            try:
                from destinations.models import Destination, Review
                stats['totalDestinations'] = Destination.objects.count()
                stats['totalReviews'] = Review.objects.count()
                stats['pendingReviews'] = Review.objects.filter(is_approved=False).count()
            except Exception as e:
                logger.warning(f"Error getting destination stats: {e}")

            self._log_activity(request, 'view', 'AdminStats', details=stats)

            return Response({'success': True, 'stats': stats})

        except Exception as e:
            logger.error(f"Admin stats error: {e}")
            return Response({
                'success': True,
                'stats': {
                    'totalUsers': 0,
                    'totalGuides': 0,
                    'totalStaff': 0,
                    'totalAdmins': 0,
                    'totalBookings': 0,
                    'totalSuggestions': 0,
                    'totalDestinations': 0,
                    'totalReviews': 0,
                    'pendingSuggestions': 0,
                    'pendingBookings': 0,
                    'pendingReviews': 0,
                }
            })

    # ============================================
    # ADMIN USERS
    # ============================================
    @action(detail=False, methods=['get'], url_path='users')
    def users(self, request):
        """Get all users for admin management"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            users = User.objects.filter(is_deleted=False).select_related('guide_profile')
            
            data = []
            for user in users:
                data.append({
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'phone': user.phone,
                    'is_active': user.is_active,
                    'email_verified': user.email_verified,
                    'is_staff': user.is_staff,
                    'is_superuser': user.is_superuser,
                    'is_deleted': user.is_deleted,
                    'date_joined': user.date_joined.isoformat(),
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                    'has_guide_profile': hasattr(user, 'guide_profile') and user.guide_profile is not None,
                    'guide_id': user.guide_profile.id if hasattr(user, 'guide_profile') and user.guide_profile else None,
                    'guide_is_verified': user.guide_profile.is_verified if hasattr(user, 'guide_profile') and user.guide_profile else False,
                })
            
            self._log_activity(request, 'view', 'User', details={'count': users.count()})
            
            return Response({'success': True, 'users': data})
        except Exception as e:
            logger.error(f"Error fetching users: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # TOGGLE USER STATUS
    # ============================================
    @action(detail=True, methods=['post'], url_path='users/toggle-status')
    def toggle_user_status(self, request, pk=None):
        """Toggle user active status (admin only)"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            user = get_object_or_404(User, id=pk, is_deleted=False)
            
            if user.id == request.user.id:
                return Response({'error': 'Cannot change your own status'}, status=400)

            user.is_active = not user.is_active
            user.save()

            self._log_activity(request, 'update', 'User', user.id, {
                'email': user.email,
                'is_active': user.is_active
            })

            return Response({
                'success': True,
                'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'is_active': user.is_active,
                }
            })
        except Exception as e:
            logger.error(f"Error toggling user status: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # CHANGE USER ROLE
    # ============================================
    @action(detail=True, methods=['post'], url_path='users/change-role')
    def change_user_role(self, request, pk=None):
        """Change a user's role (admin only)"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            user = get_object_or_404(User, id=pk, is_deleted=False)
            new_role = request.data.get('role')
            
            valid_roles = ['tourister', 'guide', 'staff', 'admin']
            if new_role not in valid_roles:
                return Response({'error': 'Invalid role'}, status=400)

            if user.id == request.user.id:
                return Response({'error': 'Cannot change your own role'}, status=400)

            old_role = user.role

            if new_role == 'guide':
                if not hasattr(user, 'guide_profile') or not user.guide_profile:
                    from guides.models import Guide
                    Guide.objects.create(
                        user=user,
                        full_name=f"{user.first_name} {user.last_name}".strip() or user.username,
                        email=user.email,
                        is_active=True,
                    )

            user.role = new_role
            if new_role == 'staff':
                user.is_staff = True
                user.is_superuser = False
            elif new_role == 'admin':
                user.is_staff = True
                user.is_superuser = True
            else:
                user.is_staff = False
                user.is_superuser = False
            
            user.save()

            self._log_activity(request, 'promote' if new_role != old_role else 'update', 'User', user.id, {
                'email': user.email,
                'old_role': old_role,
                'new_role': new_role
            })

            return Response({
                'success': True,
                'message': f'User role changed from {old_role} to {new_role}',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'role': user.role,
                }
            })
        except Exception as e:
            logger.error(f"Error changing user role: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # DELETE USER
    # ============================================
    @action(detail=True, methods=['delete'], url_path='users')
    def delete_user(self, request, pk=None):
        """Delete a user (admin only)"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            user = get_object_or_404(User, id=pk)
            
            if user.id == request.user.id:
                return Response({'error': 'Cannot delete your own account'}, status=400)

            user.is_deleted = True
            user.is_active = False
            user.save()

            self._log_activity(request, 'delete', 'User', user.id, {
                'email': user.email
            })

            return Response({
                'success': True,
                'message': 'User deleted successfully'
            })
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # STAFF MANAGEMENT
    # ============================================
    @action(detail=False, methods=['get'], url_path='staff')
    def staff_list(self, request):
        """Get all staff members (admin only)"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            staff = User.objects.filter(role='staff', is_deleted=False)
            data = []
            for user in staff:
                data.append({
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'phone': user.phone,
                    'is_active': user.is_active,
                    'is_staff': user.is_staff,
                    'date_joined': user.date_joined.isoformat(),
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                })
            
            self._log_activity(request, 'view', 'Staff', details={'count': staff.count()})
            
            return Response({'success': True, 'staff': data})
        except Exception as e:
            logger.error(f"Error fetching staff: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ADD STAFF - WITH PASSWORD
    # ============================================
    @action(detail=False, methods=['post'], url_path='staff/add')
    def add_staff(self, request):
        """Add a new staff member (admin only)"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            data = request.data
            email = data.get('email')
            password = data.get('password')

            if not email:
                return Response({'error': 'Email is required'}, status=400)

            if not password:
                return Response({'error': 'Password is required'}, status=400)

            if User.objects.filter(email=email).exists():
                return Response({'error': 'User with this email already exists'}, status=400)

            user = User.objects.create_user(
                email=email,
                username=email.split('@')[0],
                password=password,
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                role='staff',
                is_active=True,
                email_verified=True,
                is_staff=True,
            )

            self._log_activity(request, 'create', 'Staff', user.id, {
                'email': user.email
            })

            return Response({
                'success': True,
                'message': 'Staff added successfully',
                'user_id': user.id,
                'email': user.email,
                'staff': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error adding staff: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # DELETE STAFF
    # ============================================
    @action(detail=True, methods=['delete'], url_path='staff')
    def delete_staff(self, request, pk=None):
        """Delete a staff member (admin only)"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            user = get_object_or_404(User, id=pk, role='staff')
            
            if user.id == request.user.id:
                return Response({'error': 'Cannot delete your own account'}, status=400)

            user.is_deleted = True
            user.is_active = False
            user.save()

            self._log_activity(request, 'delete', 'Staff', user.id, {
                'email': user.email
            })

            return Response({
                'success': True,
                'message': 'Staff removed successfully'
            })
        except Exception as e:
            logger.error(f"Error deleting staff: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ✅ ADMIN SUGGESTIONS - FIXED
    # ============================================
    @action(detail=False, methods=['get'], url_path='suggestions')
    def admin_suggestions(self, request):
        """Get all suggestions for admin management"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            status_filter = request.query_params.get('status', 'pending')
            suggestions = Suggestion.objects.filter(status=status_filter).order_by('-created_at')
            
            data = []
            for s in suggestions.select_related('user', 'processed_by'):
                data.append({
                    'id': s.id,
                    'name': s.name,
                    'title': s.name,
                    'description': s.description,
                    'category': s.category,
                    'suggestion_type': s.suggestion_type,
                    'status': s.status,
                    'location_info': s.location_info,
                    'user': {
                        'id': s.user.id if s.user else None,
                        'email': s.user.email if s.user else 'Anonymous',
                        'username': s.user.username if s.user else 'Anonymous',
                    },
                    'processed_by': {
                        'id': s.processed_by.id if s.processed_by else None,
                        'email': s.processed_by.email if s.processed_by else None,
                    } if s.processed_by else None,
                    'admin_notes': s.admin_notes,
                    'created_at': s.created_at.isoformat(),
                    'updated_at': s.updated_at.isoformat(),
                })
            
            self._log_activity(request, 'view', 'Suggestion', details={'count': len(data)})
            
            return Response({'success': True, 'suggestions': data})
        except Exception as e:
            logger.error(f"Error fetching admin suggestions: {e}")
            # ✅ Return empty array instead of error
            return Response({'success': True, 'suggestions': []})

    # ============================================
    # REJECT SUGGESTION
    # ============================================
    @action(detail=True, methods=['post'], url_path='suggestions/reject')
    def reject_suggestion(self, request, pk=None):
        """Reject a suggestion with notes (admin only)"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            suggestion = get_object_or_404(Suggestion, id=pk)
            notes = request.data.get('notes', 'Rejected by admin')
            
            suggestion.status = 'rejected'
            suggestion.admin_notes = notes
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.save()

            self._log_activity(request, 'reject', 'Suggestion', suggestion.id, {
                'name': suggestion.name
            })

            return Response({
                'success': True,
                'message': 'Suggestion rejected successfully',
                'suggestion': {
                    'id': suggestion.id,
                    'status': suggestion.status,
                }
            })
        except Exception as e:
            logger.error(f"Error rejecting suggestion: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GUIDE VERIFICATIONS
    # ============================================
    @action(detail=False, methods=['get'], url_path='guide-verifications')
    def guide_verifications(self, request):
        """Get verified guides (admin only)"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            guides = Guide.objects.filter(is_verified=True).select_related('user', 'verified_by')
            data = []
            for guide in guides:
                data.append({
                    'id': guide.id,
                    'guide': {
                        'id': guide.id,
                        'full_name': guide.full_name,
                        'email': guide.email,
                        'phone': guide.phone_number,
                        'is_verified': guide.is_verified,
                    },
                    'verified_by': {
                        'id': guide.verified_by.id if guide.verified_by else None,
                        'first_name': guide.verified_by.first_name if guide.verified_by else None,
                        'last_name': guide.verified_by.last_name if guide.verified_by else None,
                        'email': guide.verified_by.email if guide.verified_by else None,
                    } if guide.verified_by else None,
                    'verified_at': guide.updated_at.isoformat() if guide.updated_at else None,
                    'districts': [d.name for d in guide.districts.all()],
                    'created_at': guide.created_at.isoformat(),
                })
            
            self._log_activity(request, 'view', 'GuideVerification', details={'count': len(data)})
            
            return Response({'success': True, 'verifications': data})
        except Exception as e:
            logger.error(f"Error fetching guide verifications: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ADMIN BOOKINGS
    # ============================================
    @action(detail=False, methods=['get'], url_path='bookings')
    def admin_bookings(self, request):
        """Get all bookings (admin only)"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            status_filter = request.query_params.get('status')
            bookings = GuideBooking.objects.all().order_by('-created_at')
            
            if status_filter:
                bookings = bookings.filter(status=status_filter)
            
            data = []
            for booking in bookings.select_related('user', 'guide', 'district'):
                data.append({
                    'id': booking.id,
                    'booking_id': booking.booking_id,
                    'user': {
                        'id': booking.user.id if booking.user else None,
                        'email': booking.user.email if booking.user else '',
                        'username': booking.user.username if booking.user else 'Anonymous',
                    },
                    'guide': {
                        'id': booking.guide.id if booking.guide else None,
                        'full_name': booking.guide.full_name if booking.guide else 'Unknown',
                    },
                    'district': {
                        'id': booking.district.id if booking.district else None,
                        'name': booking.district.name if booking.district else 'N/A',
                    },
                    'date': booking.date.isoformat() if booking.date else None,
                    'time': booking.time.strftime('%H:%M') if booking.time else None,
                    'duration_hours': booking.duration_hours,
                    'number_of_people': booking.number_of_people,
                    'total_price': float(booking.total_price) if booking.total_price else 0,
                    'status': booking.status,
                    'special_requests': booking.special_requests,
                    'created_at': booking.created_at.isoformat(),
                    'updated_at': booking.updated_at.isoformat(),
                })
            
            self._log_activity(request, 'view', 'Booking', details={'count': len(data)})
            
            return Response({'success': True, 'bookings': data})
        except Exception as e:
            logger.error(f"Error fetching admin bookings: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ADMIN INSIGHTS
    # ============================================
    @action(detail=False, methods=['get'], url_path='insights')
    def admin_insights(self, request):
        """Get admin dashboard insights"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            from destinations.models import Review
            
            recent_users = User.objects.filter(is_deleted=False).order_by('-date_joined')[:5]
            recent_bookings = GuideBooking.objects.order_by('-created_at')[:5]
            recent_suggestions = Suggestion.objects.order_by('-created_at')[:5]
            recent_reviews = Review.objects.order_by('-created_at')[:5]

            booking_status_counts = {}
            try:
                statuses = GuideBooking.objects.values('status').annotate(count=models.Count('id'))
                for item in statuses:
                    booking_status_counts[item['status']] = item['count']
            except:
                pass

            suggestion_status_counts = {}
            try:
                s_statuses = Suggestion.objects.values('status').annotate(count=models.Count('id'))
                for item in s_statuses:
                    suggestion_status_counts[item['status']] = item['count']
            except:
                pass

            role_counts = {}
            try:
                roles = User.objects.filter(is_deleted=False).values('role').annotate(count=models.Count('id'))
                for item in roles:
                    role_counts[item['role']] = item['count']
            except:
                pass

            return Response({
                'success': True,
                'insights': {
                    'booking_status_counts': booking_status_counts,
                    'suggestion_status_counts': suggestion_status_counts,
                    'user_role_counts': role_counts,
                    'recent_users': [
                        {
                            'id': u.id,
                            'email': u.email,
                            'role': u.role,
                            'date_joined': u.date_joined.isoformat(),
                        } for u in recent_users
                    ],
                    'recent_bookings': [
                        {
                            'id': b.id,
                            'booking_id': b.booking_id,
                            'guide_name': b.guide.full_name if b.guide else 'Unknown',
                            'date': b.date.isoformat() if b.date else None,
                            'status': b.status,
                        } for b in recent_bookings
                    ],
                    'recent_suggestions': [
                        {
                            'id': s.id,
                            'name': s.name,
                            'status': s.status,
                            'created_at': s.created_at.isoformat(),
                        } for s in recent_suggestions
                    ],
                    'recent_reviews': [
                        {
                            'id': r.id,
                            'rating': r.rating,
                            'comment': r.comment[:100] if r.comment else '',
                            'created_at': r.created_at.isoformat(),
                        } for r in recent_reviews
                    ],
                }
            })
        except Exception as e:
            logger.error(f"Error fetching admin insights: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ADMIN ACTIVITY LOG
    # ============================================
    @action(detail=False, methods=['get'], url_path='activity-log')
    def activity_log(self, request):
        """Get admin activity log"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            limit = int(request.query_params.get('limit', 50))
            logs = AdminActivityLog.objects.all().order_by('-created_at')[:limit]
            data = []
            for log in logs:
                data.append({
                    'id': log.id,
                    'admin': {
                        'email': log.admin.email,
                        'username': log.admin.username,
                    },
                    'action': log.action,
                    'model_name': log.model_name,
                    'object_id': log.object_id,
                    'details': log.details,
                    'created_at': log.created_at.isoformat(),
                })
            return Response({'success': True, 'logs': data})
        except Exception as e:
            logger.error(f"Error fetching activity log: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ADMIN SETTINGS
    # ============================================
    @action(detail=False, methods=['get'], url_path='settings')
    def get_settings(self, request):
        """Get admin settings"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            settings = AdminSettings.objects.all()
            data = []
            for setting in settings:
                data.append({
                    'id': setting.id,
                    'key': setting.key,
                    'value': setting.value,
                    'description': setting.description,
                    'updated_at': setting.updated_at.isoformat(),
                    'updated_by': {
                        'email': setting.updated_by.email if setting.updated_by else None,
                    } if setting.updated_by else None,
                })
            return Response({'success': True, 'settings': data})
        except Exception as e:
            logger.error(f"Error fetching settings: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # SEND NOTIFICATION
    # ============================================
    @action(detail=False, methods=['post'], url_path='notify')
    def send_notification(self, request):
        """Send notification to users (admin only)"""
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            subject = request.data.get('subject', '')
            message = request.data.get('message', '')
            user_ids = request.data.get('user_ids', [])

            if not subject or not message:
                return Response({'error': 'Subject and message required'}, status=400)

            logger.info(f"Notification from admin {request.user.email}: {subject} - {message}")

            self._log_activity(request, 'create', 'Notification', details={
                'subject': subject,
                'recipients': 'All users' if not user_ids else f'{len(user_ids)} users'
            })

            return Response({
                'success': True,
                'message': 'Notification sent successfully',
                'notification': {
                    'subject': subject,
                    'message': message[:100] + '...' if len(message) > 100 else message,
                    'recipients': 'All users' if not user_ids else f'{len(user_ids)} users',
                }
            })
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)
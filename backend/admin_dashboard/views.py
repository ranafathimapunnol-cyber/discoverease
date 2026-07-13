# admin_dashboard/views.py - COMPLETE FIXED VERSION

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

# Try to import Suggestion model with fallback
try:
    from suggestions.models import Suggestion
    SUGGESTIONS_AVAILABLE = True
except ImportError:
    SUGGESTIONS_AVAILABLE = False
    Suggestion = None
    logger.warning("Suggestion model not available")


class AdminViewSet(viewsets.ViewSet):
    """Admin Dashboard - Complete Working Version"""
    permission_classes = [IsAuthenticated]

    def _check_admin_access(self, request):
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        return False

    # ============================================
    # GET /admin/stats/
    # ============================================
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            stats = {
                'totalUsers': User.objects.filter(role='tourister', is_deleted=False).count(),
                'totalStaff': User.objects.filter(role='staff', is_deleted=False).count(),
                'totalAdmins': User.objects.filter(role='admin', is_deleted=False).count(),
                'totalGuides': 0,
                'totalBookings': 0,
                'totalSuggestions': 0,
                'pendingSuggestions': 0,
                'pendingBookings': 0,
                'totalDestinations': 0,
                'totalReviews': 0,
                'pendingReviews': 0,
            }

            try:
                from guides.models import Guide
                stats['totalGuides'] = Guide.objects.filter(is_active=True).count()
            except:
                pass

            try:
                from guides.models import GuideBooking
                stats['totalBookings'] = GuideBooking.objects.count()
                stats['pendingBookings'] = GuideBooking.objects.filter(status='pending').count()
            except:
                pass

            try:
                if SUGGESTIONS_AVAILABLE and Suggestion is not None:
                    stats['totalSuggestions'] = Suggestion.objects.count()
                    stats['pendingSuggestions'] = Suggestion.objects.filter(status='pending').count()
            except:
                pass

            try:
                from destinations.models import Destination, Review
                stats['totalDestinations'] = Destination.objects.count()
                stats['totalReviews'] = Review.objects.count()
                stats['pendingReviews'] = Review.objects.filter(is_approved=False).count()
            except:
                pass

            return Response({'success': True, 'stats': stats})
        except Exception as e:
            logger.error(f"Admin stats error: {e}")
            return Response({
                'success': True,
                'stats': {
                    'totalUsers': 0,
                    'totalStaff': 0,
                    'totalAdmins': 0,
                    'totalGuides': 0,
                    'totalBookings': 0,
                    'totalSuggestions': 0,
                    'pendingSuggestions': 0,
                    'pendingBookings': 0,
                    'totalDestinations': 0,
                    'totalReviews': 0,
                    'pendingReviews': 0,
                }
            })

    # ============================================
    # GET /admin/users/
    # ============================================
    @action(detail=False, methods=['get'], url_path='users')
    def users(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            users = User.objects.filter(role='tourister', is_deleted=False)
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
                    'date_joined': user.date_joined.isoformat(),
                    'last_login': user.last_login.isoformat() if user.last_login else None,
                })
            return Response({'success': True, 'users': data})
        except Exception as e:
            logger.error(f"Error fetching users: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /admin/users/{id}/toggle-status/
    # ============================================
    @action(detail=True, methods=['post'], url_path='users/toggle-status')
    def toggle_user_status(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            user = get_object_or_404(User, id=pk, is_deleted=False)
            if user.id == request.user.id:
                return Response({'error': 'Cannot change your own status'}, status=400)

            new_status = request.data.get('is_active')
            if new_status is None:
                new_status = not user.is_active
            else:
                new_status = bool(new_status)

            user.is_active = new_status
            user.save()

            return Response({
                'success': True,
                'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
                'user': {'id': user.id, 'email': user.email, 'is_active': user.is_active}
            })
        except Exception as e:
            logger.error(f"Error toggling user status: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # DELETE /admin/users/{id}/
    # ============================================
    @action(detail=True, methods=['delete'], url_path='users')
    def delete_user(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            user = get_object_or_404(User, id=pk)
            if user.id == request.user.id:
                return Response({'error': 'Cannot delete your own account'}, status=400)

            user.is_deleted = True
            user.is_active = False
            user.save()

            return Response({'success': True, 'message': 'User deleted successfully'})
        except Exception as e:
            logger.error(f"Error deleting user: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GET /admin/staff/
    # ============================================
    @action(detail=False, methods=['get'], url_path='staff')
    def staff_list(self, request):
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
            return Response({'success': True, 'staff': data})
        except Exception as e:
            logger.error(f"Error fetching staff: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /admin/staff/add/
    # ============================================
    @action(detail=False, methods=['post'], url_path='staff/add')
    def add_staff(self, request):
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
    # POST /admin/staff/{id}/toggle-status/
    # ============================================
    @action(detail=True, methods=['post'], url_path='staff/toggle-status')
    def toggle_staff_status(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            user = get_object_or_404(User, id=pk, role='staff', is_deleted=False)
            if user.id == request.user.id:
                return Response({'error': 'Cannot change your own status'}, status=400)

            new_status = request.data.get('is_active')
            if new_status is None:
                new_status = not user.is_active
            else:
                new_status = bool(new_status)

            user.is_active = new_status
            user.save()

            return Response({
                'success': True,
                'message': f'Staff {"activated" if user.is_active else "deactivated"} successfully',
                'user': {'id': user.id, 'email': user.email, 'is_active': user.is_active}
            })
        except Exception as e:
            logger.error(f"Error toggling staff status: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # DELETE /admin/staff/{id}/
    # ============================================
    @action(detail=True, methods=['delete'], url_path='staff')
    def delete_staff(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            user = get_object_or_404(User, id=pk, role='staff')
            if user.id == request.user.id:
                return Response({'error': 'Cannot delete your own account'}, status=400)

            user.is_deleted = True
            user.is_active = False
            user.save()

            return Response({'success': True, 'message': 'Staff deleted successfully'})
        except Exception as e:
            logger.error(f"Error deleting staff: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GET /admin/guides/
    # ============================================
    @action(detail=False, methods=['get'], url_path='guides')
    def guides_list(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            from guides.models import Guide
            guides = Guide.objects.all().select_related('user')
            
            data = []
            for guide in guides:
                booking_count = 0
                try:
                    from guides.models import GuideBooking
                    booking_count = GuideBooking.objects.filter(guide=guide).count()
                except:
                    pass
                
                primary_district = None
                try:
                    if guide.districts.exists():
                        primary_district = guide.districts.first().name
                except:
                    primary_district = getattr(guide, 'primary_district', 'N/A')
                
                data.append({
                    'id': guide.id,
                    'user_id': guide.user.id if guide.user else None,
                    'full_name': guide.full_name,
                    'email': guide.email,
                    'phone': guide.phone_number,
                    'is_verified': guide.is_verified,
                    'is_active': guide.is_active,
                    'experience_years': guide.years_of_experience if hasattr(guide, 'years_of_experience') else 0,
                    'primary_district': primary_district or 'N/A',
                    'bio': guide.bio,
                    'languages': guide.languages,
                    'price_per_day': float(guide.price_per_day) if guide.price_per_day else 0,
                    'price_per_hour': float(guide.price_per_hour) if guide.price_per_hour else 0,
                    'booking_count': booking_count,
                    'created_at': guide.created_at.isoformat() if hasattr(guide, 'created_at') else timezone.now().isoformat(),
                    'updated_at': guide.updated_at.isoformat() if hasattr(guide, 'updated_at') else timezone.now().isoformat(),
                })
            
            return Response({'success': True, 'guides': data})
        except Exception as e:
            logger.error(f"Error fetching guides: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /admin/guides/add/ - FIXED
    # ============================================
    @action(detail=False, methods=['post'], url_path='guides/add')
    def add_guide(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            from guides.models import Guide, District
            
            data = request.data
            
            # Extract and convert data
            full_name = data.get('full_name', '').strip()
            email = data.get('email', '').strip()
            password = data.get('password', '')
            phone = data.get('phone', '').strip()
            bio = data.get('bio', '').strip()
            experience_years = int(data.get('experience_years', 0) or 0)
            languages = data.get('languages', '').strip()
            primary_district_name = data.get('primary_district', '').strip()
            price_per_day = float(data.get('price_per_day', 0) or 0)
            price_per_hour = float(data.get('price_per_hour', 0) or 0)
            is_verified = data.get('is_verified', True)
            is_active = data.get('is_active', True)

            # Validation
            if not full_name:
                return Response({'error': 'Full name is required'}, status=400)
            if not email:
                return Response({'error': 'Email is required'}, status=400)
            if not password:
                return Response({'error': 'Password is required'}, status=400)
            if User.objects.filter(email=email).exists():
                return Response({'error': 'User with this email already exists'}, status=400)

            # Create User
            user = User.objects.create_user(
                email=email,
                username=email.split('@')[0],
                password=password,
                first_name=full_name.split()[0] if full_name else '',
                last_name=' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else '',
                role='guide',
                is_active=is_active,
                email_verified=True,
            )

            # Create Guide
            guide = Guide.objects.create(
                user=user,
                full_name=full_name,
                email=email,
                phone_number=phone,
                bio=bio,
                years_of_experience=experience_years,
                languages=languages,
                price_per_day=price_per_day,
                price_per_hour=price_per_hour,
                is_verified=is_verified,
                is_active=is_active,
            )

            # Add district if provided
            if primary_district_name:
                try:
                    district = District.objects.filter(name__iexact=primary_district_name).first()
                    if district:
                        guide.districts.add(district)
                except Exception as e:
                    logger.warning(f"Could not add district: {e}")

            return Response({
                'success': True,
                'message': 'Guide added successfully',
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'email': guide.email,
                    'phone': guide.phone_number,
                    'is_verified': guide.is_verified,
                    'is_active': guide.is_active,
                    'primary_district': primary_district_name,
                    'experience_years': guide.years_of_experience,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error adding guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # PUT /admin/guides/{id}/
    # ============================================
    @action(detail=True, methods=['put'], url_path='guides')
    def update_guide(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            from guides.models import Guide, District
            guide = get_object_or_404(Guide, id=pk)
            data = request.data
            
            guide.full_name = data.get('full_name', guide.full_name)
            guide.phone_number = data.get('phone', guide.phone_number)
            guide.bio = data.get('bio', guide.bio)
            guide.years_of_experience = int(data.get('experience_years', guide.years_of_experience or 0))
            guide.languages = data.get('languages', guide.languages)
            guide.price_per_day = float(data.get('price_per_day', guide.price_per_day or 0))
            guide.price_per_hour = float(data.get('price_per_hour', guide.price_per_hour or 0))
            guide.is_verified = data.get('is_verified', guide.is_verified)
            guide.is_active = data.get('is_active', guide.is_active)
            guide.save()

            if primary_district_name := data.get('primary_district'):
                try:
                    district = District.objects.filter(name__iexact=primary_district_name).first()
                    if district:
                        guide.districts.clear()
                        guide.districts.add(district)
                except Exception as e:
                    logger.warning(f"Could not update district: {e}")

            if guide.user:
                guide.user.is_active = guide.is_active
                guide.user.save()

            return Response({
                'success': True,
                'message': 'Guide updated successfully',
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'email': guide.email,
                    'phone': guide.phone_number,
                    'is_verified': guide.is_verified,
                    'is_active': guide.is_active,
                }
            })

        except Exception as e:
            logger.error(f"Error updating guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GET /admin/guides/{id}/bookings/
    # ============================================
    @action(detail=True, methods=['get'], url_path='guides/bookings')
    def guide_bookings(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            from guides.models import Guide, GuideBooking
            guide = get_object_or_404(Guide, id=pk)
            bookings = GuideBooking.objects.filter(guide=guide).order_by('-created_at')
            
            data = []
            for booking in bookings.select_related('user', 'district'):
                data.append({
                    'id': booking.id,
                    'booking_id': booking.booking_id,
                    'traveler_email': booking.user.email if booking.user else '',
                    'traveler_name': f"{booking.user.first_name} {booking.user.last_name}".strip() if booking.user else '',
                    'date': booking.date.isoformat() if booking.date else None,
                    'time': booking.time.strftime('%H:%M') if booking.time else None,
                    'duration_hours': booking.duration_hours,
                    'number_of_people': booking.number_of_people,
                    'total_price': float(booking.total_price) if booking.total_price else 0,
                    'status': booking.status,
                    'destination': booking.special_requests or (booking.district.name if booking.district else ''),
                    'district': booking.district.name if booking.district else None,
                    'created_at': booking.created_at.isoformat(),
                })
            
            return Response({
                'success': True,
                'bookings': data,
                'guide_name': guide.full_name
            })

        except Exception as e:
            logger.error(f"Error fetching guide bookings: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /admin/guides/{id}/toggle-status/
    # ============================================
    @action(detail=True, methods=['post'], url_path='guides/toggle-status')
    def toggle_guide_status(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            from guides.models import Guide
            guide = get_object_or_404(Guide, id=pk)
            
            new_status = request.data.get('is_active')
            if new_status is None:
                new_status = not guide.is_active
            else:
                new_status = bool(new_status)

            guide.is_active = new_status
            guide.save()
            
            if guide.user:
                guide.user.is_active = new_status
                guide.user.save()

            return Response({
                'success': True,
                'message': f'Guide {"activated" if guide.is_active else "deactivated"} successfully',
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'is_active': guide.is_active,
                }
            })
        except Exception as e:
            logger.error(f"Error toggling guide status: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # DELETE /admin/guides/{id}/
    # ============================================
    @action(detail=True, methods=['delete'], url_path='guides')
    def delete_guide(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            from guides.models import Guide
            guide = get_object_or_404(Guide, id=pk)
            
            guide.is_active = False
            guide.save()
            
            if guide.user:
                guide.user.is_active = False
                guide.user.save()

            return Response({'success': True, 'message': 'Guide deleted successfully'})
        except Exception as e:
            logger.error(f"Error deleting guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /admin/guides/{id}/verify/
    # ============================================
    @action(detail=True, methods=['post'], url_path='guides/verify')
    def verify_guide(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            from guides.models import Guide
            guide = get_object_or_404(Guide, id=pk)
            
            guide.is_verified = True
            guide.save()

            return Response({
                'success': True,
                'message': 'Guide verified successfully',
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'is_verified': guide.is_verified,
                }
            })
        except Exception as e:
            logger.error(f"Error verifying guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GET /admin/suggestions/
    # ============================================
    @action(detail=False, methods=['get'], url_path='suggestions')
    def admin_suggestions(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            if not SUGGESTIONS_AVAILABLE or Suggestion is None:
                return Response({'success': True, 'suggestions': []})
            
            suggestions = Suggestion.objects.all().order_by('-created_at')
            
            data = []
            for s in suggestions:
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
                    } if s.user else None,
                    'user_email': s.user.email if s.user else 'Anonymous',
                    'admin_notes': s.admin_notes,
                    'created_at': s.created_at.isoformat() if hasattr(s, 'created_at') else timezone.now().isoformat(),
                    'updated_at': s.updated_at.isoformat() if hasattr(s, 'updated_at') else timezone.now().isoformat(),
                })
            
            return Response({'success': True, 'suggestions': data})
        except Exception as e:
            logger.error(f"Error fetching admin suggestions: {e}")
            return Response({'success': True, 'suggestions': []})

    # ============================================
    # POST /admin/suggestions/{id}/approve/
    # ============================================
    @action(detail=True, methods=['post'], url_path='suggestions/approve')
    def approve_suggestion(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            if not SUGGESTIONS_AVAILABLE or Suggestion is None:
                return Response({'success': False, 'error': 'Suggestions not available'}, status=400)
            
            suggestion = get_object_or_404(Suggestion, id=pk)
            notes = request.data.get('notes', 'Approved by admin')
            
            suggestion.status = 'approved'
            suggestion.admin_notes = notes
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.save()

            return Response({
                'success': True,
                'message': 'Suggestion approved successfully',
                'suggestion': {'id': suggestion.id, 'status': suggestion.status}
            })
        except Exception as e:
            logger.error(f"Error approving suggestion: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /admin/suggestions/{id}/reject/
    # ============================================
    @action(detail=True, methods=['post'], url_path='suggestions/reject')
    def reject_suggestion(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            if not SUGGESTIONS_AVAILABLE or Suggestion is None:
                return Response({'success': False, 'error': 'Suggestions not available'}, status=400)
            
            suggestion = get_object_or_404(Suggestion, id=pk)
            notes = request.data.get('notes', 'Rejected by admin')
            
            suggestion.status = 'rejected'
            suggestion.admin_notes = notes
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.save()

            return Response({
                'success': True,
                'message': 'Suggestion rejected successfully',
                'suggestion': {'id': suggestion.id, 'status': suggestion.status}
            })
        except Exception as e:
            logger.error(f"Error rejecting suggestion: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # DELETE /admin/suggestions/{id}/
    # ============================================
    @action(detail=True, methods=['delete'], url_path='suggestions')
    def delete_suggestion(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            if not SUGGESTIONS_AVAILABLE or Suggestion is None:
                return Response({'success': False, 'error': 'Suggestions not available'}, status=400)
            
            suggestion = get_object_or_404(Suggestion, id=pk)
            suggestion.delete()

            return Response({'success': True, 'message': 'Suggestion deleted successfully'})
        except Exception as e:
            logger.error(f"Error deleting suggestion: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GET /admin/bookings/
    # ============================================
    @action(detail=False, methods=['get'], url_path='bookings')
    def admin_bookings(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)

        try:
            from guides.models import GuideBooking
            bookings = GuideBooking.objects.all().order_by('-created_at')
            
            data = []
            for booking in bookings.select_related('user', 'guide', 'district'):
                data.append({
                    'id': booking.id,
                    'booking_id': booking.booking_id,
                    'user': {
                        'id': booking.user.id if booking.user else None,
                        'email': booking.user.email if booking.user else '',
                    },
                    'guide': {
                        'id': booking.guide.id if booking.guide else None,
                        'full_name': booking.guide.full_name if booking.guide else 'Unknown',
                    },
                    'date': booking.date.isoformat() if booking.date else None,
                    'time': booking.time.strftime('%H:%M') if booking.time else None,
                    'duration_hours': booking.duration_hours,
                    'number_of_people': booking.number_of_people,
                    'total_price': float(booking.total_price) if booking.total_price else 0,
                    'status': booking.status,
                    'special_requests': booking.special_requests,
                    'created_at': booking.created_at.isoformat(),
                })
            
            return Response({'success': True, 'bookings': data})
        except Exception as e:
            logger.error(f"Error fetching admin bookings: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GET /admin/test/
    # ============================================
    @action(detail=False, methods=['get'], url_path='test')
    def test(self, request):
        return Response({
            'success': True,
            'message': 'Admin API is working!',
            'user': request.user.email,
            'role': request.user.role,
            'timestamp': timezone.now().isoformat(),
        })
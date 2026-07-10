# staff/views.py - COMPLETE FIXED VERSION

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
from datetime import datetime, timedelta

from guides.models import Guide, GuideBooking, District, GuideCategory, GuideAvailability
from suggestions.models import Suggestion

User = get_user_model()
logger = logging.getLogger(__name__)


class StaffViewSet(viewsets.ViewSet):
    """Staff Dashboard - Staff can manage guides"""
    permission_classes = [IsAuthenticated]

    def _check_staff_access(self, request):
        """Check if user has staff or admin access"""
        if hasattr(request.user, 'role') and request.user.role in ['staff', 'admin']:
            return True
        if request.user.is_staff or request.user.is_superuser:
            return True
        return False

    def _log_activity(self, request, action, model_name, object_id='', details=None):
        """Log staff activity"""
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
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')

    # ============================================
    # STAFF STATS
    # ============================================
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Get staff dashboard statistics"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            stats = {
                'pendingSuggestions': 0,
                'totalGuides': 0,
                'totalBookings': 0,
                'confirmedBookings': 0,
                'totalReviews': 0,
                'pendingReviews': 0,
                'totalUsers': 0,
            }

            try:
                stats['pendingSuggestions'] = Suggestion.objects.filter(status='pending').count()
            except:
                pass

            try:
                stats['totalGuides'] = Guide.objects.filter(is_active=True).count()
            except:
                pass

            try:
                stats['totalBookings'] = GuideBooking.objects.count()
                stats['confirmedBookings'] = GuideBooking.objects.filter(status='confirmed').count()
            except:
                pass

            return Response({'success': True, 'stats': stats})
        except Exception as e:
            logger.error(f"Staff stats error: {e}")
            return Response({'success': True, 'stats': {
                'pendingSuggestions': 0,
                'totalGuides': 0,
                'totalBookings': 0,
                'confirmedBookings': 0,
                'totalReviews': 0,
                'pendingReviews': 0,
                'totalUsers': 0,
            }})

    # ============================================
    # STAFF GUIDES
    # ============================================
    @action(detail=False, methods=['get'], url_path='guides')
    def guides(self, request):
        """Get all guides for staff management"""
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
            logger.error(f"Error fetching guides: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ADD GUIDE - FIXED: Each guide gets their own slots
    # ============================================
    @action(detail=False, methods=['post'], url_path='guides/add')
    def add_guide(self, request):
        """Add a new guide - each guide gets their own slots"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            data = request.data
            email = data.get('email')
            
            if not email:
                return Response({'error': 'Email is required'}, status=400)

            if User.objects.filter(email=email).exists():
                return Response({'error': 'User with this email already exists'}, status=400)

            password = data.get('password')
            if not password:
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))

            full_name = data.get('full_name', '')
            first_name = full_name.split()[0] if full_name else ''
            last_name = ' '.join(full_name.split()[1:]) if full_name else ''

            # Create user
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

            # Create guide profile
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
                is_verified=True,
                is_active=True,
                verified_by=request.user,
            )

            print(f"✅ Guide created: {guide.full_name} (ID: {guide.id})")

            # Handle district
            district_name = data.get('primary_district')
            if not district_name:
                return Response({
                    'success': False,
                    'error': 'Please select a district for the guide.'
                }, status=400)

            try:
                district = District.objects.get(name__iexact=district_name)
                guide.districts.add(district)
                print(f"✅ Added district: {district.name}")
            except District.DoesNotExist:
                available = list(District.objects.values_list('name', flat=True))
                return Response({
                    'success': False,
                    'error': f"District '{district_name}' not found. Available: {', '.join(available)}"
                }, status=400)

            # ✅ IMPORTANT: Clear any existing slots for this guide
            deleted_count = guide.availabilities.all().delete()
            print(f"🗑️ Cleared {deleted_count[0]} existing slots for {guide.full_name}")

            # ✅ Add fresh slots - ONLY FOR THIS SPECIFIC GUIDE
            slots_added = 0
            for i in range(14):
                date = datetime.now().date() + timedelta(days=i)
                
                # Morning slot
                slot = GuideAvailability.objects.create(
                    guide=guide,  # ✅ THIS GUIDE ONLY
                    date=date,
                    start_time="09:00",
                    end_time="13:00",
                    max_bookings=3,
                    current_bookings=0,
                    is_booked=False
                )
                slots_added += 1
                print(f"  ✅ Added morning slot for {date} to guide ID {guide.id}")
                
                # Afternoon slot
                slot2 = GuideAvailability.objects.create(
                    guide=guide,  # ✅ THIS GUIDE ONLY
                    date=date,
                    start_time="14:00",
                    end_time="18:00",
                    max_bookings=3,
                    current_bookings=0,
                    is_booked=False
                )
                slots_added += 1
                print(f"  ✅ Added afternoon slot for {date} to guide ID {guide.id}")

            print(f"✅ Added {slots_added} total slots for guide: {guide.full_name}")

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
            logger.error(f"Error adding guide: {e}")
            print(f"❌ ERROR: {str(e)}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # VERIFY GUIDE
    # ============================================
    @action(detail=True, methods=['post'], url_path='guides/verify')
    def verify_guide(self, request, pk=None):
        """Verify a guide (Staff & Admin)"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            guide = get_object_or_404(Guide, id=pk)
            guide.is_verified = True
            guide.verified_by = request.user
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
    # DELETE GUIDE
    # ============================================
    @action(detail=True, methods=['delete'], url_path='guides')
    def delete_guide(self, request, pk=None):
        """Delete a guide (Staff & Admin)"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            guide = get_object_or_404(Guide, id=pk)
            guide.is_active = False
            guide.save()
            
            if guide.user:
                guide.user.is_active = False
                guide.user.save()
            
            return Response({
                'success': True,
                'message': 'Guide deleted successfully'
            })
        except Exception as e:
            logger.error(f"Error deleting guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # STAFF BOOKINGS
    # ============================================
    @action(detail=False, methods=['get'], url_path='bookings')
    def bookings(self, request):
        """Get all bookings for staff management"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            bookings = GuideBooking.objects.all().order_by('-created_at')
            data = []
            for booking in bookings.select_related('user', 'guide', 'district'):
                data.append({
                    'id': booking.id,
                    'booking_id': booking.booking_id,
                    'user': {
                        'username': booking.user.username if booking.user else 'Anonymous',
                    },
                    'traveler_email': booking.user.email if booking.user else '',
                    'guide': {
                        'full_name': booking.guide.full_name if booking.guide else 'Unknown'
                    },
                    'guide_name': booking.guide.full_name if booking.guide else 'Unknown',
                    'district': {
                        'name': booking.district.name if booking.district else 'N/A'
                    },
                    'date': booking.date.isoformat(),
                    'time': booking.time.strftime('%H:%M') if booking.time else 'N/A',
                    'status': booking.status,
                    'created_at': booking.created_at.isoformat(),
                })
            return Response({'success': True, 'bookings': data})
        except Exception as e:
            logger.error(f"Error fetching bookings: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # UPDATE BOOKING STATUS
    # ============================================
    @action(detail=True, methods=['post'], url_path='bookings/update')
    def update_booking(self, request, pk=None):
        """Update booking status (Staff & Admin)"""
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
            
            return Response({
                'success': True,
                'message': f'Booking {status_val} successfully',
                'booking': {
                    'id': booking.id,
                    'booking_id': booking.booking_id,
                    'status': booking.status,
                }
            })
        except Exception as e:
            logger.error(f"Error updating booking: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # STAFF SUGGESTIONS
    # ============================================
    @action(detail=False, methods=['get'], url_path='suggestions')
    def suggestions(self, request):
        """Get suggestions for staff management"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

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
                        'email': s.user.email if s.user else 'Anonymous',
                    },
                    'admin_notes': s.admin_notes,
                    'created_at': s.created_at.isoformat(),
                })
            return Response({'success': True, 'suggestions': data})
        except Exception as e:
            logger.error(f"Error fetching suggestions: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # PROCESS SUGGESTION
    # ============================================
    @action(detail=True, methods=['post'], url_path='suggestions/process')
    def process_suggestion(self, request, pk=None):
        """Process a suggestion (Staff & Admin)"""
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
            suggestion.admin_notes = notes
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.save()
            
            return Response({
                'success': True,
                'message': f'Suggestion {action}ed successfully',
                'suggestion': {
                    'id': suggestion.id,
                    'status': suggestion.status,
                }
            })
        except Exception as e:
            logger.error(f"Error processing suggestion: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # STAFF INSIGHTS
    # ============================================
    @action(detail=False, methods=['get'], url_path='insights')
    def insights(self, request):
        """Get staff dashboard insights"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            recent_bookings = GuideBooking.objects.order_by('-created_at')[:5]
            recent_suggestions = Suggestion.objects.order_by('-created_at')[:5]
            recent_guides = Guide.objects.filter(is_active=True).order_by('-created_at')[:5]

            return Response({
                'success': True,
                'insights': {
                    'recent_bookings': [
                        {
                            'id': b.id,
                            'booking_id': b.booking_id,
                            'guide_name': b.guide.full_name if b.guide else 'Unknown',
                            'date': b.date.isoformat(),
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
                    'recent_guides': [
                        {
                            'id': g.id,
                            'full_name': g.full_name,
                            'is_verified': g.is_verified,
                            'created_at': g.created_at.isoformat(),
                        } for g in recent_guides
                    ],
                }
            })
        except Exception as e:
            logger.error(f"Error fetching insights: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # STAFF REVIEWS
    # ============================================
    @action(detail=False, methods=['get'], url_path='reviews')
    def staff_reviews(self, request):
        """Get reviews for staff management"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            try:
                from destinations.models import Review
                reviews = Review.objects.all().order_by('-created_at')
                data = []
                for review in reviews:
                    data.append({
                        'id': review.id,
                        'user': {
                            'username': review.user.username if review.user else 'Anonymous',
                        },
                        'rating': review.rating,
                        'comment': review.comment,
                        'review_text': review.comment,
                        'is_approved': getattr(review, 'is_approved', False),
                        'created_at': review.created_at.isoformat(),
                    })
                return Response({'success': True, 'reviews': data})
            except ImportError:
                return Response({'success': True, 'reviews': []})
        except Exception as e:
            logger.error(f"Error fetching reviews: {e}")
            return Response({'success': True, 'reviews': []})
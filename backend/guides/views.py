# guides/views.py - COMPLETE FIXED VERSION

from django.db.models import Q, Avg
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta
from decimal import Decimal
import logging
from .models import (
    District, GuideCategory, Guide, GuideAvailability, 
    GuideBooking, GuideReview
)
from .serializers import (
    DistrictSerializer, GuideCategorySerializer, GuideListSerializer,
    GuideDetailSerializer, GuideAvailabilitySerializer, 
    BookingCreateSerializer, BookingListSerializer, 
    BookingDetailSerializer, BookingUpdateSerializer,
    GuideReviewSerializer, GuideReviewCreateSerializer
)

logger = logging.getLogger(__name__)


class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing districts"""
    queryset = District.objects.filter(is_active=True)
    serializer_class = DistrictSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'code', 'description']

    @action(detail=True, methods=['get'])
    def guides(self, request, pk=None):
        """Get all guides for a specific district"""
        district = self.get_object()
        guides = Guide.objects.filter(
            districts=district,
            is_active=True,
            is_verified=True
        )
        serializer = GuideListSerializer(guides, many=True)
        return Response(serializer.data)


class GuideCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing guide categories"""
    queryset = GuideCategory.objects.filter(is_active=True)
    serializer_class = GuideCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class GuideViewSet(viewsets.ModelViewSet):
    """Complete Guide ViewSet with Dashboard Endpoints"""
    queryset = Guide.objects.filter(is_active=True, is_verified=True)
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['districts', 'categories', 'is_available']
    search_fields = ['full_name', 'bio', 'languages']
    ordering_fields = ['rating', 'price_per_day', 'years_of_experience']
    ordering = ['-rating']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GuideDetailSerializer
        return GuideListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        date = self.request.query_params.get('date')
        if date:
            available_guides = GuideAvailability.objects.filter(
                date=date,
                is_booked=False
            ).values_list('guide_id', flat=True)
            queryset = queryset.filter(id__in=available_guides)
        
        district_id = self.request.query_params.get('district')
        if district_id:
            queryset = queryset.filter(districts__id=district_id)
        
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(categories__id=category_id)
        
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price_per_day__gte=min_price)
        if max_price:
            queryset = queryset.filter(price_per_day__lte=max_price)
        
        language = self.request.query_params.get('language')
        if language:
            queryset = queryset.filter(languages__icontains=language)
        
        return queryset

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        """Get availability for a specific guide"""
        guide = self.get_object()
        date = request.query_params.get('date')
        days = int(request.query_params.get('days', 7))
        
        if not date:
            start_date = datetime.now().date()
            end_date = start_date + timedelta(days=days)
            availabilities = guide.availabilities.filter(
                date__range=[start_date, end_date]
            )
        else:
            availabilities = guide.availabilities.filter(date=date)
        
        serializer = GuideAvailabilitySerializer(availabilities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def available_by_district(self, request):
        """Get available guides for a specific district with filters"""
        district_id = request.query_params.get('district_id')
        category_id = request.query_params.get('category_id')
        date = request.query_params.get('date')
        
        if not district_id:
            return Response(
                {'error': 'district_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(districts__id=district_id)
        
        if category_id:
            queryset = queryset.filter(categories__id=category_id)
        
        if date:
            available_guides = GuideAvailability.objects.filter(
                date=date,
                is_booked=False
            ).values_list('guide_id', flat=True)
            queryset = queryset.filter(id__in=available_guides)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # ============================================
    # ✅ GUIDE DASHBOARD ENDPOINTS
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='profile', permission_classes=[IsAuthenticated])
    def guide_profile(self, request):
        """Get guide profile for dashboard"""
        try:
            guide = Guide.objects.get(user=request.user)
            return Response({
                'success': True,
                'profile': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'email': guide.email,
                    'phone': guide.phone_number,
                    'bio': guide.bio,
                    'experience_years': guide.years_of_experience,
                    'languages': guide.languages,
                    'rating': float(guide.rating),
                    'total_reviews': guide.total_reviews,
                    'is_verified': guide.is_verified,
                    'primary_district': guide.districts.first().name if guide.districts.exists() else None,
                    'profile_image': guide.profile_image.url if guide.profile_image else None,
                    'price_per_day': float(guide.price_per_day),
                    'price_per_hour': float(guide.price_per_hour),
                    'specialties': [c.name for c in guide.categories.all()],
                }
            })
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['get'], url_path='stats', permission_classes=[IsAuthenticated])
    def guide_stats(self, request):
        """Get guide dashboard stats"""
        try:
            guide = Guide.objects.get(user=request.user)
            
            bookings = GuideBooking.objects.filter(guide=guide)
            reviews = GuideReview.objects.filter(guide=guide)
            
            stats = {
                'totalBookings': bookings.count(),
                'pendingBookings': bookings.filter(status='pending').count(),
                'confirmedBookings': bookings.filter(status='confirmed').count(),
                'completedBookings': bookings.filter(status='completed').count(),
                'totalReviews': reviews.count(),
                'pendingReviews': reviews.filter(is_approved=False).count(),
                'rating': float(guide.rating),
            }
            return Response({'success': True, 'stats': stats})
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['get'], url_path='bookings', permission_classes=[IsAuthenticated])
    def guide_bookings(self, request):
        """Get guide's bookings"""
        try:
            guide = Guide.objects.get(user=request.user)
            status_filter = request.query_params.get('status')
            
            bookings = GuideBooking.objects.filter(guide=guide)
            if status_filter:
                bookings = bookings.filter(status=status_filter)
            
            data = []
            for booking in bookings.order_by('-created_at'):
                data.append({
                    'id': booking.id,
                    'booking_id': booking.booking_id,
                    'user': {
                        'username': booking.user.username if booking.user else 'Anonymous',
                        'email': booking.user.email if booking.user else '',
                    },
                    'traveler_email': booking.user.email if booking.user else '',
                    'guide_name': booking.guide.full_name if booking.guide else 'Unknown',
                    'district': {
                        'name': booking.district.name if booking.district else 'N/A'
                    },
                    'date': booking.date.isoformat(),
                    'time': booking.time.strftime('%H:%M'),
                    'status': booking.status,
                    'created_at': booking.created_at.isoformat(),
                })
            return Response({'success': True, 'bookings': data})
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['get'], url_path='availability', permission_classes=[IsAuthenticated])
    def guide_availability(self, request):
        """Get guide's availability slots - ONLY for this guide"""
        try:
            guide = Guide.objects.get(user=request.user)
            availability = GuideAvailability.objects.filter(guide=guide).order_by('date', 'start_time')
            
            data = []
            for slot in availability:
                data.append({
                    'id': slot.id,
                    'date': slot.date.isoformat(),
                    'start_time': slot.start_time.strftime('%H:%M'),
                    'end_time': slot.end_time.strftime('%H:%M'),
                    'is_booked': slot.is_booked,
                    'max_bookings': slot.max_bookings,
                    'current_bookings': slot.current_bookings,
                })
            return Response({'success': True, 'availability': data})
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='availability/add', permission_classes=[IsAuthenticated])
    def guide_add_availability(self, request):
        """Add availability slot - ONLY for this guide"""
        try:
            guide = Guide.objects.get(user=request.user)
            
            data = request.data
            date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
            start_time = datetime.strptime(data.get('start_time'), '%H:%M').time()
            end_time = datetime.strptime(data.get('end_time'), '%H:%M').time()
            
            # Check if slot already exists for THIS guide
            existing = GuideAvailability.objects.filter(
                guide=guide,
                date=date,
                start_time=start_time
            ).first()
            
            if existing:
                return Response({
                    'success': False,
                    'error': 'Slot already exists for this date and time'
                }, status=400)
            
            # Create slot for THIS guide only
            slot = GuideAvailability.objects.create(
                guide=guide,
                date=date,
                start_time=start_time,
                end_time=end_time,
                max_bookings=int(data.get('max_bookings', 1)),
                current_bookings=0,
                is_booked=False
            )
            
            return Response({
                'success': True,
                'message': 'Slot added successfully',
                'slot': {
                    'id': slot.id,
                    'date': slot.date.isoformat(),
                    'start_time': slot.start_time.strftime('%H:%M'),
                    'end_time': slot.end_time.strftime('%H:%M'),
                    'max_bookings': slot.max_bookings,
                    'current_bookings': slot.current_bookings,
                }
            })
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    # ✅ FIXED: Delete availability - only if not booked
    @action(detail=True, methods=['delete'], url_path='availability', permission_classes=[IsAuthenticated])
    def guide_delete_availability(self, request, pk=None):
        """Delete availability slot - ONLY if not booked"""
        try:
            guide = Guide.objects.get(user=request.user)
            slot = GuideAvailability.objects.get(id=pk, guide=guide)
            
            # Check if slot has any bookings
            if slot.current_bookings > 0:
                return Response({
                    'success': False,
                    'error': f'Cannot delete this slot. It has {slot.current_bookings} booking(s).'
                }, status=400)
            
            # Check if slot is booked
            if slot.is_booked:
                return Response({
                    'success': False,
                    'error': 'Cannot delete a booked slot'
                }, status=400)
            
            slot.delete()
            return Response({
                'success': True, 
                'message': 'Slot deleted successfully'
            })
            
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except GuideAvailability.DoesNotExist:
            return Response({'success': False, 'error': 'Slot not found'}, status=404)
        except Exception as e:
            logger.error(f"Error deleting availability: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['get'], url_path='reviews', permission_classes=[IsAuthenticated])
    def guide_reviews(self, request):
        """Get reviews for the currently logged-in guide"""
        try:
            try:
                guide = Guide.objects.get(user=request.user)
            except Guide.DoesNotExist:
                return Response({
                    'success': True,
                    'reviews': [],
                    'message': 'User is not a guide'
                })
            
            reviews = GuideReview.objects.filter(guide=guide).order_by('-created_at')
            data = []
            for review in reviews:
                data.append({
                    'id': review.id,
                    'user': {
                        'username': review.user.username if review.user else 'Anonymous',
                        'email': review.user.email if review.user else '',
                    },
                    'rating': review.rating,
                    'comment': review.comment,
                    'review_text': review.comment,
                    'is_approved': review.is_approved,
                    'created_at': review.created_at.isoformat(),
                })
            return Response({'success': True, 'reviews': data})
        except Exception as e:
            return Response({
                'success': True,
                'reviews': [],
                'error': str(e)
            })


class BookingViewSet(viewsets.ModelViewSet):
    """ViewSet for guide bookings"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'date', 'guide']
    ordering_fields = ['date', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return BookingCreateSerializer
        elif self.action == 'list':
            return BookingListSerializer
        elif self.action in ['update', 'partial_update']:
            return BookingUpdateSerializer
        return BookingDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return GuideBooking.objects.all()
        return GuideBooking.objects.filter(
            Q(user=user) | Q(guide__user=user)
        )

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        
        # Calculate total price
        price_per_hour = booking.guide.price_per_hour or Decimal('0.00')
        if price_per_hour == Decimal('0.00'):
            price_per_day = booking.guide.price_per_day or Decimal('0.00')
            price_per_hour = price_per_day / Decimal('8.0')
        
        total_price = price_per_hour * Decimal(str(booking.duration_hours))
        booking.total_price = total_price
        booking.save()
        
        # Mark availability as booked
        availability = GuideAvailability.objects.filter(
            guide=booking.guide,
            date=booking.date,
            start_time=booking.time
        ).first()
        if availability:
            availability.current_bookings += 1
            if availability.current_bookings >= availability.max_bookings:
                availability.is_booked = True
            availability.save()
            booking.availability = availability
            booking.save()

    # ✅ FIXED: Process booking (confirm/reject/complete)
    @action(detail=True, methods=['post'], url_path='process')
    def process_booking(self, request, pk=None):
        """Process booking (confirm/reject/complete)"""
        try:
            booking = self.get_object()
            
            # Check if this booking belongs to the logged-in guide
            if booking.guide.user != request.user and not request.user.is_staff:
                return Response({
                    'success': False,
                    'error': 'Unauthorized - This booking does not belong to you'
                }, status=403)
            
            action = request.data.get('action')
            
            # ✅ Validate action
            if not action:
                return Response({
                    'success': False,
                    'error': 'Action is required. Use confirm, reject, or complete'
                }, status=400)
            
            # ✅ Process based on action
            if action == 'confirm':
                if booking.status != 'pending':
                    return Response({
                        'success': False,
                        'error': f'Cannot confirm booking with status: {booking.status}'
                    }, status=400)
                booking.status = 'confirmed'
                booking.save()
                return Response({
                    'success': True, 
                    'message': 'Booking confirmed successfully',
                    'status': booking.status
                })
                
            elif action == 'reject':
                if booking.status != 'pending':
                    return Response({
                        'success': False,
                        'error': f'Cannot reject booking with status: {booking.status}'
                    }, status=400)
                booking.status = 'rejected'
                booking.save()
                return Response({
                    'success': True, 
                    'message': 'Booking rejected successfully',
                    'status': booking.status
                })
                
            elif action == 'complete':
                if booking.status != 'confirmed':
                    return Response({
                        'success': False,
                        'error': f'Cannot complete booking with status: {booking.status}'
                    }, status=400)
                booking.status = 'completed'
                booking.save()
                return Response({
                    'success': True, 
                    'message': 'Booking completed successfully',
                    'status': booking.status
                })
            
            # Invalid action
            return Response({
                'success': False,
                'error': f'Invalid action: {action}. Use confirm, reject, or complete'
            }, status=400)
            
        except Exception as e:
            logger.error(f"Error processing booking: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=400)

    # ✅ FIXED: Complete booking
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_booking(self, request, pk=None):
        """Complete a booking"""
        try:
            booking = self.get_object()
            
            if booking.guide.user != request.user and not request.user.is_staff:
                return Response({
                    'success': False,
                    'error': 'Unauthorized'
                }, status=403)
            
            if booking.status != 'confirmed':
                return Response({
                    'success': False,
                    'error': f'Cannot complete booking with status: {booking.status}'
                }, status=400)
            
            booking.status = 'completed'
            booking.save()
            return Response({
                'success': True, 
                'message': 'Booking completed successfully',
                'status': booking.status
            })
            
        except Exception as e:
            logger.error(f"Error completing booking: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=400)

    # ✅ FIXED: Cancel booking
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_booking(self, request, pk=None):
        """Cancel a booking"""
        try:
            booking = self.get_object()
            
            if booking.user != request.user and booking.guide.user != request.user and not request.user.is_staff:
                return Response({
                    'success': False,
                    'error': 'Unauthorized'
                }, status=403)
            
            if booking.status == 'completed':
                return Response({
                    'success': False,
                    'error': 'Cannot cancel completed booking'
                }, status=400)
            
            booking.status = 'cancelled'
            booking.save()
            
            # Free up availability
            availability = booking.availability
            if availability:
                availability.current_bookings -= 1
                if availability.is_booked and availability.current_bookings < availability.max_bookings:
                    availability.is_booked = False
                availability.save()
            
            return Response({
                'success': True,
                'message': 'Booking cancelled successfully',
                'status': booking.status
            })
            
        except Exception as e:
            logger.error(f"Error cancelling booking: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=400)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm a booking (staff/guide only)"""
        booking = self.get_object()
        
        if request.user != booking.guide.user and not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'pending':
            return Response(
                {'error': f'Booking is already {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'confirmed'
        booking.save()
        return Response({'message': 'Booking confirmed successfully'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a booking"""
        booking = self.get_object()
        
        if request.user not in [booking.user, booking.guide.user] and not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status == 'completed':
            return Response(
                {'error': 'Cannot cancel completed booking'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'cancelled'
        booking.save()
        
        # Free up availability
        availability = booking.availability
        if availability:
            availability.current_bookings -= 1
            if availability.is_booked and availability.current_bookings < availability.max_bookings:
                availability.is_booked = False
            availability.save()
        
        return Response({'message': 'Booking cancelled successfully'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark booking as completed (guide only)"""
        booking = self.get_object()
        
        if request.user != booking.guide.user:
            return Response(
                {'error': 'Only the guide can complete this booking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'confirmed':
            return Response(
                {'error': f'Cannot complete booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'completed'
        booking.save()
        return Response({'message': 'Booking completed successfully'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a booking (guide only)"""
        booking = self.get_object()
        
        if request.user != booking.guide.user and not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'pending':
            return Response(
                {'error': f'Cannot reject booking with status: {booking.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'rejected'
        booking.save()
        
        # Free up availability
        availability = booking.availability
        if availability:
            availability.current_bookings -= 1
            if availability.is_booked and availability.current_bookings < availability.max_bookings:
                availability.is_booked = False
            availability.save()
        
        return Response({'message': 'Booking rejected successfully'})

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """Add a review for a completed booking"""
        booking = self.get_object()
        
        if request.user != booking.user:
            return Response(
                {'error': 'Only the user who made the booking can review'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if booking.status != 'completed':
            return Response(
                {'error': 'Can only review completed bookings'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if GuideReview.objects.filter(booking=booking).exists():
            return Response(
                {'error': 'Review already exists for this booking'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = GuideReviewCreateSerializer(
            data=request.data,
            context={'booking_id': booking.id}
        )
        
        if serializer.is_valid():
            review = serializer.save(
                user=request.user,
                guide=booking.guide,
                booking=booking
            )
            
            guide = booking.guide
            avg_rating = guide.reviews.aggregate(Avg('rating'))['rating__avg']
            guide.rating = avg_rating or 0
            guide.total_reviews = guide.reviews.count()
            guide.save()
            
            return Response(GuideReviewSerializer(review).data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GuideReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for guide reviews"""
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = GuideReviewSerializer
    
    def get_queryset(self):
        guide_id = self.request.query_params.get('guide_id')
        if guide_id:
            return GuideReview.objects.filter(guide_id=guide_id)
        return GuideReview.objects.all()
    
    @action(detail=False, methods=['get'])
    def my_reviews(self, request):
        """Get current user's reviews"""
        reviews = GuideReview.objects.filter(user=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)
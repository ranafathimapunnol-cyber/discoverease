from django.db.models import Q, Avg
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta
from decimal import Decimal
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


class GuideViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing guides"""
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
        
        # Filter by availability for specific date
        date = self.request.query_params.get('date')
        if date:
            available_guides = GuideAvailability.objects.filter(
                date=date,
                is_booked=False
            ).values_list('guide_id', flat=True)
            queryset = queryset.filter(id__in=available_guides)
        
        # Filter by district
        district_id = self.request.query_params.get('district')
        if district_id:
            queryset = queryset.filter(districts__id=district_id)
        
        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(categories__id=category_id)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price_per_day__gte=min_price)
        if max_price:
            queryset = queryset.filter(price_per_day__lte=max_price)
        
        # Filter by language
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
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """Get all reviews for a specific guide"""
        guide = self.get_object()
        reviews = guide.reviews.all()
        serializer = GuideReviewSerializer(reviews, many=True)
        return Response(serializer.data)


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
            # Fallback to daily price calculation
            price_per_day = booking.guide.price_per_day or Decimal('0.00')
            price_per_hour = price_per_day / Decimal('8.0')  # Assuming 8 hour day
        
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
            
            # Update guide rating
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
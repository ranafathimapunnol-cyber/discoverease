# guides/views.py - COMPLETE FIXED VERSION (NO ERRORS)

from django.db import models
from django.db.models import Q, Avg, Prefetch, Sum, Count
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from datetime import datetime, timedelta
from decimal import Decimal
import logging
from django.core.exceptions import ValidationError

from .models import (
    District, GuideCategory, Guide, GuideAvailability, 
    GuideBooking, GuideReview
)
from .serializers import (
    DistrictSerializer, GuideCategorySerializer, GuideListSerializer,
    GuideDetailSerializer, GuideAvailabilitySerializer, 
    BookingCreateSerializer, BookingListSerializer, 
    BookingDetailSerializer, BookingUpdateSerializer,
    GuideReviewSerializer, GuideReviewCreateSerializer,
)

logger = logging.getLogger(__name__)


# ============================================
# DISTRICT VIEWSET
# ============================================

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


# ============================================
# GUIDE CATEGORY VIEWSET
# ============================================

class GuideCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing guide categories"""
    queryset = GuideCategory.objects.filter(is_active=True)
    serializer_class = GuideCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


# ============================================
# GUIDE VIEWSET - COMPLETE FIXED
# ============================================

class GuideViewSet(viewsets.ModelViewSet):
    """Complete Guide ViewSet with availability management"""
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
        
        district = self.request.query_params.get('district')
        if district:
            logger.info(f"🔍 Filtering by district: {district}")
            try:
                district_obj = District.objects.get(name__iexact=district)
                queryset = queryset.filter(districts=district_obj)
                logger.info(f"✅ Found {queryset.count()} guides for district: {district}")
            except District.DoesNotExist:
                logger.warning(f"❌ District '{district}' not found in database")
                return queryset.none()
        
        date = self.request.query_params.get('date')
        if date:
            available_guides = GuideAvailability.objects.filter(
                date=date,
                is_booked=False
            ).values_list('guide_id', flat=True)
            queryset = queryset.filter(id__in=available_guides)
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(categories__name__icontains=category)
        
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price_per_day__gte=min_price)
        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price_per_day__lte=max_price)
        
        language = self.request.query_params.get('language')
        if language:
            queryset = queryset.filter(languages__icontains=language)
        
        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        """Override list to add debug logging"""
        queryset = self.filter_queryset(self.get_queryset())
        
        logger.info(f"📊 Total guides found: {queryset.count()}")
        if queryset.count() > 0:
            logger.info(f"📊 First guide: {queryset.first().full_name if queryset.first() else 'None'}")
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # ============================================
    # AVAILABILITY ENDPOINTS
    # ============================================
    
    @action(detail=True, methods=['get'], url_path='availability')
    def get_availability(self, request, pk=None):
        """Get availability slots for a specific guide"""
        guide = self.get_object()
        date = request.query_params.get('date')
        days = int(request.query_params.get('days', 14))
        
        if date:
            availabilities = guide.availabilities.filter(date=date)
        else:
            start_date = datetime.now().date()
            end_date = start_date + timedelta(days=days)
            availabilities = guide.availabilities.filter(
                date__range=[start_date, end_date]
            )
        
        availabilities = availabilities.order_by('date', 'start_time')
        serializer = GuideAvailabilitySerializer(availabilities, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'count': availabilities.count()
        })

    @action(detail=True, methods=['post'], url_path='availability/add')
    def add_availability(self, request, pk=None):
        """Add availability slot for a guide - DATE ONLY"""
        guide = self.get_object()
        user = request.user
        
        if guide.user != user and user.role not in ['admin', 'staff']:
            return Response({
                'success': False,
                'error': 'You can only add availability for yourself'
            }, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        date_str = data.get('date')
        max_bookings = int(data.get('max_bookings', 5))
        
        if not date_str:
            return Response({
                'success': False,
                'error': 'Date is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'success': False,
                'error': 'Invalid date format. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if GuideAvailability.objects.filter(guide=guide, date=date).exists():
            return Response({
                'success': False,
                'error': f'You already have availability on {date_str}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        availability = GuideAvailability.objects.create(
            guide=guide,
            date=date,
            start_time='00:00:00',
            end_time='23:59:59',
            max_bookings=max_bookings,
            current_bookings=0,
            is_booked=False
        )
        
        serializer = GuideAvailabilitySerializer(availability)
        return Response({
            'success': True,
            'message': f'Availability added for {date_str}',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='availability/bulk-add')
    def bulk_add_availability(self, request, pk=None):
        """Add multiple availability slots at once"""
        guide = self.get_object()
        user = request.user
        
        if guide.user != user and user.role not in ['admin', 'staff']:
            return Response({
                'success': False,
                'error': 'You can only add availability for yourself'
            }, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        dates = data.get('dates', [])
        max_bookings = int(data.get('max_bookings', 5))
        
        if not dates:
            return Response({
                'success': False,
                'error': 'Please provide a list of dates'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created = []
        skipped = []
        errors = []
        
        for date_str in dates:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                errors.append(f'Invalid date format: {date_str}')
                continue
            
            if GuideAvailability.objects.filter(guide=guide, date=date).exists():
                skipped.append(date_str)
                continue
            
            availability = GuideAvailability.objects.create(
                guide=guide,
                date=date,
                start_time='00:00:00',
                end_time='23:59:59',
                max_bookings=max_bookings,
                current_bookings=0,
                is_booked=False
            )
            created.append(date_str)
        
        return Response({
            'success': True,
            'message': f'Added {len(created)} slots, skipped {len(skipped)} existing',
            'created': created,
            'skipped': skipped,
            'errors': errors
        })

    @action(detail=True, methods=['delete'], url_path='availability/(?P<slot_id>[^/.]+)/delete')
    def delete_availability(self, request, pk=None, slot_id=None):
        """Delete a specific availability slot"""
        guide = self.get_object()
        user = request.user
        
        if guide.user != user and user.role not in ['admin', 'staff']:
            return Response({
                'success': False,
                'error': 'You can only delete your own availability'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            slot = GuideAvailability.objects.get(id=slot_id, guide=guide)
        except GuideAvailability.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Availability slot not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if slot.current_bookings > 0:
            return Response({
                'success': False,
                'error': f'Cannot delete this slot. It has {slot.current_bookings} booking(s).'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if slot.is_booked:
            return Response({
                'success': False,
                'error': 'Cannot delete a fully booked slot'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        slot.delete()
        return Response({
            'success': True,
            'message': 'Availability slot deleted successfully'
        })

    @action(detail=True, methods=['get'], url_path='availability/bookings')
    def get_availability_bookings(self, request, pk=None):
        """Get all bookings for this guide's availability slots"""
        guide = self.get_object()
        
        date = request.query_params.get('date')
        if date:
            availabilities = guide.availabilities.filter(date=date)
        else:
            availabilities = guide.availabilities.all()
        
        bookings = GuideBooking.objects.filter(
            availability__in=availabilities
        ).select_related('user', 'guide').order_by('date', 'created_at')
        
        data = []
        for booking in bookings:
            data.append({
                'id': booking.id,
                'booking_id': booking.booking_id,
                'date': booking.date.isoformat(),
                'time': booking.time.strftime('%H:%M') if booking.time else 'N/A',
                'traveler': booking.user.username if booking.user else 'Anonymous',
                'traveler_email': booking.user.email if booking.user else '',
                'number_of_people': booking.number_of_people,
                'status': booking.status,
                'created_at': booking.created_at.isoformat()
            })
        
        return Response({
            'success': True,
            'data': data,
            'count': len(data)
        })

    # ============================================
    # GUIDE DASHBOARD ENDPOINTS - FIXED
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='profile', permission_classes=[IsAuthenticated])
    def guide_profile(self, request):
        """Get guide profile for dashboard - FIXED: removed primary_district"""
        try:
            guide = Guide.objects.get(user=request.user)
            
            district_stats = []
            for district in guide.districts.all():
                bookings = GuideBooking.objects.filter(guide=guide, district=district)
                district_stats.append({
                    'district': district.name,
                    'total': bookings.count(),
                    'pending': bookings.filter(status='pending').count(),
                    'confirmed': bookings.filter(status='confirmed').count(),
                    'completed': bookings.filter(status='completed').count(),
                })
            
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
                    'districts': [d.name for d in guide.districts.all()],
                    'profile_image': guide.profile_image.url if guide.profile_image else None,
                    'price_per_day': float(guide.price_per_day),
                    'price_per_hour': float(guide.price_per_hour),
                    'specialties': [c.name for c in guide.categories.all()],
                    'district_stats': district_stats,
                }
            })
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except Exception as e:
            logger.error(f"Error in guide_profile: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # UPDATE GUIDE PROFILE - COMPLETE FIX (POST only)
    # ============================================
    
    @action(detail=False, methods=['post'], url_path='update-profile', permission_classes=[IsAuthenticated])
    def update_guide_profile(self, request):
        """Update guide profile - Uses POST method"""
        try:
            guide = Guide.objects.get(user=request.user)
            data = request.data
            
            # Update fields
            if 'full_name' in data:
                guide.full_name = data['full_name']
            if 'phone' in data:
                guide.phone_number = data['phone']
            if 'bio' in data:
                guide.bio = data['bio']
            if 'years_of_experience' in data:
                guide.years_of_experience = int(data['years_of_experience'])
            if 'languages' in data:
                guide.languages = data['languages']
            if 'price_per_day' in data:
                guide.price_per_day = Decimal(str(data['price_per_day']))
            if 'price_per_hour' in data:
                guide.price_per_hour = Decimal(str(data['price_per_hour']))
            if 'facebook' in data:
                guide.facebook = data['facebook']
            if 'instagram' in data:
                guide.instagram = data['instagram']
            if 'website' in data:
                guide.website = data['website']
            
            # Handle specialties (many-to-many)
            if 'specialties' in data and data['specialties']:
                specialty_names = data['specialties']
                if isinstance(specialty_names, str):
                    specialty_names = [s.strip() for s in specialty_names.split(',') if s.strip()]
                
                guide.categories.clear()
                for name in specialty_names:
                    category, _ = GuideCategory.objects.get_or_create(name=name)
                    guide.categories.add(category)
            
            # Handle profile image
            if 'profile_image' in request.FILES:
                guide.profile_image = request.FILES['profile_image']
            
            guide.save()
            
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
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
                    'districts': [d.name for d in guide.districts.all()],
                    'profile_image': guide.profile_image.url if guide.profile_image else None,
                    'price_per_day': float(guide.price_per_day),
                    'price_per_hour': float(guide.price_per_hour),
                    'specialties': [c.name for c in guide.categories.all()],
                }
            })
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide not found'}, status=404)
        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

   # guides/views.py - FIXED guide_bookings method

    @action(detail=False, methods=['get'], url_path='bookings', permission_classes=[IsAuthenticated])
    def guide_bookings(self, request):
        """Get guide's bookings with district-wise stats"""
        try:
            guide = Guide.objects.get(user=request.user)
            status_filter = request.query_params.get('status')
            district_filter = request.query_params.get('district')
            
            bookings = GuideBooking.objects.filter(guide=guide)
            
            if status_filter:
                bookings = bookings.filter(status=status_filter)
            if district_filter:
                bookings = bookings.filter(district__name__iexact=district_filter)
            
            # ✅ FIXED: Ensure we return all bookings with proper data
            data = []
            for booking in bookings.order_by('-created_at'):
                # Get user info safely
                user_info = {
                    'username': booking.user.username if booking.user else 'Anonymous',
                    'email': booking.user.email if booking.user else '',
                }
                
                # Get district info safely
                district_info = {
                    'name': booking.district.name if booking.district else 'N/A'
                }
                
                data.append({
                    'id': booking.id,
                    'booking_id': booking.booking_id,
                    'user': user_info,
                    'traveler_email': booking.user.email if booking.user else '',
                    'guide_name': booking.guide.full_name if booking.guide else 'Unknown',
                    'guide': {
                        'id': booking.guide.id if booking.guide else None,
                        'full_name': booking.guide.full_name if booking.guide else 'Unknown'
                    },
                    'district': district_info,
                    'date': booking.date.isoformat(),
                    'time': booking.time.strftime('%H:%M') if booking.time else 'N/A',
                    'status': booking.status,
                    'number_of_people': booking.number_of_people,
                    'total_price': float(booking.total_price) if booking.total_price else 0,
                    'special_requests': booking.special_requests or '',
                    'duration_hours': booking.duration_hours,
                    'created_at': booking.created_at.isoformat(),
                    'updated_at': booking.updated_at.isoformat(),
                    'has_review': hasattr(booking, 'review'),
                })
            
            # District-wise breakdown
            district_breakdown = []
            for district in guide.districts.all():
                district_bookings = bookings.filter(district=district)
                district_breakdown.append({
                    'district': district.name,
                    'total': district_bookings.count(),
                    'pending': district_bookings.filter(status='pending').count(),
                    'confirmed': district_bookings.filter(status='confirmed').count(),
                    'completed': district_bookings.filter(status='completed').count(),
                    'cancelled': district_bookings.filter(status='cancelled').count(),
                    'rejected': district_bookings.filter(status='rejected').count(),
                })
            
            stats = {
                'total': bookings.count(),
                'pending': bookings.filter(status='pending').count(),
                'confirmed': bookings.filter(status='confirmed').count(),
                'completed': bookings.filter(status='completed').count(),
                'cancelled': bookings.filter(status='cancelled').count(),
                'rejected': bookings.filter(status='rejected').count(),
                'district_breakdown': district_breakdown,
            }
            
            return Response({
                'success': True,
                'stats': stats,
                'bookings': data,
                'count': len(data)
            })
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except Exception as e:
            logger.error(f"Error in guide_bookings: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)
        
    @action(detail=False, methods=['get'], url_path='availability-slots', permission_classes=[IsAuthenticated])
    def guide_availability_slots(self, request):
        """Get guide's availability slots with booking info per slot"""
        try:
            guide = Guide.objects.get(user=request.user)
            date_from = request.query_params.get('date_from')
            date_to = request.query_params.get('date_to')
            
            availabilities = GuideAvailability.objects.filter(guide=guide)
            
            if date_from:
                availabilities = availabilities.filter(date__gte=date_from)
            if date_to:
                availabilities = availabilities.filter(date__lte=date_to)
            
            data = []
            for slot in availabilities.order_by('date'):
                bookings = GuideBooking.objects.filter(availability=slot)
                
                data.append({
                    'id': slot.id,
                    'date': slot.date.isoformat(),
                    'start_time': slot.start_time.strftime('%H:%M') if slot.start_time else 'N/A',
                    'end_time': slot.end_time.strftime('%H:%M') if slot.end_time else 'N/A',
                    'is_booked': slot.is_booked,
                    'max_bookings': slot.max_bookings,
                    'current_bookings': slot.current_bookings,
                    'available_slots': slot.max_bookings - slot.current_bookings,
                    'bookings': [
                        {
                            'booking_id': b.booking_id,
                            'traveler': b.user.username if b.user else 'Anonymous',
                            'traveler_email': b.user.email if b.user else '',
                            'status': b.status,
                            'number_of_people': b.number_of_people,
                            'created_at': b.created_at.isoformat(),
                        } for b in bookings
                    ]
                })
            
            return Response({
                'success': True,
                'availability': data,
                'count': len(data)
            })
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except Exception as e:
            logger.error(f"Error in guide_availability_slots: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['post'], url_path='availability/add-slot', permission_classes=[IsAuthenticated])
    def add_availability_slot(self, request):
        """Add availability slot for the currently logged-in guide"""
        try:
            guide = Guide.objects.get(user=request.user)
            
            data = request.data
            date_str = data.get('date')
            max_bookings = int(data.get('max_bookings', 5))
            
            if not date_str:
                return Response({
                    'success': False,
                    'error': 'Date is required'
                }, status=400)
            
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({
                    'success': False,
                    'error': 'Invalid date format. Use YYYY-MM-DD'
                }, status=400)
            
            if GuideAvailability.objects.filter(guide=guide, date=date).exists():
                return Response({
                    'success': False,
                    'error': f'You already have availability on {date_str}'
                }, status=400)
            
            slot = GuideAvailability.objects.create(
                guide=guide,
                date=date,
                start_time='00:00:00',
                end_time='23:59:59',
                max_bookings=max_bookings,
                current_bookings=0,
                is_booked=False
            )
            
            return Response({
                'success': True,
                'message': f'Availability added for {date_str}',
                'slot': {
                    'id': slot.id,
                    'date': slot.date.isoformat(),
                    'max_bookings': slot.max_bookings,
                    'current_bookings': slot.current_bookings,
                    'is_booked': slot.is_booked,
                }
            })
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except Exception as e:
            logger.error(f"Error adding availability: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=True, methods=['delete'], url_path='availability/(?P<slot_id>[^/.]+)', permission_classes=[IsAuthenticated])
    def delete_availability_slot(self, request, pk=None, slot_id=None):
        """Delete a specific availability slot for a guide"""
        try:
            guide = self.get_object()
            user = request.user
            
            if guide.user != user and user.role not in ['admin', 'staff']:
                return Response({
                    'success': False,
                    'error': 'You can only delete your own availability'
                }, status=403)
            
            slot = GuideAvailability.objects.get(id=slot_id, guide=guide)
            
            if slot.current_bookings > 0:
                return Response({
                    'success': False,
                    'error': f'Cannot delete this slot. It has {slot.current_bookings} booking(s).'
                }, status=400)
            
            if slot.is_booked:
                return Response({
                    'success': False,
                    'error': 'Cannot delete a fully booked slot'
                }, status=400)
            
            slot.delete()
            return Response({
                'success': True,
                'message': 'Availability slot deleted successfully'
            })
        except GuideAvailability.DoesNotExist:
            return Response({'success': False, 'error': 'Slot not found'}, status=404)
        except Exception as e:
            logger.error(f"Error deleting availability: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=True, methods=['get'], url_path='availability/(?P<slot_id>[^/.]+)/bookings')
    def get_slot_bookings(self, request, pk=None, slot_id=None):
        """Get all bookings for a specific availability slot"""
        try:
            guide = self.get_object()
            slot = GuideAvailability.objects.get(id=slot_id, guide=guide)
            
            bookings = GuideBooking.objects.filter(availability=slot).order_by('-created_at')
            
            data = []
            for booking in bookings:
                data.append({
                    'id': booking.id,
                    'booking_id': booking.booking_id,
                    'traveler': booking.user.username if booking.user else 'Anonymous',
                    'traveler_email': booking.user.email if booking.user else '',
                    'date': booking.date.isoformat(),
                    'time': booking.time.strftime('%H:%M') if booking.time else 'N/A',
                    'number_of_people': booking.number_of_people,
                    'status': booking.status,
                    'total_price': float(booking.total_price),
                    'created_at': booking.created_at.isoformat(),
                })
            
            return Response({
                'success': True,
                'slot': {
                    'id': slot.id,
                    'date': slot.date.isoformat(),
                    'max_bookings': slot.max_bookings,
                    'current_bookings': slot.current_bookings,
                    'is_booked': slot.is_booked,
                },
                'bookings': data,
                'count': len(data)
            })
        except GuideAvailability.DoesNotExist:
            return Response({'success': False, 'error': 'Slot not found'}, status=404)
        except Exception as e:
            logger.error(f"Error getting slot bookings: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['get'], url_path='available-slots')
    def get_available_slots(self, request):
        """Get available slots for booking - used by travelers"""
        district = request.query_params.get('district')
        date = request.query_params.get('date')
        
        if not district:
            return Response({
                'success': False,
                'error': 'District is required'
            }, status=400)
        
        if not date:
            return Response({
                'success': False,
                'error': 'Date is required'
            }, status=400)
        
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'success': False,
                'error': 'Invalid date format. Use YYYY-MM-DD'
            }, status=400)
        
        guides = Guide.objects.filter(
            districts__name__iexact=district,
            is_active=True,
            is_available=True
        )
        
        slots = GuideAvailability.objects.filter(
            guide__in=guides,
            date=date_obj,
            is_booked=False,
            current_bookings__lt=models.F('max_bookings')
        ).select_related('guide')
        
        data = []
        for slot in slots:
            data.append({
                'id': slot.id,
                'guide': {
                    'id': slot.guide.id,
                    'full_name': slot.guide.full_name,
                    'rating': float(slot.guide.rating),
                    'total_reviews': slot.guide.total_reviews,
                    'price_per_day': float(slot.guide.price_per_day),
                    'price_per_hour': float(slot.guide.price_per_hour),
                    'profile_image': slot.guide.profile_image.url if slot.guide.profile_image else None,
                },
                'date': slot.date.isoformat(),
                'available_slots': slot.max_bookings - slot.current_bookings,
                'max_bookings': slot.max_bookings,
                'current_bookings': slot.current_bookings,
            })
        
        return Response({
            'success': True,
            'data': data,
            'count': len(data)
        })

    # ============================================
    # REVIEWS ENDPOINTS
    # ============================================
    
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
            
            stats = {
                'total': reviews.count(),
                'approved': reviews.filter(is_approved=True).count(),
                'pending': reviews.filter(is_approved=False).count(),
                'average_rating': reviews.aggregate(Avg('rating'))['rating__avg'] or 0,
            }
            
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
            
            return Response({
                'success': True,
                'stats': stats,
                'reviews': data,
                'count': len(data)
            })
        except Exception as e:
            return Response({
                'success': True,
                'reviews': [],
                'error': str(e)
            })

    @action(detail=False, methods=['post'], url_path='reviews/(?P<review_id>[^/.]+)/approve', permission_classes=[IsAuthenticated])
    def approve_review(self, request, review_id=None):
        """Approve a review (guide only)"""
        try:
            guide = Guide.objects.get(user=request.user)
            review = GuideReview.objects.get(id=review_id, guide=guide)
            
            review.is_approved = True
            review.save()
            
            avg_rating = guide.reviews.filter(is_approved=True).aggregate(Avg('rating'))['rating__avg']
            guide.rating = avg_rating or 0
            guide.total_reviews = guide.reviews.filter(is_approved=True).count()
            guide.save()
            
            return Response({
                'success': True,
                'message': 'Review approved successfully',
                'review': GuideReviewSerializer(review).data
            })
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide not found'}, status=404)
        except GuideReview.DoesNotExist:
            return Response({'success': False, 'error': 'Review not found'}, status=404)
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # STATS ENDPOINT - FIXED
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='stats', permission_classes=[IsAuthenticated])
    def guide_stats(self, request):
        """Get complete stats for the guide - FIXED: removed primary_district"""
        try:
            guide = Guide.objects.get(user=request.user)
            
            bookings = GuideBooking.objects.filter(guide=guide)
            reviews = GuideReview.objects.filter(guide=guide)
            
            district_stats = []
            for district in guide.districts.all():
                district_bookings = bookings.filter(district=district)
                district_stats.append({
                    'district': district.name,
                    'total': district_bookings.count(),
                    'pending': district_bookings.filter(status='pending').count(),
                    'confirmed': district_bookings.filter(status='confirmed').count(),
                    'completed': district_bookings.filter(status='completed').count(),
                    'cancelled': district_bookings.filter(status='cancelled').count(),
                    'rejected': district_bookings.filter(status='rejected').count(),
                    'revenue': district_bookings.filter(status='completed').aggregate(
                        total=Sum('total_price')
                    )['total'] or 0,
                })
            
            from django.db.models.functions import TruncMonth
            monthly_stats = bookings.annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                count=Count('id'),
                revenue=Sum('total_price')
            ).order_by('-month')[:12]
            
            return Response({
                'success': True,
                'stats': {
                    'total_bookings': bookings.count(),
                    'pending_bookings': bookings.filter(status='pending').count(),
                    'confirmed_bookings': bookings.filter(status='confirmed').count(),
                    'completed_bookings': bookings.filter(status='completed').count(),
                    'cancelled_bookings': bookings.filter(status='cancelled').count(),
                    'rejected_bookings': bookings.filter(status='rejected').count(),
                    'total_reviews': reviews.count(),
                    'average_rating': float(guide.rating),
                    'total_revenue': bookings.filter(status='completed').aggregate(
                        total=Sum('total_price')
                    )['total'] or 0,
                    'district_stats': district_stats,
                    'monthly_stats': monthly_stats,
                }
            })
        except Guide.DoesNotExist:
            return Response({'success': False, 'error': 'Guide profile not found'}, status=404)
        except Exception as e:
            logger.error(f"Error in guide_stats: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)


# ============================================
# BOOKING VIEWSET
# ============================================

class BookingViewSet(viewsets.ModelViewSet):
    """ViewSet for guide bookings with full review support"""
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
        if user.is_staff or user.is_superuser or user.role in ['admin', 'staff']:
            return GuideBooking.objects.all()
        return GuideBooking.objects.filter(
            Q(user=user) | Q(guide__user=user)
        )

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        
        price_per_hour = booking.guide.price_per_hour or Decimal('0.00')
        if price_per_hour == Decimal('0.00'):
            price_per_day = booking.guide.price_per_day or Decimal('0.00')
            price_per_hour = price_per_day / Decimal('8.0')
        
        total_price = price_per_hour * Decimal(str(booking.duration_hours))
        booking.total_price = total_price
        booking.save()
        
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

    # guides/views.py - Verify this method exists in BookingViewSet

    @action(detail=True, methods=['post'], url_path='process')
    def process_booking(self, request, pk=None):
        """Process booking (confirm/reject/complete)"""
        try:
            booking = self.get_object()
            
            if booking.guide.user != request.user and not request.user.is_staff:
                return Response({
                    'success': False,
                    'error': 'Unauthorized - This booking does not belong to you'
                }, status=403)
            
            action = request.data.get('action')
            
            if not action:
                return Response({
                    'success': False,
                    'error': 'Action is required. Use confirm, reject, or complete'
                }, status=400)
            
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

    @action(detail=True, methods=['post'], url_path='review')
    def add_review(self, request, pk=None):
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
            review = GuideReview.objects.create(
                booking=booking,
                user=request.user,
                guide=booking.guide,
                rating=serializer.validated_data['rating'],
                comment=serializer.validated_data['comment'],
                is_approved=False
            )
            
            guide = booking.guide
            avg_rating = guide.reviews.aggregate(Avg('rating'))['rating__avg']
            guide.rating = avg_rating or 0
            guide.total_reviews = guide.reviews.count()
            guide.save()
            
            review_data = GuideReviewSerializer(review).data
            return Response({
                'success': True,
                'message': 'Review submitted successfully!',
                'review': review_data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='review')
    def get_review(self, request, pk=None):
        """Get the review for a booking if it exists"""
        booking = self.get_object()
        
        try:
            review = GuideReview.objects.get(booking=booking)
            serializer = GuideReviewSerializer(review)
            return Response({
                'success': True,
                'review': serializer.data
            })
        except GuideReview.DoesNotExist:
            return Response({
                'success': True,
                'review': None,
                'message': 'No review found for this booking'
            })


# ============================================
# GUIDE REVIEW VIEWSET
# ============================================

class GuideReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for managing guide reviews"""
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_class = GuideReviewSerializer
    
    def get_queryset(self):
        queryset = GuideReview.objects.all()
        guide_id = self.request.query_params.get('guide_id')
        user_id = self.request.query_params.get('user_id')
        booking_id = self.request.query_params.get('booking_id')
        
        if guide_id:
            queryset = queryset.filter(guide_id=guide_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if booking_id:
            queryset = queryset.filter(booking_id=booking_id)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'], url_path='my-reviews')
    def my_reviews(self, request):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        reviews = GuideReview.objects.filter(user=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response({
            'success': True,
            'reviews': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='for-guide/(?P<guide_id>[^/.]+)')
    def for_guide(self, request, guide_id=None):
        try:
            guide = Guide.objects.get(id=guide_id)
            reviews = GuideReview.objects.filter(guide=guide, is_approved=True)
            serializer = self.get_serializer(reviews, many=True)
            return Response({
                'success': True,
                'guide': guide.full_name,
                'rating': float(guide.rating),
                'total_reviews': guide.total_reviews,
                'reviews': serializer.data
            })
        except Guide.DoesNotExist:
            return Response(
                {'error': 'Guide not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], url_path='approve')
    def approve_review(self, request, pk=None):
        """Approve a review (guide or staff only)"""
        review = self.get_object()
        
        if request.user != review.guide.user and not request.user.is_staff:
            return Response(
                {'error': 'Only the guide or staff can approve reviews'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        review.is_approved = True
        review.save()
        
        return Response({
            'success': True,
            'message': 'Review approved successfully',
            'review': GuideReviewSerializer(review).data
        })
    
    @action(detail=True, methods=['delete'], url_path='delete')
    def delete_review(self, request, pk=None):
        """Delete a review (staff only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff can delete reviews'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        review = self.get_object()
        review.delete()
        
        return Response({
            'success': True,
            'message': 'Review deleted successfully'
        })
        
        
# ============================================
# AVAILABILITY VIEWSET - COMPLETE FIXED
# ============================================

class AvailabilityViewSet(viewsets.ModelViewSet):
    """ViewSet for managing guide availability slots"""
    permission_classes = [IsAuthenticated]
    serializer_class = GuideAvailabilitySerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or user.role in ['admin', 'staff']:
            return GuideAvailability.objects.all()
        try:
            guide = Guide.objects.get(user=user)
            return GuideAvailability.objects.filter(guide=guide)
        except Guide.DoesNotExist:
            return GuideAvailability.objects.none()
    
    def create(self, request, *args, **kwargs):
        try:
            guide = Guide.objects.get(user=request.user)
        except Guide.DoesNotExist:
            return Response(
                {'error': 'Guide profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = request.data.copy()
        data['guide'] = guide.id
        
        # Check for overlapping slots
        date = data.get('date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if date and start_time and end_time:
            overlapping = GuideAvailability.objects.filter(
                guide=guide,
                date=date,
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exists()
            if overlapping:
                return Response(
                    {'error': 'Overlapping availability slot exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def perform_create(self, serializer):
        try:
            guide = Guide.objects.get(user=self.request.user)
        except Guide.DoesNotExist:
            raise ValidationError({'error': 'Guide profile not found'})
        
        date = self.request.data.get('date')
        start_time = self.request.data.get('start_time')
        end_time = self.request.data.get('end_time')
        
        if date and start_time and end_time:
            overlapping = GuideAvailability.objects.filter(
                guide=guide,
                date=date,
                start_time__lt=end_time,
                end_time__gt=start_time
            ).exists()
            if overlapping:
                raise ValidationError({'error': 'Overlapping availability slot exists'})
        
        serializer.save(guide=guide)
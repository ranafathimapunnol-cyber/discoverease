# guides/serializers.py - COMPLETE FIXED SERIALIZERS

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    District, GuideCategory, Guide, GuideAvailability, 
    GuideBooking, GuideReview
)

User = get_user_model()


class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'name', 'code', 'description', 'image', 'is_active']


class GuideCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideCategory
        fields = ['id', 'name', 'icon', 'description', 'is_active']


class GuideAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for guide availability slots"""
    guide_name = serializers.CharField(source='guide.full_name', read_only=True)
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = GuideAvailability
        fields = [
            'id', 'guide', 'guide_name', 'date', 'start_time', 'end_time',
            'is_booked', 'is_available', 'max_bookings', 'current_bookings'
        ]
    
    def get_is_available(self, obj):
        return obj.is_available()


class GuideListSerializer(serializers.ModelSerializer):
    """Serializer for listing guides - INCLUDES availabilities"""
    districts = DistrictSerializer(many=True, read_only=True)
    categories = GuideCategorySerializer(many=True, read_only=True)
    specialties = serializers.SerializerMethodField()
    availabilities = serializers.SerializerMethodField()
    
    class Meta:
        model = Guide
        fields = [
            'id', 'full_name', 'email', 'profile_image', 'bio', 
            'phone_number', 'years_of_experience', 'languages',
            'rating', 'total_reviews', 'price_per_day', 'price_per_hour',
            'is_available', 'is_verified', 'is_active',
            'districts', 'categories', 'specialties',
            'availabilities',  # ✅ ADDED
            'created_at'
        ]
    
    def get_specialties(self, obj):
        return [c.name for c in obj.categories.all()]
    
    def get_availabilities(self, obj):
        """Get upcoming availabilities for this guide"""
        from datetime import datetime, timedelta
        
        # Get next 14 days of availabilities
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=14)
        
        availabilities = obj.availabilities.filter(
            date__range=[start_date, end_date],
            is_booked=False
        ).order_by('date', 'start_time')[:14]
        
        return GuideAvailabilitySerializer(availabilities, many=True).data


class GuideDetailSerializer(serializers.ModelSerializer):
    """Detailed guide serializer with availability"""
    districts = DistrictSerializer(many=True, read_only=True)
    categories = GuideCategorySerializer(many=True, read_only=True)
    specialties = serializers.SerializerMethodField()
    availabilities = serializers.SerializerMethodField()
    
    class Meta:
        model = Guide
        fields = [
            'id', 'full_name', 'email', 'profile_image', 'bio',
            'phone_number', 'years_of_experience', 'languages',
            'rating', 'total_reviews', 'price_per_day', 'price_per_hour',
            'is_available', 'is_verified', 'is_active',
            'districts', 'categories', 'specialties',
            'availabilities', 'facebook', 'instagram', 'twitter', 'website',
            'created_at', 'updated_at'
        ]
    
    def get_specialties(self, obj):
        return [c.name for c in obj.categories.all()]
    
    def get_availabilities(self, obj):
        from datetime import datetime, timedelta
        
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=14)
        
        availabilities = obj.availabilities.filter(
            date__range=[start_date, end_date],
            is_booked=False
        ).order_by('date', 'start_time')[:14]
        
        return GuideAvailabilitySerializer(availabilities, many=True).data


# ============================================
# ✅ REVIEW SERIALIZERS
# ============================================

class GuideReviewSerializer(serializers.ModelSerializer):
    """Serializer for guide reviews with all FK relationships"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    guide_name = serializers.CharField(source='guide.full_name', read_only=True)
    booking_id = serializers.CharField(source='booking.booking_id', read_only=True)
    booking_date = serializers.DateField(source='booking.date', read_only=True)
    
    class Meta:
        model = GuideReview
        fields = [
            'id', 'booking', 'booking_id', 'booking_date',
            'user', 'user_name', 'user_email',
            'guide', 'guide_name',
            'rating', 'comment', 'is_approved',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GuideReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a review"""
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(max_length=1000)
    
    class Meta:
        model = GuideReview
        fields = ['rating', 'comment']
    
    def validate(self, data):
        booking_id = self.context.get('booking_id')
        if booking_id:
            try:
                booking = GuideBooking.objects.get(id=booking_id)
                if booking.status != 'completed':
                    raise serializers.ValidationError(
                        "Can only review completed bookings"
                    )
                if GuideReview.objects.filter(booking=booking).exists():
                    raise serializers.ValidationError(
                        "Review already exists for this booking"
                    )
            except GuideBooking.DoesNotExist:
                raise serializers.ValidationError("Booking not found")
        return data


# ============================================
# BOOKING SERIALIZERS
# ============================================

class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for listing bookings with review status"""
    guide_name = serializers.CharField(source='guide.full_name', read_only=True)
    guide_id = serializers.IntegerField(source='guide.id', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    has_review = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()
    
    class Meta:
        model = GuideBooking
        fields = [
            'id', 'booking_id', 'guide', 'guide_name', 'guide_id',
            'user', 'user_name', 'user_email',
            'district', 'district_name', 'date', 'time',
            'duration_hours', 'number_of_people', 'special_requests',
            'total_price', 'currency', 'status', 'has_review', 'review',
            'created_at'
        ]
    
    def get_has_review(self, obj):
        return hasattr(obj, 'review')
    
    def get_review(self, obj):
        if hasattr(obj, 'review'):
            return GuideReviewSerializer(obj.review).data
        return None


class BookingDetailSerializer(serializers.ModelSerializer):
    """Detailed booking serializer with all relationships"""
    guide = GuideListSerializer(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    review = serializers.SerializerMethodField()
    has_review = serializers.SerializerMethodField()
    
    class Meta:
        model = GuideBooking
        fields = [
            'id', 'booking_id', 'guide', 'user_name', 'user_email',
            'district', 'district_name', 'date', 'time',
            'duration_hours', 'number_of_people', 'special_requests',
            'total_price', 'currency', 'status', 'review', 'has_review',
            'created_at', 'updated_at'
        ]
    
    def get_has_review(self, obj):
        return hasattr(obj, 'review')
    
    def get_review(self, obj):
        if hasattr(obj, 'review'):
            return GuideReviewSerializer(obj.review).data
        return None


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a booking"""
    class Meta:
        model = GuideBooking
        fields = [
            'guide', 'district', 'date', 'time', 'duration_hours',
            'number_of_people', 'special_requests'
        ]
    
    def validate(self, data):
        guide = data.get('guide')
        if not guide.is_available:
            raise serializers.ValidationError("Guide is not available")
        
        availability = GuideAvailability.objects.filter(
            guide=guide,
            date=data.get('date'),
            start_time=data.get('time')
        ).first()
        
        if not availability:
            raise serializers.ValidationError("Selected time slot is not available")
        
        if not availability.is_available():
            raise serializers.ValidationError("This time slot is fully booked")
        
        data['availability'] = availability
        return data


class BookingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating booking status"""
    class Meta:
        model = GuideBooking
        fields = ['status']


class BookingProcessSerializer(serializers.Serializer):
    """Serializer for processing booking"""
    action = serializers.ChoiceField(
        choices=['confirm', 'reject', 'complete', 'cancel']
    )
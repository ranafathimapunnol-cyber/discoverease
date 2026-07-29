# guides/serializers.py - COMPLETE FIXED VERSION
# Removed GuideReview, added DestinationReview support

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    District, GuideCategory, Guide, GuideAvailability, 
    GuideBooking
)
from destinations.models import Destination, Review as DestinationReview

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
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = GuideAvailability
        fields = [
            'id', 'guide', 'guide_name', 'date', 'start_time', 'end_time',
            'max_bookings', 'current_bookings',
            'is_booked', 'is_available', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['guide', 'current_bookings', 'is_booked', 'created_at', 'updated_at']
    
    def get_is_available(self, obj):
        return obj.is_available()
    
    def get_status(self, obj):
        if obj.is_booked:
            return 'full'
        elif obj.current_bookings > 0:
            return 'booked'
        else:
            return 'available'


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
            'availabilities',
            'created_at'
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
# ✅ DESTINATION REVIEW SERIALIZERS
# ============================================

class DestinationReviewSerializer(serializers.ModelSerializer):
    """Serializer for destination reviews with all FK relationships"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    destination_id = serializers.IntegerField(source='destination.id', read_only=True)
    destination_district = serializers.CharField(source='destination.district', read_only=True)
    destination_image = serializers.CharField(source='destination.featured_image', read_only=True)
    
    class Meta:
        model = DestinationReview
        fields = [
            'id', 'destination', 'destination_id', 'destination_name', 
            'destination_district', 'destination_image',
            'user', 'user_name', 'user_email',
            'rating', 'comment', 'image', 'is_approved', 'is_verified_traveler',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DestinationReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a destination review from a booking"""
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(max_length=1000)
    image = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = DestinationReview
        fields = ['rating', 'comment', 'image']
    
    def validate(self, data):
        booking_id = self.context.get('booking_id')
        if booking_id:
            try:
                booking = GuideBooking.objects.get(id=booking_id)
                if booking.status != 'completed':
                    raise serializers.ValidationError(
                        "Can only review completed bookings"
                    )
                # Check if review already exists for this destination
                if DestinationReview.objects.filter(
                    user=booking.user, 
                    destination=booking.destination
                ).exists():
                    raise serializers.ValidationError(
                        "Review already exists for this destination"
                    )
                self.context['booking'] = booking
            except GuideBooking.DoesNotExist:
                raise serializers.ValidationError("Booking not found")
        return data


# ============================================
# BOOKING SERIALIZERS - Updated
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
    destination_id = serializers.SerializerMethodField()
    destination_name = serializers.SerializerMethodField()
    
    class Meta:
        model = GuideBooking
        fields = [
            'id', 'booking_id', 'guide', 'guide_name', 'guide_id',
            'user', 'user_name', 'user_email',
            'district', 'district_name', 'date', 'time',
            'duration_hours', 'number_of_people', 'special_requests',
            'total_price', 'currency', 'status', 
            'destination_id', 'destination_name',
            'has_review', 'review',
            'created_at'
        ]
    
    def get_destination_id(self, obj):
        # Try to get destination from booking if available
        if hasattr(obj, 'destination_id') and obj.destination_id:
            return obj.destination_id
        # Otherwise try to find by district
        if obj.district:
            dest = Destination.objects.filter(district=obj.district.name).first()
            if dest:
                return dest.id
        return None
    
    def get_destination_name(self, obj):
        if hasattr(obj, 'destination_id') and obj.destination_id:
            dest = Destination.objects.filter(id=obj.destination_id).first()
            if dest:
                return dest.name
        if obj.district:
            dest = Destination.objects.filter(district=obj.district.name).first()
            if dest:
                return dest.name
        return None
    
    def get_has_review(self, obj):
        # Check if there's a destination review for this booking
        if hasattr(obj, 'destination_id') and obj.destination_id:
            return DestinationReview.objects.filter(
                user=obj.user,
                destination_id=obj.destination_id
            ).exists()
        return False
    
    def get_review(self, obj):
        if hasattr(obj, 'destination_id') and obj.destination_id:
            review = DestinationReview.objects.filter(
                user=obj.user,
                destination_id=obj.destination_id
            ).first()
            if review:
                return DestinationReviewSerializer(review).data
        return None


class BookingDetailSerializer(serializers.ModelSerializer):
    """Detailed booking serializer with all relationships"""
    guide = GuideListSerializer(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    district_name = serializers.CharField(source='district.name', read_only=True)
    review = serializers.SerializerMethodField()
    has_review = serializers.SerializerMethodField()
    destination_id = serializers.SerializerMethodField()
    destination_name = serializers.SerializerMethodField()
    
    class Meta:
        model = GuideBooking
        fields = [
            'id', 'booking_id', 'guide', 'user_name', 'user_email',
            'district', 'district_name', 'date', 'time',
            'duration_hours', 'number_of_people', 'special_requests',
            'total_price', 'currency', 'status', 
            'destination_id', 'destination_name',
            'review', 'has_review',
            'created_at', 'updated_at'
        ]
    
    def get_destination_id(self, obj):
        if hasattr(obj, 'destination_id') and obj.destination_id:
            return obj.destination_id
        if obj.district:
            dest = Destination.objects.filter(district=obj.district.name).first()
            if dest:
                return dest.id
        return None
    
    def get_destination_name(self, obj):
        if hasattr(obj, 'destination_id') and obj.destination_id:
            dest = Destination.objects.filter(id=obj.destination_id).first()
            if dest:
                return dest.name
        if obj.district:
            dest = Destination.objects.filter(district=obj.district.name).first()
            if dest:
                return dest.name
        return None
    
    def get_has_review(self, obj):
        if hasattr(obj, 'destination_id') and obj.destination_id:
            return DestinationReview.objects.filter(
                user=obj.user,
                destination_id=obj.destination_id
            ).exists()
        return False
    
    def get_review(self, obj):
        if hasattr(obj, 'destination_id') and obj.destination_id:
            review = DestinationReview.objects.filter(
                user=obj.user,
                destination_id=obj.destination_id
            ).first()
            if review:
                return DestinationReviewSerializer(review).data
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


# ============================================
# GUIDE STATS SERIALIZER
# ============================================

class GuideStatsSerializer(serializers.Serializer):
    """Serializer for guide statistics"""
    total_bookings = serializers.IntegerField()
    pending_bookings = serializers.IntegerField()
    confirmed_bookings = serializers.IntegerField()
    completed_bookings = serializers.IntegerField()
    cancelled_bookings = serializers.IntegerField()
    rejected_bookings = serializers.IntegerField()
    total_reviews = serializers.IntegerField()
    average_rating = serializers.FloatField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    district_stats = serializers.ListField()
    monthly_stats = serializers.ListField()


# ============================================
# DESTINATION REVIEW FOR GUIDE SERIALIZER
# ============================================

class GuideDestinationReviewSerializer(serializers.ModelSerializer):
    """Serializer for destination reviews shown to guides"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    destination_id = serializers.IntegerField(source='destination.id', read_only=True)
    destination_district = serializers.CharField(source='destination.district', read_only=True)
    destination_image = serializers.CharField(source='destination.featured_image', read_only=True)
    
    class Meta:
        model = DestinationReview
        fields = [
            'id', 'destination_id', 'destination_name', 'destination_district',
            'destination_image', 'user_name', 'user_email',
            'rating', 'comment', 'image', 'is_verified_traveler',
            'created_at'
        ]
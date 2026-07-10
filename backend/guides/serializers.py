# guides/serializers.py - COMPLETE FIXED VERSION

from rest_framework import serializers
from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from .models import (
    District, GuideCategory, Guide, GuideAvailability, 
    GuideBooking, GuideReview
)

User = get_user_model()

# ============================================
# DISTRICT SERIALIZER
# ============================================
class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'name', 'code', 'description', 'image', 'is_active', 'created_at']


# ============================================
# GUIDE CATEGORY SERIALIZER
# ============================================
class GuideCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideCategory
        fields = ['id', 'name', 'icon', 'description', 'is_active']


# ============================================
# GUIDE AVAILABILITY SERIALIZER
# ============================================
class GuideAvailabilitySerializer(serializers.ModelSerializer):
    is_available = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = GuideAvailability
        fields = ['id', 'date', 'start_time', 'end_time', 'is_booked', 'max_bookings', 'current_bookings', 'is_available']


# ============================================
# GUIDE LIST SERIALIZER - WITH AVAILABILITIES
# ============================================
class GuideListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing guides - INCLUDES availabilities"""
    districts = DistrictSerializer(many=True, read_only=True)
    categories = GuideCategorySerializer(many=True, read_only=True)
    profile_image_url = serializers.SerializerMethodField()
    availabilities = serializers.SerializerMethodField()  # ✅ ADDED
    
    class Meta:
        model = Guide
        fields = [
            'id', 'full_name', 'profile_image', 'profile_image_url', 'bio', 
            'years_of_experience', 'languages', 'rating', 'total_reviews', 
            'price_per_day', 'price_per_hour', 'districts', 'categories', 
            'is_available', 'is_verified',
            'availabilities'  # ✅ ADDED - This is what Guides.jsx needs
        ]
    
    def get_profile_image_url(self, obj):
        if obj.profile_image:
            return obj.profile_image.url
        return None
    
    def get_availabilities(self, obj):
        """Get future availability slots for the list view"""
        # Get slots for next 14 days (only future slots that are not booked)
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=14)
        
        slots = obj.availabilities.filter(
            date__gte=start_date,
            date__lte=end_date,
            is_booked=False
        ).order_by('date', 'start_time')[:10]  # Limit to 10 slots
        
        return GuideAvailabilitySerializer(slots, many=True).data


# ============================================
# GUIDE DETAIL SERIALIZER
# ============================================
class GuideDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single guide"""
    districts = DistrictSerializer(many=True, read_only=True)
    categories = GuideCategorySerializer(many=True, read_only=True)
    availabilities = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Guide
        fields = [
            'id', 'full_name', 'profile_image', 'profile_image_url', 'bio', 
            'phone_number', 'email', 'years_of_experience', 'languages', 
            'rating', 'total_reviews', 'price_per_day', 'price_per_hour',
            'districts', 'categories', 'availabilities', 'is_available', 
            'is_verified', 'facebook', 'instagram', 'twitter', 'website',
            'created_at', 'updated_at'
        ]
    
    def get_profile_image_url(self, obj):
        if obj.profile_image:
            return obj.profile_image.url
        return None
    
    def get_availabilities(self, obj):
        """Get next 14 days availability for detail view"""
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=14)
        availabilities = obj.availabilities.filter(
            date__range=[start_date, end_date],
            is_booked=False
        ).order_by('date', 'start_time')
        return GuideAvailabilitySerializer(availabilities, many=True).data


# ============================================
# BOOKING SERIALIZERS
# ============================================
class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideBooking
        fields = [
            'guide', 'district', 'category', 'date', 'time', 
            'duration_hours', 'number_of_people', 'special_requests'
        ]
    
    def validate(self, data):
        guide = data['guide']
        date = data['date']
        time = data['time']
        
        if not guide.is_active:
            raise serializers.ValidationError("This guide is not active")
        
        if not guide.is_available:
            raise serializers.ValidationError("This guide is currently not available")
        
        if date < datetime.now().date():
            raise serializers.ValidationError("Cannot book for past dates")
        
        availability = GuideAvailability.objects.filter(
            guide=guide,
            date=date,
            start_time=time
        ).first()
        
        if not availability:
            raise serializers.ValidationError("Guide not available at this time")
        
        if not availability.is_available():
            raise serializers.ValidationError("This time slot is already booked")
        
        if not guide.districts.filter(id=data['district'].id).exists():
            raise serializers.ValidationError("Guide does not serve this district")
        
        if data.get('category') and not guide.categories.filter(id=data['category'].id).exists():
            raise serializers.ValidationError("Guide does not offer this category")
        
        return data


class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for listing bookings"""
    guide_name = serializers.CharField(source='guide.full_name', read_only=True)
    guide_image = serializers.SerializerMethodField()
    district_name = serializers.CharField(source='district.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = GuideBooking
        fields = [
            'id', 'booking_id', 'guide_name', 'guide_image', 'district_name', 
            'category_name', 'date', 'time', 'duration_hours', 
            'number_of_people', 'total_price', 'status', 'created_at'
        ]
    
    def get_guide_image(self, obj):
        if obj.guide.profile_image:
            return obj.guide.profile_image.url
        return None


class BookingDetailSerializer(serializers.ModelSerializer):
    guide = GuideListSerializer(read_only=True)
    district = DistrictSerializer(read_only=True)
    category = GuideCategorySerializer(read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = GuideBooking
        fields = '__all__'
        read_only_fields = ['booking_id', 'user', 'total_price', 'created_at', 'updated_at']


class BookingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideBooking
        fields = ['status', 'special_requests']


# ============================================
# REVIEW SERIALIZERS
# ============================================
class GuideReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = GuideReview
        fields = ['id', 'user', 'user_name', 'user_profile_image', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'guide', 'booking']
    
    def get_user_profile_image(self, obj):
        if hasattr(obj.user, 'profile') and obj.user.profile.image:
            return obj.user.profile.image.url
        return None


class GuideReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuideReview
        fields = ['rating', 'comment']
    
    def validate(self, data):
        booking_id = self.context.get('booking_id')
        try:
            booking = GuideBooking.objects.get(id=booking_id)
        except GuideBooking.DoesNotExist:
            raise serializers.ValidationError("Booking not found")
        
        if booking.status != 'completed':
            raise serializers.ValidationError("Can only review completed bookings")
        
        if GuideReview.objects.filter(booking=booking).exists():
            raise serializers.ValidationError("Review already exists for this booking")
        
        return data
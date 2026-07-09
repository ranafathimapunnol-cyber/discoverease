# staff/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from guides.models import Guide, GuideBooking, District
from suggestions.models import Suggestion
from .models import StaffActivityLog, StaffNotification

User = get_user_model()

# ============================================
# STAFF STATS SERIALIZER
# ============================================
class StaffStatsSerializer(serializers.Serializer):
    pendingSuggestions = serializers.IntegerField(default=0)
    totalGuides = serializers.IntegerField(default=0)
    totalBookings = serializers.IntegerField(default=0)
    confirmedBookings = serializers.IntegerField(default=0)
    totalReviews = serializers.IntegerField(default=0)
    pendingReviews = serializers.IntegerField(default=0)
    totalUsers = serializers.IntegerField(default=0)

# ============================================
# GUIDE SERIALIZERS
# ============================================
class StaffGuideDistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'name']

class StaffGuideSerializer(serializers.ModelSerializer):
    primary_district = serializers.SerializerMethodField()
    districts = StaffGuideDistrictSerializer(many=True, read_only=True)
    verified_by_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    categories = serializers.SerializerMethodField()
    
    class Meta:
        model = Guide
        fields = [
            'id', 'user_id', 'full_name', 'email', 'phone_number',
            'bio', 'profile_image', 'districts', 'primary_district',
            'categories', 'years_of_experience', 'languages', 
            'price_per_day', 'price_per_hour', 'rating', 'total_reviews',
            'is_verified', 'verified_by_name', 'is_active',
            'created_at', 'updated_at', 'user_email'
        ]
    
    def get_primary_district(self, obj):
        if obj.districts.exists():
            return obj.districts.first().name
        return None
    
    def get_verified_by_name(self, obj):
        if obj.verified_by:
            return f"{obj.verified_by.first_name} {obj.verified_by.last_name}".strip()
        return None
    
    def get_categories(self, obj):
        return [c.name for c in obj.categories.all()]

class StaffGuideCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    experience_years = serializers.IntegerField(required=False, default=0)
    languages = serializers.CharField(required=False, allow_blank=True)
    primary_district = serializers.CharField(required=False, allow_blank=True)
    price_per_day = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, default=0)
    price_per_hour = serializers.DecimalField(required=False, max_digits=10, decimal_places=2, default=0)
    categories = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value

# ============================================
# BOOKING SERIALIZERS
# ============================================
class StaffBookingUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()

class StaffBookingGuideSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()

class StaffBookingDistrictSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()

class StaffBookingSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    booking_id = serializers.CharField()
    user = StaffBookingUserSerializer()
    traveler_email = serializers.EmailField()
    guide = StaffBookingGuideSerializer()
    guide_name = serializers.CharField()
    district = StaffBookingDistrictSerializer()
    date = serializers.DateField()
    time = serializers.CharField()
    duration_hours = serializers.IntegerField()
    number_of_people = serializers.IntegerField()
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()
    special_requests = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

# ============================================
# SUGGESTION SERIALIZERS
# ============================================
class StaffSuggestionUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    email = serializers.EmailField()
    username = serializers.CharField()

class StaffSuggestionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    category = serializers.CharField()
    suggestion_type = serializers.CharField()
    status = serializers.CharField()
    location_info = serializers.CharField()
    user = StaffSuggestionUserSerializer()
    processed_by = StaffSuggestionUserSerializer(allow_null=True)
    admin_notes = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

# ============================================
# STAFF INSIGHTS SERIALIZER
# ============================================
class StaffInsightsSerializer(serializers.Serializer):
    booking_status_counts = serializers.DictField()
    suggestion_status_counts = serializers.DictField()
    recent_bookings = serializers.ListField()
    recent_suggestions = serializers.ListField()
    recent_guides = serializers.ListField()

# ============================================
# STAFF ACTIVITY LOG SERIALIZER
# ============================================
class StaffActivityLogSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StaffActivityLog
        fields = ['id', 'staff', 'staff_name', 'action', 'model_name', 
                  'object_id', 'details', 'created_at']
    
    def get_staff_name(self, obj):
        return f"{obj.staff.first_name} {obj.staff.last_name}".strip() or obj.staff.email

class StaffNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffNotification
        fields = ['id', 'title', 'message', 'is_read', 'link', 'created_at']
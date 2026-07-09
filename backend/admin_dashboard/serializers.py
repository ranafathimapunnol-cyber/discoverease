# admin_dashboard/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from guides.models import Guide, GuideBooking, District
from suggestions.models import Suggestion
from .models import AdminActivityLog, AdminSettings

User = get_user_model()

# ============================================
# ADMIN STATS SERIALIZER
# ============================================
class AdminStatsSerializer(serializers.Serializer):
    totalUsers = serializers.IntegerField(default=0)
    totalGuides = serializers.IntegerField(default=0)
    totalStaff = serializers.IntegerField(default=0)
    totalAdmins = serializers.IntegerField(default=0)
    totalBookings = serializers.IntegerField(default=0)
    totalSuggestions = serializers.IntegerField(default=0)
    totalDestinations = serializers.IntegerField(default=0)
    totalReviews = serializers.IntegerField(default=0)
    pendingSuggestions = serializers.IntegerField(default=0)
    pendingBookings = serializers.IntegerField(default=0)
    pendingReviews = serializers.IntegerField(default=0)

# ============================================
# ADMIN USER SERIALIZERS
# ============================================
class AdminUserSerializer(serializers.ModelSerializer):
    has_guide_profile = serializers.SerializerMethodField()
    guide_id = serializers.SerializerMethodField()
    guide_is_verified = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'is_active', 'email_verified', 'is_staff',
            'is_superuser', 'is_deleted', 'date_joined', 'last_login',
            'has_guide_profile', 'guide_id', 'guide_is_verified'
        ]
    
    def get_has_guide_profile(self, obj):
        return hasattr(obj, 'guide_profile') and obj.guide_profile is not None
    
    def get_guide_id(self, obj):
        if hasattr(obj, 'guide_profile') and obj.guide_profile:
            return obj.guide_profile.id
        return None
    
    def get_guide_is_verified(self, obj):
        if hasattr(obj, 'guide_profile') and obj.guide_profile:
            return obj.guide_profile.is_verified
        return False
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class AdminUserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=['tourister', 'guide', 'staff', 'admin'], required=False, default='tourister')
    password = serializers.CharField(required=False, allow_blank=True)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value

class AdminUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)
    role = serializers.ChoiceField(choices=['tourister', 'guide', 'staff', 'admin'], required=False)

# ============================================
# ADMIN STAFF SERIALIZER
# ============================================
class AdminStaffSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'phone', 'is_active', 'is_staff', 'date_joined', 'last_login'
        ]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

# ============================================
# ADMIN SUGGESTION SERIALIZER
# ============================================
class AdminSuggestionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    category = serializers.CharField()
    suggestion_type = serializers.CharField()
    status = serializers.CharField()
    location_info = serializers.CharField()
    user = AdminUserSerializer()
    processed_by = AdminUserSerializer(allow_null=True)
    admin_notes = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()

# ============================================
# ADMIN GUIDE VERIFICATION SERIALIZER
# ============================================
class AdminGuideVerificationSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    guide = serializers.DictField()
    verified_by = serializers.DictField(allow_null=True)
    verified_at = serializers.DateTimeField()
    districts = serializers.ListField()
    created_at = serializers.DateTimeField()

# ============================================
# ADMIN INSIGHTS SERIALIZER
# ============================================
class AdminInsightsSerializer(serializers.Serializer):
    booking_status_counts = serializers.DictField()
    suggestion_status_counts = serializers.DictField()
    user_role_counts = serializers.DictField()
    recent_users = serializers.ListField()
    recent_bookings = serializers.ListField()
    recent_suggestions = serializers.ListField()
    recent_reviews = serializers.ListField()

# ============================================
# ADMIN ACTIVITY LOG SERIALIZER
# ============================================
class AdminActivityLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminActivityLog
        fields = ['id', 'admin', 'admin_name', 'action', 'model_name', 
                  'object_id', 'details', 'created_at']
    
    def get_admin_name(self, obj):
        return f"{obj.admin.first_name} {obj.admin.last_name}".strip() or obj.admin.email

class AdminSettingsSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminSettings
        fields = ['id', 'key', 'value', 'description', 'updated_at', 'updated_by', 'updated_by_name']
    
    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.email
        return None
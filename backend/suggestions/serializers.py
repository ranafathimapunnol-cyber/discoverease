# suggestions/serializers.py - FIXED WITH ABSOLUTE IMAGE URLS

from rest_framework import serializers
from django.core.validators import MaxLengthValidator
from .models import Suggestion
from accounts.models import User
from guides.models import Guide, District


class SuggestionSerializer(serializers.ModelSerializer):
    """Main suggestion serializer with all FK relationships"""
    
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    guide_name = serializers.CharField(source='guide.full_name', read_only=True, allow_null=True)
    processed_by_name = serializers.CharField(source='processed_by.email', read_only=True, allow_null=True)
    district_name = serializers.CharField(source='district', read_only=True)
    
    status_display = serializers.SerializerMethodField()
    suggestion_type_display = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Suggestion
        fields = [
            'id',
            'user', 'username', 'user_email', 'user_full_name',
            'guide', 'guide_name',
            'processed_by', 'processed_by_name',
            'destination',
            'suggestion_type', 'suggestion_type_display',
            'status', 'status_display',
            'name', 'title', 'description', 'category',
            'location_info', 'district', 'district_name',
            'admin_notes', 'guide_notes', 'rejection_reason',
            'image', 'image_url', 'images',
            'rating', 'metadata', 'visit_date',
            'guide_processed_at', 'processed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'status', 'processed_by', 'processed_at',
            'guide_processed_at', 'created_at', 'updated_at'
        ]
    
    def get_user_full_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return None
    
    def get_status_display(self, obj):
        return dict(Suggestion.Status.choices).get(obj.status, obj.status)
    
    def get_suggestion_type_display(self, obj):
        return dict(Suggestion.SuggestionType.choices).get(obj.suggestion_type, obj.suggestion_type)
    
    def get_image_url(self, obj):
        """✅ FIXED: Return absolute URL for image"""
        if obj.image and hasattr(obj.image, 'url'):
            try:
                request = self.context.get('request')
                if request:
                    # Build absolute URI with request
                    return request.build_absolute_uri(obj.image.url)
                # Fallback: return the URL as is
                return obj.image.url
            except Exception as e:
                print(f"Error getting image URL: {e}")
                return None
        return None


class SuggestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating suggestions - ONLY MAX LIMITS"""
    
    class Meta:
        model = Suggestion
        fields = [
            'suggestion_type', 'name', 'title', 'description',
            'category', 'location_info', 'district',
            'destination', 'image', 'images',
            'rating', 'metadata', 'visit_date'
        ]
    
    def validate(self, data):
        """Validate - ONLY MAX LIMITS and required checks"""
        suggestion_type = data.get('suggestion_type')
        name = data.get('name')
        description = data.get('description')
        district = data.get('district')
        category = data.get('category')
        rating = data.get('rating')
        
        # Name is required
        if not name:
            raise serializers.ValidationError({
                'name': 'Name is required'
            })
        if len(name) > 200:
            raise serializers.ValidationError({
                'name': 'Name cannot exceed 200 characters'
            })
        
        # Description is required
        if not description:
            raise serializers.ValidationError({
                'description': 'Description is required'
            })
        if len(description) > 5000:
            raise serializers.ValidationError({
                'description': 'Description cannot exceed 5000 characters'
            })
        
        # District is required
        if not district:
            raise serializers.ValidationError({
                'district': 'District is required'
            })
        if len(district) > 100:
            raise serializers.ValidationError({
                'district': 'District cannot exceed 100 characters'
            })
        
        # Category validation for new/hidden_gem
        if suggestion_type in ['new', 'hidden_gem']:
            if not category:
                raise serializers.ValidationError({
                    'category': 'Category is required for new place/hidden gem suggestions'
                })
            if len(category) > 50:
                raise serializers.ValidationError({
                    'category': 'Category cannot exceed 50 characters'
                })
        
        # Rating validation for reviews
        if suggestion_type == 'review':
            if not rating:
                raise serializers.ValidationError({
                    'rating': 'Rating is required for reviews'
                })
            if rating > 5:
                raise serializers.ValidationError({
                    'rating': 'Rating cannot exceed 5'
                })
        
        # Location info max length
        if data.get('location_info') and len(data['location_info']) > 1000:
            raise serializers.ValidationError({
                'location_info': 'Location info cannot exceed 1000 characters'
            })
        
        return data


class SuggestionStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating suggestion status"""
    status = serializers.ChoiceField(choices=Suggestion.Status.choices)
    admin_notes = serializers.CharField(
        max_length=2000,
        required=False,
        allow_blank=True
    )
    guide_notes = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True
    )
    rejection_reason = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True
    )
    
    def validate_admin_notes(self, value):
        if value and len(value) > 2000:
            raise serializers.ValidationError("Admin notes cannot exceed 2000 characters")
        return value
    
    def validate_guide_notes(self, value):
        if value and len(value) > 1000:
            raise serializers.ValidationError("Guide notes cannot exceed 1000 characters")
        return value
    
    def validate_rejection_reason(self, value):
        if value and len(value) > 500:
            raise serializers.ValidationError("Rejection reason cannot exceed 500 characters")
        return value


class SuggestionListSerializer(serializers.ModelSerializer):
    """✅ FIXED: Lightweight serializer for listing suggestions with ABSOLUTE IMAGE URL"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    status_display = serializers.SerializerMethodField()
    suggestion_type_display = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Suggestion
        fields = [
            'id', 'name', 'title', 'description', 'category',
            'suggestion_type', 'suggestion_type_display',
            'status', 'status_display',
            'user_email', 'username', 'district',
            'image_url', 'rating',
            'created_at', 'updated_at'
        ]
    
    def get_status_display(self, obj):
        return dict(Suggestion.Status.choices).get(obj.status, obj.status)
    
    def get_suggestion_type_display(self, obj):
        return dict(Suggestion.SuggestionType.choices).get(obj.suggestion_type, obj.suggestion_type)
    
    def get_image_url(self, obj):
        """✅ FIXED: Return absolute URL for image with request context"""
        if obj.image and hasattr(obj.image, 'url'):
            try:
                # Get request from context
                request = self.context.get('request')
                if request:
                    # Build absolute URI
                    full_url = request.build_absolute_uri(obj.image.url)
                    print(f"✅ Generated image URL: {full_url}")  # Debug log
                    return full_url
                # Fallback: return the URL as is
                print(f"⚠️ No request context, returning relative URL: {obj.image.url}")
                return obj.image.url
            except Exception as e:
                print(f"❌ Error getting image URL: {e}")
                return None
        return None
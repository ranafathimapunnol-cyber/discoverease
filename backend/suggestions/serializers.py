# suggestions/serializers.py - COMPLETE WITH ALL FIELDS

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
    
    # Who approved/rejected
    guide_approved_by_name = serializers.CharField(source='guide_approved_by.email', read_only=True, allow_null=True)
    guide_rejected_by_name = serializers.CharField(source='guide_rejected_by.email', read_only=True, allow_null=True)
    staff_approved_by_name = serializers.CharField(source='staff_approved_by.email', read_only=True, allow_null=True)
    staff_rejected_by_name = serializers.CharField(source='staff_rejected_by.email', read_only=True, allow_null=True)
    admin_implemented_by_name = serializers.CharField(source='admin_implemented_by.email', read_only=True, allow_null=True)
    
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
            # Tracking fields
            'guide_approved_by', 'guide_approved_by_name',
            'guide_approved_at',
            'guide_rejected_by', 'guide_rejected_by_name',
            'guide_rejected_at',
            'staff_approved_by', 'staff_approved_by_name',
            'staff_approved_at',
            'staff_rejected_by', 'staff_rejected_by_name',
            'staff_rejected_at',
            'admin_implemented_by', 'admin_implemented_by_name',
            'admin_implemented_at',
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
        if obj.image and hasattr(obj.image, 'url'):
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
            except Exception:
                return None
        return None


class SuggestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating suggestions"""
    
    class Meta:
        model = Suggestion
        fields = [
            'suggestion_type', 'name', 'title', 'description',
            'category', 'location_info', 'district',
            'destination', 'image', 'images',
            'rating', 'metadata', 'visit_date'
        ]
    
    def validate(self, data):
        suggestion_type = data.get('suggestion_type')
        name = data.get('name')
        description = data.get('description')
        district = data.get('district')
        category = data.get('category')
        rating = data.get('rating')
        
        if not name:
            raise serializers.ValidationError({'name': 'Name is required'})
        if len(name) > 200:
            raise serializers.ValidationError({'name': 'Name cannot exceed 200 characters'})
        
        if not description:
            raise serializers.ValidationError({'description': 'Description is required'})
        if len(description) > 5000:
            raise serializers.ValidationError({'description': 'Description cannot exceed 5000 characters'})
        
        if not district:
            raise serializers.ValidationError({'district': 'District is required'})
        if len(district) > 100:
            raise serializers.ValidationError({'district': 'District cannot exceed 100 characters'})
        
        if suggestion_type in ['new', 'hidden_gem']:
            if not category:
                raise serializers.ValidationError({'category': 'Category is required for new place/hidden gem suggestions'})
            if len(category) > 50:
                raise serializers.ValidationError({'category': 'Category cannot exceed 50 characters'})
        
        if suggestion_type == 'review':
            if not rating:
                raise serializers.ValidationError({'rating': 'Rating is required for reviews'})
            if rating > 5:
                raise serializers.ValidationError({'rating': 'Rating cannot exceed 5'})
        
        if data.get('location_info') and len(data['location_info']) > 1000:
            raise serializers.ValidationError({'location_info': 'Location info cannot exceed 1000 characters'})
        
        return data


class SuggestionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing suggestions"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    status_display = serializers.SerializerMethodField()
    suggestion_type_display = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    # Who approved/rejected
    guide_approved_by_name = serializers.CharField(source='guide_approved_by.email', read_only=True, allow_null=True)
    staff_approved_by_name = serializers.CharField(source='staff_approved_by.email', read_only=True, allow_null=True)
    admin_implemented_by_name = serializers.CharField(source='admin_implemented_by.email', read_only=True, allow_null=True)
    
    class Meta:
        model = Suggestion
        fields = [
            'id', 'name', 'title', 'description', 'category',
            'suggestion_type', 'suggestion_type_display',
            'status', 'status_display',
            'user_email', 'username', 'district',
            'image_url', 'rating',
            'guide_approved_by_name', 'guide_approved_at',
            'staff_approved_by_name', 'staff_approved_at',
            'admin_implemented_by_name', 'admin_implemented_at',
            'created_at', 'updated_at'
        ]
    
    def get_status_display(self, obj):
        return dict(Suggestion.Status.choices).get(obj.status, obj.status)
    
    def get_suggestion_type_display(self, obj):
        return dict(Suggestion.SuggestionType.choices).get(obj.suggestion_type, obj.suggestion_type)
    
    def get_image_url(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
            except Exception:
                return None
        return None
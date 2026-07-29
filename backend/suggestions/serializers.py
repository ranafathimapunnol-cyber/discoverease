# suggestions/serializers.py - COMPLETE FIXED VERSION

from rest_framework import serializers
from django.core.validators import MaxLengthValidator
from .models import Suggestion, SuggestionImage, SuggestionNotification
from django.contrib.auth import get_user_model

User = get_user_model()


class SuggestionImageSerializer(serializers.ModelSerializer):
    """Serializer for SuggestionImage model with full URL"""
    
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SuggestionImage
        fields = [
            'id', 'suggestion', 'image', 'image_url', 
            'caption', 'order', 'is_primary',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.image.url)
                return obj.image.url
            except Exception:
                return None
        return None


class SuggestionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing suggestions - NO 'image' field"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    status_display = serializers.SerializerMethodField()
    suggestion_type_display = serializers.SerializerMethodField()
    
    # ✅ Use method fields instead of direct model fields
    primary_image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    images_data = serializers.SerializerMethodField()
    
    class Meta:
        model = Suggestion
        fields = [
            'id', 'name', 'title', 'description', 'category',
            'suggestion_type', 'suggestion_type_display',
            'status', 'status_display',
            'user_email', 'username', 'district',
            # ✅ No 'image' field here - use method fields
            'primary_image', 'image_url', 'images_data',
            'rating',
            'created_at', 'updated_at'
        ]
    
    def get_status_display(self, obj):
        return dict(Suggestion.Status.choices).get(obj.status, obj.status)
    
    def get_suggestion_type_display(self, obj):
        return dict(Suggestion.SuggestionType.choices).get(obj.suggestion_type, obj.suggestion_type)
    
    def get_image_url(self, obj):
        """Get first image URL"""
        first_image = obj.images.first()
        if first_image and first_image.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_image.image.url)
                return first_image.image.url
            except Exception:
                return None
        return None
    
    def get_primary_image(self, obj):
        """Get primary image URL"""
        primary = obj.images.filter(is_primary=True).first()
        if primary and primary.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(primary.image.url)
                return primary.image.url
            except Exception:
                return None
        # Fallback to first image
        first = obj.images.first()
        if first and first.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first.image.url)
                return first.image.url
            except Exception:
                return None
        return None
    
    def get_images_data(self, obj):
        """Get all images with URLs"""
        request = self.context.get('request')
        images = obj.images.all().order_by('order')
        return SuggestionImageSerializer(images, many=True, context={'request': request}).data


class SuggestionAdminListSerializer(serializers.ModelSerializer):
    """Admin serializer with all data including images"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    processed_by_email = serializers.EmailField(source='processed_by.email', read_only=True, allow_null=True)
    status_display = serializers.SerializerMethodField()
    suggestion_type_display = serializers.SerializerMethodField()
    
    # ✅ Use method fields for images
    images_data = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    # Guide tracking
    guide_approved_by_email = serializers.EmailField(source='guide_approved_by.email', read_only=True, allow_null=True)
    guide_rejected_by_email = serializers.EmailField(source='guide_rejected_by.email', read_only=True, allow_null=True)
    staff_approved_by_email = serializers.EmailField(source='staff_approved_by.email', read_only=True, allow_null=True)
    staff_rejected_by_email = serializers.EmailField(source='staff_rejected_by.email', read_only=True, allow_null=True)
    admin_implemented_by_email = serializers.EmailField(source='admin_implemented_by.email', read_only=True, allow_null=True)
    
    class Meta:
        model = Suggestion
        fields = [
            'id', 'name', 'title', 'description', 'category',
            'suggestion_type', 'suggestion_type_display',
            'status', 'status_display',
            'user_email', 'username', 'district', 'location_info',
            'rating', 'admin_notes', 'guide_notes', 'rejection_reason',
            # ✅ No 'image' field - use method fields
            'primary_image', 'image_url', 'images_data',
            'guide_approved_by_email', 'guide_approved_at',
            'guide_rejected_by_email', 'guide_rejected_at',
            'staff_approved_by_email', 'staff_approved_at',
            'staff_rejected_by_email', 'staff_rejected_at',
            'admin_implemented_by_email', 'admin_implemented_at',
            'processed_by_email', 'processed_at',
            'created_at', 'updated_at'
        ]
    
    def get_status_display(self, obj):
        return dict(Suggestion.Status.choices).get(obj.status, obj.status)
    
    def get_suggestion_type_display(self, obj):
        return dict(Suggestion.SuggestionType.choices).get(obj.suggestion_type, obj.suggestion_type)
    
    def get_image_url(self, obj):
        """Get first image URL"""
        first_image = obj.images.first()
        if first_image and first_image.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_image.image.url)
                return first_image.image.url
            except Exception:
                return None
        return None
    
    def get_primary_image(self, obj):
        """Get primary image URL"""
        primary = obj.images.filter(is_primary=True).first()
        if primary and primary.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(primary.image.url)
                return primary.image.url
            except Exception:
                return None
        first = obj.images.first()
        if first and first.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first.image.url)
                return first.image.url
            except Exception:
                return None
        return None
    
    def get_images_data(self, obj):
        """Get all images with URLs"""
        request = self.context.get('request')
        images = obj.images.all().order_by('order')
        return SuggestionImageSerializer(images, many=True, context={'request': request}).data


class SuggestionSerializer(serializers.ModelSerializer):
    """Full suggestion serializer"""
    
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    status_display = serializers.SerializerMethodField()
    suggestion_type_display = serializers.SerializerMethodField()
    
    # ✅ Use method fields for images
    image_url = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    images_data = serializers.SerializerMethodField()
    
    class Meta:
        model = Suggestion
        fields = [
            'id', 'name', 'title', 'description', 'category',
            'suggestion_type', 'suggestion_type_display',
            'status', 'status_display',
            'user', 'username', 'user_email',
            'district', 'location_info',
            'rating', 'admin_notes',
            # ✅ No 'image' field
            'image_url', 'primary_image', 'images_data',
            'created_at', 'updated_at'
        ]
    
    def get_status_display(self, obj):
        return dict(Suggestion.Status.choices).get(obj.status, obj.status)
    
    def get_suggestion_type_display(self, obj):
        return dict(Suggestion.SuggestionType.choices).get(obj.suggestion_type, obj.suggestion_type)
    
    def get_image_url(self, obj):
        first_image = obj.images.first()
        if first_image and first_image.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first_image.image.url)
                return first_image.image.url
            except Exception:
                return None
        return None
    
    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary and primary.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(primary.image.url)
                return primary.image.url
            except Exception:
                return None
        first = obj.images.first()
        if first and first.image:
            try:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(first.image.url)
                return first.image.url
            except Exception:
                return None
        return None
    
    def get_images_data(self, obj):
        request = self.context.get('request')
        images = obj.images.all().order_by('order')
        return SuggestionImageSerializer(images, many=True, context={'request': request}).data


class SuggestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating suggestions"""
    
    images = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
        help_text="List of images to upload"
    )
    
    class Meta:
        model = Suggestion
        fields = [
            'suggestion_type', 'name', 'title', 'description',
            'category', 'location_info', 'district',
            'images', 'rating', 'visit_date'
        ]
    
    def validate(self, data):
        suggestion_type = data.get('suggestion_type')
        name = data.get('name')
        description = data.get('description')
        district = data.get('district')
        category = data.get('category')
        rating = data.get('rating')
        
        if not name or not name.strip():
            raise serializers.ValidationError({'name': 'Name is required'})
        if len(name) > 200:
            raise serializers.ValidationError({'name': 'Name cannot exceed 200 characters'})
        
        if not description or not description.strip():
            raise serializers.ValidationError({'description': 'Description is required'})
        if len(description) > 5000:
            raise serializers.ValidationError({'description': 'Description cannot exceed 5000 characters'})
        
        if not district or not district.strip():
            raise serializers.ValidationError({'district': 'District is required'})
        if len(district) > 100:
            raise serializers.ValidationError({'district': 'District cannot exceed 100 characters'})
        
        if suggestion_type in ['hidden_gem', 'new']:
            if not category:
                raise serializers.ValidationError({'category': 'Category is required for this type'})
        
        if suggestion_type == 'review' and not rating:
            raise serializers.ValidationError({'rating': 'Rating is required for reviews'})
        
        return data
    
    def create(self, validated_data):
        images = validated_data.pop('images', [])
        suggestion = Suggestion.objects.create(**validated_data)
        
        for idx, img in enumerate(images):
            SuggestionImage.objects.create(
                suggestion=suggestion,
                image=img,
                order=idx,
                is_primary=(idx == 0)
            )
        
        return suggestion


class SuggestionNotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    
    recipient_email = serializers.EmailField(source='recipient.email', read_only=True)
    
    class Meta:
        model = SuggestionNotification
        fields = [
            'id', 'recipient', 'recipient_email',
            'suggestion', 'notification_type',
            'title', 'message', 'is_read', 'read_at',
            'link', 'metadata', 'created_at'
        ]
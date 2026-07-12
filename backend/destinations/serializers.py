# destinations/serializers.py
from rest_framework import serializers
from .models import Destination, Review
from accounts.serializers import UserSerializer

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'user_id', 'rating', 'comment', 'is_verified_traveler', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class DestinationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    category_label = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Destination
        fields = ['id', 'name', 'slug', 'category', 'category_label', 'district', 
                  'featured_image', 'average_rating', 'total_reviews', 'review_count',
                  'status', 'type', 'created_at']
    
    def get_category_label(self, obj):
        return dict(Destination.Category.choices).get(obj.category, obj.category)
    
    def get_review_count(self, obj):
        return obj.total_reviews or obj.reviews.count()

class DestinationSerializer(serializers.ModelSerializer):
    """Full serializer with all fields"""
    category_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    reviews = ReviewSerializer(many=True, read_only=True)
    added_by = UserSerializer(read_only=True)
    verified_by = UserSerializer(read_only=True)
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Destination
        fields = [
            'id', 'name', 'slug', 'short_description', 'long_description',
            'category', 'category_label', 'status', 'status_label', 'type',
            'latitude', 'longitude', 'address', 'district',
            'featured_image', 'gallery_images',
            'average_rating', 'total_reviews', 'review_count', 'visit_count',
            'reviews',
            'added_by', 'verified_by', 'verified_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'average_rating', 'total_reviews', 
                           'visit_count', 'created_at', 'updated_at', 'added_by', 
                           'verified_by', 'verified_at']
    
    def get_category_label(self, obj):
        return dict(Destination.Category.choices).get(obj.category, obj.category)
    
    def get_status_label(self, obj):
        return dict(Destination.Status.choices).get(obj.status, obj.status)
    
    def get_review_count(self, obj):
        return obj.total_reviews or obj.reviews.count()

class CategorySerializer(serializers.Serializer):
    """Serializer for category information"""
    key = serializers.CharField()
    label = serializers.CharField()
    count = serializers.IntegerField()
    description = serializers.CharField()
    image = serializers.URLField()
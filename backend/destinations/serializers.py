# destinations/serializers.py
from rest_framework import serializers
from .models import Destination, Review

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'user_email', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
    
    def get_user_email(self, obj):
        return obj.user.email


class DestinationSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    category_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    added_by_name = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    reviews = ReviewSerializer(many=True, read_only=True)
    
    class Meta:
        model = Destination
        fields = [
            'id', 'name', 'slug', 'short_description', 'long_description',
            'category', 'category_label', 'status', 'status_label',
            'district', 'address', 'featured_image', 'gallery_images',
            'latitude', 'longitude',
            'average_rating', 'total_reviews', 'visit_count',
            'added_by', 'added_by_name', 'verified_by', 'verified_at',
            'type', 'created_at', 'updated_at', 'review_count', 'reviews'
        ]
        read_only_fields = ['added_by', 'verified_by', 'verified_at', 'slug']
    
    def get_type(self, obj):
        if obj.status == Destination.Status.HIDDEN:
            return 'hidden'
        return 'well-known'
    
    def get_category_label(self, obj):
        return dict(Destination.Category.choices).get(obj.category, obj.category)
    
    def get_status_label(self, obj):
        return dict(Destination.Status.choices).get(obj.status, obj.status)
    
    def get_added_by_name(self, obj):
        if obj.added_by:
            return f"{obj.added_by.first_name} {obj.added_by.last_name}".strip() or obj.added_by.username
        return None
    
    def get_review_count(self, obj):
        return obj.reviews.count()
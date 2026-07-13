# destinations/serializers.py - FIXED

from rest_framework import serializers
from .models import Destination, Review, Category

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_name', 'user_email', 'destination', 
            'rating', 'comment', 'image', 'images', 'is_approved',
            'is_verified_traveler', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
    
    def get_user_email(self, obj):
        return obj.user.email

class DestinationListSerializer(serializers.ModelSerializer):
    category_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    added_by_name = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Destination
        fields = [
            'id', 'name', 'slug', 'short_description', 'category', 'category_label',
            'status', 'status_label', 'district', 'featured_image', 
            'average_rating', 'total_reviews', 'reviews_count', 'visit_count',
            'added_by_name', 'created_at'
        ]
    
    def get_category_label(self, obj):
        return dict(Destination.CategoryChoice.choices).get(obj.category, obj.category)
    
    def get_status_label(self, obj):
        return dict(Destination.Status.choices).get(obj.status, obj.status)
    
    def get_added_by_name(self, obj):
        if obj.added_by:
            return f"{obj.added_by.first_name} {obj.added_by.last_name}".strip() or obj.added_by.username
        return 'Anonymous'
    
    def get_reviews_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()

class DestinationSerializer(serializers.ModelSerializer):
    reviews = ReviewSerializer(many=True, read_only=True)
    category_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()
    added_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Destination
        fields = [
            'id', 'name', 'slug', 'short_description', 'long_description',
            'category', 'category_label', 'status', 'status_label',
            'latitude', 'longitude', 'address', 'district',
            'featured_image', 'gallery_images',
            'average_rating', 'total_reviews', 'visit_count',
            'added_by', 'added_by_name', 'verified_by', 'verified_at',
            'created_at', 'updated_at', 'reviews'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at', 'average_rating', 'total_reviews']
    
    def get_category_label(self, obj):
        return dict(Destination.CategoryChoice.choices).get(obj.category, obj.category)
    
    def get_status_label(self, obj):
        return dict(Destination.Status.choices).get(obj.status, obj.status)
    
    def get_added_by_name(self, obj):
        if obj.added_by:
            return f"{obj.added_by.first_name} {obj.added_by.last_name}".strip() or obj.added_by.username
        return 'Anonymous'

class CategorySerializer(serializers.ModelSerializer):
    destination_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'key', 'label', 'description', 'image', 
            'destination_count', 'created_at', 'updated_at'
        ]
    
    def get_destination_count(self, obj):
        return Destination.objects.filter(category=obj.key).count()
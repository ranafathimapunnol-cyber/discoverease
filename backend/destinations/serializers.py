# destinations/serializers.py - COMPLETE FIXED VERSION

from rest_framework import serializers
from .models import Destination, Review, Category, CategoryData, CategoryPlace, Wishlist


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'key', 'label', 'description', 'image', 'created_at', 'updated_at']


class CategoryDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryData
        fields = ['id', 'key', 'title', 'description', 'type', 'icon', 'image', 'is_active', 'order', 'created_at', 'updated_at']


class CategoryPlaceSerializer(serializers.ModelSerializer):
    destination_id = serializers.IntegerField(source='destination.id', read_only=True, allow_null=True)
    
    class Meta:
        model = CategoryPlace
        fields = [
            'id', 'category', 'name', 'location', 'description', 
            'difficulty', 'duration', 'best_time', 'image', 'type', 
            'hidden_gem', 'destination_id', 'is_active', 'created_at', 'updated_at'
        ]


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_name', 'user_email', 'destination',
            'rating', 'comment', 'is_verified_traveler', 'is_approved',
            'image', 'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'is_approved', 'created_at', 'updated_at']


class DestinationListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destination
        fields = [
            'id', 'name', 'slug', 'short_description', 'category', 'status',
            'district', 'featured_image', 'average_rating', 'total_reviews',
            'visit_count', 'created_at', 'updated_at'
        ]


class DestinationSerializer(serializers.ModelSerializer):
    reviews = ReviewSerializer(many=True, read_only=True)
    added_by_name = serializers.CharField(source='added_by.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = Destination
        fields = [
            'id', 'name', 'slug', 'short_description', 'long_description',
            'category', 'status', 'latitude', 'longitude', 'address', 'district',
            'featured_image', 'gallery_images', 'average_rating', 'total_reviews',
            'visit_count', 'added_by', 'added_by_name', 'verified_by', 'verified_by_name',
            'verified_at', 'reviews', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'slug', 'average_rating', 'total_reviews', 'visit_count',
            'added_by', 'verified_by', 'verified_at', 'created_at', 'updated_at'
        ]


class WishlistSerializer(serializers.ModelSerializer):
    destination_id = serializers.IntegerField(source='destination.id', read_only=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    destination_image = serializers.CharField(source='destination.featured_image', read_only=True)
    destination_category = serializers.CharField(source='destination.category', read_only=True)
    destination_district = serializers.CharField(source='destination.district', read_only=True)
    destination_rating = serializers.DecimalField(
        source='destination.average_rating', 
        read_only=True, 
        max_digits=3, 
        decimal_places=2
    )
    destination_description = serializers.CharField(
        source='destination.short_description', 
        read_only=True
    )
    destination_slug = serializers.CharField(source='destination.slug', read_only=True)
    
    class Meta:
        model = Wishlist
        fields = [
            'id',
            'destination_id',
            'destination_name',
            'destination_image',
            'destination_category',
            'destination_district',
            'destination_rating',
            'destination_description',
            'destination_slug',
            'notes',
            'added_at'
        ]
        read_only_fields = ['user', 'added_at']
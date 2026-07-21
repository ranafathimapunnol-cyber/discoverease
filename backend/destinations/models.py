# destinations/models.py - COMPLETE FIXED VERSION

from django.db import models
from django.conf import settings
from django.utils.text import slugify
from accounts.models import User


class Category(models.Model):
    """Category model for destinations"""
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.URLField(blank=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'categories'
        ordering = ['label']
    
    def __str__(self):
        return self.label


class CategoryData(models.Model):
    """Category metadata and grouping - For your frontend category data"""
    key = models.CharField(max_length=100, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=50, blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    image = models.URLField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'category_data'
        ordering = ['order', 'title']
    
    def __str__(self):
        return self.title


class CategoryPlace(models.Model):
    """Individual places within categories - From your frontend data"""
    category = models.CharField(max_length=100, db_index=True)
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    district = models.CharField(max_length=100, blank=True, null=True, help_text="District where this place is located")
    description = models.TextField()
    difficulty = models.CharField(max_length=50, blank=True, null=True)
    duration = models.CharField(max_length=100, blank=True, null=True)
    best_time = models.CharField(max_length=100, blank=True, null=True)
    image = models.URLField(max_length=500, blank=True, null=True)
    type = models.CharField(max_length=50, default='well-known')
    hidden_gem = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ✅ ADD THIS - Link to Destination model
    destination = models.ForeignKey(
        'Destination',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='category_places'
    )
    
    class Meta:
        db_table = 'category_places'
        ordering = ['name']
        indexes = [
            models.Index(fields=['category', 'name']),
            models.Index(fields=['category', 'type']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.category})"


class Destination(models.Model):
    """Main Destination Table with Status"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Verification'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        HIDDEN = 'hidden', 'Hidden Gem'
    
    class CategoryChoice(models.TextChoices):
        BEACH = 'beach', 'Beach'
        HILL = 'hill', 'Hill Station'
        BACKWATER = 'backwater', 'Backwater'
        HERITAGE = 'heritage', 'Heritage'
        WILDLIFE = 'wildlife', 'Wildlife'
        TEMPLE = 'temple', 'Temple'
        WATERFALLS = 'waterfalls', 'Waterfalls'
        FORT = 'fort', 'Fort/Palace'
        OTHER = 'other', 'Other'
    
    # Basic Info
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(unique=True, blank=True)
    short_description = models.CharField(max_length=300)
    long_description = models.TextField()
    category = models.CharField(max_length=20, choices=CategoryChoice.choices, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    
    # Location
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    
    # Media
    featured_image = models.URLField(max_length=500)
    gallery_images = models.JSONField(default=list, blank=True)
    
    # Stats
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.IntegerField(default=0)
    visit_count = models.IntegerField(default=0)
    
    # Metadata
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='added_destinations')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_destinations')
    verified_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'destinations'
        indexes = [
            models.Index(fields=['name', 'category', 'status', 'district']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name


class Review(models.Model):
    """User Reviews"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    is_verified_traveler = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    image = models.URLField(max_length=500, blank=True, null=True)
    images = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reviews'
        unique_together = ['user', 'destination']
        indexes = [
            models.Index(fields=['destination', 'rating']),
            models.Index(fields=['is_approved']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.destination.name} ({self.rating}★)"


# ✅ WISHLIST MODEL - FIXED
class Wishlist(models.Model):
    """User wishlist for destinations"""
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='wishlist_items'
    )
    destination = models.ForeignKey(
        'destinations.Destination',
        on_delete=models.CASCADE,
        related_name='wishlisted_by'
    )
    added_at = models.DateTimeField(auto_now_add=True)
    notes = models.CharField(max_length=500, blank=True, null=True)
    
    class Meta:
        db_table = 'wishlists'
        unique_together = ['user', 'destination']
        ordering = ['-added_at']
        indexes = [
            models.Index(fields=['user', 'destination']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.destination.name}"
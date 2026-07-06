# destinations/models.py
from django.db import models
from django.utils.text import slugify
from accounts.models import User

class Destination(models.Model):
    """Main Destination Table with Status"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Verification'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        HIDDEN = 'hidden', 'Hidden Gem'
    
    class Category(models.TextChoices):
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
    category = models.CharField(max_length=20, choices=Category.choices, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    
    # Location
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    district = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    
    # Media
    featured_image = models.URLField()
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
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'reviews'
        unique_together = ['user', 'destination']
        indexes = [
            models.Index(fields=['destination', 'rating']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.destination.name} ({self.rating}★)"
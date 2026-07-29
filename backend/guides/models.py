# guides/models.py - COMPLETE FIXED VERSION WITH DESTINATION FOREIGN KEY

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

User = get_user_model()


class District(models.Model):
    """14 Districts of Kerala"""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='districts/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class GuideCategory(models.Model):
    """Categories like: History, Food, Nature, Adventure, Culture, etc."""
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Emoji or icon code")
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.icon} {self.name}" if self.icon else self.name

    class Meta:
        verbose_name_plural = "Guide Categories"
        ordering = ['name']


class Guide(models.Model):
    """Guide profile"""
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='guide_profile'
    )
    
    full_name = models.CharField(max_length=200)
    profile_image = models.ImageField(upload_to='guides/', blank=True, null=True)
    bio = models.TextField(blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField()
    
    years_of_experience = models.IntegerField(default=0)
    languages = models.CharField(max_length=200, blank=True, default='')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.IntegerField(default=0)
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    price_per_hour = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    districts = models.ManyToManyField(District, related_name='guides', blank=True)
    categories = models.ManyToManyField(GuideCategory, related_name='guides', blank=True)
    
    is_available = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    verified_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='verified_guides'
    )
    
    facebook = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    twitter = models.URLField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name

    def get_districts_list(self):
        return [d.name for d in self.districts.all()]

    def get_categories_list(self):
        return [c.name for c in self.categories.all()]

    class Meta:
        ordering = ['-rating']


class GuideAvailability(models.Model):
    """Specific availability slots for guides"""
    guide = models.ForeignKey(Guide, on_delete=models.CASCADE, related_name='availabilities')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_booked = models.BooleanField(default=False)
    max_bookings = models.IntegerField(default=1)
    current_bookings = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['guide', 'date', 'start_time']
        ordering = ['date', 'start_time']
        verbose_name_plural = "Guide Availabilities"

    def is_available(self):
        return not self.is_booked and self.current_bookings < self.max_bookings

    def available_slots(self):
        return self.max_bookings - self.current_bookings

    def book_slot(self):
        if self.is_available():
            self.current_bookings += 1
            if self.current_bookings >= self.max_bookings:
                self.is_booked = True
            self.save()
            return True
        return False

    def cancel_booking(self):
        if self.current_bookings > 0:
            self.current_bookings -= 1
            if self.is_booked:
                self.is_booked = False
            self.save()
            return True
        return False

    def __str__(self):
        return f"{self.guide.full_name} - {self.date} {self.start_time}"


class GuideBooking(models.Model):
    """Booking model for guide services"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
    ]
    
    booking_id = models.CharField(max_length=20, unique=True, editable=False)
    guide = models.ForeignKey(Guide, on_delete=models.CASCADE, related_name='bookings')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='guide_bookings')
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, related_name='guide_bookings')
    category = models.ForeignKey(GuideCategory, on_delete=models.SET_NULL, null=True, blank=True)
    availability = models.ForeignKey(GuideAvailability, on_delete=models.SET_NULL, null=True, blank=True)
    
    # ✅ ADD DESTINATION FOREIGN KEY
    destination = models.ForeignKey(
        'destinations.Destination',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='guide_bookings',
        help_text="The destination/location for this booking"
    )
    
    date = models.DateField()
    time = models.TimeField()
    duration_hours = models.IntegerField(default=2)
    number_of_people = models.IntegerField(default=1)
    special_requests = models.TextField(blank=True, default='')
    
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default='USD')
    reminder_sent = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.booking_id:
            self.booking_id = f"BK-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def can_cancel(self):
        return self.status in ['pending', 'confirmed']

    def can_complete(self):
        return self.status == 'confirmed'

    def __str__(self):
        return f"{self.booking_id} - {self.guide.full_name} - {self.destination.name if self.destination else 'No destination'}"

    class Meta:
        ordering = ['-created_at']
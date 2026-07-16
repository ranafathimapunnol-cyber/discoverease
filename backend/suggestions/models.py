# suggestions/models.py - COMPLETE FIXED VERSION (NO MINIMUM VALIDATORS)

from django.db import models
from django.core.validators import MaxLengthValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Suggestion(models.Model):
    """UNIFIED Suggestion Table - Handles all user suggestions with image support"""
    
    class SuggestionType(models.TextChoices):
        NEW_PLACE = 'new', 'Suggest New Destination'
        UPDATE_INFO = 'update', 'Update Existing Destination'
        REPORT_ISSUE = 'report', 'Report Issue/Problem'
        FEATURE_REQUEST = 'feature', 'Feature Request'
        HIDDEN_GEM = 'hidden_gem', 'Hidden Gem'
        LOCAL_INSIGHT = 'local_insight', 'Local Insight'
        REVIEW = 'review', 'Review'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        IN_PROGRESS = 'in_progress', 'In Progress'
        APPROVED_BY_GUIDE = 'approved_by_guide', 'Approved by Guide'
        REJECTED_BY_GUIDE = 'rejected_by_guide', 'Rejected by Guide'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        IMPLEMENTED = 'implemented', 'Implemented'
    
    # ============================================
    # FK RELATIONSHIPS
    # ============================================
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='suggestions',
        db_column='user_id'
    )
    
    guide = models.ForeignKey(
        'guides.Guide',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='suggestions',
        db_column='guide_id'
    )
    
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_suggestions',
        db_column='processed_by_id'
    )
    
    destination = models.ForeignKey(
        'destinations.Destination',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='suggestions',
        db_column='destination_id'
    )
    
    # ============================================
    # CORE FIELDS - ONLY MAX LIMITS
    # ============================================
    
    suggestion_type = models.CharField(
        max_length=20,
        choices=SuggestionType.choices,
        db_index=True,
        default=SuggestionType.NEW_PLACE
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    name = models.CharField(
        max_length=200,
        default='Unknown Place',
        validators=[
            MaxLengthValidator(200, message="Name cannot exceed 200 characters")
        ]
    )
    
    title = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        validators=[
            MaxLengthValidator(200, message="Title cannot exceed 200 characters")
        ]
    )
    
    description = models.TextField(
        max_length=5000,
        default='No description provided',
        validators=[
            MaxLengthValidator(5000, message="Description cannot exceed 5000 characters")
        ]
    )
    
    category = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        db_index=True,
        validators=[
            MaxLengthValidator(50, message="Category cannot exceed 50 characters")
        ]
    )
    
    location_info = models.CharField(
        max_length=1000,
        blank=True,
        null=True,
        validators=[
            MaxLengthValidator(1000, message="Location info cannot exceed 1000 characters")
        ]
    )
    
    district = models.CharField(
        max_length=100,
        default='Unknown',
        db_index=True,
        validators=[
            MaxLengthValidator(100, message="District cannot exceed 100 characters")
        ]
    )
    
    admin_notes = models.TextField(
        max_length=2000,
        blank=True,
        null=True,
        validators=[
            MaxLengthValidator(2000, message="Admin notes cannot exceed 2000 characters")
        ]
    )
    
    guide_notes = models.TextField(
        max_length=1000,
        blank=True,
        null=True,
        validators=[
            MaxLengthValidator(1000, message="Guide notes cannot exceed 1000 characters")
        ]
    )
    
    rejection_reason = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        validators=[
            MaxLengthValidator(500, message="Rejection reason cannot exceed 500 characters")
        ]
    )
    
    # ============================================
    # IMAGE FIELDS
    # ============================================
    
    image = models.ImageField(
        upload_to='suggestions/%Y/%m/%d/',
        blank=True,
        null=True,
        max_length=500,
        help_text="Upload an image for your suggestion (max 5MB)"
    )
    
    images = models.JSONField(
        default=list,
        blank=True,
        help_text="Additional images as URLs or paths"
    )
    
    # ============================================
    # RATING & METADATA - ONLY MAX LIMITS
    # ============================================
    
    rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[
            MaxValueValidator(5, message="Rating cannot exceed 5")
        ]
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional JSON data"
    )
    
    visit_date = models.DateField(
        blank=True,
        null=True,
        help_text="When did you visit this place?"
    )
    
    # ============================================
    # TIMESTAMPS
    # ============================================
    
    guide_processed_at = models.DateTimeField(blank=True, null=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ============================================
    # META
    # ============================================
    
    class Meta:
        db_table = 'suggestions'
        indexes = [
            models.Index(fields=['user', 'status', 'suggestion_type']),
            models.Index(fields=['district', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['guide', 'status']),
        ]
        ordering = ['-created_at']
    
    # ============================================
    # CLEAN METHOD - ONLY REQUIRED CHECKS
    # ============================================
    
    def clean(self):
        """Custom validation - only required checks"""
        # Name is required
        if not self.name or not self.name.strip():
            raise ValidationError({
                'name': 'Name is required'
            })
        
        # Description is required
        if not self.description or not self.description.strip():
            raise ValidationError({
                'description': 'Description is required'
            })
        
        # District is required
        if not self.district or not self.district.strip():
            raise ValidationError({
                'district': 'District is required'
            })
        
        # For new place/hidden gem suggestions, category is required
        if self.suggestion_type in [self.SuggestionType.NEW_PLACE, self.SuggestionType.HIDDEN_GEM]:
            if not self.category or not self.category.strip():
                raise ValidationError({
                    'category': 'Category is required for new place/hidden gem suggestions'
                })
        
        # For review suggestions, rating is required
        if self.suggestion_type == self.SuggestionType.REVIEW:
            if not self.rating:
                raise ValidationError({
                    'rating': 'Rating is required for reviews'
                })
    
    def save(self, *args, **kwargs):
        """Override save to run validation"""
        try:
            self.full_clean()
        except ValidationError as e:
            error_dict = {}
            for field, errors in e.message_dict.items():
                error_dict[field] = [str(err) for err in errors]
            raise ValidationError(error_dict)
        super().save(*args, **kwargs)
    
    # ============================================
    # PROPERTIES
    # ============================================
    
    @property
    def is_implemented(self):
        return self.status == self.Status.IMPLEMENTED
    
    @property
    def is_pending(self):
        return self.status == self.Status.PENDING
    
    @property
    def is_approved(self):
        return self.status in [self.Status.APPROVED, self.Status.IMPLEMENTED]
    
    def __str__(self):
        return f"{self.user.email} - {self.name} ({self.status})"
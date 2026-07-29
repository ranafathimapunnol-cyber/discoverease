# suggestions/models.py - COMPLETE WITH ALL FIELDS

from django.db import models
from django.core.validators import MaxLengthValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils import timezone
import os

User = get_user_model()


class Suggestion(models.Model):
    """UNIFIED Suggestion Table - Handles all user suggestions"""
    
    class SuggestionType(models.TextChoices):
        HIDDEN_GEM = 'hidden_gem', 'Hidden Gem'
        LOCAL_INSIGHT = 'local_insight', 'Local Insight'
        REVIEW = 'review', 'Review'
        NEW_PLACE = 'new', 'Suggest New Destination'
        UPDATE_INFO = 'update', 'Update Existing Destination'
        FEATURE_REQUEST = 'feature', 'Feature Request'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        PENDING_GUIDE = 'pending_guide', 'Pending Guide Approval'
        PENDING_ADMIN = 'pending_admin', 'Pending Admin Approval'
        APPROVED_BY_GUIDE = 'approved_by_guide', 'Approved by Guide'
        REJECTED_BY_GUIDE = 'rejected_by_guide', 'Rejected by Guide'
        STAFF_APPROVED = 'staff_approved', 'Approved by Staff'
        STAFF_REJECTED = 'staff_rejected', 'Rejected by Staff'
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
        db_index=True
    )
    
    guide = models.ForeignKey(
        'guides.Guide',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='suggestions',
        db_index=True
    )
    
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_suggestions',
        db_index=True
    )
    
    destination = models.ForeignKey(
        'destinations.Destination',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='suggestions',
        db_index=True
    )
    
    # ============================================
    # TRACKING FIELDS
    # ============================================
    
    guide_approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='guide_approved_suggestions'
    )
    guide_rejected_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='guide_rejected_suggestions'
    )
    guide_approved_at = models.DateTimeField(null=True, blank=True)
    guide_rejected_at = models.DateTimeField(null=True, blank=True)
    
    staff_approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_approved_suggestions'
    )
    staff_rejected_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_rejected_suggestions'
    )
    staff_approved_at = models.DateTimeField(null=True, blank=True)
    staff_rejected_at = models.DateTimeField(null=True, blank=True)
    
    admin_implemented_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_implemented_suggestions'
    )
    admin_implemented_at = models.DateTimeField(null=True, blank=True)
    
    # ============================================
    # CORE FIELDS
    # ============================================
    
    suggestion_type = models.CharField(
        max_length=20,
        choices=SuggestionType.choices,
        db_index=True,
        default=SuggestionType.HIDDEN_GEM
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    name = models.CharField(
        max_length=200,
        default='Untitled',
        validators=[MaxLengthValidator(200)]
    )
    
    title = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        validators=[MaxLengthValidator(200)]
    )
    
    description = models.TextField(
        max_length=5000,
        default='No description provided',
        validators=[MaxLengthValidator(5000)]
    )
    
    category = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        db_index=True,
        validators=[MaxLengthValidator(50)]
    )
    
    location_info = models.CharField(
        max_length=1000,
        blank=True,
        null=True,
        validators=[MaxLengthValidator(1000)]
    )
    
    district = models.CharField(
        max_length=100,
        default='Unknown',
        db_index=True,
        validators=[MaxLengthValidator(100)]
    )
    
    admin_notes = models.TextField(
        max_length=2000,
        blank=True,
        null=True,
        validators=[MaxLengthValidator(2000)]
    )
    
    guide_notes = models.TextField(
        max_length=1000,
        blank=True,
        null=True,
        validators=[MaxLengthValidator(1000)]
    )
    
    rejection_reason = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        validators=[MaxLengthValidator(500)]
    )
    
    rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MaxValueValidator(5)]
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True
    )
    
    visit_date = models.DateField(
        blank=True,
        null=True
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
    # PROPERTIES
    # ============================================
    
    @property
    def is_implemented(self):
        return self.status == self.Status.IMPLEMENTED
    
    @property
    def is_pending(self):
        return self.status in [self.Status.PENDING, self.Status.PENDING_GUIDE, self.Status.PENDING_ADMIN]
    
    @property
    def is_approved_by_guide(self):
        return self.status == self.Status.APPROVED_BY_GUIDE
    
    @property
    def is_staff_approved(self):
        return self.status == self.Status.STAFF_APPROVED
    
    def __str__(self):
        return f"{self.user.email} - {self.name} ({self.status})"


class SuggestionImage(models.Model):
    """Image model for suggestions - Multiple images support"""
    
    suggestion = models.ForeignKey(
        Suggestion,
        on_delete=models.CASCADE,
        related_name='images',
        db_index=True
    )
    
    image = models.ImageField(
        upload_to='suggestions/%Y/%m/%d/',
        max_length=500
    )
    
    caption = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )
    
    order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'suggestion_images'
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['suggestion']),
            models.Index(fields=['suggestion', 'is_primary']),
        ]
    
    def __str__(self):
        return f"Image for {self.suggestion.name} ({self.id})"
    
    def delete(self, *args, **kwargs):
        if self.image:
            try:
                if os.path.isfile(self.image.path):
                    os.remove(self.image.path)
            except Exception:
                pass
        super().delete(*args, **kwargs)


class SuggestionNotification(models.Model):
    """Notification model for suggestion updates"""
    
    class NotificationType(models.TextChoices):
        SUGGESTION_CREATED = 'suggestion_created', 'New Suggestion Created'
        SUGGESTION_APPROVED = 'suggestion_approved', 'Suggestion Approved'
        SUGGESTION_REJECTED = 'suggestion_rejected', 'Suggestion Rejected'
        SUGGESTION_IMPLEMENTED = 'suggestion_implemented', 'Suggestion Implemented'
        GUIDE_REVIEW = 'guide_review', 'Guide Review Required'
        STAFF_REVIEW = 'staff_review', 'Staff Review Required'
        ADMIN_ACTION = 'admin_action', 'Admin Action Required'
    
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True
    )
    
    suggestion = models.ForeignKey(
        Suggestion,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        db_index=True
    )
    
    title = models.CharField(
        max_length=255,
        validators=[MaxLengthValidator(255)]
    )
    
    message = models.TextField(
        max_length=1000,
        validators=[MaxLengthValidator(1000)]
    )
    
    is_read = models.BooleanField(
        default=False,
        db_index=True
    )
    
    read_at = models.DateTimeField(
        null=True,
        blank=True
    )
    
    link = models.CharField(
        max_length=500,
        blank=True,
        null=True
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'suggestion_notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'created_at']),
            models.Index(fields=['suggestion']),
            models.Index(fields=['notification_type']),
        ]
    
    def __str__(self):
        return f"{self.recipient.email} - {self.title}"
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    @classmethod
    def create_for_suggestion(cls, suggestion, recipient, notification_type, title, message, link=None, metadata=None):
        return cls.objects.create(
            recipient=recipient,
            suggestion=suggestion,
            notification_type=notification_type,
            title=title,
            message=message,
            link=link,
            metadata=metadata or {}
        )
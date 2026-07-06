# suggestions/models.py
from django.db import models
from accounts.models import User
from destinations.models import Destination

class Suggestion(models.Model):
    """UNIFIED Suggestion Table - replaces 3-4 separate tables!"""
    
    class SuggestionType(models.TextChoices):
        NEW_PLACE = 'new', 'Suggest New Destination'
        UPDATE_INFO = 'update', 'Update Existing Destination'
        REPORT_ISSUE = 'report', 'Report Issue/Problem'
        FEATURE_REQUEST = 'feature', 'Feature Request'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        IN_PROGRESS = 'in_progress', 'In Progress'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        IMPLEMENTED = 'implemented', 'Implemented'
    
    # Core fields
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='suggestions')
    suggestion_type = models.CharField(max_length=20, choices=SuggestionType.choices, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    
    # For NEW PLACE suggestions
    name = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)  # Changed to 50 to match choices
    location_info = models.TextField(blank=True, null=True)
    
    # For UPDATE/REPORT suggestions
    destination = models.ForeignKey(Destination, on_delete=models.SET_NULL, null=True, blank=True)
    update_data = models.JSONField(default=dict, blank=True)
    reason = models.TextField(blank=True, null=True)
    
    # Admin response
    admin_notes = models.TextField(blank=True, null=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_suggestions')
    processed_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'suggestions'
        indexes = [
            models.Index(fields=['user', 'status', 'suggestion_type']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.suggestion_type} ({self.status})"
from django.db import models
from accounts.models import User

class ActivityLog(models.Model):
    """UNIFIED Activity Log - tracks EVERY user action"""
    
    class ActionType(models.TextChoices):
        # Auth
        USER_REGISTER = 'register', 'User Registered'
        USER_LOGIN = 'login', 'User Logged In'
        USER_LOGOUT = 'logout', 'User Logged Out'
        EMAIL_VERIFIED = 'email_verified', 'Email Verified'
        PASSWORD_RESET = 'password_reset', 'Password Reset'
        
        # Profile
        PROFILE_UPDATE = 'profile_update', 'Profile Updated'
        
        # Destinations
        PLACE_ADDED = 'place_added', 'Place Added'
        PLACE_VERIFIED = 'place_verified', 'Place Verified'
        PLACE_UPDATED = 'place_updated', 'Place Updated'
        PLACE_DELETED = 'place_deleted', 'Place Deleted'
        
        # Suggestions
        SUGGESTION_SUBMITTED = 'suggestion_submitted', 'Suggestion Submitted'
        SUGGESTION_PROCESSED = 'suggestion_processed', 'Suggestion Processed'
        
        # Reviews
        REVIEW_ADDED = 'review_added', 'Review Added'
        
        # Trips
        TRIP_PLANNED = 'trip_planned', 'Trip Planned'
        BUDGET_CALCULATED = 'budget_calculated', 'Budget Calculated'
        WISHLIST_ADDED = 'wishlist_added', 'Wishlist Added'
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
    action_type = models.CharField(max_length=30, choices=ActionType.choices, db_index=True)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    # NO updated_at - logs should not be updated!
    
    class Meta:
        db_table = 'activity_logs'
        indexes = [
            models.Index(fields=['user', 'action_type', 'created_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email if self.user else 'Anonymous'} - {self.action_type}"
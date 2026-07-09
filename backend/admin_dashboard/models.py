# admin_dashboard/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone

class AdminActivityLog(models.Model):
    """Track admin activities"""
    ACTION_CHOICES = (
        ('view', 'View'),
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('verify', 'Verify'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('promote', 'Promote'),
        ('demote', 'Demote'),
    )
    
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='admin_activities')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'admin_activity_logs'
    
    def __str__(self):
        return f"{self.admin.email} - {self.action} - {self.model_name}"

class AdminSettings(models.Model):
    """Admin settings"""
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField(default=dict)
    description = models.CharField(max_length=255, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'admin_settings'
    
    def __str__(self):
        return self.key
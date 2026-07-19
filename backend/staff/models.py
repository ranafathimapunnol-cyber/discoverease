# staff/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone

class StaffActivityLog(models.Model):
    """Track staff activities"""
    ACTION_CHOICES = (
        ('view', 'View'),
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('verify', 'Verify'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
    )
    
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_activities')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True, max_length=45)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'staff_activity_logs'
    
    def __str__(self):
        return f"{self.staff.email} - {self.action} - {self.model_name}"

class StaffNotification(models.Model):
    """Staff notifications"""
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='staff_notifications')
    title = models.CharField(max_length=255)
    message = models.TextField(max_length=1000)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'staff_notifications'
    
    def __str__(self):
        return f"{self.staff.email} - {self.title}"
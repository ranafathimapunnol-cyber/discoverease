# accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import secrets

class User(AbstractUser):
    # ✅ 4 Roles
    class Role(models.TextChoices):
        TOURISTER = 'tourister', 'Tourister'
        GUIDE = 'guide', 'Guide'
        STAFF = 'staff', 'Staff'
        ADMIN = 'admin', 'Admin'
    
    phone = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    profile_picture = models.URLField(blank=True, null=True)
    profile_picture_upload = models.ImageField(
        upload_to='profile_pics/', 
        blank=True, 
        null=True
    )
    bio = models.TextField(blank=True, null=True, max_length=500)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.TOURISTER)
    preferred_currency = models.CharField(max_length=10, default='USD', blank=True)
    
    # ✅ Account fields
    total_trips = models.IntegerField(default=0)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)
    
    # ✅ Email verification
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    token_created_at = models.DateTimeField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]
    
    def generate_verification_token(self):
        token = secrets.token_urlsafe(32)
        self.email_verification_token = token
        self.token_created_at = timezone.now()
        self.save(update_fields=['email_verification_token', 'token_created_at'])
        print(f"✅ Token generated and saved: {token}")
        return token

    
    def verify_email(self):
        self.email_verified = True
        self.is_active = True
        self.email_verification_token = None
        self.token_created_at = None
        self.save(update_fields=['email_verified', 'is_active', 'email_verification_token', 'token_created_at'])
    
    def get_role(self):
        return self.role if self.role else self.Role.TOURISTER
    
    def get_dashboard_url(self):
        role = self.get_role()
        dashboards = {
            self.Role.TOURISTER: '/',
            self.Role.GUIDE: '/guide-dashboard',
            self.Role.STAFF: '/staff-dashboard',
            self.Role.ADMIN: '/admin-dashboard',
        }
        return dashboards.get(role, '/')
    
    def __str__(self):
        return f"{self.email} ({self.get_role()})"
    
    def is_verification_token_valid(self, token):
        if not self.email_verification_token or not self.token_created_at:
          return False
        if self.email_verification_token != token:
         return False
        expiry = self.token_created_at + timezone.timedelta(minutes=30)  # 30 minutes expiry
        return timezone.now() <= expiry
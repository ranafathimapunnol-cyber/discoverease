# accounts/signals.py
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.core.exceptions import ValidationError
from .models import User
from activities.models import ActivityLog
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    if created:
        logger.info(f"New user created: {instance.email}")
        try:
            ActivityLog.objects.create(
                user=instance,
                action_type='register',
                description=f'User {instance.email} created account'
            )
        except:
            pass

@receiver(pre_save, sender=User)
def user_pre_save(sender, instance, **kwargs):
    if not instance.username:
        instance.username = instance.email.split('@')[0]
    
    if instance.pk:
        existing = User.objects.filter(email=instance.email).exclude(pk=instance.pk)
        if existing.exists():
            raise ValidationError("Email already in use")

@receiver(user_logged_in)
def user_logged_in_callback(sender, request, user, **kwargs):
    try:
        ActivityLog.objects.create(
            user=user,
            action_type='login',
            description=f'User {user.email} logged in',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )
    except:
        pass

@receiver(user_logged_out)
def user_logged_out_callback(sender, request, user, **kwargs):
    if user:
        try:
            ActivityLog.objects.create(
                user=user,
                action_type='logout',
                description=f'User {user.email} logged out',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT')
            )
        except:
            pass

@receiver(user_login_failed)
def user_login_failed_callback(sender, credentials, request, **kwargs):
    email = credentials.get('email', 'unknown')
    try:
        ActivityLog.objects.create(
            user=None,
            action_type='login',
            description=f'Failed login attempt for {email}',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            metadata={'email': email}
        )
    except:
        pass
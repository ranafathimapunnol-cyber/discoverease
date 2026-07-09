# accounts/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
import logging

from .models import User

logger = logging.getLogger(__name__)


@shared_task
def send_verification_email(user_id, token):
    """Send email verification link to user"""
    try:
        user = User.objects.get(id=user_id)
        
        logger.info(f"📧 Sending verification email to {user.email}")
        logger.info(f"🔑 Token: {token}")
        
        if not token:
            token = user.generate_verification_token()
            logger.info(f"🔄 Generated new token: {token}")
        
        verification_link = f"http://localhost:5173/verify-email?token={token}"
        logger.info(f"🔗 Link: {verification_link}")
        
        subject = 'Verify Your Email - DiscoverEase'
        
        # Plain text
        plain_message = f"""
Hello {user.first_name or user.username},

Thank you for registering with DiscoverEase!

Please click the link below to verify your email address:

{verification_link}

This link expires in 5 minutes.

If you didn't create an account, you can safely ignore this email.

Your verification token: {token}

---
DiscoverEase - Kerala's Hidden Gems
"""
        
        # HTML with token
        html_message = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Verify Your Email - DiscoverEase</title>
  <style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
    .header {{ background: #072E2A; color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; }}
    .header h1 {{ color: #E4C77B; margin: 0; }}
    .content {{ padding: 30px; background: #f9fafb; }}
    .button {{ 
      display: inline-block; 
      padding: 14px 40px; 
      background: #0E5C53; 
      color: white !important; 
      text-decoration: none; 
      border-radius: 999px; 
      font-weight: bold;
      font-size: 16px;
    }}
    .token-box {{
      background: #e6fffa;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      border: 2px solid #0E5C53;
      word-break: break-all;
      margin: 15px 0;
      text-align: center;
      font-weight: bold;
      color: #0E5C53;
    }}
    .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌴 DiscoverEase</h1>
      <p style="color: #EDE2C4;">Kerala · India</p>
    </div>
    <div class="content">
      <h2>Verify Your Email Address</h2>
      <p>Hello <strong>{user.first_name or user.username}</strong>,</p>
      <p>Thank you for registering with DiscoverEase!</p>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="{verification_link}" class="button">✅ Verify Email</a>
      </p>
      
      <p>⏰ This link expires in 5 minutes.</p>
      
      <hr />
      
      <p><strong>🔑 Your verification token:</strong></p>
      <div class="token-box">{token}</div>
      
      <p><strong>📋 Full link:</strong><br>
      <a href="{verification_link}">{verification_link}</a></p>
      
      <p>💡 After verification, you'll be redirected to the login page.</p>
    </div>
    <div class="footer">
      <p>&copy; {timezone.now().year} DiscoverEase</p>
    </div>
  </div>
</body>
</html>
"""
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"✅ Email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False


@shared_task
def send_daily_trip_reminder():
    """Send daily 9 AM trip reminder to users with upcoming bookings"""
    try:
        from guides.models import GuideBooking
        from django.core.mail import send_mail
        from django.db.models import Q
        
        today = timezone.now().date()
        tomorrow = today + timezone.timedelta(days=1)
        
        # Get bookings for today and tomorrow that are confirmed or pending
        upcoming_bookings = GuideBooking.objects.filter(
            Q(date=today) | Q(date=tomorrow),
            status__in=['confirmed', 'pending']
        ).select_related('user', 'guide', 'district')
        
        logger.info(f"📅 Found {upcoming_bookings.count()} upcoming bookings")
        
        # Group bookings by user email
        user_bookings = {}
        for booking in upcoming_bookings:
            if booking.user and booking.user.email:
                if booking.user.email not in user_bookings:
                    user_bookings[booking.user.email] = []
                user_bookings[booking.user.email].append(booking)
        
        logger.info(f"📧 Sending reminders to {len(user_bookings)} users")
        
        for email, bookings in user_bookings.items():
            try:
                user_name = bookings[0].user.first_name or bookings[0].user.username or 'Traveler'
                
                subject = f"🌴 DiscoverEase - Your Trip Reminder for {bookings[0].date}"
                
                # Plain text message
                message_lines = [
                    f"Hello {user_name},",
                    "",
                    f"This is your 9 AM reminder about your upcoming trip{'s' if len(bookings) > 1 else ''} with DiscoverEase!",
                    "",
                    f"You have {len(bookings)} trip{'s' if len(bookings) > 1 else ''} coming up:",
                    ""
                ]
                
                for booking in bookings:
                    status_emoji = "✅" if booking.status == 'confirmed' else "⏳"
                    status_text = "Confirmed" if booking.status == 'confirmed' else "Pending Confirmation"
                    
                    message_lines.extend([
                        f"📍 {booking.district.name if booking.district else 'Kerala'}",
                        f"📅 {booking.date}",
                        f"🕐 {booking.time}",
                        f"🧭 Guide: {booking.guide.full_name}",
                        f"{status_emoji} {status_text}",
                        ""
                    ])
                
                message_lines.extend([
                    "---",
                    "Plan your day and enjoy your Kerala experience!",
                    "",
                    "Need help? Visit: http://localhost:5173/guides",
                    "",
                    "---",
                    "DiscoverEase - Kerala's Hidden Gems"
                ])
                
                message = "\n".join(message_lines)
                
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=True,
                )
                
                logger.info(f"✅ Reminder sent to {email} ({len(bookings)} trips)")
                
            except Exception as e:
                logger.error(f"❌ Failed to send trip reminder to {email}: {e}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ send_daily_trip_reminder error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


@shared_task
def cleanup_expired_tokens():
    """Clean up expired email verification tokens"""
    try:
        from .models import User
        
        # Find users with expired tokens (older than 30 minutes)
        expired_time = timezone.now() - timezone.timedelta(minutes=30)
        
        expired_users = User.objects.filter(
            email_verification_token__isnull=False,
            token_created_at__lt=expired_time,
            email_verified=False
        )
        
        count = expired_users.count()
        
        for user in expired_users:
            user.email_verification_token = None
            user.token_created_at = None
            user.save(update_fields=['email_verification_token', 'token_created_at'])
        
        if count > 0:
            logger.info(f"🧹 Cleaned up {count} expired verification tokens")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ cleanup_expired_tokens error: {e}")
        return False
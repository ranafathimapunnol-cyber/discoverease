from celery import shared_task
from django.core.mail import send_mail
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
    """
    Send reminder emails for today's and tomorrow's trips.
    Prevent duplicate emails.
    """
    try:
        from guides.models import GuideBooking

        today = timezone.localdate()
        tomorrow = today + timezone.timedelta(days=1)

        upcoming_bookings = list(
            GuideBooking.objects.filter(
                Q(date=today) | Q(date=tomorrow),
                status__in=["confirmed", "pending"],
                reminder_sent=False,
            )
            .select_related("user", "guide", "district")
            .order_by("user")
        )

        if not upcoming_bookings:
            logger.info("📭 No reminders to send.")
            return "No reminders needed"

        logger.info(f"📅 Found {len(upcoming_bookings)} upcoming bookings")

        # -----------------------------
        # IMPORTANT:
        # Mark bookings as reminder_sent FIRST
        # -----------------------------
        booking_ids = [booking.id for booking in upcoming_bookings]

        GuideBooking.objects.filter(
            id__in=booking_ids,
            reminder_sent=False
        ).update(reminder_sent=True)

        # Group bookings by email
        user_bookings = {}

        for booking in upcoming_bookings:

            if booking.user and booking.user.email:
                user_bookings.setdefault(
                    booking.user.email,
                    []
                ).append(booking)

        sent_count = 0

        for email, bookings in user_bookings.items():

            try:
                user = bookings[0].user

                username = (
                    user.first_name
                    or user.username
                    or "Traveler"
                )

                subject = "🌴 DiscoverEase - Upcoming Trip Reminder"

                lines = [
                    f"Hello {username},",
                    "",
                    "This is a reminder for your upcoming trip(s).",
                    "",
                ]

                for booking in bookings:

                    lines.extend([
                        f"📍 Destination : {booking.district.name if booking.district else 'Kerala'}",
                        f"📅 Date        : {booking.date}",
                        f"🕒 Time        : {booking.time}",
                        f"🧭 Guide       : {booking.guide.full_name}",
                        f"✅ Status      : {booking.status}",
                        "",
                    ])

                lines.extend([
                    "Have a wonderful journey! 🌴",
                    "",
                    "Team DiscoverEase",
                ])

                send_mail(
                    subject=subject,
                    message="\n".join(lines),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )

                sent_count += 1

                logger.info(f"✅ Reminder sent to {email}")

            except Exception as e:

                logger.exception(f"❌ Failed sending reminder to {email}")

                # Rollback reminder_sent if email fails
                ids = [b.id for b in bookings]

                GuideBooking.objects.filter(
                    id__in=ids
                ).update(reminder_sent=False)

        logger.info(f"🎉 Total reminders sent: {sent_count}")

        return f"{sent_count} reminders sent"

    except Exception as e:

        logger.exception("❌ Error in send_daily_trip_reminder")

        return str(e)
@shared_task
def cleanup_expired_tokens():
    """
    Remove expired email verification tokens.
    """
    try:
        expired_time = timezone.now() - timezone.timedelta(minutes=30)

        expired_users = User.objects.filter(
            email_verified=False,
            email_verification_token__isnull=False,
            token_created_at__lt=expired_time,
        )

        count = expired_users.count()

        expired_users.update(
            email_verification_token=None,
            token_created_at=None,
        )

        logger.info(f"🧹 Cleaned {count} expired verification tokens")

        return f"{count} tokens cleaned"

    except Exception as e:
        logger.exception("cleanup_expired_tokens failed")
        return False   
    
    
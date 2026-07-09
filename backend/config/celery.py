# celery.py
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Schedule
app.conf.beat_schedule = {
    # ✅ Send daily trip reminders at 9 AM
    'send-daily-trip-reminder': {
        'task': 'accounts.tasks.send_daily_trip_reminder',
        'schedule': crontab(hour=9, minute=0),  # 9:00 AM daily
    },
    # ✅ Clean up expired tokens every 30 minutes
    'cleanup-expired-tokens': {
        'task': 'accounts.tasks.cleanup_expired_tokens',
        'schedule': crontab(minute='*/30'),  # Every 30 minutes
    },
}

# Optional: Run at startup
@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Send reminders at 9 AM
    sender.add_periodic_task(
        crontab(hour=9, minute=0),
        'accounts.tasks.send_daily_trip_reminder',
        name='send-daily-trip-reminder'
    )
    # Cleanup tokens every 30 minutes
    sender.add_periodic_task(
        crontab(minute='*/30'),
        'accounts.tasks.cleanup_expired_tokens',
        name='cleanup-expired-tokens'
    )
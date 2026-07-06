from django.contrib import admin
from .models import ActivityLog

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action_type', 'description', 'created_at')
    list_filter = ('action_type', 'created_at')
    search_fields = ('user__email', 'description')
    readonly_fields = ('created_at',)
    list_display_links = ('description',)
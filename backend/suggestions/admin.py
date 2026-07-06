# suggestions/admin.py
from django.contrib import admin
from .models import Suggestion

@admin.register(Suggestion)
class SuggestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'user', 'suggestion_type', 'status', 'created_at']
    list_filter = ['suggestion_type', 'status', 'created_at']
    search_fields = ['name', 'description', 'user__email', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'suggestion_type', 'status')
        }),
        ('Suggestion Details', {
            'fields': ('name', 'description', 'category', 'location_info')
        }),
        ('For Updates/Reports', {
            'fields': ('destination', 'update_data', 'reason'),
            'classes': ('collapse',)
        }),
        ('Admin Response', {
            'fields': ('admin_notes', 'processed_by', 'processed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_implemented', 'mark_as_rejected']
    
    def mark_as_implemented(self, request, queryset):
        queryset.update(status=Suggestion.Status.IMPLEMENTED)
    mark_as_implemented.short_description = "Mark selected suggestions as IMPLEMENTED"
    
    def mark_as_rejected(self, request, queryset):
        queryset.update(status=Suggestion.Status.REJECTED)
    mark_as_rejected.short_description = "Mark selected suggestions as REJECTED"
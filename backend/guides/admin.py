from django.contrib import admin
from .models import (
    District, GuideCategory, Guide, GuideAvailability, 
    GuideBooking
)

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'created_at']
    search_fields = ['name', 'code']
    list_filter = ['is_active']
    prepopulated_fields = {'code': ['name']}

@admin.register(GuideCategory)
class GuideCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'is_active']
    search_fields = ['name']
    list_filter = ['is_active']

class GuideAvailabilityInline(admin.TabularInline):
    model = GuideAvailability
    extra = 1
    fields = ['date', 'start_time', 'end_time', 'is_booked', 'max_bookings', 'current_bookings']

@admin.register(Guide)
class GuideAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'rating', 'is_verified', 'is_available', 'is_active']
    list_filter = ['is_verified', 'is_available', 'is_active', 'districts']
    search_fields = ['full_name', 'email', 'phone_number']
    filter_horizontal = ['districts', 'categories']
    inlines = [GuideAvailabilityInline]
    readonly_fields = ['rating', 'total_reviews']

@admin.register(GuideAvailability)
class GuideAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['guide', 'date', 'start_time', 'end_time', 'is_booked']
    list_filter = ['is_booked', 'date']
    search_fields = ['guide__full_name']

@admin.register(GuideBooking)
class GuideBookingAdmin(admin.ModelAdmin):
    list_display = ['booking_id', 'user', 'guide', 'date', 'status', 'total_price']
    list_filter = ['status', 'date']
    search_fields = ['booking_id', 'user__username', 'guide__full_name']
    readonly_fields = ['booking_id', 'total_price', 'created_at', 'updated_at']

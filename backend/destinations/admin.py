from django.contrib import admin
from .models import Destination, Review

@admin.register(Destination)
class DestinationAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'status', 'district', 'average_rating', 'created_at')
    list_filter = ('category', 'status', 'district')
    search_fields = ('name', 'short_description', 'long_description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'slug', 'short_description', 'long_description', 'category', 'status')}),
        ('Location', {'fields': ('latitude', 'longitude', 'address', 'district')}),
        ('Media', {'fields': ('featured_image', 'gallery_images')}),
        ('Stats', {'fields': ('average_rating', 'total_reviews', 'visit_count')}),
        ('Metadata', {'fields': ('added_by', 'verified_by', 'verified_at', 'created_at', 'updated_at')}),
    )

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'destination', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__email', 'destination__name', 'comment')
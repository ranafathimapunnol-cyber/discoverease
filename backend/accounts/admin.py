from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User



class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'is_staff', 'is_active', 'email_verified')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'email_verified')
    search_fields = ('email', 'username')
    ordering = ('email',)
    fieldsets = UserAdmin.fieldsets + (
        ('Personal Details', {'fields': ('phone', 'date_of_birth', 'profile_picture', 'bio', 'preferred_currency')}),
        ('Verification', {'fields': ('email_verified', 'email_verification_token', 'token_created_at')}),
    )
    # ✅ Remove readonly_fields since created_at and updated_at don't exist

admin.site.register(User, CustomUserAdmin)


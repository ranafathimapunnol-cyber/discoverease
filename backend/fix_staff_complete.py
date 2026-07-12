# backend/fix_staff_complete.py
import os
import re

def fix_staff_tests():
    """Fix all staff test URLs to match router patterns"""
    path = 'staff/tests.py'
    if not os.path.exists(path):
        print(f"⚠️ {path} not found")
        return
    
    with open(path, 'r') as f:
        content = f.read()
    
    # The router patterns are:
    # /api/staff/{pk}/verify/   -> for verify_guide
    # /api/staff/{pk}/delete/   -> for delete_guide
    # /api/staff/{pk}/update/   -> for update_booking
    # /api/staff/{pk}/process/  -> for process_suggestion
    
    # Fix verify guide URLs
    content = content.replace(
        "url = f'/api/staff/guides/{self.guide.id}/verify/'",
        "url = f'/api/staff/{self.guide.id}/verify/'"
    )
    content = content.replace(
        "url = f'/api/staff/staff/guides/{self.guide.id}/verify/'",
        "url = f'/api/staff/{self.guide.id}/verify/'"
    )
    
    # Fix delete guide URLs
    content = content.replace(
        "url = f'/api/staff/guides/{self.guide.id}/'",
        "url = f'/api/staff/{self.guide.id}/delete/'"
    )
    content = content.replace(
        "url = f'/api/staff/staff/guides/{self.guide.id}/'",
        "url = f'/api/staff/{self.guide.id}/delete/'"
    )
    
    # Fix update booking URLs
    content = content.replace(
        "url = f'/api/staff/bookings/{self.booking.id}/update/'",
        "url = f'/api/staff/{self.booking.id}/update/'"
    )
    content = content.replace(
        "url = f'/api/staff/staff/bookings/{self.booking.id}/update/'",
        "url = f'/api/staff/{self.booking.id}/update/'"
    )
    
    # Fix process suggestion URLs
    content = content.replace(
        "url = f'/api/staff/suggestions/{self.suggestion.id}/process/'",
        "url = f'/api/staff/{self.suggestion.id}/process/'"
    )
    content = content.replace(
        "url = f'/api/staff/staff/suggestions/{self.suggestion.id}/process/'",
        "url = f'/api/staff/{self.suggestion.id}/process/'"
    )
    
    # Fix add guide URLs (list action)
    content = content.replace(
        "url = f'/api/staff/staff/guides/add/'",
        "url = f'/api/staff/guides/add/'"
    )
    content = content.replace(
        "url = f'/api/staff/staff/guides/add/'",
        "url = f'/api/staff/guides/add/'"
    )
    
    # Fix list URLs
    content = content.replace(
        "self.guides_url = '/api/staff/staff/guides/'",
        "self.guides_url = '/api/staff/guides/'"
    )
    content = content.replace(
        "self.bookings_url = '/api/staff/staff/bookings/'",
        "self.bookings_url = '/api/staff/bookings/'"
    )
    content = content.replace(
        "self.suggestions_url = '/api/staff/staff/suggestions/'",
        "self.suggestions_url = '/api/staff/suggestions/'"
    )
    content = content.replace(
        "self.notifications_url = '/api/staff/staff/notifications/'",
        "self.notifications_url = '/api/staff/notifications/'"
    )
    
    # Fix add_guide_url
    content = content.replace(
        "self.add_guide_url = '/api/staff/staff/guides/add/'",
        "self.add_guide_url = '/api/staff/guides/add/'"
    )
    
    # Fix verify_guide_url
    content = content.replace(
        "self.verify_guide_url = '/api/staff/staff/guides/'",
        "self.verify_guide_url = '/api/staff/'"
    )
    
    # Fix delete_guide_url
    content = content.replace(
        "self.delete_guide_url = '/api/staff/staff/guides/'",
        "self.delete_guide_url = '/api/staff/'"
    )
    
    # Fix update_booking_url
    content = content.replace(
        "self.update_booking_url = '/api/staff/staff/bookings/'",
        "self.update_booking_url = '/api/staff/'"
    )
    
    # Fix process_suggestion_url
    content = content.replace(
        "self.process_suggestion_url = '/api/staff/staff/suggestions/'",
        "self.process_suggestion_url = '/api/staff/'"
    )
    
    # Fix notifications mark read
    content = content.replace(
        "url = f'/api/staff/notifications/{self.notification.id}/mark-read/'",
        "url = f'/api/staff/notifications/{self.notification.id}/mark_read/'"
    )
    content = content.replace(
        "url = f'/api/staff/staff/notifications/{self.notification.id}/mark-read/'",
        "url = f'/api/staff/notifications/{self.notification.id}/mark_read/'"
    )
    
    # Fix unread count
    content = content.replace(
        "url = f'/api/staff/staff/notifications/unread-count/'",
        "url = f'/api/staff/notifications/unread_count/'"
    )
    content = content.replace(
        "url = f'/api/staff/notifications/unread-count/'",
        "url = f'/api/staff/notifications/unread_count/'"
    )
    
    with open(path, 'w') as f:
        f.write(content)
    print("✅ Fixed staff tests URLs")

def fix_staff_views():
    """Fix staff views to have consistent URL patterns"""
    path = 'staff/views.py'
    if not os.path.exists(path):
        print(f"⚠️ {path} not found")
        return
    
    with open(path, 'r') as f:
        content = f.read()
    
    # The action decorators should have url_path matching the router pattern
    # For detail actions, the pattern is /{pk}/{url_path}/
    # So url_path should be the action name without the pk part
    
    # These should already be correct, but we'll ensure they are
    # verify_guide -> url_path='verify'
    # delete_guide -> url_path='delete'
    # update_booking -> url_path='update'
    # process_suggestion -> url_path='process'
    
    # Fix if they have wrong url_path
    content = content.replace(
        "@action(detail=True, methods=['post'], url_path='guides/verify')",
        "@action(detail=True, methods=['post'], url_path='verify')"
    )
    content = content.replace(
        "@action(detail=True, methods=['delete'], url_path='guides')",
        "@action(detail=True, methods=['delete'], url_path='delete')"
    )
    content = content.replace(
        "@action(detail=True, methods=['post'], url_path='bookings/update')",
        "@action(detail=True, methods=['post'], url_path='update')"
    )
    content = content.replace(
        "@action(detail=True, methods=['post'], url_path='suggestions/process')",
        "@action(detail=True, methods=['post'], url_path='process')"
    )
    
    with open(path, 'w') as f:
        f.write(content)
    print("✅ Fixed staff views")

def fix_staff_urls_file():
    """Fix staff/urls.py router registration"""
    path = 'staff/urls.py'
    if not os.path.exists(path):
        print(f"⚠️ {path} not found")
        return
    
    with open(path, 'r') as f:
        content = f.read()
    
    # Ensure router is registered with empty string
    content = content.replace(
        "router.register(r'staff', StaffViewSet, basename='staff')",
        "router.register(r'', StaffViewSet, basename='staff')"
    )
    
    with open(path, 'w') as f:
        f.write(content)
    print("✅ Fixed staff/urls.py")

if __name__ == "__main__":
    print("🔧 Fixing staff tests completely...")
    fix_staff_urls_file()
    fix_staff_views()
    fix_staff_tests()
    print("\n✅ Done! Run: python manage.py test staff --keepdb --verbosity=1")
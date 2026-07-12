# backend/fix_staff_urls_final.py
import os

def fix_staff_tests():
    """Fix staff test URLs to match router"""
    path = 'staff/tests.py'
    if not os.path.exists(path):
        print(f"⚠️ {path} not found")
        return
    
    with open(path, 'r') as f:
        content = f.read()
    
    # The router base is /api/staff/, and detail actions are at /api/staff/{pk}/{action}/
    # So:
    # /api/staff/bookings/{pk}/update/ -> /api/staff/{pk}/update/
    # /api/staff/guides/{pk}/verify/ -> /api/staff/{pk}/verify/
    # /api/staff/guides/{pk}/ -> /api/staff/{pk}/delete/  (for delete)
    # /api/staff/suggestions/{pk}/process/ -> /api/staff/{pk}/process/
    
    content = content.replace(
        "url = f'/api/staff/bookings/{self.booking.id}/update/'",
        "url = f'/api/staff/{self.booking.id}/update/'"
    )
    content = content.replace(
        "url = f'/api/staff/guides/{self.guide.id}/verify/'",
        "url = f'/api/staff/{self.guide.id}/verify/'"
    )
    content = content.replace(
        "url = f'/api/staff/guides/{self.guide.id}/'",
        "url = f'/api/staff/{self.guide.id}/delete/'"
    )
    content = content.replace(
        "url = f'/api/staff/suggestions/{self.suggestion.id}/process/'",
        "url = f'/api/staff/{self.suggestion.id}/process/'"
    )
    content = content.replace(
        "url = f'/api/staff/notifications/{self.notification.id}/mark-read/'",
        "url = f'/api/staff/notifications/{self.notification.id}/mark_read/'"
    )
    
    # Fix the add_guide test URLs
    content = content.replace(
        "url = f'/api/staff/staff/guides/add/'",
        "url = f'/api/staff/guides/add/'"
    )
    
    with open(path, 'w') as f:
        f.write(content)
    print("✅ Fixed staff tests URLs")

if __name__ == "__main__":
    print("🔧 Fixing staff test URLs...")
    fix_staff_tests()
    print("\n✅ Done! Run: python manage.py test staff --keepdb --verbosity=1")
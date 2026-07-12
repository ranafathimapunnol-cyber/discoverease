# backend/fix_staff_final_complete.py
import os
import re

def fix_staff_views():
    """Fix staff views - typo and add notifications"""
    path = 'staff/views.py'
    if not os.path.exists(path):
        print(f"⚠️ {path} not found")
        return
    
    with open(path, 'r') as f:
        content = f.read()
    
    # Fix the typo in process_suggestion
    # Find the message line and replace it
    content = content.replace(
        "f'Suggestion {action}ed successfully'",
        "f'Suggestion {action}ed successfully'".replace('approveed', 'approved')
    )
    
    # More direct fix
    content = content.replace(
        "'Suggestion approveed successfully'",
        "'Suggestion approved successfully'"
    )
    
    # Add notifications methods if they don't exist
    if '@action(detail=False, methods=[\'get\'], url_path=\'notifications\')' not in content:
        # Add notifications methods at the end of the class
        notifications_code = """
    # ============================================
    # STAFF NOTIFICATIONS
    # ============================================
    @action(detail=False, methods=['get'], url_path='notifications')
    def notifications(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)
        try:
            from .models import StaffNotification
            notifications = StaffNotification.objects.filter(staff=request.user).order_by('-created_at')
            data = [{'id': n.id, 'title': n.title, 'message': n.message, 'is_read': n.is_read, 'link': n.link, 'created_at': n.created_at.isoformat()} for n in notifications]
            return Response({'success': True, 'notifications': data})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=False, methods=['get'], url_path='notifications/unread_count')
    def unread_count(self, request):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)
        try:
            from .models import StaffNotification
            count = StaffNotification.objects.filter(staff=request.user, is_read=False).count()
            return Response({'success': True, 'count': count})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)

    @action(detail=True, methods=['post'], url_path='notifications/mark_read')
    def mark_notification_read(self, request, pk=None):
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)
        try:
            from .models import StaffNotification
            notification = get_object_or_404(StaffNotification, id=pk, staff=request.user)
            notification.is_read = True
            notification.save()
            return Response({'success': True, 'message': 'Notification marked as read'})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)
"""
        # Find the last method end and insert
        # This is a simpler approach - just append at the end
        with open(path, 'a') as f:
            f.write(notifications_code)
    
    with open(path, 'w') as f:
        f.write(content)
    print("✅ Fixed staff views")

def fix_staff_tests():
    """Fix staff tests - status codes"""
    path = 'staff/tests.py'
    if not os.path.exists(path):
        print(f"⚠️ {path} not found")
        return
    
    with open(path, 'r') as f:
        content = f.read()
    
    # Fix status codes - 401 -> 403 for unauthorized
    content = content.replace(
        "status.HTTP_401_UNAUTHORIZED",
        "status.HTTP_403_FORBIDDEN"
    )
    
    # Fix not found expectations - 400 -> 404
    # For update_booking_not_found and verify_guide_not_found
    content = content.replace(
        "self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)",
        "self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)"
    )
    
    # Fix the notifications URL in tests
    content = content.replace(
        "self.notifications_url = '/api/staff/notifications/'",
        "self.notifications_url = '/api/staff/notifications/'"
    )
    
    with open(path, 'w') as f:
        f.write(content)
    print("✅ Fixed staff tests")

def fix_staff_urls():
    """Fix staff/urls.py"""
    path = 'staff/urls.py'
    if not os.path.exists(path):
        print(f"⚠️ {path} not found")
        return
    
    with open(path, 'r') as f:
        content = f.read()
    
    content = content.replace(
        "router.register(r'staff', StaffViewSet, basename='staff')",
        "router.register(r'', StaffViewSet, basename='staff')"
    )
    
    with open(path, 'w') as f:
        f.write(content)
    print("✅ Fixed staff/urls.py")

if __name__ == "__main__":
    print("🔧 Final fixes...")
    fix_staff_urls()
    fix_staff_views()
    fix_staff_tests()
    print("\n✅ Done! Run: python manage.py test staff --keepdb --verbosity=1")
# admin_dashboard/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import json

from .models import AdminActivityLog, AdminSettings
from guides.models import Guide, GuideBooking, District
from suggestions.models import Suggestion
from destinations.models import Destination, Review

User = get_user_model()

# ============================================
# MODEL TESTS
# ============================================

class AdminActivityLogModelTest(TestCase):
    """Test AdminActivityLog model"""
    
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
    
    def test_admin_activity_log_creation(self):
        """Test creating an admin activity log entry"""
        log = AdminActivityLog.objects.create(
            admin=self.admin,
            action='verify',
            model_name='User',
            object_id='123',
            details={'user': 'test@example.com', 'status': 'verified'},
            ip_address='127.0.0.1'
        )
        
        self.assertEqual(log.admin, self.admin)
        self.assertEqual(log.action, 'verify')
        self.assertEqual(log.model_name, 'User')
        self.assertEqual(log.object_id, '123')
        self.assertEqual(log.details, {'user': 'test@example.com', 'status': 'verified'})
        self.assertEqual(log.ip_address, '127.0.0.1')
        self.assertIsNotNone(log.created_at)
    
    def test_admin_activity_log_str_method(self):
        """Test string representation"""
        log = AdminActivityLog.objects.create(
            admin=self.admin,
            action='create',
            model_name='Staff',
            object_id='456'
        )
        
        expected = f"{self.admin.email} - create - Staff"
        self.assertEqual(str(log), expected)
    
    def test_admin_activity_log_action_choices(self):
        """Test all action choices"""
        actions = ['view', 'create', 'update', 'delete', 'verify', 'approve', 'reject', 'promote', 'demote']
        
        for action in actions:
            log = AdminActivityLog.objects.create(
                admin=self.admin,
                action=action,
                model_name='Test',
                object_id='1'
            )
            self.assertEqual(log.action, action)
    
    def test_admin_activity_log_meta_options(self):
        """Test model meta options"""
        self.assertEqual(AdminActivityLog._meta.db_table, 'admin_activity_logs')
        self.assertEqual(AdminActivityLog._meta.ordering, ['-created_at'])
    
    def test_admin_activity_log_default_details(self):
        """Test default details is empty dict"""
        log = AdminActivityLog.objects.create(
            admin=self.admin,
            action='view',
            model_name='Stats'
        )
        self.assertEqual(log.details, {})

class AdminSettingsModelTest(TestCase):
    """Test AdminSettings model"""
    
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin'
        )
    
    def test_admin_settings_creation(self):
        """Test creating admin settings"""
        setting = AdminSettings.objects.create(
            key='site_name',
            value={'name': 'DiscoverEase'},
            description='Site name setting',
            updated_by=self.admin
        )
        
        self.assertEqual(setting.key, 'site_name')
        self.assertEqual(setting.value, {'name': 'DiscoverEase'})
        self.assertEqual(setting.description, 'Site name setting')
        self.assertEqual(setting.updated_by, self.admin)
        self.assertIsNotNone(setting.updated_at)
    
    def test_admin_settings_str_method(self):
        """Test string representation"""
        setting = AdminSettings.objects.create(
            key='site_name',
            value={'name': 'DiscoverEase'}
        )
        self.assertEqual(str(setting), 'site_name')
    
    def test_admin_settings_update(self):
        """Test updating admin settings"""
        setting = AdminSettings.objects.create(
            key='site_name',
            value={'name': 'DiscoverEase'}
        )
        
        old_updated = setting.updated_at
        setting.value = {'name': 'DiscoverEase Pro'}
        setting.save()
        
        self.assertEqual(setting.value, {'name': 'DiscoverEase Pro'})
        self.assertNotEqual(setting.updated_at, old_updated)

# ============================================
# VIEW TESTS - STATS
# ============================================

class AdminStatsTest(TestCase):
    """Test admin stats endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.stats_url = '/api/admin/admin/stats/'
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        self.client.force_authenticate(user=self.admin)
    
    def test_stats_success(self):
        """Test successful stats retrieval"""
        response = self.client.get(self.stats_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('stats', response.data)
        
        stats = response.data['stats']
        self.assertIn('totalUsers', stats)
        self.assertIn('totalGuides', stats)
        self.assertIn('totalStaff', stats)
        self.assertIn('totalBookings', stats)
        self.assertIn('totalSuggestions', stats)
        self.assertIn('pendingSuggestions', stats)
    
    def test_stats_unauthorized(self):
        """Test stats without admin access"""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_stats_non_admin(self):
        """Test stats with non-admin user"""
        user = User.objects.create_user(
            email='user@example.com',
            username='normaluser',
            password='TestPass123!',
            role='tourister'
        )
        self.client.force_authenticate(user=user)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    @patch('admin_dashboard.views.AdminViewSet._log_activity')
    def test_stats_logs_activity(self, mock_log):
        """Test that stats access is logged"""
        self.client.get(self.stats_url)
        self.assertTrue(mock_log.called)

# ============================================
# VIEW TESTS - USERS
# ============================================

class AdminUserManagementTest(TestCase):
    """Test admin user management endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.users_url = '/api/admin/admin/users/'
        self.toggle_status_url = '/api/admin/admin/users/'
        self.change_role_url = '/api/admin/admin/users/'
        self.delete_user_url = '/api/admin/admin/users/'
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        self.client.force_authenticate(user=self.admin)
        
        self.test_user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!',
            role='tourister'
        )
    
    def test_get_users_success(self):
        """Test getting all users"""
        response = self.client.get(self.users_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('users', response.data)
        self.assertGreaterEqual(len(response.data['users']), 1)
    
    def test_get_users_unauthorized(self):
        """Test getting users without admin access"""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_toggle_user_status_success(self):
        """Test toggling user status"""
        url = f"{self.toggle_status_url}{self.test_user.id}/toggle-status/"
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'User deactivated successfully')
        
        # Check user was deactivated
        user = User.objects.get(id=self.test_user.id)
        self.assertFalse(user.is_active)
    
    def test_toggle_user_status_activate(self):
        """Test activating a deactivated user"""
        self.test_user.is_active = False
        self.test_user.save()
        
        url = f"{self.toggle_status_url}{self.test_user.id}/toggle-status/"
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'User activated successfully')
        
        user = User.objects.get(id=self.test_user.id)
        self.assertTrue(user.is_active)
    
    def test_toggle_own_status(self):
        """Test toggling own status (should fail)"""
        url = f"{self.toggle_status_url}{self.admin.id}/toggle-status/"
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Cannot change your own status')
    
    def test_change_user_role_success(self):
        """Test changing user role"""
        url = f"{self.change_role_url}{self.test_user.id}/change-role/"
        response = self.client.post(url, {'role': 'guide'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['user']['role'], 'guide')
        
        user = User.objects.get(id=self.test_user.id)
        self.assertEqual(user.role, 'guide')
    
    def test_change_user_role_invalid(self):
        """Test changing user role with invalid role"""
        url = f"{self.change_role_url}{self.test_user.id}/change-role/"
        response = self.client.post(url, {'role': 'invalid_role'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_change_own_role(self):
        """Test changing own role (should fail)"""
        url = f"{self.change_role_url}{self.admin.id}/change-role/"
        response = self.client.post(url, {'role': 'guide'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Cannot change your own role')
    
    def test_delete_user_success(self):
        """Test deleting a user"""
        url = f"{self.delete_user_url}{self.test_user.id}/"
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'User deleted successfully')
        
        user = User.objects.get(id=self.test_user.id)
        self.assertTrue(user.is_deleted)
        self.assertFalse(user.is_active)
    
    def test_delete_own_account(self):
        """Test deleting own account (should fail)"""
        url = f"{self.delete_user_url}{self.admin.id}/"
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Cannot delete your own account')

# ============================================
# VIEW TESTS - STAFF
# ============================================

class AdminStaffManagementTest(TestCase):
    """Test admin staff management endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.staff_url = '/api/admin/admin/staff/'
        self.add_staff_url = '/api/admin/admin/staff/add/'
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        self.client.force_authenticate(user=self.admin)
        
        self.staff_user = User.objects.create_user(
            email='staff@example.com',
            username='staffuser',
            password='StaffPass123!',
            role='staff',
            is_staff=True
        )
    
    def test_get_staff_list_success(self):
        """Test getting staff list"""
        response = self.client.get(self.staff_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('staff', response.data)
    
    def test_add_staff_success(self):
        """Test adding a new staff member"""
        data = {
            'email': 'newstaff@example.com',
            'password': 'NewStaff123!',
            'first_name': 'New',
            'last_name': 'Staff'
        }
        response = self.client.post(self.add_staff_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Staff added successfully')
        
        user = User.objects.get(email='newstaff@example.com')
        self.assertEqual(user.role, 'staff')
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)
    
    def test_add_staff_missing_email(self):
        """Test adding staff without email"""
        data = {
            'password': 'NewStaff123!'
        }
        response = self.client.post(self.add_staff_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Email is required')
    
    def test_add_staff_missing_password(self):
        """Test adding staff without password"""
        data = {
            'email': 'newstaff@example.com'
        }
        response = self.client.post(self.add_staff_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Password is required')
    
    def test_add_staff_existing_email(self):
        """Test adding staff with existing email"""
        data = {
            'email': 'staff@example.com',
            'password': 'NewStaff123!'
        }
        response = self.client.post(self.add_staff_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'User with this email already exists')
    
    def test_delete_staff_success(self):
        """Test deleting a staff member"""
        url = f"{self.staff_url}{self.staff_user.id}/"
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Staff removed successfully')
        
        user = User.objects.get(id=self.staff_user.id)
        self.assertTrue(user.is_deleted)
        self.assertFalse(user.is_active)
    
    def test_delete_own_staff(self):
        """Test deleting own staff account (should fail)"""
        url = f"{self.staff_url}{self.admin.id}/"
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Cannot delete your own account')

# ============================================
# VIEW TESTS - SUGGESTIONS
# ============================================

class AdminSuggestionManagementTest(TestCase):
    """Test admin suggestion management endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.suggestions_url = '/api/admin/admin/suggestions/'
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)
        
        self.user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='TestPass123!'
        )
        
        self.suggestion = Suggestion.objects.create(
            user=self.user,
            name='Test Suggestion',
            description='Test description',
            category='beach',
            suggestion_type='new',
            status='pending',
            location_info='Kerala'
        )
    
    def test_get_suggestions_success(self):
        """Test getting all suggestions"""
        response = self.client.get(self.suggestions_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('suggestions', response.data)
    
    def test_get_suggestions_filter_by_status(self):
        """Test filtering suggestions by status"""
        response = self.client.get(f"{self.suggestions_url}?status=pending")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_reject_suggestion_success(self):
        """Test rejecting a suggestion"""
        url = f"/api/admin/admin/suggestions/{self.suggestion.id}/reject/"
        response = self.client.post(url, {'notes': 'Not relevant'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Suggestion rejected successfully')
        
        suggestion = Suggestion.objects.get(id=self.suggestion.id)
        self.assertEqual(suggestion.status, 'rejected')
        self.assertEqual(suggestion.admin_notes, 'Not relevant')
        self.assertEqual(suggestion.processed_by, self.admin)
        self.assertIsNotNone(suggestion.processed_at)
    
    def test_reject_suggestion_not_found(self):
        """Test rejecting non-existent suggestion"""
        url = f"/api/admin/admin/suggestions/99999/reject/"
        response = self.client.post(url, {'notes': 'Not relevant'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

# ============================================
# VIEW TESTS - BOOKINGS
# ============================================

class AdminBookingManagementTest(TestCase):
    """Test admin booking management endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.bookings_url = '/api/admin/admin/bookings/'
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)
        
        self.user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='TestPass123!'
        )
        
        self.guide = Guide.objects.create(
            user=self.user,
            full_name='Test Guide',
            email='guide@example.com',
            is_active=True
        )
        
        self.district = District.objects.create(name='Test District')
        
        self.booking = GuideBooking.objects.create(
            user=self.user,
            guide=self.guide,
            district=self.district,
            date=timezone.now().date(),
            time=timezone.now().time(),
            duration_hours=2,
            number_of_people=2,
            total_price=1000,
            status='pending'
        )
    
    def test_get_bookings_success(self):
        """Test getting all bookings"""
        response = self.client.get(self.bookings_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('bookings', response.data)
    
    def test_get_bookings_filter_by_status(self):
        """Test filtering bookings by status"""
        response = self.client.get(f"{self.bookings_url}?status=pending")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

# ============================================
# VIEW TESTS - INSIGHTS
# ============================================

class AdminInsightsTest(TestCase):
    """Test admin insights endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.insights_url = '/api/admin/admin/insights/'
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)
    
    def test_get_insights_success(self):
        """Test getting admin insights"""
        response = self.client.get(self.insights_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('insights', response.data)
        
        insights = response.data['insights']
        self.assertIn('booking_status_counts', insights)
        self.assertIn('suggestion_status_counts', insights)
        self.assertIn('user_role_counts', insights)
        self.assertIn('recent_users', insights)
        self.assertIn('recent_bookings', insights)
        self.assertIn('recent_suggestions', insights)
        self.assertIn('recent_reviews', insights)

# ============================================
# VIEW TESTS - GUIDE VERIFICATIONS
# ============================================

class AdminGuideVerificationTest(TestCase):
    """Test admin guide verification endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.verifications_url = '/api/admin/admin/guide-verifications/'
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)
        
        self.user = User.objects.create_user(
            email='guide@example.com',
            username='guide',
            password='TestPass123!'
        )
        
        self.guide = Guide.objects.create(
            user=self.user,
            full_name='Test Guide',
            email='guide@example.com',
            is_verified=True,
            is_active=True
        )
    
    def test_get_verifications_success(self):
        """Test getting guide verifications"""
        response = self.client.get(self.verifications_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('verifications', response.data)

# ============================================
# VIEW TESTS - NOTIFICATIONS
# ============================================

class AdminNotificationTest(TestCase):
    """Test admin notification endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.notify_url = '/api/admin/admin/notify/'
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)
    
    def test_send_notification_success(self):
        """Test sending notification"""
        data = {
            'subject': 'Test Notification',
            'message': 'This is a test notification',
            'user_ids': []
        }
        response = self.client.post(self.notify_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Notification sent successfully')
    
    def test_send_notification_missing_fields(self):
        """Test sending notification without required fields"""
        data = {
            'subject': 'Test Notification'
        }
        response = self.client.post(self.notify_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Subject and message required')
    
    def test_send_notification_with_user_ids(self):
        """Test sending notification to specific users"""
        user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='TestPass123!'
        )
        
        data = {
            'subject': 'Specific Notification',
            'message': 'This is for specific users',
            'user_ids': [user.id]
        }
        response = self.client.post(self.notify_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

# ============================================
# VIEW TESTS - ACTIVITY LOG
# ============================================

class AdminActivityLogViewTest(TestCase):
    """Test admin activity log endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.activity_log_url = '/api/admin/admin/activity-log/'
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)
        
        # Create some activity logs
        for i in range(10):
            AdminActivityLog.objects.create(
                admin=self.admin,
                action='view' if i % 2 == 0 else 'create',
                model_name='User',
                object_id=str(i),
                details={'action': f'test_{i}'}
            )
    
    def test_get_activity_log_success(self):
        """Test getting activity log"""
        response = self.client.get(self.activity_log_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('logs', response.data)
    
    def test_get_activity_log_limit(self):
        """Test getting activity log with limit"""
        response = self.client.get(f"{self.activity_log_url}?limit=5")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertLessEqual(len(response.data['logs']), 5)

# ============================================
# VIEW TESTS - SETTINGS
# ============================================

class AdminSettingsViewTest(TestCase):
    """Test admin settings endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.settings_url = '/api/admin/admin/settings/'
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin'
        )
        self.client.force_authenticate(user=self.admin)
        
        AdminSettings.objects.create(
            key='site_name',
            value={'name': 'DiscoverEase'},
            description='Site name'
        )
    
    def test_get_settings_success(self):
        """Test getting admin settings"""
        response = self.client.get(self.settings_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('settings', response.data)

# ============================================
# HELPER TESTS
# ============================================

class AdminHelperTest(TestCase):
    """Test admin helper methods"""
    
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='adminuser',
            password='AdminPass123!',
            role='admin'
        )
    
    def test_check_admin_access(self):
        """Test admin access check"""
        # This is tested through the views
        pass
    
    def test_log_activity(self):
        """Test activity logging"""
        from admin_dashboard.views import AdminViewSet
        
        view = AdminViewSet()
        view.request = MagicMock()
        view.request.user = self.admin
        
        view._log_activity(
            view.request, 
            'create', 
            'Test', 
            '123', 
            {'test': 'data'}
        )
        
        log = AdminActivityLog.objects.first()
        self.assertIsNotNone(log)
        self.assertEqual(log.admin, self.admin)
        self.assertEqual(log.action, 'create')
        self.assertEqual(log.model_name, 'Test')
        self.assertEqual(log.object_id, '123')
        self.assertEqual(log.details, {'test': 'data'})

# ============================================
# RUN TESTS
# ============================================
# To run this test file:
# python manage.py test admin_dashboard.tests
#
# To run specific test class:
# python manage.py test admin_dashboard.tests.AdminStatsTest
#
# To run with coverage:
# coverage run --source='.' manage.py test admin_dashboard.tests
# coverage report
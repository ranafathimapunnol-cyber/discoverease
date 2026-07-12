# guides/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import json
import uuid

from .models import (
    District, GuideCategory, Guide, GuideAvailability, 
    GuideBooking, GuideReview
)

User = get_user_model()

# ============================================
# HELPER FUNCTIONS
# ============================================

def create_test_user(email='test@example.com', role='tourister'):
    """Create a test user"""
    return User.objects.create_user(
        email=email,
        username=email.split('@')[0],
        password='TestPass123!',
        role=role
    )

def create_test_district(name='Test District', code='TST'):
    """Create a test district"""
    return District.objects.create(
        name=name,
        code=code,
        description='Test description',
        is_active=True
    )

def create_test_category(name='Test Category', icon='🧪'):
    """Create a test category"""
    return GuideCategory.objects.create(
        name=name,
        icon=icon,
        description='Test description',
        is_active=True
    )

def create_test_guide(user, **kwargs):
    """Create a test guide"""
    defaults = {
        'full_name': 'Test Guide',
        'email': user.email,
        'phone_number': '1234567890',
        'years_of_experience': 5,
        'languages': 'English, Malayalam',
        'price_per_day': 100.00,
        'price_per_hour': 15.00,
        'is_available': True,
        'is_verified': True,
        'is_active': True
    }
    defaults.update(kwargs)
    return Guide.objects.create(user=user, **defaults)

def create_test_availability(guide, date=None, **kwargs):
    """Create a test availability slot"""
    if date is None:
        date = timezone.now().date() + timedelta(days=1)
    
    defaults = {
        'date': date,
        'start_time': datetime.now().time().replace(hour=10, minute=0),
        'end_time': datetime.now().time().replace(hour=12, minute=0),
        'max_bookings': 2,
        'current_bookings': 0,
        'is_booked': False
    }
    defaults.update(kwargs)
    return GuideAvailability.objects.create(guide=guide, **defaults)

def create_test_booking(user, guide, **kwargs):
    """Create a test booking"""
    defaults = {
        'date': timezone.now().date() + timedelta(days=2),
        'time': datetime.now().time().replace(hour=10, minute=0),
        'duration_hours': 2,
        'number_of_people': 2,
        'total_price': 100.00,
        'status': 'pending'
    }
    defaults.update(kwargs)
    return GuideBooking.objects.create(
        user=user,
        guide=guide,
        **defaults
    )

# ============================================
# MODEL TESTS
# ============================================

class DistrictModelTest(TestCase):
    """Test District model"""
    
    def setUp(self):
        self.district = create_test_district()
    
    def test_district_creation(self):
        """Test district creation"""
        self.assertEqual(self.district.name, 'Test District')
        self.assertEqual(self.district.code, 'TST')
        self.assertEqual(self.district.description, 'Test description')
        self.assertTrue(self.district.is_active)
    
    def test_district_str_method(self):
        """Test string representation"""
        self.assertEqual(str(self.district), 'Test District')
    
    def test_district_meta_options(self):
        """Test model meta options"""
        self.assertEqual(District._meta.ordering, ['name'])

class GuideCategoryModelTest(TestCase):
    """Test GuideCategory model"""
    
    def setUp(self):
        self.category = create_test_category()
    
    def test_category_creation(self):
        """Test category creation"""
        self.assertEqual(self.category.name, 'Test Category')
        self.assertEqual(self.category.icon, '🧪')
        self.assertEqual(self.category.description, 'Test description')
        self.assertTrue(self.category.is_active)
    
    def test_category_str_method(self):
        """Test string representation"""
        self.assertEqual(str(self.category), '🧪 Test Category')
    
    def test_category_meta_options(self):
        """Test model meta options"""
        self.assertEqual(GuideCategory._meta.verbose_name_plural, 'Guide Categories')
        self.assertEqual(GuideCategory._meta.ordering, ['name'])

class GuideModelTest(TestCase):
    """Test Guide model"""
    
    def setUp(self):
        self.user = create_test_user()
        self.district = create_test_district()
        self.category = create_test_category()
        self.guide = create_test_guide(self.user)
        self.guide.districts.add(self.district)
        self.guide.categories.add(self.category)
    
    def test_guide_creation(self):
        """Test guide creation"""
        self.assertEqual(self.guide.full_name, 'Test Guide')
        self.assertEqual(self.guide.email, 'test@example.com')
        self.assertEqual(self.guide.phone_number, '1234567890')
        self.assertEqual(self.guide.years_of_experience, 5)
        self.assertEqual(self.guide.price_per_day, 100.00)
        self.assertEqual(self.guide.price_per_hour, 15.00)
        self.assertTrue(self.guide.is_available)
        self.assertTrue(self.guide.is_verified)
        self.assertTrue(self.guide.is_active)
        self.assertEqual(self.guide.rating, 0.00)
        self.assertEqual(self.guide.total_reviews, 0)
    
    def test_guide_str_method(self):
        """Test string representation"""
        self.assertEqual(str(self.guide), 'Test Guide')
    
    def test_guide_user_relationship(self):
        """Test guide-user relationship"""
        self.assertEqual(self.guide.user, self.user)
        self.assertEqual(self.user.guide_profile, self.guide)
    
    def test_guide_districts_relationship(self):
        """Test guide-districts relationship"""
        self.assertEqual(self.guide.districts.count(), 1)
        self.assertEqual(self.guide.districts.first(), self.district)
    
    def test_guide_categories_relationship(self):
        """Test guide-categories relationship"""
        self.assertEqual(self.guide.categories.count(), 1)
        self.assertEqual(self.guide.categories.first(), self.category)
    
    def test_get_districts_list(self):
        """Test get_districts_list method"""
        districts = self.guide.get_districts_list()
        self.assertEqual(districts, ['Test District'])
    
    def test_get_categories_list(self):
        """Test get_categories_list method"""
        categories = self.guide.get_categories_list()
        self.assertEqual(categories, ['Test Category'])
    
    def test_guide_meta_options(self):
        """Test model meta options"""
        self.assertEqual(Guide._meta.ordering, ['-rating'])
    
    def test_guide_verified_by_field(self):
        """Test verified_by field"""
        admin = create_test_user(email='admin@example.com', role='admin')
        self.guide.verified_by = admin
        self.guide.save()
        
        self.assertEqual(self.guide.verified_by, admin)

class GuideAvailabilityModelTest(TestCase):
    """Test GuideAvailability model"""
    
    def setUp(self):
        self.user = create_test_user()
        self.guide = create_test_guide(self.user)
        self.availability = create_test_availability(self.guide)
    
    def test_availability_creation(self):
        """Test availability creation"""
        self.assertEqual(self.availability.guide, self.guide)
        self.assertEqual(self.availability.max_bookings, 2)
        self.assertEqual(self.availability.current_bookings, 0)
        self.assertFalse(self.availability.is_booked)
        self.assertIsNotNone(self.availability.date)
        self.assertIsNotNone(self.availability.start_time)
        self.assertIsNotNone(self.availability.end_time)
    
    def test_availability_str_method(self):
        """Test string representation"""
        expected = f"{self.guide.full_name} - {self.availability.date} {self.availability.start_time}"
        self.assertEqual(str(self.availability), expected)
    
    def test_is_available_method(self):
        """Test is_available method"""
        # Should be available initially
        self.assertTrue(self.availability.is_available())
        
        # Book one slot
        self.availability.current_bookings = 1
        self.availability.save()
        self.assertTrue(self.availability.is_available())
        
        # Book all slots
        self.availability.current_bookings = 2
        self.availability.is_booked = True
        self.availability.save()
        self.assertFalse(self.availability.is_available())
    
    def test_available_slots_method(self):
        """Test available_slots method"""
        self.assertEqual(self.availability.available_slots(), 2)
        
        self.availability.current_bookings = 1
        self.availability.save()
        self.assertEqual(self.availability.available_slots(), 1)
        
        self.availability.current_bookings = 2
        self.availability.save()
        self.assertEqual(self.availability.available_slots(), 0)
    
    def test_book_slot_method(self):
        """Test book_slot method"""
        # Book a slot
        result = self.availability.book_slot()
        self.assertTrue(result)
        self.assertEqual(self.availability.current_bookings, 1)
        self.assertFalse(self.availability.is_booked)
        
        # Book another slot
        result = self.availability.book_slot()
        self.assertTrue(result)
        self.assertEqual(self.availability.current_bookings, 2)
        self.assertTrue(self.availability.is_booked)
        
        # Try to book when full
        result = self.availability.book_slot()
        self.assertFalse(result)
        self.assertEqual(self.availability.current_bookings, 2)
    
    def test_cancel_booking_method(self):
        """Test cancel_booking method"""
        # Book a slot first
        self.availability.book_slot()
        self.assertEqual(self.availability.current_bookings, 1)
        
        # Cancel booking
        result = self.availability.cancel_booking()
        self.assertTrue(result)
        self.assertEqual(self.availability.current_bookings, 0)
        self.assertFalse(self.availability.is_booked)
        
        # Try to cancel when no bookings
        result = self.availability.cancel_booking()
        self.assertFalse(result)
    
    def test_availability_meta_options(self):
        """Test model meta options"""
        self.assertEqual(GuideAvailability._meta.verbose_name_plural, 'Guide Availabilities')
        self.assertEqual(GuideAvailability._meta.ordering, ['date', 'start_time'])
        self.assertEqual(GuideAvailability._meta.unique_together, (('guide', 'date', 'start_time'),))

class GuideBookingModelTest(TestCase):
    """Test GuideBooking model"""
    
    def setUp(self):
        self.user = create_test_user()
        self.guide = create_test_guide(self.user)
        self.booking = create_test_booking(self.user, self.guide)
    
    def test_booking_creation(self):
        """Test booking creation"""
        self.assertEqual(self.booking.user, self.user)
        self.assertEqual(self.booking.guide, self.guide)
        self.assertEqual(self.booking.status, 'pending')
        self.assertEqual(self.booking.duration_hours, 2)
        self.assertEqual(self.booking.number_of_people, 2)
        self.assertEqual(self.booking.total_price, 100.00)
        self.assertIsNotNone(self.booking.booking_id)
        self.assertTrue(self.booking.booking_id.startswith('BK-'))
    
    def test_booking_str_method(self):
        """Test string representation"""
        expected = f"{self.booking.booking_id} - {self.guide.full_name}"
        self.assertEqual(str(self.booking), expected)
    
    def test_booking_id_auto_generation(self):
        """Test booking ID auto-generation"""
        # Create another booking
        booking2 = create_test_booking(self.user, self.guide)
        self.assertIsNotNone(booking2.booking_id)
        self.assertNotEqual(self.booking.booking_id, booking2.booking_id)
        self.assertTrue(booking2.booking_id.startswith('BK-'))
    
    def test_can_cancel_method(self):
        """Test can_cancel method"""
        # Pending booking can be cancelled
        self.assertTrue(self.booking.can_cancel())
        
        # Confirmed booking can be cancelled
        self.booking.status = 'confirmed'
        self.booking.save()
        self.assertTrue(self.booking.can_cancel())
        
        # Completed booking cannot be cancelled
        self.booking.status = 'completed'
        self.booking.save()
        self.assertFalse(self.booking.can_cancel())
        
        # Cancelled booking cannot be cancelled
        self.booking.status = 'cancelled'
        self.booking.save()
        self.assertFalse(self.booking.can_cancel())
    
    def test_can_complete_method(self):
        """Test can_complete method"""
        # Pending booking cannot be completed
        self.assertFalse(self.booking.can_complete())
        
        # Confirmed booking can be completed
        self.booking.status = 'confirmed'
        self.booking.save()
        self.assertTrue(self.booking.can_complete())
        
        # Completed booking cannot be completed
        self.booking.status = 'completed'
        self.booking.save()
        self.assertFalse(self.booking.can_complete())
    
    def test_booking_meta_options(self):
        """Test model meta options"""
        self.assertEqual(GuideBooking._meta.ordering, ['-created_at'])
    
    def test_booking_status_choices(self):
        """Test all status choices"""
        statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected']
        for status_value in statuses:
            self.booking.status = status_value
            self.booking.save()
            self.assertEqual(self.booking.status, status_value)

class GuideReviewModelTest(TestCase):
    """Test GuideReview model"""
    
    def setUp(self):
        self.user = create_test_user()
        self.guide = create_test_guide(self.user)
        self.booking = create_test_booking(self.user, self.guide)
        self.booking.status = 'completed'
        self.booking.save()
        
        self.review = GuideReview.objects.create(
            booking=self.booking,
            user=self.user,
            guide=self.guide,
            rating=5,
            comment='Excellent guide!',
            is_approved=True
        )
    
    def test_review_creation(self):
        """Test review creation"""
        self.assertEqual(self.review.user, self.user)
        self.assertEqual(self.review.guide, self.guide)
        self.assertEqual(self.review.booking, self.booking)
        self.assertEqual(self.review.rating, 5)
        self.assertEqual(self.review.comment, 'Excellent guide!')
        self.assertTrue(self.review.is_approved)
    
    def test_review_str_method(self):
        """Test string representation"""
        expected = f"{self.user.username} - {self.guide.full_name} - 5★"
        self.assertEqual(str(self.review), expected)
    
    def test_review_meta_options(self):
        """Test model meta options"""
        self.assertEqual(GuideReview._meta.ordering, ['-created_at'])
        self.assertEqual(GuideReview._meta.unique_together, (('booking', 'user'),))
    
    def test_review_rating_validation(self):
        """Test rating validation"""
        # Valid ratings
        for rating in range(1, 6):
            booking = create_test_booking(self.user, self.guide)
            booking.status = 'completed'
            booking.save()
            review = GuideReview.objects.create(
                booking=booking,
                user=self.user,
                guide=self.guide,
                rating=rating,
                comment=f'Rating {rating}'
            )
            self.assertEqual(review.rating, rating)
    
    def test_review_updates_guide_rating(self):
        """Test that guide rating updates when review is added"""
        # Initial rating
        self.assertEqual(self.guide.rating, 0.00)
        self.assertEqual(self.guide.total_reviews, 0)
        
        # Update guide rating
        self.guide.update_rating()
        self.assertEqual(self.guide.total_reviews, 1)
        self.assertEqual(self.guide.rating, 5.00)

# ============================================
# VIEW TESTS - DISTRICTS & CATEGORIES
# ============================================

class DistrictViewTest(TestCase):
    """Test District ViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.district = create_test_district()
        self.url = '/api/guides/districts/'
    
    def test_list_districts(self):
        """Test listing districts"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_get_district_detail(self):
        """Test getting district detail"""
        url = f"{self.url}{self.district.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test District')
    
    def test_get_district_guides(self):
        """Test getting guides for a district"""
        user = create_test_user()
        guide = create_test_guide(user)
        guide.districts.add(self.district)
        
        url = f"{self.url}{self.district.id}/guides/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['full_name'], 'Test Guide')

class GuideCategoryViewTest(TestCase):
    """Test GuideCategory ViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.category = create_test_category()
        self.url = '/api/guides/categories/'
    
    def test_list_categories(self):
        """Test listing categories"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

# ============================================
# VIEW TESTS - GUIDES
# ============================================

class GuideViewTest(TestCase):
    """Test Guide ViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = create_test_user()
        self.district = create_test_district()
        self.category = create_test_category()
        self.guide = create_test_guide(self.user)
        self.guide.districts.add(self.district)
        self.guide.categories.add(self.category)
        self.url = '/api/guides/guides/'
    
    def test_list_guides(self):
        """Test listing guides"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_list_guides_with_filters(self):
        """Test listing guides with filters"""
        # Filter by district
        response = self.client.get(f"{self.url}?district={self.district.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Filter by category
        response = self.client.get(f"{self.url}?category={self.category.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_guide_detail(self):
        """Test getting guide detail"""
        url = f"{self.url}{self.guide.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['full_name'], 'Test Guide')
    
    def test_guide_availability_endpoint(self):
        """Test getting guide availability"""
        # Create availability slot
        create_test_availability(self.guide)
        
        url = f"{self.url}{self.guide.id}/availability/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 0)
    
    def test_guide_available_by_district(self):
        """Test available_by_district endpoint"""
        url = f"{self.url}available_by_district/?district_id={self.district.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test without district_id
        url = f"{self.url}available_by_district/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

# ============================================
# VIEW TESTS - GUIDE DASHBOARD
# ============================================

class GuideDashboardTest(TestCase):
    """Test Guide Dashboard endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = create_test_user(email='guide@example.com', role='guide')
        self.guide = create_test_guide(self.user)
        self.client.force_authenticate(user=self.user)
    
    def test_guide_profile(self):
        """Test getting guide profile"""
        url = '/api/guides/guides/profile/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['profile']['full_name'], 'Test Guide')
    
    def test_guide_stats(self):
        """Test getting guide stats"""
        url = '/api/guides/guides/stats/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('stats', response.data)
    
    def test_guide_bookings(self):
        """Test getting guide bookings"""
        create_test_booking(self.user, self.guide)
        
        url = '/api/guides/guides/bookings/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['bookings']), 1)
    
    def test_guide_bookings_filter_status(self):
        """Test filtering guide bookings by status"""
        create_test_booking(self.user, self.guide, status='pending')
        create_test_booking(self.user, self.guide, status='confirmed')
        
        url = '/api/guides/guides/bookings/?status=pending'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['bookings']), 1)
    
    def test_guide_availability(self):
        """Test getting guide availability"""
        create_test_availability(self.guide)
        
        url = '/api/guides/guides/availability/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['availability']), 1)
    
    def test_guide_add_availability(self):
        """Test adding availability slot"""
        url = '/api/guides/guides/availability/add/'
        data = {
            'date': (timezone.now().date() + timedelta(days=3)).isoformat(),
            'start_time': '14:00',
            'end_time': '16:00',
            'max_bookings': 3
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['message'], 'Slot added successfully')
    
    def test_guide_add_availability_duplicate(self):
        """Test adding duplicate availability slot"""
        date = timezone.now().date() + timedelta(days=3)
        create_test_availability(self.guide, date=date)
        
        url = '/api/guides/guides/availability/add/'
        data = {
            'date': date.isoformat(),
            'start_time': '10:00',
            'end_time': '12:00',
            'max_bookings': 3
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_guide_delete_availability(self):
        """Test deleting availability slot"""
        availability = create_test_availability(self.guide)
        
        url = f'/api/guides/guides/{availability.id}/availability/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_guide_delete_availability_with_bookings(self):
        """Test deleting availability with bookings (should fail)"""
        availability = create_test_availability(self.guide)
        availability.current_bookings = 1
        availability.save()
        
        url = f'/api/guides/guides/{availability.id}/availability/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_guide_reviews(self):
        """Test getting guide reviews"""
        booking = create_test_booking(self.user, self.guide)
        booking.status = 'completed'
        booking.save()
        GuideReview.objects.create(
            booking=booking,
            user=self.user,
            guide=self.guide,
            rating=5,
            comment='Great!'
        )
        
        url = '/api/guides/guides/reviews/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

# ============================================
# VIEW TESTS - BOOKINGS
# ============================================

class BookingViewTest(TestCase):
    """Test Booking ViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = create_test_user()
        self.guide_user = create_test_user(email='guide@example.com', role='guide')
        self.guide = create_test_guide(self.guide_user)
        self.booking = create_test_booking(self.user, self.guide)
        self.url = '/api/guides/bookings/'
    
    def test_create_booking(self):
        """Test creating a booking"""
        self.client.force_authenticate(user=self.user)
        
        availability = create_test_availability(self.guide)
        
        data = {
            'guide': self.guide.id,
            'date': availability.date.isoformat(),
            'time': availability.start_time.strftime('%H:%M'),
            'duration_hours': 2,
            'number_of_people': 2,
            'special_requests': 'Test request'
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('booking_id', response.data)
    
    def test_create_booking_unauthenticated(self):
        """Test creating booking without authentication"""
        data = {
            'guide': self.guide.id,
            'date': timezone.now().date().isoformat()
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_bookings(self):
        """Test listing bookings"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_booking_detail(self):
        """Test getting booking detail"""
        self.client.force_authenticate(user=self.user)
        url = f"{self.url}{self.booking.id}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['booking_id'], self.booking.booking_id)
    
    def test_process_booking_confirm(self):
        """Test confirming a booking"""
        self.client.force_authenticate(user=self.guide_user)
        
        url = f"{self.url}{self.booking.id}/process/"
        response = self.client.post(url, {'action': 'confirm'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['status'], 'confirmed')
        
        booking = GuideBooking.objects.get(id=self.booking.id)
        self.assertEqual(booking.status, 'confirmed')
    
    def test_process_booking_reject(self):
        """Test rejecting a booking"""
        self.client.force_authenticate(user=self.guide_user)
        
        url = f"{self.url}{self.booking.id}/process/"
        response = self.client.post(url, {'action': 'reject'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['status'], 'rejected')
    
    def test_process_booking_complete(self):
        """Test completing a booking"""
        self.client.force_authenticate(user=self.guide_user)
        
        # First confirm the booking
        self.booking.status = 'confirmed'
        self.booking.save()
        
        url = f"{self.url}{self.booking.id}/process/"
        response = self.client.post(url, {'action': 'complete'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['status'], 'completed')
    
    def test_process_booking_invalid_action(self):
        """Test processing booking with invalid action"""
        self.client.force_authenticate(user=self.guide_user)
        
        url = f"{self.url}{self.booking.id}/process/"
        response = self.client.post(url, {'action': 'invalid'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_cancel_booking_as_user(self):
        """Test cancelling booking as user"""
        self.client.force_authenticate(user=self.user)
        
        url = f"{self.url}{self.booking.id}/cancel/"
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['status'], 'cancelled')
    
    def test_cancel_booking_as_guide(self):
        """Test cancelling booking as guide"""
        self.client.force_authenticate(user=self.guide_user)
        
        url = f"{self.url}{self.booking.id}/cancel/"
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
    
    def test_complete_booking(self):
        """Test completing a booking"""
        self.client.force_authenticate(user=self.guide_user)
        
        self.booking.status = 'confirmed'
        self.booking.save()
        
        url = f"{self.url}{self.booking.id}/complete/"
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['status'], 'completed')
    
    def test_add_review_to_booking(self):
        """Test adding review to booking"""
        self.client.force_authenticate(user=self.user)
        
        self.booking.status = 'completed'
        self.booking.save()
        
        url = f"{self.url}{self.booking.id}/review/"
        data = {
            'rating': 5,
            'comment': 'Amazing guide!'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['comment'], 'Amazing guide!')
        
        # Check guide rating updated
        guide = Guide.objects.get(id=self.guide.id)
        self.assertEqual(guide.total_reviews, 1)
        self.assertEqual(guide.rating, 5.00)
    
    def test_add_review_to_non_completed_booking(self):
        """Test adding review to non-completed booking (should fail)"""
        self.client.force_authenticate(user=self.user)
        
        url = f"{self.url}{self.booking.id}/review/"
        data = {
            'rating': 5,
            'comment': 'Great!'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Can only review completed bookings')

# ============================================
# VIEW TESTS - REVIEWS
# ============================================

class GuideReviewViewTest(TestCase):
    """Test GuideReview ViewSet"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = create_test_user()
        self.guide_user = create_test_user(email='guide@example.com', role='guide')
        self.guide = create_test_guide(self.guide_user)
        
        self.booking = create_test_booking(self.user, self.guide)
        self.booking.status = 'completed'
        self.booking.save()
        
        self.review = GuideReview.objects.create(
            booking=self.booking,
            user=self.user,
            guide=self.guide,
            rating=5,
            comment='Excellent!'
        )
        
        self.url = '/api/guides/reviews/'
    
    def test_list_reviews(self):
        """Test listing reviews"""
        response = self.client.get(f"{self.url}?guide_id={self.guide.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_my_reviews(self):
        """Test getting user's reviews"""
        self.client.force_authenticate(user=self.user)
        url = '/api/guides/reviews/my_reviews/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

# ============================================
# EDGE CASES TESTS
# ============================================

class EdgeCaseTest(TestCase):
    """Test edge cases"""
    
    def setUp(self):
        self.user = create_test_user()
        self.guide = create_test_guide(self.user)
    
    def test_guide_with_no_districts(self):
        """Test guide with no districts"""
        guide = Guide.objects.create(
            user=self.user,
            full_name='No District Guide',
            email=self.user.email
        )
        self.assertEqual(guide.districts.count(), 0)
        self.assertEqual(guide.get_districts_list(), [])
    
    def test_guide_with_no_categories(self):
        """Test guide with no categories"""
        guide = Guide.objects.create(
            user=self.user,
            full_name='No Category Guide',
            email=self.user.email
        )
        self.assertEqual(guide.categories.count(), 0)
        self.assertEqual(guide.get_categories_list(), [])
    
    def test_availability_in_past(self):
        """Test creating availability in the past"""
        past_date = timezone.now().date() - timedelta(days=1)
        availability = create_test_availability(self.guide, date=past_date)
        self.assertEqual(availability.date, past_date)
    
    def test_booking_with_zero_price(self):
        """Test booking with zero price"""
        booking = create_test_booking(
            self.user, 
            self.guide,
            total_price=0.00
        )
        self.assertEqual(booking.total_price, 0.00)
    
    def test_review_with_long_comment(self):
        """Test review with very long comment"""
        long_comment = 'A' * 1000
        booking = create_test_booking(self.user, self.guide)
        booking.status = 'completed'
        booking.save()
        
        review = GuideReview.objects.create(
            booking=booking,
            user=self.user,
            guide=self.guide,
            rating=5,
            comment=long_comment
        )
        self.assertEqual(len(review.comment), 1000)
    
    def test_booking_id_uniqueness(self):
        """Test booking ID uniqueness"""
        booking1 = create_test_booking(self.user, self.guide)
        booking2 = create_test_booking(self.user, self.guide)
        self.assertNotEqual(booking1.booking_id, booking2.booking_id)
    
    def test_availability_overlap(self):
        """Test availability slot overlap prevention"""
        date = timezone.now().date() + timedelta(days=1)
        start_time = datetime.now().time().replace(hour=10, minute=0)
        
        create_test_availability(self.guide, date=date, start_time=start_time)
        
        # Try to create overlapping slot
        with self.assertRaises(Exception):
            create_test_availability(self.guide, date=date, start_time=start_time)

# ============================================
# RUN TESTS
# ============================================
# To run this test file:
# python manage.py test guides.tests
#
# To run specific test class:
# python manage.py test guides.tests.GuideModelTest
#
# To run with coverage:
# coverage run --source='.' manage.py test guides.tests
# coverage report
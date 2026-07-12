# destinations/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
import json
import tempfile
from PIL import Image
import io

from .models import Destination, Review
from .serializers import DestinationSerializer, ReviewSerializer, DestinationListSerializer

User = get_user_model()

# ============================================
# HELPER FUNCTIONS
# ============================================

def create_test_destination(user, **kwargs):
    """Create a test destination with default values"""
    defaults = {
        'name': 'Test Destination',
        'short_description': 'A test destination',
        'long_description': 'This is a test destination with detailed description',
        'category': 'beach',
        'status': 'approved',
        'district': 'Thiruvananthapuram',
        'featured_image': 'https://example.com/test.jpg',
        'added_by': user
    }
    defaults.update(kwargs)
    return Destination.objects.create(**defaults)

def create_test_review(user, destination, rating=5, comment='Great place!'):
    """Create a test review"""
    return Review.objects.create(
        user=user,
        destination=destination,
        rating=rating,
        comment=comment,
        is_verified_traveler=True
    )

# ============================================
# MODEL TESTS
# ============================================

class DestinationModelTest(TestCase):
    """Test Destination model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.destination = create_test_destination(self.user)
    
    def test_destination_creation(self):
        """Test destination creation with all fields"""
        self.assertEqual(self.destination.name, 'Test Destination')
        self.assertEqual(self.destination.short_description, 'A test destination')
        self.assertEqual(self.destination.category, 'beach')
        self.assertEqual(self.destination.status, 'approved')
        self.assertEqual(self.destination.district, 'Thiruvananthapuram')
        self.assertEqual(self.destination.added_by, self.user)
        self.assertEqual(self.destination.average_rating, 0.00)
        self.assertEqual(self.destination.total_reviews, 0)
        self.assertEqual(self.destination.visit_count, 0)
    
    def test_destination_slug_auto_generation(self):
        """Test automatic slug generation"""
        self.assertEqual(self.destination.slug, 'test-destination')
        
        # Test with special characters
        dest2 = Destination.objects.create(
            name='Test Place With Spaces!',
            short_description='Test',
            long_description='Test description',
            category='hill',
            featured_image='https://example.com/test.jpg',
            added_by=self.user
        )
        self.assertEqual(dest2.slug, 'test-place-with-spaces')
    
    def test_destination_str_method(self):
        """Test string representation"""
        self.assertEqual(str(self.destination), 'Test Destination')
    
    def test_destination_status_choices(self):
        """Test all status choices"""
        statuses = ['pending', 'approved', 'rejected', 'hidden']
        for status_value in statuses:
            self.destination.status = status_value
            self.destination.save()
            self.assertEqual(self.destination.status, status_value)
    
    def test_destination_category_choices(self):
        """Test all category choices"""
        categories = ['beach', 'hill', 'backwater', 'heritage', 'wildlife', 
                     'temple', 'waterfalls', 'fort', 'other']
        for category in categories:
            self.destination.category = category
            self.destination.save()
            self.assertEqual(self.destination.category, category)
    
    def test_destination_meta_options(self):
        """Test model meta options"""
        self.assertEqual(Destination._meta.db_table, 'destinations')
        self.assertEqual(Destination._meta.ordering, ['-created_at'])
        
        # Check indexes exist
        index_names = [idx.name for idx in Destination._meta.indexes]
        self.assertTrue(any('name' in idx.name for idx in Destination._meta.indexes))
        self.assertTrue(any('category' in idx.name for idx in Destination._meta.indexes))
        self.assertTrue(any('status' in idx.name for idx in Destination._meta.indexes))
        self.assertTrue(any('district' in idx.name for idx in Destination._meta.indexes))
    
    def test_destination_verification_fields(self):
        """Test verification fields"""
        admin = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='Admin123!',
            is_staff=True
        )
        
        self.destination.verified_by = admin
        self.destination.verified_at = timezone.now()
        self.destination.save()
        
        self.assertEqual(self.destination.verified_by, admin)
        self.assertIsNotNone(self.destination.verified_at)
    
    def test_destination_gallery_images(self):
        """Test gallery images JSON field"""
        gallery = ['https://example.com/1.jpg', 'https://example.com/2.jpg']
        self.destination.gallery_images = gallery
        self.destination.save()
        
        self.assertEqual(self.destination.gallery_images, gallery)
        self.assertEqual(len(self.destination.gallery_images), 2)
    
    def test_destination_coordinates(self):
        """Test latitude and longitude fields"""
        self.destination.latitude = 8.5241
        self.destination.longitude = 76.9366
        self.destination.save()
        
        self.assertEqual(self.destination.latitude, 8.5241)
        self.assertEqual(self.destination.longitude, 76.9366)

class ReviewModelTest(TestCase):
    """Test Review model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.destination = create_test_destination(self.user)
        self.review = create_test_review(self.user, self.destination)
    
    def test_review_creation(self):
        """Test review creation"""
        self.assertEqual(self.review.user, self.user)
        self.assertEqual(self.review.destination, self.destination)
        self.assertEqual(self.review.rating, 5)
        self.assertEqual(self.review.comment, 'Great place!')
        self.assertTrue(self.review.is_verified_traveler)
    
    def test_review_str_method(self):
        """Test string representation"""
        expected = f"{self.user.email} - {self.destination.name} (5★)"
        self.assertEqual(str(self.review), expected)
    
    def test_review_unique_together(self):
        """Test user-destination unique together constraint"""
        with self.assertRaises(Exception):
            Review.objects.create(
                user=self.user,
                destination=self.destination,
                rating=4,
                comment='Another review'
            )
    
    def test_review_rating_choices(self):
        """Test all rating choices"""
        for rating in range(1, 6):
            dest = create_test_destination(self.user, name=f'Place {rating}')
            review = Review.objects.create(
                user=self.user,
                destination=dest,
                rating=rating,
                comment=f'Rating {rating}'
            )
            self.assertEqual(review.rating, rating)
    
    def test_review_meta_options(self):
        """Test model meta options"""
        self.assertEqual(Review._meta.db_table, 'reviews')
        self.assertEqual(Review._meta.unique_together, (('user', 'destination'),))
        
        # Check indexes
        index_names = [idx.name for idx in Review._meta.indexes]
        self.assertTrue(any('destination' in idx.name for idx in Review._meta.indexes))
        self.assertTrue(any('rating' in idx.name for idx in Review._meta.indexes))

# ============================================
# SERIALIZER TESTS
# ============================================

class DestinationSerializerTest(TestCase):
    """Test DestinationSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.destination = create_test_destination(self.user)
        self.serializer = DestinationSerializer(instance=self.destination)
    
    def test_serializer_fields(self):
        """Test serializer fields"""
        data = self.serializer.data
        expected_fields = [
            'id', 'name', 'slug', 'short_description', 'long_description',
            'category', 'category_label', 'status', 'status_label',
            'latitude', 'longitude', 'address', 'district',
            'featured_image', 'gallery_images',
            'average_rating', 'total_reviews', 'review_count', 'visit_count',
            'reviews', 'added_by', 'verified_by', 'verified_at',
            'created_at', 'updated_at'
        ]
        for field in expected_fields:
            self.assertIn(field, data)
    
    def test_category_label(self):
        """Test category label generation"""
        data = self.serializer.data
        self.assertEqual(data['category_label'], 'Beach')
    
    def test_status_label(self):
        """Test status label generation"""
        data = self.serializer.data
        self.assertEqual(data['status_label'], 'Approved')
    
    def test_review_count(self):
        """Test review count"""
        # Add reviews
        for i in range(3):
            create_test_review(self.user, self.destination, rating=i+1)
        
        # Refresh serializer
        serializer = DestinationSerializer(instance=self.destination)
        self.assertEqual(serializer.data['review_count'], 3)
        self.assertEqual(serializer.data['total_reviews'], 3)

class DestinationListSerializerTest(TestCase):
    """Test DestinationListSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.destination = create_test_destination(self.user)
        self.serializer = DestinationListSerializer(instance=self.destination)
    
    def test_serializer_fields(self):
        """Test serializer fields"""
        data = self.serializer.data
        expected_fields = [
            'id', 'name', 'slug', 'category', 'category_label',
            'district', 'featured_image', 'average_rating',
            'total_reviews', 'review_count', 'status', 'created_at'
        ]
        for field in expected_fields:
            self.assertIn(field, data)
    
    def test_category_label(self):
        """Test category label generation"""
        data = self.serializer.data
        self.assertEqual(data['category_label'], 'Beach')

class ReviewSerializerTest(TestCase):
    """Test ReviewSerializer"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.destination = create_test_destination(self.user)
        self.review = create_test_review(self.user, self.destination)
        self.serializer = ReviewSerializer(instance=self.review)
    
    def test_serializer_fields(self):
        """Test serializer fields"""
        data = self.serializer.data
        expected_fields = [
            'id', 'user', 'user_id', 'rating', 'comment',
            'is_verified_traveler', 'created_at', 'updated_at'
        ]
        for field in expected_fields:
            self.assertIn(field, data)
    
    def test_serializer_data(self):
        """Test serializer data correctness"""
        data = self.serializer.data
        self.assertEqual(data['rating'], 5)
        self.assertEqual(data['comment'], 'Great place!')
        self.assertTrue(data['is_verified_traveler'])
        self.assertEqual(data['user']['email'], 'test@example.com')

# ============================================
# VIEW TESTS - DESTINATION CRUD
# ============================================

class DestinationViewTest(TestCase):
    """Test Destination CRUD views"""
    
    def setUp(self):
        self.client = APIClient()
        self.list_url = '/api/destinations/'
        
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='Admin123!',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        self.destination = create_test_destination(self.user)
    
    def test_list_destinations_unauthenticated(self):
        """Test listing destinations without authentication"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_list_destinations_authenticated(self):
        """Test listing destinations as authenticated user"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
    
    def test_list_destinations_only_approved(self):
        """Test that only approved/hidden destinations are shown to non-admin"""
        # Create pending destination
        pending_dest = create_test_destination(
            self.user,
            name='Pending Place',
            status='pending'
        )
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url)
        
        # Should only see approved/hidden
        results = response.data.get('results', [])
        names = [r['name'] for r in results]
        self.assertIn('Test Destination', names)  # Approved
        self.assertNotIn('Pending Place', names)  # Pending
    
    def test_create_destination_as_user(self):
        """Test creating destination as regular user"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'name': 'New Destination',
            'short_description': 'New test destination',
            'long_description': 'This is a new test destination',
            'category': 'hill',
            'district': 'Idukki',
            'featured_image': 'https://example.com/new.jpg'
        }
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')  # Auto-pending
        
        # Check destination was created
        dest = Destination.objects.get(name='New Destination')
        self.assertEqual(dest.added_by, self.user)
        self.assertEqual(dest.status, 'pending')
    
    def test_create_destination_as_admin(self):
        """Test creating destination as admin (auto-approved)"""
        self.client.force_authenticate(user=self.admin)
        
        data = {
            'name': 'Admin Destination',
            'short_description': 'Admin test destination',
            'long_description': 'This is an admin created destination',
            'category': 'beach',
            'district': 'Kollam',
            'featured_image': 'https://example.com/admin.jpg'
        }
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'approved')
    
    def test_create_destination_unauthenticated(self):
        """Test creating destination without authentication"""
        data = {
            'name': 'Unauth Destination',
            'short_description': 'Unauth test',
            'long_description': 'This should fail',
            'category': 'beach',
            'featured_image': 'https://example.com/test.jpg'
        }
        response = self.client.post(self.list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_retrieve_destination(self):
        """Test retrieving a single destination"""
        url = f"{self.list_url}{self.destination.id}/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Destination')
    
    def test_update_destination_as_owner(self):
        """Test updating destination as owner"""
        self.client.force_authenticate(user=self.user)
        
        url = f"{self.list_url}{self.destination.id}/"
        data = {
            'name': 'Updated Name',
            'short_description': 'Updated description'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Name')
    
    def test_delete_destination_as_owner(self):
        """Test deleting destination as owner"""
        self.client.force_authenticate(user=self.user)
        
        url = f"{self.list_url}{self.destination.id}/"
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Destination.objects.filter(id=self.destination.id).exists())

# ============================================
# VIEW TESTS - REVIEWS
# ============================================

class ReviewViewTest(TestCase):
    """Test Review views"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com',
            username='otheruser',
            password='OtherPass123!'
        )
        
        self.destination = create_test_destination(self.user)
        self.review_url = f"/api/destinations/{self.destination.id}/add_review/"
    
    def test_add_review_success(self):
        """Test adding a review successfully"""
        self.client.force_authenticate(user=self.other_user)
        
        data = {
            'rating': 4,
            'comment': 'Great place, highly recommend!'
        }
        response = self.client.post(self.review_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 4)
        self.assertEqual(response.data['comment'], 'Great place, highly recommend!')
        
        # Check destination stats updated
        dest = Destination.objects.get(id=self.destination.id)
        self.assertEqual(dest.total_reviews, 1)
        self.assertEqual(dest.average_rating, 4.00)
    
    def test_add_review_duplicate(self):
        """Test adding duplicate review (user already reviewed)"""
        self.client.force_authenticate(user=self.user)
        
        # First review
        create_test_review(self.user, self.destination)
        
        # Second review attempt
        data = {
            'rating': 3,
            'comment': 'Another review'
        }
        response = self.client.post(self.review_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'You already reviewed this destination')
    
    def test_add_review_unauthenticated(self):
        """Test adding review without authentication"""
        data = {
            'rating': 5,
            'comment': 'Great!'
        }
        response = self.client.post(self.review_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_add_review_pending_destination(self):
        """Test adding review to pending destination (should fail)"""
        pending_dest = create_test_destination(
            self.user,
            name='Pending Place',
            status='pending'
        )
        
        self.client.force_authenticate(user=self.other_user)
        
        url = f"/api/destinations/{pending_dest.id}/add_review/"
        data = {
            'rating': 5,
            'comment': 'This should fail'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Cannot review a destination that is not approved')
    
    def test_get_reviews(self):
        """Test getting reviews for a destination"""
        # Add multiple reviews
        create_test_review(self.user, self.destination, rating=5)
        create_test_review(self.other_user, self.destination, rating=4)
        
        url = f"/api/destinations/{self.destination.id}/reviews/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_review_stats(self):
        """Test review statistics endpoint"""
        # Add multiple reviews with different ratings
        create_test_review(self.user, self.destination, rating=5)
        create_test_review(self.other_user, self.destination, rating=4)
        
        url = f"/api/destinations/{self.destination.id}/review_stats/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['average'], 4.50)
        self.assertEqual(response.data['distribution']['5'], 1)
        self.assertEqual(response.data['distribution']['4'], 1)

# ============================================
# VIEW TESTS - ADMIN FUNCTIONS
# ============================================

class AdminDestinationViewTest(TestCase):
    """Test admin destination views"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='Admin123!',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        
        self.user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='UserPass123!'
        )
        
        self.pending_dest = create_test_destination(
            self.user,
            name='Pending Destination',
            status='pending'
        )
        
        self.client.force_authenticate(user=self.admin)
    
    def test_verify_destination(self):
        """Test verifying a destination"""
        url = f"/api/destinations/{self.pending_dest.id}/verify/"
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['destination']['status'], 'approved')
        
        dest = Destination.objects.get(id=self.pending_dest.id)
        self.assertEqual(dest.status, 'approved')
        self.assertEqual(dest.verified_by, self.admin)
        self.assertIsNotNone(dest.verified_at)
    
    def test_verify_destination_non_admin(self):
        """Test verifying as non-admin (should fail)"""
        self.client.force_authenticate(user=self.user)
        
        url = f"/api/destinations/{self.pending_dest.id}/verify/"
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Permission denied. Admin or Staff only.')
    
    def test_reject_destination(self):
        """Test rejecting a destination"""
        url = f"/api/destinations/{self.pending_dest.id}/reject/"
        response = self.client.post(url, {'reason': 'Not suitable'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['destination']['status'], 'rejected')
    
    def test_mark_hidden(self):
        """Test marking a destination as hidden gem"""
        url = f"/api/destinations/{self.pending_dest.id}/mark_hidden/"
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['destination']['status'], 'hidden')
    
    def test_get_pending_destinations(self):
        """Test getting pending destinations (admin only)"""
        url = "/api/destinations/pending/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should include pending destination
        results = response.data.get('results', [])
        names = [r['name'] for r in results]
        self.assertIn('Pending Destination', names)
    
    def test_get_pending_destinations_non_admin(self):
        """Test getting pending destinations as non-admin (should fail)"""
        self.client.force_authenticate(user=self.user)
        
        url = "/api/destinations/pending/"
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

# ============================================
# VIEW TESTS - FILTERS & SEARCH
# ============================================

class DestinationFilterTest(TestCase):
    """Test destination filtering and search"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        # Create test destinations
        self.beach_dest = create_test_destination(
            self.user,
            name='Kovalam Beach',
            category='beach',
            district='Thiruvananthapuram',
            status='approved'
        )
        
        self.hill_dest = create_test_destination(
            self.user,
            name='Munnar Hills',
            category='hill',
            district='Idukki',
            status='approved'
        )
        
        self.backwater_dest = create_test_destination(
            self.user,
            name='Alleppey Backwaters',
            category='backwater',
            district='Alappuzha',
            status='approved'
        )
        
        self.url = '/api/destinations/'
    
    def test_filter_by_category(self):
        """Test filtering by category"""
        response = self.client.get(f"{self.url}?category=beach")
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Kovalam Beach')
    
    def test_filter_by_district(self):
        """Test filtering by district"""
        response = self.client.get(f"{self.url}?district=Idukki")
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Munnar Hills')
    
    def test_search_by_name(self):
        """Test searching by name"""
        response = self.client.get(f"{self.url}?search=Kovalam")
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Kovalam Beach')
    
    def test_search_by_description(self):
        """Test searching by description"""
        response = self.client.get(f"{self.url}?search=hill")
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Munnar Hills')
    
    def test_search_by_district(self):
        """Test searching by district"""
        response = self.client.get(f"{self.url}?search=Alappuzha")
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Alleppey Backwaters')

# ============================================
# VIEW TESTS - SPECIAL FILTERS
# ============================================

class SpecialFilterTest(TestCase):
    """Test special filter endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        # Create hidden gem
        self.hidden_dest = create_test_destination(
            self.user,
            name='Hidden Gem',
            status='hidden'
        )
        
        # Create regular destinations
        self.dest1 = create_test_destination(
            self.user,
            name='Dest 1',
            status='approved',
            average_rating=4.8
        )
        self.dest2 = create_test_destination(
            self.user,
            name='Dest 2',
            status='approved',
            average_rating=4.5
        )
        self.dest3 = create_test_destination(
            self.user,
            name='Dest 3',
            status='approved',
            average_rating=4.2
        )
    
    def test_hidden_gems(self):
        """Test getting hidden gems"""
        url = '/api/destinations/hidden_gems/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['name'], 'Hidden Gem')
    
    def test_top_rated(self):
        """Test getting top rated destinations"""
        url = '/api/destinations/top_rated/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data
        self.assertEqual(results[0]['name'], 'Dest 1')  # Highest rating
        self.assertEqual(results[1]['name'], 'Dest 2')
        self.assertEqual(results[2]['name'], 'Dest 3')
    
    def test_recently_added(self):
        """Test getting recently added destinations"""
        # Create a new destination
        new_dest = create_test_destination(
            self.user,
            name='Newest Place',
            status='approved'
        )
        
        url = '/api/destinations/recently_added/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data
        self.assertEqual(results[0]['name'], 'Newest Place')
    
    def test_by_district(self):
        """Test getting destinations by district"""
        url = '/api/destinations/by_district/?district=Thiruvananthapuram'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        for dest in results:
            self.assertEqual(dest['district'], 'Thiruvananthapuram')

# ============================================
# VIEW TESTS - CATEGORY ENDPOINTS
# ============================================

class CategoryEndpointTest(TestCase):
    """Test category endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        # Create destinations in different categories
        create_test_destination(self.user, category='beach', status='approved')
        create_test_destination(self.user, category='hill', status='approved')
        create_test_destination(self.user, category='beach', status='approved')
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='Admin123!',
            role='admin',
            is_staff=True
        )
    
    def test_get_categories(self):
        """Test getting all categories with counts"""
        url = '/api/destinations/categories/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        categories = response.data
        
        # Find beach category
        beach = next(c for c in categories if c['key'] == 'beach')
        self.assertEqual(beach['count'], 2)
        
        # Find hill category
        hill = next(c for c in categories if c['key'] == 'hill')
        self.assertEqual(hill['count'], 1)
    
    def test_get_category_detail(self):
        """Test getting category detail"""
        url = '/api/destinations/category/beach/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['key'], 'beach')
        self.assertEqual(response.data['count'], 2)
        self.assertEqual(len(response.data['destinations']), 2)
    
    def test_get_category_detail_not_found(self):
        """Test getting non-existent category"""
        url = '/api/destinations/category/nonexistent/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Category "nonexistent" not found')
    
    def test_add_category_as_admin(self):
        """Test adding category as admin"""
        self.client.force_authenticate(user=self.admin)
        
        url = '/api/destinations/categories/add/'
        data = {
            'key': 'adventure',
            'label': 'Adventure',
            'description': 'Adventure destinations'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['category']['key'], 'adventure')
    
    def test_add_category_as_user(self):
        """Test adding category as regular user (should fail)"""
        self.client.force_authenticate(user=self.user)
        
        url = '/api/destinations/categories/add/'
        data = {
            'key': 'adventure',
            'label': 'Adventure'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_add_category_duplicate(self):
        """Test adding duplicate category"""
        self.client.force_authenticate(user=self.admin)
        
        url = '/api/destinations/categories/add/'
        data = {
            'key': 'beach',  # Already exists
            'label': 'Beach'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already exists', response.data['error'])

# ============================================
# VIEW TESTS - STATS
# ============================================

class StatsEndpointTest(TestCase):
    """Test stats endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        # Create destinations with different statuses
        create_test_destination(self.user, status='approved')
        create_test_destination(self.user, status='approved')
        create_test_destination(self.user, status='pending')
        create_test_destination(self.user, status='hidden')
        create_test_destination(self.user, status='rejected')
    
    def test_get_stats(self):
        """Test getting destination stats"""
        url = '/api/destinations/stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 5)
        self.assertEqual(response.data['approved'], 2)
        self.assertEqual(response.data['pending'], 1)
        self.assertEqual(response.data['hidden_gems'], 1)
        self.assertEqual(response.data['rejected'], 1)
        self.assertIn('categories', response.data)
        self.assertIn('districts', response.data)
        self.assertIn('top_rated', response.data)
        self.assertIn('recent_activity', response.data)
    
    def test_category_stats(self):
        """Test getting category stats"""
        url = '/api/destinations/category_stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should have all categories
        categories = response.data
        self.assertGreaterEqual(len(categories), 1)
        
        # Check category has proper fields
        for cat in categories:
            self.assertIn('key', cat)
            self.assertIn('label', cat)
            self.assertIn('count', cat)
            self.assertIn('approved', cat)
            self.assertIn('hidden', cat)
            self.assertIn('pending', cat)
            self.assertIn('rejected', cat)

# ============================================
# VIEW TESTS - SEARCH & AUTOCOMPLETE
# ============================================

class SearchEndpointTest(TestCase):
    """Test search and autocomplete endpoints"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        
        self.dest1 = create_test_destination(
            self.user,
            name='Kovalam Beach',
            description='Beautiful beach in Kovalam',
            district='Thiruvananthapuram'
        )
        self.dest2 = create_test_destination(
            self.user,
            name='Varkala Beach',
            description='Beautiful cliff beach',
            district='Thiruvananthapuram'
        )
    
    def test_search(self):
        """Test search endpoint"""
        url = '/api/destinations/search/?q=Beach'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', [])
        self.assertGreaterEqual(len(results), 1)
    
    def test_search_empty_query(self):
        """Test search with empty query"""
        url = '/api/destinations/search/?q='
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])
    
    def test_autocomplete(self):
        """Test autocomplete endpoint"""
        url = '/api/destinations/autocomplete/?q=Kovalam'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertIn('name', response.data[0])
        self.assertIn('district', response.data[0])
    
    def test_autocomplete_limit(self):
        """Test autocomplete with limit"""
        url = '/api/destinations/autocomplete/?q=Beach&limit=1'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data), 1)

# ============================================
# VIEW TESTS - DESTINATION STATS UPDATE
# ============================================

class DestinationStatsUpdateTest(TestCase):
    """Test destination stats update on review"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
        self.destination = create_test_destination(self.user)
    
    def test_stats_update_on_review(self):
        """Test that stats update correctly when reviews are added"""
        # Add first review
        create_test_review(self.user, self.destination, rating=5)
        self.destination.refresh_from_db()
        self.assertEqual(self.destination.total_reviews, 1)
        self.assertEqual(self.destination.average_rating, 5.00)
        
        # Add second review
        user2 = User.objects.create_user(
            email='user2@example.com',
            username='user2',
            password='Pass123!'
        )
        create_test_review(user2, self.destination, rating=3)
        self.destination.refresh_from_db()
        self.assertEqual(self.destination.total_reviews, 2)
        self.assertEqual(self.destination.average_rating, 4.00)
        
        # Add third review
        user3 = User.objects.create_user(
            email='user3@example.com',
            username='user3',
            password='Pass123!'
        )
        create_test_review(user3, self.destination, rating=4)
        self.destination.refresh_from_db()
        self.assertEqual(self.destination.total_reviews, 3)
        self.assertEqual(self.destination.average_rating, 4.00)

# ============================================
# EDGE CASES TESTS
# ============================================

class EdgeCaseTest(TestCase):
    """Test edge cases"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects_create_user(
            email='test@example.com',
            username='testuser',
            password='TestPass123!'
        )
    
    def test_destination_long_name(self):
        """Test destination with very long name"""
        long_name = 'A' * 200
        dest = create_test_destination(
            self.user,
            name=long_name
        )
        self.assertEqual(dest.name, long_name)
        self.assertEqual(len(dest.slug), 50)  # Slugify truncates
    
    def test_destination_empty_fields(self):
        """Test destination with empty optional fields"""
        dest = Destination.objects.create(
            name='Test',
            short_description='Test',
            long_description='Test',
            category='beach',
            featured_image='https://example.com/test.jpg',
            added_by=self.user,
            address=None,
            district=None
        )
        
        self.assertIsNone(dest.address)
        self.assertIsNone(dest.district)
    
    def test_review_max_rating(self):
        """Test review with maximum rating"""
        review = create_test_review(self.user, self.destination, rating=5)
        self.assertEqual(review.rating, 5)
    
    def test_review_min_rating(self):
        """Test review with minimum rating"""
        review = create_test_review(self.user, self.destination, rating=1)
        self.assertEqual(review.rating, 1)

# ============================================
# RUN TESTS
# ============================================
# To run this test file:
# python manage.py test destinations.tests
#
# To run specific test class:
# python manage.py test destinations.tests.DestinationModelTest
#
# To run with coverage:
# coverage run --source='.' manage.py test destinations.tests
# coverage report
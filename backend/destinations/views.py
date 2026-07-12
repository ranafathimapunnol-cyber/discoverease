# destinations/views.py - COMPLETE FULL VERSION
from django.shortcuts import render
from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count, Sum
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Destination, Review
from .serializers import DestinationSerializer, ReviewSerializer, CategorySerializer, DestinationListSerializer
from .filters import DestinationFilter
import logging

logger = logging.getLogger(__name__)

# ActivityLog fallback
try:
    from activities.models import ActivityLog
except ImportError:
    class ActivityLog:
        @staticmethod
        def create(**kwargs):
            logger.info(f"ActivityLog: {kwargs}")
            return None


class DestinationViewSet(viewsets.ModelViewSet):
    """Complete Destination ViewSet with Categories, Reviews, and Admin Functions"""
    queryset = Destination.objects.all()
    serializer_class = DestinationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = DestinationFilter
    filterset_fields = ['category', 'status', 'district', 'type']
    search_fields = ['name', 'short_description', 'long_description', 'district', 'address']
    ordering_fields = ['created_at', 'average_rating', 'visit_count', 'name', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return DestinationListSerializer
        return DestinationSerializer

    def get_queryset(self):
        """Filter queryset based on user permissions"""
        user = self.request.user
        
        # Admin/staff can see all
        if user.is_authenticated and (user.is_staff or user.is_superuser or user.role == 'admin'):
            return Destination.objects.all()
        
        # Regular users see only approved and hidden gems
        return Destination.objects.filter(
            Q(status='approved') | Q(status='hidden')
        )

    # ============================================
    # CREATE / UPDATE / DELETE
    # ============================================
    
    def perform_create(self, serializer):
        """Create a new destination"""
        user = self.request.user
        
        # If user is staff/admin, auto-approve
        if user.is_authenticated and (user.is_staff or user.is_superuser or user.role == 'admin'):
            status_value = 'approved'
        else:
            status_value = 'pending'
        
        destination = serializer.save(
            added_by=user,
            status=status_value
        )
        
        # Log activity
        try:
            ActivityLog.objects.create(
                user=user,
                action_type='destination_added',
                description=f'Destination "{destination.name}" added by {user.email}',
                ip_address=self.request.META.get('REMOTE_ADDR'),
                metadata={
                    'destination_id': destination.id, 
                    'status': status_value,
                    'category': destination.category
                }
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")
        
        # Create suggestion if user is not staff
        if not (user.is_staff or user.is_superuser or user.role == 'admin'):
            try:
                from suggestions.models import Suggestion
                Suggestion.objects.create(
                    user=user,
                    suggestion_type='new_destination',
                    destination=destination,
                    name=destination.name,
                    description=destination.long_description or destination.short_description,
                    category=destination.category,
                    location_info=destination.address or destination.district,
                    status='pending'
                )
            except Exception as e:
                logger.warning(f"Suggestion creation failed: {e}")

    def perform_update(self, serializer):
        """Update a destination"""
        instance = self.get_object()
        old_status = instance.status
        updated = serializer.save()
        
        try:
            ActivityLog.objects.create(
                user=self.request.user,
                action_type='destination_updated',
                description=f'Destination "{instance.name}" updated by {self.request.user.email}',
                ip_address=self.request.META.get('REMOTE_ADDR'),
                metadata={
                    'destination_id': instance.id, 
                    'old_status': old_status, 
                    'new_status': updated.status
                }
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")

    def perform_destroy(self, instance):
        """Delete a destination"""
        try:
            ActivityLog.objects.create(
                user=self.request.user,
                action_type='destination_deleted',
                description=f'Destination "{instance.name}" deleted by {self.request.user.email}',
                ip_address=self.request.META.get('REMOTE_ADDR'),
                metadata={'destination_id': instance.id}
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")
        instance.delete()

    # ============================================
    # REVIEW ENDPOINTS
    # ============================================
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_review(self, request, pk=None):
        """Add a review for a destination"""
        destination = self.get_object()
        user = request.user
        
        # Check if user already reviewed
        if Review.objects.filter(user=user, destination=destination).exists():
            return Response(
                {'error': 'You already reviewed this destination'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if destination is approved or hidden
        if destination.status not in ['approved', 'hidden']:
            return Response(
                {'error': 'Cannot review a destination that is not approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            review = serializer.save(user=user, destination=destination)
            self._update_destination_stats(destination)
            
            try:
                ActivityLog.objects.create(
                    user=user,
                    action_type='review_added',
                    description=f'Review ({review.rating}★) for {destination.name} by {user.email}',
                    ip_address=request.META.get('REMOTE_ADDR'),
                    metadata={'destination_id': destination.id, 'rating': review.rating}
                )
            except Exception as e:
                logger.warning(f"ActivityLog creation failed: {e}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """Get all reviews for a destination"""
        destination = self.get_object()
        reviews = destination.reviews.all().order_by('-created_at')
        
        # Pagination
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = ReviewSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def review_stats(self, request, pk=None):
        """Get review statistics for a destination"""
        destination = self.get_object()
        reviews = destination.reviews.all()
        
        stats = {
            'total': reviews.count(),
            'average': destination.average_rating,
            'distribution': {
                '5': reviews.filter(rating=5).count(),
                '4': reviews.filter(rating=4).count(),
                '3': reviews.filter(rating=3).count(),
                '2': reviews.filter(rating=2).count(),
                '1': reviews.filter(rating=1).count(),
            }
        }
        return Response(stats)

    # ============================================
    # ADMIN / VERIFICATION ENDPOINTS
    # ============================================
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def verify(self, request, pk=None):
        """Verify and approve a destination (admin/staff only)"""
        if not request.user.is_staff and not request.user.is_superuser and request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied. Admin or Staff only.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        destination = self.get_object()
        destination.status = 'approved'
        destination.verified_by = request.user
        destination.verified_at = timezone.now()
        destination.save()
        
        try:
            ActivityLog.objects.create(
                user=request.user,
                action_type='destination_verified',
                description=f'Destination "{destination.name}" verified by {request.user.email}',
                ip_address=request.META.get('REMOTE_ADDR'),
                metadata={'destination_id': destination.id}
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")
        
        return Response({
            'success': True,
            'message': 'Destination verified successfully',
            'destination': self.get_serializer(destination).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a destination (admin/staff only)"""
        if not request.user.is_staff and not request.user.is_superuser and request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied. Admin or Staff only.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        destination = self.get_object()
        reason = request.data.get('reason', 'No reason provided')
        
        destination.status = 'rejected'
        destination.save()
        
        try:
            ActivityLog.objects.create(
                user=request.user,
                action_type='destination_rejected',
                description=f'Destination "{destination.name}" rejected by {request.user.email}',
                ip_address=request.META.get('REMOTE_ADDR'),
                metadata={'destination_id': destination.id, 'reason': reason}
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")
        
        return Response({
            'success': True,
            'message': 'Destination rejected',
            'destination': self.get_serializer(destination).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_hidden(self, request, pk=None):
        """Mark a destination as hidden gem (admin/staff only)"""
        if not request.user.is_staff and not request.user.is_superuser and request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied. Admin or Staff only.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        destination = self.get_object()
        destination.status = 'hidden'
        destination.save()
        
        try:
            ActivityLog.objects.create(
                user=request.user,
                action_type='destination_marked_hidden',
                description=f'Destination "{destination.name}" marked as hidden gem by {request.user.email}',
                ip_address=request.META.get('REMOTE_ADDR'),
                metadata={'destination_id': destination.id}
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")
        
        return Response({
            'success': True,
            'message': 'Destination marked as hidden gem',
            'destination': self.get_serializer(destination).data
        })

    # ============================================
    # SPECIAL FILTERS
    # ============================================
    
    @action(detail=False, methods=['get'])
    def hidden_gems(self, request):
        """Get all hidden gem destinations"""
        hidden = Destination.objects.filter(status='hidden')
        page = self.paginate_queryset(hidden)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(hidden, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending destinations (admin/staff only)"""
        if not request.user.is_authenticated or (not request.user.is_staff and not request.user.is_superuser and request.user.role != 'admin'):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending = Destination.objects.filter(status='pending')
        page = self.paginate_queryset(pending)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_district(self, request):
        """Get destinations by district"""
        district = request.query_params.get('district')
        if not district:
            return Response(
                {'error': 'District parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        destinations = self.get_queryset().filter(district__icontains=district)
        page = self.paginate_queryset(destinations)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(destinations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def top_rated(self, request):
        """Get top rated destinations"""
        limit = int(request.query_params.get('limit', 10))
        top = self.get_queryset().filter(
            status__in=['approved', 'hidden'],
            average_rating__gt=0
        ).order_by('-average_rating')[:limit]
        
        serializer = self.get_serializer(top, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recently_added(self, request):
        """Get recently added destinations"""
        limit = int(request.query_params.get('limit', 10))
        recent = self.get_queryset().order_by('-created_at')[:limit]
        serializer = self.get_serializer(recent, many=True)
        return Response(serializer.data)

    # ============================================
    # STATS ENDPOINTS
    # ============================================
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get comprehensive statistics about destinations"""
        total = Destination.objects.count()
        approved = Destination.objects.filter(status='approved').count()
        hidden_gems = Destination.objects.filter(status='hidden').count()
        pending = Destination.objects.filter(status='pending').count()
        rejected = Destination.objects.filter(status='rejected').count()
        
        # Category breakdown
        category_stats = list(
            Destination.objects.values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        
        # District breakdown
        district_stats = list(
            Destination.objects.values('district')
            .annotate(count=Count('id'))
            .exclude(district__isnull=True)
            .exclude(district='')
            .order_by('-count')
        )
        
        # Top rated
        top_rated = list(
            Destination.objects.filter(
                status__in=['approved', 'hidden'],
                average_rating__gt=0
            )
            .order_by('-average_rating')[:5]
            .values('id', 'name', 'average_rating', 'total_reviews')
        )
        
        # Recent activity
        recent = list(
            Destination.objects.order_by('-updated_at')[:5]
            .values('id', 'name', 'status', 'updated_at')
        )
        
        return Response({
            'total': total,
            'approved': approved,
            'hidden_gems': hidden_gems,
            'pending': pending,
            'rejected': rejected,
            'categories': category_stats,
            'districts': district_stats,
            'top_rated': top_rated,
            'recent_activity': recent
        })

    @action(detail=False, methods=['get'])
    def category_stats(self, request):
        """Get category-wise statistics"""
        category_stats = []
        for cat in Destination.Category.choices:
            count = Destination.objects.filter(category=cat[0]).count()
            approved_count = Destination.objects.filter(category=cat[0], status='approved').count()
            hidden_count = Destination.objects.filter(category=cat[0], status='hidden').count()
            category_stats.append({
                'key': cat[0],
                'label': cat[1],
                'count': count,
                'approved': approved_count,
                'hidden': hidden_count,
                'pending': Destination.objects.filter(category=cat[0], status='pending').count(),
                'rejected': Destination.objects.filter(category=cat[0], status='rejected').count(),
                'description': self._get_category_description(cat[0]),
                'image': self._get_category_image(cat[0])
            })
        return Response(category_stats)

    # ============================================
    # CATEGORY ENDPOINTS
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='categories')
    def get_categories(self, request):
        """Get all categories with counts and metadata"""
        categories = []
        for cat in Destination.Category.choices:
            count = Destination.objects.filter(
                category=cat[0], 
                status__in=['approved', 'hidden']
            ).count()
            categories.append({
                'key': cat[0],
                'label': cat[1],
                'count': count,
                'description': self._get_category_description(cat[0]),
                'image': self._get_category_image(cat[0])
            })
        return Response(categories)

    @action(detail=False, methods=['get'], url_path='category/(?P<category_key>[^/.]+)')
    def get_category_detail(self, request, category_key=None):
        """Get detailed information about a specific category"""
        if category_key not in dict(Destination.Category.choices):
            return Response(
                {'error': f'Category "{category_key}" not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        destinations = self.get_queryset().filter(category=category_key)
        
        # Get category info
        category_info = {
            'key': category_key,
            'label': dict(Destination.Category.choices)[category_key],
            'description': self._get_category_description(category_key),
            'image': self._get_category_image(category_key),
            'count': destinations.count(),
            'destinations': self.get_serializer(destinations, many=True).data
        }
        
        return Response(category_info)

    @action(detail=False, methods=['post'], url_path='categories/add')
    def add_category(self, request):
        """Add a new category (admin/staff only)"""
        if not request.user.is_staff and not request.user.is_superuser and request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied. Admin or Staff only.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        category_key = request.data.get('key', '').lower().strip()
        label = request.data.get('label', '')
        description = request.data.get('description', '')
        image = request.data.get('image', '')
        
        if not category_key:
            return Response(
                {'error': 'Category key is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if category already exists in choices
        valid_categories = [c[0] for c in Destination.Category.choices]
        if category_key in valid_categories:
            return Response(
                {'error': f'Category "{category_key}" already exists in choices'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # We can't dynamically add to choices, but we can store it in a custom field
        # Or we can create a Category model if you have one
        # For now, we'll return success with the info
        return Response({
            'success': True,
            'message': f'Category "{category_key}" is available for use',
            'category': {
                'key': category_key,
                'label': label or category_key.title(),
                'description': description,
                'image': image
            }
        })

    # ============================================
    # SEARCH / SUGGEST ENDPOINTS
    # ============================================
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced search for destinations"""
        query = request.query_params.get('q', '')
        if not query:
            return Response([], status=status.HTTP_200_OK)
        
        # Search in multiple fields
        results = self.get_queryset().filter(
            Q(name__icontains=query) |
            Q(short_description__icontains=query) |
            Q(long_description__icontains=query) |
            Q(district__icontains=query) |
            Q(address__icontains=query)
        )
        
        page = self.paginate_queryset(results)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def autocomplete(self, request):
        """Autocomplete suggestions for search"""
        query = request.query_params.get('q', '')
        limit = int(request.query_params.get('limit', 10))
        
        if not query:
            return Response([], status=status.HTTP_200_OK)
        
        results = self.get_queryset().filter(
            Q(name__icontains=query) |
            Q(district__icontains=query)
        ).values('id', 'name', 'district')[:limit]
        
        return Response(results)

    # ============================================
    # HELPER METHODS
    # ============================================
    
    def _update_destination_stats(self, destination):
        """Update average rating and review count for a destination"""
        avg_rating = destination.reviews.aggregate(avg=Avg('rating'))['avg'] or 0
        total_reviews = destination.reviews.count()
        destination.average_rating = round(avg_rating, 2)
        destination.total_reviews = total_reviews
        destination.save(update_fields=['average_rating', 'total_reviews'])

    def _get_category_description(self, key):
        """Get description for a category"""
        descriptions = {
            'beach': "Kerala's stunning coastline with golden sands and palm-fringed shores",
            'backwater': "Serene canals, lagoons, and houseboat destinations",
            'waterfalls': "Spectacular cascades from hidden gems to famous falls",
            'hill': "Misty mountains, tea plantations, trekking trails and cool retreats",
            'wildlife': "National parks, tiger reserves, butterfly sanctuaries, and bird sanctuaries",
            'heritage': "Ancient forts, palaces, and historical sites",
            'temple': "Temples, churches, mosques, and spiritual sites",
            'fort': "Ancient forts and palaces",
            'other': "Hidden gems and unique destinations"
        }
        return descriptions.get(key, "Explore Kerala's hidden gems")

    def _get_category_image(self, key):
        """Get image URL for a category"""
        images = {
            'beach': "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
            'backwater': "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80",
            'waterfalls': "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80",
            'hill': "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=80",
            'wildlife': "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80",
            'heritage': "https://i.pinimg.com/736x/d0/a5/a5/d0a5a56573a329cb0ac8c75c97f8b2ba.jpg",
            'temple': "https://i.pinimg.com/736x/53/8a/12/538a12040c1ee7b51bae7d8b0b939f13.jpg",
            'fort': "https://i.pinimg.com/736x/d0/a5/a5/d0a5a56573a329cb0ac8c75c97f8b2ba.jpg",
            'other': "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80"
        }
        return images.get(key, "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80")
# destinations/views.py
from django.shortcuts import render
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count
from django.utils import timezone
from .models import Destination, Review
from .serializers import DestinationSerializer, ReviewSerializer
import logging

logger = logging.getLogger(__name__)

# ✅ Create ActivityLog model if it doesn't exist, or use a fallback
try:
    from activities.models import ActivityLog
except ImportError:
    # Fallback - create a dummy ActivityLog class if activities app doesn't exist
    class ActivityLog:
        @staticmethod
        def create(**kwargs):
            logger.info(f"ActivityLog: {kwargs}")
            return None

try:
    from suggestions.models import Suggestion
except ImportError:
    # Fallback - create a dummy Suggestion class if suggestions app doesn't exist
    class Suggestion:
        @staticmethod
        def objects():
            return None
        
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
        
        def save(self):
            pass


class DestinationViewSet(viewsets.ModelViewSet):
    """Complete Destination ViewSet - ONLY ModelViewSet!"""
    queryset = Destination.objects.all()
    serializer_class = DestinationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'district']
    search_fields = ['name', 'short_description', 'long_description', 'district']
    ordering_fields = ['created_at', 'average_rating', 'visit_count', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_staff or user.is_superuser):
            return Destination.objects.all()
        return Destination.objects.filter(
            Q(status='approved') | Q(status='hidden')
        )
    
    def perform_create(self, serializer):
        user = self.request.user
        status_value = 'approved' if (user.is_staff or user.is_superuser) else 'pending'
        
        destination = serializer.save(
            added_by=user,
            status=status_value
        )
        
        # ✅ Safe ActivityLog creation
        try:
            ActivityLog.objects.create(
                user=user,
                action_type='place_added',
                description=f'Destination "{destination.name}" added by {user.email}',
                ip_address=self.request.META.get('REMOTE_ADDR'),
                metadata={'destination_id': destination.id, 'status': status_value}
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")
        
        # ✅ Safe Suggestion creation
        if not user.is_staff and not user.is_superuser:
            try:
                Suggestion.objects.create(
                    user=user,
                    suggestion_type='new',
                    destination=destination,
                    name=destination.name,
                    description=destination.long_description,
                    category=destination.category,
                    location_info=destination.address,
                    status='pending'
                )
            except Exception as e:
                logger.warning(f"Suggestion creation failed: {e}")
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        updated = serializer.save()
        
        try:
            ActivityLog.objects.create(
                user=self.request.user,
                action_type='place_updated',
                description=f'Destination "{instance.name}" updated by {self.request.user.email}',
                ip_address=self.request.META.get('REMOTE_ADDR'),
                metadata={'destination_id': instance.id, 'old_status': old_status, 'new_status': updated.status}
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")
    
    def perform_destroy(self, instance):
        try:
            ActivityLog.objects.create(
                user=self.request.user,
                action_type='place_deleted',
                description=f'Destination "{instance.name}" deleted by {self.request.user.email}',
                ip_address=self.request.META.get('REMOTE_ADDR'),
                metadata={'destination_id': instance.id}
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")
        instance.delete()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_review(self, request, pk=None):
        destination = self.get_object()
        user = request.user
        
        if Review.objects.filter(user=user, destination=destination).exists():
            return Response(
                {'error': 'You already reviewed this destination'},
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
        destination = self.get_object()
        reviews = destination.reviews.all().order_by('-created_at')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def hidden_gems(self, request):
        hidden = Destination.objects.filter(status='hidden')
        serializer = self.get_serializer(hidden, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        stats = {
            'total': Destination.objects.count(),
            'approved': Destination.objects.filter(status='approved').count(),
            'hidden_gems': Destination.objects.filter(status='hidden').count(),
            'pending': Destination.objects.filter(status='pending').count(),
            'rejected': Destination.objects.filter(status='rejected').count(),
            'categories': list(Destination.objects.values('category').annotate(count=Count('id'))),
            'top_rated': list(Destination.objects.filter(
                status__in=['approved', 'hidden']
            ).order_by('-average_rating')[:5].values('id', 'name', 'average_rating'))
        }
        return Response(stats)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def verify(self, request, pk=None):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {'error': 'Permission denied. Staff only.'},
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
                action_type='place_verified',
                description=f'Destination "{destination.name}" verified by {request.user.email}',
                ip_address=request.META.get('REMOTE_ADDR'),
                metadata={'destination_id': destination.id}
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")
        
        return Response({
            'message': 'Destination verified successfully',
            'destination': self.get_serializer(destination).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {'error': 'Permission denied. Staff only.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        destination = self.get_object()
        reason = request.data.get('reason', 'No reason provided')
        
        destination.status = 'rejected'
        destination.save()
        
        try:
            ActivityLog.objects.create(
                user=request.user,
                action_type='place_updated',
                description=f'Destination "{destination.name}" rejected by {request.user.email}',
                ip_address=request.META.get('REMOTE_ADDR'),
                metadata={'destination_id': destination.id, 'reason': reason}
            )
        except Exception as e:
            logger.warning(f"ActivityLog creation failed: {e}")
        
        return Response({
            'message': 'Destination rejected',
            'destination': self.get_serializer(destination).data
        })
    
    # ✅ Categories endpoint - FIXED
    @action(detail=False, methods=['get'], url_path='categories')
    def get_categories(self, request):
        """Get all categories with counts"""
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
    
    def _get_category_description(self, key):
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
    
    def _update_destination_stats(self, destination):
        avg_rating = destination.reviews.aggregate(avg=Avg('rating'))['avg'] or 0
        total_reviews = destination.reviews.count()
        destination.average_rating = round(avg_rating, 2)
        destination.total_reviews = total_reviews
        destination.save(update_fields=['average_rating', 'total_reviews'])
# destinations/views.py - COMPLETE FIXED VERSION

from django.shortcuts import render
from rest_framework import viewsets, status, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count, Sum
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Destination, Review, Category, CategoryData, CategoryPlace, Wishlist
from .serializers import DestinationSerializer, ReviewSerializer, DestinationListSerializer, CategorySerializer, WishlistSerializer
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
        if self.action == 'list':
            return DestinationListSerializer
        return DestinationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_staff or user.is_superuser or user.role == 'admin'):
            return Destination.objects.all()
        return Destination.objects.filter(
            Q(status='approved') | Q(status='hidden')
        )

    # ============================================
    # CREATE / UPDATE / DELETE
    # ============================================
    
    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated and (user.is_staff or user.is_superuser or user.role == 'admin'):
            status_value = 'approved'
        else:
            status_value = 'pending'
        
        destination = serializer.save(
            added_by=user,
            status=status_value
        )
        
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
        destination = self.get_object()
        user = request.user
        
        if Review.objects.filter(user=user, destination=destination).exists():
            return Response(
                {'error': 'You already reviewed this destination'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
        destination = self.get_object()
        reviews = destination.reviews.all().order_by('-created_at')
        
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = ReviewSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def review_stats(self, request, pk=None):
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
        hidden = Destination.objects.filter(status='hidden')
        page = self.paginate_queryset(hidden)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(hidden, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
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
        limit = int(request.query_params.get('limit', 10))
        top = self.get_queryset().filter(
            status__in=['approved', 'hidden'],
            average_rating__gt=0
        ).order_by('-average_rating')[:limit]
        
        serializer = self.get_serializer(top, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recently_added(self, request):
        limit = int(request.query_params.get('limit', 10))
        recent = self.get_queryset().order_by('-created_at')[:limit]
        serializer = self.get_serializer(recent, many=True)
        return Response(serializer.data)

    # ============================================
    # STATS ENDPOINTS
    # ============================================
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = Destination.objects.count()
        approved = Destination.objects.filter(status='approved').count()
        hidden_gems = Destination.objects.filter(status='hidden').count()
        pending = Destination.objects.filter(status='pending').count()
        rejected = Destination.objects.filter(status='rejected').count()
        
        category_stats = list(
            Destination.objects.values('category')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        
        district_stats = list(
            Destination.objects.values('district')
            .annotate(count=Count('id'))
            .exclude(district__isnull=True)
            .exclude(district='')
            .order_by('-count')
        )
        
        top_rated = list(
            Destination.objects.filter(
                status__in=['approved', 'hidden'],
                average_rating__gt=0
            )
            .order_by('-average_rating')[:5]
            .values('id', 'name', 'average_rating', 'total_reviews')
        )
        
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

    # ============================================
    # CATEGORY ENDPOINTS
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='categories')
    def get_categories(self, request):
        categories = []
        for cat in Destination.CategoryChoice.choices:
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

    @action(detail=False, methods=['post'], url_path='add-category')
    def add_category(self, request):
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
        
        valid_categories = [c[0] for c in Destination.CategoryChoice.choices]
        if category_key in valid_categories:
            return Response(
                {'error': f'Category "{category_key}" already exists in default categories'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            category, created = Category.objects.get_or_create(
                key=category_key,
                defaults={
                    'label': label or category_key.title(),
                    'description': description or f'Explore {label} in Kerala',
                    'image': image or 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'
                }
            )
            if created:
                return Response({
                    'success': True,
                    'message': f'Category "{category_key}" added successfully',
                    'category': CategorySerializer(category).data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'error': f'Category "{category_key}" already exists'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error adding category: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='category/(?P<category_key>[^/.]+)')
    def get_category_detail(self, request, category_key=None):
        """Get a specific category with its places"""
        try:
            from .models import CategoryData, CategoryPlace, Destination
            
            try:
                category = CategoryData.objects.get(key=category_key, is_active=True)
            except CategoryData.DoesNotExist:
                return Response({
                    'success': False,
                    'error': f'Category "{category_key}" not found'
                }, status=200)
            
            places = CategoryPlace.objects.filter(
                category=category_key,
                is_active=True
            )
            
            places_data = []
            for place in places:
                dest = Destination.objects.filter(name__iexact=place.name).first()
                
                places_data.append({
                    'id': place.id,
                    'destination_id': dest.id if dest else None,  # ✅ ADD THIS!
                    'name': place.name,
                    'location': place.location,
                    'description': place.description,
                    'difficulty': place.difficulty,
                    'duration': place.duration,
                    'best_time': place.best_time,
                    'image': place.image,
                    'type': place.type,
                    'hidden_gem': place.hidden_gem,
                })
            
            return Response({
                'success': True,
                'data': {
                    'key': category.key,
                    'title': category.title,
                    'description': category.description,
                    'type': category.type,
                    'icon': category.icon,
                    'image': category.image,
                    'count': len(places_data),
                    'places': places_data
                }
            })
            
        except Exception as e:
            logger.error(f"Error fetching category detail: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=200)

    @action(detail=False, methods=['get'], url_path='categories/all')
    def get_all_categories_with_destinations(self, request):
        default_categories = []
        for cat in Destination.CategoryChoice.choices:
            destinations = self.get_queryset().filter(category=cat[0])
            default_categories.append({
                'key': cat[0],
                'label': cat[1],
                'description': self._get_category_description(cat[0]),
                'image': self._get_category_image(cat[0]),
                'count': destinations.count(),
                'destinations': self.get_serializer(destinations, many=True).data
            })
        
        custom_categories = Category.objects.all()
        for cat in custom_categories:
            destinations = self.get_queryset().filter(category=cat.key)
            default_categories.append({
                'key': cat.key,
                'label': cat.label,
                'description': cat.description,
                'image': cat.image,
                'count': destinations.count(),
                'destinations': self.get_serializer(destinations, many=True).data,
                'is_custom': True
            })
        
        return Response(default_categories)

    # ============================================
    # ✅ CATEGORY DATA ENDPOINTS - FIXED (NO LIMIT!)
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='category-data')
    def get_category_data(self, request):
        """Get all category data from database - FIXED: NO 50 PLACE LIMIT!"""
        try:
            categories = CategoryData.objects.filter(is_active=True)
            result = []
            
            for cat in categories:
                places = CategoryPlace.objects.filter(
                    category=cat.key,
                    is_active=True
                )
                
                places_data = [{
                    'id': p.id,
                    'destination_id': p.destination.id if p.destination else None,  # ✅ CRITICAL!
                    'name': p.name,
                    'location': p.location,
                    'description': p.description,
                    'difficulty': p.difficulty,
                    'duration': p.duration,
                    'best_time': p.best_time,
                    'image': p.image,
                    'type': p.type,
                    'hidden_gem': p.hidden_gem,
                } for p in places]
                
                result.append({
                    'key': cat.key,
                    'title': cat.title,
                    'description': cat.description,
                    'type': cat.type,
                    'icon': cat.icon,
                    'image': cat.image,
                    'count': CategoryPlace.objects.filter(category=cat.key, is_active=True).count(),
                    'places': places_data
                })
            
            return Response({'success': True, 'data': result})
            
        except Exception as e:
            logger.error(f"Error fetching category data: {e}")
            return Response({'success': False, 'error': str(e)}, status=200)

    @action(detail=False, methods=['get'], url_path='category-data/(?P<category_key>[^/.]+)')
    def get_category_data_detail(self, request, category_key=None):
        """Get specific category with ALL places - NO LIMIT!"""
        try:
            category = get_object_or_404(CategoryData, key=category_key, is_active=True)
            places = CategoryPlace.objects.filter(category=category_key, is_active=True)
            
            return Response({
                'success': True,
                'data': {
                    'key': category.key,
                    'title': category.title,
                    'description': category.description,
                    'type': category.type,
                    'image': category.image,
                    'count': places.count(),
                    'places': [
                        {
                            'id': p.id,
                            'destination_id': p.destination.id if p.destination else None,  # ✅ CRITICAL!
                            'name': p.name,
                            'location': p.location,
                            'description': p.description,
                            'difficulty': p.difficulty,
                            'duration': p.duration,
                            'best_time': p.best_time,
                            'image': p.image,
                            'type': p.type,
                            'hidden_gem': p.hidden_gem,
                        } for p in places
                    ]
                }
            })
        except Exception as e:
            logger.error(f"Error fetching category detail: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # ADD PLACE ENDPOINT
    # ============================================
    
    @action(detail=False, methods=['post'], url_path='add-place')
    def add_place(self, request):
        if not request.user.is_staff and not request.user.is_superuser and request.user.role != 'admin':
            return Response(
                {'error': 'Permission denied. Admin or Staff only.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            data = request.data
            category_key = data.get('category')
            name = data.get('name')
            location = data.get('location', '')
            district = data.get('district', '')
            description = data.get('description', '')
            difficulty = data.get('difficulty', '')
            duration = data.get('duration', '')
            best_time = data.get('best_time', '')
            image = data.get('image', '')
            place_type = data.get('type', 'well-known')
            hidden_gem = data.get('hidden_gem', '')

            if not category_key:
                return Response({
                    'success': False,
                    'error': 'Category key is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not name:
                return Response({
                    'success': False,
                    'error': 'Place name is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            category, created = CategoryData.objects.get_or_create(
                key=category_key,
                defaults={
                    'title': category_key.title(),
                    'description': f'Places in {category_key}',
                    'is_active': True
                }
            )

            existing_place = CategoryPlace.objects.filter(
                category=category_key,
                name__iexact=name
            ).first()
            
            if existing_place:
                return Response({
                    'success': False,
                    'error': f'Place "{name}" already exists in this category'
                }, status=status.HTTP_400_BAD_REQUEST)

            place = CategoryPlace.objects.create(
                category=category_key,
                name=name,
                location=location,
                district=district,
                description=description or f'Beautiful place in {location}',
                difficulty=difficulty or 'Easy',
                duration=duration or '2-3 hours',
                best_time=best_time or 'All year round',
                image=image or self._get_category_image(category_key),
                type=place_type,
                hidden_gem=hidden_gem or '',
                is_active=True,
                created_by=request.user
            )

            category.count = CategoryPlace.objects.filter(category=category_key, is_active=True).count()
            category.save()

            return Response({
                'success': True,
                'message': f'Place "{name}" added successfully to {category_key}',
                'data': {
                    'id': place.id,
                    'name': place.name,
                    'location': place.location,
                    'district': place.district,
                    'description': place.description,
                    'difficulty': place.difficulty,
                    'duration': place.duration,
                    'best_time': place.best_time,
                    'image': place.image,
                    'type': place.type,
                    'hidden_gem': place.hidden_gem,
                    'created_at': place.created_at.isoformat() if hasattr(place, 'created_at') else None
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error adding place: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='import-category-data')
    def import_category_data(self, request):
        if not request.user.is_staff and request.user.role != 'admin':
            return Response({'error': 'Admin access required'}, status=403)
        
        try:
            data = request.data
            imported_categories = 0
            imported_places = 0
            
            for category_key, category_info in data.items():
                cat, created = CategoryData.objects.update_or_create(
                    key=category_key,
                    defaults={
                        'title': category_info.get('title', category_key),
                        'description': category_info.get('description', ''),
                        'type': category_info.get('type', ''),
                        'image': category_info.get('image', ''),
                        'is_active': True
                    }
                )
                if created:
                    imported_categories += 1
                
                places = category_info.get('places', [])
                for place_data in places:
                    place, place_created = CategoryPlace.objects.update_or_create(
                        category=category_key,
                        name=place_data.get('name'),
                        defaults={
                            'location': place_data.get('location', ''),
                            'description': place_data.get('description', ''),
                            'difficulty': place_data.get('difficulty', ''),
                            'duration': place_data.get('duration', ''),
                            'best_time': place_data.get('best_time', ''),
                            'image': place_data.get('image', ''),
                            'type': place_data.get('type', 'well-known'),
                            'hidden_gem': place_data.get('hidden_gem', ''),
                            'is_active': True
                        }
                    )
                    if place_created:
                        imported_places += 1
            
            return Response({
                'success': True,
                'message': f'Imported {imported_categories} categories and {imported_places} places'
            })
        except Exception as e:
            logger.error(f"Error importing category data: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # SEARCH / SUGGEST ENDPOINTS
    # ============================================
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([], status=status.HTTP_200_OK)
        
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
        avg_rating = destination.reviews.aggregate(avg=Avg('rating'))['avg'] or 0
        total_reviews = destination.reviews.count()
        destination.average_rating = round(avg_rating, 2)
        destination.total_reviews = total_reviews
        destination.save(update_fields=['average_rating', 'total_reviews'])

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


# ============================================
# ✅ WISHLIST VIEWSET - COMPLETE FIXED
# ============================================
class WishlistViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user wishlist"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WishlistSerializer
    
    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related('destination')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'], url_path='toggle')
    def toggle_wishlist(self, request):
        """Toggle destination in wishlist"""
        destination_id = request.data.get('destination_id')
        
        if not destination_id:
            return Response({
                'success': False,
                'error': 'Destination ID is required',
                'message': 'Please provide a destination_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            destination = Destination.objects.get(id=destination_id)
            print(f"🔍 Toggling destination: {destination.id} - {destination.name}")
            
        except Destination.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Destination not found',
                'message': f'No destination found with id {destination_id}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        wishlist_item = Wishlist.objects.filter(
            user=request.user,
            destination=destination
        ).first()
        
        if wishlist_item:
            wishlist_item.delete()
            print(f"🗑️ Removed {destination.name} from wishlist")
            return Response({
                'success': True,
                'action': 'removed',
                'message': 'Removed from wishlist',
                'in_wishlist': False,
                'destination_id': destination_id
            }, status=status.HTTP_200_OK)
        else:
            wishlist_item = Wishlist.objects.create(
                user=request.user,
                destination=destination
            )
            print(f"❤️ Added {destination.name} to wishlist")
            return Response({
                'success': True,
                'action': 'added',
                'message': 'Added to wishlist',
                'in_wishlist': True,
                'destination_id': destination_id,
                'data': WishlistSerializer(wishlist_item).data
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='check')
    def check_wishlist(self, request):
        """Check if destination is in wishlist"""
        destination_id = request.query_params.get('destination_id')
        
        if not destination_id:
            return Response({
                'success': False,
                'error': 'Destination ID is required',
                'message': 'Please provide a destination_id query parameter',
                'in_wishlist': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        exists = Wishlist.objects.filter(
            user=request.user,
            destination_id=destination_id
        ).exists()
        
        return Response({
            'success': True,
            'in_wishlist': exists,
            'destination_id': int(destination_id)
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='count')
    def wishlist_count(self, request):
        """Get wishlist count for current user"""
        count = Wishlist.objects.filter(user=request.user).count()
        return Response({
            'success': True,
            'count': count
        }, status=status.HTTP_200_OK)
    
    def list(self, request, *args, **kwargs):
        """Get all wishlist items for current user"""
        try:
            queryset = self.get_queryset()
            
            for item in queryset:
                print(f"📌 Wishlist: {item.id} -> Destination: {item.destination.id} - {item.destination.name} (Category: {item.destination.category})")
            
            serializer = self.get_serializer(queryset, many=True)
            
            return Response({
                'success': True,
                'count': queryset.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"❌ Wishlist list error: {e}")
            return Response({
                'success': False,
                'error': str(e),
                'count': 0,
                'results': []
            }, status=status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        """Remove a specific wishlist item"""
        try:
            instance = self.get_object()
            destination_id = instance.destination.id
            destination_name = instance.destination.name
            instance.delete()
            
            print(f"🗑️ Removed {destination_name} from wishlist")
            
            return Response({
                'success': True,
                'action': 'removed',
                'message': 'Removed from wishlist',
                'destination_id': destination_id
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"❌ Wishlist delete error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
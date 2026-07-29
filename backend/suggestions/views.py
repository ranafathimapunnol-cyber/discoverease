# suggestions/views.py - COMPLETE FIXED VERSION WITH MY_SUGGESTIONS

from rest_framework import viewsets, status, permissions, pagination
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
from django.contrib.auth import get_user_model
import logging
import os

from .models import Suggestion, SuggestionImage, SuggestionNotification
from .serializers import (
    SuggestionSerializer,
    SuggestionCreateSerializer,
    SuggestionListSerializer,
    SuggestionImageSerializer,
    SuggestionNotificationSerializer,
    SuggestionAdminListSerializer
)
from guides.models import Guide

User = get_user_model()
logger = logging.getLogger(__name__)


class StandardResultsSetPagination(pagination.LimitOffsetPagination):
    default_limit = 20
    max_limit = 100


class SuggestionViewSet(viewsets.ModelViewSet):
    """
    Unified viewset for suggestions
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SuggestionCreateSerializer
        elif self.action in ['list', 'my_suggestions', 'implemented', 'by_category']:
            return SuggestionListSerializer
        elif self.action in ['admin_suggestions', 'admin_approve', 'admin_implement', 'admin_reject', 'guide_dashboard', 'staff_approve', 'staff_implement', 'staff_reject']:
            return SuggestionAdminListSerializer
        return SuggestionSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        user = self.request.user
        queryset = Suggestion.objects.select_related('user', 'guide', 'processed_by')
        
        # If admin, staff, or superuser, return ALL suggestions
        if user.is_authenticated and (user.role in ['admin', 'staff'] or user.is_superuser):
            return queryset.order_by('-created_at')
        
        # If not authenticated, only show implemented
        if not user.is_authenticated:
            return queryset.filter(status=Suggestion.Status.IMPLEMENTED)
        
        # For guides, show suggestions in their district
        if hasattr(user, 'role') and user.role == 'guide':
            try:
                guide = Guide.objects.get(user=user)
                guide_districts = list(guide.districts.values_list('name', flat=True))
                if guide_districts:
                    district_filter = Q()
                    for d in guide_districts:
                        district_filter |= Q(district__iexact=d)
                    queryset = queryset.filter(district_filter)
                else:
                    return queryset.none()
            except Guide.DoesNotExist:
                return queryset.none()
        
        # For regular users, show their own suggestions + implemented
        if user.is_authenticated:
            return queryset.filter(
                Q(user=user) | Q(status=Suggestion.Status.IMPLEMENTED)
            ).order_by('-created_at')
        
        return queryset.order_by('-created_at')
    
    # ============================================
    # ✅ LIST
    # ============================================
    
    def list(self, request, *args, **kwargs):
        """List suggestions with proper filtering"""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            # Filter by status if provided
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            
            # Filter by category if provided
            category_filter = request.query_params.get('category')
            if category_filter:
                queryset = queryset.filter(category__iexact=category_filter)
            
            # Filter by type if provided
            type_filter = request.query_params.get('type')
            if type_filter:
                queryset = queryset.filter(suggestion_type=type_filter)
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response({
                    'success': True,
                    'data': serializer.data,
                    'count': queryset.count()
                })
            
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'success': True,
                'data': serializer.data,
                'count': queryset.count()
            })
        except Exception as e:
            logger.error(f"Error in list: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'data': [],
                'count': 0,
                'error': str(e)
            }, status=status.HTTP_200_OK)
    
    # ============================================
    # ✅ CREATE
    # ============================================
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'message': 'Please login to submit'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            data = request.data.copy()
            
            # Set suggestion type if not provided
            if not data.get('suggestion_type'):
                if data.get('type'):
                    data['suggestion_type'] = data.get('type')
                else:
                    data['suggestion_type'] = 'hidden_gem'
            
            serializer = SuggestionCreateSerializer(data=data)
            
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            district = data.get('district')
            guide = None
            if district:
                try:
                    guide = Guide.objects.filter(
                        districts__name__iexact=district
                    ).first()
                except Exception:
                    pass
            
            # If admin/staff is creating, allow setting status
            status_value = 'pending'
            if request.user.role in ['admin', 'staff'] or request.user.is_superuser:
                if data.get('status') in ['pending', 'implemented', 'approved', 'rejected']:
                    status_value = data.get('status')
            
            suggestion = serializer.save(
                user=request.user,
                guide=guide,
                status=status_value
            )
            
            # Handle single image upload
            if 'image' in request.FILES:
                SuggestionImage.objects.create(
                    suggestion=suggestion,
                    image=request.FILES['image'],
                    order=0,
                    is_primary=True
                )
            
            # Handle multiple images
            images = request.FILES.getlist('images')
            if images:
                for idx, img in enumerate(images):
                    SuggestionImage.objects.create(
                        suggestion=suggestion,
                        image=img,
                        order=idx,
                        is_primary=(idx == 0)
                    )
            
            return Response({
                'success': True,
                'message': 'Submitted successfully',
                'data': {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'status': suggestion.status,
                    'created_at': suggestion.created_at,
                    'images_count': suggestion.images.count()
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating suggestion: {e}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ RETRIEVE
    # ============================================
    
    def retrieve(self, request, *args, **kwargs):
        """Get a single suggestion"""
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Suggestion.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Suggestion not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error retrieving suggestion: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ DESTROY (DELETE) - UPDATED
    # ============================================
    
    def destroy(self, request, *args, **kwargs):
        """Delete a suggestion"""
        try:
            suggestion = self.get_object()
            
            if not request.user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Allow admin/staff to delete any suggestion
            if request.user.role in ['admin', 'staff'] or request.user.is_superuser:
                suggestion.delete()
                return Response({
                    'success': True,
                    'message': 'Suggestion deleted successfully'
                }, status=status.HTTP_200_OK)
            
            # ✅ ALLOW USER TO DELETE THEIR OWN SUGGESTIONS IN ANY PENDING STATE
            # This includes: pending, pending_guide, pending_admin, approved_by_guide, etc.
            if suggestion.user == request.user:
                # ✅ Check if suggestion is in a deletable state (not implemented or rejected)
                deletable_statuses = [
                    'pending', 
                    'pending_guide', 
                    'pending_admin', 
                    'approved_by_guide',
                    'approved',
                    'staff_approved'
                ]
                
                if suggestion.status in deletable_statuses:
                    suggestion.delete()
                    return Response({
                        'success': True,
                        'message': 'Suggestion deleted successfully'
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'success': False,
                        'error': f'Cannot delete suggestion with status: {suggestion.status}. Only pending or approved suggestions can be deleted.'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            return Response({
                'success': False,
                'error': 'You do not have permission to delete this suggestion'
            }, status=status.HTTP_403_FORBIDDEN)
            
        except Suggestion.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Suggestion not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting suggestion: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ MY SUGGESTIONS - NEW ENDPOINT
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='my-suggestions', permission_classes=[permissions.IsAuthenticated])
    def my_suggestions(self, request):
        """
        Get suggestions submitted by the current user.
        Returns all suggestions with pagination.
        """
        try:
            user = request.user
            
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # ✅ Get suggestions by the current user
            suggestions = Suggestion.objects.filter(
                user=user
            ).order_by('-created_at')
            
            print(f"🔍 User {user.email} has {suggestions.count()} suggestions")
            
            # ✅ Apply filters if provided
            status_filter = request.query_params.get('status')
            if status_filter:
                suggestions = suggestions.filter(status=status_filter)
            
            type_filter = request.query_params.get('type')
            if type_filter:
                suggestions = suggestions.filter(suggestion_type=type_filter)
            
            # ✅ Pagination
            page = self.paginate_queryset(suggestions)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response({
                    'success': True,
                    'data': serializer.data,
                    'count': suggestions.count()
                })
            
            serializer = self.get_serializer(suggestions, many=True)
            return Response({
                'success': True,
                'data': serializer.data,
                'count': suggestions.count()
            })
            
        except Exception as e:
            logger.error(f"Error in my_suggestions: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e),
                'data': [],
                'count': 0
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ IMPLEMENTED SUGGESTIONS
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='implemented')
    def implemented(self, request):
        """Get all implemented suggestions"""
        try:
            suggestions = Suggestion.objects.filter(
                status='implemented'
            ).order_by('-created_at')
            
            # Filter by category if provided
            category = request.query_params.get('category')
            if category:
                suggestions = suggestions.filter(category__iexact=category)
            
            # Filter by district if provided
            district = request.query_params.get('district')
            if district:
                suggestions = suggestions.filter(district__iexact=district)
            
            # Pagination
            page = self.paginate_queryset(suggestions)
            if page is not None:
                serializer = SuggestionListSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response({
                    'success': True,
                    'data': serializer.data,
                    'count': suggestions.count()
                })
            
            serializer = SuggestionListSerializer(suggestions, many=True, context={'request': request})
            return Response({
                'success': True,
                'data': serializer.data,
                'count': suggestions.count()
            })
        except Exception as e:
            logger.error(f"Error fetching implemented: {e}")
            return Response({
                'success': False,
                'data': [],
                'count': 0,
                'error': str(e)
            }, status=status.HTTP_200_OK)
    
    # ============================================
    # ✅ ADMIN SUGGESTIONS
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='admin-suggestions')
    def admin_suggestions(self, request):
        """Get all suggestions for admin dashboard"""
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # ✅ IMPROVED PERMISSION CHECK
        user = request.user
        role = None
        
        # Get role from user
        if hasattr(user, 'role'):
            role = user.role
        elif hasattr(user, 'get_role'):
            try:
                role = user.get_role()
            except:
                pass
        
        # Check if user is admin/staff or superuser
        is_admin = (
            user.is_superuser or 
            user.is_staff or 
            role in ['admin', 'staff']
        )
        
        if not is_admin:
            print(f"❌ User {user.email} (role: {role}) tried to access admin suggestions - Access Denied")
            return Response({
                'success': False,
                'error': 'Only admin/staff can access this'
            }, status=status.HTTP_403_FORBIDDEN)
        
        print(f"✅ User {user.email} (role: {role}) accessing admin suggestions")
        
        suggestions = Suggestion.objects.all().order_by('-created_at')
        print(f"📊 Total suggestions in DB: {suggestions.count()}")
        
        # Filter by type
        type_filter = request.query_params.get('type')
        if type_filter:
            suggestions = suggestions.filter(suggestion_type=type_filter)
        
        # Filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            suggestions = suggestions.filter(status=status_filter)
        
        # Filter by district
        district = request.query_params.get('district')
        if district:
            suggestions = suggestions.filter(district__iexact=district)
        
        # Pagination
        page = self.paginate_queryset(suggestions)
        if page is not None:
            serializer = SuggestionAdminListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response({
                'success': True,
                'data': serializer.data,
                'count': suggestions.count()
            })
        
        serializer = SuggestionAdminListSerializer(suggestions, many=True, context={'request': request})
        return Response({
            'success': True,
            'data': serializer.data,
            'count': suggestions.count()
        })
    
    # ============================================
    # ✅ ADMIN APPROVE
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='admin-approve')
    def admin_approve(self, request, pk=None):
        """Admin approve a suggestion"""
        try:
            suggestion = self.get_object()
            user = request.user
            
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Allow admin, staff, or superuser
            if user.role not in ['admin', 'staff'] and not user.is_superuser:
                return Response({
                    'success': False,
                    'error': 'Only admin/staff can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if suggestion.status == 'implemented':
                return Response({
                    'success': False,
                    'error': 'Suggestion is already implemented'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set status to staff_approved
            suggestion.status = 'staff_approved'
            suggestion.processed_by = user
            suggestion.processed_at = timezone.now()
            
            notes = request.data.get('notes', '')
            if notes:
                suggestion.admin_notes = notes
            
            suggestion.save()
            
            return Response({
                'success': True,
                'message': 'Suggestion approved successfully',
                'data': {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'status': suggestion.status,
                    'status_display': 'Staff Approved',
                    'processed_by_email': user.email,
                    'processed_at': suggestion.processed_at
                }
            })
            
        except Suggestion.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Suggestion not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in admin_approve: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ ADMIN IMPLEMENT
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='admin-implement')
    def admin_implement(self, request, pk=None):
        """Admin implement a suggestion with category mapping"""
        try:
            suggestion = self.get_object()
            user = request.user
            
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Allow admin, staff, or superuser
            if user.role not in ['admin', 'staff'] and not user.is_superuser:
                return Response({
                    'success': False,
                    'error': 'Only admin/staff can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if suggestion.status == 'implemented':
                return Response({
                    'success': False,
                    'error': 'Suggestion is already implemented'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ MAP CATEGORY TO DESTINATIONS CATEGORY
            try:
                from destinations.models import CategoryData, CategoryPlace
                category_key = suggestion.category or 'general'
                
                # Try to find matching category in destinations
                existing_category = CategoryData.objects.filter(
                    Q(key__iexact=category_key) | Q(title__iexact=category_key)
                ).first()
                
                if not existing_category:
                    # Create a new category if it doesn't exist
                    existing_category = CategoryData.objects.create(
                        key=category_key.lower().replace(' ', '_'),
                        title=category_key.title(),
                        description=f'Places in {category_key}',
                        is_active=True
                    )
                    logger.info(f"Created new category: {existing_category.key}")
                
                # Create or update place in category
                place_name = suggestion.name or 'Unknown Place'
                existing_place = CategoryPlace.objects.filter(
                    category=existing_category.key,
                    name__iexact=place_name
                ).first()
                
                if not existing_place:
                    CategoryPlace.objects.create(
                        category=existing_category.key,
                        name=place_name,
                        location=suggestion.district or suggestion.location_info or '',
                        description=suggestion.description or '',
                        image=suggestion.image_url or '',
                        type='hidden' if suggestion.suggestion_type == 'hidden_gem' else 'well-known',
                        hidden_gem=suggestion.description if suggestion.suggestion_type == 'hidden_gem' else '',
                        is_active=True,
                        created_by=user
                    )
                    logger.info(f"Added suggestion to category: {existing_category.key} - {place_name}")
                else:
                    logger.info(f"Place already exists in category: {existing_category.key} - {place_name}")
                    
            except Exception as e:
                logger.error(f"Error mapping suggestion to category: {e}")
                # Continue with implementation even if category mapping fails
            
            # Set status to implemented
            suggestion.status = 'implemented'
            suggestion.processed_by = user
            suggestion.processed_at = timezone.now()
            
            notes = request.data.get('notes', '')
            if notes:
                suggestion.admin_notes = notes
            
            suggestion.save()
            
            return Response({
                'success': True,
                'message': 'Suggestion implemented successfully',
                'data': {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'status': suggestion.status,
                    'status_display': 'Implemented',
                    'processed_by_email': user.email,
                    'processed_at': suggestion.processed_at,
                    'category_mapped': True
                }
            })
            
        except Suggestion.DoesNotExist:
            return Response({
                'success': False,
                'error': f'Suggestion with ID {pk} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in admin_implement: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ ADMIN REJECT
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='admin-reject')
    def admin_reject(self, request, pk=None):
        """Admin reject a suggestion"""
        try:
            suggestion = self.get_object()
            user = request.user
            
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Allow admin, staff, or superuser
            if user.role not in ['admin', 'staff'] and not user.is_superuser:
                return Response({
                    'success': False,
                    'error': 'Only admin/staff can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if suggestion.status == 'implemented':
                return Response({
                    'success': False,
                    'error': 'Cannot reject an implemented suggestion'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            notes = request.data.get('notes', '')
            
            suggestion.status = 'rejected'
            suggestion.processed_by = user
            suggestion.processed_at = timezone.now()
            
            if notes:
                suggestion.admin_notes = notes
                suggestion.rejection_reason = notes
            
            suggestion.save()
            
            return Response({
                'success': True,
                'message': 'Suggestion rejected successfully',
                'data': {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'status': suggestion.status,
                    'status_display': 'Rejected',
                    'processed_by_email': user.email,
                    'processed_at': suggestion.processed_at
                }
            })
            
        except Suggestion.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Suggestion not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in admin_reject: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ STAFF APPROVE
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='staff-approve')
    def staff_approve(self, request, pk=None):
        """Staff approve a suggestion"""
        try:
            suggestion = self.get_object()
            user = request.user
            
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Allow staff, admin, or superuser
            if user.role not in ['staff', 'admin'] and not user.is_superuser:
                return Response({
                    'success': False,
                    'error': 'Only staff/admins can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if suggestion.status == 'implemented':
                return Response({
                    'success': False,
                    'error': 'Suggestion is already implemented'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set status to approved
            suggestion.status = 'approved'
            suggestion.processed_by = user
            suggestion.processed_at = timezone.now()
            
            notes = request.data.get('notes', '')
            if notes:
                suggestion.admin_notes = notes
            
            suggestion.save()
            
            return Response({
                'success': True,
                'message': 'Suggestion approved successfully by staff',
                'data': {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'status': suggestion.status,
                    'status_display': 'Approved',
                    'processed_by_email': user.email,
                    'processed_at': suggestion.processed_at
                }
            })
            
        except Suggestion.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Suggestion not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in staff_approve: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ STAFF IMPLEMENT
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='staff-implement')
    def staff_implement(self, request, pk=None):
        """Staff implement a suggestion with category mapping"""
        try:
            suggestion = self.get_object()
            user = request.user
            
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Allow staff, admin, or superuser
            if user.role not in ['staff', 'admin'] and not user.is_superuser:
                return Response({
                    'success': False,
                    'error': 'Only staff/admins can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if suggestion.status == 'implemented':
                return Response({
                    'success': False,
                    'error': 'Suggestion is already implemented'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ MAP CATEGORY TO DESTINATIONS CATEGORY
            try:
                from destinations.models import CategoryData, CategoryPlace
                category_key = suggestion.category or 'general'
                
                # Try to find matching category in destinations
                existing_category = CategoryData.objects.filter(
                    Q(key__iexact=category_key) | Q(title__iexact=category_key)
                ).first()
                
                if not existing_category:
                    # Create a new category if it doesn't exist
                    existing_category = CategoryData.objects.create(
                        key=category_key.lower().replace(' ', '_'),
                        title=category_key.title(),
                        description=f'Places in {category_key}',
                        is_active=True
                    )
                    logger.info(f"Created new category: {existing_category.key}")
                
                # Create or update place in category
                place_name = suggestion.name or 'Unknown Place'
                existing_place = CategoryPlace.objects.filter(
                    category=existing_category.key,
                    name__iexact=place_name
                ).first()
                
                if not existing_place:
                    CategoryPlace.objects.create(
                        category=existing_category.key,
                        name=place_name,
                        location=suggestion.district or suggestion.location_info or '',
                        description=suggestion.description or '',
                        image=suggestion.image_url or '',
                        type='hidden' if suggestion.suggestion_type == 'hidden_gem' else 'well-known',
                        hidden_gem=suggestion.description if suggestion.suggestion_type == 'hidden_gem' else '',
                        is_active=True,
                        created_by=user
                    )
                    logger.info(f"Added suggestion to category: {existing_category.key} - {place_name}")
                else:
                    logger.info(f"Place already exists in category: {existing_category.key} - {place_name}")
                    
            except Exception as e:
                logger.error(f"Error mapping suggestion to category: {e}")
                # Continue with implementation even if category mapping fails
            
            # Set status to implemented
            suggestion.status = 'implemented'
            suggestion.processed_by = user
            suggestion.processed_at = timezone.now()
            
            notes = request.data.get('notes', '')
            if notes:
                suggestion.admin_notes = notes
            
            suggestion.save()
            
            return Response({
                'success': True,
                'message': 'Suggestion implemented successfully by staff',
                'data': {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'status': suggestion.status,
                    'status_display': 'Implemented',
                    'processed_by_email': user.email,
                    'processed_at': suggestion.processed_at,
                    'category_mapped': True
                }
            })
            
        except Suggestion.DoesNotExist:
            return Response({
                'success': False,
                'error': f'Suggestion with ID {pk} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in staff_implement: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ STAFF REJECT
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='staff-reject')
    def staff_reject(self, request, pk=None):
        """Staff reject a suggestion"""
        try:
            suggestion = self.get_object()
            user = request.user
            
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Allow staff, admin, or superuser
            if user.role not in ['staff', 'admin'] and not user.is_superuser:
                return Response({
                    'success': False,
                    'error': 'Only staff/admins can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if suggestion.status == 'implemented':
                return Response({
                    'success': False,
                    'error': 'Cannot reject an implemented suggestion'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            notes = request.data.get('notes', '')
            
            suggestion.status = 'rejected'
            suggestion.processed_by = user
            suggestion.processed_at = timezone.now()
            
            if notes:
                suggestion.admin_notes = notes
                suggestion.rejection_reason = notes
            
            suggestion.save()
            
            return Response({
                'success': True,
                'message': 'Suggestion rejected successfully by staff',
                'data': {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'status': suggestion.status,
                    'status_display': 'Rejected',
                    'processed_by_email': user.email,
                    'processed_at': suggestion.processed_at
                }
            })
            
        except Suggestion.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Suggestion not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in staff_reject: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ GUIDE DASHBOARD
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='guide-dashboard')
    def guide_dashboard(self, request):
        """Get ALL suggestions for guide's district - Including all statuses"""
        user = request.user
        
        if not user.is_authenticated:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if user.role != 'guide':
            return Response({
                'success': False,
                'error': 'Only guides can access this'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            guide = Guide.objects.get(user=user)
            guide_districts = list(guide.districts.values_list('name', flat=True))
            
            if not guide_districts:
                return Response({
                    'success': True,
                    'data': [],
                    'count': 0,
                    'message': 'No districts assigned'
                })
            
            # ✅ Get ALL suggestions in guide's districts (not just pending)
            district_filter = Q()
            for d in guide_districts:
                district_filter |= Q(district__iexact=d)
            
            suggestions = Suggestion.objects.filter(
                district_filter
            ).order_by('-created_at')
            
            print(f"🔍 Guide {user.email} - Districts: {guide_districts}")
            print(f"📊 Found {suggestions.count()} suggestions for guide")
            
            status_filter = request.query_params.get('status')
            if status_filter:
                suggestions = suggestions.filter(status=status_filter)
            
            type_filter = request.query_params.get('type')
            if type_filter:
                suggestions = suggestions.filter(suggestion_type=type_filter)
            
            # Prepare data with proper image handling
            data = []
            for s in suggestions:
                image_url = None
                # Try to get primary image
                primary_image = s.images.filter(is_primary=True).first()
                if primary_image and primary_image.image:
                    try:
                        image_url = primary_image.image.url
                    except:
                        image_url = None
                
                # If no primary image, get first image
                if not image_url:
                    first_image = s.images.first()
                    if first_image and first_image.image:
                        try:
                            image_url = first_image.image.url
                        except:
                            image_url = None
                
                # If still no image, check the main image field
                if not image_url and s.image:
                    try:
                        if hasattr(s.image, 'url'):
                            image_url = s.image.url
                        else:
                            image_url = str(s.image)
                    except:
                        pass
                
                data.append({
                    'id': s.id,
                    'name': s.name,
                    'title': s.title or s.name,
                    'description': s.description,
                    'suggestion_type': s.suggestion_type,
                    'status': s.status,
                    'category': s.category,
                    'district': s.district,
                    'location_info': s.location_info,
                    'image': image_url,
                    'image_url': image_url,
                    'user': {
                        'id': s.user.id if s.user else None,
                        'email': s.user.email if s.user else 'Anonymous',
                        'username': s.user.username if s.user else 'Anonymous',
                        'first_name': s.user.first_name if s.user else '',
                        'last_name': s.user.last_name if s.user else '',
                    } if s.user else {
                        'email': 'Anonymous',
                        'username': 'Anonymous',
                    },
                    'user_email': s.user.email if s.user else 'Anonymous',
                    'created_at': s.created_at.isoformat(),
                    'updated_at': s.updated_at.isoformat(),
                    'is_guide_submitted': s.is_guide_submitted if hasattr(s, 'is_guide_submitted') else False,
                    'guide_notes': s.guide_notes if hasattr(s, 'guide_notes') else '',
                    'admin_notes': s.admin_notes if hasattr(s, 'admin_notes') else '',
                })
            
            return Response({
                'success': True,
                'data': data,
                'count': len(data),
                'districts': guide_districts
            })
            
        except Guide.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Guide profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error in guide_dashboard: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': str(e),
                'data': [],
                'count': 0
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ BY CATEGORY
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='by-category')
    def by_category(self, request):
        """Get suggestions by category"""
        category = request.query_params.get('category')
        if not category:
            return Response({
                'success': False,
                'data': [],
                'count': 0,
                'error': 'Category parameter required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            suggestions = Suggestion.objects.filter(
                category__iexact=category,
                status='implemented'
            ).order_by('-created_at')
            
            page = self.paginate_queryset(suggestions)
            if page is not None:
                serializer = SuggestionListSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response({
                    'success': True,
                    'data': serializer.data,
                    'count': suggestions.count(),
                    'category': category
                })
            
            serializer = SuggestionListSerializer(suggestions, many=True, context={'request': request})
            return Response({
                'success': True,
                'data': serializer.data,
                'count': suggestions.count(),
                'category': category
            })
        except Exception as e:
            logger.error(f"Error fetching suggestions by category: {e}")
            return Response({
                'success': False,
                'data': [],
                'count': 0,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ GUIDE APPROVE - FIXED
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='guide-approve')
    def guide_approve(self, request, pk=None):
        """Guide approve a suggestion"""
        try:
            # ✅ Get suggestion with proper error handling
            try:
                suggestion = Suggestion.objects.get(id=pk)
            except Suggestion.DoesNotExist:
                return Response({
                    'success': False,
                    'error': f'Suggestion with ID {pk} not found. Please refresh and try again.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            user = request.user
            
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if user.role != 'guide':
                return Response({
                    'success': False,
                    'error': 'Only guides can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # ✅ Get guide profile
            try:
                guide = Guide.objects.get(user=user)
                guide_districts = [d.name.lower() for d in guide.districts.all()]
                
                # ✅ Check if suggestion district is in guide's districts
                suggestion_district = (suggestion.district or '').lower()
                if suggestion_district not in guide_districts:
                    return Response({
                        'success': False,
                        'error': f'This suggestion is not in your district. Your districts: {", ".join(guide_districts)}'
                    }, status=status.HTTP_403_FORBIDDEN)
                    
            except Guide.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Guide profile not found. Please contact admin.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # ✅ Allow approval from pending, pending_guide, or pending_admin
            if suggestion.status not in ['pending', 'pending_guide', 'pending_admin']:
                return Response({
                    'success': False,
                    'error': f'Cannot approve. Current status is: {suggestion.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Set status to approved_by_guide
            suggestion.status = 'approved_by_guide'
            suggestion.guide_approved_by = user
            suggestion.guide_approved_at = timezone.now()
            suggestion.guide_processed_at = timezone.now()
            suggestion.guide = guide
            
            notes = request.data.get('notes', '')
            if notes:
                suggestion.guide_notes = notes
            
            suggestion.save()
            
            logger.info(f"✅ Guide {user.email} approved suggestion {suggestion.id} - {suggestion.name}")
            
            return Response({
                'success': True,
                'message': 'Suggestion approved by guide',
                'data': {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'status': suggestion.status,
                    'status_display': 'Approved by Guide',
                    'guide_approved_by': user.email,
                    'guide_approved_at': suggestion.guide_approved_at.isoformat() if suggestion.guide_approved_at else None
                }
            })
            
        except Exception as e:
            logger.error(f"Error in guide_approve: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': f'Error approving suggestion: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ GUIDE REJECT - FIXED
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='guide-reject')
    def guide_reject(self, request, pk=None):
        """Guide reject a suggestion"""
        try:
            # ✅ Get suggestion with proper error handling
            try:
                suggestion = Suggestion.objects.get(id=pk)
            except Suggestion.DoesNotExist:
                return Response({
                    'success': False,
                    'error': f'Suggestion with ID {pk} not found. Please refresh and try again.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            user = request.user
            
            if not user.is_authenticated:
                return Response({
                    'success': False,
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            if user.role != 'guide':
                return Response({
                    'success': False,
                    'error': 'Only guides can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # ✅ Get guide profile
            try:
                guide = Guide.objects.get(user=user)
                guide_districts = [d.name.lower() for d in guide.districts.all()]
                
                # ✅ Check if suggestion district is in guide's districts
                suggestion_district = (suggestion.district or '').lower()
                if suggestion_district not in guide_districts:
                    return Response({
                        'success': False,
                        'error': f'This suggestion is not in your district. Your districts: {", ".join(guide_districts)}'
                    }, status=status.HTTP_403_FORBIDDEN)
                    
            except Guide.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Guide profile not found. Please contact admin.'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # ✅ Allow rejection from pending, pending_guide, or pending_admin
            if suggestion.status not in ['pending', 'pending_guide', 'pending_admin']:
                return Response({
                    'success': False,
                    'error': f'Cannot reject. Current status is: {suggestion.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            reason = request.data.get('reason', '')
            notes = request.data.get('notes', '')
            
            if not reason:
                return Response({
                    'success': False,
                    'error': 'Reason is required for rejection. Please provide a reason.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ✅ Set status to rejected_by_guide
            suggestion.status = 'rejected_by_guide'
            suggestion.guide_rejected_by = user
            suggestion.guide_rejected_at = timezone.now()
            suggestion.guide_processed_at = timezone.now()
            suggestion.rejection_reason = reason
            suggestion.guide = guide
            
            if notes:
                suggestion.guide_notes = notes
            
            suggestion.save()
            
            logger.info(f"✅ Guide {user.email} rejected suggestion {suggestion.id} - {suggestion.name} - Reason: {reason}")
            
            return Response({
                'success': True,
                'message': 'Suggestion rejected by guide',
                'data': {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'status': suggestion.status,
                    'status_display': 'Rejected by Guide',
                    'guide_rejected_by': user.email,
                    'guide_rejected_at': suggestion.guide_rejected_at.isoformat() if suggestion.guide_rejected_at else None,
                    'rejection_reason': reason
                }
            })
            
        except Exception as e:
            logger.error(f"Error in guide_reject: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'error': f'Error rejecting suggestion: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
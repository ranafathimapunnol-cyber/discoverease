# suggestions/views.py - COMPLETE FIXED VERSION

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.http import Http404
from django.conf import settings
import logging
import os

from .models import Suggestion
from .serializers import (
    SuggestionSerializer,
    SuggestionCreateSerializer,
    SuggestionListSerializer
)
from guides.models import Guide

logger = logging.getLogger(__name__)


class SuggestionViewSet(viewsets.ModelViewSet):
    """
    Unified viewset for Hidden Gems, Local Insights, and Reviews
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SuggestionCreateSerializer
        elif self.action in ['list', 'my_suggestions', 'guide_suggestions', 'implemented']:
            return SuggestionListSerializer
        return SuggestionSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_queryset(self):
        user = self.request.user
        queryset = Suggestion.objects.select_related('user', 'guide', 'processed_by')
        
        if not user.is_authenticated:
            return queryset.filter(status=Suggestion.Status.IMPLEMENTED)
        
        if user.role == 'guide':
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
        else:
            queryset = queryset.filter(status=Suggestion.Status.IMPLEMENTED)
        
        suggestion_type = self.request.query_params.get('type')
        if suggestion_type:
            queryset = queryset.filter(suggestion_type=suggestion_type)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        district = self.request.query_params.get('district')
        if district:
            queryset = queryset.filter(district__iexact=district)
        
        return queryset.order_by('-created_at')
    
    # ============================================
    # CREATE
    # ============================================
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'message': 'Please login to submit'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            data = request.data.copy()
            
            if not data.get('suggestion_type'):
                if data.get('type'):
                    data['suggestion_type'] = data.get('type')
                else:
                    data['suggestion_type'] = 'hidden_gem'
            
            if 'image' in request.FILES:
                data['image'] = request.FILES['image']
            
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
            
            suggestion = serializer.save(
                user=request.user,
                guide=guide,
                status='pending'
            )
            
            return Response({
                'success': True,
                'message': 'Submitted successfully',
                'data': {
                    'id': suggestion.id,
                    'name': suggestion.name,
                    'status': suggestion.status,
                    'created_at': suggestion.created_at,
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating suggestion: {e}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # LIST
    # ============================================
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
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
            return Response({
                'success': False,
                'data': [],
                'count': 0
            })
    
    # ============================================
    # RETRIEVE
    # ============================================
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            logger.error(f"Error retrieving suggestion: {e}")
            return Response({
                'success': False,
                'error': 'Suggestion not found',
                'message': str(e)
            }, status=status.HTTP_404_NOT_FOUND)
    
    # ============================================
    # GUIDE SUGGESTIONS
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='guide-suggestions')
    def guide_suggestions(self, request):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'data': [],
                'count': 0
            })
        
        try:
            try:
                guide = Guide.objects.get(user=request.user)
            except Guide.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'User is not a guide',
                    'data': [],
                    'count': 0
                })
            
            districts = list(guide.districts.values_list('name', flat=True))
            
            if not districts:
                return Response({
                    'success': True,
                    'data': [],
                    'count': 0,
                    'districts': []
                })
            
            district_filter = Q()
            for d in districts:
                district_filter |= Q(district__iexact=d)
            
            suggestions = Suggestion.objects.filter(
                district_filter
            ).select_related('user', 'guide').order_by('-created_at')
            
            suggestion_type = request.query_params.get('type')
            if suggestion_type:
                suggestions = suggestions.filter(suggestion_type=suggestion_type)
            
            status_filter = request.query_params.get('status')
            if status_filter:
                suggestions = suggestions.filter(status=status_filter)
            
            page = self.paginate_queryset(suggestions)
            if page is not None:
                serializer = SuggestionListSerializer(
                    page, 
                    many=True,
                    context={'request': request}
                )
                return self.get_paginated_response({
                    'success': True,
                    'data': serializer.data,
                    'count': suggestions.count(),
                    'districts': districts
                })
            
            serializer = SuggestionListSerializer(
                suggestions,
                many=True,
                context={'request': request}
            )
            return Response({
                'success': True,
                'data': serializer.data,
                'count': suggestions.count(),
                'districts': districts
            })
        except Exception as e:
            logger.error(f"Error in guide_suggestions: {e}")
            return Response({
                'success': False,
                'data': [],
                'count': 0,
                'error': str(e)
            })
    
    # ============================================
    # IMPLEMENTED SUGGESTIONS
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='implemented')
    def implemented(self, request):
        try:
            suggestions = Suggestion.objects.filter(
                status='implemented'
            ).select_related('user').order_by('-created_at')
            
            page = self.paginate_queryset(suggestions)
            if page is not None:
                serializer = SuggestionListSerializer(
                    page, 
                    many=True,
                    context={'request': request}
                )
                return self.get_paginated_response({
                    'success': True,
                    'data': serializer.data,
                    'count': suggestions.count()
                })
            
            serializer = SuggestionListSerializer(
                suggestions,
                many=True,
                context={'request': request}
            )
            return Response({
                'success': True,
                'data': serializer.data,
                'count': suggestions.count()
            })
        except Exception as e:
            logger.error(f"Error in implemented: {e}")
            return Response({
                'success': False,
                'data': [],
                'count': 0
            })
    
    # ============================================
    # ✅ GUIDE APPROVE
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='guide-approve')
    def guide_approve(self, request, pk=None):
        try:
            suggestion = self.get_object()
            user = request.user
            
            if user.role != 'guide':
                return Response({
                    'success': False,
                    'error': 'Only guides can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                guide = Guide.objects.get(user=user)
                guide_districts = list(guide.districts.values_list('name', flat=True))
                if guide_districts and suggestion.district.lower() not in [d.lower() for d in guide_districts]:
                    return Response({
                        'success': False,
                        'error': 'This suggestion is not in your district'
                    }, status=status.HTTP_403_FORBIDDEN)
            except Guide.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Guide profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if suggestion.status != 'pending':
                return Response({
                    'success': False,
                    'error': f'Cannot approve. Current status: {suggestion.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            suggestion.status = 'approved_by_guide'
            suggestion.guide_approved_by = user
            suggestion.guide_approved_at = timezone.now()
            suggestion.guide_processed_at = timezone.now()
            
            notes = request.data.get('notes', '')
            if notes:
                suggestion.guide_notes = notes
            
            suggestion.save()
            
            serializer = self.get_serializer(suggestion)
            return Response({
                'success': True,
                'message': 'Suggestion approved by guide',
                'data': serializer.data
            })
        except Exception as e:
            logger.error(f"Error in guide_approve: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ GUIDE REJECT
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='guide-reject')
    def guide_reject(self, request, pk=None):
        try:
            suggestion = self.get_object()
            user = request.user
            
            if user.role != 'guide':
                return Response({
                    'success': False,
                    'error': 'Only guides can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                guide = Guide.objects.get(user=user)
                guide_districts = list(guide.districts.values_list('name', flat=True))
                if guide_districts and suggestion.district.lower() not in [d.lower() for d in guide_districts]:
                    return Response({
                        'success': False,
                        'error': 'This suggestion is not in your district'
                    }, status=status.HTTP_403_FORBIDDEN)
            except Guide.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Guide profile not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if suggestion.status != 'pending':
                return Response({
                    'success': False,
                    'error': f'Cannot reject. Current status: {suggestion.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            suggestion.status = 'rejected_by_guide'
            suggestion.guide_rejected_by = user
            suggestion.guide_rejected_at = timezone.now()
            suggestion.guide_processed_at = timezone.now()
            
            reason = request.data.get('reason', 'No reason provided')
            suggestion.rejection_reason = reason
            notes = request.data.get('notes', '')
            if notes:
                suggestion.guide_notes = notes
            
            suggestion.save()
            
            serializer = self.get_serializer(suggestion)
            return Response({
                'success': True,
                'message': 'Suggestion rejected by guide',
                'data': serializer.data
            })
        except Exception as e:
            logger.error(f"Error in guide_reject: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # STAFF APPROVE
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='staff-approve')
    def staff_approve(self, request, pk=None):
        try:
            suggestion = self.get_object()
            user = request.user
            
            if user.role not in ['staff', 'admin']:
                return Response({
                    'success': False,
                    'error': 'Only staff or admin can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if suggestion.status not in ['approved_by_guide', 'pending']:
                return Response({
                    'success': False,
                    'error': f'Cannot approve. Current status: {suggestion.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            suggestion.status = 'staff_approved'
            suggestion.staff_approved_by = user
            suggestion.staff_approved_at = timezone.now()
            suggestion.processed_by = user
            suggestion.processed_at = timezone.now()
            
            notes = request.data.get('notes', '')
            if notes:
                suggestion.admin_notes = notes
            
            suggestion.save()
            
            serializer = self.get_serializer(suggestion)
            return Response({
                'success': True,
                'message': 'Suggestion approved by staff',
                'data': serializer.data
            })
        except Exception as e:
            logger.error(f"Error in staff_approve: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # STAFF REJECT
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='staff-reject')
    def staff_reject(self, request, pk=None):
        try:
            suggestion = self.get_object()
            user = request.user
            
            if user.role not in ['staff', 'admin']:
                return Response({
                    'success': False,
                    'error': 'Only staff or admin can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if suggestion.status not in ['approved_by_guide', 'pending']:
                return Response({
                    'success': False,
                    'error': f'Cannot reject. Current status: {suggestion.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            suggestion.status = 'staff_rejected'
            suggestion.staff_rejected_by = user
            suggestion.staff_rejected_at = timezone.now()
            suggestion.processed_by = user
            suggestion.processed_at = timezone.now()
            
            reason = request.data.get('reason', 'No reason provided')
            suggestion.rejection_reason = reason
            notes = request.data.get('notes', '')
            if notes:
                suggestion.admin_notes = notes
            
            suggestion.save()
            
            serializer = self.get_serializer(suggestion)
            return Response({
                'success': True,
                'message': 'Suggestion rejected by staff',
                'data': serializer.data
            })
        except Exception as e:
            logger.error(f"Error in staff_reject: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ ADMIN IMPLEMENT
    # ============================================
    
    @action(detail=True, methods=['post'], url_path='admin-implement')
    def admin_implement(self, request, pk=None):
        try:
            suggestion = self.get_object()
            user = request.user
            
            if user.role != 'admin':
                return Response({
                    'success': False,
                    'error': 'Only admin can perform this action'
                }, status=status.HTTP_403_FORBIDDEN)
            
            if suggestion.status not in ['staff_approved', 'approved']:
                return Response({
                    'success': False,
                    'error': f'Cannot implement. Current status: {suggestion.status}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            suggestion.status = 'implemented'
            suggestion.admin_implemented_by = user
            suggestion.admin_implemented_at = timezone.now()
            suggestion.processed_by = user
            suggestion.processed_at = timezone.now()
            
            notes = request.data.get('notes', '')
            if notes:
                suggestion.admin_notes = notes
            
            suggestion.save()
            
            serializer = self.get_serializer(suggestion)
            return Response({
                'success': True,
                'message': 'Suggestion implemented successfully',
                'data': serializer.data
            })
        except Exception as e:
            logger.error(f"Error in admin_implement: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ============================================
    # ✅ MY SUGGESTIONS
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='my')
    def my_suggestions(self, request):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'data': [],
                'count': 0
            })
        
        try:
            suggestions = Suggestion.objects.filter(
                user=request.user
            ).order_by('-created_at')
            
            stats = {
                'total': suggestions.count(),
                'pending': suggestions.filter(status='pending').count(),
                'approved_by_guide': suggestions.filter(status='approved_by_guide').count(),
                'rejected_by_guide': suggestions.filter(status='rejected_by_guide').count(),
                'staff_approved': suggestions.filter(status='staff_approved').count(),
                'staff_rejected': suggestions.filter(status='staff_rejected').count(),
                'implemented': suggestions.filter(status='implemented').count(),
            }
            
            page = self.paginate_queryset(suggestions)
            if page is not None:
                serializer = SuggestionListSerializer(
                    page, 
                    many=True,
                    context={'request': request}
                )
                return self.get_paginated_response({
                    'success': True,
                    'stats': stats,
                    'data': serializer.data,
                    'count': suggestions.count()
                })
            
            serializer = SuggestionListSerializer(
                suggestions, 
                many=True,
                context={'request': request}
            )
            
            return Response({
                'success': True,
                'stats': stats,
                'data': serializer.data,
                'count': len(serializer.data)
            })
        except Exception as e:
            return Response({
                'success': False,
                'data': [],
                'count': 0
            })

    # ============================================
    # ✅ ADMIN SUGGESTIONS - GET ALL (FIXED IMAGES)
    # ============================================
    
    # suggestions/views.py - FIXED admin_suggestions method

    # ============================================
    # ✅ ADMIN SUGGESTIONS - GET ALL (FIXED - HANDLES None VALUES)
    # ============================================
    
    @action(detail=False, methods=['get'], url_path='admin-suggestions')
    def admin_suggestions(self, request):
        """Admin endpoint to get all suggestions (hidden gems, insights, reviews) - FIXED"""
        if not request.user.is_staff and not request.user.is_superuser and request.user.role != 'admin':
            return Response({
                'error': 'Permission denied. Admin or Staff only.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get all suggestions
            suggestions = Suggestion.objects.all().order_by('-created_at')
            
            data = []
            for s in suggestions.select_related('user', 'processed_by'):
                try:
                    user_email = 'Anonymous'
                    user_username = ''
                    if s.user:
                        user_email = s.user.email or 'Anonymous'
                        user_username = s.user.username or ''
                    
                    processed_by_email = None
                    if s.processed_by:
                        processed_by_email = s.processed_by.email or None
                    
                    # ✅ FIXED: Safely get image URL
                    image_url = None
                    if s.image:
                        try:
                            if hasattr(s.image, 'url'):
                                image_url = s.image.url
                            elif isinstance(s.image, str):
                                image_url = s.image
                            else:
                                image_url = str(s.image)
                        except Exception as e:
                            logger.warning(f"Error getting image URL for suggestion {s.id}: {e}")
                            image_url = None
                    
                    # ✅ FIXED: Safely get suggestion type - handle None
                    suggestion_type = getattr(s, 'suggestion_type', 'general')
                    if suggestion_type is None:
                        suggestion_type = 'general'
                    suggestion_type = str(suggestion_type).lower()
                    
                    if suggestion_type in ['hidden_gem', 'hidden']:
                        suggestion_type = 'hidden_gem'
                    elif suggestion_type in ['local_insight', 'insight', 'local']:
                        suggestion_type = 'local_insight'
                    elif suggestion_type in ['review', 'rating']:
                        suggestion_type = 'review'
                    else:
                        suggestion_type = 'general'
                    
                    # ✅ FIXED: Safely get status - handle None
                    status_val = getattr(s, 'status', 'pending')
                    if status_val is None:
                        status_val = 'pending'
                    status_val = str(status_val)
                    
                    # ✅ FIXED: Safely get district - handle None
                    district = getattr(s, 'district', '')
                    if district is None:
                        district = ''
                    district = str(district)
                    
                    # ✅ FIXED: Safely get category - handle None
                    category = getattr(s, 'category', 'General')
                    if category is None:
                        category = 'General'
                    category = str(category)
                    
                    # ✅ FIXED: Safely get rating - handle None
                    rating = getattr(s, 'rating', None)
                    if rating is not None:
                        try:
                            rating = float(rating)
                        except (ValueError, TypeError):
                            rating = None
                    
                    # ✅ FIXED: Safely get name - handle None
                    name = getattr(s, 'name', 'Untitled')
                    if name is None:
                        name = 'Untitled'
                    name = str(name)
                    
                    # ✅ FIXED: Safely get description - handle None
                    description = getattr(s, 'description', '')
                    if description is None:
                        description = ''
                    description = str(description)
                    
                    # ✅ FIXED: Safely get admin_notes - handle None
                    admin_notes = getattr(s, 'admin_notes', '')
                    if admin_notes is None:
                        admin_notes = ''
                    admin_notes = str(admin_notes)
                    
                    # ✅ FIXED: Safely get guide_notes - handle None
                    guide_notes = getattr(s, 'guide_notes', '')
                    if guide_notes is None:
                        guide_notes = ''
                    guide_notes = str(guide_notes)
                    
                    # ✅ FIXED: Safely get location_info - handle None
                    location_info = getattr(s, 'location_info', '')
                    if location_info is None:
                        location_info = ''
                    location_info = str(location_info)
                    
                    # ✅ FIXED: Safely get images - handle None
                    images_list = []
                    if hasattr(s, 'images') and s.images:
                        try:
                            if isinstance(s.images, list):
                                images_list = s.images
                            elif hasattr(s.images, 'url'):
                                images_list = [s.images.url]
                            elif isinstance(s.images, str):
                                images_list = [s.images]
                        except Exception as e:
                            logger.warning(f"Error getting images for suggestion {s.id}: {e}")
                    
                    # Get fallback image if no image
                    if not image_url and not images_list:
                        # Use category-based fallback images
                        category_images = {
                            'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
                            'backwater': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                            'waterfall': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80',
                            'hill': 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=80',
                            'wildlife': 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80',
                        }
                        cat_lower = category.lower()
                        image_url = category_images.get(cat_lower, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80')
                    
                    # ✅ FIXED: Safely get created_at - handle None
                    created_at = None
                    if hasattr(s, 'created_at') and s.created_at:
                        created_at = s.created_at.isoformat()
                    else:
                        created_at = timezone.now().isoformat()
                    
                    # ✅ FIXED: Safely get processed_at - handle None
                    processed_at = None
                    if hasattr(s, 'processed_at') and s.processed_at:
                        processed_at = s.processed_at.isoformat()
                    
                    data.append({
                        'id': s.id,
                        'name': name,
                        'title': name,
                        'description': description,
                        'category': category,
                        'suggestion_type': suggestion_type,
                        'type': suggestion_type,
                        'status': status_val,
                        'location_info': location_info,
                        'district': district,
                        'image': image_url,
                        'images': images_list,
                        'rating': rating,
                        'user': {
                            'email': user_email,
                            'username': user_username,
                        },
                        'user_email': user_email,
                        'admin_notes': admin_notes,
                        'guide_notes': guide_notes,
                        'processed_by': processed_by_email,
                        'processed_at': processed_at,
                        'created_at': created_at,
                    })
                except Exception as e:
                    logger.error(f"Error processing suggestion {s.id}: {e}")
                    # Still add the suggestion with basic data
                    data.append({
                        'id': s.id,
                        'name': getattr(s, 'name', 'Untitled') or 'Untitled',
                        'title': getattr(s, 'name', 'Untitled') or 'Untitled',
                        'description': getattr(s, 'description', '') or '',
                        'category': getattr(s, 'category', 'General') or 'General',
                        'suggestion_type': 'general',
                        'type': 'general',
                        'status': getattr(s, 'status', 'pending') or 'pending',
                        'district': getattr(s, 'district', '') or '',
                        'image': None,
                        'images': [],
                        'rating': None,
                        'user_email': 'Anonymous',
                        'admin_notes': '',
                        'guide_notes': '',
                        'processed_by': None,
                        'processed_at': None,
                        'created_at': timezone.now().isoformat(),
                    })
            
            return Response({
                'success': True,
                'suggestions': data
            })
            
        except Exception as e:
            logger.error(f"Error fetching admin suggestions: {e}")
            import traceback
            traceback.print_exc()
            return Response({
                'success': False,
                'suggestions': [],
                'error': str(e)
            }, status=status.HTTP_200_OK)
    # ============================================
    # ✅ ADMIN IMPLEMENT SUGGESTION
    # ============================================
    
    @action(detail=False, methods=['post'], url_path='admin-suggestions/(?P<suggestion_id>[^/.]+)/implement')
    def admin_implement_suggestion(self, request, suggestion_id=None):
        """Admin endpoint to implement a suggestion"""
        if not request.user.is_staff and not request.user.is_superuser and request.user.role != 'admin':
            return Response({
                'error': 'Permission denied. Admin or Staff only.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            suggestion = get_object_or_404(Suggestion, id=suggestion_id)
            notes = request.data.get('notes', f'Implemented by {request.user.email}')
            
            suggestion.status = 'implemented'
            suggestion.admin_notes = notes
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.save()
            
            return Response({
                'success': True,
                'message': 'Suggestion implemented successfully',
                'suggestion': {
                    'id': suggestion.id,
                    'status': suggestion.status,
                    'admin_notes': suggestion.admin_notes,
                    'processed_by': request.user.email,
                    'processed_at': suggestion.processed_at.isoformat()
                }
            })
            
        except Http404:
            return Response({
                'success': False,
                'error': 'Suggestion not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error implementing suggestion: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ ADMIN DELETE SUGGESTION
    # ============================================
    
    @action(detail=False, methods=['delete'], url_path='admin-suggestions/(?P<suggestion_id>[^/.]+)/delete')
    def admin_delete_suggestion(self, request, suggestion_id=None):
        """Admin endpoint to delete a suggestion"""
        if not request.user.is_staff and not request.user.is_superuser and request.user.role != 'admin':
            return Response({
                'error': 'Permission denied. Admin or Staff only.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            suggestion = get_object_or_404(Suggestion, id=suggestion_id)
            suggestion.delete()
            
            return Response({
                'success': True,
                'message': 'Suggestion deleted successfully'
            })
            
        except Http404:
            return Response({
                'success': False,
                'error': 'Suggestion not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting suggestion: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # ✅ ADMIN DELETE SUGGESTION (Alternative - by pk)
    # ============================================
    
    @action(detail=True, methods=['delete'], url_path='admin-delete')
    def admin_delete(self, request, pk=None):
        """Admin endpoint to delete a suggestion by pk"""
        if not request.user.is_staff and not request.user.is_superuser and request.user.role != 'admin':
            return Response({
                'error': 'Permission denied. Admin or Staff only.'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            suggestion = self.get_object()
            suggestion.delete()
            
            return Response({
                'success': True,
                'message': 'Suggestion deleted successfully'
            })
            
        except Exception as e:
            logger.error(f"Error deleting suggestion: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
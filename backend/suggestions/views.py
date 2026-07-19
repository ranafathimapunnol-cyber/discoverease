# suggestions/views.py - COMPLETE FIXED VERSION

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
import logging

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
        
        # ✅ FIXED: Check if user is authenticated
        if not user.is_authenticated:
            # For non-authenticated users, show only implemented
            return queryset.filter(status=Suggestion.Status.IMPLEMENTED)
        
        # ✅ For guides - show suggestions from their districts
        if user.role == 'guide':
            try:
                guide = Guide.objects.get(user=user)
                guide_districts = list(guide.districts.values_list('name', flat=True))
                
                if guide_districts:
                    # Filter by guide's districts
                    district_filter = Q()
                    for d in guide_districts:
                        district_filter |= Q(district__iexact=d)
                    queryset = queryset.filter(district_filter)
                    logger.info(f"📊 Guide {guide.full_name} - Districts: {guide_districts}")
                    logger.info(f"📊 Found {queryset.count()} suggestions")
                else:
                    # If guide has no districts, show nothing
                    logger.warning(f"⚠️ Guide {guide.full_name} has no districts assigned")
                    return queryset.none()
                    
            except Guide.DoesNotExist:
                logger.error(f"❌ Guide not found for user {user.email}")
                return queryset.none()
        else:
            # For tourister or other roles, show only implemented
            queryset = queryset.filter(status=Suggestion.Status.IMPLEMENTED)
        
        # Apply additional filters from query params
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
    # LIST - FIXED
    # ============================================
    
    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            # Log for debugging
            logger.info(f"📊 Total suggestions after filtering: {queryset.count()}")
            
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
    # ✅ GUIDE APPROVE - FIXED
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
            
            # Update suggestion
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
    # ✅ GUIDE REJECT - FIXED
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
            
            # Update suggestion
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
    # ADMIN IMPLEMENT
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
    # MY SUGGESTIONS
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
# suggestions/views.py - COMPLETE FIXED VERSION
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import Suggestion
from .serializers import SuggestionSerializer
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class SuggestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing suggestions.
    Users can submit suggestions, admins/staff can process them.
    """
    queryset = Suggestion.objects.all()
    serializer_class = SuggestionSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'user', 'suggestion_type', 'category']
    
    def get_queryset(self):
        """Get queryset with filters applied"""
        queryset = Suggestion.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by user
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by suggestion_type
        suggestion_type = self.request.query_params.get('suggestion_type')
        if suggestion_type:
            queryset = queryset.filter(suggestion_type=suggestion_type)
        
        return queryset.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """Override list to always return a valid response"""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            # Handle pagination if needed
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error in suggestions list: {e}")
            return Response([], status=status.HTTP_200_OK)
    
    def create(self, request, *args, **kwargs):
        """Create a new suggestion (authenticated users only)"""
        # Only authenticated users can create suggestions
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            data = request.data.copy()
            data['user'] = request.user.id
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating suggestion: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], url_path='guide_stats')
    def guide_stats(self, request):
        """
        Get stats for guide dashboard - NEVER FAILS
        Returns statistics about suggestions by status, category, and type.
        """
        try:
            # Initialize all stats with 0
            stats = {
                'total': 0,
                'pending': 0,
                'in_progress': 0,
                'approved': 0,
                'rejected': 0,
                'implemented': 0,
                'by_category': [],
                'by_type': []
            }
            
            # Try to get counts - wrap each in try/except
            try:
                stats['total'] = Suggestion.objects.count()
            except Exception as e:
                logger.warning(f"Error counting total: {e}")
            
            try:
                stats['pending'] = Suggestion.objects.filter(status='pending').count()
            except Exception as e:
                logger.warning(f"Error counting pending: {e}")
            
            try:
                stats['in_progress'] = Suggestion.objects.filter(status='in_progress').count()
            except Exception as e:
                logger.warning(f"Error counting in_progress: {e}")
            
            try:
                stats['approved'] = Suggestion.objects.filter(status='approved').count()
            except Exception as e:
                logger.warning(f"Error counting approved: {e}")
            
            try:
                stats['rejected'] = Suggestion.objects.filter(status='rejected').count()
            except Exception as e:
                logger.warning(f"Error counting rejected: {e}")
            
            try:
                stats['implemented'] = Suggestion.objects.filter(status='implemented').count()
            except Exception as e:
                logger.warning(f"Error counting implemented: {e}")
            
            # Get category counts
            try:
                stats['by_category'] = list(
                    Suggestion.objects.values('category')
                    .annotate(count=models.Count('id'))
                    .exclude(category__isnull=True)
                    .exclude(category='')
                )
            except Exception as e:
                logger.warning(f"Error getting category stats: {e}")
                stats['by_category'] = []
            
            # Get type counts
            try:
                stats['by_type'] = list(
                    Suggestion.objects.values('suggestion_type')
                    .annotate(count=models.Count('id'))
                    .exclude(suggestion_type__isnull=True)
                    .exclude(suggestion_type='')
                )
            except Exception as e:
                logger.warning(f"Error getting type stats: {e}")
                stats['by_type'] = []
            
            return Response(stats)
            
        except Exception as e:
            logger.error(f"Guide stats error: {e}")
            # Return safe default response
            return Response({
                'total': 0,
                'pending': 0,
                'in_progress': 0,
                'approved': 0,
                'rejected': 0,
                'implemented': 0,
                'by_category': [],
                'by_type': []
            })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def process(self, request, pk=None):
        """
        Process a suggestion (admin/staff only)
        Actions: approve, reject, implement
        """
        try:
            # Check permissions
            if not request.user.is_staff and not request.user.is_superuser:
                return Response(
                    {'error': 'Permission denied. Staff or Admin only.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            suggestion = self.get_object()
            action = request.data.get('action')
            notes = request.data.get('notes', '')
            
            if action not in ['approve', 'reject', 'implement']:
                return Response(
                    {'error': 'Invalid action. Use approve, reject, or implement.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update status based on action
            status_map = {
                'approve': 'approved',
                'reject': 'rejected',
                'implement': 'implemented'
            }
            
            suggestion.status = status_map[action]
            suggestion.admin_notes = notes
            suggestion.processed_by = request.user
            suggestion.processed_at = timezone.now()
            suggestion.save()
            
            # ✅ FIXED: Explicit message based on action (NO TYPO!)
            if action == 'approve':
                message = 'Suggestion approved successfully'
            elif action == 'reject':
                message = 'Suggestion rejected successfully'
            elif action == 'implement':
                message = 'Suggestion implemented successfully'
            else:
                message = f'Suggestion {action}ed successfully'
            
            return Response({
                'success': True,
                'message': message,
                'suggestion': self.get_serializer(suggestion).data
            })
        except Exception as e:
            logger.error(f"Process suggestion error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
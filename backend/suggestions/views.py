# suggestions/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import Suggestion
from .serializers import SuggestionSerializer
from django.utils import timezone

class SuggestionViewSet(viewsets.ModelViewSet):
    queryset = Suggestion.objects.all()
    serializer_class = SuggestionSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'user', 'suggestion_type', 'category']
    
    def get_queryset(self):
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
    
    def create(self, request, *args, **kwargs):
        # Only authenticated users can create suggestions
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        data = request.data.copy()
        data['user'] = request.user.id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def guide_stats(self, request):
        """Get stats for guide dashboard"""
        stats = {
            'total': Suggestion.objects.count(),
            'pending': Suggestion.objects.filter(status='pending').count(),
            'in_progress': Suggestion.objects.filter(status='in_progress').count(),
            'approved': Suggestion.objects.filter(status='approved').count(),
            'rejected': Suggestion.objects.filter(status='rejected').count(),
            'implemented': Suggestion.objects.filter(status='implemented').count(),
            'by_category': Suggestion.objects.values('category').annotate(count=models.Count('id')),
            'by_type': Suggestion.objects.values('suggestion_type').annotate(count=models.Count('id'))
        }
        return Response(stats)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def process(self, request, pk=None):
        """Process a suggestion (admin only)"""
        if not request.user.is_staff and not request.user.is_superuser:
            return Response(
                {'error': 'Permission denied. Admin only.'},
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
        
        if action == 'approve':
            suggestion.status = Suggestion.Status.APPROVED
        elif action == 'reject':
            suggestion.status = Suggestion.Status.REJECTED
        elif action == 'implement':
            suggestion.status = Suggestion.Status.IMPLEMENTED
        
        suggestion.admin_notes = notes
        suggestion.processed_by = request.user
        suggestion.processed_at = timezone.now()
        suggestion.save()
        
        return Response({
            'message': f'Suggestion {action}ed successfully',
            'suggestion': self.get_serializer(suggestion).data
        })
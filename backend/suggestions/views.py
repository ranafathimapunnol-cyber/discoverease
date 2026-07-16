# suggestions/views.py - COMPLETE FIXED VERSION (NO DUPLICATE MODEL)

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
import logging

from .models import Suggestion  # ✅ Import the model from models.py
from .serializers import (
    SuggestionSerializer,
    SuggestionCreateSerializer,
    SuggestionListSerializer
)

logger = logging.getLogger(__name__)


class SuggestionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class SuggestionViewSet(viewsets.ModelViewSet):
    queryset = Suggestion.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'user', 'suggestion_type', 'category']
    pagination_class = SuggestionPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return SuggestionCreateSerializer
        elif self.action in ['list', 'my_suggestions']:
            return SuggestionListSerializer
        return SuggestionSerializer

    # ✅ CREATE - Returns 200 OK with success message
    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'message': 'Please login to submit a review'
            }, status=status.HTTP_401_UNAUTHORIZED)

        try:
            data = request.data.copy()
            
            # ✅ Auto-set suggestion_type to 'review'
            if not data.get('suggestion_type'):
                data['suggestion_type'] = 'review'
            
            serializer = SuggestionCreateSerializer(data=data)
            
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            # ✅ Save with user and status
            suggestion = serializer.save(
                user=request.user,
                status='pending'
            )

            # ✅ Return 200 OK
            return Response({
                'success': True,
                'message': '✅ Review submitted successfully!',
                'status': suggestion.status,
                'data': {
                    'id': suggestion.id,
                    'destination': suggestion.name,
                    'rating': suggestion.rating,
                    'status': suggestion.status,
                    'created_at': suggestion.created_at,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error creating suggestion: {e}")
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ✅ LIST - GET /api/suggestions/
    def list(self, request, *args, **kwargs):
        try:
            queryset = Suggestion.objects.all().order_by('-created_at')

            # Filter by status
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)

            # Role-based filtering
            user = request.user
            if user.is_authenticated:
                if user.role in ['staff', 'admin'] or user.is_staff or user.is_superuser:
                    pass
                elif hasattr(user, 'guide_profile') and user.guide_profile:
                    guide = user.guide_profile
                    districts = guide.districts.values_list('name', flat=True)
                    queryset = queryset.filter(district__in=districts)
                else:
                    queryset = queryset.filter(Q(user=user) | Q(status='implemented'))
            else:
                queryset = queryset.filter(status='implemented')

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
                'count': 0,
                'error': str(e)
            })

    @action(detail=False, methods=['get'], url_path='implemented')
    def implemented(self, request):
        try:
            suggestions = Suggestion.objects.filter(
                status='implemented'
            ).select_related('user').order_by('-created_at')

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
            logger.error(f"Error in implemented: {e}")
            return Response({
                'success': False,
                'data': [],
                'count': 0,
                'error': str(e)
            })

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
                'approved': suggestions.filter(status='approved').count(),
                'rejected': suggestions.filter(status='rejected').count(),
                'implemented': suggestions.filter(status='implemented').count(),
            }

            serializer = SuggestionListSerializer(suggestions, many=True)

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

    @action(detail=False, methods=['get'], url_path='guide-suggestions')
    def guide_suggestions(self, request):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'data': [],
                'count': 0
            })

        try:
            if not hasattr(request.user, 'guide_profile'):
                return Response({
                    'success': False,
                    'message': 'User is not a guide',
                    'data': [],
                    'count': 0
                })

            guide = request.user.guide_profile
            districts = guide.districts.values_list('name', flat=True)

            if not districts:
                return Response({
                    'success': True,
                    'data': [],
                    'count': 0
                })

            suggestions = Suggestion.objects.filter(
                district__in=districts,
                status__in=['pending', 'approved_by_guide']
            ).order_by('-created_at').select_related('user')

            serializer = SuggestionListSerializer(suggestions, many=True)

            return Response({
                'success': True,
                'data': serializer.data,
                'count': suggestions.count(),
                'districts': list(districts)
            })

        except Exception as e:
            return Response({
                'success': False,
                'data': [],
                'count': 0
            })

    @action(detail=True, methods=['post'], url_path='guide-process')
    def guide_process(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'message': 'Please login'
            })

        try:
            suggestion = self.get_object()
            user = request.user

            if not hasattr(user, 'guide_profile'):
                return Response({
                    'success': False,
                    'message': 'Only guides can process suggestions'
                })

            guide = user.guide_profile

            if not guide.districts.filter(name__iexact=suggestion.district).exists():
                return Response({
                    'success': False,
                    'message': 'This suggestion is not in your district'
                })

            if suggestion.status != 'pending':
                return Response({
                    'success': False,
                    'message': f'This suggestion is already {suggestion.status}'
                })

            action = request.data.get('action')
            notes = request.data.get('guide_notes', '')
            rejection_reason = request.data.get('rejection_reason', '')

            if action not in ['approve', 'reject']:
                return Response({
                    'success': False,
                    'message': 'Invalid action. Use approve or reject'
                })

            if action == 'approve':
                suggestion.status = 'approved_by_guide'
                suggestion.guide_notes = notes or 'Approved by guide'
                message = 'Suggestion approved by guide'
            else:
                suggestion.status = 'rejected_by_guide'
                suggestion.guide_notes = notes or 'Rejected by guide'
                suggestion.rejection_reason = rejection_reason or 'No reason provided'
                message = 'Suggestion rejected by guide'

            suggestion.guide = guide
            suggestion.guide_processed_at = timezone.now()
            suggestion.save()

            return Response({
                'success': True,
                'message': message,
                'data': {
                    'id': suggestion.id,
                    'status': suggestion.status,
                    'guide_notes': suggestion.guide_notes
                }
            })

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            })

    @action(detail=True, methods=['post'], url_path='process')
    def process(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'message': 'Please login'
            })

        try:
            user = request.user

            if user.role not in ['staff', 'admin'] and not user.is_staff and not user.is_superuser:
                return Response({
                    'success': False,
                    'message': 'Only staff or admin can process suggestions'
                })

            suggestion = self.get_object()
            action = request.data.get('action')
            notes = request.data.get('admin_notes', '')

            if action not in ['approve', 'reject', 'implement']:
                return Response({
                    'success': False,
                    'message': 'Invalid action. Use approve, reject, or implement'
                })

            if suggestion.status not in ['pending', 'approved_by_guide']:
                return Response({
                    'success': False,
                    'message': f'Cannot process suggestion with status: {suggestion.status}'
                })

            if action == 'approve':
                suggestion.status = 'approved'
                suggestion.admin_notes = notes or 'Approved by staff'
                message = 'Suggestion approved successfully'
            elif action == 'reject':
                suggestion.status = 'rejected'
                suggestion.admin_notes = notes or 'Rejected by staff'
                message = 'Suggestion rejected successfully'
            else:
                suggestion.status = 'implemented'
                suggestion.admin_notes = notes or 'Implemented by staff'
                message = 'Suggestion implemented successfully'

            suggestion.processed_by = user
            suggestion.processed_at = timezone.now()
            suggestion.save()

            return Response({
                'success': True,
                'message': message,
                'data': {
                    'id': suggestion.id,
                    'status': suggestion.status,
                    'admin_notes': suggestion.admin_notes
                }
            })

        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            })

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        try:
            stats = {
                'total': Suggestion.objects.count(),
                'pending': Suggestion.objects.filter(status='pending').count(),
                'approved_by_guide': Suggestion.objects.filter(status='approved_by_guide').count(),
                'rejected_by_guide': Suggestion.objects.filter(status='rejected_by_guide').count(),
                'approved': Suggestion.objects.filter(status='approved').count(),
                'rejected': Suggestion.objects.filter(status='rejected').count(),
                'implemented': Suggestion.objects.filter(status='implemented').count(),
            }

            return Response({
                'success': True,
                'data': stats
            })

        except Exception as e:
            return Response({
                'success': False,
                'data': {
                    'total': 0,
                    'pending': 0,
                    'approved_by_guide': 0,
                    'rejected_by_guide': 0,
                    'approved': 0,
                    'rejected': 0,
                    'implemented': 0
                }
            })
# destinations/filters.py - COMPLETE FIXED (NO Category class!)

from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Destination

class DestinationFilter(filters.FilterSet):
    """Custom filter for destinations"""
    # ✅ Use the CategoryChoice from Destination model
    category = filters.ChoiceFilter(choices=Destination.CategoryChoice.choices)
    status = filters.ChoiceFilter(choices=Destination.Status.choices)
    district = filters.CharFilter(lookup_expr='icontains')
    type = filters.CharFilter(lookup_expr='icontains')
    min_rating = filters.NumberFilter(field_name='average_rating', lookup_expr='gte')
    max_rating = filters.NumberFilter(field_name='average_rating', lookup_expr='lte')
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    search = filters.CharFilter(method='filter_search')
    
    class Meta:
        model = Destination
        fields = ['category', 'status', 'district', 'type', 'min_rating', 'max_rating']
    
    def filter_search(self, queryset, name, value):
        """Search across multiple fields"""
        return queryset.filter(
            Q(name__icontains=value) |
            Q(short_description__icontains=value) |
            Q(long_description__icontains=value) |
            Q(district__icontains=value) |
            Q(address__icontains=value)
        )
import re

with open('guides/views.py', 'r') as f:
    content = f.read()

# Find and replace the entire get_queryset method
pattern = r'def get_queryset\(self\):.*?(?=def |@action|$)'

new_method = '''    def get_queryset(self):
        queryset = super().get_queryset()
        
        # ✅ Get district by NAME, not ID
        district = self.request.query_params.get('district')
        if district:
            queryset = queryset.filter(districts__name__icontains=district)
        
        # Date filter
        date = self.request.query_params.get('date')
        if date:
            from .models import GuideAvailability
            available_guides = GuideAvailability.objects.filter(
                date=date,
                is_booked=False
            ).values_list('guide_id', flat=True)
            queryset = queryset.filter(id__in=available_guides)
        
        # Category filter
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(categories__name__icontains=category)
        
        # Price filters
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price_per_day__gte=min_price)
        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price_per_day__lte=max_price)
        
        # Language filter
        language = self.request.query_params.get('language')
        if language:
            queryset = queryset.filter(languages__icontains=language)
        
        return queryset'''

# Replace the method
content = re.sub(pattern, new_method, content, flags=re.DOTALL)

with open('guides/views.py', 'w') as f:
    f.write(content)

print("✅ Replaced get_queryset method")

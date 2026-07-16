import re

with open('destinations/views.py', 'r') as f:
    content = f.read()

# Find the get_categories method and replace it
old_method = '''@action(detail=False, methods=['get'], url_path='categories')
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
        return Response(categories)'''

new_method = '''@action(detail=False, methods=['get'], url_path='categories')
    def get_categories(self, request):
        """Get categories from database - FIXED"""
        try:
            from .models import CategoryData, CategoryPlace
            
            categories = CategoryData.objects.filter(is_active=True)
            
            if not categories.exists():
                # Fallback to default categories
                return Response(self._get_default_categories())
            
            result = []
            for cat in categories:
                # Count places for this category
                count = CategoryPlace.objects.filter(
                    category=cat.key,
                    is_active=True
                ).count()
                
                result.append({
                    'key': cat.key,
                    'label': cat.title or cat.key,
                    'count': count,
                    'description': cat.description or f'Explore {cat.title} in Kerala',
                    'image': cat.image or self._get_category_image(cat.key)
                })
            
            return Response(result)
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching categories: {e}")
            return Response(self._get_default_categories())

    def _get_default_categories(self):
        """Default categories fallback"""
        return [
            {"key": "beach", "label": "Beach", "count": 0, 
             "description": "Kerala's stunning coastline with golden sands and palm-fringed shores",
             "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80"},
            {"key": "hill", "label": "Hill Station", "count": 0,
             "description": "Misty mountains, tea plantations, trekking trails and cool retreats",
             "image": "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=80"},
            {"key": "backwater", "label": "Backwater", "count": 0,
             "description": "Serene canals, lagoons, and houseboat destinations",
             "image": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80"},
            {"key": "heritage", "label": "Heritage", "count": 0,
             "description": "Ancient forts, palaces, and historical sites",
             "image": "https://i.pinimg.com/736x/d0/a5/a5/d0a5a56573a329cb0ac8c75c97f8b2ba.jpg"},
            {"key": "wildlife", "label": "Wildlife", "count": 0,
             "description": "National parks, tiger reserves, butterfly sanctuaries, and bird sanctuaries",
             "image": "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80"},
            {"key": "temple", "label": "Temple", "count": 0,
             "description": "Temples, churches, mosques, and spiritual sites",
             "image": "https://i.pinimg.com/736x/53/8a/12/538a12040c1ee7b51bae7d8b0b939f13.jpg"},
            {"key": "waterfalls", "label": "Waterfalls", "count": 0,
             "description": "Spectacular cascades from hidden gems to famous falls",
             "image": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80"},
            {"key": "fort", "label": "Fort/Palace", "count": 0,
             "description": "Ancient forts and palaces",
             "image": "https://i.pinimg.com/736x/d0/a5/a5/d0a5a56573a329cb0ac8c75c97f8b2ba.jpg"},
            {"key": "other", "label": "Other", "count": 0,
             "description": "Hidden gems and unique destinations",
             "image": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80"},
        ]'''

if old_method in content:
    content = content.replace(old_method, new_method)
    with open('destinations/views.py', 'w') as f:
        f.write(content)
    print("✅ Fixed get_categories method")
else:
    print("❌ Could not find the exact method, please manually update")
    print("\nLook for 'def get_categories' in destinations/views.py")
    print("and replace it with the new version.")

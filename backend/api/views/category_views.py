# api/views/category_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from destinations.models import CategoryData, CategoryPlace


class CategoryDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all category data with their places"""
        try:
            categories = CategoryData.objects.filter(is_active=True).order_by('title')
            
            result = []
            for cat in categories:
                places = CategoryPlace.objects.filter(
                    category=cat.key, 
                    is_active=True
                ).order_by('name')
                
                place_list = []
                for place in places:
                    place_list.append({
                        'id': place.id,
                        'name': place.name,
                        'location': place.location,
                        'district': place.district or '',
                        'description': place.description,
                        'difficulty': place.difficulty or '',
                        'duration': place.duration or '',
                        'bestTime': place.best_time or '',
                        'image': place.image or 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                        'type': place.type or 'well-known',
                        'hiddenGem': place.hidden_gem or '',
                    })
                
                result.append({
                    'key': cat.key,
                    'title': cat.title,
                    'description': cat.description,
                    'type': cat.type or 'Nature & Outdoor',
                    'icon': cat.icon or '',
                    'image': cat.image or '',
                    'count': places.count(),
                    'places': place_list
                })
            
            return Response({
                'success': True,
                'data': result
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, category_key):
        """Get a specific category with its places"""
        try:
            category = CategoryData.objects.get(key=category_key, is_active=True)
            
            places = CategoryPlace.objects.filter(
                category=category_key,
                is_active=True
            ).order_by('name')
            
            place_list = []
            for place in places:
                place_list.append({
                    'id': place.id,
                    'name': place.name,
                    'location': place.location,
                    'district': place.district or '',
                    'description': place.description,
                    'difficulty': place.difficulty or '',
                    'duration': place.duration or '',
                    'bestTime': place.best_time or '',
                    'image': place.image or 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                    'type': place.type or 'well-known',
                    'hiddenGem': place.hidden_gem or '',
                })
            
            return Response({
                'success': True,
                'data': {
                    'key': category.key,
                    'title': category.title,
                    'description': category.description,
                    'type': category.type or 'Nature & Outdoor',
                    'places': place_list
                }
            })
            
        except CategoryData.DoesNotExist:
            return Response({
                'success': False,
                'message': f'Category "{category_key}" not found',
                'data': None
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e),
                'data': None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
import re

with open('suggestions/views.py', 'r') as f:
    content = f.read()

# Find the implemented method and replace it
pattern = r'@action\(detail=False, methods=\[\'get\'\], url_path=\'implemented\'\)\s+def implemented\(self, request\):.*?(?=@action|def |$)'

new_code = '''@action(detail=False, methods=['get'], url_path='implemented')
    def implemented(self, request):
        """Get all implemented suggestions - FIXED"""
        try:
            suggestions = Suggestion.objects.filter(
                status='implemented'
            ).select_related('user', 'guide', 'processed_by').order_by('-created_at')
            
            # Manual pagination
            from rest_framework.pagination import PageNumberPagination
            paginator = PageNumberPagination()
            paginator.page_size = 20
            page = paginator.paginate_queryset(suggestions, request)
            
            if page is not None:
                serializer = SuggestionSerializer(page, many=True)
                return paginator.get_paginated_response({
                    'success': True,
                    'status': 200,
                    'message': f'Showing {len(page)} of {suggestions.count()} implemented suggestions',
                    'data': serializer.data,
                    'count': suggestions.count()
                })
            
            serializer = SuggestionSerializer(suggestions, many=True)
            return Response({
                'success': True,
                'status': 200,
                'message': f'Found {suggestions.count()} implemented suggestions',
                'data': serializer.data,
                'count': suggestions.count()
            })
            
        except Exception as e:
            import traceback
            return Response({
                'success': False,
                'status': 200,
                'message': 'Error fetching implemented suggestions',
                'error': str(e),
                'traceback': traceback.format_exc(),
                'data': [],
                'count': 0
            })'''

# Find and replace the method
import re
# Find the start of the implemented method
start = content.find('@action(detail=False, methods=[\'get\'], url_path=\'implemented\')')
if start == -1:
    start = content.find('@action(detail=False, methods=["get"], url_path="implemented")')
if start == -1:
    print("❌ Could not find the implemented method")
    print("Please manually update the view")
    exit()

# Find the end of the method
end = content.find('@action', start + 1)
if end == -1:
    end = content.find('def ', start + 1)
    if end == -1:
        end = len(content)

# Replace the content
content = content[:start] + new_code + content[end:]

with open('suggestions/views.py', 'w') as f:
    f.write(content)

print("✅ Fixed implemented view")
print("🔄 Please restart your server")

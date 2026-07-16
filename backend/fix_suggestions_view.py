import re

with open('suggestions/views.py', 'r') as f:
    content = f.read()

# Find and replace the entire list method
old_list = '''    def list(self, request, *args, **kwargs):
        """List suggestions with filters - ALWAYS returns 200"""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            
            # If user is authenticated and has specific role, filter accordingly
            user = request.user
            if user.is_authenticated:
                # Guides see only their district suggestions
                if hasattr(user, 'guide_profile') and user.guide_profile:
                    guide = user.guide_profile
                    districts = guide.districts.values_list('name', flat=True)
                    queryset = queryset.filter(district__in=districts)
                
                # Staff and Admin see all
                elif user.role in ['staff', 'admin'] or user.is_staff or user.is_superuser:
                    queryset = queryset.all()
                
                # Tourister sees their own + implemented from others
                else:
                    queryset = queryset.filter(
                        Q(user=user) | Q(status='implemented')
                    )
            else:
                # Public only sees implemented
                queryset = queryset.filter(status='implemented')
            
            # Apply pagination
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response({
                    'success': True,
                    'status': 200,
                    'data': serializer.data,
                    'count': queryset.count()
                })
            
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                'success': True,
                'status': 200,
                'data': serializer.data,
                'count': queryset.count()
            })
            
        except Exception as e:
            logger.error(f"Error in suggestions list: {e}")
            return Response({
                'success': False,
                'status': 200,
                'message': 'Unable to fetch suggestions',
                'error': str(e) if request.GET.get('debug') else None,
                'data': [],
                'count': 0
            })'''

new_list = '''    def list(self, request, *args, **kwargs):
        """List suggestions with filters - SIMPLIFIED FIXED"""
        try:
            # Start with all suggestions
            queryset = Suggestion.objects.all().order_by('-created_at')
            
            # Check if status filter is applied
            status_filter = request.query_params.get('status')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
                print(f"📊 Filtering by status: {status_filter}, found {queryset.count()}")
            
            # If user is authenticated, apply additional filters
            user = request.user
            if user.is_authenticated:
                # Staff and Admin see all
                if user.role in ['staff', 'admin'] or user.is_staff or user.is_superuser:
                    pass  # Keep all
                # Guides see only their district suggestions
                elif hasattr(user, 'guide_profile') and user.guide_profile:
                    guide = user.guide_profile
                    districts = guide.districts.values_list('name', flat=True)
                    queryset = queryset.filter(district__in=districts)
                # Tourister sees their own + implemented from others
                else:
                    queryset = queryset.filter(
                        Q(user=user) | Q(status='implemented')
                    )
            else:
                # Public only sees implemented
                queryset = queryset.filter(status='implemented')
            
            # Serialize
            serializer = self.get_serializer(queryset, many=True)
            
            return Response({
                'success': True,
                'status': 200,
                'message': f'Found {queryset.count()} suggestions',
                'data': serializer.data,
                'count': queryset.count()
            })
            
        except Exception as e:
            import traceback
            print(f"❌ Error in suggestions list: {e}")
            traceback.print_exc()
            return Response({
                'success': False,
                'status': 200,
                'message': 'Unable to fetch suggestions',
                'error': str(e),
                'data': [],
                'count': 0
            })'''

if old_list in content:
    content = content.replace(old_list, new_list)
    with open('suggestions/views.py', 'w') as f:
        f.write(content)
    print("✅ Fixed list view")
else:
    print("❌ Could not find the method, manually updating...")
    # Try a different approach - find by pattern
    import re
    pattern = r'def list\(self, request, \*args, \*\*kwargs\):.*?(?=def |@action|$)'
    if re.search(pattern, content, re.DOTALL):
        content = re.sub(pattern, new_list, content, flags=re.DOTALL)
        with open('suggestions/views.py', 'w') as f:
            f.write(content)
        print("✅ Fixed list view using regex")
    else:
        print("❌ Could not find the list method")

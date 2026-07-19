# admin_dashboard/views.py - COMPLETE FIXED

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

try:
    from suggestions.models import Suggestion
    SUGGESTIONS_AVAILABLE = True
except ImportError:
    SUGGESTIONS_AVAILABLE = False
    Suggestion = None


class AdminViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _check_admin_access(self, request):
        return request.user.role == 'admin' or request.user.is_superuser

    # ============================================
    # GET /api/admin/stats/ - ✅ FIXED
    # ============================================
    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            from guides.models import Guide, GuideBooking
            
            # ✅ Count ALL users by role
            total_users = User.objects.filter(is_deleted=False).count()
            total_touristers = User.objects.filter(role='tourister', is_deleted=False).count()
            total_staff = User.objects.filter(role='staff', is_deleted=False).count()
            total_guides = Guide.objects.filter(is_active=True).count()
            total_admins = User.objects.filter(role='admin', is_deleted=False).count()
            
            stats = {
                'totalUsers': total_touristers,  # Keep this for backward compatibility
                'totalTouristers': total_touristers,
                'totalStaff': total_staff,
                'totalGuides': total_guides,
                'totalAdmins': total_admins,
                'totalAllUsers': total_users,
                'totalBookings': GuideBooking.objects.count(),
                'totalSuggestions': Suggestion.objects.count() if SUGGESTIONS_AVAILABLE else 0,
                'pendingSuggestions': Suggestion.objects.filter(status='pending').count() if SUGGESTIONS_AVAILABLE else 0,
            }
            
            print(f"📊 Stats: Touristers={total_touristers}, Staff={total_staff}, Guides={total_guides}, Admins={total_admins}")
            
            return Response({'success': True, 'stats': stats})
        except Exception as e:
            logger.error(f"Stats error: {e}")
            return Response({
                'success': True, 
                'stats': {
                    'totalUsers': 0, 
                    'totalTouristers': 0,
                    'totalStaff': 0, 
                    'totalGuides': 0,
                    'totalAdmins': 0,
                    'totalAllUsers': 0,
                    'totalBookings': 0, 
                    'totalSuggestions': 0, 
                    'pendingSuggestions': 0
                }
            })

    # ============================================
    # GET /api/admin/users/ - ✅ FIXED - SHOWS ALL USERS
    # ============================================
    @action(detail=False, methods=['get'], url_path='users')
    def users(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            # ✅ Get ALL non-deleted users with ALL roles
            users = User.objects.filter(is_deleted=False).order_by('-date_joined')
            
            data = [{
                'id': u.id, 
                'email': u.email, 
                'username': u.username, 
                'first_name': u.first_name, 
                'last_name': u.last_name, 
                'phone': u.phone, 
                'is_active': u.is_active, 
                'role': u.role,
                'email_verified': u.email_verified,
                'date_joined': u.date_joined.isoformat() if u.date_joined else None,
                'last_login': u.last_login.isoformat() if u.last_login else None,
            } for u in users]
            
            # Debug logging
            roles = {}
            for u in data:
                roles[u['role']] = roles.get(u['role'], 0) + 1
            
            print(f"📊 Admin users API: Total={len(data)}, Roles={roles}")
            
            return Response({
                'success': True, 
                'users': data,
                'count': len(data),
                'roles': roles  # Include role breakdown
            })
        except Exception as e:
            logger.error(f"Error fetching users: {e}")
            return Response({
                'success': False, 
                'error': str(e)
            }, status=400)

    # ============================================
    # GET /api/admin/users/touristers/ - ✅ GET ONLY TOURISTERS
    # ============================================
    @action(detail=False, methods=['get'], url_path='users/touristers')
    def touristers(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            users = User.objects.filter(role='tourister', is_deleted=False).order_by('-date_joined')
            data = [{
                'id': u.id, 
                'email': u.email, 
                'username': u.username, 
                'first_name': u.first_name, 
                'last_name': u.last_name, 
                'phone': u.phone, 
                'is_active': u.is_active, 
                'role': u.role,
                'email_verified': u.email_verified,
                'date_joined': u.date_joined.isoformat() if u.date_joined else None,
            } for u in users]
            
            print(f"📊 Touristers API: Found {len(data)} touristers")
            
            return Response({
                'success': True, 
                'users': data,
                'count': len(data)
            })
        except Exception as e:
            logger.error(f"Error fetching touristers: {e}")
            return Response({
                'success': False, 
                'error': str(e)
            }, status=400)

    # ============================================
    # POST /api/admin/users/{id}/toggle-status/
    # ============================================
    @action(detail=True, methods=['post'], url_path='users/toggle-status')
    def toggle_user_status(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            user = get_object_or_404(User, id=pk, is_deleted=False)
            
            if user.id == request.user.id:
                return Response({
                    'success': False,
                    'error': 'Cannot change your own status'
                }, status=400)
            
            user.is_active = not user.is_active
            user.save()
            
            return Response({
                'success': True, 
                'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
                'is_active': user.is_active
            })
        except Exception as e:
            logger.error(f"Toggle user status error: {e}")
            return Response({
                'success': False, 
                'error': str(e)
            }, status=400)

    # ============================================
    # DELETE /api/admin/users/{id}/
    # ============================================
    @action(detail=True, methods=['delete'], url_path='users')
    def delete_user(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            user = get_object_or_404(User, id=pk)
            
            if user.id == request.user.id:
                return Response({
                    'success': False,
                    'error': 'Cannot delete your own account'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.is_deleted = True
            user.is_active = False
            user.deleted_at = timezone.now()
            user.save()
            
            return Response({
                'success': True,
                'message': 'User deleted successfully'
            })
        except Exception as e:
            logger.error(f"Delete user error: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # ============================================
    # GET /api/admin/staff/
    # ============================================
    @action(detail=False, methods=['get'], url_path='staff')
    def staff_list(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            staff = User.objects.filter(role='staff', is_deleted=False)
            data = [{
                'id': u.id, 
                'email': u.email, 
                'username': u.username, 
                'first_name': u.first_name, 
                'last_name': u.last_name, 
                'phone': u.phone, 
                'is_active': u.is_active,
                'date_joined': u.date_joined.isoformat() if u.date_joined else None,
            } for u in staff]
            return Response({'success': True, 'staff': data, 'count': len(data)})
        except Exception as e:
            logger.error(f"Staff list error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /api/admin/staff/add/
    # ============================================
    @action(detail=False, methods=['post'], url_path='staff/add')
    def add_staff(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            
            if not email or not password:
                return Response({'error': 'Email and password required'}, status=400)
            
            if User.objects.filter(email=email).exists():
                return Response({'error': 'User already exists'}, status=400)
            
            user = User.objects.create_user(
                email=email, 
                username=email.split('@')[0], 
                password=password, 
                role='staff', 
                is_active=True, 
                is_staff=True,
                email_verified=True
            )
            
            return Response({
                'success': True, 
                'message': 'Staff added successfully', 
                'staff': {
                    'id': user.id, 
                    'email': user.email,
                    'is_active': user.is_active
                }
            })
        except Exception as e:
            logger.error(f"Add staff error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /api/admin/staff/{id}/toggle-status/
    # ============================================
    @action(detail=True, methods=['post'], url_path='staff/toggle-status')
    def toggle_staff_status(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            user = get_object_or_404(User, id=pk, role='staff', is_deleted=False)
            
            if user.id == request.user.id:
                return Response({
                    'success': False,
                    'error': 'Cannot change your own status'
                }, status=400)
            
            user.is_active = not user.is_active
            user.save()
            
            return Response({
                'success': True, 
                'message': f'Staff {"activated" if user.is_active else "deactivated"} successfully'
            })
        except Exception as e:
            logger.error(f"Toggle staff status error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # DELETE /api/admin/staff/{id}/
    # ============================================
    @action(detail=True, methods=['delete'], url_path='staff')
    def delete_staff(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            user = get_object_or_404(User, id=pk, role='staff')
            
            if user.id == request.user.id:
                return Response({
                    'success': False,
                    'error': 'Cannot delete your own account'
                }, status=400)
            
            user.is_deleted = True
            user.is_active = False
            user.save()
            
            return Response({'success': True, 'message': 'Staff deleted successfully'})
        except Exception as e:
            logger.error(f"Delete staff error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GET /api/admin/guides/ - ✅ FIXED
    # ============================================
    @action(detail=False, methods=['get'], url_path='guides')
    def guides_list(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            from guides.models import Guide
            
            # ✅ Get ALL guides including inactive ones
            guides = Guide.objects.all().select_related('user')
            
            total_guides = guides.count()
            active_guides = guides.filter(is_active=True).count()
            verified_guides = guides.filter(is_verified=True).count()
            
            data = []
            for g in guides:
                data.append({
                    'id': g.id,
                    'full_name': g.full_name,
                    'email': g.email,
                    'phone': g.phone_number,
                    'is_verified': g.is_verified,
                    'is_active': g.is_active,
                    'experience_years': g.years_of_experience or 0,
                    'primary_district': g.districts.first().name if g.districts.exists() else 'N/A',
                    'booking_count': 0,
                    'user_id': g.user.id if g.user else None,
                })
            
            print(f"📊 Guides API: Total={total_guides}, Active={active_guides}, Verified={verified_guides}")
            
            return Response({
                'success': True, 
                'guides': data,
                'count': total_guides,
                'active_count': active_guides,
                'verified_count': verified_guides
            })
        except Exception as e:
            logger.error(f"Guides list error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GET /api/admin/guides/{id}/bookings/
    # ============================================
    @action(detail=True, methods=['get'], url_path='guides/bookings')
    def guide_bookings(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            from guides.models import Guide, GuideBooking
            guide = get_object_or_404(Guide, id=pk)
            bookings = GuideBooking.objects.filter(guide=guide).order_by('-created_at')
            data = [{
                'id': b.id,
                'booking_id': b.booking_id,
                'traveler_email': b.user.email if b.user else '',
                'date': b.date.isoformat() if b.date else None,
                'time': b.time.strftime('%H:%M') if b.time else None,
                'status': b.status,
            } for b in bookings]
            return Response({'success': True, 'bookings': data, 'guide_name': guide.full_name})
        except Exception as e:
            logger.error(f"Guide bookings error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /api/admin/guides/{id}/toggle-status/
    # ============================================
    @action(detail=True, methods=['post'], url_path='guides/toggle-status')
    def toggle_guide_status(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            from guides.models import Guide
            guide = get_object_or_404(Guide, id=pk)
            guide.is_active = not guide.is_active
            guide.save()
            if guide.user:
                guide.user.is_active = guide.is_active
                guide.user.save()
            return Response({
                'success': True, 
                'message': f'Guide {"activated" if guide.is_active else "deactivated"} successfully'
            })
        except Exception as e:
            logger.error(f"Toggle guide status error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /api/admin/guides/{id}/verify/
    # ============================================
    @action(detail=True, methods=['post'], url_path='guides/verify')
    def verify_guide(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            from guides.models import Guide
            guide = get_object_or_404(Guide, id=pk)
            guide.is_verified = True
            guide.save()
            return Response({'success': True, 'message': 'Guide verified'})
        except Exception as e:
            logger.error(f"Verify guide error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # POST /api/admin/guides/add/
    # ============================================
    @action(detail=False, methods=['post'], url_path='guides/add')
    def add_guide(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            from guides.models import Guide, District
            
            data = request.data
            
            full_name = data.get('full_name', '').strip()
            email = data.get('email', '').strip()
            password = data.get('password', 'guide123456')
            phone = data.get('phone', '').strip()
            bio = data.get('bio', '').strip()
            experience_years = int(data.get('experience_years', 0) or 0)
            languages = data.get('languages', '').strip()
            primary_district_name = data.get('primary_district', '').strip()
            price_per_day = float(data.get('price_per_day', 0) or 0)
            price_per_hour = float(data.get('price_per_hour', 0) or 0)
            is_verified = data.get('is_verified', True)
            is_active = data.get('is_active', True)

            if not full_name:
                return Response({'error': 'Full name is required'}, status=400)
            if not email:
                return Response({'error': 'Email is required'}, status=400)
            if not password:
                return Response({'error': 'Password is required'}, status=400)
            
            if User.objects.filter(email=email).exists():
                return Response({'error': 'User with this email already exists'}, status=400)

            user = User.objects.create_user(
                email=email,
                username=email.split('@')[0],
                password=password,
                first_name=full_name.split()[0] if full_name else '',
                last_name=' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else '',
                role='guide',
                is_active=is_active,
                email_verified=True,
            )

            guide = Guide.objects.create(
                user=user,
                full_name=full_name,
                email=email,
                phone_number=phone,
                bio=bio,
                years_of_experience=experience_years,
                languages=languages,
                price_per_day=price_per_day,
                price_per_hour=price_per_hour,
                is_verified=is_verified,
                is_active=is_active,
            )

            if primary_district_name:
                try:
                    district = District.objects.filter(name__exact=primary_district_name).first()
                    if district:
                        guide.districts.add(district)
                except Exception as e:
                    logger.warning(f"Could not add district: {e}")

            return Response({
                'success': True,
                'message': 'Guide added successfully',
                'password': password,
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'email': guide.email,
                    'phone': guide.phone_number,
                    'is_verified': guide.is_verified,
                    'is_active': guide.is_active,
                    'primary_district': primary_district_name,
                    'experience_years': guide.years_of_experience,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error adding guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # PUT /api/admin/guides/{id}/
    # ============================================
    @action(detail=True, methods=['put'], url_path='guides')
    def update_guide(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            from guides.models import Guide
            guide = get_object_or_404(Guide, id=pk)
            data = request.data
            
            if 'full_name' in data:
                guide.full_name = data.get('full_name')
            if 'phone' in data:
                guide.phone_number = data.get('phone')
            if 'bio' in data:
                guide.bio = data.get('bio')
            if 'experience_years' in data:
                guide.years_of_experience = int(data.get('experience_years') or 0)
            if 'languages' in data:
                guide.languages = data.get('languages')
            if 'price_per_day' in data:
                guide.price_per_day = float(data.get('price_per_day') or 0)
            if 'price_per_hour' in data:
                guide.price_per_hour = float(data.get('price_per_hour') or 0)
            if 'is_verified' in data:
                guide.is_verified = data.get('is_verified')
            if 'is_active' in data:
                guide.is_active = data.get('is_active')
            
            guide.save()
            
            if guide.user and 'is_active' in data:
                guide.user.is_active = guide.is_active
                guide.user.save()
            
            return Response({
                'success': True,
                'message': 'Guide updated successfully',
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'email': guide.email,
                    'phone': guide.phone_number,
                    'is_verified': guide.is_verified,
                    'is_active': guide.is_active,
                }
            })
        except Exception as e:
            logger.error(f"Error updating guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # DELETE /api/admin/guides/{id}/
    # ============================================
    @action(detail=True, methods=['delete'], url_path='guides')
    def delete_guide(self, request, pk=None):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            from guides.models import Guide
            guide = get_object_or_404(Guide, id=pk)
            guide.is_active = False
            guide.save()
            if guide.user:
                guide.user.is_active = False
                guide.user.save()
            return Response({'success': True, 'message': 'Guide deleted'})
        except Exception as e:
            logger.error(f"Delete guide error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GET /api/admin/suggestions/
    # ============================================
    @action(detail=False, methods=['get'], url_path='suggestions')
    def admin_suggestions(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            if not SUGGESTIONS_AVAILABLE or Suggestion is None:
                return Response({'success': True, 'suggestions': []})
            suggestions = Suggestion.objects.all().order_by('-created_at')
            data = []
            for s in suggestions:
                data.append({
                    'id': s.id,
                    'name': s.name,
                    'description': s.description,
                    'category': s.category,
                    'status': s.status,
                    'district': getattr(s, 'district', ''),
                    'user_email': s.user.email if s.user else 'Anonymous',
                    'admin_notes': s.admin_notes,
                    'processed_by': s.processed_by.email if s.processed_by else None,
                    'processed_at': s.processed_at.isoformat() if s.processed_at else None,
                    'created_at': s.created_at.isoformat() if hasattr(s, 'created_at') else None,
                })
            return Response({'success': True, 'suggestions': data})
        except Exception as e:
            logger.error(f"Admin suggestions error: {e}")
            return Response({'success': True, 'suggestions': []})

    # ============================================
    # GET /api/admin/bookings/
    # ============================================
    @action(detail=False, methods=['get'], url_path='bookings')
    def admin_bookings(self, request):
        if not self._check_admin_access(request):
            return Response({'error': 'Admin access required'}, status=403)
        try:
            from guides.models import GuideBooking
            bookings = GuideBooking.objects.all().order_by('-created_at')
            data = [{
                'id': b.id,
                'booking_id': b.booking_id,
                'traveler_email': b.user.email if b.user else '',
                'guide_name': b.guide.full_name if b.guide else 'Unknown',
                'date': b.date.isoformat() if b.date else None,
                'status': b.status
            } for b in bookings]
            return Response({'success': True, 'bookings': data})
        except Exception as e:
            logger.error(f"Admin bookings error: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)

    # ============================================
    # GET /api/admin/test/
    # ============================================
    @action(detail=False, methods=['get'], url_path='test')
    def test(self, request):
        return Response({
            'success': True, 
            'message': 'Admin API working!', 
            'user': request.user.email,
            'role': request.user.role
        })
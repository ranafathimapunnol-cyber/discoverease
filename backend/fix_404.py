import os

def fix_verify_guide():
    """Fix verify_guide to return 404 instead of 400"""
    path = 'staff/views.py'
    with open(path, 'r') as f:
        content = f.read()
    
    # Fix the verify_guide method
    old_verify = '''    @action(detail=True, methods=['post'], url_path='verify')
    def verify_guide(self, request, pk=None):
        """Verify a guide (Staff & Admin)"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            guide = get_object_or_404(Guide, id=pk)
            guide.is_verified = True
            guide.verified_by = request.user
            guide.save()
            
            self._log_activity(request, 'verify', 'Guide', guide.id, {
                'guide_name': guide.full_name,
                'verified_by': request.user.email
            })
            
            return Response({
                'success': True,
                'message': 'Guide verified successfully',
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'is_verified': guide.is_verified,
                }
            })
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)'''
    
    new_verify = '''    @action(detail=True, methods=['post'], url_path='verify')
    def verify_guide(self, request, pk=None):
        """Verify a guide (Staff & Admin)"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            guide = get_object_or_404(Guide, id=pk)
            guide.is_verified = True
            guide.verified_by = request.user
            guide.save()
            
            self._log_activity(request, 'verify', 'Guide', guide.id, {
                'guide_name': guide.full_name,
                'verified_by': request.user.email
            })
            
            return Response({
                'success': True,
                'message': 'Guide verified successfully',
                'guide': {
                    'id': guide.id,
                    'full_name': guide.full_name,
                    'is_verified': guide.is_verified,
                }
            })
        except Exception as e:
            if hasattr(e, 'status_code') and e.status_code == 404:
                raise
            logger.error(f"Error verifying guide: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)'''
    
    content = content.replace(old_verify, new_verify)
    
    # Fix the update_booking method
    old_update = '''    @action(detail=True, methods=['post'], url_path='update')
    def update_booking(self, request, pk=None):
        """Update booking status (Staff & Admin)"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            booking = get_object_or_404(GuideBooking, id=pk)
            status_val = request.data.get('status')
            
            valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected']
            if status_val not in valid_statuses:
                return Response({'error': 'Invalid status'}, status=400)
            
            booking.status = status_val
            booking.save()
            
            self._log_activity(request, 'update', 'Booking', booking.id, {
                'booking_id': booking.booking_id,
                'new_status': status_val
            })
            
            return Response({
                'success': True,
                'message': f'Booking {status_val} successfully',
                'booking': {'id': booking.id, 'booking_id': booking.booking_id, 'status': booking.status}
            })
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=400)'''
    
    new_update = '''    @action(detail=True, methods=['post'], url_path='update')
    def update_booking(self, request, pk=None):
        """Update booking status (Staff & Admin)"""
        if not self._check_staff_access(request):
            return Response({'error': 'Staff access required'}, status=403)

        try:
            booking = get_object_or_404(GuideBooking, id=pk)
            status_val = request.data.get('status')
            
            valid_statuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected']
            if status_val not in valid_statuses:
                return Response({'error': 'Invalid status'}, status=400)
            
            booking.status = status_val
            booking.save()
            
            self._log_activity(request, 'update', 'Booking', booking.id, {
                'booking_id': booking.booking_id,
                'new_status': status_val
            })
            
            return Response({
                'success': True,
                'message': f'Booking {status_val} successfully',
                'booking': {'id': booking.id, 'booking_id': booking.booking_id, 'status': booking.status}
            })
        except Exception as e:
            if hasattr(e, 'status_code') and e.status_code == 404:
                raise
            logger.error(f"Error updating booking: {e}")
            return Response({'success': False, 'error': str(e)}, status=400)'''
    
    content = content.replace(old_update, new_update)
    
    with open(path, 'w') as f:
        f.write(content)
    print("✅ Fixed staff views to return 404 for not found")

if __name__ == "__main__":
    fix_verify_guide()

// src/pages/MyBookings.jsx - COMPLETE WITH PAGINATION

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { AuthAPI } from '../services/api';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    User, 
    Star, 
    ChevronDown, 
    ChevronUp,
    X,
    CheckCircle,
    AlertCircle,
    Loader2,
    MessageSquare,
    Camera,
    ArrowLeft,
    Trash2,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

// ============================================
// KERALA DISTRICTS MAPPING
// ============================================
const KERALA_DISTRICTS = {
    1: 'Thiruvananthapuram',
    2: 'Kollam',
    3: 'Pathanamthitta',
    4: 'Alappuzha',
    5: 'Kottayam',
    6: 'Idukki',
    7: 'Ernakulam',
    8: 'Thrissur',
    9: 'Palakkad',
    10: 'Malappuram',
    11: 'Kozhikode',
    12: 'Wayanad',
    13: 'Kannur',
    14: 'Kasaragod'
};

// ============================================
// DESIGN SYSTEM
// ============================================
const T = {
    ink: '#0B2422',
    deepTeal: '#072E2A',
    cream: '#FBF6EA',
    gold: '#C79A3E',
    goldLight: '#E4C77B',
    goldSoft: 'rgba(199,154,62,0.12)',
    goldGlow: 'rgba(199,154,62,0.25)',
    muted: '#5C6E69',
    muted2: '#8A9A95',
    white: '#FFFFFF',
    success: '#16A34A',
    successBg: 'rgba(22,163,74,0.1)',
    warning: '#D97706',
    warningBg: 'rgba(217,119,6,0.1)',
    danger: '#DC2626',
    dangerBg: 'rgba(220,38,38,0.1)',
    info: '#2563EB',
    infoBg: 'rgba(37,99,235,0.1)',
};

// ============================================
// HELPER FUNCTIONS
// ============================================
const getDistrictName = (district) => {
    if (!district) return 'N/A';
    if (typeof district === 'number' || (typeof district === 'string' && !isNaN(district))) {
        const id = typeof district === 'string' ? parseInt(district) : district;
        return KERALA_DISTRICTS[id] || district;
    }
    if (typeof district === 'object' && district.name) return district.name;
    if (typeof district === 'string') return district;
    return 'N/A';
};

const getGuideImage = (booking) => {
    if (!booking) return null;
    const sources = [
        booking.guide_image,
        booking.guide?.profile_image,
        booking.guide?.image,
        booking.guide?.avatar,
        booking.guide?.photo,
        booking.profile_image,
        booking.image,
    ];
    for (const src of sources) {
        if (src && typeof src === 'string' && src.trim() !== '') {
            if (src.startsWith('/media/') || src.startsWith('/uploads/') || src.startsWith('/static/')) {
                return `http://localhost:8000${src}`;
            }
            if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
                return src;
            }
            return src;
        }
    }
    return null;
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return 'N/A';
    }
};

const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    } catch {
        return timeStr;
    }
};

const getStatusStyle = (status) => {
    const styles = {
        confirmed: { 
            bg: T.successBg, 
            text: T.success, 
            icon: CheckCircle,
            border: '1px solid rgba(22,163,74,0.2)',
            label: 'Confirmed'
        },
        pending: { 
            bg: T.warningBg, 
            text: T.warning, 
            icon: Clock,
            border: '1px solid rgba(217,119,6,0.2)',
            label: 'Pending'
        },
        pending_cancellation: { 
            bg: '#FEF3C7', 
            text: '#D97706', 
            icon: AlertCircle,
            border: '1px solid rgba(217,119,6,0.2)',
            label: 'Cancellation Requested'
        },
        completed: { 
            bg: T.infoBg, 
            text: T.info, 
            icon: CheckCircle,
            border: '1px solid rgba(37,99,235,0.2)',
            label: 'Completed'
        },
        cancelled: { 
            bg: T.dangerBg, 
            text: T.danger, 
            icon: X,
            border: '1px solid rgba(220,38,38,0.2)',
            label: 'Cancelled'
        },
        rejected: { 
            bg: T.dangerBg, 
            text: T.danger, 
            icon: X,
            border: '1px solid rgba(220,38,38,0.2)',
            label: 'Rejected'
        },
    };
    return styles[status] || styles.pending;
};

// ============================================
// STAT CARD COMPONENT
// ============================================
const StatCard = ({ label, value, icon, color, active, onClick }) => (
    <div 
        onClick={onClick}
        style={{
            textAlign: 'center',
            padding: '8px 4px',
            cursor: 'pointer',
            borderRadius: 12,
            background: active ? `${color}10` : 'transparent',
            border: active ? `1px solid ${color}30` : '1px solid transparent',
            transition: 'all 0.2s ease',
        }}
    >
        <div style={{ fontSize: 22, fontWeight: 700, color: color }}>
            {value}
        </div>
        <div style={{ fontSize: 11, color: '#8A9A95', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span>{icon}</span>
            {label}
        </div>
    </div>
);

// ============================================
// PAGINATION COMPONENT
// ============================================
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            paddingTop: 16,
            marginTop: 16,
            borderTop: `1px solid rgba(199,154,62,0.15)`,
        }}>
            <div style={{ fontSize: 12, color: '#8A9A95' }}>
                Showing {startItem}-{endItem} of {totalItems}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: `1px solid ${currentPage === 1 ? '#E5E7EB' : '#EFE6CF'}`,
                        background: currentPage === 1 ? '#f5f5f5' : '#fff',
                        color: currentPage === 1 ? '#8A9A95' : '#0B2422',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                        opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                >
                    <ChevronLeft size={14} />
                    <span style={{ display: 'inline' }}>Previous</span>
                </button>

                {getPageNumbers().map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            border: currentPage === page ? `1px solid #C79A3E` : `1px solid #EFE6CF`,
                            background: currentPage === page ? '#C79A3E' : '#fff',
                            color: currentPage === page ? '#fff' : '#0B2422',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontWeight: currentPage === page ? 600 : 400,
                            transition: 'all 0.15s ease',
                            minWidth: 32,
                        }}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: `1px solid ${currentPage === totalPages ? '#E5E7EB' : '#EFE6CF'}`,
                        background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                        color: currentPage === totalPages ? '#8A9A95' : '#0B2422',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                        opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                >
                    <span style={{ display: 'inline' }}>Next</span>
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
const MyBookings = () => {
    const navigate = useNavigate();
    const { user, isLoggedIn, userRole } = useAuth();
    
    // State
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [stats, setStats] = useState({ 
        total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, pending_cancellation: 0 
    });
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;
    
    // Modals
    const [cancelDialog, setCancelDialog] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [reviewDialog, setReviewDialog] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewImages, setReviewImages] = useState([]);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [selectedImagePreview, setSelectedImagePreview] = useState(null);

    const toastTimeoutRef = useRef(null);

    // ============================================
    // FETCH BOOKINGS
    // ============================================
    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            console.log('📊 Fetching bookings...');
            
            const response = await AuthAPI.getMyBookings();
            console.log('📊 Response:', response);
            
            let bookingsData = [];
            let statsData = {};
            
            if (response?.success) {
                bookingsData = response.bookings || [];
                statsData = response.stats || {};
            } else if (Array.isArray(response)) {
                bookingsData = response;
            } else if (response?.data) {
                bookingsData = response.data;
            } else if (response?.results) {
                bookingsData = response.results;
            }
            
            const formatted = bookingsData.map(b => {
                let destination = 'Kerala Tour';
                let placeName = '';
                let districtName = 'N/A';
                
                if (b.district) {
                    if (typeof b.district === 'object' && b.district.name) {
                        districtName = b.district.name;
                    } else if (typeof b.district === 'number' || (typeof b.district === 'string' && !isNaN(b.district))) {
                        districtName = getDistrictName(b.district);
                    } else if (typeof b.district === 'string') {
                        districtName = b.district;
                    }
                }
                
                if (districtName === 'N/A' && b.guide?.district) {
                    districtName = getDistrictName(b.guide.district);
                }
                
                if (districtName === 'N/A' && b.guide?.districts?.length > 0) {
                    const d = b.guide.districts[0];
                    if (typeof d === 'object' && d.name) {
                        districtName = d.name;
                    } else if (typeof d === 'number' || (typeof d === 'string' && !isNaN(d))) {
                        districtName = getDistrictName(d);
                    } else if (typeof d === 'string') {
                        districtName = d;
                    }
                }
                
                if (b.destination && b.destination !== 'Kerala Tour') {
                    destination = b.destination;
                    placeName = b.destination;
                }
                
                if (!placeName && b.place_name) {
                    destination = b.place_name;
                    placeName = b.place_name;
                }
                
                if (!placeName && b.location) {
                    destination = b.location;
                    placeName = b.location;
                }
                
                if (!placeName && b.special_requests) {
                    const patterns = [
                        /destination[:=]\s*([^,\n]+)/i,
                        /place[:=]\s*([^,\n]+)/i,
                        /location[:=]\s*([^,\n]+)/i,
                        /going to\s+([^,\n]+)/i,
                    ];
                    for (const pattern of patterns) {
                        const match = b.special_requests.match(pattern);
                        if (match) {
                            placeName = match[1].trim();
                            destination = placeName;
                            break;
                        }
                    }
                }
                
                if (destination === 'Kerala Tour' && districtName !== 'N/A') {
                    destination = districtName;
                }
                
                let guideImage = null;
                if (b.guide) {
                    guideImage = b.guide.profile_image || b.guide.image || b.guide.avatar || null;
                }
                if (!guideImage && b.guide_image) guideImage = b.guide_image;
                if (!guideImage && b.profile_image) guideImage = b.profile_image;
                if (!guideImage && b.image) guideImage = b.image;
                
                return {
                    id: b.id,
                    booking_id: b.booking_id || b.id,
                    guide_name: b.guide_name || b.guide?.full_name || 'Unknown',
                    guide_id: b.guide_id || b.guide?.id || null,
                    district: districtName,
                    destination: destination,
                    place_name: placeName || destination,
                    date: b.date || 'N/A',
                    time: b.time || 'N/A',
                    status: b.status || 'pending',
                    people: b.number_of_people || 1,
                    price: b.total_price || 0,
                    duration: b.duration_hours || 4,
                    special_requests: b.special_requests || '',
                    created_at: b.created_at || new Date().toISOString(),
                    has_review: b.has_review || false,
                    review: b.review || null,
                    cancellation_reason: b.cancellation_reason || '',
                    guide_image: guideImage,
                    guide: b.guide || null,
                };
            });
            
            setBookings(formatted);
            setCurrentPage(1);
            
            const newStats = {
                total: statsData.total || formatted.length,
                pending: statsData.pending || formatted.filter(b => b.status === 'pending').length,
                pending_cancellation: statsData.pending_cancellation || formatted.filter(b => b.status === 'pending_cancellation').length,
                confirmed: statsData.confirmed || formatted.filter(b => b.status === 'confirmed').length,
                completed: statsData.completed || formatted.filter(b => b.status === 'completed').length,
                cancelled: statsData.cancelled || formatted.filter(b => b.status === 'cancelled').length,
                rejected: statsData.rejected || formatted.filter(b => b.status === 'rejected').length,
            };
            setStats(newStats);
            
            console.log(`✅ Found ${formatted.length} bookings`);
        } catch (error) {
            console.error('❌ Error:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // ============================================
    // EFFECTS
    // ============================================
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        fetchBookings();
        
        const handleUpdate = () => fetchBookings();
        window.addEventListener('bookingsUpdated', handleUpdate);
        window.addEventListener('storage', handleUpdate);
        
        return () => {
            window.removeEventListener('bookingsUpdated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, [isLoggedIn, navigate, fetchBookings]);

    // Reset page when filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchQuery]);

    // ============================================
    // TOAST
    // ============================================
    const showToast = (message, type = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ message, type });
        toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
    };

    // ============================================
    // DELETE BOOKING
    // ============================================
    const handleDeleteBooking = async (bookingId) => {
        if (!window.confirm('Delete this booking permanently?')) return;
        
        setProcessingId(bookingId);
        
        const bookingToDelete = bookings.find(b => b.id === bookingId || b.booking_id === bookingId);
        if (!bookingToDelete) {
            setProcessingId(null);
            return;
        }
        
        setBookings(prev => {
            const updated = prev.filter(b => b.id !== bookingId && b.booking_id !== bookingId);
            return updated;
        });
        
        setStats(prev => {
            const newStats = { ...prev };
            const status = bookingToDelete.status;
            if (status === 'cancelled' || status === 'rejected') {
                newStats.cancelled = Math.max(0, (newStats.cancelled || 0) - 1);
            } else if (status === 'pending') {
                newStats.pending = Math.max(0, (newStats.pending || 0) - 1);
            } else if (status === 'confirmed') {
                newStats.confirmed = Math.max(0, (newStats.confirmed || 0) - 1);
            } else if (status === 'completed') {
                newStats.completed = Math.max(0, (newStats.completed || 0) - 1);
            } else if (status === 'pending_cancellation') {
                newStats.pending_cancellation = Math.max(0, (newStats.pending_cancellation || 0) - 1);
            }
            newStats.total = Math.max(0, (newStats.total || 0) - 1);
            return newStats;
        });
        
        showToast('🗑️ Deleting booking...');
        
        try {
            const endpoints = [
                `/guides/bookings/${bookingId}/`,
                `/guides/guides/bookings/${bookingId}/`,
                `/bookings/${bookingId}/`,
                `/guides/bookings/${bookingId}/delete/`,
            ];
            
            let deleted = false;
            for (const endpoint of endpoints) {
                try {
                    const response = await api.delete(endpoint);
                    if (response?.status === 204 || response?.data?.success) {
                        deleted = true;
                        break;
                    }
                } catch (e) {
                    console.log(`Endpoint ${endpoint} failed:`, e.response?.status);
                    continue;
                }
            }
            
            if (deleted) {
                showToast('✅ Booking deleted successfully!');
                try {
                    const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
                    const updatedBookings = travelerBookings.filter(b => b.id !== bookingId && b.booking_id !== bookingId);
                    localStorage.setItem('traveler_bookings', JSON.stringify(updatedBookings));
                } catch (e) {}
            } else {
                showToast('⚠️ Could not delete from server. Refreshing...', 'warning');
                await fetchBookings();
            }
        } catch (error) {
            console.error('❌ Error deleting booking:', error);
            try {
                const response = await api.post(`/guides/bookings/${bookingId}/delete/`);
                if (response?.data?.success) {
                    showToast('✅ Booking deleted successfully!');
                    return;
                }
            } catch (e) {
                console.log('POST delete failed:', e);
            }
            showToast('❌ Failed to delete booking. Refreshing...', 'error');
            await fetchBookings();
        } finally {
            setProcessingId(null);
        }
    };

    // ============================================
    // CANCEL BOOKING
    // ============================================
    const handleCancelBooking = async (bookingId) => {
        if (!cancelReason.trim()) {
            showToast('Please provide a reason for cancellation', 'error');
            return;
        }
        
        setProcessingId(bookingId);
        try {
            const response = await AuthAPI.cancelBooking(bookingId);
            
            if (response?.success) {
                showToast('✅ Cancellation request sent to guide!');
                setBookings(prev => prev.map(b => 
                    (b.id === bookingId || b.booking_id === bookingId) 
                        ? { ...b, status: 'pending_cancellation', cancellation_reason: cancelReason }
                        : b
                ));
                setCancelDialog(null);
                setCancelReason('');
                await fetchBookings();
            } else {
                showToast(response?.message || 'Failed to send cancellation request', 'error');
            }
        } catch (error) {
            console.error('❌ Cancellation error:', error);
            showToast('Failed to send cancellation request. Please try again.', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    // ============================================
    // REVIEW HANDLERS
    // ============================================
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const newImages = files.map(file => ({
            id: Date.now() + Math.random(),
            file,
            dataUrl: URL.createObjectURL(file),
            name: file.name,
        }));
        setReviewImages(prev => [...prev, ...newImages].slice(0, 5));
    };

    const removeImage = (id) => {
        setReviewImages(prev => prev.filter(img => img.id !== id));
    };

    const handleSubmitReview = async (bookingId) => {
        if (rating === 0) {
            showToast('Please select a rating', 'error');
            return;
        }
        if (!reviewText.trim()) {
            showToast('Please write a review', 'error');
            return;
        }

        setSubmittingReview(true);
        try {
            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('comment', reviewText);
            formData.append('type', 'guide_review');
            
            reviewImages.forEach(img => {
                if (img.file) formData.append('images', img.file);
            });

            await api.post(`/guides/bookings/${bookingId}/review/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            showToast('⭐ Review submitted to guide successfully!');
            setReviewDialog(null);
            setRating(0);
            setReviewText('');
            setReviewImages([]);
            await fetchBookings();
        } catch (error) {
            console.error('Review error:', error);
            showToast('Failed to submit review', 'error');
        } finally {
            setSubmittingReview(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // ============================================
    // FILTERS & PAGINATION
    // ============================================
    const canCancel = (status) => ['pending', 'confirmed'].includes(status);
    const isCompleted = (status) => status === 'completed';
    const isCancelled = (status) => status === 'cancelled' || status === 'rejected';
    const isCancellationRequested = (status) => status === 'pending_cancellation';

    const filteredBookings = bookings.filter(b => {
        if (filter !== 'all' && b.status !== filter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return b.destination.toLowerCase().includes(q) ||
                   b.guide_name.toLowerCase().includes(q) ||
                   b.district.toLowerCase().includes(q);
        }
        return true;
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentBookings = filteredBookings.slice(startIndex, endIndex);

    // ============================================
    // LOADING
    // ============================================
    if (loading) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                background: `linear-gradient(135deg, ${T.deepTeal}, #0A4A44)`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
            }}>
                <div style={{ 
                    width: 56, height: 56,
                    border: `3px solid ${T.goldSoft}`,
                    borderTop: `3px solid ${T.gold}`,
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ 
                    marginTop: 20, 
                    color: T.goldLight, 
                    fontFamily: "'Fraunces', serif",
                    fontSize: 18,
                    letterSpacing: 1,
                }}>
                    Loading your adventures...
                </p>
            </div>
        );
    }

    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div style={{ 
            minHeight: '100vh',
            background: T.cream,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            paddingBottom: 80,
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@300;400;500;600;700;800&display=swap');
                .ff-serif { font-family: 'Fraunces', serif; }
                .ff-sans { font-family: 'Inter', sans-serif; }
                .booking-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .booking-card:hover { transform: translateY(-4px); }
                .stat-card { transition: all 0.3s ease; }
                .stat-card:hover { transform: translateY(-2px); }
                .filter-btn { transition: all 0.3s ease; }
                .filter-btn:hover { transform: scale(1.02); }
                .rating-star { transition: all 0.2s ease; }
                .rating-star:hover { transform: scale(1.2); }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .slide-up { animation: slideUp 0.4s ease forwards; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .pulse { animation: pulse 2s ease-in-out infinite; }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* ============================================
                HEADER
            ============================================ */}
            <div style={{
                background: `linear-gradient(135deg, ${T.deepTeal}, #0A4A44)`,
                padding: '48px 24px 32px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'rgba(199,154,62,0.05)',
                    pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: -80,
                    left: -80,
                    width: 250,
                    height: 250,
                    borderRadius: '50%',
                    background: 'rgba(199,154,62,0.03)',
                    pointerEvents: 'none',
                }} />
                
                <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <Link 
                                to="/guides" 
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    color: 'rgba(237,226,196,0.6)',
                                    textDecoration: 'none',
                                    fontSize: 13,
                                    fontFamily: "'Inter', sans-serif",
                                    transition: 'color 0.3s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = T.goldLight}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(237,226,196,0.6)'}
                            >
                                <ArrowLeft size={16} />
                                Back to Guides
                            </Link>
                            <h1 style={{
                                fontFamily: "'Fraunces', serif",
                                fontStyle: 'italic',
                                fontSize: 'clamp(36px, 5vw, 52px)',
                                fontWeight: 500,
                                color: '#fff',
                                margin: '12px 0 4px',
                                letterSpacing: '-0.5px',
                            }}>
                                ✦ My Bookings
                            </h1>
                            <p style={{
                                color: 'rgba(237,226,196,0.7)',
                                fontSize: 'clamp(14px, 1.2vw, 17px)',
                                fontFamily: "'Inter', sans-serif",
                            }}>
                                {bookings.length} adventure{bookings.length !== 1 ? 's' : ''} planned
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <button
                                onClick={() => {
                                    setBookings([]);
                                    fetchBookings();
                                }}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 999,
                                    border: '1px solid rgba(199,154,62,0.2)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: T.goldLight,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontFamily: "'Inter', sans-serif",
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    backdropFilter: 'blur(10px)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                Refresh
                            </button>
                            <Link
                                to="/guides"
                                style={{
                                    padding: '10px 28px',
                                    borderRadius: 999,
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                                    color: T.deepTeal,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: "'Inter', sans-serif",
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'all 0.3s ease',
                                    boxShadow: `0 4px 20px ${T.goldGlow}`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.03)';
                                    e.currentTarget.style.boxShadow = `0 8px 30px ${T.goldGlow}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = `0 4px 20px ${T.goldGlow}`;
                                }}
                            >
                                <span style={{ fontSize: 18 }}>+</span>
                                New Booking
                            </Link>
                        </div>
                    </div>
                </div>
                
                <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: 28 }}>
                    <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill={T.cream} />
                </svg>
            </div>

            {/* ============================================
                STATS
            ============================================ */}
            <div style={{ maxWidth: 1200, margin: '-8px auto 0', padding: '0 20px', position: 'relative', zIndex: 2 }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: 10,
                    background: T.white,
                    borderRadius: 20,
                    padding: '16px 20px',
                    boxShadow: '0 4px 24px rgba(7,46,42,0.06)',
                    border: '1px solid rgba(199,154,62,0.08)',
                }}>
                    {[
                        { key: 'all', label: 'Total', count: stats.total, icon: '📊', color: T.deepTeal },
                        { key: 'pending', label: 'Pending', count: stats.pending, icon: '⏳', color: T.warning },
                        { key: 'pending_cancellation', label: 'Cancelling', count: stats.pending_cancellation || 0, icon: '🔄', color: '#D97706' },
                        { key: 'confirmed', label: 'Confirmed', count: stats.confirmed, icon: '✅', color: T.success },
                        { key: 'completed', label: 'Completed', count: stats.completed, icon: '🎯', color: T.info },
                        { key: 'cancelled', label: 'Cancelled', count: stats.cancelled, icon: '❌', color: T.danger },
                    ].map((stat) => (
                        <StatCard
                            key={stat.key}
                            label={stat.label}
                            value={stat.count}
                            icon={stat.icon}
                            color={stat.color}
                            active={filter === stat.key}
                            onClick={() => setFilter(stat.key)}
                        />
                    ))}
                </div>
            </div>

            {/* ============================================
                SEARCH & FILTERS
            ============================================ */}
            <div style={{ maxWidth: 1200, margin: '20px auto 0', padding: '0 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ position: 'relative', maxWidth: 400 }}>
                        <input
                            type="text"
                            placeholder="🔍 Search by destination or guide..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 20px',
                                borderRadius: 999,
                                border: '1px solid rgba(199,154,62,0.15)',
                                background: T.white,
                                fontSize: 14,
                                fontFamily: "'Inter', sans-serif",
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 12px rgba(7,46,42,0.04)',
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = T.gold;
                                e.currentTarget.style.boxShadow = `0 0 0 4px ${T.goldSoft}`;
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(199,154,62,0.15)';
                                e.currentTarget.style.boxShadow = '0 2px 12px rgba(7,46,42,0.04)';
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute',
                                    right: 16,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: T.muted2,
                                    fontSize: 18,
                                    padding: 4,
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['all', 'pending', 'pending_cancellation', 'confirmed', 'completed', 'cancelled'].map((status) => {
                            const labels = {
                                all: '✨ All',
                                pending: '⏳ Pending',
                                pending_cancellation: '🔄 Cancelling',
                                confirmed: '✅ Confirmed',
                                completed: '🎯 Completed',
                                cancelled: '❌ Cancelled',
                            };
                            const counts = {
                                all: bookings.length,
                                pending: bookings.filter(b => b.status === 'pending').length,
                                pending_cancellation: bookings.filter(b => b.status === 'pending_cancellation').length,
                                confirmed: bookings.filter(b => b.status === 'confirmed').length,
                                completed: bookings.filter(b => b.status === 'completed').length,
                                cancelled: bookings.filter(b => b.status === 'cancelled').length,
                            };
                            const isActive = filter === status;
                            return (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className="filter-btn"
                                    style={{
                                        padding: '6px 18px',
                                        borderRadius: 999,
                                        border: isActive ? `2px solid ${T.gold}` : '1px solid #E5E7EB',
                                        background: isActive ? T.gold : 'transparent',
                                        color: isActive ? T.deepTeal : T.muted,
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        fontWeight: isActive ? 600 : 400,
                                        fontFamily: "'Inter', sans-serif",
                                        transition: 'all 0.3s ease',
                                        boxShadow: isActive ? `0 2px 12px ${T.goldGlow}` : 'none',
                                    }}
                                >
                                    {labels[status]}
                                    <span style={{
                                        marginLeft: 6,
                                        padding: '1px 8px',
                                        borderRadius: 999,
                                        background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                                        fontSize: 10,
                                        fontWeight: 500,
                                    }}>
                                        {counts[status] || 0}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ============================================
                BOOKINGS LIST WITH PAGINATION
            ============================================ */}
            <div style={{ maxWidth: 1200, margin: '20px auto 0', padding: '0 20px 40px' }}>
                {currentBookings.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 20px',
                        background: T.white,
                        borderRadius: 24,
                        border: '1px solid rgba(199,154,62,0.08)',
                        boxShadow: '0 4px 24px rgba(7,46,42,0.04)',
                    }}>
                        <div style={{ fontSize: 72, marginBottom: 16 }}>🧭</div>
                        <h2 style={{ 
                            fontFamily: "'Fraunces', serif", 
                            fontSize: 28, 
                            color: T.deepTeal,
                            fontStyle: 'italic',
                            margin: 0,
                        }}>
                            {filteredBookings.length === 0 ? 'No adventures yet' : `No ${filter} bookings`}
                        </h2>
                        <p style={{ color: T.muted2, fontSize: 15, maxWidth: 400, margin: '8px auto 0' }}>
                            {filteredBookings.length === 0 
                                ? 'Book a guide and start your Kerala adventure today!' 
                                : `You don't have any ${filter} bookings.`}
                        </p>
                        {filteredBookings.length === 0 && (
                            <Link to="/guides" style={{
                                display: 'inline-block',
                                marginTop: 24,
                                padding: '14px 40px',
                                borderRadius: 999,
                                background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                                color: T.deepTeal,
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: 15,
                                fontFamily: "'Inter', sans-serif",
                                boxShadow: `0 4px 20px ${T.goldGlow}`,
                                transition: 'transform 0.3s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                ✦ Browse Guides
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gap: 16 }}>
                            {currentBookings.map((booking, index) => {
                                const statusStyle = getStatusStyle(booking.status);
                                const StatusIcon = statusStyle.icon;
                                const isExpanded = expandedId === booking.id;
                                const showCancel = canCancel(booking.status);
                                const isComplete = isCompleted(booking.status);
                                const isCancelReq = isCancellationRequested(booking.status);
                                const isCancelledStatus = isCancelled(booking.status);
                                const hasReview = booking.review || booking.has_review;
                                const guideImage = getGuideImage(booking);

                                return (
                                    <div
                                        key={booking.id}
                                        className="booking-card slide-up"
                                        style={{
                                            background: T.white,
                                            borderRadius: 20,
                                            border: isCancelReq 
                                                ? '2px solid #D97706' 
                                                : '1px solid rgba(199,154,62,0.08)',
                                            overflow: 'hidden',
                                            boxShadow: isCancelReq 
                                                ? '0 4px 24px rgba(217,119,6,0.12)' 
                                                : '0 2px 16px rgba(7,46,42,0.04)',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            animationDelay: `${index * 50}ms`,
                                        }}
                                    >
                                        {/* Main Card Content */}
                                        <div
                                            onClick={() => toggleExpand(booking.id)}
                                            style={{
                                                padding: '20px 24px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 16,
                                                alignItems: 'center',
                                            }}
                                        >
                                            {/* Guide Avatar */}
                                            <div style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${T.deepTeal}, #0A4A44)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 24,
                                                color: T.goldLight,
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                                border: `2px solid ${T.goldSoft}`,
                                            }}>
                                                {guideImage ? (
                                                    <img 
                                                        src={guideImage} 
                                                        alt={booking.guide_name} 
                                                        style={{ 
                                                            width: '100%', 
                                                            height: '100%', 
                                                            objectFit: 'cover' 
                                                        }}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.textContent = booking.guide_name?.charAt(0)?.toUpperCase() || 'G';
                                                        }}
                                                    />
                                                ) : (
                                                    booking.guide_name?.charAt(0)?.toUpperCase() || 'G'
                                                )}
                                            </div>

                                            {/* Booking Info */}
                                            <div style={{ flex: 1, minWidth: 180 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        fontSize: 17,
                                                        fontWeight: 600,
                                                        color: T.ink,
                                                        fontFamily: "'Fraunces', serif",
                                                    }}>
                                                        {booking.destination}
                                                    </span>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        padding: '4px 12px',
                                                        borderRadius: 999,
                                                        fontSize: 10,
                                                        fontWeight: 600,
                                                        background: statusStyle.bg,
                                                        color: statusStyle.text,
                                                        border: statusStyle.border,
                                                    }}>
                                                        <StatusIcon size={12} />
                                                        {statusStyle.label}
                                                    </span>
                                                    {isCancelReq && (
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            borderRadius: 999,
                                                            fontSize: 10,
                                                            background: '#FEF3C7',
                                                            color: '#D97706',
                                                            fontWeight: 600,
                                                            animation: 'pulse 2s infinite',
                                                        }}>
                                                            ⏳ Awaiting Guide
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: '12px 20px',
                                                    marginTop: 4,
                                                    fontSize: 13,
                                                    color: T.muted,
                                                }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <User size={14} />
                                                        {booking.guide_name}
                                                    </span>
                                                    {booking.district && booking.district !== 'N/A' && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <MapPin size={14} />
                                                            {booking.district}
                                                        </span>
                                                    )}
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Calendar size={14} />
                                                        {booking.date}
                                                    </span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Clock size={14} />
                                                        {booking.time}
                                                    </span>
                                                    {booking.people > 1 && (
                                                        <span>👥 {booking.people}</span>
                                                    )}
                                                </div>
                                                {booking.special_requests && (
                                                    <div style={{
                                                        fontSize: 12,
                                                        color: T.muted2,
                                                        marginTop: 4,
                                                        fontStyle: 'italic',
                                                        opacity: 0.7,
                                                    }}>
                                                        💭 "{booking.special_requests.substring(0, 50)}{booking.special_requests.length > 50 ? '...' : ''}"
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 10,
                                                flexShrink: 0,
                                                flexWrap: 'wrap',
                                            }}>
                                                {/* Write Review button for completed bookings */}
                                                {isComplete && !hasReview && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setReviewDialog(booking);
                                                            setRating(0);
                                                            setReviewText('');
                                                            setReviewImages([]);
                                                        }}
                                                        style={{
                                                            padding: '8px 18px',
                                                            borderRadius: 999,
                                                            border: 'none',
                                                            background: `linear-gradient(135deg, #FF9800, #FFC107)`,
                                                            color: '#fff',
                                                            fontSize: 11,
                                                            fontWeight: 600,
                                                            fontFamily: "'Inter', sans-serif",
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                            boxShadow: '0 2px 16px rgba(255,152,0,0.3)',
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    >
                                                        <Star size={14} />
                                                        Review Guide
                                                    </button>
                                                )}

                                                {hasReview && (
                                                    <span style={{
                                                        padding: '6px 14px',
                                                        borderRadius: 999,
                                                        fontSize: 11,
                                                        fontWeight: 500,
                                                        background: '#DCFCE7',
                                                        color: '#16A34A',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}>
                                                        ⭐ Reviewed
                                                        {booking.review?.rating && ` ${booking.review.rating}/5`}
                                                    </span>
                                                )}

                                                {showCancel && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCancelDialog(booking);
                                                            setCancelReason('');
                                                        }}
                                                        disabled={processingId === booking.id}
                                                        style={{
                                                            padding: '8px 18px',
                                                            borderRadius: 999,
                                                            border: '1px solid #EF4444',
                                                            background: 'transparent',
                                                            color: '#EF4444',
                                                            fontSize: 11,
                                                            fontFamily: "'Inter', sans-serif",
                                                            cursor: processingId === booking.id ? 'not-allowed' : 'pointer',
                                                            opacity: processingId === booking.id ? 0.6 : 1,
                                                            transition: 'all 0.3s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6,
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!processingId) {
                                                                e.currentTarget.style.background = T.dangerBg;
                                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                    >
                                                        {processingId === booking.id ? (
                                                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                                        ) : (
                                                            <>
                                                                <X size={14} />
                                                                Cancel
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                                {isCancelReq && (
                                                    <span style={{
                                                        padding: '8px 14px',
                                                        borderRadius: 999,
                                                        background: '#FEF3C7',
                                                        color: '#D97706',
                                                        fontSize: 11,
                                                        fontWeight: 500,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}>
                                                        <Clock size={14} />
                                                        Awaiting Guide
                                                    </span>
                                                )}

                                                {/* DELETE button for cancelled/rejected bookings */}
                                                {isCancelledStatus && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteBooking(booking.id || booking.booking_id);
                                                        }}
                                                        disabled={processingId === booking.id}
                                                        style={{
                                                            padding: '6px 14px',
                                                            borderRadius: 999,
                                                            border: '1px solid #EF4444',
                                                            background: '#FEE2E2',
                                                            color: '#DC2626',
                                                            fontSize: 11,
                                                            fontFamily: "'Inter', sans-serif",
                                                            cursor: processingId === booking.id ? 'not-allowed' : 'pointer',
                                                            opacity: processingId === booking.id ? 0.6 : 1,
                                                            transition: 'all 0.3s ease',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!processingId) {
                                                                e.currentTarget.style.background = '#FECACA';
                                                                e.currentTarget.style.transform = 'scale(1.02)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = '#FEE2E2';
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                    >
                                                        {processingId === booking.id ? (
                                                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                                        ) : (
                                                            <>
                                                                <Trash2 size={14} />
                                                                Delete
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleExpand(booking.id);
                                                    }}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: 8,
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: T.muted2,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div style={{
                                                padding: '20px 24px 24px',
                                                borderTop: '1px solid rgba(199,154,62,0.06)',
                                                background: `linear-gradient(135deg, ${T.cream}, #F8F4EA)`,
                                            }}>
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                                    gap: 16,
                                                }}>
                                                    <div>
                                                        <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                            Booking ID
                                                        </p>
                                                        <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink, fontFamily: "'IBM Plex Mono', monospace" }}>
                                                            #{booking.booking_id}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                            Guide
                                                        </p>
                                                        <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                            {booking.guide_name}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                            Destination
                                                        </p>
                                                        <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                            {booking.destination}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                            District
                                                        </p>
                                                        <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                            {booking.district}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                            Date & Time
                                                        </p>
                                                        <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                            {booking.date} • {booking.time}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                            Duration
                                                        </p>
                                                        <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                            {booking.duration} hours
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                            People
                                                        </p>
                                                        <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                            {booking.people}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                            Price
                                                        </p>
                                                        <p style={{ fontSize: 14, fontWeight: 700, margin: '4px 0 0', color: T.gold }}>
                                                            ₹{booking.price}
                                                        </p>
                                                    </div>
                                                    {booking.special_requests && (
                                                        <div style={{ gridColumn: '1 / -1' }}>
                                                            <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                                Special Requests
                                                            </p>
                                                            <p style={{
                                                                fontSize: 14,
                                                                margin: '4px 0 0',
                                                                color: T.ink,
                                                                background: T.white,
                                                                padding: '12px 16px',
                                                                borderRadius: 12,
                                                                border: '1px solid rgba(199,154,62,0.08)',
                                                                lineHeight: 1.6,
                                                            }}>
                                                                {booking.special_requests}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {booking.cancellation_reason && booking.status === 'cancelled' && (
                                                        <div style={{ gridColumn: '1 / -1' }}>
                                                            <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                                Cancellation Reason
                                                            </p>
                                                            <p style={{
                                                                fontSize: 14,
                                                                margin: '4px 0 0',
                                                                color: T.danger,
                                                                background: T.dangerBg,
                                                                padding: '12px 16px',
                                                                borderRadius: 12,
                                                                border: '1px solid rgba(220,38,38,0.1)',
                                                            }}>
                                                                {booking.cancellation_reason}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {booking.review && (
                                                        <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                                                            <p style={{ fontSize: 10, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600, margin: 0 }}>
                                                                Your Review
                                                            </p>
                                                            <div style={{
                                                                background: T.white,
                                                                padding: '16px 20px',
                                                                borderRadius: 12,
                                                                marginTop: 4,
                                                                border: '1px solid rgba(199,154,62,0.08)',
                                                                boxShadow: '0 2px 8px rgba(7,46,42,0.04)',
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                    <span style={{ fontSize: 22, color: '#FFB300' }}>
                                                                        {'★'.repeat(Math.round(booking.review.rating || 0))}
                                                                        {'☆'.repeat(5 - Math.round(booking.review.rating || 0))}
                                                                    </span>
                                                                    <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
                                                                        {booking.review.rating}/5
                                                                    </span>
                                                                    {booking.review.created_at && (
                                                                        <span style={{ fontSize: 11, color: T.muted2, marginLeft: 'auto' }}>
                                                                            📅 {new Date(booking.review.created_at).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p style={{ fontSize: 14, color: T.ink, margin: '8px 0 0', lineHeight: 1.6 }}>
                                                                    {booking.review.comment}
                                                                </p>
                                                                {booking.review.images?.length > 0 && (
                                                                    <div style={{
                                                                        display: 'flex',
                                                                        gap: 10,
                                                                        marginTop: 12,
                                                                        flexWrap: 'wrap',
                                                                    }}>
                                                                        {booking.review.images.slice(0, 4).map((img, idx) => (
                                                                            <img
                                                                                key={idx}
                                                                                src={img}
                                                                                alt={`Review ${idx + 1}`}
                                                                                style={{
                                                                                    width: 72,
                                                                                    height: 72,
                                                                                    borderRadius: 10,
                                                                                    objectFit: 'cover',
                                                                                    border: '1px solid rgba(199,154,62,0.1)',
                                                                                    cursor: 'pointer',
                                                                                    transition: 'transform 0.3s ease',
                                                                                }}
                                                                                onClick={() => setSelectedImagePreview(img)}
                                                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                                            />
                                                                        ))}
                                                                        {booking.review.images.length > 4 && (
                                                                            <div style={{
                                                                                width: 72,
                                                                                height: 72,
                                                                                borderRadius: 10,
                                                                                background: T.cream,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                fontSize: 14,
                                                                                fontWeight: 500,
                                                                                color: T.muted,
                                                                            }}>
                                                                                +{booking.review.images.length - 4}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* ✅ PAGINATION */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={filteredBookings.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    </>
                )}
            </div>

            {/* ============================================
                CANCEL DIALOG
            ============================================ */}
            {cancelDialog && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(7,46,42,0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 20,
                }} onClick={() => { setCancelDialog(null); setCancelReason(''); }}>
                    <div style={{
                        background: T.white,
                        borderRadius: 24,
                        padding: 36,
                        maxWidth: 480,
                        width: '100%',
                        boxShadow: '0 24px 80px rgba(7,46,42,0.3)',
                        animation: 'slideUp 0.3s ease',
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{
                                margin: 0,
                                color: T.ink,
                                fontFamily: "'Fraunces', serif",
                                fontStyle: 'italic',
                                fontSize: 22,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                            }}>
                                <span>❌</span> Cancel Booking
                            </h3>
                            <button
                                onClick={() => { setCancelDialog(null); setCancelReason(''); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 28,
                                    cursor: 'pointer',
                                    color: T.muted,
                                    padding: '0 4px',
                                    transition: 'transform 0.3s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div style={{
                            background: T.cream,
                            padding: '16px 20px',
                            borderRadius: 16,
                            marginBottom: 20,
                        }}>
                            <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>
                                You are about to cancel your booking with <strong style={{ color: T.deepTeal }}>{cancelDialog.guide_name}</strong>
                            </p>
                            <p style={{ fontSize: 12, color: T.muted2, margin: '4px 0 0' }}>
                                📅 {cancelDialog.date} • ⏰ {cancelDialog.time} • 📍 {cancelDialog.destination}
                            </p>
                        </div>
                        
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: T.ink, display: 'block', marginBottom: 6 }}>
                                Reason for Cancellation <span style={{ color: T.danger }}>*</span>
                            </label>
                            <textarea
                                placeholder="Please explain why you need to cancel..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '14px 18px',
                                    borderRadius: 14,
                                    border: '1px solid #E5E7EB',
                                    fontSize: 14,
                                    resize: 'vertical',
                                    minHeight: 80,
                                    fontFamily: "'Inter', sans-serif",
                                    transition: 'all 0.3s ease',
                                    outline: 'none',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = T.gold;
                                    e.currentTarget.style.boxShadow = `0 0 0 4px ${T.goldSoft}`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => { setCancelDialog(null); setCancelReason(''); }}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: 14,
                                    border: '1px solid #E5E7EB',
                                    background: 'transparent',
                                    color: T.muted,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    fontFamily: "'Inter', sans-serif",
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#F3F4F6';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleCancelBooking(cancelDialog.id || cancelDialog.booking_id)}
                                disabled={processingId === cancelDialog.id || !cancelReason.trim()}
                                style={{
                                    flex: 2,
                                    padding: '14px',
                                    borderRadius: 14,
                                    border: 'none',
                                    background: (processingId === cancelDialog.id || !cancelReason.trim()) 
                                        ? '#D1D5DB' 
                                        : `linear-gradient(135deg, ${T.danger}, #EF4444)`,
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontFamily: "'Inter', sans-serif",
                                    cursor: (processingId === cancelDialog.id || !cancelReason.trim()) 
                                        ? 'not-allowed' 
                                        : 'pointer',
                                    fontSize: 14,
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                                onMouseEnter={(e) => {
                                    if (!(processingId === cancelDialog.id || !cancelReason.trim())) {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                {processingId === cancelDialog.id ? (
                                    <>
                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                        Sending...
                                    </>
                                ) : (
                                    '✅ Request Cancellation'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
                REVIEW DIALOG
            ============================================ */}
            {reviewDialog && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(7,46,42,0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 20,
                }} onClick={() => setReviewDialog(null)}>
                    <div style={{
                        background: T.white,
                        borderRadius: 24,
                        padding: 36,
                        maxWidth: 560,
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 24px 80px rgba(7,46,42,0.3)',
                        animation: 'slideUp 0.3s ease',
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{
                                margin: 0,
                                color: T.ink,
                                fontFamily: "'Fraunces', serif",
                                fontStyle: 'italic',
                                fontSize: 24,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                            }}>
                                <span>⭐</span> Review {reviewDialog.guide_name}
                            </h3>
                            <button
                                onClick={() => setReviewDialog(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 28,
                                    cursor: 'pointer',
                                    color: T.muted,
                                    padding: '0 4px',
                                    transition: 'transform 0.3s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div style={{
                            background: T.cream,
                            padding: '14px 18px',
                            borderRadius: 14,
                            marginBottom: 20,
                        }}>
                            <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>
                                How was your experience with <strong style={{ color: T.deepTeal }}>{reviewDialog.guide_name}</strong>?
                            </p>
                            <p style={{ fontSize: 12, color: T.muted2, margin: '4px 0 0' }}>
                                📍 {reviewDialog.district} • 📅 {reviewDialog.date} • ⏱️ {reviewDialog.duration}h
                            </p>
                        </div>
                        
                        {/* Star Rating */}
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <p style={{ fontSize: 13, color: T.muted, marginBottom: 8, fontWeight: 500 }}>
                                Rate your experience
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="rating-star"
                                        style={{
                                            fontSize: 38,
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '0 2px',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <span style={{
                                            color: (hoveredRating || rating) >= star ? '#FFB300' : '#E5E7EB',
                                            textShadow: (hoveredRating || rating) >= star ? '0 0 30px rgba(255,179,0,0.3)' : 'none',
                                            display: 'inline-block',
                                            transform: (hoveredRating || rating) >= star ? 'scale(1.1)' : 'scale(1)',
                                            transition: 'all 0.2s ease',
                                        }}>
                                            ★
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize: 13, color: T.muted, marginTop: 8, fontWeight: 500 }}>
                                {rating === 0 && 'Tap a star to rate'}
                                {rating === 1 && '😔 Poor'}
                                {rating === 2 && '😐 Fair'}
                                {rating === 3 && '🙂 Good'}
                                {rating === 4 && '😊 Very Good'}
                                {rating === 5 && '🤩 Excellent!'}
                            </p>
                        </div>
                        
                        {/* Review Text */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: T.ink, display: 'block', marginBottom: 6 }}>
                                Your Review <span style={{ color: T.danger }}>*</span>
                            </label>
                            <textarea
                                placeholder="Share your experience with this guide..."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '14px 18px',
                                    borderRadius: 14,
                                    border: '1px solid #E5E7EB',
                                    fontSize: 14,
                                    resize: 'vertical',
                                    minHeight: 100,
                                    fontFamily: "'Inter', sans-serif",
                                    transition: 'all 0.3s ease',
                                    outline: 'none',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = T.gold;
                                    e.currentTarget.style.boxShadow = `0 0 0 4px ${T.goldSoft}`;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                        
                        {/* Image Upload */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: T.ink, display: 'block', marginBottom: 6 }}>
                                📸 Add Photos <span style={{ fontSize: 11, color: T.muted2, fontWeight: 400 }}>(optional, max 5)</span>
                            </label>
                            
                            {reviewImages.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 10,
                                    marginBottom: 10,
                                }}>
                                    {reviewImages.map((img) => (
                                        <div key={img.id} style={{
                                            position: 'relative',
                                            paddingBottom: '100%',
                                            borderRadius: 12,
                                            overflow: 'hidden',
                                            border: '1px solid rgba(199,154,62,0.1)',
                                        }}>
                                            <img
                                                src={img.dataUrl}
                                                alt={img.name}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <button
                                                onClick={() => removeImage(img.id)}
                                                style={{
                                                    position: 'absolute',
                                                    top: 4,
                                                    right: 4,
                                                    background: 'rgba(0,0,0,0.7)',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: 24,
                                                    height: 24,
                                                    cursor: 'pointer',
                                                    fontSize: 14,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'transform 0.2s ease',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {reviewImages.length < 5 && (
                                        <div
                                            onClick={() => document.getElementById('review-image-input').click()}
                                            style={{
                                                paddingBottom: '100%',
                                                borderRadius: 12,
                                                border: '2px dashed #D1D5DB',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                fontSize: 28,
                                                color: T.muted2,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = T.gold;
                                                e.currentTarget.style.background = T.goldSoft;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = '#D1D5DB';
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            +
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {reviewImages.length === 0 && (
                                <div
                                    onClick={() => document.getElementById('review-image-input').click()}
                                    style={{
                                        border: '2px dashed #D1D5DB',
                                        borderRadius: 14,
                                        padding: '24px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = T.gold;
                                        e.currentTarget.style.background = T.goldSoft;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#D1D5DB';
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
                                    <p style={{ margin: 0, fontSize: 14, color: T.muted }}>
                                        Drag & drop photos here, or <span style={{ color: T.gold, fontWeight: 500 }}>click to browse</span>
                                    </p>
                                    <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted2 }}>
                                        Max 5 photos
                                    </p>
                                </div>
                            )}
                            <input
                                id="review-image-input"
                                type="file"
                                accept="image/*"
                                multiple
                                style={{ display: 'none' }}
                                onChange={handleImageUpload}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setReviewDialog(null)}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: 14,
                                    border: '1px solid #E5E7EB',
                                    background: 'transparent',
                                    color: T.muted,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    fontFamily: "'Inter', sans-serif",
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#F3F4F6';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmitReview(reviewDialog.id || reviewDialog.booking_id)}
                                disabled={submittingReview || rating === 0 || !reviewText.trim()}
                                style={{
                                    flex: 2,
                                    padding: '14px',
                                    borderRadius: 14,
                                    border: 'none',
                                    background: (submittingReview || rating === 0 || !reviewText.trim())
                                        ? '#D1D5DB'
                                        : `linear-gradient(135deg, #FF9800, #FFC107)`,
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontFamily: "'Inter', sans-serif",
                                    cursor: (submittingReview || rating === 0 || !reviewText.trim())
                                        ? 'not-allowed'
                                        : 'pointer',
                                    fontSize: 14,
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                }}
                                onMouseEnter={(e) => {
                                    if (!(submittingReview || rating === 0 || !reviewText.trim())) {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                {submittingReview ? (
                                    <>
                                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                        Submitting...
                                    </>
                                ) : (
                                    '✅ Submit Review'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
                IMAGE PREVIEW MODAL
            ============================================ */}
            {selectedImagePreview && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: 20,
                        cursor: 'pointer',
                    }}
                    onClick={() => setSelectedImagePreview(null)}
                >
                    <img
                        src={selectedImagePreview}
                        alt="Preview"
                        style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            borderRadius: 16,
                            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                            objectFit: 'contain',
                        }}
                    />
                    <button
                        onClick={() => setSelectedImagePreview(null)}
                        style={{
                            position: 'absolute',
                            top: 24,
                            right: 24,
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: 48,
                            height: 48,
                            color: '#fff',
                            fontSize: 24,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* ============================================
                TOAST
            ============================================ */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: 30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: toast.type === 'error' ? T.danger : T.deepTeal,
                    color: toast.type === 'error' ? '#fff' : T.goldLight,
                    padding: '16px 32px',
                    borderRadius: 16,
                    fontSize: 14,
                    fontFamily: "'Inter', sans-serif",
                    boxShadow: '0 8px 32px rgba(7,46,42,0.3)',
                    zIndex: 3000,
                    border: toast.type === 'error' ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(199,154,62,0.15)',
                    maxWidth: '90%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    animation: 'slideUp 0.3s ease',
                }}>
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
// src/pages/MyBookings.jsx - COMPLETE FIXED VERSION

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const T = {
    ink: '#0B2422',
    deepTeal: '#072E2A',
    cream: '#FBF6EA',
    gold: '#C79A3E',
    goldLight: '#E4C77B',
    muted: '#5C6E69',
    muted2: '#8A9A95',
    white: '#FFFFFF',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#2563EB',
};

const STATUS_COLORS = {
    confirmed: { bg: '#DCFCE7', text: '#16A34A', icon: '✅', label: 'Confirmed' },
    pending: { bg: '#FEF3C7', text: '#D97706', icon: '⏳', label: 'Pending' },
    pending_cancellation: { bg: '#FEF3C7', text: '#D97706', icon: '⏳', label: 'Cancellation Requested' },
    completed: { bg: '#DBEAFE', text: '#2563EB', icon: '📌', label: 'Completed' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626', icon: '❌', label: 'Cancelled' },
    rejected: { bg: '#FEE2E2', text: '#DC2626', icon: '🚫', label: 'Rejected' },
};

const getStatusColor = (status) => STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#6B7280', icon: '📋', label: status };

const MyBookings = () => {
    const navigate = useNavigate();
    const { user, isLoggedIn } = useAuth();
    
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [reviewDialog, setReviewDialog] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewImages, setReviewImages] = useState([]);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [toast, setToast] = useState(null);
    const [expandedBooking, setExpandedBooking] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [stats, setStats] = useState({ 
        total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, pending_cancellation: 0 
    });
    const [cancelDialog, setCancelDialog] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    // ✅ FETCH BOOKINGS - Get all bookings including all statuses
    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);
            console.log('📊 Fetching all bookings...');
            
            let response = null;
            // Try both endpoints
            try {
                response = await api.get('/guides/guides/bookings/');
            } catch (e) {
                console.log('First endpoint failed, trying fallback...');
                response = await api.get('/guides/bookings/');
            }
            
            console.log('📊 Bookings response:', response.data);
            
            let bookingsData = [];
            let statsData = {};
            
            if (response.data?.success) {
                bookingsData = response.data.bookings || [];
                statsData = response.data.stats || {};
            } else if (Array.isArray(response.data)) {
                bookingsData = response.data;
            } else if (response.data?.data) {
                bookingsData = response.data.data;
            } else if (response.data?.results) {
                bookingsData = response.data.results;
            }
            
            // ✅ Format all bookings properly
            const formattedBookings = bookingsData.map(b => ({
                id: b.id,
                booking_id: b.booking_id || b.id,
                user: b.user || { username: b.traveler_email || 'Anonymous', email: b.traveler_email || '' },
                traveler_email: b.traveler_email || b.user?.email || '',
                guide_name: b.guide_name || b.guide?.full_name || 'Unknown',
                guide_id: b.guide_id || b.guide?.id || null,
                district: b.district?.name || b.district || 'N/A',
                date: b.date || 'N/A',
                time: b.time || 'N/A',
                status: b.status || 'pending',
                number_of_people: b.number_of_people || 1,
                total_price: b.total_price || 0,
                special_requests: b.special_requests || '',
                duration_hours: b.duration_hours || 4,
                created_at: b.created_at || new Date().toISOString(),
                has_review: b.has_review || false,
                rating: b.rating || null,
                review: b.review || null,
                cancellation_reason: b.cancellation_reason || '',
                cancelled_by: b.cancelled_by || '',
            }));
            
            setBookings(formattedBookings);
            
            // ✅ Update stats with all statuses
            const newStats = {
                total: statsData.total || formattedBookings.length,
                pending: statsData.pending || formattedBookings.filter(b => b.status === 'pending').length,
                pending_cancellation: statsData.pending_cancellation || formattedBookings.filter(b => b.status === 'pending_cancellation').length,
                confirmed: statsData.confirmed || formattedBookings.filter(b => b.status === 'confirmed').length,
                completed: statsData.completed || formattedBookings.filter(b => b.status === 'completed').length,
                cancelled: statsData.cancelled || formattedBookings.filter(b => b.status === 'cancelled').length,
                rejected: statsData.rejected || formattedBookings.filter(b => b.status === 'rejected').length,
            };
            setStats(newStats);
            
            console.log(`✅ Found ${formattedBookings.length} bookings with statuses:`, 
                formattedBookings.map(b => `${b.id}: ${b.status}`).join(', '));
            
            return formattedBookings;
        } catch (error) {
            console.error('❌ Error fetching bookings:', error);
            setBookings([]);
            setStats({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, pending_cancellation: 0 });
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        fetchBookings();
        
        const handleStorageChange = (e) => {
            if (e.key === 'traveler_bookings' || e.key === 'guide_bookings_update') {
                console.log('🔄 Storage changed, refreshing bookings...');
                fetchBookings();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        
        const handleCustomUpdate = () => {
            console.log('🔄 Custom update event, refreshing bookings...');
            fetchBookings();
        };
        window.addEventListener('bookingsUpdated', handleCustomUpdate);
        
        // Poll for updates every 15 seconds
        const interval = setInterval(() => {
            if (document.hidden) return;
            fetchBookings();
        }, 15000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('bookingsUpdated', handleCustomUpdate);
            clearInterval(interval);
        };
    }, [isLoggedIn, navigate, fetchBookings]);

    // ✅ REQUEST CANCELLATION - Send cancellation request to guide
    const handleRequestCancellation = async (bookingId) => {
        if (!cancelReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }
        
        setProcessingId(bookingId);
        try {
            console.log(`📤 Requesting cancellation for booking ${bookingId}`);
            console.log(`📍 Endpoint: /guides/bookings/${bookingId}/request-cancel/`);
            console.log(`📝 Reason: ${cancelReason}`);
            
            // Send cancellation request to guide
            const response = await api.post(`/guides/bookings/${bookingId}/request-cancel/`, {
                reason: cancelReason
            });
            
            console.log('✅ Cancellation request response:', response.data);
            
            if (response.data?.success) {
                showToast('✅ Cancellation request sent to guide!');
                
                // ✅ Update local state - set status to pending_cancellation
                setBookings(prevBookings => 
                    prevBookings.map(b => 
                        (b.id === bookingId || b.booking_id === bookingId) 
                            ? { 
                                ...b, 
                                status: 'pending_cancellation',
                                cancellation_reason: cancelReason,
                                cancelled_by: 'traveler'
                              }
                            : b
                    )
                );
                
                // Update stats
                setStats(prev => {
                    const newStats = { ...prev };
                    newStats.pending = Math.max(0, (newStats.pending || 0) - 1);
                    newStats.pending_cancellation = (newStats.pending_cancellation || 0) + 1;
                    return newStats;
                });
                
                setCancelDialog(null);
                setCancelReason('');
                await fetchBookings(); // Refresh from backend
            } else {
                showToast(response.data?.message || 'Failed to send cancellation request');
            }
        } catch (error) {
            console.error('❌ Error requesting cancellation:', error);
            
            if (error.response?.data?.error) {
                showToast(error.response.data.error);
            } else if (error.response?.data?.message) {
                showToast(error.response.data.message);
            } else if (error.response?.data?.detail) {
                showToast(error.response.data.detail);
            } else if (error.response?.status === 400) {
                showToast('Cannot cancel this booking at this time.');
            } else if (error.response?.status === 404) {
                showToast('Booking not found. Please refresh and try again.');
            } else {
                showToast('Failed to send cancellation request. Please try again.');
            }
        } finally {
            setProcessingId(null);
        }
    };

    // ✅ COMPLETE BOOKING (if allowed)
    const handleCompleteBooking = async (bookingId) => {
        if (!window.confirm('Mark this booking as completed?')) return;
        setProcessingId(bookingId);
        try {
            const response = await api.post(`/guides/bookings/${bookingId}/complete/`);
            
            if (response.data?.success) {
                showToast('✅ Booking marked as completed!');
                setBookings(prevBookings => 
                    prevBookings.map(b => 
                        (b.id === bookingId || b.booking_id === bookingId) 
                            ? { ...b, status: 'completed' }
                            : b
                    )
                );
                await fetchBookings();
            } else {
                showToast(response.data?.message || 'Failed to complete booking');
            }
        } catch (error) {
            console.error('Error completing booking:', error);
            // Try fallback endpoint
            try {
                await api.post(`/guides/guides/bookings/${bookingId}/complete/`);
                showToast('✅ Booking marked as completed!');
                await fetchBookings();
            } catch (e) {
                alert('Failed to mark booking as completed');
            }
        } finally {
            setProcessingId(null);
        }
    };

    // ✅ DELETE BOOKING (for completed/cancelled bookings)
    const handleDeleteBooking = async (bookingId) => {
        if (!window.confirm('Delete this booking permanently?')) return;
        setProcessingId(bookingId);
        try {
            const response = await api.delete(`/guides/bookings/${bookingId}/`);
            
            if (response.status === 204 || response.data?.success) {
                showToast('🗑️ Booking deleted successfully');
                setBookings(prev => prev.filter(b => b.id !== bookingId && b.booking_id !== bookingId));
                await fetchBookings();
            } else {
                showToast('Failed to delete booking');
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
            // Try fallback
            try {
                await api.delete(`/guides/guides/bookings/${bookingId}/`);
                showToast('🗑️ Booking deleted successfully');
                await fetchBookings();
            } catch (e) {
                alert('Failed to delete booking');
            }
        } finally {
            setProcessingId(null);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const imagePromises = files.map((file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        id: Date.now() + Math.random(),
                        file: file,
                        dataUrl: reader.result,
                        name: file.name,
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(imagePromises).then((newImages) => {
            setReviewImages((prev) => [...prev, ...newImages]);
        });
    };

    const removeImage = (imageId) => {
        setReviewImages((prev) => prev.filter((img) => img.id !== imageId));
    };

    const handleSubmitReview = async (bookingId) => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        if (!reviewText.trim()) {
            alert('Please write a review');
            return;
        }

        setSubmittingReview(true);
        try {
            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('comment', reviewText);
            formData.append('type', 'review');
            
            reviewImages.forEach((img) => {
                if (img.file) {
                    formData.append('images', img.file);
                }
            });

            try {
                await api.post(`/guides/guides/bookings/${bookingId}/review/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } catch (e) {
                await api.post(`/guides/bookings/${bookingId}/review/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            
            showToast('✅ Review submitted successfully!');
            setReviewDialog(null);
            setRating(0);
            setReviewText('');
            setReviewImages([]);
            await fetchBookings();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setSubmittingReview(false);
        }
    };

    const showToast = (message) => {
        setToast({ message });
        setTimeout(() => setToast(null), 3000);
    };

    // ✅ Filter bookings - show ALL statuses
    const filteredBookings = filter === 'all' 
        ? bookings 
        : bookings.filter(b => b.status === filter);

    const toggleExpand = (id) => {
        setExpandedBooking(expandedBooking === id ? null : id);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: T.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        width: 40, height: 40, 
                        border: '3px solid #E4C77B', 
                        borderTop: '3px solid transparent', 
                        borderRadius: '50%', 
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto' 
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ marginTop: 16, color: T.muted, fontFamily: "'Inter', sans-serif" }}>
                        Loading your bookings...
                    </p>
                </div>
            </div>
        );
    }

    // ✅ Check if booking can be cancelled
    const canCancel = (status) => {
        return ['pending', 'confirmed'].includes(status);
    };

    // ✅ Check if booking is in cancellation requested state
    const isCancellationRequested = (status) => {
        return status === 'pending_cancellation';
    };

    return (
        <div style={{ 
            background: T.cream, 
            minHeight: '100vh', 
            paddingBottom: 40,
            fontFamily: "'Inter','Segoe UI',sans-serif",
            color: T.ink,
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&display=swap');
                .mb-font-display { font-family: 'Fraunces', serif; }
                .mb-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(7,46,42,0.1); }
                .mb-booking-card:hover { border-color: #C79A3E; }
                .mb-filter-btn { transition: all 0.2s ease; }
                .mb-filter-btn:hover { transform: translateY(-1px); }
            `}</style>

            {/* Header */}
            <div style={{ 
                background: `linear-gradient(135deg, ${T.deepTeal}, #0A4A44)`, 
                padding: '40px 20px 32px', 
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    background: 'radial-gradient(circle at 80% 20%, rgba(199,154,62,0.15), transparent 60%)' 
                }} />
                <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <Link 
                                    to="/guides" 
                                    style={{ 
                                        color: 'rgba(237,226,196,0.6)', 
                                        textDecoration: 'none', 
                                        fontSize: 12, 
                                        letterSpacing: 1.5, 
                                        textTransform: 'uppercase',
                                        fontFamily: "'IBM Plex Mono', monospace",
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                                    </svg>
                                    Back to Guides
                                </Link>
                            </div>
                            <h1 style={{ 
                                fontFamily: "'Fraunces', serif", 
                                fontStyle: 'italic', 
                                fontSize: 'clamp(32px, 4.5vw, 48px)', 
                                fontWeight: 500, 
                                color: '#fff', 
                                margin: '8px 0 4px' 
                            }}>
                                📅 My Bookings
                            </h1>
                            <p style={{ color: 'rgba(237,226,196,0.75)', fontSize: 'clamp(14px, 1.2vw, 17px)' }}>
                                {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                                onClick={fetchBookings}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 999,
                                    border: '1px solid rgba(199,154,62,0.3)',
                                    background: 'rgba(255,255,255,0.06)',
                                    color: T.goldLight,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                }}
                            >
                                🔄 Refresh
                            </button>
                            <Link
                                to="/guides"
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: 999,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #C79A3E, #E4C77B)',
                                    color: T.deepTeal,
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'transform 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.03)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <span>+</span> Book New Guide
                            </Link>
                        </div>
                    </div>
                </div>
                <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: 26 }}>
                    <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
                </svg>
            </div>

            {/* Stats Cards */}
            <div style={{ maxWidth: '1200px', margin: '-12px auto 0', padding: '0 20px', position: 'relative', zIndex: 2 }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                    gap: 12,
                    background: '#fff',
                    borderRadius: 16,
                    padding: '16px 20px',
                    boxShadow: '0 4px 20px rgba(7,46,42,0.08)',
                    border: '1px solid rgba(199,154,62,0.1)',
                }}>
                    <div className="mb-stat-card" style={{ textAlign: 'center', padding: '8px 4px', cursor: 'pointer' }} onClick={() => setFilter('all')}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: T.deepTeal }}>{stats.total}</div>
                        <div style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total</div>
                        {filter === 'all' && <div style={{ width: 24, height: 3, background: T.gold, borderRadius: 2, margin: '6px auto 0' }} />}
                    </div>
                    <div className="mb-stat-card" style={{ textAlign: 'center', padding: '8px 4px', cursor: 'pointer' }} onClick={() => setFilter('pending')}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: T.warning }}>{stats.pending}</div>
                        <div style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Pending</div>
                        {filter === 'pending' && <div style={{ width: 24, height: 3, background: T.gold, borderRadius: 2, margin: '6px auto 0' }} />}
                    </div>
                    <div className="mb-stat-card" style={{ textAlign: 'center', padding: '8px 4px', cursor: 'pointer' }} onClick={() => setFilter('pending_cancellation')}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#D97706' }}>{stats.pending_cancellation || 0}</div>
                        <div style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cancelling</div>
                        {filter === 'pending_cancellation' && <div style={{ width: 24, height: 3, background: T.gold, borderRadius: 2, margin: '6px auto 0' }} />}
                    </div>
                    <div className="mb-stat-card" style={{ textAlign: 'center', padding: '8px 4px', cursor: 'pointer' }} onClick={() => setFilter('confirmed')}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: T.success }}>{stats.confirmed}</div>
                        <div style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Confirmed</div>
                        {filter === 'confirmed' && <div style={{ width: 24, height: 3, background: T.gold, borderRadius: 2, margin: '6px auto 0' }} />}
                    </div>
                    <div className="mb-stat-card" style={{ textAlign: 'center', padding: '8px 4px', cursor: 'pointer' }} onClick={() => setFilter('completed')}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: T.info }}>{stats.completed}</div>
                        <div style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Completed</div>
                        {filter === 'completed' && <div style={{ width: 24, height: 3, background: T.gold, borderRadius: 2, margin: '6px auto 0' }} />}
                    </div>
                    <div className="mb-stat-card" style={{ textAlign: 'center', padding: '8px 4px', cursor: 'pointer' }} onClick={() => setFilter('cancelled')}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: T.danger }}>{stats.cancelled}</div>
                        <div style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cancelled</div>
                        {filter === 'cancelled' && <div style={{ width: 24, height: 3, background: T.gold, borderRadius: 2, margin: '6px auto 0' }} />}
                    </div>
                </div>
            </div>

            {/* Filter Tags */}
            <div style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 20px' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['all', 'pending', 'pending_cancellation', 'confirmed', 'completed', 'cancelled'].map((status) => {
                        const label = status === 'pending_cancellation' ? 'Cancelling' : status.charAt(0).toUpperCase() + status.slice(1);
                        return (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className="mb-filter-btn"
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: 999,
                                    border: filter === status ? '2px solid #0E5C53' : '1px solid #D1D5DB',
                                    background: filter === status ? '#0E5C53' : 'transparent',
                                    color: filter === status ? '#fff' : '#5C6E69',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    textTransform: 'capitalize',
                                    fontWeight: filter === status ? 600 : 400,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {status === 'all' ? '📋 All' : label}
                                <span style={{ 
                                    marginLeft: 6, 
                                    opacity: 0.7,
                                    fontSize: 10,
                                }}>
                                    ({bookings.filter(b => b.status === status).length})
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bookings List */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 20px 40px' }}>
                {filteredBookings.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '60px 20px',
                        background: '#fff',
                        borderRadius: 16,
                        border: '1px solid rgba(199,154,62,0.15)',
                        boxShadow: '0 4px 20px rgba(7,46,42,0.04)',
                    }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>📅</div>
                        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.deepTeal, fontStyle: 'italic' }}>
                            {bookings.length === 0 ? 'No bookings yet' : `No ${filter} bookings`}
                        </h2>
                        <p style={{ color: T.muted2, fontSize: 15, maxWidth: 400, margin: '8px auto 0' }}>
                            {bookings.length === 0 
                                ? 'Book a guide from the guide listing page to start your Kerala adventure!' 
                                : `You don't have any ${filter} bookings.`}
                        </p>
                        <Link to="/guides" style={{
                            display: 'inline-block',
                            marginTop: 20,
                            padding: '12px 32px',
                            borderRadius: 999,
                            background: 'linear-gradient(135deg, #C79A3E, #E4C77B)',
                            color: T.deepTeal,
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: 14,
                            boxShadow: '0 4px 16px rgba(199,154,62,0.3)',
                            transition: 'transform 0.2s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                            Browse Guides →
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                        {filteredBookings.map((booking) => {
                            const c = getStatusColor(booking.status);
                            const isCompleted = booking.status === 'completed';
                            const hasReview = booking.review || booking.has_review;
                            const isExpanded = expandedBooking === booking.id;
                            const showCancel = canCancel(booking.status);
                            const isCancellationRequested = booking.status === 'pending_cancellation';

                            return (
                                <div
                                    key={booking.id}
                                    className="mb-booking-card"
                                    style={{
                                        background: '#fff',
                                        borderRadius: 16,
                                        border: isCancellationRequested ? '2px solid #D97706' : '1px solid rgba(199,154,62,0.12)',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s ease',
                                        boxShadow: isCancellationRequested ? '0 4px 20px rgba(217,119,6,0.15)' : '0 2px 12px rgba(7,46,42,0.04)',
                                    }}>
                                    {/* Main Booking Row */}
                                    <div
                                        style={{
                                            padding: '18px 24px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 12,
                                        }}
                                        onClick={() => toggleExpand(booking.id)}>
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                <span style={{ 
                                                    fontWeight: 600, 
                                                    color: T.ink, 
                                                    fontSize: 16,
                                                    fontFamily: "'Fraunces', serif",
                                                }}>
                                                    {booking.destination || booking.district || 'Kerala Tour'}
                                                </span>
                                                <span
                                                    style={{
                                                        padding: '3px 12px',
                                                        borderRadius: 999,
                                                        fontSize: 10,
                                                        background: c.bg,
                                                        color: c.text,
                                                        fontWeight: 600,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}>
                                                    {c.icon} {c.label}
                                                </span>
                                                {isCancellationRequested && (
                                                    <span style={{
                                                        padding: '3px 12px',
                                                        borderRadius: 999,
                                                        fontSize: 10,
                                                        background: '#FEF3C7',
                                                        color: '#D97706',
                                                        fontWeight: 600,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        animation: 'pulse 2s infinite',
                                                    }}>
                                                        ⏳ Waiting for guide approval
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                    🧭 {booking.guide_name || booking.guideName || 'Guide'}
                                                </span>
                                                {booking.district && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 12 }}>
                                                        📍 {typeof booking.district === 'object' ? booking.district.name : booking.district}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: T.muted2, marginTop: 2 }}>
                                                📅 {booking.date} • ⏰ {booking.time}
                                                {booking.number_of_people > 1 && ` • 👥 ${booking.number_of_people} people`}
                                            </div>
                                            {booking.cancellation_reason && booking.status === 'cancelled' && (
                                                <div style={{ fontSize: 12, color: T.danger, marginTop: 4, background: '#FEE2E2', padding: '4px 10px', borderRadius: 6 }}>
                                                    ❌ Cancelled: {booking.cancellation_reason}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                            {/* Complete button for confirmed bookings */}
                                            {booking.status === 'confirmed' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCompleteBooking(booking.id || booking.booking_id);
                                                    }}
                                                    disabled={processingId === booking.id}
                                                    style={{
                                                        padding: '6px 14px',
                                                        borderRadius: 999,
                                                        border: 'none',
                                                        background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                                                        color: '#fff',
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        cursor: processingId === booking.id ? 'not-allowed' : 'pointer',
                                                        opacity: processingId === booking.id ? 0.6 : 1,
                                                        transition: 'all 0.2s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                                                >
                                                    {processingId === booking.id ? '...' : '✅ Complete'}
                                                </button>
                                            )}

                                            {/* Write Review button for completed bookings */}
                                            {isCompleted && !hasReview && (
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
                                                        background: 'linear-gradient(135deg, #FF9800, #FFC107)',
                                                        color: '#fff',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 12px rgba(255,152,0,0.3)',
                                                        transition: 'transform 0.2s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
                                                    ⭐ Write Review
                                                </button>
                                            )}
                                            
                                            {hasReview && (
                                                <span
                                                    style={{
                                                        padding: '4px 14px',
                                                        borderRadius: 999,
                                                        fontSize: 11,
                                                        background: '#FEF3C7',
                                                        color: '#D97706',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}>
                                                    ⭐ Reviewed
                                                    {booking.review?.rating && ` (${booking.review.rating}/5)`}
                                                </span>
                                            )}

                                            {/* ✅ CANCEL button for pending/confirmed bookings */}
                                            {showCancel && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCancelDialog(booking);
                                                        setCancelReason('');
                                                    }}
                                                    disabled={processingId === booking.id}
                                                    style={{
                                                        padding: '6px 14px',
                                                        borderRadius: 999,
                                                        border: '1px solid #EF4444',
                                                        background: 'transparent',
                                                        color: '#EF4444',
                                                        fontSize: 11,
                                                        cursor: processingId === booking.id ? 'not-allowed' : 'pointer',
                                                        opacity: processingId === booking.id ? 0.6 : 1,
                                                        transition: 'all 0.2s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}
                                                    onMouseEnter={(e) => { 
                                                        e.currentTarget.style.background = '#FEE2E2';
                                                        e.currentTarget.style.transform = 'scale(1.02)';
                                                    }}
                                                    onMouseLeave={(e) => { 
                                                        e.currentTarget.style.background = 'transparent';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    {processingId === booking.id ? '...' : '❌ Cancel'}
                                                </button>
                                            )}

                                            {/* Show cancellation requested status */}
                                            {isCancellationRequested && (
                                                <span style={{
                                                    padding: '6px 14px',
                                                    borderRadius: 999,
                                                    background: '#FEF3C7',
                                                    color: '#D97706',
                                                    fontSize: 11,
                                                    fontWeight: 500,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}>
                                                    ⏳ Awaiting Guide
                                                </span>
                                            )}

                                            {/* Delete button for completed/cancelled bookings */}
                                            {(booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected') && (
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
                                                        cursor: processingId === booking.id ? 'not-allowed' : 'pointer',
                                                        opacity: processingId === booking.id ? 0.6 : 1,
                                                        transition: 'all 0.2s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}
                                                    onMouseEnter={(e) => { 
                                                        e.currentTarget.style.background = '#FECACA';
                                                        e.currentTarget.style.transform = 'scale(1.02)';
                                                    }}
                                                    onMouseLeave={(e) => { 
                                                        e.currentTarget.style.background = '#FEE2E2';
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                    }}
                                                >
                                                    {processingId === booking.id ? '...' : '🗑️ Delete'}
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleExpand(booking.id);
                                                }}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: 4,
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: T.muted2,
                                                    cursor: 'pointer',
                                                    fontSize: 18,
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.3s ease',
                                                }}>
                                                ▼
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div style={{ 
                                            padding: '20px 24px 24px', 
                                            borderTop: '1px solid rgba(199,154,62,0.08)',
                                            background: T.cream,
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                <div>
                                                    <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Booking ID</p>
                                                    <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink, fontFamily: "'IBM Plex Mono', monospace" }}>
                                                        #{booking.booking_id || booking.id}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Guide</p>
                                                    <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                        {booking.guide_name || booking.guideName || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>District</p>
                                                    <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                        {typeof booking.district === 'object' ? booking.district.name : booking.district || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Destination</p>
                                                    <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                        {booking.destination || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Date & Time</p>
                                                    <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                        {booking.date} • {booking.time}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Status</p>
                                                    <span
                                                        style={{
                                                            padding: '3px 12px',
                                                            borderRadius: 999,
                                                            fontSize: 11,
                                                            fontWeight: 500,
                                                            background: c.bg,
                                                            color: c.text,
                                                            display: 'inline-block',
                                                            marginTop: 4,
                                                        }}>
                                                        {c.icon} {c.label}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Price</p>
                                                    <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                        ₹{booking.total_price || 0}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>People</p>
                                                    <p style={{ fontSize: 14, fontWeight: 500, margin: '4px 0 0', color: T.ink }}>
                                                        {booking.number_of_people || 1}
                                                    </p>
                                                </div>
                                                {booking.special_requests && (
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Special Requests</p>
                                                        <p style={{ fontSize: 14, margin: '4px 0 0', color: T.ink, background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(199,154,62,0.08)' }}>
                                                            {booking.special_requests}
                                                        </p>
                                                    </div>
                                                )}
                                                {booking.cancellation_reason && booking.status === 'cancelled' && (
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Cancellation Reason</p>
                                                        <p style={{ fontSize: 14, margin: '4px 0 0', color: T.danger, background: '#FEE2E2', padding: '10px 14px', borderRadius: 8 }}>
                                                            {booking.cancellation_reason}
                                                        </p>
                                                    </div>
                                                )}
                                                {booking.review && (
                                                    <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                                                        <p style={{ fontSize: 11, color: T.muted2, textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>Your Review</p>
                                                        <div style={{ 
                                                            background: '#fff', 
                                                            padding: '16px 20px', 
                                                            borderRadius: 12, 
                                                            marginTop: 4,
                                                            border: '1px solid rgba(199,154,62,0.12)',
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
                                                            {booking.review.images && booking.review.images.length > 0 && (
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    gap: 10, 
                                                                    marginTop: 12, 
                                                                    flexWrap: 'wrap' 
                                                                }}>
                                                                    {booking.review.images.map((img, idx) => (
                                                                        <img
                                                                            key={idx}
                                                                            src={img}
                                                                            alt={`Review ${idx + 1}`}
                                                                            style={{
                                                                                width: 72,
                                                                                height: 72,
                                                                                borderRadius: 8,
                                                                                objectFit: 'cover',
                                                                                border: '1px solid rgba(199,154,62,0.12)',
                                                                            }}
                                                                        />
                                                                    ))}
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
                )}
            </div>

            {/* Cancel Dialog */}
            {cancelDialog && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(7,46,42,0.6)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px',
                }} onClick={() => { setCancelDialog(null); setCancelReason(''); }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 20,
                        padding: '36px',
                        maxWidth: '500px',
                        width: '100%',
                        boxShadow: '0 24px 80px rgba(7,46,42,0.4)',
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
                                }}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div style={{ 
                            background: T.cream, 
                            padding: '12px 16px', 
                            borderRadius: 12, 
                            marginBottom: 20,
                            border: '1px solid rgba(199,154,62,0.08)',
                        }}>
                            <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>
                                You are about to cancel your booking with <strong style={{ color: T.deepTeal }}>{cancelDialog.guide_name || 'the guide'}</strong>
                            </p>
                            <p style={{ fontSize: 12, color: T.muted2, margin: '4px 0 0' }}>
                                📅 {cancelDialog.date} • ⏰ {cancelDialog.time}
                            </p>
                            <p style={{ fontSize: 12, color: T.warning, margin: '8px 0 0' }}>
                                ⚠️ The guide will be notified and must approve the cancellation.
                            </p>
                        </div>
                        
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: T.ink, display: 'block', marginBottom: 6 }}>
                                Reason for Cancellation <span style={{ color: T.danger }}>*</span>
                            </label>
                            <textarea
                                placeholder="Please explain why you need to cancel this booking..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: 12,
                                    border: '1px solid #D1D5DB',
                                    fontSize: 14,
                                    resize: 'vertical',
                                    minHeight: 80,
                                    fontFamily: 'inherit',
                                    transition: 'border-color 0.2s ease',
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = T.gold; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => { setCancelDialog(null); setCancelReason(''); }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: 12,
                                    border: '1px solid #D1D5DB',
                                    background: 'transparent',
                                    color: T.muted,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500,
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRequestCancellation(cancelDialog.id || cancelDialog.booking_id)}
                                disabled={processingId === cancelDialog.id || !cancelReason.trim()}
                                style={{
                                    flex: 2,
                                    padding: '12px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: (processingId === cancelDialog.id || !cancelReason.trim()) 
                                        ? '#D1D5DB' 
                                        : '#EF4444',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: (processingId === cancelDialog.id || !cancelReason.trim()) 
                                        ? 'not-allowed' 
                                        : 'pointer',
                                    fontSize: 14,
                                    transition: 'transform 0.2s ease',
                                }}
                                onMouseEnter={(e) => { 
                                    if (!(processingId === cancelDialog.id || !cancelReason.trim())) {
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }
                                }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                {processingId === cancelDialog.id ? 'Sending...' : '✅ Request Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Dialog */}
            {reviewDialog && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(7,46,42,0.6)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px',
                }} onClick={() => setReviewDialog(null)}>
                    <div 
                        style={{
                            background: '#fff',
                            borderRadius: 20,
                            padding: '36px',
                            maxWidth: '560px',
                            width: '100%',
                            boxShadow: '0 24px 80px rgba(7,46,42,0.4)',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            border: '1px solid rgba(199,154,62,0.15)',
                        }} 
                        onClick={(e) => e.stopPropagation()}>
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
                                <span>⭐</span> Share Your Experience
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
                                }}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div style={{ 
                            background: T.cream, 
                            padding: '12px 16px', 
                            borderRadius: 12, 
                            marginBottom: 20,
                            border: '1px solid rgba(199,154,62,0.08)',
                        }}>
                            <p style={{ color: T.muted, fontSize: 14, margin: 0 }}>
                                How was your trip with <strong style={{ color: T.deepTeal }}>{reviewDialog.guide_name || 'the guide'}</strong>?
                            </p>
                            <p style={{ fontSize: 12, color: T.muted2, margin: '4px 0 0' }}>
                                📍 {typeof reviewDialog.district === 'object' ? reviewDialog.district.name : reviewDialog.district || 'Kerala'} • 📅 {reviewDialog.date}
                            </p>
                        </div>
                        
                        {/* Rating */}
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <p style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>Rate your experience</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="mb-star-btn"
                                        style={{
                                            fontSize: 36,
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '0 2px',
                                            transition: 'all 0.2s ease',
                                        }}>
                                        <span style={{ 
                                            color: rating >= star ? '#FFB300' : '#E0E0E0',
                                            textShadow: rating >= star ? '0 0 30px rgba(255,179,0,0.3)' : 'none',
                                            display: 'inline-block',
                                            transform: rating >= star ? 'scale(1.1)' : 'scale(1)',
                                            transition: 'transform 0.2s ease',
                                        }}>
                                            ★
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize: 13, color: T.muted, marginTop: 8, fontWeight: 500 }}>
                                {rating === 0 && 'Tap a star to rate'}
                                {rating === 1 && '⭐ Poor'}
                                {rating === 2 && '⭐⭐ Fair'}
                                {rating === 3 && '⭐⭐⭐ Good'}
                                {rating === 4 && '⭐⭐⭐⭐ Very Good'}
                                {rating === 5 && '⭐⭐⭐⭐⭐ Excellent!'}
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
                                    padding: '12px 16px',
                                    borderRadius: 12,
                                    border: '1px solid #D1D5DB',
                                    fontSize: 14,
                                    resize: 'vertical',
                                    minHeight: 100,
                                    fontFamily: 'inherit',
                                    transition: 'border-color 0.2s ease',
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = T.gold; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
                            />
                        </div>
                        
                        {/* Image Upload */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: T.ink, display: 'block', marginBottom: 6 }}>
                                📸 Add Photos <span style={{ fontSize: 11, color: T.muted2, fontWeight: 400 }}>(optional)</span>
                            </label>
                            
                            {reviewImages.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: '8px',
                                    margin: '10px 0',
                                }}>
                                    {reviewImages.map((img) => (
                                        <div key={img.id} style={{
                                            position: 'relative',
                                            paddingBottom: '100%',
                                            borderRadius: 10,
                                            overflow: 'hidden',
                                            border: '1px solid rgba(199,154,62,0.12)',
                                        }}>
                                            <img 
                                                src={img.dataUrl} 
                                                alt="Review" 
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
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div
                                style={{
                                    border: '2px dashed #D1D5DB',
                                    borderRadius: 12,
                                    padding: '24px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onClick={() => document.getElementById('review-image-input').click()}
                            >
                                <div style={{ fontSize: 36, marginBottom: 8 }}>📸</div>
                                <p style={{ margin: 0, fontSize: 14, color: T.muted }}>
                                    Drag & drop photos here, or <span style={{ color: T.gold, fontWeight: 500 }}>click to browse</span>
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted2 }}>
                                    Max 5 photos
                                </p>
                                <input
                                    id="review-image-input"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setReviewDialog(null)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: 12,
                                    border: '1px solid #D1D5DB',
                                    background: 'transparent',
                                    color: T.muted,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 500,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmitReview(reviewDialog.id || reviewDialog.booking_id)}
                                disabled={submittingReview || rating === 0 || !reviewText.trim()}
                                style={{
                                    flex: 2,
                                    padding: '12px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: (submittingReview || rating === 0 || !reviewText.trim()) 
                                        ? '#D1D5DB' 
                                        : 'linear-gradient(135deg, #FF9800, #FFC107)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: (submittingReview || rating === 0 || !reviewText.trim()) 
                                        ? 'not-allowed' 
                                        : 'pointer',
                                    fontSize: 14,
                                }}
                            >
                                {submittingReview ? 'Submitting...' : '✅ Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: 30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: T.deepTeal,
                    color: T.goldLight,
                    padding: '14px 28px',
                    borderRadius: 12,
                    fontSize: 14,
                    boxShadow: '0 8px 32px rgba(7,46,42,0.3)',
                    zIndex: 60,
                    border: '1px solid rgba(199,154,62,0.15)',
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
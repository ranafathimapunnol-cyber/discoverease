// src/pages/MyBookings.jsx - COMPLETE FIXED WITH CORRECT API URLS & REMOVED QUICK VIEW

import React, { useState, useEffect } from 'react';
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
};

const STATUS_COLORS = {
    confirmed: { bg: '#DCFCE7', text: '#16A34A' },
    pending: { bg: '#FEF3C7', text: '#D97706' },
    completed: { bg: '#DBEAFE', text: '#2563EB' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626' },
    rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

const getStatusColor = (status) => STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#6B7280' };

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

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        fetchBookings();
        
        // 🔄 Listen for storage changes from Guide Dashboard (cross-tab)
        const handleStorageChange = (e) => {
            if (e.key === 'traveler_bookings' || e.key === 'hidden_gems_suggestions' || e.key === 'guide_bookings_update') {
                console.log('🔄 Storage changed, refreshing bookings...');
                fetchBookings();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        
        // 🔄 Listen for custom event (same-tab updates)
        const handleCustomUpdate = () => {
            console.log('🔄 Custom update event, refreshing bookings...');
            fetchBookings();
        };
        window.addEventListener('bookingsUpdated', handleCustomUpdate);
        
        // 🔄 Poll for updates every 5 seconds (fallback)
        const interval = setInterval(() => {
            if (document.hidden) return;
            fetchBookings();
        }, 5000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('bookingsUpdated', handleCustomUpdate);
            clearInterval(interval);
        };
    }, [isLoggedIn, navigate]);

    // ✅ FIXED: Correct API URLs - using /guides/guides/ for guide endpoints
    const fetchBookings = async () => {
        setLoading(true);
        try {
            let bookingsData = [];
            
            // ✅ FIXED: Correct URL - /guides/guides/bookings/
            try {
                const response = await api.get('/guides/guides/bookings/');
                if (response.data) {
                    if (response.data.success && response.data.bookings) {
                        bookingsData = response.data.bookings;
                    } else if (Array.isArray(response.data)) {
                        bookingsData = response.data;
                    } else if (response.data.results) {
                        bookingsData = response.data.results;
                    }
                }
            } catch (e) {
                console.log('API bookings fetch failed:', e);
                // Fallback: try without double guides
                try {
                    const response2 = await api.get('/guides/bookings/');
                    if (response2.data) {
                        if (response2.data.success && response2.data.bookings) {
                            bookingsData = response2.data.bookings;
                        } else if (Array.isArray(response2.data)) {
                            bookingsData = response2.data;
                        }
                    }
                } catch (e2) {
                    console.log('Fallback API also failed:', e2);
                }
            }
            
            // If no API data, try localStorage
            if (bookingsData.length === 0) {
                try {
                    const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
                    if (user?.email) {
                        bookingsData = travelerBookings.filter(b => b.travelerEmail === user.email || b.user?.email === user.email);
                    } else {
                        bookingsData = travelerBookings;
                    }
                } catch (e) {
                    console.error('Error reading localStorage:', e);
                }
            }
            
            // Merge with localStorage for latest status
            try {
                const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
                const userEmail = user?.email;
                
                if (bookingsData.length > 0 && userEmail) {
                    const localUserBookings = travelerBookings.filter(b => b.travelerEmail === userEmail || b.user?.email === userEmail);
                    const localMap = {};
                    localUserBookings.forEach(b => {
                        localMap[b.id] = b;
                    });
                    
                    bookingsData = bookingsData.map(b => {
                        if (localMap[b.id]) {
                            return { ...b, ...localMap[b.id] };
                        }
                        return b;
                    });
                    
                    const apiIds = new Set(bookingsData.map(b => b.id));
                    localUserBookings.forEach(b => {
                        if (!apiIds.has(b.id)) {
                            bookingsData.push(b);
                        }
                    });
                }
            } catch (e) {
                console.log('Error merging with localStorage:', e);
            }
            
            setBookings(bookingsData);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: Correct cancel URL
    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Cancel this booking?')) return;
        setProcessingId(bookingId);
        try {
            // ✅ FIXED: Use correct URL
            try {
                await api.post(`/guides/guides/bookings/${bookingId}/cancel/`);
            } catch (e) {
                try {
                    await api.post(`/guides/bookings/${bookingId}/cancel/`);
                } catch (e2) {
                    console.log('Cancel API failed:', e2);
                }
            }
            
            // Update localStorage
            try {
                const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
                const updated = travelerBookings.map(b => 
                    b.id === bookingId ? { ...b, status: 'cancelled' } : b
                );
                localStorage.setItem('traveler_bookings', JSON.stringify(updated));
                window.dispatchEvent(new StorageEvent('storage', { key: 'traveler_bookings' }));
                window.dispatchEvent(new StorageEvent('storage', { key: 'guide_bookings_update' }));
                window.dispatchEvent(new CustomEvent('bookingsUpdated'));
            } catch (e) {
                console.log('Error updating localStorage:', e);
            }
            
            await fetchBookings();
            showToast('Booking cancelled successfully');
        } catch (error) {
            alert('Failed to cancel booking');
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

    // ✅ FIXED: Correct review URL
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

            // ✅ FIXED: Use correct URL
            try {
                await api.post(`/guides/guides/bookings/${bookingId}/review/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } catch (e) {
                try {
                    await api.post(`/guides/bookings/${bookingId}/review/`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                } catch (e2) {
                    console.log('Review API failed:', e2);
                }
            }
            
            // Save to localStorage
            try {
                const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
                const updated = travelerBookings.map(b => {
                    if (b.id === bookingId) {
                        return { 
                            ...b, 
                            review: { 
                                rating, 
                                comment: reviewText, 
                                images: reviewImages.map(img => img.dataUrl),
                                created_at: new Date().toISOString(),
                                type: 'review'
                            },
                            has_review: true 
                        };
                    }
                    return b;
                });
                localStorage.setItem('traveler_bookings', JSON.stringify(updated));
                
                // Save as suggestion for guide
                try {
                    const existingSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
                    const booking = updated.find(b => b.id === bookingId);
                    
                    const reviewSuggestion = {
                        id: `review-${bookingId}-${Date.now()}`,
                        type: 'review',
                        name: `⭐ Review for ${booking?.guide_name || booking?.guideName || 'Guide'}`,
                        description: reviewText,
                        rating: rating,
                        images: reviewImages.map(img => img.dataUrl),
                        district: booking?.district?.name || booking?.district || '',
                        location_info: booking?.destination || '',
                        category: 'Review',
                        status: 'pending',
                        user_email: user?.email || 'traveler',
                        created_at: new Date().toISOString(),
                        booking_id: bookingId,
                        guide_name: booking?.guide_name || booking?.guideName || '',
                    };
                    
                    existingSuggestions.push(reviewSuggestion);
                    localStorage.setItem('hidden_gems_suggestions', JSON.stringify(existingSuggestions));
                    
                    window.dispatchEvent(new StorageEvent('storage', { key: 'hidden_gems_suggestions' }));
                    window.dispatchEvent(new StorageEvent('storage', { key: 'guide_bookings_update' }));
                    window.dispatchEvent(new CustomEvent('bookingsUpdated'));
                } catch (suggestionError) {
                    console.warn('Could not save review as suggestion:', suggestionError);
                }
                
                window.dispatchEvent(new StorageEvent('storage', { key: 'traveler_bookings' }));
                window.dispatchEvent(new StorageEvent('storage', { key: 'guide_bookings_update' }));
                window.dispatchEvent(new CustomEvent('bookingsUpdated'));
            } catch (e) {
                console.log('Error saving review:', e);
            }
            
            showToast('✅ Review submitted successfully! The guide will be notified.');
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
                    <p style={{ marginTop: 16, color: T.muted }}>Loading your bookings...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ 
            background: T.cream, 
            minHeight: '100vh', 
            paddingBottom: 40,
            fontFamily: "'Inter','Segoe UI',sans-serif",
            color: T.ink,
        }}>
            {/* Header */}
            <div style={{ background: T.deepTeal, padding: '32px 20px 24px', position: 'relative' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                            <Link to="/guides" style={{ color: T.goldLight, textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                ← Back to Guides
                            </Link>
                            <h1 style={{ 
                                fontFamily: "'Fraunces', serif", 
                                fontStyle: 'italic', 
                                fontSize: 'clamp(28px, 4vw, 40px)', 
                                fontWeight: 500, 
                                color: '#fff', 
                                margin: '8px 0 4px' 
                            }}>
                                📅 My Bookings
                            </h1>
                            <p style={{ color: 'rgba(237,226,196,0.75)', fontSize: 14 }}>
                                {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        <button
                            onClick={fetchBookings}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 999,
                                border: '1px solid rgba(199,154,62,0.3)',
                                background: 'transparent',
                                color: T.goldLight,
                                cursor: 'pointer',
                                fontSize: 13,
                            }}>
                            🔄 Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 20px 0' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 999,
                                border: filter === status ? '2px solid #0E5C53' : '1px solid #D1D5DB',
                                background: filter === status ? '#0E5C53' : 'transparent',
                                color: filter === status ? '#fff' : '#5C6E69',
                                cursor: 'pointer',
                                fontSize: 13,
                                textTransform: 'capitalize',
                            }}>
                            {status}
                            {status !== 'all' && (
                                <span style={{ 
                                    marginLeft: 6, 
                                    opacity: 0.7,
                                    fontSize: 11,
                                }}>
                                    ({bookings.filter(b => b.status === status).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bookings List */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 40px' }}>
                {filteredBookings.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '60px 20px',
                        background: '#fff',
                        borderRadius: 12,
                        border: '1px solid rgba(199,154,62,0.2)',
                    }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>📅</div>
                        <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: T.deepTeal }}>
                            {bookings.length === 0 ? 'No bookings yet' : `No ${filter} bookings`}
                        </h2>
                        <p style={{ color: T.muted2 }}>
                            {bookings.length === 0 
                                ? 'Book a guide from the guide listing page to start your Kerala adventure!' 
                                : `You don't have any ${filter} bookings.`}
                        </p>
                        <Link to="/guides" style={{
                            display: 'inline-block',
                            marginTop: 16,
                            padding: '10px 24px',
                            borderRadius: 999,
                            background: '#0E5C53',
                            color: '#fff',
                            textDecoration: 'none',
                        }}>
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

                            return (
                                <div
                                    key={booking.id}
                                    style={{
                                        background: '#fff',
                                        borderRadius: 12,
                                        border: '1px solid rgba(199,154,62,0.15)',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s ease',
                                    }}>
                                    {/* Main Booking Row */}
                                    <div
                                        style={{
                                            padding: '16px 20px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 12,
                                        }}
                                        onClick={() => toggleExpand(booking.id)}>
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 600, color: T.ink, fontSize: 16 }}>
                                                    {booking.destination || booking.district?.name || 'Kerala Tour'}
                                                </span>
                                                <span
                                                    style={{
                                                        padding: '2px 10px',
                                                        borderRadius: 999,
                                                        fontSize: 10,
                                                        background: c.bg,
                                                        color: c.text,
                                                        fontWeight: 500,
                                                    }}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>
                                                🧭 {booking.guide_name || booking.guideName || 'Guide'} 
                                                {booking.district && ` • 📍 ${booking.district.name || booking.district}`}
                                            </div>
                                            <div style={{ fontSize: 12, color: T.muted2, marginTop: 2 }}>
                                                📅 {booking.date} • ⏰ {booking.time}
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                                                        padding: '6px 14px',
                                                        borderRadius: 999,
                                                        border: 'none',
                                                        background: 'linear-gradient(135deg, #FF9800, #FFC107)',
                                                        color: '#fff',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(255,152,0,0.3)',
                                                    }}>
                                                    ⭐ Write Review
                                                </button>
                                            )}
                                            
                                            {hasReview && (
                                                <span
                                                    style={{
                                                        padding: '4px 12px',
                                                        borderRadius: 999,
                                                        fontSize: 11,
                                                        background: '#FEF3C7',
                                                        color: '#D97706',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                    }}>
                                                    ⭐ Reviewed
                                                    {booking.review?.rating && ` (${booking.review.rating}/5)`}
                                                </span>
                                            )}
                                            
                                            {booking.status === 'pending' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancelBooking(booking.id);
                                                    }}
                                                    disabled={processingId === booking.id}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: 999,
                                                        border: '1px solid #EF4444',
                                                        background: 'transparent',
                                                        color: '#EF4444',
                                                        fontSize: 11,
                                                        cursor: processingId === booking.id ? 'not-allowed' : 'pointer',
                                                        opacity: processingId === booking.id ? 0.6 : 1,
                                                    }}>
                                                    {processingId === booking.id ? '...' : 'Cancel'}
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
                                                    transition: 'transform 0.2s',
                                                }}>
                                                    ▼
                                                </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div style={{ 
                                            padding: '16px 20px 20px', 
                                            borderTop: '1px solid rgba(199,154,62,0.1)',
                                            background: T.cream,
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <div>
                                                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Booking ID</p>
                                                    <p style={{ fontSize: 13, fontWeight: 500, margin: '2px 0 0' }}>#{booking.id}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Guide</p>
                                                    <p style={{ fontSize: 13, fontWeight: 500, margin: '2px 0 0' }}>
                                                        {booking.guide_name || booking.guideName || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>District</p>
                                                    <p style={{ fontSize: 13, fontWeight: 500, margin: '2px 0 0' }}>
                                                        {booking.district?.name || booking.district || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Destination</p>
                                                    <p style={{ fontSize: 13, fontWeight: 500, margin: '2px 0 0' }}>
                                                        {booking.destination || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Date & Time</p>
                                                    <p style={{ fontSize: 13, fontWeight: 500, margin: '2px 0 0' }}>
                                                        {booking.date} • {booking.time}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Status</p>
                                                    <span
                                                        style={{
                                                            padding: '2px 10px',
                                                            borderRadius: 999,
                                                            fontSize: 11,
                                                            fontWeight: 500,
                                                            background: c.bg,
                                                            color: c.text,
                                                            display: 'inline-block',
                                                            marginTop: 2,
                                                        }}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                {booking.notes && (
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Notes</p>
                                                        <p style={{ fontSize: 13, margin: '2px 0 0', color: T.ink }}>
                                                            {booking.notes}
                                                        </p>
                                                    </div>
                                                )}
                                                {booking.review && (
                                                    <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                                                        <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Your Review</p>
                                                        <div style={{ 
                                                            background: '#fff', 
                                                            padding: '12px 16px', 
                                                            borderRadius: 8, 
                                                            marginTop: 4,
                                                            border: '1px solid rgba(199,154,62,0.15)',
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ fontSize: 18, color: '#FFB300' }}>
                                                                    {'★'.repeat(Math.round(booking.review.rating || 0))}
                                                                    {'☆'.repeat(5 - Math.round(booking.review.rating || 0))}
                                                                </span>
                                                                <span style={{ fontSize: 12, color: T.muted }}>
                                                                    {booking.review.rating}/5
                                                                </span>
                                                                {booking.review.created_at && (
                                                                    <span style={{ fontSize: 11, color: T.muted2, marginLeft: 'auto' }}>
                                                                        📅 {new Date(booking.review.created_at).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p style={{ fontSize: 13, color: T.ink, margin: '6px 0 0' }}>
                                                                {booking.review.comment}
                                                            </p>
                                                            {booking.review.images && booking.review.images.length > 0 && (
                                                                <div style={{ 
                                                                    display: 'flex', 
                                                                    gap: 8, 
                                                                    marginTop: 8, 
                                                                    flexWrap: 'wrap' 
                                                                }}>
                                                                    {booking.review.images.map((img, idx) => (
                                                                        <img
                                                                            key={idx}
                                                                            src={img}
                                                                            alt={`Review ${idx + 1}`}
                                                                            style={{
                                                                                width: 60,
                                                                                height: 60,
                                                                                borderRadius: 6,
                                                                                objectFit: 'cover',
                                                                                border: '1px solid #D1D5DB',
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div style={{ 
                                                                marginTop: 8, 
                                                                fontSize: 11, 
                                                                color: T.muted2,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                padding: '6px 10px',
                                                                background: '#F0F9FF',
                                                                borderRadius: 6,
                                                            }}>
                                                                <span>📤</span>
                                                                <span>Your review has been shared with the guide and is pending their approval.</span>
                                                            </div>
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

            {/* Review Dialog */}
            {reviewDialog && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px',
                }} onClick={() => setReviewDialog(null)}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 16,
                        padding: '32px',
                        maxWidth: '520px',
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        maxHeight: '90vh',
                        overflow: 'auto',
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, color: T.ink }}>⭐ Share Your Experience</h3>
                            <button
                                onClick={() => setReviewDialog(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 24,
                                    cursor: 'pointer',
                                    color: T.muted,
                                }}>
                                ×
                            </button>
                        </div>
                        
                        <p style={{ color: T.muted, fontSize: 14, marginBottom: 16 }}>
                            How was your trip with <strong>{reviewDialog.guide_name || 'the guide'}</strong>?
                            <br />
                            <span style={{ fontSize: 12, color: T.muted2 }}>
                                Your review will be shared with the guide and appear on your profile upon approval.
                            </span>
                        </p>
                        
                        {/* Rating */}
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        style={{
                                            fontSize: 32,
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            transform: rating >= star ? 'scale(1.1)' : 'scale(1)',
                                        }}>
                                        <span style={{ 
                                            color: rating >= star ? '#FFB300' : '#E0E0E0',
                                            textShadow: rating >= star ? '0 0 20px rgba(255,179,0,0.3)' : 'none',
                                        }}>
                                            ★
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize: 13, color: T.muted, marginTop: 8 }}>
                                {rating === 0 && 'Tap a star to rate'}
                                {rating === 1 && 'Poor'}
                                {rating === 2 && 'Fair'}
                                {rating === 3 && 'Good'}
                                {rating === 4 && 'Very Good'}
                                {rating === 5 && 'Excellent!'}
                            </p>
                        </div>
                        
                        {/* Review Text */}
                        <textarea
                            placeholder="Share your experience with this guide..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 8,
                                border: '1px solid #D1D5DB',
                                fontSize: 14,
                                resize: 'vertical',
                                minHeight: 80,
                                fontFamily: 'inherit',
                            }}
                        />
                        
                        {/* Image Upload */}
                        <div style={{ marginTop: 12 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: T.ink, display: 'block', marginBottom: 4 }}>
                                📸 Add Photos
                            </label>
                            
                            {reviewImages.length > 0 && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '8px',
                                    margin: '12px 0',
                                }}>
                                    {reviewImages.map((img) => (
                                        <div key={img.id} style={{
                                            position: 'relative',
                                            paddingBottom: '100%',
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                            border: '1px solid #D1D5DB',
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
                                                    background: 'rgba(0,0,0,0.6)',
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
                                                }}>
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div
                                style={{
                                    border: '2px dashed #D1D5DB',
                                    borderRadius: 8,
                                    padding: '20px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'border-color 0.2s',
                                    marginTop: 12,
                                }}
                                onClick={() => document.getElementById('review-image-input').click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = T.gold;
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                    const files = Array.from(e.dataTransfer.files);
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
                                }}>
                                <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
                                    📤 Drag & drop photos here, or click to browse
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 11, color: T.muted2 }}>
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
                        
                        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                            <button
                                onClick={() => setReviewDialog(null)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: 8,
                                    border: '1px solid #D1D5DB',
                                    background: 'transparent',
                                    color: T.muted,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                }}>
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmitReview(reviewDialog.id)}
                                disabled={submittingReview || rating === 0 || !reviewText.trim()}
                                style={{
                                    flex: 2,
                                    padding: '10px',
                                    borderRadius: 8,
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
                                }}>
                                {submittingReview ? 'Submitting...' : '✅ Submit Review & Share'}
                            </button>
                        </div>
                        
                        <p style={{ 
                            fontSize: 11, 
                            color: T.muted2, 
                            textAlign: 'center', 
                            marginTop: 12,
                            padding: '8px',
                            background: '#F8FAFC',
                            borderRadius: 6,
                        }}>
                            📤 Your review will be shared with the guide and will appear in their dashboard for approval.
                        </p>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: T.deepTeal,
                    color: T.goldLight,
                    padding: '12px 20px',
                    borderRadius: 8,
                    fontSize: 13,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    zIndex: 60,
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
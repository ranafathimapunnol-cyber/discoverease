// pages/GuideDashboard.jsx - COMPLETE FIXED VERSION with Delete for Rejected & Cancellation Notes

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
    CalendarDays,
    Clock,
    Trash2,
    RefreshCw,
    Loader2,
    Star,
    MessageSquare,
    UserCheck,
    PlusCircle,
    X,
    Anchor,
    MapPin,
    User,
    DollarSign,
    Edit2,
    Save,
    Eye,
    Check,
    AlertCircle,
    Camera,
    Pencil,
    LogOut,
    Compass,
    Sparkles,
    Lightbulb,
    TrendingUp,
    TrendingDown,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Calendar,
    CheckCircle,
    XCircle,
    Plus,
    Minus,
    Send,
    FileText,
    Trophy,
} from 'lucide-react';

// ============================================
// DESIGN TOKENS
// ============================================
const C = {
    ink: '#072E2A',
    inkSoft: '#0B2422',
    paper: '#FFFFFF',
    cream: '#FBF6EA',
    cream2: '#F5EDD6',
    gold: '#C79A3E',
    goldLight: '#E4C77B',
    goldSoft: 'rgba(199,154,62,0.14)',
    sage: '#7A7568',
    sageLight: '#9C8A5C',
    line: '#EFE6CF',
    success: '#3F7A5E',
    successBg: '#EAF3EE',
    warn: '#B4791F',
    warnBg: '#FBF1DC',
    danger: '#B4472A',
    dangerBg: '#FDF1EC',
    info: '#2A6F8A',
    infoBg: '#E6F0F5',
};

const FONT = {
    display: "'Fraunces', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
};

const RADIUS = { sm: 8, md: 14, lg: 20 };
const SIDEBAR_W = 264;
const ITEMS_PER_PAGE = 6;

// ============================================
// COMPONENTS
// ============================================

const Card = ({ children, style, ...props }) => (
    <div
        style={{
            background: C.paper,
            border: `1px solid ${C.line}`,
            borderRadius: RADIUS.md,
            boxShadow: '0 1px 2px rgba(7,46,42,0.04), 0 10px 26px -14px rgba(7,46,42,0.14)',
            ...style,
        }}
        {...props}
    >
        {children}
    </div>
);

const Btn = ({ children, variant = 'primary', icon: Icon, size = 'md', style, ...props }) => {
    const variants = {
        primary: { background: C.ink, color: C.goldLight, border: 'none' },
        gold: { background: C.gold, color: C.ink, border: 'none' },
        success: { background: C.success, color: '#fff', border: 'none' },
        danger: { background: 'transparent', color: C.danger, border: `1px solid #EFCBB5` },
        ghost: { background: 'transparent', border: `1px solid ${C.line}`, color: C.sage },
        info: { background: C.info, color: '#fff', border: 'none' },
    };
    const v = variants[variant] || variants.primary;
    const sizes = { sm: { padding: '5px 12px', fontSize: 11 }, md: { padding: '9px 18px', fontSize: 13 }, lg: { padding: '12px 24px', fontSize: 14 } };
    const s = sizes[size] || sizes.md;
    return (
        <button
            style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                borderRadius: RADIUS.sm, fontFamily: FONT.body, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.2s ease', ...v, ...s, ...style,
            }}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
            {children}
        </button>
    );
};

const StatusPill = ({ status }) => {
    const map = {
        pending: { fg: C.warn, bg: C.warnBg, label: 'Pending' },
        pending_guide: { fg: C.warn, bg: C.warnBg, label: 'Pending Guide' },
        pending_admin: { fg: C.warn, bg: C.warnBg, label: 'Pending Admin' },
        confirmed: { fg: C.success, bg: C.successBg, label: 'Confirmed' },
        completed: { fg: C.inkSoft, bg: '#EDECE4', label: 'Completed' },
        cancelled: { fg: C.danger, bg: C.dangerBg, label: 'Cancelled' },
        cancelled_requested: { fg: C.warn, bg: C.warnBg, label: 'Cancellation Requested' },
        rejected: { fg: C.danger, bg: C.dangerBg, label: 'Rejected' },
        rejected_by_guide: { fg: C.danger, bg: C.dangerBg, label: 'Rejected by Guide' },
        rejected_by_admin: { fg: C.danger, bg: C.dangerBg, label: 'Rejected' },
        available: { fg: C.success, bg: C.successBg, label: 'Available' },
        full: { fg: C.danger, bg: C.dangerBg, label: 'Full' },
        approved: { fg: C.success, bg: C.successBg, label: 'Approved' },
        approved_by_guide: { fg: C.success, bg: C.successBg, label: 'Approved by Guide' },
        approved_by_admin: { fg: C.success, bg: C.successBg, label: 'Approved' },
        implemented: { fg: C.gold, bg: C.warnBg, label: '✅ Implemented' },
        staff_approved: { fg: C.success, bg: C.successBg, label: 'Staff Approved' },
        staff_rejected: { fg: C.danger, bg: C.dangerBg, label: 'Staff Rejected' },
        booked: { fg: C.warn, bg: C.warnBg, label: 'Booked' },
        review: { fg: C.gold, bg: C.goldSoft, label: '⭐ Review' },
        hidden_gem: { fg: C.gold, bg: C.goldSoft, label: '💎 Hidden Gem' },
        local_insight: { fg: C.info, bg: C.infoBg, label: '💡 Insight' },
    };
    const s = map[status] || { fg: C.sage, bg: '#EEEEEE', label: status };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 999,
            fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
            color: s.fg, background: s.bg, border: `1px solid ${s.fg}22`, whiteSpace: 'nowrap', flexShrink: 0,
        }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.fg, flexShrink: 0 }} />
            {s.label}
        </span>
    );
};

const StatChip = ({ label, value, icon: Icon, tone = 'ink' }) => (
    <Card style={{ padding: '14px 16px', flex: '1 1 150px', minWidth: 150 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.sageLight, margin: 0 }}>{label}</p>
                <p style={{ fontFamily: FONT.display, fontSize: 24, fontWeight: 600, color: C.inkSoft, margin: '3px 0 0' }}>{value}</p>
            </div>
            <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: tone === 'gold' ? C.goldSoft : 'rgba(7,46,42,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={17} color={tone === 'gold' ? C.gold : C.ink} />
            </div>
        </div>
    </Card>
);

const SectionHead = ({ icon: Icon, title, count, right }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10, paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
        <h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {Icon && <Icon size={17} color={C.gold} />}
            {title}
            {count !== undefined && <span style={{ fontSize: 12, color: C.sage, fontStyle: 'normal', fontFamily: FONT.mono }}>({count})</span>}
        </h3>
        {right}
    </div>
);

// ============================================
// PAGINATION COMPONENT
// ============================================
const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    totalItems, 
    itemsPerPage,
    variant = 'default'
}) => {
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
            borderTop: `1px solid ${C.line}`,
        }}>
            <div style={{ fontSize: 12, color: C.sage }}>
                Showing {startItem}-{endItem} of {totalItems}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: '6px 10px',
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${C.line}`,
                        background: currentPage === 1 ? '#f5f5f5' : C.paper,
                        color: currentPage === 1 ? C.sageLight : C.inkSoft,
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
                    <span style={{ display: variant === 'compact' ? 'none' : 'inline' }}>Previous</span>
                </button>

                {getPageNumbers().map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: RADIUS.sm,
                            border: currentPage === page ? `1px solid ${C.gold}` : `1px solid ${C.line}`,
                            background: currentPage === page ? C.gold : C.paper,
                            color: currentPage === page ? C.ink : C.sage,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontFamily: FONT.mono,
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
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${C.line}`,
                        background: currentPage === totalPages ? '#f5f5f5' : C.paper,
                        color: currentPage === totalPages ? C.sageLight : C.inkSoft,
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                        opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                >
                    <span style={{ display: variant === 'compact' ? 'none' : 'inline' }}>Next</span>
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '10px 13px',
    background: C.cream,
    border: `1.5px solid ${C.line}`,
    borderRadius: RADIUS.sm,
    color: C.inkSoft,
    fontSize: 13,
    fontFamily: FONT.body,
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
};

const selectStyle = {
    padding: '7px 12px',
    borderRadius: RADIUS.sm,
    background: C.paper,
    border: `1px solid ${C.line}`,
    color: C.inkSoft,
    fontSize: 12,
    fontFamily: FONT.body,
    cursor: 'pointer',
    outline: 'none',
};

const KasavuStrip = () => (
    <svg width="10" viewBox="0 0 10 900" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, height: '100%', width: 10 }} aria-hidden="true">
        {Array.from({ length: 45 }).map((_, i) => (
            <g key={i} transform={`translate(0, ${i * 20})`}>
                <path d="M5 3 L8.5 10 L5 17 L1.5 10 Z" fill="none" stroke={C.gold} strokeWidth="1" opacity="0.8" />
                <circle cx="5" cy="10" r="0.8" fill={C.gold} />
            </g>
        ))}
    </svg>
);

const ModalShell = ({ onClose, title, subtitle, icon: HeadIcon, maxWidth = 560, children, footer }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,36,34,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }} onClick={onClose}>
        <div style={{ background: C.paper, borderRadius: RADIUS.lg, maxWidth, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(7,46,42,0.32)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 24px', borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {HeadIcon && (
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.cream, color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <HeadIcon size={16} />
                        </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h3>
                        {subtitle && <p style={{ fontSize: 12, color: C.sage, margin: '2px 0 0' }}>{subtitle}</p>}
                    </div>
                </div>
                <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', color: C.sage, cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>×</button>
            </div>
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
                {children}
            </div>
            {footer && (
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.line}`, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                    {footer}
                </div>
            )}
        </div>
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

const GuideDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // ============================================
    // STATE
    // ============================================
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [toast, setToast] = useState(null);

    // Profile
    const [profile, setProfile] = useState(null);
    const [profileForm, setProfileForm] = useState({
        full_name: '', phone: '', bio: '', experience_years: '',
        languages: '', specialties: '', price_per_day: '', price_per_hour: '',
        facebook: '', instagram: '', website: '',
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Bookings
    const [bookings, setBookings] = useState([]);
    const [bookingFilter, setBookingFilter] = useState('all');
    const [bookingStats, setBookingStats] = useState({
        total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, rejected: 0
    });
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);
    const [bookingsPage, setBookingsPage] = useState(1);

    // Reviews
    const [reviews, setReviews] = useState([]);
    const [reviewsFilter, setReviewsFilter] = useState('pending');
    const [reviewStats, setReviewStats] = useState({
        total: 0, pending: 0, approved: 0, rejected: 0, implemented: 0
    });
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [reviewsPage, setReviewsPage] = useState(1);

    // Suggestions
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionStatusFilter, setSuggestionStatusFilter] = useState('all');
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [hiddenGemsPage, setHiddenGemsPage] = useState(1);
    const [localInsightsPage, setLocalInsightsPage] = useState(1);

    // Add Suggestion Modal
    const [showAddSuggestion, setShowAddSuggestion] = useState(false);
    const [addSuggestionType, setAddSuggestionType] = useState('hidden_gem');
    const [newSuggestion, setNewSuggestion] = useState({
        name: '',
        description: '',
        district: '',
        category: '',
        location_info: '',
        image_url: '',
    });
    const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
    const [suggestionImageFile, setSuggestionImageFile] = useState(null);
    const suggestionFileInputRef = useRef(null);

    // Availability
    const [availability, setAvailability] = useState([]);
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    const [showAddAvailability, setShowAddAvailability] = useState(false);
    const [newAvailability, setNewAvailability] = useState({
        date: '',
        start_time: '',
        end_time: '',
        max_bookings: 1,
    });
    const [availabilityStats, setAvailabilityStats] = useState({
        total: 0,
        available: 0,
        booked: 0,
        full: 0,
    });
    const [addingSlot, setAddingSlot] = useState(false);
    const [availabilityPage, setAvailabilityPage] = useState(1);

    // Stats
    const [stats, setStats] = useState({
        totalBookings: 0,
        pendingBookings: 0,
        totalSuggestions: 0,
        pendingSuggestions: 0,
        rating: 0,
        totalRevenue: 0,
    });

    const [processingId, setProcessingId] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const dataFetchedRef = useRef(false);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ============================================
    // HELPER: Get image URL
    // ============================================
    const getImageUrl = (item) => {
        if (!item) return null;
        
        const imageField = item.image || item.image_url || item.profile_image || item.photo || item.avatar;
        
        if (!imageField || typeof imageField !== 'string') return null;
        
        const cleanedUrl = imageField.trim();
        
        if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
            return cleanedUrl;
        }
        
        if (cleanedUrl.startsWith('/media/') || cleanedUrl.startsWith('/uploads/')) {
            const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
            const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            const mediaBase = cleanBase.replace('/api', '');
            return `${mediaBase}${cleanedUrl}`;
        }
        
        return null;
    };

    // ============================================
    // FETCH BOOKINGS with cancellation reason
    // ============================================
    const fetchBookings = useCallback(async () => {
        try {
            let response;
            try {
                response = await api.get('/guides/guides/bookings/');
            } catch (e) {
                response = await api.get('/guides/bookings/');
            }
            
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
            
            const formatted = bookingsData.map(b => {
                let place = b.destination || b.place || b.destination_name || b.location || 'N/A';
                if ((place === 'N/A' || !place) && b.special_requests) {
                    const destMatch = b.special_requests.match(/Destination:\s*([^\n]+)/);
                    if (destMatch && destMatch[1]) {
                        place = destMatch[1].trim();
                    }
                }
                
                return {
                    id: b.id || b.booking_id,
                    booking_id: b.booking_id || b.id,
                    user: b.user || { username: b.traveler_email || 'Anonymous', email: b.traveler_email || '' },
                    traveler_email: b.traveler_email || b.user?.email || '',
                    guide_name: b.guide_name || b.guide?.full_name || 'Unknown',
                    place: place,
                    district: b.district?.name || b.district || 'N/A',
                    date: b.date || 'N/A',
                    time: b.time || 'N/A',
                    status: b.status || 'pending',
                    number_of_people: b.number_of_people || 1,
                    total_price: b.total_price || b.price || 0,
                    special_requests: b.special_requests || '',
                    duration_hours: b.duration_hours || 4,
                    created_at: b.created_at || new Date().toISOString(),
                    has_review: b.has_review || false,
                    // ✅ CANCELLATION REASON - Get from booking data
                    cancellation_reason: b.cancellation_reason || b.reason || b.cancel_reason || '',
                    cancelled_by: b.cancelled_by || b.canceled_by || '',
                    cancellation_requested_at: b.cancellation_requested_at || b.cancelled_at || null,
                };
            });
            
            setBookings(formatted);
            
            const stats = {
                total: statsData.total || formatted.length,
                pending: statsData.pending || formatted.filter(b => b.status === 'pending').length,
                confirmed: statsData.confirmed || formatted.filter(b => b.status === 'confirmed').length,
                completed: statsData.completed || formatted.filter(b => b.status === 'completed').length,
                cancelled: statsData.cancelled || formatted.filter(b => b.status === 'cancelled').length,
                rejected: statsData.rejected || formatted.filter(b => b.status === 'rejected').length,
            };
            setBookingStats(stats);
            
            const totalRevenue = formatted
                .filter(b => b.status === 'completed' || b.status === 'confirmed')
                .reduce((sum, b) => sum + (b.total_price || 0), 0);
            
            setStats(prev => ({
                ...prev,
                totalBookings: formatted.length,
                pendingBookings: formatted.filter(b => b.status === 'pending').length,
                totalRevenue: totalRevenue,
            }));
            
            return formatted;
        } catch (error) {
            console.error('❌ Error fetching bookings:', error);
            setBookings([]);
            setBookingStats({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, rejected: 0 });
            return [];
        }
    }, []);

    // ============================================
    // FETCH REVIEWS
    // ============================================
    const fetchReviews = useCallback(async () => {
        try {
            console.log('📊 Fetching reviews...');
            
            const response = await api.get('/suggestions/', {
                params: { 
                    suggestion_type: 'review',
                    page: 1, 
                    page_size: 100 
                }
            });
            
            console.log('📊 Reviews response:', response.data);
            
            let reviewsData = [];
            if (response.data) {
                if (response.data.results?.data) {
                    reviewsData = response.data.results.data;
                } else if (response.data.data) {
                    reviewsData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    reviewsData = response.data;
                }
            }
            
            const formatted = reviewsData.map(r => ({
                id: r.id,
                name: r.name || r.place || 'Review',
                title: r.title || r.name || 'Review',
                description: r.description || r.comment || '',
                review_text: r.comment || r.description || '',
                suggestion_type: 'review',
                status: r.status || 'pending',
                district: r.district || 'N/A',
                rating: r.rating || 0,
                user_email: r.user_email || r.username || 'Anonymous',
                image: r.image || r.image_url || null,
                created_at: r.created_at || new Date().toISOString(),
                booking_id: r.booking_id || null,
                implemented_at: r.implemented_at || null,
                implemented_by: r.implemented_by || null,
                admin_notes: r.admin_notes || '',
                guide_notes: r.guide_notes || '',
                is_guide_submitted: r.is_guide_submitted || false,
            }));
            
            setReviews(formatted);
            
            const stats = {
                total: formatted.length,
                pending: formatted.filter(r => r.status === 'pending' || r.status === 'pending_guide' || r.status === 'pending_admin').length,
                approved: formatted.filter(r => r.status === 'approved' || r.status === 'approved_by_guide' || r.status === 'approved_by_admin' || r.status === 'staff_approved').length,
                rejected: formatted.filter(r => r.status === 'rejected' || r.status === 'rejected_by_guide' || r.status === 'rejected_by_admin' || r.status === 'staff_rejected').length,
                implemented: formatted.filter(r => r.status === 'implemented').length,
            };
            setReviewStats(stats);
            
            return formatted;
        } catch (error) {
            console.error('❌ Error fetching reviews:', error);
            setReviews([]);
            setReviewStats({ total: 0, pending: 0, approved: 0, rejected: 0, implemented: 0 });
            return [];
        }
    }, []);

    // ============================================
    // PROCESS REVIEW
    // ============================================
    const processReview = async (reviewId, action) => {
        setProcessingId(reviewId);
        setActionLoading(true);
        
        try {
            let endpoint = '';
            if (action === 'approve') {
                endpoint = `/suggestions/${reviewId}/guide-approve/`;
            } else if (action === 'reject') {
                endpoint = `/suggestions/${reviewId}/guide-reject/`;
            } else {
                showToast('Invalid action');
                setActionLoading(false);
                setProcessingId(null);
                return;
            }
            
            const payload = action === 'approve' 
                ? { notes: 'Approved by guide' }
                : { notes: 'Rejected by guide', reason: 'Not suitable' };
            
            const response = await api.post(endpoint, payload);
            
            if (response?.data?.success) {
                const newStatus = action === 'approve' ? 'approved_by_guide' : 'rejected_by_guide';
                showToast(`✅ Review ${action}ed successfully!`);
                
                setReviews(prev => prev.map(r => 
                    r.id === reviewId ? { ...r, status: newStatus } : r
                ));
                
                setReviewStats(prev => {
                    const newStats = { ...prev };
                    newStats.pending = Math.max(0, prev.pending - 1);
                    if (action === 'approve') newStats.approved = (prev.approved || 0) + 1;
                    else newStats.rejected = (prev.rejected || 0) + 1;
                    return newStats;
                });
                
                if (showReviewModal) {
                    setShowReviewModal(false);
                    setSelectedReview(null);
                }
            } else {
                showToast(response?.data?.error || 'Error processing review');
            }
        } catch (error) {
            console.error('Error processing review:', error);
            showToast(error.response?.data?.error || 'Error processing review');
        } finally {
            setActionLoading(false);
            setProcessingId(null);
        }
    };

    // ============================================
    // FETCH PROFILE
    // ============================================
    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get('/guides/guides/profile/');
            
            if (response.data?.success) {
                const p = response.data.profile || response.data;
                setProfile(p);
                setProfileForm({
                    full_name: p.full_name || '',
                    phone: p.phone || '',
                    bio: p.bio || '',
                    experience_years: p.experience_years || '',
                    languages: p.languages || '',
                    specialties: p.specialties?.join(', ') || '',
                    price_per_day: p.price_per_day || '',
                    price_per_hour: p.price_per_hour || '',
                    facebook: p.facebook || '',
                    instagram: p.instagram || '',
                    website: p.website || '',
                });
                
                const imageUrl = p.profile_image || p.image || p.avatar || p.photo;
                if (imageUrl) {
                    let fullImageUrl = imageUrl;
                    if (imageUrl.startsWith('/media/') || imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/')) {
                        const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
                        const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
                        fullImageUrl = `${cleanBaseURL}${imageUrl}`;
                    }
                    setProfilePicture(fullImageUrl);
                } else {
                    setProfilePicture(null);
                }
                return p;
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching profile:', error);
            return null;
        }
    }, []);

    // ============================================
    // FETCH SUGGESTIONS
    // ============================================
    const fetchSuggestions = useCallback(async () => {
        try {
            const response = await api.get('/suggestions/', {
                params: { page: 1, page_size: 100 }
            });
            
            let suggestionsData = [];
            if (response.data) {
                if (response.data.results?.data) {
                    suggestionsData = response.data.results.data;
                } else if (response.data.data) {
                    suggestionsData = response.data.data;
                } else if (Array.isArray(response.data)) {
                    suggestionsData = response.data;
                }
            }
            
            const formatted = suggestionsData.map(s => ({
                id: s.id,
                name: s.name || s.title || 'Untitled',
                title: s.title || s.name || 'Untitled',
                description: s.description || '',
                suggestion_type: s.suggestion_type || 'local_insight',
                status: s.status || 'pending',
                district: s.district || 'Unknown',
                category: s.category || 'general',
                location_info: s.location_info || '',
                user_email: s.user_email || s.username || 'Anonymous',
                rating: s.rating || null,
                image: s.image || s.image_url || null,
                created_at: s.created_at || new Date().toISOString(),
                implemented_at: s.implemented_at || null,
                implemented_by: s.implemented_by || null,
                admin_notes: s.admin_notes || '',
                guide_notes: s.guide_notes || '',
                is_guide_submitted: s.is_guide_submitted || false,
            }));
            
            setSuggestions(formatted);
            
            const total = formatted.length;
            const pending = formatted.filter(s => s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin').length;
            setStats(prev => ({ 
                ...prev, 
                totalSuggestions: total, 
                pendingSuggestions: pending 
            }));
            
            return formatted;
        } catch (error) {
            console.error('❌ Error fetching suggestions:', error);
            setSuggestions([]);
            return [];
        }
    }, []);

    // ============================================
    // FETCH AVAILABILITY
    // ============================================
    const fetchAvailability = useCallback(async () => {
        try {
            const response = await api.get('/guides/availability/');
            if (response.data) {
                let data = [];
                if (response.data.results) {
                    data = response.data.results;
                } else if (Array.isArray(response.data)) {
                    data = response.data;
                } else if (response.data.data) {
                    data = response.data.data;
                }
                
                const availabilityArray = Array.isArray(data) ? data : [];
                setAvailability(availabilityArray);
                
                const stats = {
                    total: availabilityArray.length,
                    available: availabilityArray.filter(a => a.status === 'available' || a.status === 'pending').length,
                    booked: availabilityArray.filter(a => a.status === 'booked' || a.status === 'confirmed').length,
                    full: availabilityArray.filter(a => a.status === 'full' || a.is_booked === true).length,
                };
                setAvailabilityStats(stats);
                
                return availabilityArray;
            }
            return [];
        } catch (error) {
            console.error('Error fetching availability:', error);
            setAvailability([]);
            setAvailabilityStats({ total: 0, available: 0, booked: 0, full: 0 });
            return [];
        }
    }, []);

    // ============================================
    // FETCH ALL DATA
    // ============================================
    const fetchAllData = useCallback(async () => {
        if (!user) return;
        if (dataFetchedRef.current) return;
        dataFetchedRef.current = true;
        setLoading(true);
        setRefreshing(true);

        try {
            await Promise.all([
                fetchProfile(),
                fetchBookings(),
                fetchSuggestions(),
                fetchReviews(),
                fetchAvailability(),
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Error loading dashboard');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setTimeout(() => { dataFetchedRef.current = false; }, 1000);
        }
    }, [user, fetchProfile, fetchBookings, fetchSuggestions, fetchReviews, fetchAvailability]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'guide') {
            navigate('/');
            return;
        }
        if (!dataFetchedRef.current) {
            fetchAllData();
        }
    }, [user, navigate, fetchAllData]);

    // Reset pages when filters change
    useEffect(() => {
        setBookingsPage(1);
    }, [bookingFilter]);

    useEffect(() => {
        setReviewsPage(1);
    }, [reviewsFilter]);

    useEffect(() => {
        setHiddenGemsPage(1);
    }, [suggestionStatusFilter]);

    useEffect(() => {
        setLocalInsightsPage(1);
    }, [suggestionStatusFilter]);

    useEffect(() => {
        setAvailabilityPage(1);
    }, [availabilityFilter]);

    // ============================================
    // BOOKING ACTIONS
    // ============================================
    const processBooking = async (bookingId, action) => {
        setProcessingId(bookingId);
        
        try {
            const response = await api.post(`/guides/bookings/${bookingId}/process/`, { action });
            
            if (response.data?.success) {
                showToast(`✅ Booking ${action}ed successfully!`);
                
                const statusMap = {
                    confirm: 'confirmed',
                    complete: 'completed',
                    reject: 'rejected'
                };
                const newStatus = statusMap[action] || action;
                
                setBookings(prevBookings => 
                    prevBookings.map(b => 
                        (b.id === bookingId || b.booking_id === bookingId) 
                            ? { ...b, status: newStatus }
                            : b
                    )
                );
                
                setBookingStats(prev => {
                    const newStats = { ...prev };
                    const oldStatus = bookings.find(b => b.id === bookingId || b.booking_id === bookingId)?.status;
                    
                    if (oldStatus && oldStatus !== newStatus) {
                        newStats[oldStatus] = Math.max(0, (newStats[oldStatus] || 0) - 1);
                        newStats[newStatus] = (newStats[newStatus] || 0) + 1;
                    }
                    return newStats;
                });
                
                if (action === 'complete') {
                    const completedBooking = bookings.find(b => b.id === bookingId || b.booking_id === bookingId);
                    if (completedBooking) {
                        setStats(prev => ({
                            ...prev,
                            totalRevenue: (prev.totalRevenue || 0) + (completedBooking.total_price || 0)
                        }));
                    }
                }
            } else {
                showToast(response.data?.message || response.data?.error || `Failed to ${action} booking`);
            }
        } catch (error) {
            console.error('❌ Error processing booking:', error);
            showToast(error.response?.data?.error || error.response?.data?.message || `Failed to ${action} booking`);
        } finally {
            setProcessingId(null);
        }
    };

    // ✅ Cancel booking (guide initiated)
    const cancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        
        setProcessingId(bookingId);
        try {
            const response = await api.post(`/guides/bookings/${bookingId}/cancel/`);
            
            if (response.data?.success) {
                showToast('✅ Booking cancelled successfully!');
                
                setBookings(prevBookings => 
                    prevBookings.map(b => 
                        (b.id === bookingId || b.booking_id === bookingId) 
                            ? { ...b, status: 'cancelled' }
                            : b
                    )
                );
                
                setBookingStats(prev => {
                    const newStats = { ...prev };
                    const oldStatus = bookings.find(b => b.id === bookingId || b.booking_id === bookingId)?.status;
                    if (oldStatus && oldStatus !== 'cancelled') {
                        newStats[oldStatus] = Math.max(0, (newStats[oldStatus] || 0) - 1);
                        newStats.cancelled = (newStats.cancelled || 0) + 1;
                    }
                    return newStats;
                });
            } else {
                showToast(response.data?.error || 'Failed to cancel booking');
            }
        } catch (error) {
            console.error('❌ Error cancelling booking:', error);
            showToast(error.response?.data?.error || 'Failed to cancel booking');
        } finally {
            setProcessingId(null);
        }
    };

    // ✅ DELETE BOOKING - For rejected/cancelled bookings
    const deleteBooking = async (bookingId) => {
        if (!window.confirm('Delete this booking permanently?')) return;
        
        setProcessingId(bookingId);
        try {
            const response = await api.delete(`/guides/bookings/${bookingId}/`);
            
            if (response?.data?.success || response?.status === 204) {
                showToast('🗑️ Booking deleted successfully!');
                
                // Remove from UI
                setBookings(prev => prev.filter(b => b.id !== bookingId && b.booking_id !== bookingId));
                
                setBookingStats(prev => {
                    const newStats = { ...prev };
                    const status = bookings.find(b => b.id === bookingId || b.booking_id === bookingId)?.status;
                    if (status && newStats[status] > 0) {
                        newStats[status] = Math.max(0, newStats[status] - 1);
                        newStats.total = Math.max(0, newStats.total - 1);
                    }
                    return newStats;
                });
                
                if (showBookingDetailModal) {
                    setShowBookingDetailModal(false);
                    setSelectedBooking(null);
                }
            } else {
                showToast(response?.data?.error || 'Failed to delete booking');
            }
        } catch (error) {
            console.error('❌ Error deleting booking:', error);
            
            // Try fallback endpoints
            try {
                await api.delete(`/guides/guides/bookings/${bookingId}/`);
                showToast('🗑️ Booking deleted successfully!');
                setBookings(prev => prev.filter(b => b.id !== bookingId && b.booking_id !== bookingId));
                if (showBookingDetailModal) {
                    setShowBookingDetailModal(false);
                    setSelectedBooking(null);
                }
            } catch (e) {
                showToast('Failed to delete booking', 'error');
                await fetchBookings();
            }
        } finally {
            setProcessingId(null);
        }
    };

    // ============================================
    // AVAILABILITY ACTIONS
    // ============================================
    const handleAddAvailability = async (e) => {
        e.preventDefault();
        
        if (!newAvailability.date) {
            showToast('Please select a date');
            return;
        }
        if (!newAvailability.start_time) {
            showToast('Please select a start time');
            return;
        }
        if (!newAvailability.end_time) {
            showToast('Please select an end time');
            return;
        }
        if (newAvailability.start_time >= newAvailability.end_time) {
            showToast('End time must be after start time');
            return;
        }

        setAddingSlot(true);
        try {
            const payload = {
                date: newAvailability.date,
                start_time: newAvailability.start_time,
                end_time: newAvailability.end_time,
                max_bookings: parseInt(newAvailability.max_bookings) || 1,
            };

            const response = await api.post('/guides/availability/', payload);
            
            if (response.status === 201 || response.status === 200) {
                showToast('✅ Availability added successfully!');
                setShowAddAvailability(false);
                setNewAvailability({
                    date: '',
                    start_time: '',
                    end_time: '',
                    max_bookings: 1,
                });
                await fetchAvailability();
            } else {
                showToast(response.data?.error || 'Error adding availability');
            }
        } catch (error) {
            console.error('❌ Error adding availability:', error);
            showToast(error.response?.data?.error || 'Error adding availability');
        } finally {
            setAddingSlot(false);
        }
    };

    const deleteAvailability = async (id) => {
        if (!window.confirm('Delete this availability slot?')) return;
        try {
            const response = await api.delete(`/guides/availability/${id}/`);
            if (response.status === 204 || response.data?.success || response.status === 200) {
                showToast('✅ Availability deleted successfully!');
                setAvailability(prev => prev.filter(a => a.id !== id));
            } else {
                showToast('Error deleting availability');
            }
        } catch (error) {
            console.error('Error deleting availability:', error);
            showToast('Error deleting availability');
        }
    };

    // ============================================
    // SUGGESTION ACTIONS
    // ============================================
    const processSuggestion = async (suggestionId, action) => {
        setActionLoading(true);
        setProcessingId(suggestionId);
        
        try {
            let endpoint = '';
            if (action === 'approve') {
                endpoint = `/suggestions/${suggestionId}/guide-approve/`;
            } else if (action === 'reject') {
                endpoint = `/suggestions/${suggestionId}/guide-reject/`;
            } else {
                showToast('Invalid action');
                setActionLoading(false);
                setProcessingId(null);
                return;
            }
            
            const payload = action === 'approve' 
                ? { notes: 'Approved by guide' }
                : { notes: 'Rejected by guide', reason: 'Not suitable' };
            
            const response = await api.post(endpoint, payload);
            
            if (response?.data?.success) {
                const newStatus = action === 'approve' ? 'approved_by_guide' : 'rejected_by_guide';
                showToast(`✅ Suggestion ${action}ed successfully!`);
                
                setSuggestions(prev => prev.map(s => 
                    s.id === suggestionId ? { ...s, status: newStatus } : s
                ));
                
                if (showSuggestionModal) {
                    setShowSuggestionModal(false);
                    setSelectedSuggestion(null);
                }
            } else {
                showToast(response?.data?.error || 'Error processing suggestion');
            }
        } catch (error) {
            console.error('Error processing suggestion:', error);
            showToast(error.response?.data?.error || 'Error processing suggestion');
        } finally {
            setActionLoading(false);
            setProcessingId(null);
        }
    };

    const deleteSuggestion = async (suggestionId) => {
        if (!window.confirm('Are you sure you want to delete this suggestion?')) return;
        
        setActionLoading(true);
        setProcessingId(suggestionId);
        
        try {
            const response = await api.delete(`/suggestions/${suggestionId}/`);
            
            if (response?.data?.success || response.status === 204 || response.status === 200) {
                showToast('🗑️ Suggestion deleted successfully!');
                setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
                if (showSuggestionModal) {
                    setShowSuggestionModal(false);
                    setSelectedSuggestion(null);
                }
            } else {
                showToast(response?.data?.error || 'Failed to delete suggestion');
            }
        } catch (error) {
            console.error('❌ Error deleting suggestion:', error);
            showToast('Failed to delete suggestion. Please try again.');
        } finally {
            setActionLoading(false);
            setProcessingId(null);
        }
    };

    // ============================================
    // ADD SUGGESTION
    // ============================================
    const handleAddSuggestion = async (e) => {
        e.preventDefault();
        
        if (!newSuggestion.name) {
            showToast('Please enter a name/title');
            return;
        }
        if (!newSuggestion.description) {
            showToast('Please enter a description');
            return;
        }
        if (!newSuggestion.district) {
            showToast('Please enter a district');
            return;
        }

        setSubmittingSuggestion(true);
        
        try {
            const formData = new FormData();
            formData.append('name', newSuggestion.name);
            formData.append('title', newSuggestion.name);
            formData.append('description', newSuggestion.description);
            formData.append('suggestion_type', addSuggestionType);
            formData.append('district', newSuggestion.district);
            formData.append('category', newSuggestion.category || 'general');
            formData.append('location_info', newSuggestion.location_info || '');
            formData.append('is_guide_submitted', 'true');
            formData.append('status', 'pending_admin');
            
            if (suggestionImageFile) {
                formData.append('image', suggestionImageFile);
            }
            
            const response = await api.post('/suggestions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            if (response.data?.success || response.status === 201 || response.status === 200) {
                const typeLabel = addSuggestionType === 'hidden_gem' ? 'Hidden Gem' : 'Insight';
                showToast(`✅ ${typeLabel} submitted for admin review!`);
                
                setNewSuggestion({
                    name: '',
                    description: '',
                    district: '',
                    category: '',
                    location_info: '',
                    image_url: '',
                });
                setSuggestionImageFile(null);
                if (suggestionFileInputRef.current) {
                    suggestionFileInputRef.current.value = '';
                }
                setShowAddSuggestion(false);
                await fetchSuggestions();
            } else {
                showToast(response.data?.error || 'Error adding suggestion');
            }
        } catch (error) {
            console.error('❌ Error adding suggestion:', error);
            showToast(error.response?.data?.error || 'Error adding suggestion');
        } finally {
            setSubmittingSuggestion(false);
        }
    };

    // ============================================
    // PROFILE UPDATE
    // ============================================
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await api.post('/guides/guides/update-profile/', {
                full_name: profileForm.full_name,
                phone: profileForm.phone,
                bio: profileForm.bio,
                years_of_experience: parseInt(profileForm.experience_years) || 0,
                languages: profileForm.languages,
                specialties: profileForm.specialties?.split(',').map(s => s.trim()) || [],
                price_per_day: parseFloat(profileForm.price_per_day) || 0,
                price_per_hour: parseFloat(profileForm.price_per_hour) || 0,
                facebook: profileForm.facebook || '',
                instagram: profileForm.instagram || '',
                website: profileForm.website || '',
            });
            
            if (response.data?.success) {
                const updatedProfile = response.data.profile || response.data;
                setProfile(prev => ({ ...prev, ...updatedProfile }));
                setIsEditingProfile(false);
                showToast('Profile updated successfully! 🎉');
            } else {
                showToast(response.data?.error || 'Error updating profile');
            }
        } catch (error) {
            console.error('❌ Error updating profile:', error);
            showToast('Error updating profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploading(true);
        const formData = new FormData();
        formData.append('profile_image', file);
        
        try {
            const response = await api.post('/guides/guides/update-profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            if (response.data?.success) {
                const updatedProfile = response.data.profile || response.data;
                const newImageUrl = updatedProfile.profile_image || updatedProfile.image || updatedProfile.avatar;
                
                if (newImageUrl) {
                    let fullImageUrl = newImageUrl;
                    if (newImageUrl.startsWith('/media/') || newImageUrl.startsWith('/uploads/') || newImageUrl.startsWith('/')) {
                        const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
                        const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
                        fullImageUrl = `${cleanBaseURL}${newImageUrl}`;
                    }
                    setProfilePicture(fullImageUrl);
                }
                
                setProfile(prev => ({ ...prev, ...updatedProfile }));
                showToast('Profile picture updated! ✅');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                showToast(response.data?.error || 'Error uploading picture');
            }
        } catch (error) {
            console.error('❌ Error uploading profile picture:', error);
            showToast(error.response?.data?.error || 'Error uploading picture');
        } finally {
            setUploading(false);
        }
    };

    const handleRefresh = () => {
        dataFetchedRef.current = false;
        setRefreshing(true);
        fetchAllData().finally(() => setRefreshing(false));
    };

    const initials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getSuggestionTypeLabel = (type) => {
        const labels = {
            review: '⭐ Review',
            local_insight: '💡 Local Insight',
            hidden_gem: '💎 Hidden Gem',
            new: '📍 Suggestion',
        };
        return labels[type] || type || 'Suggestion';
    };

    const getSuggestionTypeIcon = (type) => {
        const icons = {
            review: Star,
            local_insight: Lightbulb,
            hidden_gem: Sparkles,
            new: MapPin,
        };
        return icons[type] || MapPin;
    };

    // ============================================
    // FILTERED DATA
    // ============================================
    const filteredBookings = useMemo(
        () => bookingFilter === 'all' ? bookings : bookings.filter(b => b.status === bookingFilter),
        [bookings, bookingFilter]
    );

    const filteredReviews = useMemo(() => {
        if (reviewsFilter === 'all') return reviews;
        if (reviewsFilter === 'pending') return reviews.filter(r => r.status === 'pending' || r.status === 'pending_guide' || r.status === 'pending_admin');
        return reviews.filter(r => r.status === reviewsFilter);
    }, [reviews, reviewsFilter]);

    const hiddenGems = useMemo(() => {
        return suggestions.filter(s => s.suggestion_type === 'hidden_gem' || s.suggestion_type === 'new');
    }, [suggestions]);

    const localInsights = useMemo(() => {
        return suggestions.filter(s => s.suggestion_type === 'local_insight');
    }, [suggestions]);

    const filteredHiddenGems = useMemo(() => {
        return suggestionStatusFilter === 'all' ? hiddenGems : hiddenGems.filter(s => s.status === suggestionStatusFilter);
    }, [hiddenGems, suggestionStatusFilter]);

    const filteredLocalInsights = useMemo(() => {
        return suggestionStatusFilter === 'all' ? localInsights : localInsights.filter(s => s.status === suggestionStatusFilter);
    }, [localInsights, suggestionStatusFilter]);

    const filteredAvailability = useMemo(() => {
        return availabilityFilter === 'all' ? availability : availability.filter(a => a.status === availabilityFilter);
    }, [availability, availabilityFilter]);

    // ============================================
    // PAGINATION HELPERS
    // ============================================
    const getPaginatedData = (data, page) => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return data.slice(startIndex, endIndex);
    };

    const getTotalPages = (data) => {
        return Math.ceil(data.length / ITEMS_PER_PAGE);
    };

    // ============================================
    // NAV ITEMS
    // ============================================
    const navItems = [
        { key: 'overview', label: 'Overview', icon: Compass },
        { key: 'availability', label: 'Availability', icon: Calendar },
        { key: 'bookings', label: 'Bookings', icon: CalendarDays },
        { key: 'reviews', label: 'Reviews', icon: Star, badge: reviewStats.pending },
        { key: 'hidden-gems', label: 'Hidden Gems', icon: Sparkles },
        { key: 'insights', label: 'Local Insights', icon: Lightbulb },
        { key: 'profile', label: 'Profile', icon: User },
    ];

    const activeNavItem = navItems.find(n => n.key === activeTab);

    // ============================================
    // RENDER SUGGESTION CARD
    // ============================================
    const renderSuggestionCard = (s, typeLabel) => {
        const imageUrl = getImageUrl(s);
        const hasImage = !!imageUrl;

        const getFallbackEmoji = () => {
            switch(s.suggestion_type) {
                case 'hidden_gem': return '💎';
                case 'local_insight': return '💡';
                case 'review': return '⭐';
                default: return '📍';
            }
        };

        const isImplemented = s.status === 'implemented';
        const isPending = s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin';
        const isGuideSubmitted = s.is_guide_submitted === true;
        const isUserSubmitted = !isGuideSubmitted && s.user_email && s.user_email !== user?.email;

        return (
            <div
                key={s.id}
                onClick={() => { setSelectedSuggestion(s); setShowSuggestionModal(true); }}
                style={{
                    display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md,
                    border: `1px solid ${isImplemented ? C.success : isPending ? C.warn : isGuideSubmitted ? C.info : C.line}`,
                    cursor: 'pointer', alignItems: 'flex-start', transition: 'all 0.2s ease',
                    opacity: isImplemented ? 0.85 : 1,
                }}
            >
                <div style={{ 
                    width: 80, height: 80, borderRadius: RADIUS.sm, 
                    background: C.paper, border: `1px solid ${C.line}`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden', position: 'relative',
                }}>
                    {isImplemented && (
                        <div style={{
                            position: 'absolute', top: 4, right: 4,
                            background: C.success, color: '#fff',
                            padding: '2px 6px', borderRadius: 999,
                            fontSize: 8, fontWeight: 600,
                        }}>✅</div>
                    )}
                    {hasImage && imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={s.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                if (parent) {
                                    parent.innerHTML = `<span style="font-size: 32px;">${getFallbackEmoji()}</span>`;
                                }
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: 32 }}>{getFallbackEmoji()}</span>
                    )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>
                                {s.name}
                                {isImplemented && <span style={{ fontSize: 11, color: C.success, marginLeft: 8 }}>✅ Implemented</span>}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                <span style={{ fontSize: 11, color: C.sage }}>{s.user_email} · {s.district}</span>
                                <span style={{ fontSize: 9, padding: '2px 9px', borderRadius: 999, background: C.goldSoft, color: C.gold }}>{typeLabel}</span>
                                {s.rating && <span style={{ fontSize: 11, color: C.gold }}>{'★'.repeat(Math.round(s.rating))}{'☆'.repeat(5 - Math.round(s.rating))}</span>}
                            </div>
                        </div>
                        <StatusPill status={s.status} />
                    </div>
                    <p style={{ fontSize: 12.5, color: C.sage, margin: '6px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {s.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {isPending && isUserSubmitted && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'approve'); }} 
                                    disabled={actionLoading}
                                    style={{ 
                                        padding: '4px 12px', borderRadius: 999, border: 'none', 
                                        background: C.success, color: '#fff', fontSize: 11, 
                                        cursor: actionLoading ? 'not-allowed' : 'pointer', 
                                        display: 'flex', alignItems: 'center', gap: 4, 
                                        opacity: actionLoading && processingId === s.id ? 0.5 : 1 
                                    }}
                                >
                                    <Check size={11} /> Approve
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'reject'); }} 
                                    disabled={actionLoading}
                                    style={{ 
                                        padding: '4px 12px', borderRadius: 999, 
                                        border: `1px solid #EFCBB5`, background: 'transparent', 
                                        color: C.danger, fontSize: 11, 
                                        cursor: actionLoading ? 'not-allowed' : 'pointer', 
                                        display: 'flex', alignItems: 'center', gap: 4, 
                                        opacity: actionLoading && processingId === s.id ? 0.5 : 1 
                                    }}
                                >
                                    <X size={11} /> Reject
                                </button>
                            </>
                        )}
                        
                        {isGuideSubmitted && !isImplemented && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteSuggestion(s.id); }} 
                                disabled={actionLoading}
                                style={{ 
                                    padding: '4px 12px', borderRadius: 999, 
                                    border: `1px solid #EFCBB5`, background: C.dangerBg, 
                                    color: C.danger, fontSize: 11, 
                                    cursor: actionLoading ? 'not-allowed' : 'pointer', 
                                    display: 'flex', alignItems: 'center', gap: 4, 
                                    opacity: actionLoading && processingId === s.id ? 0.5 : 1 
                                }}
                            >
                                <Trash2 size={11} /> Delete
                            </button>
                        )}
                        
                        {isPending && isGuideSubmitted && (
                            <span style={{ fontSize: 11, color: C.info, padding: '4px 12px', background: C.infoBg, borderRadius: 999 }}>
                                ⏳ Awaiting admin review
                            </span>
                        )}
                        {isImplemented && (
                            <span style={{ fontSize: 11, color: C.gold, padding: '4px 12px', background: C.warnBg, borderRadius: 999 }}>
                                🎉 Implemented!
                            </span>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedSuggestion(s); setShowSuggestionModal(true); }}
                            style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.line}`, background: 'transparent', color: C.sage, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            <Eye size={11} /> View
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER REVIEW CARD
    // ============================================
    const renderReviewCard = (review) => {
        const imageUrl = getImageUrl(review);
        const hasImage = !!imageUrl;
        const isPending = review.status === 'pending' || review.status === 'pending_guide' || review.status === 'pending_admin';
        const isImplemented = review.status === 'implemented';

        return (
            <div
                key={review.id}
                onClick={() => { setSelectedReview(review); setShowReviewModal(true); }}
                style={{
                    display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md,
                    border: `1px solid ${isImplemented ? C.success : isPending ? C.warn : C.line}`,
                    cursor: 'pointer', alignItems: 'flex-start', transition: 'all 0.2s ease',
                }}
            >
                <div style={{ 
                    width: 80, height: 80, borderRadius: RADIUS.sm, 
                    background: C.paper, border: `1px solid ${C.line}`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden', position: 'relative',
                }}>
                    {isImplemented && (
                        <div style={{
                            position: 'absolute', top: 4, right: 4,
                            background: C.success, color: '#fff',
                            padding: '2px 6px', borderRadius: 999,
                            fontSize: 8, fontWeight: 600,
                        }}>✅</div>
                    )}
                    {hasImage && imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={review.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                const parent = e.target.parentElement;
                                if (parent) {
                                    parent.innerHTML = `<span style="font-size: 32px;">⭐</span>`;
                                }
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: 32 }}>⭐</span>
                    )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>
                                {review.name || 'Review'}
                                {isImplemented && <span style={{ fontSize: 11, color: C.success, marginLeft: 8 }}>✅ Implemented</span>}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                <span style={{ fontSize: 11, color: C.sage }}>{review.user_email} · {review.district}</span>
                                {review.rating > 0 && (
                                    <span style={{ fontSize: 11, color: C.gold }}>{'★'.repeat(Math.round(review.rating))} {review.rating}/5</span>
                                )}
                            </div>
                        </div>
                        <StatusPill status={review.status} />
                    </div>
                    <p style={{ fontSize: 12.5, color: C.sage, margin: '6px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {review.review_text || review.description || 'No review content'}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {isPending && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); processReview(review.id, 'approve'); }} 
                                    disabled={actionLoading}
                                    style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: C.success, color: '#fff', fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === review.id ? 0.5 : 1 }}
                                >
                                    <Check size={11} /> Approve
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); processReview(review.id, 'reject'); }} 
                                    disabled={actionLoading}
                                    style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: 'transparent', color: C.danger, fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === review.id ? 0.5 : 1 }}
                                >
                                    <X size={11} /> Reject
                                </button>
                            </>
                        )}
                        {isImplemented && (
                            <span style={{ fontSize: 11, color: C.gold, padding: '4px 12px', background: C.warnBg, borderRadius: 999 }}>🎉 Implemented!</span>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedReview(review); setShowReviewModal(true); }}
                            style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.line}`, background: 'transparent', color: C.sage, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            <Eye size={11} /> View
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER BOOKING CARD with Cancellation Reason & Delete for Rejected
    // ============================================
    const renderBookingCard = (booking) => {
        const isCancelled = booking.status === 'cancelled' || booking.status === 'rejected';
        const hasCancellationReason = booking.cancellation_reason && booking.cancellation_reason.length > 0;
        const isRejected = booking.status === 'rejected';

        return (
            <div
                key={booking.id}
                style={{
                    display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md,
                    border: `1px solid ${isCancelled ? C.danger : booking.status === 'pending' ? C.warn : booking.status === 'completed' ? C.success : C.line}`,
                    cursor: 'pointer', alignItems: 'flex-start', transition: 'all 0.2s ease',
                }}
            >
                <div 
                    onClick={() => { setSelectedBooking(booking); setShowBookingDetailModal(true); }}
                    style={{ display: 'flex', gap: 14, flex: 1, cursor: 'pointer', alignItems: 'flex-start' }}
                >
                    <div style={{ 
                        width: 60, height: 60, borderRadius: RADIUS.sm, 
                        background: C.paper, border: `1px solid ${C.line}`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, overflow: 'hidden',
                    }}>
                        <span style={{ fontSize: 28 }}>📅</span>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                                <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>
                                    {booking.place || booking.district || 'Booking'}
                                    {isCancelled && <span style={{ fontSize: 11, color: C.danger, marginLeft: 8 }}>❌ {booking.status === 'rejected' ? 'Rejected' : 'Cancelled'}</span>}
                                    {booking.status === 'pending' && <span style={{ fontSize: 11, color: C.warn, marginLeft: 8 }}>⏳ Pending</span>}
                                    {booking.status === 'confirmed' && <span style={{ fontSize: 11, color: C.success, marginLeft: 8 }}>✅ Confirmed</span>}
                                    {booking.status === 'completed' && <span style={{ fontSize: 11, color: C.inkSoft, marginLeft: 8 }}>🎯 Completed</span>}
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                    <span style={{ fontSize: 11, color: C.sage }}>{booking.user?.username || booking.traveler_email || 'Anonymous'}</span>
                                    <span style={{ fontSize: 11, color: C.sage }}>· {booking.district}</span>
                                    <span style={{ fontSize: 11, color: C.sage }}>· {booking.date ? new Date(booking.date).toLocaleDateString() : '—'}</span>
                                    {booking.people > 1 && <span style={{ fontSize: 11, color: C.sage }}>· 👥 {booking.people}</span>}
                                </div>
                                {/* ✅ Show cancellation reason if booking is cancelled/rejected */}
                                {isCancelled && hasCancellationReason && (
                                    <div style={{
                                        marginTop: 6,
                                        padding: '6px 12px',
                                        background: C.dangerBg,
                                        borderRadius: RADIUS.sm,
                                        border: `1px solid ${C.danger}44`,
                                    }}>
                                        <p style={{ fontSize: 11, color: C.danger, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <AlertCircle size={14} />
                                            <strong>Cancellation Reason:</strong> {booking.cancellation_reason}
                                        </p>
                                        {booking.cancelled_by && (
                                            <p style={{ fontSize: 10, color: C.sage, margin: '4px 0 0' }}>
                                                Cancelled by: {booking.cancelled_by === 'traveler' ? 'Traveler' : booking.cancelled_by}
                                                {booking.cancellation_requested_at && ` · ${new Date(booking.cancellation_requested_at).toLocaleDateString()}`}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <StatusPill status={booking.status} />
                        </div>
                    </div>
                </div>
                
                {/* ✅ DELETE button for rejected bookings */}
                {isRejected && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteBooking(booking.id || booking.booking_id);
                        }}
                        disabled={processingId === booking.id}
                        style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: `1px solid ${C.danger}44`,
                            background: C.dangerBg,
                            color: C.danger,
                            fontSize: 11,
                            cursor: processingId === booking.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            opacity: processingId === booking.id ? 0.5 : 1,
                            flexShrink: 0,
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (!processingId) {
                                e.currentTarget.style.background = C.danger;
                                e.currentTarget.style.color = '#fff';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!processingId) {
                                e.currentTarget.style.background = C.dangerBg;
                                e.currentTarget.style.color = C.danger;
                            }
                        }}
                    >
                        {processingId === booking.id ? (
                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <>
                                <Trash2 size={12} />
                                Delete
                            </>
                        )}
                    </button>
                )}
            </div>
        );
    };

    // ============================================
    // LOADING
    // ============================================
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={32} color={C.gold} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: 14, color: C.sage, fontFamily: FONT.display, fontStyle: 'italic', fontSize: 15 }}>Loading the logbook…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <div style={{ height: '100vh', background: C.cream, fontFamily: FONT.body, display: 'flex', overflow: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                .gd-nav-item:hover { background: ${C.goldSoft} !important; }
                .gd-sidebar-scroll::-webkit-scrollbar { width: 4px; }
                .gd-sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(199,154,62,0.3); border-radius: 4px; }
                .gd-content-scroll::-webkit-scrollbar { width: 6px; }
                .gd-content-scroll::-webkit-scrollbar-thumb { background: rgba(199,154,62,0.3); border-radius: 4px; }
                input:focus, textarea:focus, select:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 3px rgba(199,154,62,0.12); }
            `}</style>

            {/* SIDEBAR */}
            <aside style={{
                width: SIDEBAR_W, minWidth: SIDEBAR_W, height: '100vh',
                background: C.paper, borderRight: `1px solid ${C.line}`,
                display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
                flexShrink: 0,
            }}>
                <KasavuStrip />
                <div className="gd-sidebar-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: 10 }}>
                    <div style={{ padding: '24px 22px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Anchor size={16} color={C.goldLight} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <h1 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 17, color: C.inkSoft, margin: 0, lineHeight: 1.1 }}>The Logbook</h1>
                                <p style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.sageLight, margin: '3px 0 0' }}>Guide Dashboard</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ margin: '0 14px 18px', padding: 13, borderRadius: RADIUS.md, background: C.cream, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 700, color: C.ink, overflow: 'hidden', flexShrink: 0,
                        }}>
                            {profilePicture ? (
                                <img 
                                    src={profilePicture} 
                                    alt="Profile" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = initials(profile?.full_name || user?.first_name);
                                    }}
                                />
                            ) : (
                                initials(profile?.full_name || user?.first_name)
                            )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || user?.first_name}</p>
                            {profile?.is_verified ? (
                                <span style={{ fontSize: 10.5, color: C.success, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                    <UserCheck size={10} /> Verified guide
                                </span>
                            ) : (
                                <span style={{ fontSize: 10.5, color: C.warn, marginTop: 2, display: 'inline-block' }}>Not verified</span>
                            )}
                        </div>
                    </div>

                    <nav style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                        {navItems.map((item) => {
                            const isActive = activeTab === item.key;
                            const count = item.key === 'bookings' ? stats.pendingBookings :
                                         item.key === 'availability' ? availabilityStats.available :
                                         item.key === 'reviews' ? reviewStats.pending : 0;
                            return (
                                <button
                                    key={item.key}
                                    className="gd-nav-item"
                                    onClick={() => setActiveTab(item.key)}
                                    style={{
                                        position: 'relative', display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '10px 14px 10px 16px', width: '100%',
                                        background: isActive ? C.goldSoft : 'transparent',
                                        border: 'none', borderRadius: RADIUS.sm,
                                        color: isActive ? '#8A6A1F' : C.sage,
                                        fontSize: 13.5, fontFamily: FONT.body, fontWeight: isActive ? 600 : 500,
                                        cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left',
                                    }}
                                >
                                    {isActive && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 16, borderRadius: 2, background: C.gold }} />}
                                    <item.icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }} />
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    {count > 0 && (
                                        <span style={{ fontFamily: FONT.mono, fontSize: 10, padding: '1px 7px', borderRadius: 999, background: isActive ? 'rgba(199,154,62,0.28)' : C.warnBg, color: '#8A6A1F' }}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    <div style={{ flex: 1 }} />

                    <div style={{ padding: '14px 14px 20px', borderTop: `1px solid ${C.line}`, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button onClick={handleRefresh} disabled={refreshing} style={{
                            padding: '9px 14px', borderRadius: RADIUS.sm, border: `1px solid ${C.line}`,
                            background: 'transparent', color: C.inkSoft, cursor: refreshing ? 'not-allowed' : 'pointer', fontSize: 12.5,
                            display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.body, opacity: refreshing ? 0.6 : 1,
                        }}>
                            <RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined} />
                            {refreshing ? 'Refreshing…' : 'Refresh'}
                        </button>
                        <button onClick={logout} style={{
                            padding: '9px 14px', borderRadius: RADIUS.sm, border: 'none',
                            background: 'transparent', color: C.sage, cursor: 'pointer', fontSize: 12.5,
                            display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.body,
                        }}>
                            <LogOut size={13} />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="gd-content-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px 28px 60px' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        {/* Page header */}
                        <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <p style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, margin: '0 0 5px' }}>
                                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <h2 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 26, color: C.inkSoft, margin: 0 }}>{activeNavItem?.label}</h2>
                            </div>
                            <Btn variant="ghost" icon={RefreshCw} onClick={handleRefresh} disabled={refreshing} style={{ opacity: refreshing ? 0.6 : 1 }}>
                                {refreshing ? 'Updating…' : 'Update'}
                            </Btn>
                        </div>

                        {/* STATS */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
                            <StatChip label="Total Bookings" value={stats.totalBookings} icon={CalendarDays} tone="ink" />
                            <StatChip label="Pending" value={stats.pendingBookings} icon={Clock} tone="gold" />
                            <StatChip label="Revenue" value={`₹${stats.totalRevenue || 0}`} icon={DollarSign} tone="ink" />
                            <StatChip label="Rating" value={stats.rating ? `${stats.rating.toFixed(1)}⭐` : '—'} icon={Star} tone="gold" />
                            <StatChip label="Suggestions" value={stats.totalSuggestions} icon={MessageSquare} tone="gold" />
                            <StatChip label="Available Slots" value={availabilityStats.available} icon={Calendar} tone="gold" />
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                <Card style={{ padding: 20 }}>
                                    <SectionHead icon={CalendarDays} title="Recent Bookings" />
                                    {bookings.slice(0, 5).length === 0 ? (
                                        <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '24px 0' }}>No bookings yet.</p>
                                    ) : (
                                        bookings.slice(0, 5).map((b) => renderBookingCard(b))
                                    )}
                                </Card>
                                <Card style={{ padding: 20 }}>
                                    <SectionHead icon={AlertCircle} title="Pending Reviews" />
                                    {filteredReviews.filter(r => r.status === 'pending' || r.status === 'pending_guide' || r.status === 'pending_admin').slice(0, 5).length === 0 ? (
                                        <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '24px 0' }}>✨ No pending reviews.</p>
                                    ) : (
                                        filteredReviews.filter(r => r.status === 'pending' || r.status === 'pending_guide' || r.status === 'pending_admin').slice(0, 5).map((r) => renderReviewCard(r))
                                    )}
                                </Card>
                            </div>
                        )}

                        {/* Availability Tab with Pagination */}
                        {activeTab === 'availability' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead
                                    icon={Calendar}
                                    title="Availability Slots"
                                    count={availability.length}
                                    right={
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} style={selectStyle}>
                                                <option value="all">All Slots</option>
                                                <option value="available">✅ Available</option>
                                                <option value="booked">📅 Booked</option>
                                                <option value="full">❌ Full</option>
                                            </select>
                                            <Btn variant="primary" icon={Plus} size="sm" onClick={() => setShowAddAvailability(true)}>
                                                Add Slot
                                            </Btn>
                                        </div>
                                    }
                                />
                                {filteredAvailability.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No availability slots found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredAvailability, availabilityPage).map((slot) => (
                                                <div
                                                    key={slot.id}
                                                    style={{
                                                        display: 'flex', gap: 14, padding: 14, 
                                                        background: slot.status === 'available' || slot.status === 'pending' ? C.successBg : 
                                                                   slot.status === 'booked' || slot.status === 'confirmed' ? C.warnBg : 
                                                                   C.dangerBg,
                                                        borderRadius: RADIUS.md,
                                                        border: `1px solid ${slot.status === 'available' || slot.status === 'pending' ? C.success : 
                                                                        slot.status === 'booked' || slot.status === 'confirmed' ? C.warn : 
                                                                        C.danger}44`,
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <div style={{ 
                                                        width: 50, height: 50, borderRadius: RADIUS.sm, 
                                                        background: C.paper, border: `1px solid ${C.line}`, 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        <Calendar size={24} color={C.gold} />
                                                    </div>
                                                    
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                                            <div>
                                                                <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>
                                                                    {new Date(slot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                </h4>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                                                    <span style={{ fontSize: 12, color: C.sage }}>
                                                                        {slot.start_time} - {slot.end_time}
                                                                    </span>
                                                                    <span style={{ fontSize: 12, color: C.sage }}>
                                                                        · {slot.current_bookings || 0}/{slot.max_bookings || 1} bookings
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <StatusPill status={slot.status} />
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: C.sage }}>
                                                            <span>👥 {slot.current_bookings || 0}/{slot.max_bookings || 1} bookings</span>
                                                            <span>🔑 {slot.current_bookings && slot.max_bookings ? 
                                                                Math.round(((slot.current_bookings / slot.max_bookings) * 100)) : 0}% filled</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                        <button
                                                            onClick={() => deleteAvailability(slot.id)}
                                                            style={{ padding: '4px 10px', borderRadius: 999, border: `1px solid #EFCBB5`, background: 'transparent', color: C.danger, fontSize: 11, cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Pagination
                                            currentPage={availabilityPage}
                                            totalPages={getTotalPages(filteredAvailability)}
                                            onPageChange={setAvailabilityPage}
                                            totalItems={filteredAvailability.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </Card>
                        )}

                        {/* Bookings Tab with Pagination & Delete for Rejected */}
                        {activeTab === 'bookings' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead
                                    icon={CalendarDays}
                                    title="All Bookings"
                                    right={
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {['all', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'].map((status) => {
                                                const count = bookingStats[status] || 0;
                                                return (
                                                    <button
                                                        key={status}
                                                        onClick={() => setBookingFilter(status)}
                                                        style={{
                                                            padding: '4px 12px', borderRadius: 999,
                                                            border: bookingFilter === status ? `1px solid ${C.gold}` : `1px solid ${C.line}`,
                                                            background: bookingFilter === status ? C.gold : 'transparent',
                                                            color: bookingFilter === status ? C.ink : C.sage,
                                                            fontSize: 11, fontFamily: FONT.body, cursor: 'pointer', transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                        {count > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>({count})</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    }
                                />
                                {filteredBookings.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No bookings found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredBookings, bookingsPage).map((b) => renderBookingCard(b))}
                                        </div>
                                        <Pagination
                                            currentPage={bookingsPage}
                                            totalPages={getTotalPages(filteredBookings)}
                                            onPageChange={setBookingsPage}
                                            totalItems={filteredBookings.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </Card>
                        )}

                        {/* Reviews Tab with Pagination */}
                        {activeTab === 'reviews' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead
                                    icon={Star}
                                    title="Reviews from Travelers"
                                    count={reviews.length}
                                    right={
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <select value={reviewsFilter} onChange={(e) => setReviewsFilter(e.target.value)} style={selectStyle}>
                                                <option value="pending">⏳ Pending ({reviewStats.pending})</option>
                                                <option value="all">All ({reviewStats.total})</option>
                                                <option value="approved_by_guide">✅ Approved ({reviewStats.approved})</option>
                                                <option value="rejected_by_guide">❌ Rejected ({reviewStats.rejected})</option>
                                                <option value="implemented">✨ Implemented ({reviewStats.implemented})</option>
                                            </select>
                                        </div>
                                    }
                                />
                                {filteredReviews.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No reviews found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredReviews, reviewsPage).map((r) => renderReviewCard(r))}
                                        </div>
                                        <Pagination
                                            currentPage={reviewsPage}
                                            totalPages={getTotalPages(filteredReviews)}
                                            onPageChange={setReviewsPage}
                                            totalItems={filteredReviews.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </Card>
                        )}

                        {/* Hidden Gems Tab with Pagination */}
                        {activeTab === 'hidden-gems' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead
                                    icon={Sparkles} 
                                    title="Hidden Gems" 
                                    count={hiddenGems.length}
                                    right={
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <select value={suggestionStatusFilter} onChange={(e) => setSuggestionStatusFilter(e.target.value)} style={selectStyle}>
                                                <option value="all">All Status</option>
                                                <option value="pending">⏳ Pending</option>
                                                <option value="approved_by_guide">✅ Approved</option>
                                                <option value="rejected_by_guide">❌ Rejected</option>
                                                <option value="staff_approved">Staff Approved</option>
                                                <option value="staff_rejected">Staff Rejected</option>
                                                <option value="implemented">✨ Implemented</option>
                                            </select>
                                            <Btn variant="primary" icon={Plus} size="sm" onClick={() => { setAddSuggestionType('hidden_gem'); setShowAddSuggestion(true); }}>
                                                Add Hidden Gem
                                            </Btn>
                                        </div>
                                    }
                                />
                                {filteredHiddenGems.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                        <p style={{ color: C.sage, fontSize: 13 }}>No hidden gems found.</p>
                                        <Btn variant="primary" icon={Plus} size="sm" onClick={() => { setAddSuggestionType('hidden_gem'); setShowAddSuggestion(true); }} style={{ marginTop: 12 }}>
                                            Share a Hidden Gem
                                        </Btn>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredHiddenGems, hiddenGemsPage).map((s) => renderSuggestionCard(s, 'Hidden Gem'))}
                                        </div>
                                        <Pagination
                                            currentPage={hiddenGemsPage}
                                            totalPages={getTotalPages(filteredHiddenGems)}
                                            onPageChange={setHiddenGemsPage}
                                            totalItems={filteredHiddenGems.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </Card>
                        )}

                        {/* Local Insights Tab with Pagination */}
                        {activeTab === 'insights' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead
                                    icon={Lightbulb} 
                                    title="Local Insights" 
                                    count={localInsights.length}
                                    right={
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <select value={suggestionStatusFilter} onChange={(e) => setSuggestionStatusFilter(e.target.value)} style={selectStyle}>
                                                <option value="all">All Status</option>
                                                <option value="pending">⏳ Pending</option>
                                                <option value="approved_by_guide">✅ Approved</option>
                                                <option value="rejected_by_guide">❌ Rejected</option>
                                                <option value="staff_approved">Staff Approved</option>
                                                <option value="staff_rejected">Staff Rejected</option>
                                                <option value="implemented">✨ Implemented</option>
                                            </select>
                                            <Btn variant="primary" icon={Plus} size="sm" onClick={() => { setAddSuggestionType('local_insight'); setShowAddSuggestion(true); }}>
                                                Add Insight
                                            </Btn>
                                        </div>
                                    }
                                />
                                {filteredLocalInsights.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                                        <p style={{ color: C.sage, fontSize: 13 }}>No local insights found.</p>
                                        <Btn variant="primary" icon={Plus} size="sm" onClick={() => { setAddSuggestionType('local_insight'); setShowAddSuggestion(true); }} style={{ marginTop: 12 }}>
                                            Share an Insight
                                        </Btn>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredLocalInsights, localInsightsPage).map((s) => renderSuggestionCard(s, 'Local Insight'))}
                                        </div>
                                        <Pagination
                                            currentPage={localInsightsPage}
                                            totalPages={getTotalPages(filteredLocalInsights)}
                                            onPageChange={setLocalInsightsPage}
                                            totalItems={filteredLocalInsights.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </Card>
                        )}

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <Card style={{ padding: 24 }}>
                                <SectionHead icon={User} title="Profile" right={
                                    <Btn variant={isEditingProfile ? 'success' : 'primary'} icon={isEditingProfile ? Save : Edit2} onClick={() => setIsEditingProfile(!isEditingProfile)}>
                                        {isEditingProfile ? 'Save' : 'Edit'}
                                    </Btn>
                                } />

                                <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 18px', background: C.cream, borderRadius: RADIUS.md, marginBottom: 20, border: `1px solid ${C.line}` }}>
                                    <div style={{ position: 'relative' }}>
                                        <div
                                            style={{
                                                width: 68, height: 68, borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 26, fontWeight: 'bold', color: C.ink, overflow: 'hidden', cursor: 'pointer',
                                                border: `2px solid ${C.gold}66`,
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {profilePicture ? (
                                                <img 
                                                    src={profilePicture} 
                                                    alt="Profile" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.textContent = initials(profile?.full_name || user?.first_name);
                                                    }}
                                                />
                                            ) : (
                                                initials(profile?.full_name || user?.first_name)
                                            )}
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: C.ink, color: C.goldLight, border: `2px solid ${C.cream}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {uploading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={12} />}
                                        </button>
                                        <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleProfilePictureUpload} disabled={uploading} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: 17, color: C.inkSoft, margin: 0, fontFamily: FONT.display }}>{profile?.full_name || user?.first_name}</h4>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '2px 0 0' }}>
                                            {profile?.districts && profile.districts.length > 0 
                                                ? profile.districts[0] 
                                                : profile?.district || 'District not set'}
                                        </p>
                                        <span style={{ fontSize: 12, color: profile?.is_verified ? C.success : C.warn, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            {profile?.is_verified ? '✅ Verified Guide' : '⏳ Not Verified'}
                                        </span>
                                    </div>
                                </div>

                                {isEditingProfile ? (
                                    <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Full Name</label>
                                                <input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Phone</label>
                                                <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} style={inputStyle} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Bio</label>
                                            <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Experience (years)</label>
                                                <input type="number" value={profileForm.experience_years} onChange={(e) => setProfileForm({ ...profileForm, experience_years: e.target.value })} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Languages</label>
                                                <input type="text" value={profileForm.languages} onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })} style={inputStyle} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Specialties (comma separated)</label>
                                            <input type="text" value={profileForm.specialties} onChange={(e) => setProfileForm({ ...profileForm, specialties: e.target.value })} style={inputStyle} />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Price/Day ($)</label>
                                                <input type="number" step="0.01" value={profileForm.price_per_day} onChange={(e) => setProfileForm({ ...profileForm, price_per_day: e.target.value })} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Price/Hour ($)</label>
                                                <input type="number" step="0.01" value={profileForm.price_per_hour} onChange={(e) => setProfileForm({ ...profileForm, price_per_hour: e.target.value })} style={inputStyle} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10, marginTop: 6, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
                                            <Btn type="submit" variant="primary" icon={Save}>Save Profile</Btn>
                                            <Btn type="button" variant="ghost" onClick={() => setIsEditingProfile(false)}>Cancel</Btn>
                                        </div>
                                    </form>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '7px 20px' }}>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Email</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{user?.email}</span>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Phone</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.phone || 'Not set'}</span>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Experience</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.experience_years || 0} years</span>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Languages</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.languages || 'Not set'}</span>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Specialties</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.specialties?.join(', ') || 'Not set'}</span>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Pricing</span>
                                        <span style={{ color: C.inkSoft, fontSize: 13 }}>
                                            {profile?.price_per_day ? `$${profile.price_per_day}/day` : ''}
                                            {profile?.price_per_day && profile?.price_per_hour ? ' · ' : ''}
                                            {profile?.price_per_hour ? `$${profile.price_per_hour}/hour` : 'Not set'}
                                        </span>
                                        {profile?.bio && (
                                            <>
                                                <span style={{ color: C.sage, fontSize: 13, alignSelf: 'flex-start' }}>Bio</span>
                                                <span style={{ color: C.inkSoft, fontSize: 13, lineHeight: 1.6 }}>{profile.bio}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* ADD AVAILABILITY MODAL */}
            {showAddAvailability && (
                <ModalShell
                    onClose={() => {
                        setShowAddAvailability(false);
                        setNewAvailability({
                            date: '',
                            start_time: '',
                            end_time: '',
                            max_bookings: 1,
                        });
                    }}
                    title="Add Availability Slot"
                    subtitle="Create a new availability slot for travelers"
                    icon={Calendar}
                    footer={
                        <>
                            <Btn variant="ghost" onClick={() => {
                                setShowAddAvailability(false);
                                setNewAvailability({
                                    date: '',
                                    start_time: '',
                                    end_time: '',
                                    max_bookings: 1,
                                });
                            }}>Cancel</Btn>
                            <Btn variant="primary" icon={Plus} onClick={handleAddAvailability} disabled={addingSlot}>
                                {addingSlot ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {addingSlot ? 'Adding...' : 'Add Slot'}
                            </Btn>
                        </>
                    }
                >
                    <form onSubmit={handleAddAvailability} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Date <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                type="date"
                                value={newAvailability.date}
                                onChange={(e) => setNewAvailability({ ...newAvailability, date: e.target.value })}
                                style={inputStyle}
                                required
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Start Time <span style={{ color: C.danger }}>*</span>
                                </label>
                                <input
                                    type="time"
                                    value={newAvailability.start_time}
                                    onChange={(e) => setNewAvailability({ ...newAvailability, start_time: e.target.value })}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    End Time <span style={{ color: C.danger }}>*</span>
                                </label>
                                <input
                                    type="time"
                                    value={newAvailability.end_time}
                                    onChange={(e) => setNewAvailability({ ...newAvailability, end_time: e.target.value })}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Max Bookings <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={newAvailability.max_bookings}
                                onChange={(e) => setNewAvailability({ ...newAvailability, max_bookings: parseInt(e.target.value) || 1 })}
                                style={inputStyle}
                                required
                            />
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* ADD SUGGESTION MODAL */}
            {showAddSuggestion && (
                <ModalShell
                    onClose={() => {
                        setShowAddSuggestion(false);
                        setNewSuggestion({
                            name: '',
                            description: '',
                            district: '',
                            category: '',
                            location_info: '',
                            image_url: '',
                        });
                        setSuggestionImageFile(null);
                        if (suggestionFileInputRef.current) {
                            suggestionFileInputRef.current.value = '';
                        }
                    }}
                    title={`Add ${addSuggestionType === 'hidden_gem' ? 'Hidden Gem' : 'Insight'}`}
                    subtitle="Share your knowledge - Sent to admin for review"
                    icon={addSuggestionType === 'hidden_gem' ? Sparkles : Lightbulb}
                    footer={
                        <>
                            <Btn variant="ghost" onClick={() => {
                                setShowAddSuggestion(false);
                                setNewSuggestion({
                                    name: '',
                                    description: '',
                                    district: '',
                                    category: '',
                                    location_info: '',
                                    image_url: '',
                                });
                                setSuggestionImageFile(null);
                                if (suggestionFileInputRef.current) {
                                    suggestionFileInputRef.current.value = '';
                                }
                            }}>Cancel</Btn>
                            <Btn variant="primary" icon={Send} onClick={handleAddSuggestion} disabled={submittingSuggestion}>
                                {submittingSuggestion ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {submittingSuggestion ? 'Submitting...' : 'Submit'}
                            </Btn>
                        </>
                    }
                >
                    <form onSubmit={handleAddSuggestion} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Name <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Secret Beach in Varkala"
                                value={newSuggestion.name}
                                onChange={(e) => setNewSuggestion({ ...newSuggestion, name: e.target.value })}
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Description <span style={{ color: C.danger }}>*</span>
                            </label>
                            <textarea
                                placeholder="Describe this hidden gem or insight..."
                                value={newSuggestion.description}
                                onChange={(e) => setNewSuggestion({ ...newSuggestion, description: e.target.value })}
                                rows={4}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                District <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Thiruvananthapuram"
                                value={newSuggestion.district}
                                onChange={(e) => setNewSuggestion({ ...newSuggestion, district: e.target.value })}
                                style={inputStyle}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Category
                            </label>
                            <select
                                value={newSuggestion.category}
                                onChange={(e) => setNewSuggestion({ ...newSuggestion, category: e.target.value })}
                                style={selectStyle}
                            >
                                <option value="general">General</option>
                                <option value="beach">Beach</option>
                                <option value="waterfall">Waterfall</option>
                                <option value="hill_station">Hill Station</option>
                                <option value="backwater">Backwater</option>
                                <option value="temple">Temple</option>
                                <option value="fort">Fort</option>
                                <option value="wildlife">Wildlife</option>
                                <option value="adventure">Adventure</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Image (optional)
                            </label>
                            <input
                                type="file"
                                ref={suggestionFileInputRef}
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) setSuggestionImageFile(file);
                                }}
                                style={{ ...inputStyle, padding: '8px 13px' }}
                            />
                            {suggestionImageFile && (
                                <div style={{ fontSize: 11, color: C.success, marginTop: 4 }}>
                                    📷 {suggestionImageFile.name} selected
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: 11, color: C.sage, padding: 8, background: '#F8FAFC', borderRadius: RADIUS.sm }}>
                            💡 Your suggestion will be reviewed by admin/staff. Once approved and implemented, it will be visible to travelers.
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* REVIEW DETAIL MODAL */}
            {showReviewModal && selectedReview && (
                <ModalShell
                    onClose={() => setShowReviewModal(false)}
                    title={selectedReview.name || 'Review Details'}
                    subtitle={selectedReview.district}
                    icon={Star}
                    footer={
                        <>
                            {selectedReview.status === 'pending' && (
                                <>
                                    <Btn variant="success" icon={Check} onClick={() => processReview(selectedReview.id, 'approve')} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                        Approve
                                    </Btn>
                                    <Btn variant="danger" icon={X} onClick={() => processReview(selectedReview.id, 'reject')} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                        Reject
                                    </Btn>
                                </>
                            )}
                            {selectedReview.status === 'implemented' && (
                                <span style={{ fontSize: 13, color: C.success, fontWeight: 600, padding: '8px 16px' }}>🎉 Implemented!</span>
                            )}
                            <Btn variant="ghost" onClick={() => setShowReviewModal(false)}>Close</Btn>
                        </>
                    }
                >
                    {getImageUrl(selectedReview) && (
                        <img 
                            src={getImageUrl(selectedReview)} 
                            alt={selectedReview.name} 
                            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: RADIUS.md, marginBottom: 16, border: `1px solid ${C.line}` }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}
                    
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.cream, color: C.sage }}>{selectedReview.district}</span>
                        <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.cream, color: C.sage }}>{selectedReview.user_email}</span>
                        {selectedReview.rating > 0 && (
                            <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.goldSoft, color: C.gold }}>
                                {'★'.repeat(Math.round(selectedReview.rating))} {selectedReview.rating}/5
                            </span>
                        )}
                        <StatusPill status={selectedReview.status} />
                        {selectedReview.implemented_at && (
                            <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.successBg, color: C.success }}>
                                Implemented: {new Date(selectedReview.implemented_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                    
                    <p style={{ fontSize: 14, color: C.sage, lineHeight: 1.6, marginBottom: 12 }}>
                        {selectedReview.review_text || selectedReview.description || 'No review content'}
                    </p>
                    
                    {selectedReview.admin_notes && (
                        <div style={{ background: C.infoBg, padding: 12, borderRadius: RADIUS.sm }}>
                            <p style={{ fontSize: 11, color: C.info, margin: 0, fontWeight: 600 }}>📋 Admin Notes</p>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: '4px 0 0' }}>{selectedReview.admin_notes}</p>
                        </div>
                    )}
                </ModalShell>
            )}

            {/* BOOKING DETAIL MODAL - Shows cancellation reason */}
            {showBookingDetailModal && selectedBooking && (
                <ModalShell
                    onClose={() => setShowBookingDetailModal(false)}
                    title={`Booking Details`}
                    subtitle={`#${selectedBooking.booking_id || selectedBooking.id}`}
                    icon={CalendarDays}
                    footer={
                        <>
                            {selectedBooking.status === 'pending' && (
                                <>
                                    <Btn variant="success" icon={Check} onClick={() => { processBooking(selectedBooking.id, 'confirm'); setShowBookingDetailModal(false); }} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                        Confirm
                                    </Btn>
                                    <Btn variant="danger" icon={X} onClick={() => { processBooking(selectedBooking.id, 'reject'); setShowBookingDetailModal(false); }} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                        Reject
                                    </Btn>
                                    <Btn variant="danger" icon={Trash2} onClick={() => { cancelBooking(selectedBooking.id); setShowBookingDetailModal(false); }} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                        Cancel
                                    </Btn>
                                </>
                            )}
                            {selectedBooking.status === 'confirmed' && (
                                <>
                                    <Btn variant="gold" icon={CheckCircle} onClick={() => { processBooking(selectedBooking.id, 'complete'); setShowBookingDetailModal(false); }} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                        Complete
                                    </Btn>
                                    <Btn variant="danger" icon={Trash2} onClick={() => { cancelBooking(selectedBooking.id); setShowBookingDetailModal(false); }} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                        Cancel
                                    </Btn>
                                </>
                            )}
                            {selectedBooking.status === 'completed' && (
                                <span style={{ fontSize: 13, color: C.success, padding: '8px 16px' }}>✅ Completed</span>
                            )}
                            {selectedBooking.status === 'cancelled' && (
                                <span style={{ fontSize: 13, color: C.danger, padding: '8px 16px' }}>❌ Cancelled</span>
                            )}
                            {selectedBooking.status === 'rejected' && (
                                <span style={{ fontSize: 13, color: C.danger, padding: '8px 16px' }}>🚫 Rejected</span>
                            )}
                            <Btn variant="ghost" onClick={() => setShowBookingDetailModal(false)}>Close</Btn>
                        </>
                    }
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <div>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Traveler</p>
                            <p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedBooking.user?.username || selectedBooking.traveler_email || 'Anonymous'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Place</p>
                            <p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedBooking.place || selectedBooking.district || 'N/A'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Date</p>
                            <p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString() : '—'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Time</p>
                            <p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedBooking.time || '—'}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>People</p>
                            <p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedBooking.number_of_people || 1}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Duration</p>
                            <p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedBooking.duration_hours || 4} hours</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Price</p>
                            <p style={{ fontSize: 14, color: C.gold, margin: '4px 0 0', fontWeight: 600 }}>₹{selectedBooking.total_price || 0}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Status</p>
                            <StatusPill status={selectedBooking.status} />
                        </div>
                    </div>

                    {selectedBooking.special_requests && (
                        <div style={{ marginBottom: 12, padding: 12, background: C.cream, borderRadius: RADIUS.sm, border: `1px solid ${C.line}` }}>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Special Requests</p>
                            <p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedBooking.special_requests}</p>
                        </div>
                    )}

                    {/* ✅ CANCELLATION REASON - Show prominently if cancelled/rejected */}
                    {selectedBooking.status === 'cancelled' && selectedBooking.cancellation_reason && (
                        <div style={{ 
                            marginTop: 12, 
                            padding: 14, 
                            background: C.dangerBg, 
                            borderRadius: RADIUS.sm, 
                            border: `2px solid ${C.danger}44`,
                        }}>
                            <p style={{ fontSize: 11, color: C.danger, margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={16} />
                                Cancellation Reason
                            </p>
                            <p style={{ fontSize: 14, color: C.inkSoft, margin: '6px 0 0', lineHeight: 1.5 }}>
                                "{selectedBooking.cancellation_reason}"
                            </p>
                            {selectedBooking.cancelled_by && (
                                <p style={{ fontSize: 11, color: C.sage, margin: '4px 0 0' }}>
                                    Cancelled by: {selectedBooking.cancelled_by === 'traveler' ? 'Traveler' : selectedBooking.cancelled_by}
                                    {selectedBooking.cancellation_requested_at && ` · ${new Date(selectedBooking.cancellation_requested_at).toLocaleDateString()}`}
                                </p>
                            )}
                        </div>
                    )}
                </ModalShell>
            )}

            {/* SUGGESTION DETAIL MODAL */}
            {showSuggestionModal && selectedSuggestion && (
                <ModalShell
                    onClose={() => setShowSuggestionModal(false)}
                    title={selectedSuggestion.name}
                    subtitle={selectedSuggestion.district}
                    icon={getSuggestionTypeIcon(selectedSuggestion.suggestion_type)}
                    footer={
                        <>
                            {(selectedSuggestion.status === 'pending' || selectedSuggestion.status === 'pending_guide') && 
                             !selectedSuggestion.is_guide_submitted && (
                                <>
                                    <Btn variant="success" icon={Check} onClick={() => processSuggestion(selectedSuggestion.id, 'approve')} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                        Approve
                                    </Btn>
                                    <Btn variant="danger" icon={X} onClick={() => processSuggestion(selectedSuggestion.id, 'reject')} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                        Reject
                                    </Btn>
                                </>
                            )}
                            
                            {selectedSuggestion.is_guide_submitted && selectedSuggestion.status !== 'implemented' && (
                                <Btn variant="danger" icon={Trash2} onClick={() => deleteSuggestion(selectedSuggestion.id)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                    Delete
                                </Btn>
                            )}
                            
                            <Btn variant="ghost" onClick={() => setShowSuggestionModal(false)}>Close</Btn>
                        </>
                    }
                >
                    {getImageUrl(selectedSuggestion) && (
                        <img 
                            src={getImageUrl(selectedSuggestion)} 
                            alt={selectedSuggestion.name} 
                            style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: RADIUS.md, marginBottom: 16, border: `1px solid ${C.line}` }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}
                    
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.cream, color: C.sage }}>{selectedSuggestion.district}</span>
                        <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.goldSoft, color: C.gold }}>{getSuggestionTypeLabel(selectedSuggestion.suggestion_type)}</span>
                        <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.cream, color: C.sage }}>{selectedSuggestion.user_email}</span>
                        {selectedSuggestion.rating > 0 && (
                            <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.goldSoft, color: C.gold }}>
                                {'★'.repeat(Math.round(selectedSuggestion.rating))} {selectedSuggestion.rating}/5
                            </span>
                        )}
                        <StatusPill status={selectedSuggestion.status} />
                    </div>
                    
                    <p style={{ fontSize: 14, color: C.sage, lineHeight: 1.6, marginBottom: 12 }}>
                        {selectedSuggestion.description || 'No description'}
                    </p>
                    
                    {selectedSuggestion.location_info && (
                        <div style={{ background: C.cream, padding: 12, borderRadius: RADIUS.sm, marginBottom: 8 }}>
                            <p style={{ fontSize: 11, color: C.info, margin: 0, fontWeight: 600 }}>📍 Location Info</p>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: '4px 0 0' }}>{selectedSuggestion.location_info}</p>
                        </div>
                    )}
                    
                    {selectedSuggestion.admin_notes && (
                        <div style={{ background: C.infoBg, padding: 12, borderRadius: RADIUS.sm }}>
                            <p style={{ fontSize: 11, color: C.info, margin: 0, fontWeight: 600 }}>📋 Admin Notes</p>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: '4px 0 0' }}>{selectedSuggestion.admin_notes}</p>
                        </div>
                    )}
                </ModalShell>
            )}

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                    padding: '12px 24px', borderRadius: RADIUS.sm, background: C.ink, color: C.goldLight,
                    fontSize: 13, fontFamily: FONT.body, boxShadow: '0 8px 24px rgba(7,46,42,0.25)', zIndex: 100,
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default GuideDashboard;
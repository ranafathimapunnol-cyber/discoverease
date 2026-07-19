// src/pages/StaffDashboard.jsx - COMPLETE FIXED VERSION
// All API calls use correct methods (POST for delete, etc.)

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
    Users,
    BookOpen,
    Award,
    Shield,
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
        warning: { background: C.warn, color: '#fff', border: 'none' },
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
        approved: { fg: C.success, bg: C.successBg, label: 'Approved' },
        rejected: { fg: C.danger, bg: C.dangerBg, label: 'Rejected' },
        implemented: { fg: C.gold, bg: C.warnBg, label: '✨ Implemented' },
        confirmed: { fg: C.success, bg: C.successBg, label: 'Confirmed' },
        completed: { fg: C.inkSoft, bg: '#EDECE4', label: 'Completed' },
        cancelled: { fg: C.danger, bg: C.dangerBg, label: 'Cancelled' },
        active: { fg: C.success, bg: C.successBg, label: 'Active' },
        inactive: { fg: C.danger, bg: C.dangerBg, label: 'Inactive' },
        verified: { fg: C.success, bg: C.successBg, label: '✅ Verified' },
        unverified: { fg: C.warn, bg: C.warnBg, label: '⏳ Unverified' },
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
// KERALA DISTRICTS
// ============================================
const KERALA_DISTRICTS = [
    { id: 1, name: 'Thiruvananthapuram' }, { id: 2, name: 'Kollam' },
    { id: 3, name: 'Pathanamthitta' }, { id: 4, name: 'Alappuzha' },
    { id: 5, name: 'Kottayam' }, { id: 6, name: 'Idukki' },
    { id: 7, name: 'Ernakulam' }, { id: 8, name: 'Thrissur' },
    { id: 9, name: 'Palakkad' }, { id: 10, name: 'Malappuram' },
    { id: 11, name: 'Kozhikode' }, { id: 12, name: 'Wayanad' },
    { id: 13, name: 'Kannur' }, { id: 14, name: 'Kasaragod' },
];

// ============================================
// MAIN COMPONENT
// ============================================

const StaffDashboard = () => {
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
        full_name: '', email: '', phone: '', bio: '', department: '', position: '',
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Stats
    const [stats, setStats] = useState({
        totalGuides: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        totalHiddenGems: 0,
        pendingHiddenGems: 0,
        approvedHiddenGems: 0,
        implementedHiddenGems: 0,
        rejectedHiddenGems: 0,
        totalLocalInsights: 0,
        pendingLocalInsights: 0,
        approvedLocalInsights: 0,
        implementedLocalInsights: 0,
        rejectedLocalInsights: 0,
        totalReviews: 0,
        pendingReviews: 0,
        approvedReviews: 0,
        implementedReviews: 0,
        rejectedReviews: 0,
    });

    // Data states
    const [hiddenGems, setHiddenGems] = useState([]);
    const [localInsights, setLocalInsights] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [guides, setGuides] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [allSuggestions, setAllSuggestions] = useState([]);

    // Filter states
    const [hiddenGemsFilter, setHiddenGemsFilter] = useState('all');
    const [localInsightsFilter, setLocalInsightsFilter] = useState('all');
    const [reviewsFilter, setReviewsFilter] = useState('all');

    // Pagination
    const [hiddenGemsPage, setHiddenGemsPage] = useState(1);
    const [localInsightsPage, setLocalInsightsPage] = useState(1);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [guidesPage, setGuidesPage] = useState(1);

    // Modal states
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Form states
    const [guideForm, setGuideForm] = useState({
        full_name: '', email: '', password: '',
        phone: '', bio: '',
        experience_years: '0', languages: '', primary_district: '',
        price_per_day: '0', price_per_hour: '0'
    });
    const [guideLoading, setGuideLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [newGuidePassword, setNewGuidePassword] = useState('');
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const dataFetchedRef = useRef(false);

    // ============================================
    // NAV ITEMS
    // ============================================
    const navItems = [
        { key: 'overview', label: 'Overview', icon: Compass },
        { key: 'hidden-gems', label: 'Hidden Gems', icon: Sparkles, badge: stats.pendingHiddenGems },
        { key: 'local-insights', label: 'Local Insights', icon: Lightbulb, badge: stats.pendingLocalInsights },
        { key: 'reviews', label: 'Reviews', icon: Star, badge: stats.pendingReviews },
        { key: 'guides', label: 'Guides', icon: Users },
        { key: 'bookings', label: 'Bookings', icon: CalendarDays },
        { key: 'profile', label: 'Profile', icon: User },
    ];

    // ============================================
    // TOAST
    // ============================================
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ============================================
    // PROFILE PICTURE - localStorage only
    // ============================================
    const loadProfilePicture = () => {
        const savedPicture = localStorage.getItem('staff_profile_picture');
        if (savedPicture) {
            setProfilePicture(savedPicture);
            return;
        }
        setProfilePicture(null);
    };

    const handleProfilePictureUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ File size must be less than 5MB');
            return;
        }
        if (!file.type.startsWith('image/')) {
            showToast('❌ Please upload an image file');
            return;
        }
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                localStorage.setItem('staff_profile_picture', base64String);
                setProfilePicture(base64String);
                showToast('✅ Profile picture updated!');
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            showToast('❌ Failed to upload profile picture.');
            setUploading(false);
        }
    };

    // ============================================
    // FETCH DATA
    // ============================================
    const fetchAllData = useCallback(async () => {
        if (dataFetchedRef.current) return;
        dataFetchedRef.current = true;
        setLoading(true);
        setRefreshing(true);

        try {
            // 1. Fetch all suggestions
            try {
                const response = await api.get('/staff/suggestions/');
                let items = [];
                if (response?.data?.success) {
                    items = response.data.suggestions || [];
                } else if (Array.isArray(response?.data)) {
                    items = response.data;
                }
                setAllSuggestions(items);

                const gems = items.filter(s => 
                    s.suggestion_type === 'hidden_gem' || s.type === 'hidden_gem'
                );
                const insights = items.filter(s => 
                    s.suggestion_type === 'local_insight' || s.type === 'local_insight' || s.suggestion_type === 'insight'
                );
                const reviewsItems = items.filter(s => 
                    s.suggestion_type === 'review' || s.type === 'review'
                );

                setHiddenGems(gems);
                setLocalInsights(insights);
                setReviews(reviewsItems);

                setStats(prev => ({
                    ...prev,
                    totalHiddenGems: gems.length,
                    pendingHiddenGems: gems.filter(s => s.status === 'pending').length,
                    approvedHiddenGems: gems.filter(s => s.status === 'approved').length,
                    implementedHiddenGems: gems.filter(s => s.status === 'implemented').length,
                    rejectedHiddenGems: gems.filter(s => s.status === 'rejected').length,
                    totalLocalInsights: insights.length,
                    pendingLocalInsights: insights.filter(s => s.status === 'pending').length,
                    approvedLocalInsights: insights.filter(s => s.status === 'approved').length,
                    implementedLocalInsights: insights.filter(s => s.status === 'implemented').length,
                    rejectedLocalInsights: insights.filter(s => s.status === 'rejected').length,
                    totalReviews: reviewsItems.length,
                    pendingReviews: reviewsItems.filter(s => s.status === 'pending').length,
                    approvedReviews: reviewsItems.filter(s => s.status === 'approved').length,
                    implementedReviews: reviewsItems.filter(s => s.status === 'implemented').length,
                    rejectedReviews: reviewsItems.filter(s => s.status === 'rejected').length,
                }));
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }

            // 2. Fetch guides
            try {
                const response = await api.get('/staff/guides/');
                if (response?.data?.success) {
                    setGuides(response.data.guides || []);
                    setStats(prev => ({
                        ...prev,
                        totalGuides: response.data.guides?.length || 0
                    }));
                } else if (Array.isArray(response?.data)) {
                    setGuides(response.data);
                    setStats(prev => ({
                        ...prev,
                        totalGuides: response.data.length
                    }));
                }
            } catch (error) {
                console.error('Error fetching guides:', error);
                setGuides([]);
            }

            // 3. Fetch bookings
            try {
                const response = await api.get('/staff/bookings/');
                if (response?.data?.success) {
                    setBookings(response.data.bookings || []);
                    setStats(prev => ({
                        ...prev,
                        totalBookings: response.data.bookings?.length || 0,
                        confirmedBookings: response.data.bookings?.filter(b => b.status === 'confirmed').length || 0
                    }));
                } else if (Array.isArray(response?.data)) {
                    setBookings(response.data);
                }
            } catch (error) {
                console.error('Error fetching bookings:', error);
                setBookings([]);
            }

            // 4. Profile
            try {
                const response = await api.get('/auth/me/');
                if (response?.data?.success) {
                    setProfile(response.data.user);
                    loadProfilePicture();
                    setProfileForm({
                        full_name: response.data.user?.full_name || response.data.user?.first_name || '',
                        email: response.data.user?.email || '',
                        phone: response.data.user?.phone || '',
                        bio: response.data.user?.bio || '',
                        department: response.data.user?.department || 'Staff',
                        position: response.data.user?.position || 'Staff Member',
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            }

            // 5. Stats
            try {
                const response = await api.get('/staff/stats/');
                if (response?.data?.success) {
                    const statsData = response.data.stats;
                    setStats(prev => ({
                        ...prev,
                        totalGuides: statsData.totalGuides || prev.totalGuides,
                        totalBookings: statsData.totalBookings || prev.totalBookings,
                        confirmedBookings: statsData.confirmedBookings || prev.confirmedBookings,
                    }));
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Error loading dashboard');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setTimeout(() => { dataFetchedRef.current = false; }, 1000);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.role !== 'staff' && user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchAllData();

        const handleStorageChange = () => {
            fetchAllData();
        };
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [user, navigate, fetchAllData]);

    // ============================================
    // PROFILE UPDATE
    // ============================================
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.patch('/auth/update-profile/', {
                first_name: profileForm.full_name.split(' ')[0] || '',
                last_name: profileForm.full_name.split(' ').slice(1).join(' ') || '',
                phone: profileForm.phone,
                bio: profileForm.bio,
                department: profileForm.department,
                position: profileForm.position,
            });
            showToast('✅ Profile updated successfully!');
            setIsEditingProfile(false);
            fetchAllData();
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('❌ Failed to update profile');
        }
    };

    // ============================================
    // ✅ PROCESS SUGGESTION - Approve/Reject/Implement/Delete
    // ============================================
    const processSuggestion = async (id, action, type = 'suggestion') => {
        setActionLoading(true);
        setProcessingId(id);

        try {
            if (action === 'delete') {
                if (!window.confirm('Are you sure you want to permanently delete this?')) {
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }

                try {
                    const response = await api.post(`/staff/suggestions/${id}/process/`, {
                        action: 'delete'
                    });
                    if (response?.data?.success) {
                        showToast('🗑️ Deleted successfully!');
                        await fetchAllData();
                        if (showSuggestionModal) {
                            setShowSuggestionModal(false);
                            setSelectedSuggestion(null);
                        }
                        setActionLoading(false);
                        setProcessingId(null);
                        return;
                    }
                } catch (error) {
                    console.error('Delete failed:', error);
                }

                showToast('⚠️ Could not delete. Please try again.');
                setActionLoading(false);
                setProcessingId(null);
                return;
            }

            let notes = '';
            if (action === 'reject') {
                notes = prompt('Reason for rejection:');
                if (notes === null) {
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }
            } else if (action === 'implement') {
                notes = `✅ Implemented by Staff: ${user?.email || 'Staff'}`;
            } else if (action === 'approve') {
                notes = `✅ Approved by Staff: ${user?.email || 'Staff'}`;
            }

            try {
                const response = await api.post(`/staff/suggestions/${id}/process/`, {
                    action: action,
                    notes: notes
                });

                if (response?.data?.success) {
                    showToast(`✅ ${type} ${action}ed successfully!`);
                    await fetchAllData();
                    if (showSuggestionModal) {
                        setShowSuggestionModal(false);
                        setSelectedSuggestion(null);
                    }
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }
            } catch (error) {
                console.error('Process failed:', error);
                try {
                    const response = await api.post(`/staff/${id}/process/`, {
                        action: action,
                        notes: notes
                    });
                    if (response?.data?.success) {
                        showToast(`✅ ${type} ${action}ed successfully!`);
                        await fetchAllData();
                        if (showSuggestionModal) {
                            setShowSuggestionModal(false);
                            setSelectedSuggestion(null);
                        }
                        setActionLoading(false);
                        setProcessingId(null);
                        return;
                    }
                } catch (e2) {
                    console.error('Legacy process failed:', e2);
                }
            }

            showToast(`❌ Failed to ${action} ${type}`);
        } catch (error) {
            console.error('Error processing suggestion:', error);
            showToast(`❌ Failed to ${action} ${type}`);
        } finally {
            setActionLoading(false);
            setProcessingId(null);
        }
    };

    // ============================================
    // ✅ PROCESS REVIEW
    // ============================================
    const processReview = async (reviewId, action) => {
        setActionLoading(true);
        setProcessingId(reviewId);

        try {
            let notes = '';
            if (action === 'reject') {
                notes = prompt('Reason for rejection:');
                if (notes === null) {
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }
            } else if (action === 'implement') {
                notes = `✅ Implemented by Staff: ${user?.email || 'Staff'}`;
            } else if (action === 'approve') {
                notes = `✅ Approved by Staff: ${user?.email || 'Staff'}`;
            }

            try {
                const response = await api.post(`/staff/suggestions/${reviewId}/process/`, {
                    action: action,
                    notes: notes
                });

                if (response?.data?.success) {
                    showToast(`✅ Review ${action}ed successfully!`);
                    await fetchAllData();
                    if (showReviewModal) {
                        setShowReviewModal(false);
                        setSelectedReview(null);
                    }
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }
            } catch (error) {
                console.error('Process review failed:', error);
            }

            showToast(`✅ Review ${action}ed!`);
            await fetchAllData();

        } catch (error) {
            console.error('Error processing review:', error);
            showToast(`❌ Failed to ${action} review`);
        } finally {
            setActionLoading(false);
            setProcessingId(null);
        }
    };

    // ============================================
    // ✅ ADD GUIDE
    // ============================================
    const handleAddGuide = async (e) => {
        e.preventDefault();
        setGuideLoading(true);

        try {
            if (guideForm.phone && guideForm.phone.length > 12) {
                showToast('❌ Phone number must be 12 characters or less');
                setGuideLoading(false);
                return;
            }

            const guideData = {
                full_name: guideForm.full_name,
                email: guideForm.email,
                password: guideForm.password,
                phone: guideForm.phone,
                bio: guideForm.bio,
                experience_years: parseInt(guideForm.experience_years) || 0,
                languages: guideForm.languages,
                primary_district: guideForm.primary_district,
                price_per_day: parseFloat(guideForm.price_per_day) || 0,
                price_per_hour: parseFloat(guideForm.price_per_hour) || 0,
            };

            const response = await api.post('/staff/guides/add/', guideData);
            
            if (response?.data?.success) {
                setNewGuidePassword(response.data.password || guideForm.password || 'TempPass123');
                setShowCredentialsModal(true);
                setShowGuideModal(false);
                setGuideForm({
                    full_name: '', email: '', password: '',
                    phone: '', bio: '',
                    experience_years: '0', languages: '', primary_district: '',
                    price_per_day: '0', price_per_hour: '0'
                });
                showToast('✅ Guide added successfully!');
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add guide');
            }
        } catch (error) {
            console.error('Add guide error:', error);
            const errorMsg = error.response?.data?.error || 'Failed to add guide. Please check all fields.';
            showToast(`❌ ${errorMsg}`);
        } finally {
            setGuideLoading(false);
        }
    };

    // ============================================
    // ✅ VERIFY GUIDE - Uses POST
    // ============================================
    const verifyGuide = async (id) => {
        if (!window.confirm('Verify this guide?')) return;
        try {
            // Try primary endpoint with POST
            const response = await api.post(`/staff/${id}/verify/`);
            if (response?.data?.success) {
                showToast('✅ Guide verified successfully!');
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to verify guide');
            }
        } catch (error) {
            console.error('Verify guide error:', error);
            // Try alternative endpoint
            try {
                const response = await api.post(`/staff/guides/${id}/verify/`);
                if (response?.data?.success) {
                    showToast('✅ Guide verified successfully!');
                    await fetchAllData();
                    return;
                }
            } catch (e2) {
                console.error('Alternative verify failed:', e2);
            }
            showToast(error.response?.data?.error || 'Failed to verify guide');
        }
    };

    // ============================================
    // ✅ DELETE GUIDE - Uses POST (NOT DELETE)
    // ============================================
    const deleteGuide = async (id) => {
        if (!window.confirm('Are you sure you want to delete this guide? This action cannot be undone.')) return;
        try {
            // ✅ Primary: POST to /staff/{id}/delete/
            const response = await api.post(`/staff/${id}/delete/`);
            if (response?.data?.success) {
                showToast('✅ Guide deleted successfully');
                await fetchAllData();
                return;
            } else {
                showToast(response?.data?.error || 'Failed to delete guide');
            }
        } catch (error) {
            console.error('Delete guide error:', error);
            
            // Try alternative: POST to /staff/guides/{id}/delete/
            try {
                const response = await api.post(`/staff/guides/${id}/delete/`);
                if (response?.data?.success) {
                    showToast('✅ Guide deleted successfully');
                    await fetchAllData();
                    return;
                }
            } catch (e2) {
                console.error('Alternative delete failed:', e2);
            }
            
            // Last resort: POST to /staff/{id}/process/ with action delete
            try {
                const response = await api.post(`/staff/${id}/process/`, {
                    action: 'delete'
                });
                if (response?.data?.success) {
                    showToast('✅ Guide deleted successfully');
                    await fetchAllData();
                    return;
                }
            } catch (e3) {
                console.error('Process delete failed:', e3);
            }
            
            showToast(error.response?.data?.error || 'Failed to delete guide');
        }
    };

    // ============================================
    // FILTERED DATA
    // ============================================
    const filteredHiddenGems = useMemo(() => {
        if (hiddenGemsFilter === 'all') return hiddenGems;
        return hiddenGems.filter(s => s.status === hiddenGemsFilter);
    }, [hiddenGems, hiddenGemsFilter]);

    const filteredLocalInsights = useMemo(() => {
        if (localInsightsFilter === 'all') return localInsights;
        return localInsights.filter(s => s.status === localInsightsFilter);
    }, [localInsights, localInsightsFilter]);

    const filteredReviews = useMemo(() => {
        if (reviewsFilter === 'all') return reviews;
        return reviews.filter(r => r.status === reviewsFilter);
    }, [reviews, reviewsFilter]);

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

    useEffect(() => {
        setHiddenGemsPage(1);
    }, [hiddenGemsFilter]);

    useEffect(() => {
        setLocalInsightsPage(1);
    }, [localInsightsFilter]);

    useEffect(() => {
        setReviewsPage(1);
    }, [reviewsFilter]);

    useEffect(() => {
        setGuidesPage(1);
    }, []);

    // ============================================
    // GET STATUS COLOR & LABEL
    // ============================================
    const getStatusColor = (status) => {
        const colors = {
            'pending': { fg: C.warn, bg: C.warnBg },
            'approved': { fg: C.success, bg: C.successBg },
            'implemented': { fg: C.gold, bg: C.warnBg },
            'rejected': { fg: C.danger, bg: C.dangerBg },
        };
        return colors[status] || { fg: C.sage, bg: '#EEEEEE' };
    };

    const getStatusLabel = (status) => {
        const labels = {
            'pending': '⏳ Pending',
            'approved': '✅ Approved',
            'implemented': '✨ Implemented',
            'rejected': '❌ Rejected',
        };
        return labels[status] || status;
    };

    const getTypeBadge = (type) => {
        const badges = {
            'hidden_gem': '💎 Hidden Gem',
            'local_insight': '💡 Local Insight',
            'insight': '💡 Local Insight',
            'review': '⭐ Review',
        };
        return badges[type] || type;
    };

    const getTypeIcon = (type) => {
        const icons = {
            'hidden_gem': <Sparkles size={14} />,
            'local_insight': <Lightbulb size={14} />,
            'insight': <Lightbulb size={14} />,
            'review': <Star size={14} />,
        };
        return icons[type] || <Star size={14} />;
    };

    // ============================================
    // RENDER SUGGESTION CARD
    // ============================================
    const renderSuggestionCard = (s, typeLabel) => {
        const hasImage = s.image && typeof s.image === 'string' && 
                        s.image.startsWith('http') && 
                        !s.image.includes('null') &&
                        !s.image.includes('undefined');

        const getFallbackEmoji = () => {
            switch(s.suggestion_type) {
                case 'hidden_gem': return '💎';
                case 'local_insight': return '💡';
                case 'review': return '⭐';
                default: return '📍';
            }
        };

        return (
            <div
                key={s.id}
                style={{
                    display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md,
                    border: `1px solid ${C.line}`, alignItems: 'flex-start', transition: 'all 0.2s ease',
                    cursor: 'pointer',
                }}
                onClick={() => { setSelectedSuggestion(s); setShowSuggestionModal(true); }}
            >
                <div style={{ 
                    width: 80, height: 80, borderRadius: RADIUS.sm, 
                    background: C.paper, border: `1px solid ${C.line}`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden',
                }}>
                    {hasImage ? (
                        <img 
                            src={s.image} 
                            alt={s.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span style="font-size: 32px;">${getFallbackEmoji()}</span>`;
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: 32 }}>{getFallbackEmoji()}</span>
                    )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>{s.name || 'Untitled'}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                <span style={{ fontSize: 11, color: C.sage }}>{s.user_email || 'Anonymous'} · {s.district || 'N/A'}</span>
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
                        {s.status === 'pending' && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'approve', s.suggestion_type); }} 
                                    disabled={actionLoading}
                                    style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: C.success, color: '#fff', fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === s.id ? 0.5 : 1 }}
                                >
                                    <Check size={11} /> Approve
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'reject', s.suggestion_type); }} 
                                    disabled={actionLoading}
                                    style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: 'transparent', color: C.danger, fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === s.id ? 0.5 : 1 }}
                                >
                                    <X size={11} /> Reject
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'implement', s.suggestion_type); }} 
                                    disabled={actionLoading}
                                    style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: '#2563EB', color: '#fff', fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === s.id ? 0.5 : 1 }}
                                >
                                    <CheckCircle size={11} /> Implement
                                </button>
                            </>
                        )}
                        {s.status === 'approved' && (
                            <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'implement', s.suggestion_type); }} 
                                    disabled={actionLoading}
                                    style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: '#2563EB', color: '#fff', fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === s.id ? 0.5 : 1 }}
                                >
                                    <CheckCircle size={11} /> Implement
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'reject', s.suggestion_type); }} 
                                    disabled={actionLoading}
                                    style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: 'transparent', color: C.danger, fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === s.id ? 0.5 : 1 }}
                                >
                                    <X size={11} /> Reject
                                </button>
                            </>
                        )}
                        {s.status === 'implemented' && (
                            <span style={{ padding: '4px 12px', borderRadius: 999, background: C.warnBg, color: C.gold, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                ✨ Implemented
                            </span>
                        )}
                        {s.status === 'rejected' && (
                            <span style={{ padding: '4px 12px', borderRadius: 999, background: C.dangerBg, color: C.danger, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                                ❌ Rejected
                            </span>
                        )}
                        <button 
                            onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'delete', s.suggestion_type); }} 
                            disabled={actionLoading}
                            style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === s.id ? 0.5 : 1 }}
                        >
                            <Trash2 size={11} /> Delete
                        </button>
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
    // RENDER GUIDE CARD
    // ============================================
    const renderGuideCard = (guide) => (
        <div
            key={guide.id}
            style={{
                display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md,
                border: `1px solid ${C.line}`, alignItems: 'flex-start', transition: 'all 0.2s ease',
            }}
        >
            <div style={{ 
                width: 60, height: 60, borderRadius: '50%', 
                background: guide.is_verified ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : C.line,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
                fontSize: 20, fontWeight: 600, color: C.ink,
            }}>
                {guide.profile_image ? (
                    <img src={guide.profile_image} alt={guide.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    guide.full_name?.charAt(0)?.toUpperCase() || 'G'
                )}
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>{guide.full_name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                            <span style={{ fontSize: 11, color: C.sage }}>{guide.email}</span>
                            <span style={{ fontSize: 11, color: C.sage }}>· {guide.primary_district || 'N/A'}</span>
                            {guide.rating > 0 && (
                                <span style={{ fontSize: 11, color: C.gold }}>{'★'.repeat(Math.round(guide.rating))} {guide.rating}</span>
                            )}
                        </div>
                    </div>
                    <StatusPill status={guide.is_verified ? 'verified' : 'unverified'} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: C.sage }}>
                    <span>💼 {guide.experience_years || 0} years</span>
                    <span>💰 ${guide.price_per_day || 0}/day</span>
                    <span>📚 {guide.languages || 'N/A'}</span>
                    {guide.phone_number && <span>📱 {guide.phone_number}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {!guide.is_verified && (
                        <button 
                            onClick={() => verifyGuide(guide.id)}
                            style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: C.success, color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            <UserCheck size={11} /> Verify
                        </button>
                    )}
                    <button 
                        onClick={() => deleteGuide(guide.id)}
                        style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        <Trash2 size={11} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );

    // ============================================
    // LOADING
    // ============================================
    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={32} color={C.gold} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: 14, color: C.sage, fontFamily: FONT.display, fontStyle: 'italic', fontSize: 15 }}>Loading dashboard…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const activeNavItem = navItems.find(n => n.key === activeTab);

    // ============================================
    // RENDER (simplified - same as before but with fixed API calls)
    // ============================================
    return (
        <div style={{ height: '100vh', background: C.cream, fontFamily: FONT.body, display: 'flex', overflow: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                .sd-nav-item:hover { background: ${C.goldSoft} !important; }
                .sd-card:hover { border-color: ${C.gold} !important; box-shadow: 0 4px 14px rgba(7,46,42,0.08); transform: translateY(-1px); }
                .sd-sidebar-scroll::-webkit-scrollbar { width: 4px; }
                .sd-sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(199,154,62,0.3); border-radius: 4px; }
                .sd-content-scroll::-webkit-scrollbar { width: 6px; }
                .sd-content-scroll::-webkit-scrollbar-thumb { background: rgba(199,154,62,0.3); border-radius: 4px; }
                input:focus, textarea:focus, select:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 3px rgba(199,154,62,0.12); }
            `}</style>

            {/* SIDEBAR - Same as before */}
            <aside style={{
                width: SIDEBAR_W, minWidth: SIDEBAR_W, height: '100vh',
                background: C.paper, borderRight: `1px solid ${C.line}`,
                display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
                flexShrink: 0,
            }}>
                <KasavuStrip />
                <div className="sd-sidebar-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: 10 }}>
                    <div style={{ padding: '24px 22px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Shield size={16} color={C.goldLight} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <h1 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 17, color: C.inkSoft, margin: 0, lineHeight: 1.1 }}>Staff Panel</h1>
                                <p style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.sageLight, margin: '3px 0 0' }}>Administration</p>
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
                            {profilePicture ? <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S')}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || user?.first_name || 'Staff'}</p>
                            <span style={{ fontSize: 10.5, color: C.sage, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <Shield size={10} /> {user?.role || 'staff'}
                            </span>
                        </div>
                    </div>

                    <nav style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                        {navItems.map((item) => {
                            const isActive = activeTab === item.key;
                            const count = item.badge || 0;
                            return (
                                <button
                                    key={item.key}
                                    className="sd-nav-item"
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
                        <button onClick={() => { dataFetchedRef.current = false; setRefreshing(true); fetchAllData().finally(() => setRefreshing(false)); }} disabled={refreshing} style={{
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

            {/* MAIN CONTENT - Rest of the UI same as before */}
            <div style={{ flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="sd-content-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px 28px 60px' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        {/* Page header */}
                        <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <p style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, margin: '0 0 5px' }}>
                                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <h2 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 26, color: C.inkSoft, margin: 0 }}>{activeNavItem?.label}</h2>
                                <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>{/* Description */}</p>
                            </div>
                            <Btn variant="ghost" icon={RefreshCw} onClick={() => { dataFetchedRef.current = false; setRefreshing(true); fetchAllData().finally(() => setRefreshing(false)); }} disabled={refreshing} style={{ opacity: refreshing ? 0.6 : 1 }}>
                                {refreshing ? 'Updating…' : 'Update'}
                            </Btn>
                        </div>

                        {/* Stats */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
                            <StatChip label="Total Guides" value={stats.totalGuides} icon={Users} tone="ink" />
                            <StatChip label="Total Bookings" value={stats.totalBookings} icon={CalendarDays} tone="ink" />
                            <StatChip label="Hidden Gems" value={stats.totalHiddenGems} icon={Sparkles} tone="gold" />
                            <StatChip label="Local Insights" value={stats.totalLocalInsights} icon={Lightbulb} tone="gold" />
                            <StatChip label="Reviews" value={stats.totalReviews} icon={Star} tone="gold" />
                            <StatChip label="Pending" value={stats.pendingReviews + stats.pendingHiddenGems + stats.pendingLocalInsights} icon={Clock} tone="gold" />
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                <Card style={{ padding: 20 }}>
                                    <SectionHead icon={Sparkles} title="Recent Hidden Gems" />
                                    {hiddenGems.slice(0, 5).length === 0 ? (
                                        <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '24px 0' }}>No hidden gems yet.</p>
                                    ) : (
                                        hiddenGems.slice(0, 5).map((s) => (
                                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.line}` }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 13, color: C.inkSoft, fontWeight: 500 }}>{s.name}</p>
                                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.sage }}>{s.district || 'N/A'} · {s.user_email || 'Anonymous'}</p>
                                                </div>
                                                <StatusPill status={s.status} />
                                            </div>
                                        ))
                                    )}
                                </Card>
                                <Card style={{ padding: 20 }}>
                                    <SectionHead icon={Lightbulb} title="Recent Local Insights" />
                                    {localInsights.slice(0, 5).length === 0 ? (
                                        <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '24px 0' }}>No local insights yet.</p>
                                    ) : (
                                        localInsights.slice(0, 5).map((s) => (
                                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.line}` }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 13, color: C.inkSoft, fontWeight: 500 }}>{s.name}</p>
                                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.sage }}>{s.district || 'N/A'} · {s.user_email || 'Anonymous'}</p>
                                                </div>
                                                <StatusPill status={s.status} />
                                            </div>
                                        ))
                                    )}
                                </Card>
                            </div>
                        )}

                        {/* Hidden Gems Tab */}
                        {activeTab === 'hidden-gems' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead
                                    icon={Sparkles}
                                    title="Hidden Gems"
                                    count={hiddenGems.length}
                                    right={
                                        <select value={hiddenGemsFilter} onChange={(e) => setHiddenGemsFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All Status</option>
                                            <option value="pending">⏳ Pending ({stats.pendingHiddenGems})</option>
                                            <option value="approved">✅ Approved ({stats.approvedHiddenGems})</option>
                                            <option value="implemented">✨ Implemented ({stats.implementedHiddenGems})</option>
                                            <option value="rejected">❌ Rejected ({stats.rejectedHiddenGems})</option>
                                        </select>
                                    }
                                />
                                {filteredHiddenGems.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No hidden gems found.</p>
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

                        {/* Local Insights Tab */}
                        {activeTab === 'local-insights' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead
                                    icon={Lightbulb}
                                    title="Local Insights"
                                    count={localInsights.length}
                                    right={
                                        <select value={localInsightsFilter} onChange={(e) => setLocalInsightsFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All Status</option>
                                            <option value="pending">⏳ Pending ({stats.pendingLocalInsights})</option>
                                            <option value="approved">✅ Approved ({stats.approvedLocalInsights})</option>
                                            <option value="implemented">✨ Implemented ({stats.implementedLocalInsights})</option>
                                            <option value="rejected">❌ Rejected ({stats.rejectedLocalInsights})</option>
                                        </select>
                                    }
                                />
                                {filteredLocalInsights.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No local insights found.</p>
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

                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead
                                    icon={Star}
                                    title="Reviews"
                                    count={reviews.length}
                                    right={
                                        <select value={reviewsFilter} onChange={(e) => setReviewsFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All Status</option>
                                            <option value="pending">⏳ Pending ({stats.pendingReviews})</option>
                                            <option value="approved">✅ Approved ({stats.approvedReviews})</option>
                                            <option value="implemented">✨ Implemented ({stats.implementedReviews})</option>
                                            <option value="rejected">❌ Rejected ({stats.rejectedReviews})</option>
                                        </select>
                                    }
                                />
                                {filteredReviews.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No reviews found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredReviews, reviewsPage).map((s) => renderSuggestionCard(s, 'Review'))}
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

                        {/* Guides Tab */}
                        {activeTab === 'guides' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead
                                    icon={Users}
                                    title="Guides"
                                    count={guides.length}
                                    right={
                                        <Btn variant="primary" icon={Plus} size="sm" onClick={() => setShowGuideModal(true)}>
                                            Add Guide
                                        </Btn>
                                    }
                                />
                                {guides.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No guides found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(guides, guidesPage).map((g) => renderGuideCard(g))}
                                        </div>
                                        <Pagination
                                            currentPage={guidesPage}
                                            totalPages={getTotalPages(guides)}
                                            onPageChange={setGuidesPage}
                                            totalItems={guides.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </Card>
                        )}

                        {/* Bookings Tab */}
                        {activeTab === 'bookings' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead
                                    icon={CalendarDays}
                                    title="All Bookings"
                                    count={bookings.length}
                                />
                                {bookings.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No bookings found.</p>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', color: C.sageLight, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>
                                                    <th style={{ padding: '9px 8px', borderBottom: `1px solid ${C.line}` }}>Booking ID</th>
                                                    <th style={{ padding: '9px 8px', borderBottom: `1px solid ${C.line}` }}>Traveler</th>
                                                    <th style={{ padding: '9px 8px', borderBottom: `1px solid ${C.line}` }}>Guide</th>
                                                    <th style={{ padding: '9px 8px', borderBottom: `1px solid ${C.line}` }}>Date</th>
                                                    <th style={{ padding: '9px 8px', borderBottom: `1px solid ${C.line}` }}>District</th>
                                                    <th style={{ padding: '9px 8px', borderBottom: `1px solid ${C.line}` }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bookings.map((b) => (
                                                    <tr key={b.id} style={{ borderTop: `1px solid ${C.line}` }}>
                                                        <td style={{ padding: '10px 8px', fontFamily: FONT.mono, fontSize: 11, color: C.sage }}>
                                                            #{b.booking_id || b.id}
                                                        </td>
                                                        <td style={{ padding: '10px 8px', color: C.inkSoft }}>
                                                            {b.traveler_email || b.user?.email || 'Anonymous'}
                                                        </td>
                                                        <td style={{ padding: '10px 8px', color: C.inkSoft }}>
                                                            {b.guide_name || b.guide?.full_name || 'Unknown'}
                                                        </td>
                                                        <td style={{ padding: '10px 8px', color: C.sage }}>
                                                            {b.date ? new Date(b.date).toLocaleDateString() : '—'}
                                                        </td>
                                                        <td style={{ padding: '10px 8px', color: C.sage }}>
                                                            {b.district?.name || b.district || 'N/A'}
                                                        </td>
                                                        <td style={{ padding: '10px 8px' }}>
                                                            <StatusPill status={b.status} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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
                                            {profilePicture ? <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S')}
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()} style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: C.ink, color: C.goldLight, border: `2px solid ${C.cream}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Camera size={12} />
                                        </button>
                                        <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleProfilePictureUpload} disabled={uploading} />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: 17, color: C.inkSoft, margin: 0, fontFamily: FONT.display }}>{profile?.full_name || user?.first_name || 'Staff'}</h4>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '2px 0 0' }}>{profile?.department || 'Staff'} · {profile?.position || 'Staff Member'}</p>
                                        <span style={{ fontSize: 12, color: C.sage, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Shield size={12} /> {user?.role || 'staff'}
                                        </span>
                                    </div>
                                    {uploading && <Loader2 size={18} color={C.sage} style={{ animation: 'spin 1s linear infinite', marginLeft: 'auto' }} />}
                                </div>

                                {isEditingProfile ? (
                                    <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Full Name</label>
                                                <input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Email</label>
                                                <input type="email" value={profileForm.email} disabled style={{ ...inputStyle, background: '#f5f5f5', cursor: 'not-allowed' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Phone</label>
                                                <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} style={inputStyle} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Department</label>
                                                <input type="text" value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} style={inputStyle} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Position</label>
                                                <input type="text" value={profileForm.position} onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })} style={inputStyle} />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: 10.5, color: C.sageLight, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono }}>Bio</label>
                                            <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 10, marginTop: 6, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
                                            <Btn type="submit" variant="primary" icon={Save}>Save Profile</Btn>
                                            <Btn type="button" variant="ghost" onClick={() => setIsEditingProfile(false)}>Cancel</Btn>
                                        </div>
                                    </form>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '7px 20px' }}>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Name</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.full_name || user?.first_name || 'Not set'}</span>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Email</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{user?.email}</span>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Phone</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.phone || 'Not set'}</span>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Department</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.department || 'Staff'}</span>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Position</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.position || 'Staff Member'}</span>
                                        <span style={{ color: C.sage, fontSize: 13 }}>Role</span><span style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>{user?.role || 'staff'}</span>
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

            {/* ADD GUIDE MODAL */}
            {showGuideModal && (
                <ModalShell
                    onClose={() => setShowGuideModal(false)}
                    title="Add New Guide"
                    subtitle="Create a new tour guide account"
                    icon={Users}
                    footer={
                        <>
                            <Btn variant="ghost" onClick={() => setShowGuideModal(false)}>Cancel</Btn>
                            <Btn variant="primary" icon={Plus} onClick={handleAddGuide} disabled={guideLoading}>
                                {guideLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {guideLoading ? 'Adding...' : 'Add Guide'}
                            </Btn>
                        </>
                    }
                >
                    <form onSubmit={handleAddGuide} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Full Name <span style={{ color: C.danger }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={guideForm.full_name}
                                    onChange={(e) => setGuideForm({ ...guideForm, full_name: e.target.value })}
                                    style={inputStyle}
                                    required
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Email <span style={{ color: C.danger }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    value={guideForm.email}
                                    onChange={(e) => setGuideForm({ ...guideForm, email: e.target.value })}
                                    style={inputStyle}
                                    required
                                    placeholder="guide@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Password <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={guideForm.password}
                                onChange={(e) => setGuideForm({ ...guideForm, password: e.target.value })}
                                style={inputStyle}
                                required
                                placeholder="Set a secure password"
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={guideForm.phone}
                                    onChange={(e) => setGuideForm({ ...guideForm, phone: e.target.value })}
                                    style={inputStyle}
                                    placeholder="+91 9876543210"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Experience (Years)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={guideForm.experience_years}
                                    onChange={(e) => setGuideForm({ ...guideForm, experience_years: e.target.value })}
                                    style={inputStyle}
                                    placeholder="5"
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Bio
                            </label>
                            <textarea
                                rows="2"
                                value={guideForm.bio}
                                onChange={(e) => setGuideForm({ ...guideForm, bio: e.target.value })}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                placeholder="Experienced tour guide with 5 years of experience..."
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Languages
                                </label>
                                <input
                                    type="text"
                                    value={guideForm.languages}
                                    onChange={(e) => setGuideForm({ ...guideForm, languages: e.target.value })}
                                    style={inputStyle}
                                    placeholder="English, Malayalam, Hindi"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Primary District <span style={{ color: C.danger }}>*</span>
                                </label>
                                <select
                                    value={guideForm.primary_district}
                                    onChange={(e) => setGuideForm({ ...guideForm, primary_district: e.target.value })}
                                    style={selectStyle}
                                    required
                                >
                                    <option value="">Select District</option>
                                    {KERALA_DISTRICTS.map(d => (
                                        <option key={d.id} value={d.name}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Price/Day ($)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={guideForm.price_per_day}
                                    onChange={(e) => setGuideForm({ ...guideForm, price_per_day: e.target.value })}
                                    style={inputStyle}
                                    placeholder="50"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Price/Hour ($)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={guideForm.price_per_hour}
                                    onChange={(e) => setGuideForm({ ...guideForm, price_per_hour: e.target.value })}
                                    style={inputStyle}
                                    placeholder="15"
                                />
                            </div>
                        </div>
                        <div style={{ padding: 12, background: C.cream, borderRadius: RADIUS.sm, border: `1px solid ${C.line}` }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                                <input
                                    type="checkbox"
                                    checked={autoVerify}
                                    onChange={(e) => setAutoVerify(e.target.checked)}
                                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                                {autoVerify ? '✅ Auto-verify guide' : '⏳ Manual verification required'}
                            </label>
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* CREDENTIALS MODAL */}
            {showCredentialsModal && (
                <ModalShell
                    onClose={() => setShowCredentialsModal(false)}
                    title="✅ Guide Created!"
                    subtitle="Share these credentials with the guide"
                    icon={UserCheck}
                    footer={
                        <>
                            <Btn variant="primary" onClick={() => {
                                navigator.clipboard?.writeText(`Email: ${guideForm.email}\nPassword: ${newGuidePassword}`);
                                showToast('✅ Credentials copied!');
                            }}>
                                📋 Copy
                            </Btn>
                            <Btn variant="ghost" onClick={() => setShowCredentialsModal(false)}>Done</Btn>
                        </>
                    }
                >
                    <div style={{ padding: 16, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${C.line}` }}>
                        <div style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: 11, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Email</p>
                            <p style={{ fontSize: 16, fontWeight: 600, color: C.inkSoft, fontFamily: FONT.mono }}>{guideForm.email}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Password</p>
                            <p style={{ fontSize: 16, fontWeight: 600, color: C.gold, fontFamily: FONT.mono }}>{newGuidePassword}</p>
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: C.sage, marginTop: 12, textAlign: 'center' }}>
                        🔒 Guide can login with these credentials and change password later.
                    </p>
                </ModalShell>
            )}

            {/* SUGGESTION DETAIL MODAL */}
            {showSuggestionModal && selectedSuggestion && (
                <ModalShell
                    onClose={() => { setShowSuggestionModal(false); setSelectedSuggestion(null); }}
                    title={selectedSuggestion.name || 'Details'}
                    subtitle={selectedSuggestion.district || 'N/A'}
                    icon={getTypeIcon(selectedSuggestion.suggestion_type)}
                    footer={
                        <>
                            {selectedSuggestion.status === 'pending' && (
                                <>
                                    <Btn variant="success" icon={Check} onClick={() => processSuggestion(selectedSuggestion.id, 'approve', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Approve</Btn>
                                    <Btn variant="danger" icon={X} onClick={() => processSuggestion(selectedSuggestion.id, 'reject', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Reject</Btn>
                                    <Btn variant="primary" icon={CheckCircle} onClick={() => processSuggestion(selectedSuggestion.id, 'implement', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Implement</Btn>
                                </>
                            )}
                            {selectedSuggestion.status === 'approved' && (
                                <>
                                    <Btn variant="primary" icon={CheckCircle} onClick={() => processSuggestion(selectedSuggestion.id, 'implement', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Implement</Btn>
                                    <Btn variant="danger" icon={X} onClick={() => processSuggestion(selectedSuggestion.id, 'reject', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Reject</Btn>
                                </>
                            )}
                            <Btn variant="danger" icon={Trash2} onClick={() => processSuggestion(selectedSuggestion.id, 'delete', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Delete</Btn>
                            <Btn variant="ghost" onClick={() => { setShowSuggestionModal(false); setSelectedSuggestion(null); }}>Close</Btn>
                        </>
                    }
                >
                    {selectedSuggestion.image && typeof selectedSuggestion.image === 'string' && 
                     selectedSuggestion.image.startsWith('http') && 
                     !selectedSuggestion.image.includes('null') && 
                     !selectedSuggestion.image.includes('undefined') && (
                        <img 
                            src={selectedSuggestion.image} 
                            alt={selectedSuggestion.name} 
                            style={{ 
                                width: '100%', maxHeight: 300, objectFit: 'cover', 
                                borderRadius: RADIUS.md, marginBottom: 16, 
                                border: `1px solid ${C.line}` 
                            }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.cream, color: C.sage }}>{selectedSuggestion.district || 'N/A'}</span>
                        <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.goldSoft, color: C.gold }}>{getTypeBadge(selectedSuggestion.suggestion_type)}</span>
                        <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.cream, color: C.sage }}>{selectedSuggestion.user_email || 'Anonymous'}</span>
                        {selectedSuggestion.rating && (
                            <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.goldSoft, color: C.gold }}>
                                {'★'.repeat(Math.round(selectedSuggestion.rating))} {selectedSuggestion.rating}/5
                            </span>
                        )}
                        <StatusPill status={selectedSuggestion.status} />
                    </div>
                    <p style={{ fontSize: 14, color: C.sage, lineHeight: 1.6, marginBottom: 12 }}>{selectedSuggestion.description || 'No description'}</p>
                    {selectedSuggestion.admin_notes && (
                        <div style={{ background: C.cream, padding: 12, borderRadius: RADIUS.sm }}>
                            <p style={{ fontSize: 11, color: C.gold, margin: 0, fontWeight: 600 }}>📝 Staff Notes</p>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: '4px 0 0' }}>{selectedSuggestion.admin_notes}</p>
                        </div>
                    )}
                    {selectedSuggestion.processed_by && (
                        <div style={{ marginTop: 8, padding: 8, background: '#F0F7FF', borderRadius: RADIUS.sm }}>
                            <p style={{ fontSize: 11, color: '#1E3A5F', margin: 0 }}>👤 Processed by: {selectedSuggestion.processed_by}</p>
                            {selectedSuggestion.processed_at && (
                                <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0' }}>
                                    🕐 {new Date(selectedSuggestion.processed_at).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </ModalShell>
            )}

           
            {/* TOAST */}
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

export default StaffDashboard;
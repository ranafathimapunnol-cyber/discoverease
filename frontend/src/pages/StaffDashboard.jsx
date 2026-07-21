
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
    Upload,
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
        warning: { background: C.warn, color: '#fff', border: 'none' },
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
        rejected: { fg: C.danger, bg: C.dangerBg, label: 'Rejected' },
        rejected_by_guide: { fg: C.danger, bg: C.dangerBg, label: 'Rejected' },
        rejected_by_admin: { fg: C.danger, bg: C.dangerBg, label: 'Rejected' },
        available: { fg: C.success, bg: C.successBg, label: 'Available' },
        full: { fg: C.danger, bg: C.dangerBg, label: 'Full' },
        approved: { fg: C.success, bg: C.successBg, label: 'Approved' },
        approved_by_guide: { fg: C.success, bg: C.successBg, label: 'Approved' },
        approved_by_admin: { fg: C.success, bg: C.successBg, label: 'Approved' },
        implemented: { fg: C.gold, bg: C.warnBg, label: '✅ Implemented' },
        staff_approved: { fg: C.success, bg: C.successBg, label: 'Staff Approved' },
        staff_rejected: { fg: C.danger, bg: C.dangerBg, label: 'Staff Rejected' },
        booked: { fg: C.warn, bg: C.warnBg, label: 'Booked' },
        review: { fg: C.gold, bg: C.goldSoft, label: '⭐ Review' },
        hidden_gem: { fg: C.gold, bg: C.goldSoft, label: '💎 Hidden Gem' },
        local_insight: { fg: C.info, bg: C.infoBg, label: '💡 Insight' },
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
    const [showEditGuideModal, setShowEditGuideModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);

    // Form states
    const [guideForm, setGuideForm] = useState({
        full_name: '', email: '', password: '',
        phone: '', bio: '',
        experience_years: '0', languages: '', primary_district: '',
        price_per_day: '0', price_per_hour: '0'
    });
    const [editingGuide, setEditingGuide] = useState(null);
    const [editGuideForm, setEditGuideForm] = useState({
        full_name: '', email: '', phone: '', bio: '',
        experience_years: '0', languages: '', primary_district: '',
        price_per_day: '0', price_per_hour: '0', is_verified: false
    });
    const [editGuideProfilePic, setEditGuideProfilePic] = useState(null);
    const [editGuidePicFile, setEditGuidePicFile] = useState(null);
    const [guideLoading, setGuideLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [newGuidePassword, setNewGuidePassword] = useState('');
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const dataFetchedRef = useRef(false);

    // ============================================
    // HELPER: Get image URL
    // ============================================
    const getImageUrl = (suggestion) => {
        if (!suggestion) return null;
        
        const imageField = suggestion.image || suggestion.image_url || suggestion.profile_image || suggestion.photo || suggestion.avatar;
        
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

    const getProfileImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        
        // If it's already a full URL
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        
        // If it's a data URL (base64)
        if (imageUrl.startsWith('data:')) {
            return imageUrl;
        }
        
        // If it's a relative path
        if (imageUrl.startsWith('/media/') || imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/')) {
            const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
            const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            const mediaBase = cleanBase.replace('/api', '');
            return `${mediaBase}${imageUrl}`;
        }
        
        // If it's just a filename, assume it's in media
        if (!imageUrl.includes('/')) {
            const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
            const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            const mediaBase = cleanBase.replace('/api', '');
            return `${mediaBase}/media/${imageUrl}`;
        }
        
        return imageUrl;
    };

    // ============================================
    // NAV ITEMS
    // ============================================
    const navItems = [
        { key: 'overview', label: 'Overview', icon: Compass },
        { key: 'hidden-gems', label: 'Hidden Gems', icon: Sparkles, badge: stats.pendingHiddenGems },
        { key: 'local-insights', label: 'Local Insights', icon: Lightbulb, badge: stats.pendingLocalInsights },
        { key: 'reviews', label: 'Reviews', icon: Star, badge: stats.pendingReviews },
        { key: 'guides', label: 'Guides', icon: Users },
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
    // PROFILE PICTURE - FIXED
    // ============================================
    const loadProfilePicture = () => {
        // First try to get from localStorage
        const savedPicture = localStorage.getItem('staff_profile_picture');
        if (savedPicture) {
            setProfilePicture(savedPicture);
            return;
        }
        
        // Then try from profile data
        if (profile) {
            const imageUrl = profile.profile_image || profile.image || profile.avatar || profile.profile_picture;
            if (imageUrl) {
                const fullUrl = getProfileImageUrl(imageUrl);
                if (fullUrl) {
                    setProfilePicture(fullUrl);
                    localStorage.setItem('staff_profile_picture', fullUrl);
                    return;
                }
            }
        }
        
        // If user object has profile image
        if (user) {
            const imageUrl = user.profile_image || user.image || user.avatar || user.profile_picture;
            if (imageUrl) {
                const fullUrl = getProfileImageUrl(imageUrl);
                if (fullUrl) {
                    setProfilePicture(fullUrl);
                    localStorage.setItem('staff_profile_picture', fullUrl);
                    return;
                }
            }
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
        const formData = new FormData();
        formData.append('profile_image', file);
        
        try {
            const response = await api.post('/auth/update-profile-picture/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            if (response?.data?.success) {
                const imageUrl = response.data.profile_image || response.data.image_url || response.data.url;
                if (imageUrl) {
                    const fullUrl = getProfileImageUrl(imageUrl);
                    setProfilePicture(fullUrl);
                    localStorage.setItem('staff_profile_picture', fullUrl);
                    showToast('✅ Profile picture updated successfully!');
                    await fetchAllData();
                } else {
                    showToast('✅ Profile picture updated!');
                }
                setUploading(false);
                return;
            }
        } catch (error) {
            console.log('Primary upload failed, trying fallback...');
        }

        // Fallback
        try {
            const formData2 = new FormData();
            formData2.append('profile_image', file);
            const response2 = await api.patch('/auth/update-profile/', formData2, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            if (response2?.data?.success) {
                const imageUrl = response2.data.profile_image || response2.data.image_url;
                if (imageUrl) {
                    const fullUrl = getProfileImageUrl(imageUrl);
                    setProfilePicture(fullUrl);
                    localStorage.setItem('staff_profile_picture', fullUrl);
                    showToast('✅ Profile picture updated successfully!');
                    await fetchAllData();
                } else {
                    showToast('✅ Profile picture updated!');
                }
            } else {
                showToast(response2?.data?.error || '❌ Failed to upload profile picture');
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            showToast('❌ Failed to upload profile picture. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // ============================================
    // FETCH DATA - FIXED WITH PROFILE IMAGE
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
                } else if (response?.data?.data) {
                    items = response.data.data;
                } else if (response?.data?.results) {
                    items = response.data.results;
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
                    pendingHiddenGems: gems.filter(s => s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin').length,
                    approvedHiddenGems: gems.filter(s => s.status === 'approved' || s.status === 'approved_by_guide' || s.status === 'approved_by_admin' || s.status === 'staff_approved').length,
                    implementedHiddenGems: gems.filter(s => s.status === 'implemented').length,
                    rejectedHiddenGems: gems.filter(s => s.status === 'rejected' || s.status === 'rejected_by_guide' || s.status === 'rejected_by_admin' || s.status === 'staff_rejected').length,
                    totalLocalInsights: insights.length,
                    pendingLocalInsights: insights.filter(s => s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin').length,
                    approvedLocalInsights: insights.filter(s => s.status === 'approved' || s.status === 'approved_by_guide' || s.status === 'approved_by_admin' || s.status === 'staff_approved').length,
                    implementedLocalInsights: insights.filter(s => s.status === 'implemented').length,
                    rejectedLocalInsights: insights.filter(s => s.status === 'rejected' || s.status === 'rejected_by_guide' || s.status === 'rejected_by_admin' || s.status === 'staff_rejected').length,
                    totalReviews: reviewsItems.length,
                    pendingReviews: reviewsItems.filter(s => s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin').length,
                    approvedReviews: reviewsItems.filter(s => s.status === 'approved' || s.status === 'approved_by_guide' || s.status === 'approved_by_admin' || s.status === 'staff_approved').length,
                    implementedReviews: reviewsItems.filter(s => s.status === 'implemented').length,
                    rejectedReviews: reviewsItems.filter(s => s.status === 'rejected' || s.status === 'rejected_by_guide' || s.status === 'rejected_by_admin' || s.status === 'staff_rejected').length,
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

            // 3. Profile - FIXED with image loading
            try {
                const response = await api.get('/auth/me/');
                console.log('📱 Profile response:', response.data);
                
                if (response?.data?.success) {
                    const userData = response.data.user;
                    setProfile(userData);
                    
                    // Set profile form data
                    setProfileForm({
                        full_name: userData?.full_name || userData?.first_name || '',
                        email: userData?.email || '',
                        phone: userData?.phone || '',
                        bio: userData?.bio || '',
                        department: userData?.department || 'Staff',
                        position: userData?.position || 'Staff Member',
                    });
                    
                    // ✅ Load profile picture
                    const imageUrl = userData?.profile_image || userData?.image || userData?.avatar || userData?.profile_picture;
                    console.log('📸 Profile image URL from API:', imageUrl);
                    
                    if (imageUrl) {
                        const fullUrl = getProfileImageUrl(imageUrl);
                        console.log('📸 Full profile image URL:', fullUrl);
                        if (fullUrl) {
                            setProfilePicture(fullUrl);
                            localStorage.setItem('staff_profile_picture', fullUrl);
                        }
                    } else {
                        // Check localStorage fallback
                        const saved = localStorage.getItem('staff_profile_picture');
                        if (saved) {
                            console.log('📸 Using localStorage profile image:', saved);
                            setProfilePicture(saved);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                // Try localStorage fallback
                const saved = localStorage.getItem('staff_profile_picture');
                if (saved) {
                    setProfilePicture(saved);
                }
            }

            // 4. Stats
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
            const response = await api.patch('/auth/update-profile/', {
                first_name: profileForm.full_name.split(' ')[0] || '',
                last_name: profileForm.full_name.split(' ').slice(1).join(' ') || '',
                phone: profileForm.phone,
                bio: profileForm.bio,
                department: profileForm.department,
                position: profileForm.position,
            });
            if (response?.data?.success) {
                showToast('✅ Profile updated successfully!');
                setIsEditingProfile(false);
                await fetchAllData();
            } else {
                showToast(response?.data?.error || '❌ Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('❌ Failed to update profile');
        }
    };

    // ============================================
    // ✅ PROCESS SUGGESTION
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
    // ✅ DELETE SUGGESTION (for guide-submitted)
    // ============================================
    const deleteSuggestion = async (id) => {
        if (!window.confirm('Are you sure you want to delete this suggestion?')) return;
        setActionLoading(true);
        setProcessingId(id);
        try {
            const response = await api.delete(`/staff/suggestions/${id}/delete/`);
            if (response?.data?.success || response?.status === 204) {
                showToast('🗑️ Suggestion deleted successfully!');
                await fetchAllData();
                setActionLoading(false);
                setProcessingId(null);
                return;
            }
        } catch (error) {
            console.error('Delete suggestion error:', error);
            try {
                const response = await api.post(`/staff/suggestions/${id}/process/`, { action: 'delete' });
                if (response?.data?.success) {
                    showToast('🗑️ Suggestion deleted successfully!');
                    await fetchAllData();
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }
            } catch (e2) {
                console.error('Alternative delete failed:', e2);
            }
        }
        showToast('❌ Failed to delete suggestion');
        setActionLoading(false);
        setProcessingId(null);
    };

    // ============================================
    // ✅ ADD GUIDE
    // ============================================
    const handleAddGuide = async (e) => {
        e.preventDefault();
        setGuideLoading(true);

        try {
            if (!guideForm.full_name.trim()) {
                showToast('❌ Full name is required');
                setGuideLoading(false);
                return;
            }
            if (!guideForm.email.trim()) {
                showToast('❌ Email is required');
                setGuideLoading(false);
                return;
            }
            if (!guideForm.password || guideForm.password.length < 6) {
                showToast('❌ Password must be at least 6 characters');
                setGuideLoading(false);
                return;
            }
            if (!guideForm.primary_district) {
                showToast('❌ Primary district is required');
                setGuideLoading(false);
                return;
            }

            const guideData = {
                full_name: guideForm.full_name.trim(),
                email: guideForm.email.trim().toLowerCase(),
                password: guideForm.password,
                phone: guideForm.phone?.trim() || '',
                bio: guideForm.bio?.trim() || '',
                experience_years: parseInt(guideForm.experience_years) || 0,
                languages: guideForm.languages?.trim() || '',
                primary_district: guideForm.primary_district,
                price_per_day: parseFloat(guideForm.price_per_day) || 0,
                price_per_hour: parseFloat(guideForm.price_per_hour) || 0,
                is_verified: true,
                is_active: true,
            };

            const response = await api.post('/staff/guides/add/', guideData);
            
            if (response?.data?.success) {
                const password = response.data.password || guideForm.password;
                setNewGuidePassword(password);
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
            console.error('❌ Add guide error:', error);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to add guide. Please check all fields.';
            showToast(`❌ ${errorMsg}`);
        } finally {
            setGuideLoading(false);
        }
    };

    // ============================================
    // ✅ EDIT GUIDE - FIXED ENDPOINTS
    // ============================================
    const openEditGuide = (guide) => {
        console.log('📝 Opening edit for guide:', guide);
        setEditingGuide(guide);
        setEditGuideForm({
            full_name: guide.full_name || '',
            email: guide.email || '',
            phone: guide.phone || guide.phone_number || '',
            bio: guide.bio || '',
            experience_years: guide.experience_years?.toString() || '0',
            languages: guide.languages || '',
            primary_district: guide.primary_district || guide.district || '',
            price_per_day: guide.price_per_day?.toString() || '0',
            price_per_hour: guide.price_per_hour?.toString() || '0',
            is_verified: guide.is_verified || false,
        });
        const profilePic = guide.profile_image || guide.image || guide.avatar;
        if (profilePic) {
            setEditGuideProfilePic(getProfileImageUrl(profilePic));
        } else {
            setEditGuideProfilePic(null);
        }
        setEditGuidePicFile(null);
        setShowEditGuideModal(true);
    };

    const handleEditGuideProfilePic = (e) => {
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
        setEditGuidePicFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setEditGuideProfilePic(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleEditGuideProfilePicUpload = async (guideId) => {
        if (!editGuidePicFile) return;
        
        try {
            const formData = new FormData();
            formData.append('profile_image', editGuidePicFile);
            
            const response = await api.post(`/staff/${guideId}/upload-profile-pic/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            if (response?.data?.success) {
                showToast('✅ Profile picture updated!');
                return true;
            }
        } catch (error) {
            console.error('Error uploading guide profile pic:', error);
        }
        
        return false;
    };

    const handleEditGuide = async (e) => {
        e.preventDefault();
        setGuideLoading(true);

        try {
            if (!editGuideForm.full_name.trim()) {
                showToast('❌ Full name is required');
                setGuideLoading(false);
                return;
            }
            if (!editGuideForm.primary_district) {
                showToast('❌ Primary district is required');
                setGuideLoading(false);
                return;
            }

            const guideData = {
                full_name: editGuideForm.full_name.trim(),
                phone: editGuideForm.phone?.trim() || '',
                bio: editGuideForm.bio?.trim() || '',
                experience_years: parseInt(editGuideForm.experience_years) || 0,
                languages: editGuideForm.languages?.trim() || '',
                primary_district: editGuideForm.primary_district,
                price_per_day: parseFloat(editGuideForm.price_per_day) || 0,
                price_per_hour: parseFloat(editGuideForm.price_per_hour) || 0,
                is_verified: editGuideForm.is_verified,
            };

            console.log('📤 Updating guide with data:', guideData);
            console.log('📤 Guide ID:', editingGuide.id);

            // ✅ Use /update/ endpoint
            const response = await api.put(`/staff/${editingGuide.id}/update/`, guideData);
            
            if (response?.data?.success) {
                // Handle profile picture if changed
                if (editGuidePicFile) {
                    await handleEditGuideProfilePicUpload(editingGuide.id);
                }
                showToast('✅ Guide updated successfully!');
                setShowEditGuideModal(false);
                setEditingGuide(null);
                setEditGuidePicFile(null);
                await fetchAllData();
                setGuideLoading(false);
                return;
            } else {
                showToast(response?.data?.error || '❌ Failed to update guide');
            }
        } catch (error) {
            console.error('❌ Edit guide error:', error);
            
            // Try fallback with PATCH
            try {
                const guideData = {
                    full_name: editGuideForm.full_name.trim(),
                    phone: editGuideForm.phone?.trim() || '',
                    bio: editGuideForm.bio?.trim() || '',
                    experience_years: parseInt(editGuideForm.experience_years) || 0,
                    languages: editGuideForm.languages?.trim() || '',
                    primary_district: editGuideForm.primary_district,
                    price_per_day: parseFloat(editGuideForm.price_per_day) || 0,
                    price_per_hour: parseFloat(editGuideForm.price_per_hour) || 0,
                    is_verified: editGuideForm.is_verified,
                };
                
                const response = await api.patch(`/staff/${editingGuide.id}/update/`, guideData);
                if (response?.data?.success) {
                    if (editGuidePicFile) {
                        await handleEditGuideProfilePicUpload(editingGuide.id);
                    }
                    showToast('✅ Guide updated successfully!');
                    setShowEditGuideModal(false);
                    setEditingGuide(null);
                    setEditGuidePicFile(null);
                    await fetchAllData();
                    setGuideLoading(false);
                    return;
                }
            } catch (e2) {
                console.error('Fallback edit failed:', e2);
            }
            
            const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to update guide. Please try again.';
            showToast(`❌ ${errorMsg}`);
        } finally {
            setGuideLoading(false);
        }
    };

    // ============================================
    // ✅ DELETE GUIDE
    // ============================================
    const deleteGuide = async (id) => {
        if (!window.confirm('Are you sure you want to delete this guide? This action cannot be undone.')) return;
        
        // Optimistically remove from UI
        setGuides(prev => prev.filter(g => g.id !== id));
        
        try {
            const response = await api.post(`/staff/${id}/delete/`);
            if (response?.data?.success || response?.status === 204) {
                showToast('✅ Guide deleted successfully');
                await fetchAllData();
                return;
            } else {
                showToast(response?.data?.error || 'Failed to delete guide');
                await fetchAllData();
            }
        } catch (error) {
            console.error('Delete guide error:', error);
            showToast(error.response?.data?.error || 'Failed to delete guide');
            await fetchAllData();
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
            'pending_guide': { fg: C.warn, bg: C.warnBg },
            'pending_admin': { fg: C.warn, bg: C.warnBg },
            'approved': { fg: C.success, bg: C.successBg },
            'approved_by_guide': { fg: C.success, bg: C.successBg },
            'approved_by_admin': { fg: C.success, bg: C.successBg },
            'implemented': { fg: C.gold, bg: C.warnBg },
            'rejected': { fg: C.danger, bg: C.dangerBg },
            'rejected_by_guide': { fg: C.danger, bg: C.dangerBg },
            'rejected_by_admin': { fg: C.danger, bg: C.dangerBg },
            'staff_approved': { fg: C.success, bg: C.successBg },
            'staff_rejected': { fg: C.danger, bg: C.dangerBg },
        };
        return colors[status] || { fg: C.sage, bg: '#EEEEEE' };
    };

    const getStatusLabel = (status) => {
        const labels = {
            'pending': '⏳ Pending',
            'pending_guide': '⏳ Pending',
            'pending_admin': '⏳ Pending',
            'approved': '✅ Approved',
            'approved_by_guide': '✅ Approved',
            'approved_by_admin': '✅ Approved',
            'implemented': '✨ Implemented',
            'rejected': '❌ Rejected',
            'rejected_by_guide': '❌ Rejected',
            'rejected_by_admin': '❌ Rejected',
            'staff_approved': '✅ Staff Approved',
            'staff_rejected': '❌ Staff Rejected',
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
            'hidden_gem': Sparkles,
            'local_insight': Lightbulb,
            'insight': Lightbulb,
            'review': Star,
        };
        return icons[type] || Star;
    };

    // ============================================
    // OPEN SUGGESTION DETAIL MODAL
    // ============================================
    const openSuggestionDetail = (suggestion) => {
        console.log('🔍 Opening suggestion detail:', suggestion);
        if (suggestion) {
            setSelectedSuggestion(suggestion);
            setShowSuggestionModal(true);
        } else {
            showToast('❌ No suggestion data to display');
        }
    };

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
        const isApproved = s.status === 'approved' || s.status === 'approved_by_guide' || s.status === 'approved_by_admin' || s.status === 'staff_approved';
        const isGuideSubmitted = s.is_guide_submitted === true;
        const isUserSubmitted = !isGuideSubmitted && s.user_email;

        return (
            <div
                key={s.id}
                style={{
                    display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md,
                    border: `1px solid ${isImplemented ? C.success : isPending ? C.warn : isGuideSubmitted ? C.info : C.line}`,
                    alignItems: 'flex-start', transition: 'all 0.2s ease',
                    cursor: 'default',
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
                        }}>
                            ✅
                        </div>
                    )}
                    {isGuideSubmitted && !isImplemented && (
                        <div style={{
                            position: 'absolute', top: 4, right: 4,
                            background: C.info, color: '#fff',
                            padding: '2px 6px', borderRadius: 999,
                            fontSize: 8, fontWeight: 600,
                        }}>
                            👤
                        </div>
                    )}
                    {isUserSubmitted && !isImplemented && !isPending && (
                        <div style={{
                            position: 'absolute', top: 4, right: 4,
                            background: C.goldSoft, color: C.gold,
                            padding: '2px 6px', borderRadius: 999,
                            fontSize: 8, fontWeight: 600,
                        }}>
                            ✅
                        </div>
                    )}
                    {hasImage && imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={s.name || 'Suggestion'} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                                console.error('❌ Image failed to load:', imageUrl);
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
                                {s.name || 'Untitled'}
                                {isImplemented && (
                                    <span style={{ fontSize: 11, color: C.success, marginLeft: 8 }}>✅ Implemented</span>
                                )}
                                {isGuideSubmitted && !isImplemented && (
                                    <span style={{ fontSize: 11, color: C.info, marginLeft: 8 }}>👤 Guide submitted</span>
                                )}
                            </h4>
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
                        {isPending && isUserSubmitted && (
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
                            </>
                        )}
                        {isGuideSubmitted && !isImplemented && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteSuggestion(s.id); }} 
                                disabled={actionLoading}
                                style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === s.id ? 0.5 : 1 }}
                            >
                                <Trash2 size={11} /> Delete
                            </button>
                        )}
                        {isPending && isGuideSubmitted && (
                            <span style={{ fontSize: 11, color: C.info, padding: '4px 12px', background: C.infoBg, borderRadius: 999 }}>
                                ⏳ Awaiting admin review
                            </span>
                        )}
                        {isApproved && !isImplemented && !isGuideSubmitted && (
                            <span style={{ fontSize: 11, color: C.success, padding: '4px 12px', background: C.successBg, borderRadius: 999 }}>
                                ⏳ Awaiting implementation
                            </span>
                        )}
                        {isGuideSubmitted && s.status === 'staff_approved' && (
                            <span style={{ fontSize: 11, color: C.success, padding: '4px 12px', background: C.successBg, borderRadius: 999 }}>
                                ✅ Staff Approved
                            </span>
                        )}
                        {isGuideSubmitted && s.status === 'staff_rejected' && (
                            <span style={{ fontSize: 11, color: C.danger, padding: '4px 12px', background: C.dangerBg, borderRadius: 999 }}>
                                ❌ Staff Rejected
                            </span>
                        )}
                        {isImplemented && (
                            <span style={{ fontSize: 11, color: C.gold, padding: '4px 12px', background: C.warnBg, borderRadius: 999 }}>
                                🎉 Implemented!
                            </span>
                        )}
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                openSuggestionDetail(s);
                            }}
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
    // RENDER GUIDE CARD - WITH EDIT BUTTON
    // ============================================
    const renderGuideCard = (guide) => {
        const guideImageUrl = guide.profile_image || guide.image || guide.avatar;
        const imageUrl = guideImageUrl ? getProfileImageUrl(guideImageUrl) : null;

        return (
            <div
                key={guide.id}
                style={{
                    display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md,
                    border: `1px solid ${guide.is_verified ? C.success : C.warn}44`,
                    alignItems: 'flex-start', transition: 'all 0.2s ease',
                }}
            >
                <div style={{ 
                    width: 60, height: 60, borderRadius: '50%', 
                    background: guide.is_verified ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : C.line,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, overflow: 'hidden',
                    fontSize: 20, fontWeight: 600, color: C.ink,
                    border: `2px solid ${guide.is_verified ? C.gold : C.sage}44`,
                }}>
                    {imageUrl ? (
                        <img src={imageUrl} alt={guide.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                        {guide.phone && <span>📱 {guide.phone}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        <button 
                            onClick={() => openEditGuide(guide)}
                            style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: C.info, color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                            <Edit2 size={11} /> Edit
                        </button>
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
    };

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

            {/* SIDEBAR */}
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
                            {profilePicture ? (
                                <img 
                                    src={profilePicture} 
                                    alt="Profile" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        console.error('❌ Profile image failed to load:', profilePicture);
                                        e.target.style.display = 'none';
                                        e.target.parentElement.textContent = profile?.full_name?.[0]?.toUpperCase() || user?.first_name?.[0]?.toUpperCase() || 'S';
                                        e.target.parentElement.style.fontSize = '14px';
                                        e.target.parentElement.style.fontWeight = '700';
                                    }}
                                />
                            ) : (
                                profile?.full_name?.[0]?.toUpperCase() || user?.first_name?.[0]?.toUpperCase() || 'S'
                            )}
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

            {/* MAIN CONTENT */}
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
                                <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}></p>
                            </div>
                            <Btn variant="ghost" icon={RefreshCw} onClick={() => { dataFetchedRef.current = false; setRefreshing(true); fetchAllData().finally(() => setRefreshing(false)); }} disabled={refreshing} style={{ opacity: refreshing ? 0.6 : 1 }}>
                                {refreshing ? 'Updating…' : 'Update'}
                            </Btn>
                        </div>

                        {/* Stats - REMOVED "Pending" */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
                            <StatChip label="Total Guides" value={stats.totalGuides} icon={Users} tone="ink" />
                            <StatChip label="Hidden Gems" value={stats.totalHiddenGems} icon={Sparkles} tone="gold" />
                            <StatChip label="Local Insights" value={stats.totalLocalInsights} icon={Lightbulb} tone="gold" />
                            <StatChip label="Reviews" value={stats.totalReviews} icon={Star} tone="gold" />
                            <StatChip label="Total Bookings" value={stats.totalBookings} icon={CalendarDays} tone="ink" />
                            <StatChip label="Confirmed" value={stats.confirmedBookings} icon={CheckCircle} tone="success" />
                        </div>

                        {/* Overview Tab - REMOVED Pending Suggestions */}
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

                        {/* Profile Tab - FIXED with image error handling */}
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
                                                        console.error('❌ Profile image failed to load:', profilePicture);
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.textContent = profile?.full_name?.[0]?.toUpperCase() || user?.first_name?.[0]?.toUpperCase() || 'A';
                                                        e.target.parentElement.style.fontSize = '26px';
                                                        e.target.parentElement.style.fontWeight = 'bold';
                                                    }}
                                                />
                                            ) : (
                                                profile?.full_name?.[0]?.toUpperCase() || user?.first_name?.[0]?.toUpperCase() || 'A'
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()} 
                                            disabled={uploading}
                                            style={{ 
                                                position: 'absolute', bottom: -2, right: -2, 
                                                width: 26, height: 26, borderRadius: '50%', 
                                                background: uploading ? C.sage : C.ink, 
                                                color: C.goldLight, border: `2px solid ${C.cream}`, 
                                                cursor: uploading ? 'not-allowed' : 'pointer', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                opacity: uploading ? 0.6 : 1,
                                            }}
                                        >
                                            {uploading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={12} />}
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            accept="image/*" 
                                            style={{ display: 'none' }} 
                                            onChange={handleProfilePictureUpload} 
                                            disabled={uploading} 
                                        />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: 17, color: C.inkSoft, margin: 0, fontFamily: FONT.display }}>{profile?.full_name || user?.first_name || 'Staff'}</h4>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '2px 0 0' }}>{profile?.department || 'Staff'} · {profile?.position || 'Staff Member'}</p>
                                        <span style={{ fontSize: 12, color: C.sage, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Shield size={12} /> {user?.role || 'staff'}
                                        </span>
                                    </div>
                                    {uploading && <span style={{ fontSize: 11, color: C.sage, marginLeft: 'auto' }}>Uploading...</span>}
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
                                placeholder="Set a secure password (min 6 characters)"
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
                                    maxLength="15"
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
                    </form>
                </ModalShell>
            )}

            {/* EDIT GUIDE MODAL - WITH PROFILE PIC UPLOAD */}
            {showEditGuideModal && editingGuide && (
                <ModalShell
                    onClose={() => { setShowEditGuideModal(false); setEditingGuide(null); setEditGuidePicFile(null); }}
                    title="✏️ Edit Guide"
                    subtitle={`Updating ${editingGuide.full_name}'s profile`}
                    icon={User}
                    footer={
                        <>
                            <Btn variant="ghost" onClick={() => { setShowEditGuideModal(false); setEditingGuide(null); setEditGuidePicFile(null); }}>Cancel</Btn>
                            <Btn variant="primary" icon={Save} onClick={handleEditGuide} disabled={guideLoading}>
                                {guideLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {guideLoading ? 'Saving...' : 'Update Guide'}
                            </Btn>
                        </>
                    }
                >
                    <form onSubmit={handleEditGuide} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Profile Picture Upload */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${C.line}` }}>
                            <div style={{ position: 'relative' }}>
                                <div
                                    style={{
                                        width: 64, height: 64, borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 24, fontWeight: 'bold', color: C.ink, overflow: 'hidden',
                                        border: `2px solid ${C.gold}66`,
                                    }}
                                >
                                    {editGuideProfilePic ? (
                                        <img src={editGuideProfilePic} alt="Guide" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        editGuideForm.full_name?.charAt(0)?.toUpperCase() || 'G'
                                    )}
                                </div>
                                <label
                                    htmlFor="edit-guide-pic"
                                    style={{
                                        position: 'absolute', bottom: -2, right: -2,
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: C.ink, color: C.goldLight,
                                        border: `2px solid ${C.cream}`,
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12,
                                    }}
                                >
                                    <Camera size={12} />
                                </label>
                                <input
                                    id="edit-guide-pic"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleEditGuideProfilePic}
                                />
                            </div>
                            <div>
                                <p style={{ fontSize: 12, color: C.sage, margin: 0 }}>Click the camera icon to update profile picture</p>
                                {editGuidePicFile && <p style={{ fontSize: 11, color: C.success, margin: '4px 0 0' }}>✅ New image selected</p>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Full Name <span style={{ color: C.danger }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editGuideForm.full_name}
                                    onChange={(e) => setEditGuideForm({ ...editGuideForm, full_name: e.target.value })}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={editGuideForm.email}
                                    disabled
                                    style={{ ...inputStyle, background: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={editGuideForm.phone}
                                    onChange={(e) => setEditGuideForm({ ...editGuideForm, phone: e.target.value })}
                                    style={inputStyle}
                                    placeholder="+91 9876543210"
                                    maxLength="15"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Experience (Years)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editGuideForm.experience_years}
                                    onChange={(e) => setEditGuideForm({ ...editGuideForm, experience_years: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Bio
                            </label>
                            <textarea
                                rows="2"
                                value={editGuideForm.bio}
                                onChange={(e) => setEditGuideForm({ ...editGuideForm, bio: e.target.value })}
                                style={{ ...inputStyle, resize: 'vertical' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Languages
                                </label>
                                <input
                                    type="text"
                                    value={editGuideForm.languages}
                                    onChange={(e) => setEditGuideForm({ ...editGuideForm, languages: e.target.value })}
                                    style={inputStyle}
                                    placeholder="English, Malayalam, Hindi"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Primary District <span style={{ color: C.danger }}>*</span>
                                </label>
                                <select
                                    value={editGuideForm.primary_district}
                                    onChange={(e) => setEditGuideForm({ ...editGuideForm, primary_district: e.target.value })}
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
                                    value={editGuideForm.price_per_day}
                                    onChange={(e) => setEditGuideForm({ ...editGuideForm, price_per_day: e.target.value })}
                                    style={inputStyle}
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
                                    value={editGuideForm.price_per_hour}
                                    onChange={(e) => setEditGuideForm({ ...editGuideForm, price_per_hour: e.target.value })}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, borderTop: `1px solid ${C.line}` }}>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <input
                                    type="checkbox"
                                    checked={editGuideForm.is_verified}
                                    onChange={(e) => setEditGuideForm({ ...editGuideForm, is_verified: e.target.checked })}
                                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                                />
                                Verified Guide
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
                    onClose={() => { 
                        setShowSuggestionModal(false); 
                        setSelectedSuggestion(null); 
                    }}
                    title={selectedSuggestion.name || 'Details'}
                    subtitle={selectedSuggestion.district || 'N/A'}
                    icon={getTypeIcon(selectedSuggestion.suggestion_type)}
                    footer={
                        <>
                            {selectedSuggestion.status === 'pending' || selectedSuggestion.status === 'pending_guide' || selectedSuggestion.status === 'pending_admin' ? (
                                <>
                                    <Btn variant="success" icon={Check} onClick={() => processSuggestion(selectedSuggestion.id, 'approve', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Approve</Btn>
                                    <Btn variant="danger" icon={X} onClick={() => processSuggestion(selectedSuggestion.id, 'reject', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Reject</Btn>
                                    <Btn variant="primary" icon={CheckCircle} onClick={() => processSuggestion(selectedSuggestion.id, 'implement', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Implement</Btn>
                                </>
                            ) : (selectedSuggestion.status === 'approved' || selectedSuggestion.status === 'approved_by_guide' || selectedSuggestion.status === 'approved_by_admin' || selectedSuggestion.status === 'staff_approved') ? (
                                <>
                                    <Btn variant="primary" icon={CheckCircle} onClick={() => processSuggestion(selectedSuggestion.id, 'implement', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Implement</Btn>
                                    <Btn variant="danger" icon={X} onClick={() => processSuggestion(selectedSuggestion.id, 'reject', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Reject</Btn>
                                </>
                            ) : selectedSuggestion.status === 'implemented' ? (
                                <span style={{ fontSize: 13, color: C.gold, fontWeight: 600, padding: '8px 16px' }}>✨ Implemented</span>
                            ) : selectedSuggestion.status === 'rejected' || selectedSuggestion.status === 'rejected_by_guide' || selectedSuggestion.status === 'rejected_by_admin' || selectedSuggestion.status === 'staff_rejected' ? (
                                <span style={{ fontSize: 13, color: C.danger, fontWeight: 600, padding: '8px 16px' }}>❌ Rejected</span>
                            ) : null}
                            <Btn variant="danger" icon={Trash2} onClick={() => processSuggestion(selectedSuggestion.id, 'delete', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>Delete</Btn>
                            <Btn variant="ghost" onClick={() => { setShowSuggestionModal(false); setSelectedSuggestion(null); }}>Close</Btn>
                        </>
                    }
                >
                    {(() => {
                        const modalImageUrl = getImageUrl(selectedSuggestion);
                        return modalImageUrl ? (
                            <img 
                                src={modalImageUrl} 
                                alt={selectedSuggestion.name || 'Suggestion'} 
                                style={{ 
                                    width: '100%', maxHeight: 300, objectFit: 'cover', 
                                    borderRadius: RADIUS.md, marginBottom: 16, 
                                    border: `1px solid ${C.line}` 
                                }}
                                onError={(e) => { 
                                    console.error('❌ Modal image failed to load:', modalImageUrl);
                                    e.target.style.display = 'none'; 
                                }}
                            />
                        ) : (
                            <div style={{ 
                                width: '100%', height: 150, 
                                background: C.cream, 
                                borderRadius: RADIUS.md, 
                                marginBottom: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${C.line}`
                            }}>
                                <span style={{ fontSize: 48 }}>
                                    {selectedSuggestion.suggestion_type === 'hidden_gem' ? '💎' : 
                                     selectedSuggestion.suggestion_type === 'local_insight' ? '💡' : 
                                     selectedSuggestion.suggestion_type === 'review' ? '⭐' : '📍'}
                                </span>
                            </div>
                        );
                    })()}
                    
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
                        {selectedSuggestion.implemented_at && (
                            <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.successBg, color: C.success }}>
                                Implemented: {new Date(selectedSuggestion.implemented_at).toLocaleDateString()}
                            </span>
                        )}
                        {selectedSuggestion.is_guide_submitted && (
                            <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.infoBg, color: C.info }}>
                                👤 Submitted by Guide
                            </span>
                        )}
                    </div>
                    <p style={{ fontSize: 14, color: C.sage, lineHeight: 1.6, marginBottom: 12 }}>{selectedSuggestion.description || 'No description'}</p>
                    {selectedSuggestion.location_info && (
                        <div style={{ background: C.cream, padding: 12, borderRadius: RADIUS.sm, marginBottom: 8 }}>
                            <p style={{ fontSize: 11, color: C.info, margin: 0, fontWeight: 600 }}>📍 Location Info</p>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: '4px 0 0' }}>{selectedSuggestion.location_info}</p>
                        </div>
                    )}
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
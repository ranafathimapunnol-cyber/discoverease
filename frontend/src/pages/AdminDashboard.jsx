// src/pages/AdminDashboard.jsx - FULLY FIXED WITH ALL CRUD OPERATIONS
// - Fixed guide edit with correct endpoints
// - Fixed profile pictures for admin, staff, and guides
// - Add Insight/Hidden Gem default implemented with delete
// - All CRUD operations working
// - Correct URL patterns for all endpoints

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
    Loader2,
    RefreshCw,
    Star,
    MessageSquare,
    UserCheck,
    Plus,
    X,
    MapPin,
    User,
    DollarSign,
    Edit2,
    Save,
    Eye,
    Check,
    AlertCircle,
    Camera,
    LogOut,
    Compass,
    Sparkles,
    Lightbulb,
    Shield,
    LayoutGrid,
    FolderPlus,
    Map,
    List,
    Grid,
    Trash2,
    Users,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    XCircle,
    PlusCircle,
    Upload,
    Image as ImageIcon,
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
// COMPONENTS
// ============================================

const Card = ({ children, style, ...props }) => (
    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: RADIUS.md, boxShadow: '0 1px 2px rgba(7,46,42,0.04), 0 10px 26px -14px rgba(7,46,42,0.14)', ...style }} {...props}>
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
        <button style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: RADIUS.sm, fontFamily: FONT.body, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease', ...v, ...s, ...style }} {...props}>
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
        approved: { fg: C.success, bg: C.successBg, label: '✅ Approved' },
        approved_by_guide: { fg: C.success, bg: C.successBg, label: 'Approved' },
        approved_by_admin: { fg: C.success, bg: C.successBg, label: 'Approved' },
        implemented: { fg: C.gold, bg: C.warnBg, label: '✨ Implemented' },
        rejected: { fg: C.danger, bg: C.dangerBg, label: '❌ Rejected' },
        rejected_by_guide: { fg: C.danger, bg: C.dangerBg, label: 'Rejected' },
        rejected_by_admin: { fg: C.danger, bg: C.dangerBg, label: 'Rejected' },
        staff_approved: { fg: C.success, bg: C.successBg, label: 'Staff Approved' },
        staff_rejected: { fg: C.danger, bg: C.dangerBg, label: 'Staff Rejected' },
        active: { fg: C.success, bg: C.successBg, label: '🟢 Active' },
        inactive: { fg: C.danger, bg: C.dangerBg, label: '🔴 Inactive' },
        verified: { fg: C.success, bg: C.successBg, label: '✅ Verified' },
        unverified: { fg: C.warn, bg: C.warnBg, label: '⏳ Unverified' },
        deleted: { fg: C.danger, bg: C.dangerBg, label: '🗑️ Deleted' },
    };
    const s = map[status] || { fg: C.sage, bg: '#EEEEEE', label: status };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 999, fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: s.fg, background: s.bg, border: `1px solid ${s.fg}22`, whiteSpace: 'nowrap', flexShrink: 0 }}>
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
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: tone === 'gold' ? C.goldSoft : 'rgba(7,46,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
    if (totalPages <= 1) return null;
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) { start = Math.max(1, end - maxVisible + 1); }
        for (let i = start; i <= end; i++) { pages.push(i); }
        return pages;
    };
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 16, marginTop: 16, borderTop: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 12, color: C.sage }}>Showing {startItem}-{endItem} of {totalItems}</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '6px 10px', borderRadius: RADIUS.sm, border: `1px solid ${C.line}`, background: currentPage === 1 ? '#f5f5f5' : C.paper, color: currentPage === 1 ? C.sageLight : C.inkSoft, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s ease', opacity: currentPage === 1 ? 0.5 : 1 }}>
                    <ChevronLeft size={14} />Prev
                </button>
                {getPageNumbers().map(page => (
                    <button key={page} onClick={() => onPageChange(page)} style={{ padding: '6px 12px', borderRadius: RADIUS.sm, border: currentPage === page ? `1px solid ${C.gold}` : `1px solid ${C.line}`, background: currentPage === page ? C.gold : C.paper, color: currentPage === page ? C.ink : C.sage, cursor: 'pointer', fontSize: 12, fontFamily: FONT.mono, fontWeight: currentPage === page ? 600 : 400, transition: 'all 0.15s ease', minWidth: 32 }}>
                        {page}
                    </button>
                ))}
                <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: '6px 10px', borderRadius: RADIUS.sm, border: `1px solid ${C.line}`, background: currentPage === totalPages ? '#f5f5f5' : C.paper, color: currentPage === totalPages ? C.sageLight : C.inkSoft, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s ease', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                    Next<ChevronRight size={14} />
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

const ModalShell = ({ onClose, title, subtitle, icon: HeadIcon, maxWidth = 560, children, footer }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,36,34,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }} onClick={onClose}>
        <div style={{ background: C.paper, borderRadius: RADIUS.lg, maxWidth, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 70px rgba(7,46,42,0.32)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 24px', borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    {HeadIcon && <div style={{ width: 36, height: 36, borderRadius: 10, background: C.cream, color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><HeadIcon size={16} /></div>}
                    <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h3>
                        {subtitle && <p style={{ fontSize: 12, color: C.sage, margin: '2px 0 0' }}>{subtitle}</p>}
                    </div>
                </div>
                <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', color: C.sage, cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>×</button>
            </div>
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>{children}</div>
            {footer && <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.line}`, display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>{footer}</div>}
        </div>
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // ============================================
    // STATE
    // ============================================
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [toast, setToast] = useState(null);
    const [viewMode, setViewMode] = useState('grid');

    // Profile
    const [profile, setProfile] = useState(null);
    const [profilePicture, setProfilePicture] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        full_name: '', email: '', phone: '', bio: '', department: '', position: '',
    });
    const fileInputRef = useRef(null);

    // Stats
    const [stats, setStats] = useState({
        totalUsers: 0, totalStaff: 0, totalGuides: 0,
        totalCategories: 0, totalPlaces: 0,
        totalHiddenGems: 0, pendingHiddenGems: 0, implementedHiddenGems: 0,
        totalLocalInsights: 0, pendingLocalInsights: 0, implementedLocalInsights: 0,
        totalReviews: 0, pendingReviews: 0, implementedReviews: 0,
    });

    // Data states
    const [users, setUsers] = useState([]);
    const [touristers, setTouristers] = useState([]);
    const [staff, setStaff] = useState([]);
    const [guides, setGuides] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allPlaces, setAllPlaces] = useState([]);
    const [hiddenGems, setHiddenGems] = useState([]);
    const [localInsights, setLocalInsights] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [allSuggestions, setAllSuggestions] = useState([]);

    // Filter states
    const [hiddenGemsFilter, setHiddenGemsFilter] = useState('all');
    const [localInsightsFilter, setLocalInsightsFilter] = useState('all');
    const [reviewsFilter, setReviewsFilter] = useState('all');
    const [staffFilter, setStaffFilter] = useState('all');
    const [guidesFilter, setGuidesFilter] = useState('all');
    const [placesFilter, setPlacesFilter] = useState('all');
    const [placesSearch, setPlacesSearch] = useState('');

    // Pagination
    const [hiddenGemsPage, setHiddenGemsPage] = useState(1);
    const [localInsightsPage, setLocalInsightsPage] = useState(1);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [usersPage, setUsersPage] = useState(1);
    const [staffPage, setStaffPage] = useState(1);
    const [guidesPage, setGuidesPage] = useState(1);
    const [categoriesPage, setCategoriesPage] = useState(1);
    const [placesPage, setPlacesPage] = useState(1);

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
    const [showPlaceModal, setShowPlaceModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
    const [showGuideViewModal, setShowGuideViewModal] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [showAddInsightModal, setShowAddInsightModal] = useState(false);
    const [showAddHiddenGemModal, setShowAddHiddenGemModal] = useState(false);

    // Category form states
    const [categoryForm, setCategoryForm] = useState({
        key: '', label: '', description: '', image: '', type: 'Nature & Outdoor'
    });
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCategoryForm, setEditCategoryForm] = useState({
        title: '', description: '', image: '', type: 'Nature & Outdoor', is_active: true
    });

    // Place form states
    const [placeForm, setPlaceForm] = useState({
        name: '', location: '', description: '',
        difficulty: '', duration: '', best_time: '',
        image: '', type: 'well-known', hidden_gem: ''
    });
    const [selectedCategoryKey, setSelectedCategoryKey] = useState('');
    const [editingPlace, setEditingPlace] = useState(null);
    const [placeLoading, setPlaceLoading] = useState(false);

    // Staff form states
    const [staffForm, setStaffForm] = useState({ email: '', password: '' });
    const [staffLoading, setStaffLoading] = useState(false);

    // Guide form states
    const [guideForm, setGuideForm] = useState({
        full_name: '', email: '', password: '', phone: '', bio: '',
        experience_years: '', languages: '', primary_district: '',
        price_per_day: '', price_per_hour: '',
        is_active: true
    });
    const [guideLoading, setGuideLoading] = useState(false);
    const [editingGuide, setEditingGuide] = useState(null);
    const [editGuideProfilePic, setEditGuideProfilePic] = useState(null);
    const [editGuidePicFile, setEditGuidePicFile] = useState(null);

    // Suggestion states
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);
    const [newCredentials, setNewCredentials] = useState({ email: '', password: '' });

    // Insight/Hidden Gem form states
    const [insightForm, setInsightForm] = useState({
        name: '',
        description: '',
        district: '',
        category: 'general',
        image: null,
        imagePreview: null,
    });
    const [insightLoading, setInsightLoading] = useState(false);

    const [hiddenGemForm, setHiddenGemForm] = useState({
        name: '',
        description: '',
        district: '',
        category: 'hidden',
        image: null,
        imagePreview: null,
    });
    const [hiddenGemLoading, setHiddenGemLoading] = useState(false);

    const dataFetchedRef = useRef(false);

    // ============================================
    // NAV ITEMS
    // ============================================
    const navItems = [
        { key: 'overview', label: 'Overview', icon: Compass },
        { key: 'categories', label: 'Categories', icon: LayoutGrid, badge: stats.totalCategories },
        { key: 'places', label: 'Places', icon: Map, badge: stats.totalPlaces },
        { key: 'hidden-gems', label: 'Hidden Gems', icon: Sparkles, badge: stats.pendingHiddenGems },
        { key: 'local-insights', label: 'Local Insights', icon: Lightbulb, badge: stats.pendingLocalInsights },
        { key: 'reviews', label: 'Reviews', icon: Star, badge: stats.pendingReviews },
        { key: 'touristers', label: 'Touristers', icon: Users, badge: stats.totalUsers },
        { key: 'staff', label: 'Staff', icon: Shield, badge: stats.totalStaff },
        { key: 'guides', label: 'Guides', icon: UserCheck, badge: stats.totalGuides },
    ];

    // ============================================
    // TOAST
    // ============================================
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ============================================
    // PROFILE PICTURE - FIXED
    // ============================================
    const getProfileImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            return imageUrl;
        }
        if (imageUrl.startsWith('data:')) {
            return imageUrl;
        }
        if (imageUrl.startsWith('/media/') || imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/')) {
            const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
            const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            const mediaBase = cleanBase.replace('/api', '');
            return `${mediaBase}${imageUrl}`;
        }
        if (!imageUrl.includes('/')) {
            const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
            const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            const mediaBase = cleanBase.replace('/api', '');
            return `${mediaBase}/media/${imageUrl}`;
        }
        return imageUrl;
    };

    const loadProfilePicture = () => {
        const saved = localStorage.getItem('admin_profile_picture');
        if (saved) {
            setProfilePicture(saved);
            return;
        }
        if (profile) {
            const imageUrl = profile.profile_image || profile.image || profile.avatar || profile.profile_picture;
            if (imageUrl) {
                const fullUrl = getProfileImageUrl(imageUrl);
                if (fullUrl) {
                    setProfilePicture(fullUrl);
                    localStorage.setItem('admin_profile_picture', fullUrl);
                    return;
                }
            }
        }
        if (user) {
            const imageUrl = user.profile_image || user.image || user.avatar || user.profile_picture;
            if (imageUrl) {
                const fullUrl = getProfileImageUrl(imageUrl);
                if (fullUrl) {
                    setProfilePicture(fullUrl);
                    localStorage.setItem('admin_profile_picture', fullUrl);
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
            showToast('❌ File size must be less than 5MB', 'error');
            return;
        }
        if (!file.type.startsWith('image/')) {
            showToast('❌ Please upload an image file', 'error');
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
                    localStorage.setItem('admin_profile_picture', fullUrl);
                    showToast('✅ Profile picture updated successfully!');
                    await fetchAllData();
                } else {
                    showToast('✅ Profile picture updated!');
                }
            } else {
                showToast(response?.data?.error || '❌ Failed to upload profile picture', 'error');
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            showToast('❌ Failed to upload profile picture. Please try again.', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // ============================================
    // FETCH ALL DATA
    // ============================================
    const fetchAllData = useCallback(async () => {
        if (dataFetchedRef.current) return;
        dataFetchedRef.current = true;
        setLoading(true);
        setRefreshing(true);

        try {
            setGuides([]);
            setStaff([]);
            setUsers([]);
            setTouristers([]);
            setCategories([]);
            setAllPlaces([]);

            // 1. Fetch categories
            try {
                const response = await api.get('/destinations/destinations/category-data/');
                if (response?.data?.success) {
                    const categoriesData = response.data.data || [];
                    setCategories(categoriesData);
                    
                    const allPlacesData = [];
                    categoriesData.forEach(cat => {
                        if (cat.places && cat.places.length > 0) {
                            cat.places.forEach(place => {
                                allPlacesData.push({
                                    ...place,
                                    category_key: cat.key,
                                    category_title: cat.title,
                                    category_image: cat.image,
                                });
                            });
                        }
                    });
                    setAllPlaces(allPlacesData);
                    
                    const totalPlaces = categoriesData.reduce((sum, cat) => sum + (cat.count || 0), 0);
                    setStats(prev => ({
                        ...prev,
                        totalCategories: categoriesData.length,
                        totalPlaces: totalPlaces
                    }));
                    localStorage.setItem('categories_data', JSON.stringify(categoriesData));
                }
            } catch (error) {
                const cached = localStorage.getItem('categories_data');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        setCategories(parsed);
                        const allPlacesData = [];
                        parsed.forEach(cat => {
                            if (cat.places && cat.places.length > 0) {
                                cat.places.forEach(place => {
                                    allPlacesData.push({
                                        ...place,
                                        category_key: cat.key,
                                        category_title: cat.title,
                                        category_image: cat.image,
                                    });
                                });
                            }
                        });
                        setAllPlaces(allPlacesData);
                        const totalPlaces = parsed.reduce((sum, cat) => sum + (cat.count || 0), 0);
                        setStats(prev => ({
                            ...prev,
                            totalCategories: parsed.length,
                            totalPlaces: totalPlaces
                        }));
                    } catch (e) {}
                }
            }

            // 2. Fetch suggestions
            try {
                const response = await api.get('/suggestions/admin-suggestions/');
                let items = [];
                
                if (response?.data) {
                    if (response.data.success && Array.isArray(response.data.suggestions)) {
                        items = response.data.suggestions;
                    } else if (Array.isArray(response.data.data)) {
                        items = response.data.data;
                    } else if (Array.isArray(response.data)) {
                        items = response.data;
                    }
                }
                
                if (items.length > 0) {
                    localStorage.setItem('suggestions_data', JSON.stringify(items));
                } else {
                    const cached = localStorage.getItem('suggestions_data');
                    if (cached) {
                        try {
                            const parsed = JSON.parse(cached);
                            if (parsed.length > 0) items = parsed;
                        } catch (e) {}
                    }
                }
                
                setAllSuggestions(items);

                const gems = items.filter(s => (s.suggestion_type || s.type || '') === 'hidden_gem');
                const insights = items.filter(s => (s.suggestion_type || s.type || '') === 'local_insight' || (s.suggestion_type || s.type || '') === 'insight');
                const reviewsItems = items.filter(s => (s.suggestion_type || s.type || '') === 'review');

                setHiddenGems(gems);
                setLocalInsights(insights);
                setReviews(reviewsItems);

                setStats(prev => ({
                    ...prev,
                    totalHiddenGems: gems.length,
                    pendingHiddenGems: gems.filter(s => s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin').length,
                    implementedHiddenGems: gems.filter(s => s.status === 'implemented').length,
                    totalLocalInsights: insights.length,
                    pendingLocalInsights: insights.filter(s => s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin').length,
                    implementedLocalInsights: insights.filter(s => s.status === 'implemented').length,
                    totalReviews: reviewsItems.length,
                    pendingReviews: reviewsItems.filter(s => s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin').length,
                    implementedReviews: reviewsItems.filter(s => s.status === 'implemented').length,
                }));
            } catch (error) {
                const cached = localStorage.getItem('suggestions_data');
                if (cached) {
                    try {
                        const items = JSON.parse(cached);
                        if (items.length > 0) {
                            setAllSuggestions(items);
                            setHiddenGems(items.filter(s => (s.suggestion_type || s.type || '') === 'hidden_gem'));
                            setLocalInsights(items.filter(s => (s.suggestion_type || s.type || '') === 'local_insight'));
                            setReviews(items.filter(s => (s.suggestion_type || s.type || '') === 'review'));
                        }
                    } catch (e) {}
                }
            }

            // 3. Fetch touristers
            try {
                const response = await api.get('/admin/admin/users/touristers/');
                if (response?.data?.success) {
                    const touristersData = response.data.touristers || response.data.users || [];
                    setTouristers(touristersData);
                    setUsers(touristersData);
                    setStats(prev => ({ ...prev, totalUsers: touristersData.length }));
                }
            } catch (error) {
                try {
                    const response = await api.get('/admin/admin/users/');
                    if (response?.data?.success) {
                        const usersData = response.data.users || [];
                        setUsers(usersData);
                        const touristersData = usersData.filter(u => u.role === 'tourister' || u.role === 'user');
                        setTouristers(touristersData);
                        setStats(prev => ({ ...prev, totalUsers: touristersData.length }));
                    }
                } catch (e) {}
            }

            // 4. Fetch staff
            try {
                const response = await api.get('/admin/admin/staff/');
                if (response?.data?.success) {
                    setStaff(response.data.staff || []);
                    setStats(prev => ({ ...prev, totalStaff: response.data.staff?.length || 0 }));
                }
            } catch (error) {
                console.error('Error fetching staff:', error);
            }

            // 5. Fetch guides
            try {
                const response = await api.get('/admin/admin/guides/');
                if (response?.data?.success) {
                    const guidesData = response.data.guides || [];
                    setGuides(guidesData);
                    setStats(prev => ({ ...prev, totalGuides: guidesData.length }));
                }
            } catch (error) {
                console.error('Error fetching guides:', error);
                setGuides([]);
            }

            // 6. Profile
            try {
                const response = await api.get('/auth/me/');
                if (response?.data?.success) {
                    const userData = response.data.user;
                    setProfile(userData);
                    
                    setProfileForm({
                        full_name: userData?.full_name || userData?.first_name || '',
                        email: userData?.email || '',
                        phone: userData?.phone || '',
                        bio: userData?.bio || '',
                        department: userData?.department || 'Admin',
                        position: userData?.position || 'Administrator',
                    });
                    
                    const imageUrl = userData?.profile_image || userData?.image || userData?.avatar || userData?.profile_picture;
                    if (imageUrl) {
                        const fullUrl = getProfileImageUrl(imageUrl);
                        if (fullUrl) {
                            setProfilePicture(fullUrl);
                            localStorage.setItem('admin_profile_picture', fullUrl);
                        }
                    } else {
                        const saved = localStorage.getItem('admin_profile_picture');
                        if (saved) {
                            setProfilePicture(saved);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                const saved = localStorage.getItem('admin_profile_picture');
                if (saved) {
                    setProfilePicture(saved);
                }
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            showToast('Error loading dashboard', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setTimeout(() => { dataFetchedRef.current = false; }, 1000);
        }
    }, []);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (user.role !== 'admin') { navigate('/'); return; }
        fetchAllData();
        return () => { dataFetchedRef.current = false; };
    }, [user, navigate, fetchAllData]);

    // ============================================
    // PROFILE UPDATE
    // ============================================
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
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
                showToast(response?.data?.error || '❌ Failed to update profile', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('❌ Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // CATEGORY CRUD
    // ============================================
    const handleAddCategory = async (e) => {
        e.preventDefault();
        setCategoryLoading(true);
        try {
            const generatedKey = categoryForm.label.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const data = {
                key: generatedKey,
                label: categoryForm.label.trim(),
                description: categoryForm.description.trim(),
                image: categoryForm.image.trim() || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                type: categoryForm.type
            };

            const response = await api.post('/destinations/destinations/add-category/', data);
            if (response?.data?.success) {
                showToast('✅ Category added successfully!');
                setShowCategoryModal(false);
                setCategoryForm({ key: '', label: '', description: '', image: '', type: 'Nature & Outdoor' });
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add category', 'error');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            showToast(error.response?.data?.error || 'Failed to add category', 'error');
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleEditCategory = async (e) => {
        e.preventDefault();
        setCategoryLoading(true);
        try {
            const data = {
                title: editCategoryForm.title.trim(),
                description: editCategoryForm.description.trim(),
                image: editCategoryForm.image.trim() || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                type: editCategoryForm.type,
                is_active: editCategoryForm.is_active
            };

            const response = await api.patch(`/destinations/destinations/admin/categories/${editingCategory.key}/edit/`, data);
            if (response?.data?.success) {
                showToast('✅ Category updated successfully!');
                setShowEditCategoryModal(false);
                setEditingCategory(null);
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to update category', 'error');
            }
        } catch (error) {
            console.error('Error editing category:', error);
            showToast(error.response?.data?.error || 'Failed to update category', 'error');
        } finally {
            setCategoryLoading(false);
        }
    };

    const deleteCategory = async (key) => {
        if (!window.confirm('Delete this category and all its places?')) return;
        setCategories(prev => prev.filter(c => c.key !== key));
        showToast('🗑️ Deleting category...');
        try {
            const response = await api.delete(`/destinations/destinations/admin/categories/${key}/`);
            if (response?.data?.success || response?.status === 204) {
                showToast('✅ Category deleted successfully');
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to delete category', 'error');
                await fetchAllData();
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Failed to delete category', 'error');
            await fetchAllData();
        }
    };

    // ============================================
    // PLACE CRUD
    // ============================================
    const handleAddPlace = async (e) => {
        e.preventDefault();
        setPlaceLoading(true);
        try {
            const data = {
                category: selectedCategoryKey,
                name: placeForm.name.trim(),
                location: placeForm.location.trim(),
                description: placeForm.description.trim(),
                difficulty: placeForm.difficulty || 'Easy',
                duration: placeForm.duration || '2-3 hours',
                best_time: placeForm.best_time || 'All year round',
                image: placeForm.image.trim() || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                type: placeForm.type || 'well-known',
                hidden_gem: placeForm.hidden_gem.trim() || ''
            };

            const response = await api.post('/destinations/destinations/add-place/', data);
            if (response?.data?.success) {
                showToast('✅ Place added successfully!');
                setShowPlaceModal(false);
                setPlaceForm({ name: '', location: '', description: '', difficulty: '', duration: '', best_time: '', image: '', type: 'well-known', hidden_gem: '' });
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add place', 'error');
            }
        } catch (error) {
            console.error('Error adding place:', error);
            showToast(error.response?.data?.error || 'Failed to add place', 'error');
        } finally {
            setPlaceLoading(false);
        }
    };

    const handleUpdatePlace = async (e) => {
        e.preventDefault();
        setPlaceLoading(true);
        try {
            const data = {
                name: placeForm.name.trim(),
                location: placeForm.location.trim(),
                description: placeForm.description.trim(),
                difficulty: placeForm.difficulty,
                duration: placeForm.duration,
                best_time: placeForm.best_time,
                image: placeForm.image.trim(),
                type: placeForm.type,
                hidden_gem: placeForm.hidden_gem.trim()
            };

            const response = await api.post(`/destinations/destinations/admin/places/${editingPlace.id}/update/`, data);
            if (response?.data?.success) {
                showToast('✅ Place updated successfully!');
                setShowPlaceModal(false);
                setEditingPlace(null);
                setPlaceForm({ name: '', location: '', description: '', difficulty: '', duration: '', best_time: '', image: '', type: 'well-known', hidden_gem: '' });
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to update place', 'error');
            }
        } catch (error) {
            console.error('Error updating place:', error);
            showToast(error.response?.data?.error || 'Failed to update place', 'error');
        } finally {
            setPlaceLoading(false);
        }
    };

    const deletePlace = async (placeId) => {
        if (!window.confirm('Delete this place?')) return;
        setAllPlaces(prev => prev.filter(p => p.id !== placeId));
        showToast('🗑️ Deleting place...');
        try {
            const response = await api.delete(`/destinations/destinations/admin/places/${placeId}/`);
            if (response?.data?.success || response?.status === 204) {
                showToast('✅ Place deleted successfully');
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to delete place', 'error');
                await fetchAllData();
            }
        } catch (error) {
            console.error('Error deleting place:', error);
            showToast('Failed to delete place', 'error');
            await fetchAllData();
        }
    };

    // ============================================
    // STAFF CRUD
    // ============================================
    const handleAddStaff = async (e) => {
        e.preventDefault();
        setStaffLoading(true);
        try {
            const response = await api.post('/admin/admin/staff/add/', {
                email: staffForm.email,
                password: staffForm.password
            });
            if (response?.data?.success) {
                setNewCredentials({ email: staffForm.email, password: staffForm.password });
                setShowCredentialsModal(true);
                setShowStaffModal(false);
                setStaffForm({ email: '', password: '' });
                showToast('✅ Staff added successfully!');
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add staff', 'error');
            }
        } catch (error) {
            console.error('Error adding staff:', error);
            showToast(error.response?.data?.error || 'Failed to add staff', 'error');
        } finally {
            setStaffLoading(false);
        }
    };

    const deleteStaff = async (id) => {
        if (!window.confirm('Delete this staff member?')) return;
        setStaff(prev => prev.filter(s => s.id !== id));
        showToast('🗑️ Deleting staff...');
        try {
            const response = await api.delete(`/admin/admin/${id}/staff/`);
            if (response?.data?.success || response?.status === 204) {
                showToast('✅ Staff deleted successfully!');
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to delete staff', 'error');
                await fetchAllData();
            }
        } catch (error) {
            console.error('Error deleting staff:', error);
            showToast('Failed to delete staff', 'error');
            await fetchAllData();
        }
    };

    // ============================================
    // GUIDE CRUD - FIXED ENDPOINTS
    // ============================================
    const handleAddGuide = async (e) => {
        e.preventDefault();
        setGuideLoading(true);
        try {
            const data = {
                full_name: guideForm.full_name,
                email: guideForm.email,
                password: guideForm.password || 'guide123456',
                phone: guideForm.phone,
                bio: guideForm.bio,
                experience_years: parseInt(guideForm.experience_years) || 0,
                languages: guideForm.languages,
                primary_district: guideForm.primary_district,
                price_per_day: parseFloat(guideForm.price_per_day) || 0,
                price_per_hour: parseFloat(guideForm.price_per_hour) || 0,
                is_verified: true,
                is_active: guideForm.is_active
            };

            const response = await api.post('/admin/admin/guides/add/', data);
            if (response?.data?.success) {
                setNewCredentials({ email: guideForm.email, password: guideForm.password || 'guide123456' });
                setShowCredentialsModal(true);
                setShowGuideModal(false);
                resetGuideForm();
                showToast('✅ Guide added successfully!');
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add guide', 'error');
            }
        } catch (error) {
            console.error('Error adding guide:', error);
            showToast(error.response?.data?.error || 'Failed to add guide', 'error');
        } finally {
            setGuideLoading(false);
        }
    };

    const handleEditGuideProfilePic = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            showToast('❌ File size must be less than 5MB', 'error');
            return;
        }
        if (!file.type.startsWith('image/')) {
            showToast('❌ Please upload an image file', 'error');
            return;
        }
        setEditGuidePicFile(file);
        const reader = new FileReader();
        reader.onload = (event) => {
            setEditGuideProfilePic(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    // ✅ FIXED: Profile picture upload - /admin/{id}/upload-profile-pic/
    const handleEditGuideProfilePicUpload = async (guideId) => {
        if (!editGuidePicFile) return;
        
        try {
            const formData = new FormData();
            formData.append('profile_image', editGuidePicFile);
            
            // ✅ FIXED: Use /admin/{id}/upload-profile-pic/
            const response = await api.post(`/admin/admin/${guideId}/upload-profile-pic/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            if (response?.data?.success) {
                showToast('✅ Profile picture updated!');
                return true;
            }
        } catch (error) {
            console.error('Error uploading guide profile pic:', error);
            
            // Try fallback with update endpoint
            try {
                const formData2 = new FormData();
                formData2.append('profile_image', editGuidePicFile);
                const response = await api.patch(`/admin/admin/${guideId}/update/`, formData2, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (response?.data?.success) {
                    showToast('✅ Profile picture updated!');
                    return true;
                }
            } catch (e2) {
                console.error('Fallback upload failed:', e2);
            }
        }
        return false;
    };

    // ✅ FIXED: Update guide - /admin/{id}/update/
    const handleUpdateGuide = async (e) => {
        e.preventDefault();
        setGuideLoading(true);
        try {
            const data = {
                full_name: guideForm.full_name,
                phone: guideForm.phone,
                bio: guideForm.bio,
                experience_years: parseInt(guideForm.experience_years) || 0,
                languages: guideForm.languages,
                primary_district: guideForm.primary_district,
                price_per_day: parseFloat(guideForm.price_per_day) || 0,
                price_per_hour: parseFloat(guideForm.price_per_hour) || 0,
                is_verified: true,
                is_active: guideForm.is_active
            };
            if (guideForm.password) { data.password = guideForm.password; }

            // ✅ FIXED: Use /admin/{id}/update/
            const response = await api.patch(`/admin/admin/${editingGuide.id}/update/`, data);
            
            if (response?.data?.success) {
                if (editGuidePicFile) {
                    await handleEditGuideProfilePicUpload(editingGuide.id);
                }
                showToast('✅ Guide updated successfully!');
                setShowGuideModal(false);
                setEditingGuide(null);
                resetGuideForm();
                setEditGuidePicFile(null);
                setEditGuideProfilePic(null);
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to update guide', 'error');
            }
        } catch (error) {
            console.error('Error updating guide:', error);
            
            // Try fallback with PUT
            try {
                const response = await api.put(`/admin/admin/${editingGuide.id}/update/`, {
                    full_name: guideForm.full_name,
                    phone: guideForm.phone,
                    bio: guideForm.bio,
                    experience_years: parseInt(guideForm.experience_years) || 0,
                    languages: guideForm.languages,
                    primary_district: guideForm.primary_district,
                    price_per_day: parseFloat(guideForm.price_per_day) || 0,
                    price_per_hour: parseFloat(guideForm.price_per_hour) || 0,
                    is_verified: true,
                    is_active: guideForm.is_active
                });
                if (response?.data?.success) {
                    if (editGuidePicFile) {
                        await handleEditGuideProfilePicUpload(editingGuide.id);
                    }
                    showToast('✅ Guide updated successfully!');
                    setShowGuideModal(false);
                    setEditingGuide(null);
                    resetGuideForm();
                    setEditGuidePicFile(null);
                    setEditGuideProfilePic(null);
                    dataFetchedRef.current = false;
                    await fetchAllData();
                    setGuideLoading(false);
                    return;
                }
            } catch (e2) {
                console.error('PUT fallback failed:', e2);
            }
            
            showToast(error.response?.data?.error || 'Failed to update guide', 'error');
        } finally {
            setGuideLoading(false);
        }
    };

    // ✅ FIXED: Delete guide - /admin/{id}/delete/
    const deleteGuide = async (id) => {
        if (!window.confirm('Delete this guide?')) return;
        setGuides(prev => prev.filter(g => g.id !== id));
        showToast('🗑️ Deleting guide...');
        try {
            // ✅ FIXED: Use /admin/{id}/delete/
            const response = await api.delete(`/admin/admin/${id}/delete/`);
            if (response?.data?.success || response?.status === 204) {
                showToast('✅ Guide deleted successfully!');
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to delete guide', 'error');
                await fetchAllData();
            }
        } catch (error) {
            console.error('Error deleting guide:', error);
            await fetchAllData();
            showToast('❌ Failed to delete guide. Please try again.', 'error');
        }
    };

    const openEditGuide = (guide) => {
        setEditingGuide(guide);
        const profilePic = guide.profile_image || guide.image || guide.avatar;
        if (profilePic) {
            setEditGuideProfilePic(getProfileImageUrl(profilePic));
        } else {
            setEditGuideProfilePic(null);
        }
        setEditGuidePicFile(null);
        setGuideForm({
            full_name: guide.full_name || '',
            email: guide.email || '',
            password: '',
            phone: guide.phone || '',
            bio: guide.bio || '',
            experience_years: guide.experience_years?.toString() || '',
            languages: guide.languages || '',
            primary_district: guide.primary_district || '',
            price_per_day: guide.price_per_day?.toString() || '',
            price_per_hour: guide.price_per_hour?.toString() || '',
            is_active: guide.is_active !== undefined ? guide.is_active : true
        });
        setShowGuideModal(true);
    };

    const openViewGuide = (guide) => {
        setSelectedGuide(guide);
        setShowGuideViewModal(true);
    };

    const resetGuideForm = () => {
        setGuideForm({
            full_name: '', email: '', password: '', phone: '', bio: '',
            experience_years: '', languages: '', primary_district: '',
            price_per_day: '', price_per_hour: '',
            is_active: true
        });
        setEditGuidePicFile(null);
        setEditGuideProfilePic(null);
    };

    // ============================================
    // ADD INSIGHT - DEFAULT IMPLEMENTED + DELETE
    // ============================================
    const handleAddInsight = async (e) => {
        e.preventDefault();
        setInsightLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', insightForm.name.trim());
            formData.append('description', insightForm.description.trim());
            formData.append('district', insightForm.district);
            formData.append('category', insightForm.category);
            formData.append('suggestion_type', 'local_insight');
            formData.append('status', 'implemented');
            if (insightForm.image) {
                formData.append('image', insightForm.image);
            }

            const response = await api.post('/suggestions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response?.data?.success) {
                showToast('✅ Local Insight added and implemented!');
                setShowAddInsightModal(false);
                setInsightForm({ name: '', description: '', district: '', category: 'general', image: null, imagePreview: null });
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add insight', 'error');
            }
        } catch (error) {
            console.error('Error adding insight:', error);
            showToast(error.response?.data?.error || 'Failed to add insight', 'error');
        } finally {
            setInsightLoading(false);
        }
    };

    // ============================================
    // ADD HIDDEN GEM - DEFAULT IMPLEMENTED + DELETE
    // ============================================
    const handleAddHiddenGem = async (e) => {
        e.preventDefault();
        setHiddenGemLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', hiddenGemForm.name.trim());
            formData.append('description', hiddenGemForm.description.trim());
            formData.append('district', hiddenGemForm.district);
            formData.append('category', hiddenGemForm.category);
            formData.append('suggestion_type', 'hidden_gem');
            formData.append('status', 'implemented');
            if (hiddenGemForm.image) {
                formData.append('image', hiddenGemForm.image);
            }

            const response = await api.post('/suggestions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response?.data?.success) {
                showToast('💎 Hidden Gem added and implemented!');
                setShowAddHiddenGemModal(false);
                setHiddenGemForm({ name: '', description: '', district: '', category: 'hidden', image: null, imagePreview: null });
                dataFetchedRef.current = false;
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add hidden gem', 'error');
            }
        } catch (error) {
            console.error('Error adding hidden gem:', error);
            showToast(error.response?.data?.error || 'Failed to add hidden gem', 'error');
        } finally {
            setHiddenGemLoading(false);
        }
    };

    // ============================================
    // DELETE SUGGESTION
    // ============================================
    const deleteSuggestion = async (id, type = 'suggestion') => {
        if (!window.confirm(`Delete this ${type}?`)) return;
        setActionLoading(true);
        setProcessingId(id);
        
        try {
            const response = await api.delete(`/suggestions/admin-suggestions/${id}/delete/`);
            if (response?.data?.success) {
                showToast(`🗑️ ${type} deleted successfully!`);
                dataFetchedRef.current = false;
                await fetchAllData();
                setActionLoading(false);
                setProcessingId(null);
                return;
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
        
        showToast(`❌ Failed to delete ${type}`, 'error');
        setActionLoading(false);
        setProcessingId(null);
    };

    // ============================================
    // SUGGESTION PROCESSING
    // ============================================
    const processSuggestion = async (id, action, type = 'suggestion') => {
        setActionLoading(true);
        setProcessingId(id);

        try {
            if (action === 'delete') {
                if (!window.confirm('Delete this suggestion permanently?')) {
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }
                
                setAllSuggestions(prev => prev.filter(s => s.id !== id));
                setHiddenGems(prev => prev.filter(s => s.id !== id));
                setLocalInsights(prev => prev.filter(s => s.id !== id));
                setReviews(prev => prev.filter(s => s.id !== id));
                
                try {
                    const response = await api.delete(`/suggestions/admin-suggestions/${id}/delete/`);
                    if (response?.data?.success) {
                        showToast('🗑️ Deleted successfully!');
                        dataFetchedRef.current = false;
                        await fetchAllData();
                        if (showSuggestionModal) { setShowSuggestionModal(false); setSelectedSuggestion(null); }
                        setActionLoading(false);
                        setProcessingId(null);
                        return;
                    }
                } catch (error) {
                    console.error('Delete failed:', error);
                    await fetchAllData();
                }
                showToast('⚠️ Could not delete. Please try again.', 'error');
                setActionLoading(false);
                setProcessingId(null);
                return;
            }

            if (action === 'implement') {
                const notes = `✅ Implemented by Admin: ${user?.email || 'Admin'}`;
                try {
                    const response = await api.post(`/suggestions/admin-suggestions/${id}/implement/`, { notes });
                    if (response?.data?.success) {
                        showToast(`✅ ${type} implemented successfully!`);
                        dataFetchedRef.current = false;
                        await fetchAllData();
                        if (showSuggestionModal) { setShowSuggestionModal(false); setSelectedSuggestion(null); }
                        setActionLoading(false);
                        setProcessingId(null);
                        return;
                    }
                } catch (error) {
                    console.error('Implement failed:', error);
                }
            }

            if (action === 'reject') {
                const notes = prompt('Reason for rejection:');
                if (notes === null) {
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }
                try {
                    const response = await api.post(`/suggestions/admin-suggestions/${id}/reject/`, { notes });
                    if (response?.data?.success) {
                        showToast(`❌ ${type} rejected!`);
                        dataFetchedRef.current = false;
                        await fetchAllData();
                        if (showSuggestionModal) { setShowSuggestionModal(false); setSelectedSuggestion(null); }
                        setActionLoading(false);
                        setProcessingId(null);
                        return;
                    }
                } catch (error) {
                    console.error('Reject failed:', error);
                }
            }

            showToast(`❌ Failed to ${action} ${type}`, 'error');
        } catch (error) {
            console.error('Error processing suggestion:', error);
            showToast(`❌ Failed to ${action} ${type}`, 'error');
        } finally {
            setActionLoading(false);
            setProcessingId(null);
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

    const filteredStaff = useMemo(() => {
        if (staffFilter === 'all') return staff;
        return staff.filter(s => s.is_active === (staffFilter === 'active'));
    }, [staff, staffFilter]);

    const filteredGuides = useMemo(() => {
        if (guidesFilter === 'all') return guides;
        if (guidesFilter === 'verified') return guides.filter(g => g.is_verified);
        if (guidesFilter === 'unverified') return guides.filter(g => !g.is_verified);
        if (guidesFilter === 'active') return guides.filter(g => g.is_active !== false);
        if (guidesFilter === 'inactive') return guides.filter(g => g.is_active === false);
        return guides;
    }, [guides, guidesFilter]);

    const filteredPlaces = useMemo(() => {
        let filtered = [...allPlaces];
        if (placesFilter !== 'all') {
            filtered = filtered.filter(p => p.type === placesFilter);
        }
        if (placesSearch.trim()) {
            const search = placesSearch.toLowerCase().trim();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(search) ||
                p.location.toLowerCase().includes(search) ||
                p.category_title.toLowerCase().includes(search) ||
                (p.description && p.description.toLowerCase().includes(search))
            );
        }
        return filtered;
    }, [allPlaces, placesFilter, placesSearch]);

    // ============================================
    // PAGINATION HELPERS
    // ============================================
    const getPaginatedData = (data, page) => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return data.slice(startIndex, endIndex);
    };

    const getTotalPages = (data) => Math.ceil(data.length / ITEMS_PER_PAGE);

    useEffect(() => { setHiddenGemsPage(1); }, [hiddenGemsFilter]);
    useEffect(() => { setLocalInsightsPage(1); }, [localInsightsFilter]);
    useEffect(() => { setReviewsPage(1); }, [reviewsFilter]);
    useEffect(() => { setStaffPage(1); }, [staffFilter]);
    useEffect(() => { setGuidesPage(1); }, [guidesFilter]);
    useEffect(() => { setPlacesPage(1); }, [placesFilter, placesSearch]);

    // ============================================
    // GET TYPE FUNCTIONS
    // ============================================
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
    // RENDER FUNCTIONS
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

    const renderSuggestionCard = (s, typeLabel) => {
        const imageUrl = getImageUrl(s);
        const hasImage = !!imageUrl;

        const getFallbackEmoji = () => {
            switch (s.suggestion_type) {
                case 'hidden_gem': return '💎';
                case 'local_insight': return '💡';
                case 'review': return '⭐';
                default: return '📍';
            }
        };

        const isImplemented = s.status === 'implemented';
        const isPending = s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin';

        return (
            <div key={s.id} style={{ display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${isImplemented ? C.success : isPending ? C.warn : C.line}`, alignItems: 'flex-start', transition: 'all 0.2s ease', cursor: 'pointer' }} 
                onClick={() => { setSelectedSuggestion(s); setShowSuggestionModal(true); }}>
                <div style={{ width: 80, height: 80, borderRadius: RADIUS.sm, background: C.paper, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                    {isImplemented && (
                        <div style={{ position: 'absolute', top: 4, right: 4, background: C.success, color: '#fff', padding: '2px 6px', borderRadius: 999, fontSize: 8, fontWeight: 600 }}>✅</div>
                    )}
                    {hasImage && imageUrl ? (
                        <img src={imageUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; const parent = e.target.parentElement; if (parent) { parent.innerHTML = `<span style="font-size: 32px;">${getFallbackEmoji()}</span>`; } }} />
                    ) : <span style={{ fontSize: 32 }}>{getFallbackEmoji()}</span>}
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
                        <StatusPill status={s.status || 'pending'} />
                    </div>
                    <p style={{ fontSize: 12.5, color: C.sage, margin: '6px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {s.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {isPending && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'implement', s.suggestion_type); }}
                                    disabled={actionLoading} style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: '#2563EB', color: '#fff', fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === s.id ? 0.5 : 1 }}>
                                    <CheckCircle size={11} /> Implement
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'reject', s.suggestion_type); }}
                                    disabled={actionLoading} style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: 'transparent', color: C.danger, fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === s.id ? 0.5 : 1 }}>
                                    <X size={11} /> Reject
                                </button>
                            </>
                        )}
                        {s.status === 'implemented' && (
                            <span style={{ padding: '4px 12px', borderRadius: 999, background: C.warnBg, color: C.gold, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>✨ Implemented</span>
                        )}
                        {s.status === 'rejected' && (
                            <span style={{ padding: '4px 12px', borderRadius: 999, background: C.dangerBg, color: C.danger, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>❌ Rejected</span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'delete', s.suggestion_type); }}
                            disabled={actionLoading} style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 11, cursor: actionLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: actionLoading && processingId === s.id ? 0.5 : 1 }}>
                            <Trash2 size={11} /> Delete
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedSuggestion(s); setShowSuggestionModal(true); }}
                            style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.line}`, background: 'transparent', color: C.sage, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={11} /> View
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderCategoryCard = (cat) => {
        const places = cat.places || [];
        const imageUrl = cat.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80';
        
        return (
            <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', background: C.paper, borderRadius: RADIUS.md, border: `1px solid ${C.line}`, overflow: 'hidden', transition: 'all 0.2s ease' }}>
                <div style={{ height: 140, overflow: 'hidden', position: 'relative', background: `linear-gradient(135deg, ${C.ink}, #0A4A44)` }}>
                    <img src={imageUrl} alt={cat.title || cat.key} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'; }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <h4 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0, fontFamily: FONT.display }}>{cat.title || cat.key}</h4>
                        <span style={{ fontSize: 11, color: C.goldLight, background: 'rgba(0,0,0,0.4)', padding: '2px 10px', borderRadius: 999 }}>{places.length} places</span>
                    </div>
                </div>
                <div style={{ padding: 14 }}>
                    <p style={{ fontSize: 12.5, color: C.sage, margin: '0 0 10px', lineHeight: 1.5 }}>{cat.description || 'No description'}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => { setEditingCategory(cat); setEditCategoryForm({ title: cat.title || '', description: cat.description || '', image: cat.image || '', type: cat.type || 'Nature & Outdoor', is_active: true }); setShowEditCategoryModal(true); }} 
                            style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.line}`, background: 'transparent', color: C.sage, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Edit2 size={11} /> Edit
                        </button>
                        <button onClick={() => { setSelectedCategoryKey(cat.key); setPlaceForm({ name: '', location: '', description: '', difficulty: '', duration: '', best_time: '', image: '', type: 'well-known', hidden_gem: '' }); setEditingPlace(null); setShowPlaceModal(true); }} 
                            style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: C.ink, color: C.goldLight, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Plus size={11} /> Add Place
                        </button>
                        <button onClick={() => deleteCategory(cat.key)} 
                            style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Trash2 size={11} /> Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPlaceCard = (place) => {
        const imageUrl = place.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80';
        
        return (
            <div key={place.id} style={{ display: 'flex', flexDirection: 'column', background: C.paper, borderRadius: RADIUS.md, border: `1px solid ${C.line}`, overflow: 'hidden', transition: 'all 0.2s ease' }}>
                <div style={{ height: 120, overflow: 'hidden', position: 'relative', background: `linear-gradient(135deg, ${C.ink}, #0A4A44)` }}>
                    <img src={imageUrl} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'; }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0, fontFamily: FONT.display }}>{place.name}</h4>
                            <span style={{ fontSize: 10, color: C.goldLight, opacity: 0.8 }}>{place.category_title || place.category_key}</span>
                        </div>
                        <span style={{ fontSize: 9, padding: '2px 10px', borderRadius: 999, background: place.type === 'hidden' ? 'rgba(199,154,62,0.3)' : 'rgba(46,125,50,0.3)', color: place.type === 'hidden' ? C.goldLight : '#4CAF50', border: `1px solid ${place.type === 'hidden' ? C.gold : '#4CAF50'}` }}>
                            {place.type === 'hidden' ? '✨ Hidden' : '⭐ Well Known'}
                        </span>
                    </div>
                </div>
                <div style={{ padding: 12 }}>
                    <p style={{ fontSize: 12, color: C.sage, margin: '0 0 8px', lineHeight: 1.4 }}>{place.description || 'No description'}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => { setEditingPlace(place); setPlaceForm({ name: place.name || '', location: place.location || '', description: place.description || '', difficulty: place.difficulty || '', duration: place.duration || '', best_time: place.best_time || '', image: place.image || '', type: place.type || 'well-known', hidden_gem: place.hidden_gem || '' }); setShowPlaceModal(true); }} 
                            style={{ padding: '3px 10px', borderRadius: 999, border: `1px solid ${C.line}`, background: 'transparent', color: C.sage, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Edit2 size={10} /> Edit
                        </button>
                        <button onClick={() => deletePlace(place.id)} 
                            style={{ padding: '3px 10px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Trash2 size={10} /> Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderGuideCard = (guide) => {
        const guideImageUrl = guide.profile_image || guide.image || guide.avatar;
        const imageUrl = guideImageUrl ? getProfileImageUrl(guideImageUrl) : null;

        return (
            <div key={guide.id} style={{ display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${guide.is_verified ? C.success : C.warn}44`, alignItems: 'flex-start', transition: 'all 0.2s ease' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: guide.is_verified ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : C.line, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', fontSize: 20, fontWeight: 600, color: C.ink, border: `2px solid ${guide.is_verified ? C.gold : C.sage}44` }}>
                    {imageUrl ? <img src={imageUrl} alt={guide.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : guide.full_name?.charAt(0)?.toUpperCase() || 'G'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>{guide.full_name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                <span style={{ fontSize: 11, color: C.sage }}>{guide.email}</span>
                                <span style={{ fontSize: 11, color: C.sage }}>· {guide.primary_district || 'N/A'}</span>
                                {guide.rating > 0 && <span style={{ fontSize: 11, color: C.gold }}>{'★'.repeat(Math.round(guide.rating))} {guide.rating}</span>}
                            </div>
                        </div>
                        <StatusPill status={guide.is_verified ? 'verified' : 'unverified'} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 11, color: C.sage }}>
                        <span>💼 {guide.experience_years || 0} years</span>
                        <span>💰 ₹{guide.price_per_day || 0}/day</span>
                        <span>📚 {guide.languages || 'N/A'}</span>
                        {guide.phone && <span>📱 {guide.phone}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        <button onClick={() => openViewGuide(guide)} 
                            style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.gold}`, background: 'transparent', color: C.gold, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Eye size={11} /> View Profile
                        </button>
                        <button onClick={() => openEditGuide(guide)} 
                            style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.line}`, background: 'transparent', color: C.sage, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Edit2 size={11} /> Edit
                        </button>
                        <button onClick={() => deleteGuide(guide.id)} 
                            style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Trash2 size={11} /> Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderTouristerCard = (u) => (
        <div key={u.id} style={{ display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${C.line}`, alignItems: 'flex-start', transition: 'all 0.2s ease' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', fontSize: 18, fontWeight: 600, color: C.ink }}>
                {u.profile_image ? <img src={u.profile_image} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>{u.first_name || ''} {u.last_name || ''}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                            <span style={{ fontSize: 11, color: C.sage }}>{u.email}</span>
                            <span style={{ fontSize: 11, color: C.sage }}>· @{u.username || 'N/A'}</span>
                        </div>
                    </div>
                    <StatusPill status={u.is_active !== false ? 'active' : 'inactive'} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <button onClick={() => {
                        if (!window.confirm(`${u.is_active !== false ? 'Deactivate' : 'Activate'} this tourister?`)) return;
                        setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, is_active: !u.is_active } : usr));
                        setTouristers(prev => prev.map(usr => usr.id === u.id ? { ...usr, is_active: !u.is_active } : usr));
                        api.post(`/admin/admin/${u.id}/users/toggle-status/`, { is_active: !u.is_active })
                            .then(() => { showToast(`✅ Tourister ${u.is_active !== false ? 'deactivated' : 'activated'}!`); fetchAllData(); })
                            .catch(() => { showToast('❌ Failed to update status', 'error'); fetchAllData(); });
                    }} style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: u.is_active !== false ? C.dangerBg : C.successBg, color: u.is_active !== false ? C.danger : C.success, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {u.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => deleteUser(u.id)} style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={11} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStaffCard = (s) => (
        <div key={s.id} style={{ display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${C.line}`, alignItems: 'flex-start', transition: 'all 0.2s ease' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', fontSize: 18, fontWeight: 600, color: C.ink }}>
                {s.profile_image ? <img src={s.profile_image} alt={s.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.email?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div><h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>{s.first_name || ''} {s.last_name || ''}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}><span style={{ fontSize: 11, color: C.sage }}>{s.email}</span></div>
                    </div>
                    <StatusPill status={s.is_active !== false ? 'active' : 'inactive'} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <button onClick={() => {
                        if (!window.confirm(`${s.is_active !== false ? 'Deactivate' : 'Activate'} this staff member?`)) return;
                        setStaff(prev => prev.map(st => st.id === s.id ? { ...st, is_active: !s.is_active } : st));
                        api.post(`/admin/admin/${s.id}/staff/toggle-status/`, { is_active: !s.is_active })
                            .then(() => { showToast(`✅ Staff ${s.is_active !== false ? 'deactivated' : 'activated'}!`); fetchAllData(); })
                            .catch(() => { showToast('❌ Failed to update status', 'error'); fetchAllData(); });
                    }} style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: s.is_active !== false ? C.dangerBg : C.successBg, color: s.is_active !== false ? C.danger : C.success, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {s.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => deleteStaff(s.id)} style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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
                    <p style={{ marginTop: 14, color: C.sage, fontFamily: FONT.display, fontStyle: 'italic', fontSize: 15 }}>Loading admin dashboard…</p>
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
                .ad-nav-item:hover { background: ${C.goldSoft} !important; }
                .ad-sidebar-scroll::-webkit-scrollbar { width: 4px; }
                .ad-sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(199,154,62,0.3); border-radius: 4px; }
                .ad-content-scroll::-webkit-scrollbar { width: 6px; }
                .ad-content-scroll::-webkit-scrollbar-thumb { background: rgba(199,154,62,0.3); border-radius: 4px; }
                input:focus, textarea:focus, select:focus { border-color: ${C.gold} !important; box-shadow: 0 0 0 3px rgba(199,154,62,0.12); }
            `}</style>

            {/* SIDEBAR */}
            <aside style={{ width: SIDEBAR_W, minWidth: SIDEBAR_W, height: '100vh', background: C.paper, borderRight: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                <div className="ad-sidebar-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: 10 }}>
                    <div style={{ padding: '24px 22px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Shield size={16} color={C.goldLight} /></div>
                            <div style={{ minWidth: 0 }}>
                                <h1 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 17, color: C.inkSoft, margin: 0, lineHeight: 1.1 }}>Admin Panel</h1>
                                <p style={{ fontFamily: FONT.mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.sageLight, margin: '3px 0 0' }}>Administration</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ margin: '0 14px 18px', padding: 13, borderRadius: RADIUS.md, background: C.cream, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: C.ink, overflow: 'hidden', flexShrink: 0 }}>
                            {profilePicture ? <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A')}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || user?.first_name || 'Admin'}</p>
                            <span style={{ fontSize: 10.5, color: C.sage, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}><Shield size={10} /> Administrator</span>
                        </div>
                    </div>

                    <nav style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                        {navItems.map((item) => {
                            const isActive = activeTab === item.key;
                            const count = item.badge || 0;
                            return (
                                <button key={item.key} className="ad-nav-item" onClick={() => setActiveTab(item.key)}
                                    style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 10px 16px', width: '100%', background: isActive ? C.goldSoft : 'transparent', border: 'none', borderRadius: RADIUS.sm, color: isActive ? '#8A6A1F' : C.sage, fontSize: 13.5, fontFamily: FONT.body, fontWeight: isActive ? 600 : 500, cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left' }}>
                                    {isActive && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 16, borderRadius: 2, background: C.gold }} />}
                                    <item.icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }} />
                                    <span style={{ flex: 1 }}>{item.label}</span>
                                    {count > 0 && <span style={{ fontFamily: FONT.mono, fontSize: 10, padding: '1px 7px', borderRadius: 999, background: isActive ? 'rgba(199,154,62,0.28)' : C.warnBg, color: '#8A6A1F' }}>{count}</span>}
                                </button>
                            );
                        })}
                    </nav>

                    <div style={{ flex: 1 }} />

                    <div style={{ padding: '14px 14px 20px', borderTop: `1px solid ${C.line}`, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button onClick={() => { dataFetchedRef.current = false; setRefreshing(true); fetchAllData().finally(() => setRefreshing(false)); }} disabled={refreshing} style={{ padding: '9px 14px', borderRadius: RADIUS.sm, border: `1px solid ${C.line}`, background: 'transparent', color: C.inkSoft, cursor: refreshing ? 'not-allowed' : 'pointer', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.body, opacity: refreshing ? 0.6 : 1 }}>
                            <RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined} /> {refreshing ? 'Refreshing…' : 'Refresh'}
                        </button>
                        <button onClick={logout} style={{ padding: '9px 14px', borderRadius: RADIUS.sm, border: 'none', background: 'transparent', color: C.sage, cursor: 'pointer', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.body }}>
                            <LogOut size={13} /> Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="ad-content-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px 28px 60px' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        {/* Page header - REMOVED Add Insight and Add Hidden Gem buttons from header */}
                        <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <p style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, margin: '0 0 5px' }}>
                                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <h2 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 26, color: C.inkSoft, margin: 0 }}>{activeNavItem?.label}</h2>
                            </div>
                            <Btn variant="ghost" icon={RefreshCw} onClick={() => { dataFetchedRef.current = false; setRefreshing(true); fetchAllData().finally(() => setRefreshing(false)); }} disabled={refreshing} style={{ opacity: refreshing ? 0.6 : 1 }}>
                                {refreshing ? 'Updating…' : 'Update'}
                            </Btn>
                        </div>

                        {/* STATS */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
                            <StatChip label="Touristers" value={stats.totalUsers} icon={Users} />
                            <StatChip label="Staff" value={stats.totalStaff} icon={Shield} tone="gold" />
                            <StatChip label="Guides" value={stats.totalGuides} icon={UserCheck} tone="gold" />
                            <StatChip label="Categories" value={stats.totalCategories} icon={LayoutGrid} tone="gold" />
                            <StatChip label="Places" value={stats.totalPlaces} icon={Map} />
                            <StatChip label="Hidden Gems" value={stats.totalHiddenGems} icon={Sparkles} tone="gold" />
                            <StatChip label="Local Insights" value={stats.totalLocalInsights} icon={Lightbulb} tone="gold" />
                            <StatChip label="Reviews" value={stats.totalReviews} icon={Star} tone="gold" />
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                                <Card style={{ padding: 20 }}>
                                    <SectionHead icon={LayoutGrid} title="Categories Overview" />
                                    {categories.slice(0, 5).length === 0 ? (
                                        <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '24px 0' }}>No categories yet.</p>
                                    ) : (
                                        categories.slice(0, 5).map((cat) => (
                                            <div key={cat.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.line}` }}>
                                                <div><p style={{ margin: 0, fontSize: 13, color: C.inkSoft, fontWeight: 500 }}>{cat.title}</p><p style={{ margin: '2px 0 0', fontSize: 11, color: C.sage }}>{cat.places?.length || 0} places</p></div>
                                                <span style={{ fontSize: 11, color: C.sage }}>{cat.key}</span>
                                            </div>
                                        ))
                                    )}
                                </Card>
                                <Card style={{ padding: 20 }}>
                                    <SectionHead icon={MessageSquare} title="Recent Suggestions" />
                                    {allSuggestions.slice(0, 5).length === 0 ? (
                                        <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '24px 0' }}>No suggestions yet.</p>
                                    ) : (
                                        allSuggestions.slice(0, 5).map((s) => (
                                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.line}` }}>
                                                <div><p style={{ margin: 0, fontSize: 13, color: C.inkSoft, fontWeight: 500 }}>{s.name}</p><p style={{ margin: '2px 0 0', fontSize: 11, color: C.sage }}>{s.user_email || 'Anonymous'} · {s.district || 'N/A'}</p></div>
                                                <StatusPill status={s.status} />
                                            </div>
                                        ))
                                    )}
                                </Card>
                            </div>
                        )}

                        {/* Categories Tab */}
                        {activeTab === 'categories' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>📂 Categories</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage categories and places</p></div>
                                    <Btn variant="primary" icon={Plus} size="sm" onClick={() => { setCategoryForm({ key: '', label: '', description: '', image: '', type: 'Nature & Outdoor' }); setShowCategoryModal(true); }}>Add Category</Btn>
                                </div>
                                {categories.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No categories found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                                            {getPaginatedData(categories, categoriesPage).map((cat) => renderCategoryCard(cat))}
                                        </div>
                                        <Pagination currentPage={categoriesPage} totalPages={getTotalPages(categories)} onPageChange={setCategoriesPage} totalItems={categories.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Places Tab */}
                        {activeTab === 'places' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>📍 All Places</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage all places ({allPlaces.length} total)</p></div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <input type="text" placeholder="🔍 Search places..." value={placesSearch} onChange={(e) => setPlacesSearch(e.target.value)} style={{ ...inputStyle, minWidth: '180px', padding: '7px 12px', fontSize: 12 }} />
                                        <select value={placesFilter} onChange={(e) => setPlacesFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All Types</option>
                                            <option value="well-known">⭐ Well Known</option>
                                            <option value="hidden">✨ Hidden Gems</option>
                                        </select>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button onClick={() => setViewMode('grid')} style={{ padding: '7px 10px', borderRadius: RADIUS.sm, border: `1px solid ${viewMode === 'grid' ? C.gold : C.line}`, background: viewMode === 'grid' ? C.goldSoft : 'transparent', color: viewMode === 'grid' ? C.gold : C.sage, cursor: 'pointer' }}><Grid size={16} /></button>
                                            <button onClick={() => setViewMode('list')} style={{ padding: '7px 10px', borderRadius: RADIUS.sm, border: `1px solid ${viewMode === 'list' ? C.gold : C.line}`, background: viewMode === 'list' ? C.goldSoft : 'transparent', color: viewMode === 'list' ? C.gold : C.sage, cursor: 'pointer' }}><List size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                                {filteredPlaces.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No places found.</p>
                                ) : (
                                    <>
                                        {viewMode === 'grid' ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                                {getPaginatedData(filteredPlaces, placesPage).map((place) => renderPlaceCard(place))}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                {getPaginatedData(filteredPlaces, placesPage).map((place) => renderPlaceCard(place))}
                                            </div>
                                        )}
                                        <Pagination currentPage={placesPage} totalPages={getTotalPages(filteredPlaces)} onPageChange={setPlacesPage} totalItems={filteredPlaces.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Hidden Gems Tab - WITH Add Hidden Gem Button */}
                        {activeTab === 'hidden-gems' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead icon={Sparkles} title="Hidden Gems" count={hiddenGems.length}
                                    right={
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <select value={hiddenGemsFilter} onChange={(e) => setHiddenGemsFilter(e.target.value)} style={selectStyle}>
                                                <option value="all">All Status ({hiddenGems.length})</option>
                                                <option value="pending">⏳ Pending ({hiddenGems.filter(s => s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin').length})</option>
                                                <option value="implemented">✨ Implemented ({hiddenGems.filter(s => s.status === 'implemented').length})</option>
                                                <option value="rejected">❌ Rejected ({hiddenGems.filter(s => s.status === 'rejected' || s.status === 'rejected_by_guide' || s.status === 'rejected_by_admin' || s.status === 'staff_rejected').length})</option>
                                            </select>
                                            <Btn variant="gold" icon={Plus} size="sm" onClick={() => setShowAddHiddenGemModal(true)}>
                                                Add Hidden Gem
                                            </Btn>
                                        </div>
                                    }
                                />
                                {filteredHiddenGems.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No hidden gems found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>{getPaginatedData(filteredHiddenGems, hiddenGemsPage).map((s) => renderSuggestionCard(s, 'Hidden Gem'))}</div>
                                        <Pagination currentPage={hiddenGemsPage} totalPages={getTotalPages(filteredHiddenGems)} onPageChange={setHiddenGemsPage} totalItems={filteredHiddenGems.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </Card>
                        )}

                        {/* Local Insights Tab - WITH Add Insight Button */}
                        {activeTab === 'local-insights' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead icon={Lightbulb} title="Local Insights" count={localInsights.length}
                                    right={
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <select value={localInsightsFilter} onChange={(e) => setLocalInsightsFilter(e.target.value)} style={selectStyle}>
                                                <option value="all">All Status ({localInsights.length})</option>
                                                <option value="pending">⏳ Pending ({localInsights.filter(s => s.status === 'pending' || s.status === 'pending_guide' || s.status === 'pending_admin').length})</option>
                                                <option value="implemented">✨ Implemented ({localInsights.filter(s => s.status === 'implemented').length})</option>
                                                <option value="rejected">❌ Rejected ({localInsights.filter(s => s.status === 'rejected' || s.status === 'rejected_by_guide' || s.status === 'rejected_by_admin' || s.status === 'staff_rejected').length})</option>
                                            </select>
                                            <Btn variant="primary" icon={Plus} size="sm" onClick={() => setShowAddInsightModal(true)}>
                                                Add Insight
                                            </Btn>
                                        </div>
                                    }
                                />
                                {filteredLocalInsights.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No local insights found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>{getPaginatedData(filteredLocalInsights, localInsightsPage).map((s) => renderSuggestionCard(s, 'Local Insight'))}</div>
                                        <Pagination currentPage={localInsightsPage} totalPages={getTotalPages(filteredLocalInsights)} onPageChange={setLocalInsightsPage} totalItems={filteredLocalInsights.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </Card>
                        )}

                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <Card style={{ padding: 22 }}>
                                <SectionHead icon={Star} title="Reviews" count={reviews.length}
                                    right={<select value={reviewsFilter} onChange={(e) => setReviewsFilter(e.target.value)} style={selectStyle}>
                                        <option value="all">All Status ({reviews.length})</option>
                                        <option value="pending">⏳ Pending ({reviews.filter(r => r.status === 'pending' || r.status === 'pending_guide' || r.status === 'pending_admin').length})</option>
                                        <option value="implemented">✨ Implemented ({reviews.filter(r => r.status === 'implemented').length})</option>
                                        <option value="rejected">❌ Rejected ({reviews.filter(r => r.status === 'rejected' || r.status === 'rejected_by_guide' || r.status === 'rejected_by_admin' || r.status === 'staff_rejected').length})</option>
                                    </select>}
                                />
                                {filteredReviews.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No reviews found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>{getPaginatedData(filteredReviews, reviewsPage).map((s) => renderSuggestionCard(s, 'Review'))}</div>
                                        <Pagination currentPage={reviewsPage} totalPages={getTotalPages(filteredReviews)} onPageChange={setReviewsPage} totalItems={filteredReviews.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </Card>
                        )}

                        {/* Touristers Tab */}
                        {activeTab === 'touristers' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>👥 Touristers</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage all touristers ({touristers.length} total)</p></div>
                                </div>
                                {touristers.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No touristers found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>{getPaginatedData(touristers, usersPage).map((u) => renderTouristerCard(u))}</div>
                                        <Pagination currentPage={usersPage} totalPages={getTotalPages(touristers)} onPageChange={setUsersPage} totalItems={touristers.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Staff Tab */}
                        {activeTab === 'staff' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>👔 Staff</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage staff members ({staff.length} total)</p></div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All</option><option value="active">🟢 Active</option><option value="inactive">🔴 Inactive</option>
                                        </select>
                                        <Btn variant="primary" icon={Plus} size="sm" onClick={() => { setStaffForm({ email: '', password: '' }); setShowStaffModal(true); }}>Add Staff</Btn>
                                    </div>
                                </div>
                                {staff.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No staff members found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>{getPaginatedData(filteredStaff, staffPage).map((s) => renderStaffCard(s))}</div>
                                        <Pagination currentPage={staffPage} totalPages={getTotalPages(filteredStaff)} onPageChange={setStaffPage} totalItems={filteredStaff.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Guides Tab */}
                        {activeTab === 'guides' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>🧭 Guides</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage tour guides ({guides.length} total)</p></div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select value={guidesFilter} onChange={(e) => setGuidesFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All</option><option value="verified">✅ Verified</option><option value="unverified">⏳ Unverified</option>
                                            <option value="active">🟢 Active</option><option value="inactive">🔴 Inactive</option>
                                        </select>
                                        <Btn variant="primary" icon={Plus} size="sm" onClick={() => { resetGuideForm(); setEditingGuide(null); setShowGuideModal(true); }}>Add Guide</Btn>
                                    </div>
                                </div>
                                {guides.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No guides found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>{getPaginatedData(filteredGuides, guidesPage).map((g) => renderGuideCard(g))}</div>
                                        <Pagination currentPage={guidesPage} totalPages={getTotalPages(filteredGuides)} onPageChange={setGuidesPage} totalItems={filteredGuides.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================
                MODALS
            ============================================ */}

            {/* Profile Modal */}
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
                                {profilePicture ? <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A')}
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
                            <h4 style={{ fontSize: 17, color: C.inkSoft, margin: 0, fontFamily: FONT.display }}>{profile?.full_name || user?.first_name || 'Admin'}</h4>
                            <p style={{ fontSize: 13, color: C.sage, margin: '2px 0 0' }}>{profile?.department || 'Admin'} · {profile?.position || 'Administrator'}</p>
                            <span style={{ fontSize: 12, color: C.sage, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Shield size={12} /> {user?.role || 'admin'}
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
                                <Btn type="submit" variant="primary" icon={Save} disabled={loading}>
                                    {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                    {loading ? 'Saving...' : 'Save Profile'}
                                </Btn>
                                <Btn type="button" variant="ghost" onClick={() => setIsEditingProfile(false)}>Cancel</Btn>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '7px 20px' }}>
                            <span style={{ color: C.sage, fontSize: 13 }}>Name</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.full_name || user?.first_name || 'Not set'}</span>
                            <span style={{ color: C.sage, fontSize: 13 }}>Email</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{user?.email}</span>
                            <span style={{ color: C.sage, fontSize: 13 }}>Phone</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.phone || 'Not set'}</span>
                            <span style={{ color: C.sage, fontSize: 13 }}>Department</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.department || 'Admin'}</span>
                            <span style={{ color: C.sage, fontSize: 13 }}>Position</span><span style={{ color: C.inkSoft, fontSize: 13 }}>{profile?.position || 'Administrator'}</span>
                            <span style={{ color: C.sage, fontSize: 13 }}>Role</span><span style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>{user?.role || 'admin'}</span>
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

            {/* Category Modal - Add */}
            {showCategoryModal && (
                <ModalShell onClose={() => { setShowCategoryModal(false); setCategoryForm({ key: '', label: '', description: '', image: '', type: 'Nature & Outdoor' }); }}
                    title="Add Category" subtitle="Create a new category" icon={FolderPlus}
                    footer={<><Btn variant="ghost" onClick={() => { setShowCategoryModal(false); setCategoryForm({ key: '', label: '', description: '', image: '', type: 'Nature & Outdoor' }); }}>Cancel</Btn>
                        <Btn variant="primary" icon={Plus} onClick={handleAddCategory} disabled={categoryLoading}>
                            {categoryLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {categoryLoading ? 'Adding...' : 'Add Category'}
                        </Btn></>}
                >
                    <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category Name <span style={{ color: C.danger }}>*</span></label>
                            <input type="text" value={categoryForm.label} onChange={(e) => { const label = e.target.value; setCategoryForm({ ...categoryForm, label: label, key: label.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }); }} style={inputStyle} required placeholder="e.g., Adventure Sports" /></div>
                        {categoryForm.key && <div style={{ padding: 8, background: C.cream, borderRadius: RADIUS.sm, border: `1px solid ${C.line}` }}><p style={{ fontSize: 10, color: C.sage, margin: 0 }}>🔑 Key: <span style={{ fontFamily: FONT.mono, fontWeight: 600, color: C.ink }}>{categoryForm.key}</span></p></div>}
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                            <textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} rows={3} placeholder="Describe this category..." /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</label>
                            <select value={categoryForm.type} onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })} style={selectStyle}>
                                <option value="Nature & Outdoor">Nature & Outdoor</option>
                                <option value="Adventure & Activities">Adventure & Activities</option>
                                <option value="Parks & Recreation">Parks & Recreation</option>
                                <option value="Cultural & Heritage">Cultural & Heritage</option>
                                <option value="Wellness & Relaxation">Wellness & Relaxation</option>
                            </select></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image URL</label>
                            <input type="url" value={categoryForm.image} onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })} style={inputStyle} placeholder="https://images.unsplash.com/..." /></div>
                    </form>
                </ModalShell>
            )}

            {/* Edit Category Modal */}
            {showEditCategoryModal && (
                <ModalShell onClose={() => { setShowEditCategoryModal(false); setEditingCategory(null); setEditCategoryForm({ title: '', description: '', image: '', type: 'Nature & Outdoor', is_active: true }); }}
                    title="✏️ Edit Category" subtitle={`Editing: ${editingCategory?.title || editingCategory?.key}`} icon={Edit2}
                    footer={<><Btn variant="ghost" onClick={() => { setShowEditCategoryModal(false); setEditingCategory(null); setEditCategoryForm({ title: '', description: '', image: '', type: 'Nature & Outdoor', is_active: true }); }}>Cancel</Btn>
                        <Btn variant="primary" icon={Save} onClick={handleEditCategory} disabled={categoryLoading}>
                            {categoryLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {categoryLoading ? 'Saving...' : 'Update Category'}
                        </Btn></>}
                >
                    <form onSubmit={handleEditCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category Title <span style={{ color: C.danger }}>*</span></label>
                            <input type="text" value={editCategoryForm.title} onChange={(e) => setEditCategoryForm({ ...editCategoryForm, title: e.target.value })} style={inputStyle} required placeholder="Category title" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                            <textarea value={editCategoryForm.description} onChange={(e) => setEditCategoryForm({ ...editCategoryForm, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} rows={3} placeholder="Describe this category..." /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</label>
                            <select value={editCategoryForm.type} onChange={(e) => setEditCategoryForm({ ...editCategoryForm, type: e.target.value })} style={selectStyle}>
                                <option value="Nature & Outdoor">Nature & Outdoor</option>
                                <option value="Adventure & Activities">Adventure & Activities</option>
                                <option value="Parks & Recreation">Parks & Recreation</option>
                                <option value="Cultural & Heritage">Cultural & Heritage</option>
                                <option value="Wellness & Relaxation">Wellness & Relaxation</option>
                            </select></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image URL</label>
                            <input type="url" value={editCategoryForm.image} onChange={(e) => setEditCategoryForm({ ...editCategoryForm, image: e.target.value })} style={inputStyle} placeholder="https://images.unsplash.com/..." /></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <label style={{ fontSize: 11, color: C.sageLight, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</label>
                            <button type="button" onClick={() => setEditCategoryForm({ ...editCategoryForm, is_active: !editCategoryForm.is_active })} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: editCategoryForm.is_active ? C.success : '#ccc', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}>
                                <span style={{ position: 'absolute', top: 2, left: editCategoryForm.is_active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </button>
                            <span style={{ fontSize: 12, color: C.sage }}>{editCategoryForm.is_active ? '✅ Active' : '⛔ Inactive'}</span>
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Place Modal */}
            {showPlaceModal && (
                <ModalShell onClose={() => { setShowPlaceModal(false); setEditingPlace(null); setPlaceForm({ name: '', location: '', description: '', difficulty: '', duration: '', best_time: '', image: '', type: 'well-known', hidden_gem: '' }); }}
                    title={editingPlace ? '✏️ Edit Place' : '📍 Add Place'}
                    subtitle={editingPlace ? `Editing ${editingPlace.name}` : `Adding to ${categories.find(c => c.key === selectedCategoryKey)?.title || 'Category'}`}
                    icon={Map}
                    footer={<><Btn variant="ghost" onClick={() => { setShowPlaceModal(false); setEditingPlace(null); }}>Cancel</Btn>
                        <Btn variant="primary" icon={editingPlace ? Save : Plus} onClick={editingPlace ? handleUpdatePlace : handleAddPlace} disabled={placeLoading}>
                            {placeLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {placeLoading ? 'Saving...' : (editingPlace ? 'Update Place' : 'Add Place')}
                        </Btn></>}
                >
                    <form onSubmit={editingPlace ? handleUpdatePlace : handleAddPlace} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Place Name <span style={{ color: C.danger }}>*</span></label>
                            <input type="text" value={placeForm.name} onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })} style={inputStyle} required placeholder="Place name" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</label>
                            <input type="text" value={placeForm.location} onChange={(e) => setPlaceForm({ ...placeForm, location: e.target.value })} style={inputStyle} placeholder="e.g., Varkala" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                            <textarea value={placeForm.description} onChange={(e) => setPlaceForm({ ...placeForm, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Describe the place..." /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Difficulty</label>
                                <input type="text" value={placeForm.difficulty} onChange={(e) => setPlaceForm({ ...placeForm, difficulty: e.target.value })} style={inputStyle} placeholder="Easy" /></div>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</label>
                                <input type="text" value={placeForm.duration} onChange={(e) => setPlaceForm({ ...placeForm, duration: e.target.value })} style={inputStyle} placeholder="2-3 hours" /></div>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best Time</label>
                                <input type="text" value={placeForm.best_time} onChange={(e) => setPlaceForm({ ...placeForm, best_time: e.target.value })} style={inputStyle} placeholder="October to March" /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</label>
                                <select value={placeForm.type} onChange={(e) => setPlaceForm({ ...placeForm, type: e.target.value })} style={selectStyle}>
                                    <option value="well-known">⭐ Well Known</option><option value="hidden">✨ Hidden Gem</option>
                                </select></div>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image URL</label>
                                <input type="url" value={placeForm.image} onChange={(e) => setPlaceForm({ ...placeForm, image: e.target.value })} style={inputStyle} placeholder="https://images.unsplash.com/..." /></div>
                        </div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hidden Gem Description</label>
                            <textarea value={placeForm.hidden_gem} onChange={(e) => setPlaceForm({ ...placeForm, hidden_gem: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="What makes this a hidden gem?" /></div>
                    </form>
                </ModalShell>
            )}

            {/* Staff Modal */}
            {showStaffModal && (
                <ModalShell onClose={() => { setShowStaffModal(false); setStaffForm({ email: '', password: '' }); }}
                    title="Add Staff" subtitle="Create a new staff account" icon={Shield}
                    footer={<><Btn variant="ghost" onClick={() => { setShowStaffModal(false); setStaffForm({ email: '', password: '' }); }}>Cancel</Btn>
                        <Btn variant="primary" icon={Plus} onClick={handleAddStaff} disabled={staffLoading}>
                            {staffLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {staffLoading ? 'Adding...' : 'Add Staff'}
                        </Btn></>}
                >
                    <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email <span style={{ color: C.danger }}>*</span></label>
                            <input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} style={inputStyle} required placeholder="staff@example.com" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password <span style={{ color: C.danger }}>*</span></label>
                            <input type="text" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} style={inputStyle} required placeholder="Set a password" minLength={6} /></div>
                    </form>
                </ModalShell>
            )}

            {/* Guide Modal - WITH PROFILE PICTURE UPLOAD */}
            {showGuideModal && (
                <ModalShell onClose={() => { setShowGuideModal(false); setEditingGuide(null); resetGuideForm(); }}
                    title={editingGuide ? '✏️ Edit Guide' : '👤 Add Guide'}
                    subtitle={editingGuide ? `Update ${editingGuide.full_name}'s profile` : 'Create a new guide account'} icon={UserCheck} maxWidth={640}
                    footer={<><Btn variant="ghost" onClick={() => { setShowGuideModal(false); setEditingGuide(null); resetGuideForm(); }}>Cancel</Btn>
                        <Btn variant="primary" icon={editingGuide ? Save : Plus} onClick={editingGuide ? handleUpdateGuide : handleAddGuide} disabled={guideLoading}>
                            {guideLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {guideLoading ? 'Saving...' : (editingGuide ? 'Update Guide' : 'Add Guide')}
                        </Btn></>}
                >
                    <form onSubmit={editingGuide ? handleUpdateGuide : handleAddGuide} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Profile Picture Upload for Edit */}
                        {editingGuide && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${C.line}` }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', color: C.ink, overflow: 'hidden', border: `2px solid ${C.gold}66` }}>
                                        {editGuideProfilePic ? <img src={editGuideProfilePic} alt="Guide" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : guideForm.full_name?.charAt(0)?.toUpperCase() || 'G'}
                                    </div>
                                    <label htmlFor="edit-guide-pic" style={{ position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: '50%', background: C.ink, color: C.goldLight, border: `2px solid ${C.cream}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                                        <Camera size={12} />
                                    </label>
                                    <input id="edit-guide-pic" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEditGuideProfilePic} />
                                </div>
                                <div>
                                    <p style={{ fontSize: 12, color: C.sage, margin: 0 }}>Click the camera icon to update profile picture</p>
                                    {editGuidePicFile && <p style={{ fontSize: 11, color: C.success, margin: '4px 0 0' }}>✅ New image selected</p>}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name <span style={{ color: C.danger }}>*</span></label>
                                <input type="text" value={guideForm.full_name} onChange={(e) => setGuideForm({ ...guideForm, full_name: e.target.value })} style={inputStyle} required placeholder="John Doe" maxLength={100} /></div>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email <span style={{ color: C.danger }}>*</span></label>
                                <input type="email" value={guideForm.email} onChange={(e) => setGuideForm({ ...guideForm, email: e.target.value })} style={inputStyle} required disabled={!!editingGuide} placeholder="guide@example.com" maxLength={254} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password {!editingGuide && <span style={{ color: C.danger }}>*</span>}</label>
                                <input type="text" value={guideForm.password} onChange={(e) => setGuideForm({ ...guideForm, password: e.target.value })} style={inputStyle} required={!editingGuide} placeholder={editingGuide ? 'Leave blank to keep current' : 'Set a password'} minLength={6} maxLength={128} /></div>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone <span style={{ color: C.sageLight }}>(max 12 chars)</span></label>
                                <input type="text" value={guideForm.phone} onChange={(e) => { const val = e.target.value.slice(0, 12); setGuideForm({ ...guideForm, phone: val }); }} style={inputStyle} placeholder="+91 9876543210" maxLength={12} /></div>
                        </div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bio</label>
                            <textarea value={guideForm.bio} onChange={(e) => setGuideForm({ ...guideForm, bio: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Experienced tour guide..." maxLength={500} /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experience (Years)</label>
                                <input type="number" min="0" max="50" value={guideForm.experience_years} onChange={(e) => setGuideForm({ ...guideForm, experience_years: e.target.value })} style={inputStyle} placeholder="5" /></div>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Languages</label>
                                <input type="text" value={guideForm.languages} onChange={(e) => setGuideForm({ ...guideForm, languages: e.target.value })} style={inputStyle} placeholder="English, Malayalam, Hindi" maxLength={200} /></div>
                        </div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary District <span style={{ color: C.danger }}>*</span></label>
                            <select value={guideForm.primary_district} onChange={(e) => setGuideForm({ ...guideForm, primary_district: e.target.value })} style={selectStyle} required>
                                <option value="">Select District</option>{KERALA_DISTRICTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price/Day ($)</label>
                                <input type="number" min="0" step="0.01" value={guideForm.price_per_day} onChange={(e) => setGuideForm({ ...guideForm, price_per_day: e.target.value })} style={inputStyle} placeholder="50" /></div>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price/Hour ($)</label>
                                <input type="number" min="0" step="0.01" value={guideForm.price_per_hour} onChange={(e) => setGuideForm({ ...guideForm, price_per_hour: e.target.value })} style={inputStyle} placeholder="15" /></div>
                        </div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                            <select value={guideForm.is_active ? 'true' : 'false'} onChange={(e) => setGuideForm({ ...guideForm, is_active: e.target.value === 'true' })} style={selectStyle}>
                                <option value="true">🟢 Active</option><option value="false">🔴 Inactive</option>
                            </select></div>
                    </form>
                </ModalShell>
            )}

            {/* Guide View Profile Modal */}
            {showGuideViewModal && selectedGuide && (
                <ModalShell onClose={() => { setShowGuideViewModal(false); setSelectedGuide(null); }}
                    title="👤 Guide Profile"
                    subtitle={`${selectedGuide.full_name} - ${selectedGuide.primary_district || 'N/A'}`}
                    icon={UserCheck}
                    maxWidth={600}
                    footer={<Btn variant="ghost" onClick={() => { setShowGuideViewModal(false); setSelectedGuide(null); }}>Close</Btn>}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: `1px solid ${C.line}` }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: selectedGuide.is_verified ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : C.line, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 600, color: C.ink, overflow: 'hidden', flexShrink: 0 }}>
                                {selectedGuide.profile_image ? <img src={getProfileImageUrl(selectedGuide.profile_image)} alt={selectedGuide.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedGuide.full_name?.charAt(0)?.toUpperCase() || 'G'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: 18, fontWeight: 600, color: C.inkSoft, margin: 0 }}>{selectedGuide.full_name}</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    <StatusPill status={selectedGuide.is_verified ? 'verified' : 'unverified'} />
                                    <StatusPill status={selectedGuide.is_active !== false ? 'active' : 'inactive'} />
                                    {selectedGuide.rating > 0 && <span style={{ fontSize: 12, color: C.gold, background: C.goldSoft, padding: '2px 10px', borderRadius: 999 }}>{selectedGuide.rating} ★ ({selectedGuide.total_reviews || 0} reviews)</span>}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Email</p><p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedGuide.email}</p></div>
                            <div><p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Phone</p><p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedGuide.phone || 'N/A'}</p></div>
                            <div><p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Experience</p><p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedGuide.experience_years || 0} years</p></div>
                            <div><p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>District</p><p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedGuide.primary_district || 'N/A'}</p></div>
                            <div><p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Languages</p><p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>{selectedGuide.languages || 'N/A'}</p></div>
                            <div><p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Price</p><p style={{ fontSize: 14, color: C.inkSoft, margin: '4px 0 0' }}>₹{selectedGuide.price_per_day || 0}/day · ₹{selectedGuide.price_per_hour || 0}/hr</p></div>
                        </div>
                        {selectedGuide.bio && <div><p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: '0 0 4px' }}>Bio</p><p style={{ fontSize: 14, color: C.sage, lineHeight: 1.6, margin: 0 }}>{selectedGuide.bio}</p></div>}
                        <div style={{ padding: 12, background: C.cream, borderRadius: RADIUS.sm }}>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: '0 0 4px' }}>Account Info</p>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: C.sage }}>
                                <span>🆔 ID: {selectedGuide.id}</span>
                                <span>📅 Joined: {selectedGuide.created_at ? new Date(selectedGuide.created_at).toLocaleDateString() : 'N/A'}</span>
                                <span>📊 Total Reviews: {selectedGuide.total_reviews || 0}</span>
                            </div>
                        </div>
                    </div>
                </ModalShell>
            )}

            {/* Credentials Modal */}
            {showCredentialsModal && (
                <ModalShell onClose={() => { setShowCredentialsModal(false); setNewCredentials({ email: '', password: '' }); }}
                    title="✅ Account Created!" subtitle="Share these credentials with the user" icon={UserCheck}
                    footer={<><Btn variant="primary" onClick={() => { navigator.clipboard?.writeText(`Email: ${newCredentials.email}\nPassword: ${newCredentials.password}`); showToast('✅ Credentials copied!'); }}>📋 Copy</Btn>
                        <Btn variant="ghost" onClick={() => { setShowCredentialsModal(false); setNewCredentials({ email: '', password: '' }); }}>Done</Btn></>}
                >
                    <div style={{ padding: 16, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${C.line}` }}>
                        <div style={{ marginBottom: 12 }}><p style={{ fontSize: 11, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Email</p><p style={{ fontSize: 16, fontWeight: 600, color: C.inkSoft, fontFamily: FONT.mono }}>{newCredentials.email}</p></div>
                        <div><p style={{ fontSize: 11, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Password</p><p style={{ fontSize: 16, fontWeight: 600, color: C.gold, fontFamily: FONT.mono }}>{newCredentials.password}</p></div>
                    </div>
                    <p style={{ fontSize: 12, color: C.sage, marginTop: 12, textAlign: 'center' }}>🔒 User can login with these credentials and change password later.</p>
                </ModalShell>
            )}

            {/* Suggestion Detail Modal */}
            {showSuggestionModal && selectedSuggestion && (
                <ModalShell onClose={() => { setShowSuggestionModal(false); setSelectedSuggestion(null); }}
                    title={selectedSuggestion.name || 'Suggestion Details'}
                    subtitle={`${selectedSuggestion.district || 'N/A'} · ${selectedSuggestion.user_email || 'Anonymous'}`}
                    icon={getTypeIcon(selectedSuggestion.suggestion_type)}
                    maxWidth={600}
                    footer={<>
                        {(selectedSuggestion.status === 'pending' || selectedSuggestion.status === 'pending_guide' || selectedSuggestion.status === 'pending_admin') && 
                            <Btn variant="primary" icon={CheckCircle} onClick={() => processSuggestion(selectedSuggestion.id, 'implement', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                {actionLoading && processingId === selectedSuggestion.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Implement'}
                            </Btn>
                        }
                        {(selectedSuggestion.status === 'pending' || selectedSuggestion.status === 'pending_guide' || selectedSuggestion.status === 'pending_admin') && 
                            <Btn variant="danger" icon={X} onClick={() => processSuggestion(selectedSuggestion.id, 'reject', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                Reject
                            </Btn>
                        }
                        {selectedSuggestion.status === 'implemented' && <span style={{ padding: '8px 16px', borderRadius: RADIUS.sm, background: C.warnBg, color: C.gold, fontSize: 13, fontWeight: 600 }}>✨ Implemented</span>}
                        {selectedSuggestion.status === 'rejected' && <span style={{ padding: '8px 16px', borderRadius: RADIUS.sm, background: C.dangerBg, color: C.danger, fontSize: 13, fontWeight: 600 }}>❌ Rejected</span>}
                        {selectedSuggestion.status !== 'deleted' && <Btn variant="danger" icon={Trash2} onClick={() => processSuggestion(selectedSuggestion.id, 'delete', selectedSuggestion.suggestion_type)} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                            {actionLoading && processingId === selectedSuggestion.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Delete'}
                        </Btn>}
                        <Btn variant="ghost" onClick={() => { setShowSuggestionModal(false); setSelectedSuggestion(null); }}>Close</Btn>
                    </>}
                >
                    {(() => {
                        const imageUrl = getImageUrl(selectedSuggestion);
                        return imageUrl ? (
                            <img src={imageUrl} alt={selectedSuggestion.name} style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: RADIUS.md, marginBottom: 16, border: `1px solid ${C.line}` }} 
                                onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                            <div style={{ width: '100%', height: 150, background: C.cream, borderRadius: RADIUS.md, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.line}` }}>
                                <span style={{ fontSize: 48 }}>
                                    {selectedSuggestion.suggestion_type === 'hidden_gem' ? '💎' : 
                                     selectedSuggestion.suggestion_type === 'local_insight' ? '💡' : 
                                     selectedSuggestion.suggestion_type === 'review' ? '⭐' : '📍'}
                                </span>
                            </div>
                        );
                    })()}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 12, padding: '4px 14px', borderRadius: 999, background: C.cream, color: C.sage, border: `1px solid ${C.line}` }}>📍 {selectedSuggestion.district || 'N/A'}</span>
                        <span style={{ fontSize: 12, padding: '4px 14px', borderRadius: 999, background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}30` }}>{getTypeBadge(selectedSuggestion.suggestion_type)}</span>
                        <span style={{ fontSize: 12, padding: '4px 14px', borderRadius: 999, background: C.cream, color: C.sage, border: `1px solid ${C.line}` }}>👤 {selectedSuggestion.user_email || 'Anonymous'}</span>
                        {selectedSuggestion.rating && <span style={{ fontSize: 12, padding: '4px 14px', borderRadius: 999, background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}30` }}>{'★'.repeat(Math.round(selectedSuggestion.rating))} {selectedSuggestion.rating}/5</span>}
                        <StatusPill status={selectedSuggestion.status || 'pending'} />
                    </div>
                    {selectedSuggestion.description && (
                        <div style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: 10, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: '0 0 4px' }}>Description</p>
                            <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.8, margin: 0, background: C.paper, padding: 12, borderRadius: RADIUS.sm, border: `1px solid ${C.line}` }}>{selectedSuggestion.description || 'No description provided'}</p>
                        </div>
                    )}
                    {selectedSuggestion.location_info && (
                        <div style={{ marginBottom: 12, padding: 12, background: C.infoBg, borderRadius: RADIUS.sm, border: `1px solid ${C.info}30` }}>
                            <p style={{ fontSize: 10, color: C.info, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: '0 0 4px' }}>📍 Location Info</p>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: 0 }}>{selectedSuggestion.location_info}</p>
                        </div>
                    )}
                    {selectedSuggestion.admin_notes && (
                        <div style={{ marginBottom: 12, padding: 12, background: C.warnBg, borderRadius: RADIUS.sm, border: `1px solid ${C.gold}30` }}>
                            <p style={{ fontSize: 10, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: '0 0 4px' }}>📝 Admin Notes</p>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: 0 }}>{selectedSuggestion.admin_notes}</p>
                        </div>
                    )}
                    {selectedSuggestion.processed_by && (
                        <div style={{ marginTop: 8, padding: 10, background: '#F0F7FF', borderRadius: RADIUS.sm, border: `1px solid #93C5FD` }}>
                            <p style={{ fontSize: 11, color: '#1E3A5F', margin: 0 }}>👤 Processed by: <strong>{selectedSuggestion.processed_by}</strong></p>
                            {selectedSuggestion.processed_at && <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0' }}>🕐 {new Date(selectedSuggestion.processed_at).toLocaleString()}</p>}
                        </div>
                    )}
                    <div style={{ marginTop: 8, padding: 10, background: C.cream, borderRadius: RADIUS.sm }}>
                        <p style={{ fontSize: 11, color: C.sage, margin: 0 }}>📅 Created: {selectedSuggestion.created_at ? new Date(selectedSuggestion.created_at).toLocaleString() : 'N/A'}</p>
                    </div>
                </ModalShell>
            )}

            {/* Add Insight Modal */}
            {showAddInsightModal && (
                <ModalShell onClose={() => { setShowAddInsightModal(false); setInsightForm({ name: '', description: '', district: '', category: 'general', image: null, imagePreview: null }); }}
                    title="💡 Add Local Insight" subtitle="Will be automatically implemented for touristers" icon={Lightbulb}
                    footer={<>
                        <Btn variant="ghost" onClick={() => { setShowAddInsightModal(false); setInsightForm({ name: '', description: '', district: '', category: 'general', image: null, imagePreview: null }); }}>Cancel</Btn>
                        <Btn variant="primary" icon={Plus} onClick={handleAddInsight} disabled={insightLoading}>
                            {insightLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {insightLoading ? 'Adding...' : 'Add & Implement'}
                        </Btn>
                    </>}
                >
                    <form onSubmit={handleAddInsight} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name <span style={{ color: C.danger }}>*</span></label>
                            <input type="text" value={insightForm.name} onChange={(e) => setInsightForm({ ...insightForm, name: e.target.value })} style={inputStyle} required placeholder="e.g., Best Time to Visit Munnar" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description <span style={{ color: C.danger }}>*</span></label>
                            <textarea value={insightForm.description} onChange={(e) => setInsightForm({ ...insightForm, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} rows={3} required placeholder="Share your local insight..." /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>District <span style={{ color: C.danger }}>*</span></label>
                            <select value={insightForm.district} onChange={(e) => setInsightForm({ ...insightForm, district: e.target.value })} style={selectStyle} required>
                                <option value="">Select District</option>
                                {KERALA_DISTRICTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                            <input type="text" value={insightForm.category} onChange={(e) => setInsightForm({ ...insightForm, category: e.target.value })} style={inputStyle} placeholder="e.g., travel-tips, food, culture" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image</label>
                            <input type="file" accept="image/*" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setInsightForm({ ...insightForm, image: file });
                                    const reader = new FileReader();
                                    reader.onloadend = () => setInsightForm(prev => ({ ...prev, imagePreview: reader.result }));
                                    reader.readAsDataURL(file);
                                }
                            }} style={{ ...inputStyle, padding: '8px' }} />
                            {insightForm.imagePreview && <img src={insightForm.imagePreview} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: RADIUS.sm, marginTop: 8, border: `1px solid ${C.line}` }} />}
                        </div>
                        <div style={{ padding: 12, background: C.successBg, borderRadius: RADIUS.sm, border: `1px solid ${C.success}30` }}>
                            <p style={{ fontSize: 12, color: C.success, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> This insight will be automatically implemented for all touristers to see.</p>
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Add Hidden Gem Modal */}
            {showAddHiddenGemModal && (
                <ModalShell onClose={() => { setShowAddHiddenGemModal(false); setHiddenGemForm({ name: '', description: '', district: '', category: 'hidden', image: null, imagePreview: null }); }}
                    title="💎 Add Hidden Gem" subtitle="Will be automatically implemented for touristers" icon={Sparkles}
                    footer={<>
                        <Btn variant="ghost" onClick={() => { setShowAddHiddenGemModal(false); setHiddenGemForm({ name: '', description: '', district: '', category: 'hidden', image: null, imagePreview: null }); }}>Cancel</Btn>
                        <Btn variant="gold" icon={Plus} onClick={handleAddHiddenGem} disabled={hiddenGemLoading}>
                            {hiddenGemLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {hiddenGemLoading ? 'Adding...' : 'Add & Implement'}
                        </Btn>
                    </>}
                >
                    <form onSubmit={handleAddHiddenGem} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name <span style={{ color: C.danger }}>*</span></label>
                            <input type="text" value={hiddenGemForm.name} onChange={(e) => setHiddenGemForm({ ...hiddenGemForm, name: e.target.value })} style={inputStyle} required placeholder="e.g., Secret Waterfall Near Munnar" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description <span style={{ color: C.danger }}>*</span></label>
                            <textarea value={hiddenGemForm.description} onChange={(e) => setHiddenGemForm({ ...hiddenGemForm, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} rows={3} required placeholder="Describe this hidden gem..." /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>District <span style={{ color: C.danger }}>*</span></label>
                            <select value={hiddenGemForm.district} onChange={(e) => setHiddenGemForm({ ...hiddenGemForm, district: e.target.value })} style={selectStyle} required>
                                <option value="">Select District</option>
                                {KERALA_DISTRICTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                            </select></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Image</label>
                            <input type="file" accept="image/*" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setHiddenGemForm({ ...hiddenGemForm, image: file });
                                    const reader = new FileReader();
                                    reader.onloadend = () => setHiddenGemForm(prev => ({ ...prev, imagePreview: reader.result }));
                                    reader.readAsDataURL(file);
                                }
                            }} style={{ ...inputStyle, padding: '8px' }} />
                            {hiddenGemForm.imagePreview && <img src={hiddenGemForm.imagePreview} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: RADIUS.sm, marginTop: 8, border: `1px solid ${C.line}` }} />}
                        </div>
                        <div style={{ padding: 12, background: C.successBg, borderRadius: RADIUS.sm, border: `1px solid ${C.success}30` }}>
                            <p style={{ fontSize: 12, color: C.success, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> This hidden gem will be automatically implemented for all touristers to discover.</p>
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* TOAST */}
            {toast && (
                <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', padding: '12px 24px', borderRadius: RADIUS.sm, background: toast.type === 'error' ? C.danger : C.ink, color: toast.type === 'error' ? '#fff' : C.goldLight, fontSize: 13, fontFamily: FONT.body, boxShadow: '0 8px 24px rgba(7,46,42,0.25)', zIndex: 100 }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
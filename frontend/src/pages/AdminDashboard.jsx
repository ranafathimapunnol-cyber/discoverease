// src/pages/AdminDashboard.jsx - COMPLETE WITH SAME UI AS GUIDE DASHBOARD

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    LayoutGrid,
    FolderPlus,
    Map,
} from 'lucide-react';

// ============================================
// DESIGN TOKENS - Same as Guide Dashboard
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
// COMPONENTS - Same as Guide Dashboard
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
        deleted: { fg: C.danger, bg: C.dangerBg, label: '🗑️ Deleted' },
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
        totalUsers: 0,
        totalStaff: 0,
        totalGuides: 0,
        totalCategories: 0,
        totalPlaces: 0,
        totalSuggestions: 0,
        pendingSuggestions: 0,
        implementedSuggestions: 0,
        deletedSuggestions: 0,
    });

    // Data states
    const [users, setUsers] = useState([]);
    const [staff, setStaff] = useState([]);
    const [guides, setGuides] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [deletedSuggestions, setDeletedSuggestions] = useState([]);

    // Filter states
    const [suggestionFilter, setSuggestionFilter] = useState('all');
    const [usersFilter, setUsersFilter] = useState('all');
    const [staffFilter, setStaffFilter] = useState('all');
    const [guidesFilter, setGuidesFilter] = useState('all');

    // Pagination
    const [usersPage, setUsersPage] = useState(1);
    const [staffPage, setStaffPage] = useState(1);
    const [guidesPage, setGuidesPage] = useState(1);
    const [suggestionsPage, setSuggestionsPage] = useState(1);
    const [categoriesPage, setCategoriesPage] = useState(1);

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showPlaceModal, setShowPlaceModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
    const [showDeletedModal, setShowDeletedModal] = useState(false);

    // Form states
    const [categoryForm, setCategoryForm] = useState({
        key: '', label: '', description: '', image: ''
    });
    const [placeForm, setPlaceForm] = useState({
        name: '', location: '', district: '', description: '',
        difficulty: '', duration: '', best_time: '',
        image: '', type: 'well-known', hidden_gem: ''
    });
    const [staffForm, setStaffForm] = useState({ email: '', password: '' });
    const [guideForm, setGuideForm] = useState({
        full_name: '', email: '', password: '', phone: '', bio: '',
        experience_years: '', languages: '', primary_district: '',
        price_per_day: '', price_per_hour: '',
        is_verified: true, is_active: true
    });
    const [selectedCategoryKey, setSelectedCategoryKey] = useState('');
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [editingGuide, setEditingGuide] = useState(null);
    const [newCredentials, setNewCredentials] = useState({ email: '', password: '' });

    // Loading states
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [placeLoading, setPlaceLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(false);
    const [guideLoading, setGuideLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const dataFetchedRef = useRef(false);

    // ============================================
    // NAV ITEMS
    // ============================================
    const navItems = [
        { key: 'overview', label: 'Overview', icon: Compass },
        { key: 'categories', label: 'Categories', icon: LayoutGrid, badge: stats.totalCategories },
        { key: 'users', label: 'Users', icon: Users, badge: stats.totalUsers },
        { key: 'staff', label: 'Staff', icon: Shield, badge: stats.totalStaff },
        { key: 'guides', label: 'Guides', icon: UserCheck, badge: stats.totalGuides },
        { key: 'suggestions', label: 'Suggestions', icon: MessageSquare, badge: stats.pendingSuggestions },
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
        const savedPicture = localStorage.getItem('admin_profile_picture');
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
                localStorage.setItem('admin_profile_picture', base64String);
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
            // 1. Fetch users
            try {
                const response = await api.get('/admin/users/');
                if (response?.data?.success) {
                    setUsers(response.data.users || []);
                    setStats(prev => ({
                        ...prev,
                        totalUsers: response.data.users?.length || 0
                    }));
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                // Fallback to localStorage
                try {
                    const cached = JSON.parse(localStorage.getItem('admin_users') || '[]');
                    setUsers(cached);
                } catch (e) {
                    setUsers([]);
                }
            }

            // 2. Fetch staff
            try {
                const response = await api.get('/admin/staff/');
                if (response?.data?.success) {
                    setStaff(response.data.staff || []);
                    setStats(prev => ({
                        ...prev,
                        totalStaff: response.data.staff?.length || 0
                    }));
                }
            } catch (error) {
                console.error('Error fetching staff:', error);
                try {
                    const cached = JSON.parse(localStorage.getItem('admin_staff') || '[]');
                    setStaff(cached);
                } catch (e) {
                    setStaff([]);
                }
            }

            // 3. Fetch guides
            try {
                const response = await api.get('/admin/guides/');
                if (response?.data?.success) {
                    setGuides(response.data.guides || []);
                    setStats(prev => ({
                        ...prev,
                        totalGuides: response.data.guides?.length || 0
                    }));
                }
            } catch (error) {
                console.error('Error fetching guides:', error);
                try {
                    const cached = JSON.parse(localStorage.getItem('admin_guides') || '[]');
                    setGuides(cached);
                } catch (e) {
                    setGuides([]);
                }
            }

            // 4. Fetch categories
            try {
                const response = await api.get('/admin/categories/');
                if (response?.data?.success) {
                    setCategories(response.data.categories || []);
                    const totalPlaces = (response.data.categories || []).reduce((sum, cat) => sum + (cat.places?.length || 0), 0);
                    setStats(prev => ({
                        ...prev,
                        totalCategories: response.data.categories?.length || 0,
                        totalPlaces: totalPlaces
                    }));
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                try {
                    const cached = JSON.parse(localStorage.getItem('admin_categories') || '[]');
                    setCategories(cached);
                    const totalPlaces = cached.reduce((sum, cat) => sum + (cat.places?.length || 0), 0);
                    setStats(prev => ({
                        ...prev,
                        totalCategories: cached.length,
                        totalPlaces: totalPlaces
                    }));
                } catch (e) {
                    setCategories([]);
                }
            }

            // 5. Fetch suggestions
            try {
                const response = await api.get('/admin/suggestions/');
                if (response?.data?.success) {
                    const allSuggestions = response.data.suggestions || [];
                    setSuggestions(allSuggestions);
                    setStats(prev => ({
                        ...prev,
                        totalSuggestions: allSuggestions.length,
                        pendingSuggestions: allSuggestions.filter(s => s.status === 'pending').length,
                        implementedSuggestions: allSuggestions.filter(s => s.status === 'implemented').length,
                    }));
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                try {
                    const cached = JSON.parse(localStorage.getItem('admin_suggestions') || '[]');
                    setSuggestions(cached);
                    setStats(prev => ({
                        ...prev,
                        totalSuggestions: cached.length,
                        pendingSuggestions: cached.filter(s => s.status === 'pending').length,
                        implementedSuggestions: cached.filter(s => s.status === 'implemented').length,
                    }));
                } catch (e) {
                    setSuggestions([]);
                }
            }

            // 6. Fetch deleted suggestions
            try {
                const deleted = JSON.parse(localStorage.getItem('deleted_suggestions') || '[]');
                setDeletedSuggestions(deleted);
                setStats(prev => ({
                    ...prev,
                    deletedSuggestions: deleted.length
                }));
            } catch (e) {
                setDeletedSuggestions([]);
            }

            // 7. Profile
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
                        department: response.data.user?.department || 'Admin',
                        position: response.data.user?.position || 'Administrator',
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
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
        if (user.role !== 'admin') {
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
                image: categoryForm.image.trim() || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'
            };

            const response = await api.post('/admin/categories/', data);
            if (response?.data?.success) {
                showToast('✅ Category added successfully!');
                setShowCategoryModal(false);
                setCategoryForm({ key: '', label: '', description: '', image: '' });
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add category');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            showToast(error.response?.data?.error || 'Failed to add category');
        } finally {
            setCategoryLoading(false);
        }
    };

    const deleteCategory = async (key) => {
        if (!window.confirm('Delete this category and all its places?')) return;
        try {
            const response = await api.delete(`/admin/categories/${key}/`);
            if (response?.data?.success) {
                showToast('✅ Category deleted successfully');
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to delete category');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Failed to delete category');
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
                district: placeForm.district,
                description: placeForm.description.trim(),
                difficulty: placeForm.difficulty,
                duration: placeForm.duration,
                best_time: placeForm.best_time,
                image: placeForm.image.trim() || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                type: placeForm.type,
                hidden_gem: placeForm.hidden_gem.trim()
            };

            const response = await api.post(`/admin/categories/${selectedCategoryKey}/places/`, data);
            if (response?.data?.success) {
                showToast('✅ Place added successfully!');
                setShowPlaceModal(false);
                setPlaceForm({
                    name: '', location: '', district: '', description: '',
                    difficulty: '', duration: '', best_time: '',
                    image: '', type: 'well-known', hidden_gem: ''
                });
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add place');
            }
        } catch (error) {
            console.error('Error adding place:', error);
            showToast(error.response?.data?.error || 'Failed to add place');
        } finally {
            setPlaceLoading(false);
        }
    };

    const deletePlace = async (categoryKey, placeId) => {
        if (!window.confirm('Delete this place?')) return;
        try {
            const response = await api.delete(`/admin/categories/${categoryKey}/places/${placeId}/`);
            if (response?.data?.success) {
                showToast('✅ Place deleted successfully');
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to delete place');
            }
        } catch (error) {
            console.error('Error deleting place:', error);
            showToast('Failed to delete place');
        }
    };

    // ============================================
    // STAFF CRUD
    // ============================================
    const handleAddStaff = async (e) => {
        e.preventDefault();
        setStaffLoading(true);
        try {
            const response = await api.post('/admin/staff/', {
                email: staffForm.email,
                password: staffForm.password
            });
            if (response?.data?.success) {
                setNewCredentials({
                    email: staffForm.email,
                    password: staffForm.password
                });
                setShowCredentialsModal(true);
                setShowStaffModal(false);
                setStaffForm({ email: '', password: '' });
                showToast('✅ Staff added successfully!');
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add staff');
            }
        } catch (error) {
            console.error('Error adding staff:', error);
            showToast(error.response?.data?.error || 'Failed to add staff');
        } finally {
            setStaffLoading(false);
        }
    };

    const deleteStaff = async (id) => {
        if (!window.confirm('Delete this staff member?')) return;
        try {
            const response = await api.delete(`/admin/staff/${id}/`);
            if (response?.data?.success) {
                showToast('✅ Staff deleted successfully');
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to delete staff');
            }
        } catch (error) {
            console.error('Error deleting staff:', error);
            showToast('Failed to delete staff');
        }
    };

    // ============================================
    // GUIDE CRUD
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
                is_verified: guideForm.is_verified,
                is_active: guideForm.is_active
            };

            const response = await api.post('/admin/guides/', data);
            if (response?.data?.success) {
                setNewCredentials({
                    email: guideForm.email,
                    password: guideForm.password || 'guide123456'
                });
                setShowCredentialsModal(true);
                setShowGuideModal(false);
                resetGuideForm();
                showToast('✅ Guide added successfully!');
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to add guide');
            }
        } catch (error) {
            console.error('Error adding guide:', error);
            showToast(error.response?.data?.error || 'Failed to add guide');
        } finally {
            setGuideLoading(false);
        }
    };

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
                is_verified: guideForm.is_verified,
                is_active: guideForm.is_active
            };
            if (guideForm.password) {
                data.password = guideForm.password;
            }

            const response = await api.put(`/admin/guides/${editingGuide.id}/`, data);
            if (response?.data?.success) {
                showToast('✅ Guide updated successfully!');
                setShowGuideModal(false);
                setEditingGuide(null);
                resetGuideForm();
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to update guide');
            }
        } catch (error) {
            console.error('Error updating guide:', error);
            showToast(error.response?.data?.error || 'Failed to update guide');
        } finally {
            setGuideLoading(false);
        }
    };

    const deleteGuide = async (id) => {
        if (!window.confirm('Delete this guide?')) return;
        try {
            const response = await api.delete(`/admin/guides/${id}/`);
            if (response?.data?.success) {
                showToast('✅ Guide deleted successfully');
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to delete guide');
            }
        } catch (error) {
            console.error('Error deleting guide:', error);
            showToast('Failed to delete guide');
        }
    };

    const verifyGuide = async (id) => {
        try {
            const response = await api.post(`/admin/guides/${id}/verify/`);
            if (response?.data?.success) {
                showToast('✅ Guide verified successfully!');
                await fetchAllData();
            } else {
                showToast(response?.data?.error || 'Failed to verify guide');
            }
        } catch (error) {
            console.error('Error verifying guide:', error);
            showToast('Failed to verify guide');
        }
    };

    const openEditGuide = (guide) => {
        setEditingGuide(guide);
        setGuideForm({
            full_name: guide.full_name || '',
            email: guide.email || '',
            password: '',
            phone: guide.phone || '',
            bio: guide.bio || '',
            experience_years: guide.experience_years || '',
            languages: guide.languages || '',
            primary_district: guide.primary_district || '',
            price_per_day: guide.price_per_day || '',
            price_per_hour: guide.price_per_hour || '',
            is_verified: guide.is_verified || true,
            is_active: guide.is_active !== undefined ? guide.is_active : true
        });
        setShowGuideModal(true);
    };

    const resetGuideForm = () => {
        setGuideForm({
            full_name: '', email: '', password: '', phone: '', bio: '',
            experience_years: '', languages: '', primary_district: '',
            price_per_day: '', price_per_hour: '',
            is_verified: true, is_active: true
        });
    };

    // ============================================
    // SUGGESTION PROCESSING
    // ============================================
    const processSuggestion = async (id, action) => {
        setActionLoading(true);
        setProcessingId(id);
        try {
            if (action === 'delete') {
                if (!window.confirm('Delete this suggestion permanently?')) {
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }
                try {
                    await api.post(`/admin/suggestions/${id}/delete/`);
                    showToast('🗑️ Suggestion deleted successfully!');
                    await fetchAllData();
                    if (showSuggestionModal) {
                        setShowSuggestionModal(false);
                        setSelectedSuggestion(null);
                    }
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                } catch (error) {
                    console.error('Delete error:', error);
                }
            }

            // Implement (only action needed - no approve/reject)
            if (action === 'implement') {
                const notes = `✅ Implemented by Admin: ${user?.email || 'Admin'}`;
                try {
                    const response = await api.post(`/admin/suggestions/${id}/implement/`, { notes });
                    if (response?.data?.success) {
                        showToast('✅ Suggestion implemented successfully!');
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
                    console.error('Implement error:', error);
                }
            }

            showToast(`❌ Failed to ${action} suggestion`);
        } catch (error) {
            console.error('Error processing suggestion:', error);
            showToast(`❌ Failed to ${action} suggestion`);
        } finally {
            setActionLoading(false);
            setProcessingId(null);
        }
    };

    const recoverDeletedSuggestion = (id) => {
        if (!window.confirm('Recover this deleted suggestion?')) return;
        try {
            const deleted = JSON.parse(localStorage.getItem('deleted_suggestions') || '[]');
            const index = deleted.findIndex(s => s.id === id);
            if (index !== -1) {
                const recovered = deleted[index];
                deleted.splice(index, 1);
                localStorage.setItem('deleted_suggestions', JSON.stringify(deleted));
                
                const suggestions = JSON.parse(localStorage.getItem('admin_suggestions') || '[]');
                const { deleted_at, deleted_by, ...rest } = recovered;
                suggestions.push({ ...rest, status: 'pending' });
                localStorage.setItem('admin_suggestions', JSON.stringify(suggestions));
                
                showToast('✅ Suggestion recovered successfully!');
                fetchAllData();
            }
        } catch (e) {
            showToast('❌ Failed to recover suggestion');
        }
    };

    // ============================================
    // FILTERED DATA
    // ============================================
    const filteredSuggestions = useMemo(() => {
        if (suggestionFilter === 'all') return suggestions;
        if (suggestionFilter === 'deleted') return deletedSuggestions;
        return suggestions.filter(s => s.status === suggestionFilter);
    }, [suggestions, suggestionFilter, deletedSuggestions]);

    const filteredUsers = useMemo(() => {
        if (usersFilter === 'all') return users;
        return users.filter(u => u.role === usersFilter);
    }, [users, usersFilter]);

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
        setUsersPage(1);
    }, [usersFilter]);

    useEffect(() => {
        setStaffPage(1);
    }, [staffFilter]);

    useEffect(() => {
        setGuidesPage(1);
    }, [guidesFilter]);

    useEffect(() => {
        setSuggestionsPage(1);
    }, [suggestionFilter]);

    useEffect(() => {
        setCategoriesPage(1);
    }, []);

    // ============================================
    // GET STATUS COLOR
    // ============================================
    const getStatusColor = (status) => {
        const colors = {
            'pending': { fg: C.warn, bg: C.warnBg },
            'approved': { fg: C.success, bg: C.successBg },
            'implemented': { fg: C.gold, bg: C.warnBg },
            'rejected': { fg: C.danger, bg: C.dangerBg },
            'deleted': { fg: C.danger, bg: C.dangerBg },
        };
        return colors[status] || { fg: C.sage, bg: '#EEEEEE' };
    };

    const getStatusLabel = (status) => {
        const labels = {
            'pending': '⏳ Pending',
            'approved': '✅ Approved',
            'implemented': '✨ Implemented',
            'rejected': '❌ Rejected',
            'deleted': '🗑️ Deleted',
        };
        return labels[status] || status;
    };

    // ============================================
    // RENDER SUGGESTION CARD
    // ============================================
    const renderSuggestionCard = (s) => {
        const hasImage = s.image && typeof s.image === 'string' && 
                        s.image.startsWith('http') && 
                        !s.image.includes('null') &&
                        !s.image.includes('undefined');

        const isDeleted = s.status === 'deleted' || s.deleted_at;

        return (
            <div
                key={s.id}
                style={{
                    display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md,
                    border: `1px solid ${C.line}`, alignItems: 'flex-start', transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    opacity: isDeleted ? 0.7 : 1,
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
                                e.target.parentElement.innerHTML = `<span style="font-size: 32px;">💡</span>`;
                            }}
                        />
                    ) : (
                        <span style={{ fontSize: 32 }}>💡</span>
                    )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>{s.name || 'Untitled'}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                <span style={{ fontSize: 11, color: C.sage }}>{s.user_email || 'Anonymous'} · {s.district || 'N/A'}</span>
                                <span style={{ fontSize: 9, padding: '2px 9px', borderRadius: 999, background: C.goldSoft, color: C.gold }}>{s.category || 'General'}</span>
                            </div>
                        </div>
                        <StatusPill status={isDeleted ? 'deleted' : (s.status || 'pending')} />
                    </div>
                    <p style={{ fontSize: 12.5, color: C.sage, margin: '6px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {s.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {s.status === 'pending' && (
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    processSuggestion(s.id, 'implement'); 
                                }} 
                                disabled={actionLoading}
                                style={{ 
                                    padding: '4px 12px', borderRadius: 999, border: 'none', 
                                    background: '#2563EB', color: '#fff', fontSize: 11, 
                                    cursor: actionLoading ? 'not-allowed' : 'pointer', 
                                    display: 'flex', alignItems: 'center', gap: 4, 
                                    opacity: actionLoading && processingId === s.id ? 0.5 : 1 
                                }}
                            >
                                <CheckCircle size={11} /> Implement
                            </button>
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
                        {s.status !== 'deleted' && !s.deleted_at && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); processSuggestion(s.id, 'delete'); }} 
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
                        {s.deleted_at && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); recoverDeletedSuggestion(s.id); }} 
                                style={{ 
                                    padding: '4px 12px', borderRadius: 999, 
                                    border: `1px solid ${C.success}`, background: C.successBg, 
                                    color: C.success, fontSize: 11, cursor: 'pointer', 
                                    display: 'flex', alignItems: 'center', gap: 4 
                                }}
                            >
                                <RefreshCw size={11} /> Recover
                            </button>
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
                    {guide.phone && <span>📱 {guide.phone}</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {!guide.is_verified && (
                        <button 
                            onClick={() => verifyGuide(guide.id)}
                            style={{ 
                                padding: '4px 12px', borderRadius: 999, border: 'none', 
                                background: C.success, color: '#fff', fontSize: 11, 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                        >
                            <UserCheck size={11} /> Verify
                        </button>
                    )}
                    <button 
                        onClick={() => openEditGuide(guide)}
                        style={{ 
                            padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.line}`, 
                            background: 'transparent', color: C.sage, fontSize: 11, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        <Edit2 size={11} /> Edit
                    </button>
                    <button 
                        onClick={() => deleteGuide(guide.id)}
                        style={{ 
                            padding: '4px 12px', borderRadius: 999, 
                            border: `1px solid #EFCBB5`, background: C.dangerBg, 
                            color: C.danger, fontSize: 11, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        <Trash2 size={11} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );

    // ============================================
    // RENDER USER CARD
    // ============================================
    const renderUserCard = (u) => (
        <div
            key={u.id}
            style={{
                display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md,
                border: `1px solid ${C.line}`, alignItems: 'flex-start', transition: 'all 0.2s ease',
            }}
        >
            <div style={{ 
                width: 50, height: 50, borderRadius: '50%', 
                background: u.role === 'admin' ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : C.line,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
                fontSize: 18, fontWeight: 600, color: C.ink,
            }}>
                {u.profile_image ? (
                    <img src={u.profile_image} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    u.username?.charAt(0)?.toUpperCase() || 'U'
                )}
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
                    <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{
                            padding: '2px 10px', borderRadius: 999, fontSize: 9,
                            background: u.role === 'admin' ? C.goldSoft : 
                                      u.role === 'staff' ? '#DBEAFE' : 
                                      u.role === 'guide' ? '#FEF3C7' : '#E5E7EB',
                            color: u.role === 'admin' ? C.gold : 
                                   u.role === 'staff' ? '#2563EB' : 
                                   u.role === 'guide' ? '#D97706' : '#6B7280',
                            fontWeight: 600
                        }}>
                            {u.role || 'tourister'}
                        </span>
                        <StatusPill status={u.is_active !== false ? 'active' : 'inactive'} />
                    </div>
                </div>
                {u.phone && <p style={{ fontSize: 11, color: C.sage, marginTop: 2 }}>📱 {u.phone}</p>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <button 
                        onClick={() => {
                            if (!window.confirm(`${u.is_active !== false ? 'Deactivate' : 'Activate'} this user?`)) return;
                            try {
                                const updated = users.map(user => 
                                    user.id === u.id ? { ...user, is_active: u.is_active === false } : user
                                );
                                setUsers(updated);
                                showToast(`✅ User ${u.is_active !== false ? 'deactivated' : 'activated'}!`);
                            } catch (e) {
                                showToast('❌ Failed to update user status');
                            }
                        }}
                        style={{ 
                            padding: '4px 12px', borderRadius: 999, border: 'none', 
                            background: u.is_active !== false ? C.dangerBg : C.successBg,
                            color: u.is_active !== false ? C.danger : C.success,
                            fontSize: 11, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        {u.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                        onClick={() => {
                            if (!window.confirm('Delete this user permanently?')) return;
                            setUsers(users.filter(user => user.id !== u.id));
                            showToast('✅ User deleted!');
                        }}
                        style={{ 
                            padding: '4px 12px', borderRadius: 999, 
                            border: `1px solid #EFCBB5`, background: C.dangerBg, 
                            color: C.danger, fontSize: 11, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        <Trash2 size={11} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );

    // ============================================
    // RENDER STAFF CARD
    // ============================================
    const renderStaffCard = (s) => (
        <div
            key={s.id}
            style={{
                display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md,
                border: `1px solid ${C.line}`, alignItems: 'flex-start', transition: 'all 0.2s ease',
            }}
        >
            <div style={{ 
                width: 50, height: 50, borderRadius: '50%', 
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
                fontSize: 18, fontWeight: 600, color: C.ink,
            }}>
                {s.profile_image ? (
                    <img src={s.profile_image} alt={s.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    s.email?.charAt(0)?.toUpperCase() || 'S'
                )}
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>{s.first_name || ''} {s.last_name || ''}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                            <span style={{ fontSize: 11, color: C.sage }}>{s.email}</span>
                        </div>
                    </div>
                    <StatusPill status={s.is_active !== false ? 'active' : 'inactive'} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <button 
                        onClick={() => {
                            if (!window.confirm(`${s.is_active !== false ? 'Deactivate' : 'Activate'} this staff?`)) return;
                            setStaff(staff.map(staff => 
                                staff.id === s.id ? { ...staff, is_active: s.is_active === false } : staff
                            ));
                            showToast(`✅ Staff ${s.is_active !== false ? 'deactivated' : 'activated'}!`);
                        }}
                        style={{ 
                            padding: '4px 12px', borderRadius: 999, border: 'none', 
                            background: s.is_active !== false ? C.dangerBg : C.successBg,
                            color: s.is_active !== false ? C.danger : C.success,
                            fontSize: 11, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        {s.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                        onClick={() => deleteStaff(s.id)}
                        style={{ 
                            padding: '4px 12px', borderRadius: 999, 
                            border: `1px solid #EFCBB5`, background: C.dangerBg, 
                            color: C.danger, fontSize: 11, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                        }}
                    >
                        <Trash2 size={11} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );

    // ============================================
    // RENDER CATEGORY CARD
    // ============================================
    const renderCategoryCard = (cat) => {
        const places = cat.places || [];
        return (
            <div
                key={cat.key}
                style={{
                    display: 'flex', flexDirection: 'column', background: C.paper, borderRadius: RADIUS.md,
                    border: `1px solid ${C.line}`, overflow: 'hidden', transition: 'all 0.2s ease',
                }}
            >
                <div style={{ 
                    height: 120, overflow: 'hidden', position: 'relative',
                    background: `linear-gradient(135deg, ${C.ink}, #0A4A44)`,
                }}>
                    <img 
                        src={cat.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'} 
                        alt={cat.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'; }}
                    />
                    <div style={{ 
                        position: 'absolute', bottom: 0, left: 0, right: 0, 
                        padding: '12px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'
                    }}>
                        <h4 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: 0, fontFamily: FONT.display }}>
                            {cat.title}
                        </h4>
                        <span style={{ fontSize: 11, color: C.goldLight, background: 'rgba(0,0,0,0.4)', padding: '2px 10px', borderRadius: 999 }}>
                            {places.length} places
                        </span>
                    </div>
                </div>
                
                <div style={{ padding: 14 }}>
                    <p style={{ fontSize: 12.5, color: C.sage, margin: '0 0 10px', lineHeight: 1.5 }}>
                        {cat.description || 'No description'}
                    </p>
                    
                    {places.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                            {places.slice(0, 3).map(p => (
                                <span key={p.id} style={{ fontSize: 10, padding: '2px 8px', background: C.cream, borderRadius: 999, color: C.sage }}>
                                    {p.name}
                                </span>
                            ))}
                            {places.length > 3 && (
                                <span style={{ fontSize: 10, padding: '2px 8px', background: C.cream, borderRadius: 999, color: C.sage }}>
                                    +{places.length - 3} more
                                </span>
                            )}
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button 
                            onClick={() => { setSelectedCategoryKey(cat.key); setShowPlaceModal(true); }}
                            style={{ 
                                padding: '4px 12px', borderRadius: 999, border: 'none', 
                                background: C.ink, color: C.goldLight, fontSize: 11, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4
                            }}
                        >
                            <Plus size={11} /> Add Place
                        </button>
                        <button 
                            onClick={() => deleteCategory(cat.key)}
                            style={{ 
                                padding: '4px 12px', borderRadius: 999, 
                                border: `1px solid #EFCBB5`, background: C.dangerBg, 
                                color: C.danger, fontSize: 11, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4
                            }}
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
                    <p style={{ marginTop: 14, color: C.sage, fontFamily: FONT.display, fontStyle: 'italic', fontSize: 15 }}>Loading admin dashboard…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ============================================
    // RENDER
    // ============================================
    const activeNavItem = navItems.find(n => n.key === activeTab);

    const tabDescriptions = {
        overview: 'Your dashboard at a glance',
        categories: 'Manage categories and places',
        users: 'Manage all users',
        staff: 'Manage staff members',
        guides: 'Manage tour guides',
        suggestions: 'Manage suggestions from users',
    };

    return (
        <div style={{ height: '100vh', background: C.cream, fontFamily: FONT.body, display: 'flex', overflow: 'hidden' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                .ad-nav-item:hover { background: ${C.goldSoft} !important; }
                .ad-card:hover { border-color: ${C.gold} !important; box-shadow: 0 4px 14px rgba(7,46,42,0.08); transform: translateY(-1px); }
                .ad-sidebar-scroll::-webkit-scrollbar { width: 4px; }
                .ad-sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(199,154,62,0.3); border-radius: 4px; }
                .ad-content-scroll::-webkit-scrollbar { width: 6px; }
                .ad-content-scroll::-webkit-scrollbar-thumb { background: rgba(199,154,62,0.3); border-radius: 4px; }
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
                <div className="ad-sidebar-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: 10 }}>
                    <div style={{ padding: '24px 22px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Shield size={16} color={C.goldLight} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <h1 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 17, color: C.inkSoft, margin: 0, lineHeight: 1.1 }}>Admin Panel</h1>
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
                            {profilePicture ? <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A')}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: C.inkSoft, margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || user?.first_name || 'Admin'}</p>
                            <span style={{ fontSize: 10.5, color: C.sage, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <Shield size={10} /> Administrator
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
                                    className="ad-nav-item"
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
                <div className="ad-content-scroll" style={{ flex: 1, overflowY: 'auto', padding: '30px 28px 60px' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        {/* Page header */}
                        <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <p style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, margin: '0 0 5px' }}>
                                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <h2 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 26, color: C.inkSoft, margin: 0 }}>{activeNavItem?.label}</h2>
                                <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>{tabDescriptions[activeTab]}</p>
                            </div>
                            <Btn variant="ghost" icon={RefreshCw} onClick={() => { dataFetchedRef.current = false; setRefreshing(true); fetchAllData().finally(() => setRefreshing(false)); }} disabled={refreshing} style={{ opacity: refreshing ? 0.6 : 1 }}>
                                {refreshing ? 'Updating…' : 'Update'}
                            </Btn>
                        </div>

                        {/* STATS */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
                            <StatChip label="Total Users" value={stats.totalUsers} icon={Users} tone="ink" />
                            <StatChip label="Staff" value={stats.totalStaff} icon={Shield} tone="gold" />
                            <StatChip label="Guides" value={stats.totalGuides} icon={UserCheck} tone="gold" />
                            <StatChip label="Categories" value={stats.totalCategories} icon={LayoutGrid} tone="gold" />
                            <StatChip label="Places" value={stats.totalPlaces} icon={Map} tone="ink" />
                            <StatChip label="Suggestions" value={stats.totalSuggestions} icon={MessageSquare} tone="gold" />
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
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 13, color: C.inkSoft, fontWeight: 500 }}>{cat.title}</p>
                                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.sage }}>{cat.places?.length || 0} places</p>
                                                </div>
                                                <span style={{ fontSize: 11, color: C.sage }}>{cat.key}</span>
                                            </div>
                                        ))
                                    )}
                                </Card>
                                <Card style={{ padding: 20 }}>
                                    <SectionHead icon={MessageSquare} title="Recent Suggestions" />
                                    {suggestions.slice(0, 5).length === 0 ? (
                                        <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '24px 0' }}>No suggestions yet.</p>
                                    ) : (
                                        suggestions.slice(0, 5).map((s) => (
                                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.line}` }}>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 13, color: C.inkSoft, fontWeight: 500 }}>{s.name}</p>
                                                    <p style={{ margin: '2px 0 0', fontSize: 11, color: C.sage }}>{s.user_email || 'Anonymous'} · {s.district || 'N/A'}</p>
                                                </div>
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
                                    <div>
                                        <h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>📂 Categories</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage categories and places</p>
                                    </div>
                                    <Btn variant="primary" icon={Plus} size="sm" onClick={() => { setCategoryForm({ key: '', label: '', description: '', image: '' }); setShowCategoryModal(true); }}>
                                        Add Category
                                    </Btn>
                                </div>
                                {categories.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No categories found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                                            {getPaginatedData(categories, categoriesPage).map((cat) => renderCategoryCard(cat))}
                                        </div>
                                        <Pagination
                                            currentPage={categoriesPage}
                                            totalPages={getTotalPages(categories)}
                                            onPageChange={setCategoriesPage}
                                            totalItems={categories.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div>
                                        <h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>👥 Users</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage all users ({users.length} total)</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select value={usersFilter} onChange={(e) => setUsersFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All Roles</option>
                                            <option value="tourister">Tourister</option>
                                            <option value="guide">Guide</option>
                                            <option value="staff">Staff</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                {users.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No users found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredUsers, usersPage).map((u) => renderUserCard(u))}
                                        </div>
                                        <Pagination
                                            currentPage={usersPage}
                                            totalPages={getTotalPages(filteredUsers)}
                                            onPageChange={setUsersPage}
                                            totalItems={filteredUsers.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Staff Tab */}
                        {activeTab === 'staff' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div>
                                        <h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>👔 Staff</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage staff members ({staff.length} total)</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All</option>
                                            <option value="active">🟢 Active</option>
                                            <option value="inactive">🔴 Inactive</option>
                                        </select>
                                        <Btn variant="primary" icon={Plus} size="sm" onClick={() => { setStaffForm({ email: '', password: '' }); setShowStaffModal(true); }}>
                                            Add Staff
                                        </Btn>
                                    </div>
                                </div>
                                {staff.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No staff members found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredStaff, staffPage).map((s) => renderStaffCard(s))}
                                        </div>
                                        <Pagination
                                            currentPage={staffPage}
                                            totalPages={getTotalPages(filteredStaff)}
                                            onPageChange={setStaffPage}
                                            totalItems={filteredStaff.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Guides Tab */}
                        {activeTab === 'guides' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div>
                                        <h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>🧭 Guides</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage tour guides ({guides.length} total)</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select value={guidesFilter} onChange={(e) => setGuidesFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All</option>
                                            <option value="verified">✅ Verified</option>
                                            <option value="unverified">⏳ Unverified</option>
                                            <option value="active">🟢 Active</option>
                                            <option value="inactive">🔴 Inactive</option>
                                        </select>
                                        <Btn variant="primary" icon={Plus} size="sm" onClick={() => { resetGuideForm(); setEditingGuide(null); setShowGuideModal(true); }}>
                                            Add Guide
                                        </Btn>
                                    </div>
                                </div>
                                {guides.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No guides found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredGuides, guidesPage).map((g) => renderGuideCard(g))}
                                        </div>
                                        <Pagination
                                            currentPage={guidesPage}
                                            totalPages={getTotalPages(filteredGuides)}
                                            onPageChange={setGuidesPage}
                                            totalItems={filteredGuides.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Suggestions Tab */}
                        {activeTab === 'suggestions' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div>
                                        <h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>💡 Suggestions</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage suggestions from users</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select value={suggestionFilter} onChange={(e) => setSuggestionFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All ({suggestions.length})</option>
                                            <option value="pending">⏳ Pending ({suggestions.filter(s => s.status === 'pending').length})</option>
                                            <option value="implemented">✨ Implemented ({suggestions.filter(s => s.status === 'implemented').length})</option>
                                            <option value="rejected">❌ Rejected ({suggestions.filter(s => s.status === 'rejected').length})</option>
                                            <option value="deleted">🗑️ Deleted ({deletedSuggestions.length})</option>
                                        </select>
                                    </div>
                                </div>
                                {filteredSuggestions.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No suggestions found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredSuggestions, suggestionsPage).map((s) => renderSuggestionCard(s))}
                                        </div>
                                        <Pagination
                                            currentPage={suggestionsPage}
                                            totalPages={getTotalPages(filteredSuggestions)}
                                            onPageChange={setSuggestionsPage}
                                            totalItems={filteredSuggestions.length}
                                            itemsPerPage={ITEMS_PER_PAGE}
                                        />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Profile Tab - integrated in sidebar */}
                    </div>
                </div>
            </div>

            {/* ============================================
                MODALS
            ============================================ */}

            {/* Category Modal */}
            {showCategoryModal && (
                <ModalShell
                    onClose={() => { setShowCategoryModal(false); setCategoryForm({ key: '', label: '', description: '', image: '' }); }}
                    title="Add Category"
                    subtitle="Create a new category"
                    icon={FolderPlus}
                    footer={
                        <>
                            <Btn variant="ghost" onClick={() => { setShowCategoryModal(false); setCategoryForm({ key: '', label: '', description: '', image: '' }); }}>Cancel</Btn>
                            <Btn variant="primary" icon={Plus} onClick={handleAddCategory} disabled={categoryLoading}>
                                {categoryLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {categoryLoading ? 'Adding...' : 'Add Category'}
                            </Btn>
                        </>
                    }
                >
                    <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Category Name <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={categoryForm.label}
                                onChange={(e) => {
                                    const label = e.target.value;
                                    setCategoryForm({ 
                                        ...categoryForm, 
                                        label: label,
                                        key: label.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                                    });
                                }}
                                style={inputStyle}
                                required
                                placeholder="e.g., Adventure Sports, Camping Sites"
                            />
                        </div>
                        {categoryForm.key && (
                            <div style={{ padding: 8, background: C.cream, borderRadius: RADIUS.sm, border: `1px solid ${C.line}` }}>
                                <p style={{ fontSize: 10, color: C.sage, margin: 0 }}>🔑 Key: <span style={{ fontFamily: FONT.mono, fontWeight: 600, color: C.ink }}>{categoryForm.key}</span></p>
                            </div>
                        )}
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Description
                            </label>
                            <textarea
                                value={categoryForm.description}
                                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                rows={3}
                                placeholder="Describe this category..."
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Image URL
                            </label>
                            <input
                                type="url"
                                value={categoryForm.image}
                                onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                                style={inputStyle}
                                placeholder="https://images.unsplash.com/..."
                            />
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Place Modal */}
            {showPlaceModal && (
                <ModalShell
                    onClose={() => { setShowPlaceModal(false); setPlaceForm({ name: '', location: '', district: '', description: '', difficulty: '', duration: '', best_time: '', image: '', type: 'well-known', hidden_gem: '' }); }}
                    title="Add Place"
                    subtitle={`Add to ${categories.find(c => c.key === selectedCategoryKey)?.title || 'Category'}`}
                    icon={Map}
                    footer={
                        <>
                            <Btn variant="ghost" onClick={() => { setShowPlaceModal(false); setPlaceForm({ name: '', location: '', district: '', description: '', difficulty: '', duration: '', best_time: '', image: '', type: 'well-known', hidden_gem: '' }); }}>Cancel</Btn>
                            <Btn variant="primary" icon={Plus} onClick={handleAddPlace} disabled={placeLoading}>
                                {placeLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {placeLoading ? 'Adding...' : 'Add Place'}
                            </Btn>
                        </>
                    }
                >
                    <form onSubmit={handleAddPlace} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Place Name <span style={{ color: C.danger }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={placeForm.name}
                                    onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                                    style={inputStyle}
                                    required
                                    placeholder="Place name"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    District <span style={{ color: C.danger }}>*</span>
                                </label>
                                <select
                                    value={placeForm.district}
                                    onChange={(e) => setPlaceForm({ ...placeForm, district: e.target.value })}
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
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Location (Specific area)
                            </label>
                            <input
                                type="text"
                                value={placeForm.location}
                                onChange={(e) => setPlaceForm({ ...placeForm, location: e.target.value })}
                                style={inputStyle}
                                placeholder="e.g., Varkala, Munnar Town"
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Description
                            </label>
                            <textarea
                                value={placeForm.description}
                                onChange={(e) => setPlaceForm({ ...placeForm, description: e.target.value })}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                rows={2}
                                placeholder="Describe the place..."
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Difficulty
                                </label>
                                <input
                                    type="text"
                                    value={placeForm.difficulty}
                                    onChange={(e) => setPlaceForm({ ...placeForm, difficulty: e.target.value })}
                                    style={inputStyle}
                                    placeholder="Easy"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Duration
                                </label>
                                <input
                                    type="text"
                                    value={placeForm.duration}
                                    onChange={(e) => setPlaceForm({ ...placeForm, duration: e.target.value })}
                                    style={inputStyle}
                                    placeholder="2-3 hours"
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Best Time
                                </label>
                                <input
                                    type="text"
                                    value={placeForm.best_time}
                                    onChange={(e) => setPlaceForm({ ...placeForm, best_time: e.target.value })}
                                    style={inputStyle}
                                    placeholder="October to March"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Type
                                </label>
                                <select
                                    value={placeForm.type}
                                    onChange={(e) => setPlaceForm({ ...placeForm, type: e.target.value })}
                                    style={selectStyle}
                                >
                                    <option value="well-known">⭐ Well Known</option>
                                    <option value="hidden">✨ Hidden Gem</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Image URL
                                </label>
                                <input
                                    type="url"
                                    value={placeForm.image}
                                    onChange={(e) => setPlaceForm({ ...placeForm, image: e.target.value })}
                                    style={inputStyle}
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Hidden Gem Description
                            </label>
                            <textarea
                                value={placeForm.hidden_gem}
                                onChange={(e) => setPlaceForm({ ...placeForm, hidden_gem: e.target.value })}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                rows={2}
                                placeholder="What makes this a hidden gem?"
                            />
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Staff Modal */}
            {showStaffModal && (
                <ModalShell
                    onClose={() => { setShowStaffModal(false); setStaffForm({ email: '', password: '' }); }}
                    title="Add Staff"
                    subtitle="Create a new staff account"
                    icon={Shield}
                    footer={
                        <>
                            <Btn variant="ghost" onClick={() => { setShowStaffModal(false); setStaffForm({ email: '', password: '' }); }}>Cancel</Btn>
                            <Btn variant="primary" icon={Plus} onClick={handleAddStaff} disabled={staffLoading}>
                                {staffLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {staffLoading ? 'Adding...' : 'Add Staff'}
                            </Btn>
                        </>
                    }
                >
                    <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Email <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                type="email"
                                value={staffForm.email}
                                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                                style={inputStyle}
                                required
                                placeholder="staff@example.com"
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Password <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={staffForm.password}
                                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                                style={inputStyle}
                                required
                                placeholder="Set a password"
                                minLength={6}
                            />
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Guide Modal */}
            {showGuideModal && (
                <ModalShell
                    onClose={() => { setShowGuideModal(false); setEditingGuide(null); resetGuideForm(); }}
                    title={editingGuide ? 'Edit Guide' : 'Add Guide'}
                    subtitle={editingGuide ? 'Update guide information' : 'Create a new guide account'}
                    icon={UserCheck}
                    maxWidth={640}
                    footer={
                        <>
                            <Btn variant="ghost" onClick={() => { setShowGuideModal(false); setEditingGuide(null); resetGuideForm(); }}>Cancel</Btn>
                            <Btn variant="primary" icon={editingGuide ? Save : Plus} onClick={editingGuide ? handleUpdateGuide : handleAddGuide} disabled={guideLoading}>
                                {guideLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {guideLoading ? 'Saving...' : (editingGuide ? 'Update Guide' : 'Add Guide')}
                            </Btn>
                        </>
                    }
                >
                    <form onSubmit={editingGuide ? handleUpdateGuide : handleAddGuide} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                                    disabled={!!editingGuide}
                                    placeholder="guide@example.com"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Password {!editingGuide && <span style={{ color: C.danger }}>*</span>}
                                </label>
                                <input
                                    type="text"
                                    value={guideForm.password}
                                    onChange={(e) => setGuideForm({ ...guideForm, password: e.target.value })}
                                    style={inputStyle}
                                    required={!editingGuide}
                                    placeholder={editingGuide ? 'Leave blank to keep current' : 'Set a password'}
                                />
                            </div>
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
                                    maxLength={12}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Bio
                            </label>
                            <textarea
                                value={guideForm.bio}
                                onChange={(e) => setGuideForm({ ...guideForm, bio: e.target.value })}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                rows={2}
                                placeholder="Experienced tour guide..."
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Verification
                                </label>
                                <select
                                    value={guideForm.is_verified ? 'true' : 'false'}
                                    onChange={(e) => setGuideForm({ ...guideForm, is_verified: e.target.value === 'true' })}
                                    style={selectStyle}
                                >
                                    <option value="false">⏳ Pending</option>
                                    <option value="true">✅ Verified</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Status
                                </label>
                                <select
                                    value={guideForm.is_active ? 'true' : 'false'}
                                    onChange={(e) => setGuideForm({ ...guideForm, is_active: e.target.value === 'true' })}
                                    style={selectStyle}
                                >
                                    <option value="true">🟢 Active</option>
                                    <option value="false">🔴 Inactive</option>
                                </select>
                            </div>
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Credentials Modal */}
            {showCredentialsModal && (
                <ModalShell
                    onClose={() => { setShowCredentialsModal(false); setNewCredentials({ email: '', password: '' }); }}
                    title="✅ Account Created!"
                    subtitle="Share these credentials with the user"
                    icon={UserCheck}
                    footer={
                        <>
                            <Btn variant="primary" onClick={() => {
                                navigator.clipboard?.writeText(`Email: ${newCredentials.email}\nPassword: ${newCredentials.password}`);
                                showToast('✅ Credentials copied!');
                            }}>
                                📋 Copy
                            </Btn>
                            <Btn variant="ghost" onClick={() => { setShowCredentialsModal(false); setNewCredentials({ email: '', password: '' }); }}>Done</Btn>
                        </>
                    }
                >
                    <div style={{ padding: 16, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${C.line}` }}>
                        <div style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: 11, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Email</p>
                            <p style={{ fontSize: 16, fontWeight: 600, color: C.inkSoft, fontFamily: FONT.mono }}>{newCredentials.email}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: C.sageLight, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: FONT.mono, margin: 0 }}>Password</p>
                            <p style={{ fontSize: 16, fontWeight: 600, color: C.gold, fontFamily: FONT.mono }}>{newCredentials.password}</p>
                        </div>
                    </div>
                    <p style={{ fontSize: 12, color: C.sage, marginTop: 12, textAlign: 'center' }}>
                        🔒 User can login with these credentials and change password later.
                    </p>
                </ModalShell>
            )}

            {/* Suggestion Detail Modal */}
            {showSuggestionModal && selectedSuggestion && (
                <ModalShell
                    onClose={() => { setShowSuggestionModal(false); setSelectedSuggestion(null); }}
                    title={selectedSuggestion.name || 'Details'}
                    subtitle={selectedSuggestion.district || 'N/A'}
                    icon={MessageSquare}
                    footer={
                        <>
                            {selectedSuggestion.status === 'pending' && (
                                <Btn variant="primary" icon={CheckCircle} onClick={() => processSuggestion(selectedSuggestion.id, 'implement')} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                    Implement
                                </Btn>
                            )}
                            {selectedSuggestion.status === 'implemented' && (
                                <span style={{ padding: '8px 16px', borderRadius: RADIUS.sm, background: C.warnBg, color: C.gold, fontSize: 13, fontWeight: 600 }}>
                                    ✨ Implemented
                                </span>
                            )}
                            {selectedSuggestion.status !== 'deleted' && !selectedSuggestion.deleted_at && (
                                <Btn variant="danger" icon={Trash2} onClick={() => processSuggestion(selectedSuggestion.id, 'delete')} disabled={actionLoading} style={{ opacity: actionLoading ? 0.5 : 1 }}>
                                    Delete
                                </Btn>
                            )}
                            {selectedSuggestion.deleted_at && (
                                <Btn variant="success" icon={RefreshCw} onClick={() => recoverDeletedSuggestion(selectedSuggestion.id)}>
                                    Recover
                                </Btn>
                            )}
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
                        <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.goldSoft, color: C.gold }}>{selectedSuggestion.category || 'General'}</span>
                        <span style={{ fontSize: 12, padding: '3px 12px', borderRadius: 999, background: C.cream, color: C.sage }}>{selectedSuggestion.user_email || 'Anonymous'}</span>
                        <StatusPill status={selectedSuggestion.deleted_at ? 'deleted' : (selectedSuggestion.status || 'pending')} />
                    </div>
                    <p style={{ fontSize: 14, color: C.sage, lineHeight: 1.6, marginBottom: 12 }}>{selectedSuggestion.description || 'No description'}</p>
                    {selectedSuggestion.admin_notes && (
                        <div style={{ background: C.cream, padding: 12, borderRadius: RADIUS.sm }}>
                            <p style={{ fontSize: 11, color: C.gold, margin: 0, fontWeight: 600 }}>📝 Admin Notes</p>
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
                    {selectedSuggestion.deleted_at && (
                        <div style={{ marginTop: 8, padding: 8, background: C.dangerBg, borderRadius: RADIUS.sm }}>
                            <p style={{ fontSize: 11, color: C.danger, margin: 0 }}>🗑️ Deleted: {new Date(selectedSuggestion.deleted_at).toLocaleString()}</p>
                            {selectedSuggestion.deleted_by && (
                                <p style={{ fontSize: 11, color: C.danger, margin: '4px 0 0' }}>By: {selectedSuggestion.deleted_by}</p>
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

export default AdminDashboard;
// src/pages/AdminDashboard.jsx - COMPLETE FIXED VERSION
// Items per page: 8 | Profile tab removed | Touristers blocked | Overview tab fully working

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
    Phone,
    Mail,
    Calendar,
    Key,
    TrendingUp,
    Award,
    Clock,
    ArrowUpRight,
    Flame,
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
const ITEMS_PER_PAGE = 8; // ✅ Changed from 6 to 8

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

// ============================================
// OVERVIEW HELPER COMPONENTS
// ============================================

const StatusProgress = ({ label, value, total, color, bg }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#0B2422' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: color }}>{value}</span>
            </div>
            <div style={{
                height: 8,
                borderRadius: 6,
                background: '#EFE6CF',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    borderRadius: 6,
                    background: color,
                    transition: 'width 1s ease'
                }} />
            </div>
        </div>
    );
};

const OverviewTile = ({ label, value, icon: Icon, color, bg }) => (
    <div style={{
        padding: '14px 16px',
        background: bg || '#F9FAFB',
        borderRadius: 12,
        border: '1px solid rgba(239,230,207,0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 12
    }}>
        <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Icon size={16} color={color} />
        </div>
        <div>
            <p style={{ fontSize: 11, color: '#7A7568', margin: 0 }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#0B2422', margin: 0 }}>{value}</p>
        </div>
    </div>
);

const ActivityRow = ({ title, type, status }) => {
    const getIcon = () => {
        if (type === 'hidden_gem') return '💎';
        if (type === 'local_insight' || type === 'insight') return '💡';
        if (type === 'review') return '⭐';
        return '📝';
    };
    
    const getStatusColor = () => {
        if (status === 'implemented') return '#3F7A5E';
        if (status === 'rejected') return '#B4472A';
        return '#B4791F';
    };
    
    const getStatusBg = () => {
        if (status === 'implemented') return '#EAF3EE';
        if (status === 'rejected') return '#FDF1EC';
        return '#FBF1DC';
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            background: '#FBF6EA',
            borderRadius: 12,
            border: '1px solid #EFE6CF'
        }}>
            <span style={{ fontSize: 20 }}>{getIcon()}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    fontSize: 13,
                    color: '#0B2422',
                    margin: 0,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {title}
                </p>
                <p style={{
                    fontSize: 11,
                    color: '#7A7568',
                    margin: '2px 0 0',
                    textTransform: 'capitalize'
                }}>
                    {type?.replace('_', ' ') || 'suggestion'}
                </p>
            </div>
            <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '3px 12px',
                borderRadius: 20,
                color: getStatusColor(),
                background: getStatusBg(),
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
            }}>
                {status || 'pending'}
            </span>
        </div>
    );
};

const ActionButton = ({ label, icon: Icon, onClick, color }) => (
    <button onClick={onClick} style={{
        padding: '14px 16px',
        background: '#FBF6EA',
        borderRadius: 12,
        border: '1px solid #EFE6CF',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.2s ease',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 12,
        fontWeight: 500,
        color: '#0B2422'
    }} onMouseEnter={(e) => {
        e.target.style.background = '#F5EDD6';
        e.target.style.borderColor = color;
    }} onMouseLeave={(e) => {
        e.target.style.background = '#FBF6EA';
        e.target.style.borderColor = '#EFE6CF';
    }}>
        <Icon size={18} color={color} />
        <span>{label}</span>
    </button>
);

const StatusBar = ({ label, count, total, color, bg }) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: C.sage }}>{label}</span>
                <span style={{ color: C.inkSoft, fontWeight: 500 }}>{count} ({percentage}%)</span>
            </div>
            <div style={{
                height: 6,
                borderRadius: 3,
                background: C.line,
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    borderRadius: 3,
                    background: color,
                    transition: 'width 1s ease'
                }} />
            </div>
        </div>
    );
};

const StatusPill = ({ status }) => {
    const map = {
        pending: { fg: C.warn, bg: C.warnBg, label: '⏳ Pending' },
        pending_guide: { fg: C.warn, bg: C.warnBg, label: '⏳ Pending' },
        pending_admin: { fg: C.warn, bg: C.warnBg, label: '⏳ Pending' },
        approved: { fg: C.success, bg: C.successBg, label: '✅ Approved' },
        approved_by_guide: { fg: C.success, bg: C.successBg, label: '✅ Approved' },
        approved_by_admin: { fg: C.success, bg: C.successBg, label: '✅ Approved' },
        staff_approved: { fg: C.success, bg: C.successBg, label: '✅ Approved' },
        implemented: { fg: C.gold, bg: C.warnBg, label: '✨ Implemented' },
        rejected: { fg: C.danger, bg: C.dangerBg, label: '❌ Rejected' },
        rejected_by_guide: { fg: C.danger, bg: C.dangerBg, label: '❌ Rejected' },
        rejected_by_admin: { fg: C.danger, bg: C.dangerBg, label: '❌ Rejected' },
        staff_rejected: { fg: C.danger, bg: C.dangerBg, label: '❌ Rejected' },
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
    const [showEditStaffModal, setShowEditStaffModal] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
    const [showGuideViewModal, setShowGuideViewModal] = useState(false);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [showAddInsightModal, setShowAddInsightModal] = useState(false);
    const [showAddHiddenGemModal, setShowAddHiddenGemModal] = useState(false);
    const [showTouristerModal, setShowTouristerModal] = useState(false);
    const [showEditTouristerModal, setShowEditTouristerModal] = useState(false);

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

    // Tourister form states
    const [touristerForm, setTouristerForm] = useState({
        full_name: '', email: '', password: '', phone: '', is_active: true
    });
    const [editingTourister, setEditingTourister] = useState(null);
    const [touristerLoading, setTouristerLoading] = useState(false);

    // Staff form states
    const [staffForm, setStaffForm] = useState({
        full_name: '', email: '', password: '', phone: '', is_active: true
    });
    const [editingStaff, setEditingStaff] = useState(null);
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
    // NAV ITEMS - PROFILE REMOVED
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
    // PROFILE PICTURE
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

    // ============================================
    // PAGINATION HELPERS
    // ============================================
    const getPaginatedData = (data, page) => {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return data.slice(startIndex, endIndex);
    };

    const getTotalPages = (data) => Math.ceil(data.length / ITEMS_PER_PAGE);

    // ============================================
    // CLEAR CACHE
    // ============================================
    const clearCache = () => {
        try {
            localStorage.removeItem('suggestions_data');
            localStorage.removeItem('categories_data');
            localStorage.removeItem('admin_profile_picture');
            console.log('🗑️ Cache cleared');
        } catch (e) {
            console.log('Cache clear failed:', e);
        }
    };

    // ============================================
    // FETCH ALL DATA
    // ============================================
    const fetchAllData = useCallback(async (forceRefresh = false) => {
        if (dataFetchedRef.current && !forceRefresh) return;
        
        if (forceRefresh) {
            clearCache();
            dataFetchedRef.current = false;
        }
        
        dataFetchedRef.current = true;
        setLoading(true);
        setRefreshing(true);

        try {
            // 1. Fetch categories
            try {
                console.log('🔍 Fetching categories...');
                const response = await api.get('/destinations/destinations/category-data/');
                console.log('📊 Categories response:', response.data);
                
                if (response?.data?.success) {
                    let categoriesData = response.data.data || [];
                    console.log(`✅ Loaded ${categoriesData.length} categories`);
                    
                    categoriesData = categoriesData.map(cat => ({
                        ...cat,
                        places: cat.places || []
                    }));
                    
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
                    
                    const totalPlaces = categoriesData.reduce((sum, cat) => sum + (cat.count || cat.places?.length || 0), 0);
                    setStats(prev => ({
                        ...prev,
                        totalCategories: categoriesData.length,
                        totalPlaces: totalPlaces
                    }));
                } else {
                    console.warn('⚠️ Categories response not successful:', response?.data);
                    setCategories([]);
                    setAllPlaces([]);
                }
            } catch (error) {
                console.error('❌ Error fetching categories:', error);
                setCategories([]);
                setAllPlaces([]);
            }

            // 2. Fetch suggestions
            try {
                console.log('🔍 Fetching suggestions...');
                const response = await api.get('/suggestions/admin-suggestions/');
                console.log('📊 Suggestions response:', response.data);
                
                let items = [];
                
                if (response?.data) {
                    if (response.data.data && Array.isArray(response.data.data)) {
                        items = response.data.data;
                    } else if (response.data.results && Array.isArray(response.data.results)) {
                        items = response.data.results;
                    } else if (Array.isArray(response.data)) {
                        items = response.data;
                    } else if (response.data.results && response.data.results.data && Array.isArray(response.data.results.data)) {
                        items = response.data.results.data;
                    } else {
                        for (const key in response.data) {
                            if (Array.isArray(response.data[key])) {
                                items = response.data[key];
                                break;
                            }
                        }
                    }
                }
                
                console.log(`✅ Loaded ${items.length} suggestions`);
                
                setAllSuggestions(items);

                const gems = items.filter(s => {
                    const type = (s.suggestion_type || s.type || '').toLowerCase();
                    return type === 'hidden_gem';
                });
                
                const insights = items.filter(s => {
                    const type = (s.suggestion_type || s.type || '').toLowerCase();
                    return type === 'local_insight' || type === 'insight';
                });
                
                const reviewsItems = items.filter(s => {
                    const type = (s.suggestion_type || s.type || '').toLowerCase();
                    return type === 'review';
                });

                console.log(`📊 Hidden Gems: ${gems.length}, Insights: ${insights.length}, Reviews: ${reviewsItems.length}`);

                setHiddenGems(gems);
                setLocalInsights(insights);
                setReviews(reviewsItems);

                setStats(prev => ({
                    ...prev,
                    totalHiddenGems: gems.length,
                    pendingHiddenGems: gems.filter(s => {
                        const status = (s.status || '').toLowerCase();
                        return status === 'pending' || status === 'pending_guide' || status === 'pending_admin';
                    }).length,
                    implementedHiddenGems: gems.filter(s => {
                        const status = (s.status || '').toLowerCase();
                        return status === 'implemented';
                    }).length,
                    totalLocalInsights: insights.length,
                    pendingLocalInsights: insights.filter(s => {
                        const status = (s.status || '').toLowerCase();
                        return status === 'pending' || status === 'pending_guide' || status === 'pending_admin';
                    }).length,
                    implementedLocalInsights: insights.filter(s => {
                        const status = (s.status || '').toLowerCase();
                        return status === 'implemented';
                    }).length,
                    totalReviews: reviewsItems.length,
                    pendingReviews: reviewsItems.filter(s => {
                        const status = (s.status || '').toLowerCase();
                        return status === 'pending' || status === 'pending_guide' || status === 'pending_admin';
                    }).length,
                    implementedReviews: reviewsItems.filter(s => {
                        const status = (s.status || '').toLowerCase();
                        return status === 'implemented';
                    }).length,
                }));
            } catch (error) {
                console.error('❌ Error fetching suggestions:', error);
                setAllSuggestions([]);
                setHiddenGems([]);
                setLocalInsights([]);
                setReviews([]);
            }

            // 3. Fetch touristers
            try {
                console.log('🔍 Fetching touristers...');
                const response = await api.get('/admin/touristers/');
                console.log('📊 Touristers response:', response.data);
                
                if (response?.data?.success) {
                    const touristersData = response.data.touristers || [];
                    console.log(`✅ Loaded ${touristersData.length} touristers`);
                    setTouristers(touristersData);
                    setUsers(touristersData);
                    setStats(prev => ({ ...prev, totalUsers: touristersData.length }));
                } else {
                    setTouristers([]);
                    setUsers([]);
                }
            } catch (error) {
                console.error('❌ Error fetching touristers:', error);
                setTouristers([]);
                setUsers([]);
            }

            // 4. Fetch staff
            try {
                console.log('🔍 Fetching staff...');
                const response = await api.get('/admin/staff/');
                console.log('📊 Staff response:', response.data);
                
                if (response?.data?.success) {
                    const staffData = response.data.staff || [];
                    console.log(`✅ Loaded ${staffData.length} staff members`);
                    setStaff(staffData);
                    setStats(prev => ({ ...prev, totalStaff: staffData.length }));
                } else {
                    setStaff([]);
                }
            } catch (error) {
                console.error('❌ Error fetching staff:', error);
                setStaff([]);
            }

            // 5. Fetch guides
            try {
                console.log('🔍 Fetching guides...');
                const response = await api.get('/admin/guides/');
                console.log('📊 Guides response:', response.data);
                
                if (response?.data?.success) {
                    const guidesData = response.data.guides || [];
                    console.log(`✅ Loaded ${guidesData.length} guides`);
                    setGuides(guidesData);
                    setStats(prev => ({ ...prev, totalGuides: guidesData.length }));
                } else {
                    setGuides([]);
                }
            } catch (error) {
                console.error('❌ Error fetching guides:', error);
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

    // ============================================
    // useEffect - AUTH CHECK & REDIRECT
    // ============================================
    useEffect(() => {
        // ✅ Check if user is logged in
        if (!user) {
            navigate('/login');
            return;
        }
        
        // ✅ Only allow ADMIN to access this dashboard
        if (user.role !== 'admin') {
            // Redirect based on role
            const roleRedirects = {
                'tourister': '/',
                'guide': '/guide-dashboard',
                'staff': '/staff-dashboard',
            };
            navigate(roleRedirects[user.role] || '/');
            return;
        }
        
        // ✅ If admin, fetch data
        if (!dataFetchedRef.current) {
            fetchAllData(true);
        }
        
        return () => { 
            dataFetchedRef.current = false; 
        };
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
                await fetchAllData(true);
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
    // TOURISTER CRUD
    // ============================================
    const openAddTourister = () => {
        setEditingTourister(null);
        setTouristerForm({ full_name: '', email: '', password: '', phone: '', is_active: true });
        setShowTouristerModal(true);
    };

    const openEditTourister = (tourister) => {
        setEditingTourister(tourister);
        setTouristerForm({
            full_name: `${tourister.first_name || ''} ${tourister.last_name || ''}`.trim(),
            email: tourister.email || '',
            password: '',
            phone: tourister.phone || '',
            is_active: tourister.is_active !== false,
        });
        setShowEditTouristerModal(true);
    };

    const handleAddTourister = async (e) => {
        e.preventDefault();
        setTouristerLoading(true);
        try {
            const response = await api.post('/admin/touristers/add/', touristerForm);
            if (response?.data?.success) {
                showToast('✅ Tourister added successfully!');
                setShowTouristerModal(false);
                setTouristerForm({ full_name: '', email: '', password: '', phone: '', is_active: true });
                await fetchAllData(true);
            } else {
                showToast(response?.data?.error || 'Failed to add tourister', 'error');
            }
        } catch (error) {
            console.error('Error adding tourister:', error);
            showToast(error.response?.data?.error || 'Failed to add tourister', 'error');
        } finally {
            setTouristerLoading(false);
        }
    };

    const handleUpdateTourister = async (e) => {
        e.preventDefault();
        setTouristerLoading(true);
        try {
            const data = {
                first_name: touristerForm.full_name.split(' ')[0] || '',
                last_name: touristerForm.full_name.split(' ').slice(1).join(' ') || '',
                phone: touristerForm.phone,
                is_active: touristerForm.is_active,
            };
            if (touristerForm.password) {
                data.password = touristerForm.password;
            }
            const response = await api.patch(`/admin/touristers/${editingTourister.id}/update/`, data);
            if (response?.data?.success) {
                showToast('✅ Tourister updated successfully!');
                setShowEditTouristerModal(false);
                setEditingTourister(null);
                setTouristerForm({ full_name: '', email: '', password: '', phone: '', is_active: true });
                await fetchAllData(true);
            } else {
                showToast(response?.data?.error || 'Failed to update tourister', 'error');
            }
        } catch (error) {
            console.error('Error updating tourister:', error);
            showToast(error.response?.data?.error || 'Failed to update tourister', 'error');
        } finally {
            setTouristerLoading(false);
        }
    };

    const deleteTourister = async (id) => {
        if (!window.confirm('Are you sure you want to delete this tourister?')) return;
        try {
            setLoading(true);
            const response = await api.delete(`/admin/touristers/${id}/delete/`);
            if (response?.data?.success || response?.status === 204 || response?.status === 200) {
                showToast('✅ Tourister deleted successfully!');
                setTouristers(prev => prev.filter(u => u.id !== id));
                setUsers(prev => prev.filter(u => u.id !== id));
                setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
                await fetchAllData(true);
            } else {
                showToast(response?.data?.error || 'Failed to delete tourister', 'error');
            }
        } catch (error) {
            console.error('Error deleting tourister:', error);
            showToast(error.response?.data?.error || 'Failed to delete tourister', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleTouristerStatus = async (tourister) => {
        if (!window.confirm(`${tourister.is_active ? 'Deactivate' : 'Activate'} this tourister?`)) return;
        try {
            const response = await api.post(`/admin/touristers/${tourister.id}/toggle-status/`);
            if (response?.data?.success) {
                showToast(`✅ Tourister ${response.data.is_active ? 'activated' : 'deactivated'}!`);
                await fetchAllData(true);
            }
        } catch (error) {
            console.error('Error toggling tourister status:', error);
            showToast('Failed to toggle status', 'error');
        }
    };

    // ============================================
    // STAFF CRUD
    // ============================================
    const openAddStaff = () => {
        setEditingStaff(null);
        setStaffForm({ full_name: '', email: '', password: '', phone: '', is_active: true });
        setShowStaffModal(true);
    };

    const openEditStaff = (staffMember) => {
        setEditingStaff(staffMember);
        setStaffForm({
            full_name: `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim(),
            email: staffMember.email || '',
            password: '',
            phone: staffMember.phone || '',
            is_active: staffMember.is_active !== false,
        });
        setShowEditStaffModal(true);
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        setStaffLoading(true);
        try {
            const response = await api.post('/admin/staff/add/', staffForm);
            if (response?.data?.success) {
                setNewCredentials({ email: staffForm.email, password: response.data.password || staffForm.password });
                setShowCredentialsModal(true);
                setShowStaffModal(false);
                setStaffForm({ full_name: '', email: '', password: '', phone: '', is_active: true });
                showToast('✅ Staff added successfully!');
                await fetchAllData(true);
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

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        setStaffLoading(true);
        try {
            const data = {
                first_name: staffForm.full_name.split(' ')[0] || '',
                last_name: staffForm.full_name.split(' ').slice(1).join(' ') || '',
                phone: staffForm.phone,
                is_active: staffForm.is_active,
            };
            if (staffForm.password) {
                data.password = staffForm.password;
            }
            const response = await api.patch(`/admin/staff/${editingStaff.id}/update/`, data);
            if (response?.data?.success) {
                showToast('✅ Staff updated successfully!');
                setShowEditStaffModal(false);
                setEditingStaff(null);
                setStaffForm({ full_name: '', email: '', password: '', phone: '', is_active: true });
                await fetchAllData(true);
            } else {
                showToast(response?.data?.error || 'Failed to update staff', 'error');
            }
        } catch (error) {
            console.error('Error updating staff:', error);
            showToast(error.response?.data?.error || 'Failed to update staff', 'error');
        } finally {
            setStaffLoading(false);
        }
    };

    const deleteStaff = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;
        try {
            setLoading(true);
            const response = await api.delete(`/admin/staff/${id}/delete/`);
            if (response?.data?.success || response?.status === 204 || response?.status === 200) {
                showToast('✅ Staff deleted successfully!');
                setStaff(prev => prev.filter(s => s.id !== id));
                setStats(prev => ({ ...prev, totalStaff: prev.totalStaff - 1 }));
                await fetchAllData(true);
            } else {
                showToast(response?.data?.error || 'Failed to delete staff', 'error');
            }
        } catch (error) {
            console.error('Error deleting staff:', error);
            showToast(error.response?.data?.error || 'Failed to delete staff', 'error');
        } finally {
            setLoading(false);
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
                is_verified: true,
                is_active: guideForm.is_active
            };

            const response = await api.post('/admin/guides/add/', data);
            if (response?.data?.success) {
                setNewCredentials({ email: guideForm.email, password: response.data.password || guideForm.password || 'guide123456' });
                setShowCredentialsModal(true);
                setShowGuideModal(false);
                resetGuideForm();
                showToast('✅ Guide added successfully!');
                await fetchAllData(true);
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

    const handleEditGuideProfilePicUpload = async (guideId) => {
        if (!editGuidePicFile) return true;
        
        try {
            const formData = new FormData();
            formData.append('profile_image', editGuidePicFile);
            const response = await api.post(`/admin/guides/${guideId}/upload-profile-pic/`, formData, {
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

            const response = await api.patch(`/admin/guides/${editingGuide.id}/update/`, data);
            
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
                await fetchAllData(true);
            } else {
                showToast(response?.data?.error || 'Failed to update guide', 'error');
            }
        } catch (error) {
            console.error('Error updating guide:', error);
            showToast(error.response?.data?.error || 'Failed to update guide', 'error');
        } finally {
            setGuideLoading(false);
        }
    };

    const deleteGuide = async (id) => {
        if (!window.confirm('Are you sure you want to delete this guide? This action cannot be undone.')) {
            return;
        }
        
        try {
            setLoading(true);
            console.log(`🗑️ Attempting to delete guide with ID: ${id}`);
            
            const response = await api.delete(`/admin/guides/${id}/delete/`);
            console.log('📊 Delete response:', response.data);
            
            if (response.status === 200 || response.status === 204 || response?.data?.success) {
                showToast('✅ Guide deleted successfully!');
                setGuides(prev => prev.filter(g => g.id !== id));
                setStats(prev => ({ 
                    ...prev, 
                    totalGuides: Math.max(0, prev.totalGuides - 1) 
                }));
                await fetchAllData(true);
            } else {
                showToast(response?.data?.error || 'Failed to delete guide', 'error');
            }
        } catch (error) {
            console.error('❌ Error deleting guide:', error);
            showToast(error.response?.data?.error || 'Failed to delete guide', 'error');
        } finally {
            setLoading(false);
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
                await fetchAllData(true);
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
                await fetchAllData(true);
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
        try {
            setLoading(true);
            const response = await api.delete(`/destinations/destinations/admin/categories/${key}/`);
            if (response?.data?.success || response?.status === 204 || response?.status === 200) {
                showToast('✅ Category deleted successfully');
                setCategories(prev => prev.filter(c => c.key !== key));
                setAllPlaces(prev => prev.filter(p => p.category_key !== key));
                await fetchAllData(true);
            } else {
                showToast(response?.data?.error || 'Failed to delete category', 'error');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Failed to delete category', 'error');
        } finally {
            setLoading(false);
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
                await fetchAllData(true);
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
                await fetchAllData(true);
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
        try {
            setLoading(true);
            const response = await api.delete(`/destinations/destinations/admin/places/${placeId}/`);
            if (response?.data?.success || response?.status === 204 || response?.status === 200) {
                showToast('✅ Place deleted successfully');
                setAllPlaces(prev => prev.filter(p => p.id !== placeId));
                await fetchAllData(true);
            } else {
                showToast(response?.data?.error || 'Failed to delete place', 'error');
            }
        } catch (error) {
            console.error('Error deleting place:', error);
            showToast('Failed to delete place', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // SUGGESTION PROCESSING
    // ============================================
    const processSuggestion = async (id, action, type = 'suggestion') => {
        setActionLoading(true);
        setProcessingId(id);

        try {
            if (action === 'delete') {
                if (!window.confirm(`Delete this ${type} permanently?`)) {
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }
                try {
                    const response = await api.delete(`/admin/suggestions/${id}/delete/`);
                    if (response?.status === 204 || response?.data?.success || response?.status === 200) {
                        showToast('🗑️ Deleted successfully!');
                        setAllSuggestions(prev => prev.filter(s => s.id !== id));
                        setHiddenGems(prev => prev.filter(s => s.id !== id));
                        setLocalInsights(prev => prev.filter(s => s.id !== id));
                        setReviews(prev => prev.filter(s => s.id !== id));
                        await fetchAllData(true);
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
                    await fetchAllData(true);
                    showToast('Failed to delete', 'error');
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }
            }

            let endpoint = '';
            if (action === 'implement') {
                endpoint = `/admin/suggestions/${id}/implement/`;
            } else if (action === 'reject') {
                endpoint = `/admin/suggestions/${id}/reject/`;
            } else if (action === 'approve') {
                endpoint = `/admin/suggestions/${id}/approve/`;
            }

            if (endpoint) {
                const notes = action === 'reject' ? prompt('Reason for rejection:') : '';
                if (action === 'reject' && notes === null) {
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                }

                const response = await api.post(endpoint, { notes, reason: notes });
                if (response?.data?.success) {
                    showToast(`✅ ${type} ${action}ed successfully!`);
                    await fetchAllData(true);
                    if (showSuggestionModal) {
                        setShowSuggestionModal(false);
                        setSelectedSuggestion(null);
                    }
                    setActionLoading(false);
                    setProcessingId(null);
                    return;
                } else {
                    showToast(response?.data?.error || `Failed to ${action} ${type}`, 'error');
                }
            }

            showToast(`❌ Failed to ${action} ${type}`, 'error');
        } catch (error) {
            console.error(`Error ${action} suggestion:`, error);
            showToast(`❌ Failed to ${action} ${type}`, 'error');
        } finally {
            setActionLoading(false);
            setProcessingId(null);
        }
    };

    // ============================================
    // INSIGHT & HIDDEN GEM
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
                await fetchAllData(true);
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
                await fetchAllData(true);
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

    useEffect(() => { setHiddenGemsPage(1); }, [hiddenGemsFilter]);
    useEffect(() => { setLocalInsightsPage(1); }, [localInsightsFilter]);
    useEffect(() => { setReviewsPage(1); }, [reviewsFilter]);
    useEffect(() => { setStaffPage(1); }, [staffFilter]);
    useEffect(() => { setGuidesPage(1); }, [guidesFilter]);
    useEffect(() => { setPlacesPage(1); }, [placesFilter, placesSearch]);

    // ============================================
    // OVERVIEW-ONLY DERIVED DATA
    // ============================================
    const topGuidesByRating = useMemo(() => {
        return [...guides]
            .filter(g => g && g.id)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.total_reviews || 0) - (a.total_reviews || 0))
            .slice(0, 4);
    }, [guides]);

    const topCategoriesByPlaces = useMemo(() => {
        return [...categories]
            .map(c => ({ ...c, count: c.count || c.places?.length || 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [categories]);

    const recentTouristers = useMemo(() => {
        return [...touristers].slice(-4).reverse();
    }, [touristers]);

    const unverifiedGuidesCount = useMemo(() => guides.filter(g => !g.is_verified).length, [guides]);
    const inactiveStaffCount = useMemo(() => staff.filter(s => s.is_active === false).length, [staff]);

    // ============================================
    // RENDER FUNCTIONS
    // ============================================
    const renderSuggestionCard = (s, typeLabel) => {
        const imageUrl = s?.image || s?.image_url || null;
        const hasImage = imageUrl && typeof imageUrl === 'string' && imageUrl.length > 0;

        const getFallbackEmoji = () => {
            const type = (s?.suggestion_type || s?.type || '').toLowerCase();
            if (type === 'hidden_gem') return '💎';
            if (type === 'local_insight' || type === 'insight') return '💡';
            if (type === 'review') return '⭐';
            return '📍';
        };

        const isImplemented = (s?.status || '').toLowerCase() === 'implemented';
        const isPending = ['pending', 'pending_guide', 'pending_admin'].includes((s?.status || '').toLowerCase());

        return (
            <div key={s?.id || Math.random()} 
                style={{ 
                    display: 'flex', 
                    gap: 14, 
                    padding: 14, 
                    background: C.cream, 
                    borderRadius: RADIUS.md, 
                    border: `1px solid ${isImplemented ? C.success : isPending ? C.warn : C.line}`, 
                    alignItems: 'flex-start', 
                    transition: 'all 0.2s ease', 
                    cursor: 'pointer' 
                }} 
                onClick={() => { 
                    setSelectedSuggestion(s); 
                    setShowSuggestionModal(true); 
                }}
            >
                <div style={{ 
                    width: 80, 
                    height: 80, 
                    borderRadius: RADIUS.sm, 
                    background: C.paper, 
                    border: `1px solid ${C.line}`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0, 
                    overflow: 'hidden', 
                    position: 'relative' 
                }}>
                    {isImplemented && (
                        <div style={{ 
                            position: 'absolute', 
                            top: 4, 
                            right: 4, 
                            background: C.success, 
                            color: '#fff', 
                            padding: '2px 6px', 
                            borderRadius: 999, 
                            fontSize: 8, 
                            fontWeight: 600 
                        }}>✅</div>
                    )}
                    {hasImage ? (
                        <img 
                            src={imageUrl} 
                            alt={s?.name || 'Suggestion'} 
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
                                {s?.name || s?.title || 'Untitled'}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                <span style={{ fontSize: 11, color: C.sage }}>
                                    {s?.user_email || 'Anonymous'} · {s?.district || 'N/A'}
                                </span>
                                <span style={{ 
                                    fontSize: 9, 
                                    padding: '2px 9px', 
                                    borderRadius: 999, 
                                    background: C.goldSoft, 
                                    color: C.gold 
                                }}>
                                    {typeLabel || s?.suggestion_type || s?.type || 'Suggestion'}
                                </span>
                                {s?.rating && (
                                    <span style={{ fontSize: 11, color: C.gold }}>
                                        {'★'.repeat(Math.round(s.rating))}{'☆'.repeat(5 - Math.round(s.rating))}
                                    </span>
                                )}
                            </div>
                        </div>
                        <StatusPill status={s?.status || 'pending'} />
                    </div>
                    <p style={{ 
                        fontSize: 12.5, 
                        color: C.sage, 
                        margin: '6px 0', 
                        lineHeight: 1.5, 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden' 
                    }}>
                        {s?.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {isPending && (
                            <>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        processSuggestion(s.id, 'implement', s.suggestion_type || s.type || 'suggestion'); 
                                    }}
                                    disabled={actionLoading} 
                                    style={{ 
                                        padding: '4px 12px', 
                                        borderRadius: 999, 
                                        border: 'none', 
                                        background: '#2563EB', 
                                        color: '#fff', 
                                        fontSize: 11, 
                                        cursor: actionLoading ? 'not-allowed' : 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 4, 
                                        opacity: actionLoading && processingId === s.id ? 0.5 : 1 
                                    }}>
                                    <CheckCircle size={11} /> Implement
                                </button>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        processSuggestion(s.id, 'reject', s.suggestion_type || s.type || 'suggestion'); 
                                    }}
                                    disabled={actionLoading} 
                                    style={{ 
                                        padding: '4px 12px', 
                                        borderRadius: 999, 
                                        border: `1px solid #EFCBB5`, 
                                        background: 'transparent', 
                                        color: C.danger, 
                                        fontSize: 11, 
                                        cursor: actionLoading ? 'not-allowed' : 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 4, 
                                        opacity: actionLoading && processingId === s.id ? 0.5 : 1 
                                    }}>
                                    <X size={11} /> Reject
                                </button>
                            </>
                        )}
                        {s?.status === 'implemented' && (
                            <span style={{ 
                                padding: '4px 12px', 
                                borderRadius: 999, 
                                background: C.warnBg, 
                                color: C.gold, 
                                fontSize: 11, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4 
                            }}>✨ Implemented</span>
                        )}
                        {s?.status === 'rejected' && (
                            <span style={{ 
                                padding: '4px 12px', 
                                borderRadius: 999, 
                                background: C.dangerBg, 
                                color: C.danger, 
                                fontSize: 11, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4 
                            }}>❌ Rejected</span>
                        )}
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                processSuggestion(s.id, 'delete', s.suggestion_type || s.type || 'suggestion'); 
                            }}
                            disabled={actionLoading} 
                            style={{ 
                                padding: '4px 12px', 
                                borderRadius: 999, 
                                border: `1px solid #EFCBB5`, 
                                background: C.dangerBg, 
                                color: C.danger, 
                                fontSize: 11, 
                                cursor: actionLoading ? 'not-allowed' : 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4, 
                                opacity: actionLoading && processingId === s.id ? 0.5 : 1 
                            }}>
                            <Trash2 size={11} /> Delete
                        </button>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setSelectedSuggestion(s); 
                                setShowSuggestionModal(true); 
                            }}
                            style={{ 
                                padding: '4px 12px', 
                                borderRadius: 999, 
                                border: `1px solid ${C.line}`, 
                                background: 'transparent', 
                                color: C.sage, 
                                fontSize: 11, 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4 
                            }}>
                            <Eye size={11} /> View
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderTouristerCard = (u) => (
        <div key={u.id} style={{ display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${u.is_active !== false ? C.line : C.danger}44`, alignItems: 'flex-start', transition: 'all 0.2s ease' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', fontSize: 18, fontWeight: 600, color: C.ink }}>
                {u.profile_image ? <img src={u.profile_image} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : u.username?.charAt(0)?.toUpperCase() || 'T'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>{u.first_name || ''} {u.last_name || ''}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                            <span style={{ fontSize: 11, color: C.sage }}><Mail size={11} style={{ display: 'inline', marginRight: 4 }} />{u.email}</span>
                            {u.phone && <span style={{ fontSize: 11, color: C.sage }}><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />{u.phone}</span>}
                            <span style={{ fontSize: 11, color: C.sage }}>· @{u.username || 'N/A'}</span>
                        </div>
                    </div>
                    <StatusPill status={u.is_active !== false ? 'active' : 'inactive'} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <button onClick={() => openEditTourister(u)} 
                        style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.line}`, background: 'transparent', color: C.sage, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Edit2 size={11} /> Edit
                    </button>
                    <button onClick={() => toggleTouristerStatus(u)} 
                        style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: u.is_active !== false ? C.dangerBg : C.successBg, color: u.is_active !== false ? C.danger : C.success, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {u.is_active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => deleteTourister(u.id)} 
                        style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={11} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );

    const renderStaffCard = (s) => (
        <div key={s.id} style={{ display: 'flex', gap: 14, padding: 14, background: C.cream, borderRadius: RADIUS.md, border: `1px solid ${s.is_active !== false ? C.line : C.danger}44`, alignItems: 'flex-start', transition: 'all 0.2s ease' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', fontSize: 18, fontWeight: 600, color: C.ink }}>
                {s.profile_image ? <img src={s.profile_image} alt={s.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : s.email?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                        <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>{s.first_name || ''} {s.last_name || ''}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                            <span style={{ fontSize: 11, color: C.sage }}><Mail size={11} style={{ display: 'inline', marginRight: 4 }} />{s.email}</span>
                            {s.phone && <span style={{ fontSize: 11, color: C.sage }}><Phone size={11} style={{ display: 'inline', marginRight: 4 }} />{s.phone}</span>}
                            <span style={{ fontSize: 11, color: C.sage }}>· <Shield size={11} style={{ display: 'inline', marginRight: 4 }} />Staff</span>
                        </div>
                    </div>
                    <StatusPill status={s.is_active !== false ? 'active' : 'inactive'} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <button onClick={() => openEditStaff(s)} 
                        style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.line}`, background: 'transparent', color: C.sage, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Edit2 size={11} /> Edit
                    </button>
                    <button onClick={() => deleteStaff(s.id)} 
                        style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid #EFCBB5`, background: C.dangerBg, color: C.danger, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={11} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );

    const renderGuideCard = (guide) => {
        if (!guide || !guide.id) {
            console.warn('⚠️ Invalid guide data:', guide);
            return null;
        }
        
        const guideImageUrl = guide.profile_image || guide.image || guide.avatar;
        const imageUrl = guideImageUrl ? getProfileImageUrl(guideImageUrl) : null;

        return (
            <div key={guide.id} style={{ 
                display: 'flex', 
                gap: 14, 
                padding: 14, 
                background: C.cream, 
                borderRadius: RADIUS.md, 
                border: `1px solid ${guide.is_verified ? C.success : C.warn}44`, 
                alignItems: 'flex-start', 
                transition: 'all 0.2s ease' 
            }}>
                <div style={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '50%', 
                    background: guide.is_verified ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})` : C.line, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    flexShrink: 0, 
                    overflow: 'hidden', 
                    fontSize: 20, 
                    fontWeight: 600, 
                    color: C.ink, 
                    border: `2px solid ${guide.is_verified ? C.gold : C.sage}44` 
                }}>
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={guide.full_name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.textContent = guide.full_name?.charAt(0)?.toUpperCase() || 'G';
                            }}
                        /> 
                    ) : guide.full_name?.charAt(0)?.toUpperCase() || 'G'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <h4 style={{ fontSize: 14.5, color: C.inkSoft, margin: 0, fontWeight: 600 }}>
                                {guide.full_name}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                                <span style={{ fontSize: 11, color: C.sage }}>
                                    <Mail size={11} style={{ display: 'inline', marginRight: 4 }} />
                                    {guide.email}
                                </span>
                                <span style={{ fontSize: 11, color: C.sage }}>
                                    · {guide.primary_district || guide.district || 'N/A'}
                                </span>
                                {guide.rating > 0 && (
                                    <span style={{ fontSize: 11, color: C.gold }}>
                                        {'★'.repeat(Math.round(guide.rating))} {guide.rating}
                                    </span>
                                )}
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
                        <button 
                            onClick={() => openViewGuide(guide)} 
                            style={{ 
                                padding: '4px 12px', 
                                borderRadius: 999, 
                                border: `1px solid ${C.gold}`, 
                                background: 'transparent', 
                                color: C.gold, 
                                fontSize: 11, 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4 
                            }}
                        >
                            <Eye size={11} /> View Profile
                        </button>
                        <button 
                            onClick={() => openEditGuide(guide)} 
                            style={{ 
                                padding: '4px 12px', 
                                borderRadius: 999, 
                                border: `1px solid ${C.line}`, 
                                background: 'transparent', 
                                color: C.sage, 
                                fontSize: 11, 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4 
                            }}
                        >
                            <Edit2 size={11} /> Edit
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteGuide(guide.id);
                            }} 
                            style={{ 
                                padding: '4px 12px', 
                                borderRadius: 999, 
                                border: `1px solid #EFCBB5`, 
                                background: C.dangerBg, 
                                color: C.danger, 
                                fontSize: 11, 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 4 
                            }}
                        >
                            <Trash2 size={11} /> Delete
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

    // ✅ SAFETY CHECK - Redirect non-admin users
    if (!user || user.role !== 'admin') {
        navigate('/');
        return null;
    }

    const activeNavItem = navItems.find(n => n.key === activeTab);

    // ============================================
    // MAIN RENDER
    // ============================================
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
                        <button onClick={() => { dataFetchedRef.current = false; setRefreshing(true); fetchAllData(true).finally(() => setRefreshing(false)); }} disabled={refreshing} style={{ padding: '9px 14px', borderRadius: RADIUS.sm, border: `1px solid ${C.line}`, background: 'transparent', color: C.inkSoft, cursor: refreshing ? 'not-allowed' : 'pointer', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT.body, opacity: refreshing ? 0.6 : 1 }}>
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
                        {/* Page header */}
                        <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                            <div>
                                <p style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, margin: '0 0 5px' }}>
                                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                                <h2 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 26, color: C.inkSoft, margin: 0 }}>{activeNavItem?.label}</h2>
                            </div>
                            <Btn variant="ghost" icon={RefreshCw} onClick={() => { dataFetchedRef.current = false; setRefreshing(true); fetchAllData(true).finally(() => setRefreshing(false)); }} disabled={refreshing} style={{ opacity: refreshing ? 0.6 : 1 }}>
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

                        {/* ============================================================ */}
                        {/* OVERVIEW TAB */}
                        {/* ============================================================ */}
                        {activeTab === 'overview' && (
                            <div style={{ padding: '0 4px' }}>

                                {/* ===== HERO HEADER ===== */}
                                <div style={{
                                    background: 'linear-gradient(145deg, #0B2422 0%, #072E2A 100%)',
                                    borderRadius: 24,
                                    padding: '32px 36px',
                                    marginBottom: 24,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 60px rgba(7,46,42,0.25)'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: -80,
                                        right: -60,
                                        width: 300,
                                        height: 300,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(199,154,62,0.08) 0%, transparent 70%)',
                                        pointerEvents: 'none'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: -100,
                                        left: '30%',
                                        width: 250,
                                        height: 250,
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(199,154,62,0.05) 0%, transparent 70%)',
                                        pointerEvents: 'none'
                                    }} />

                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            flexWrap: 'wrap',
                                            gap: 16
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
                                                    <div style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 14,
                                                        background: 'rgba(199,154,62,0.15)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '1px solid rgba(199,154,62,0.2)'
                                                    }}>
                                                        <span style={{ fontSize: 24 }}>🏠</span>
                                                    </div>
                                                    <div>
                                                        <h1 style={{
                                                            fontFamily: "'Fraunces', Georgia, serif",
                                                            fontStyle: 'italic',
                                                            fontSize: 26,
                                                            fontWeight: 600,
                                                            color: '#FFFFFF',
                                                            margin: 0,
                                                            letterSpacing: '-0.5px'
                                                        }}>
                                                            Dashboard
                                                        </h1>
                                                        <p style={{
                                                            fontSize: 14,
                                                            color: 'rgba(255,255,255,0.6)',
                                                            margin: '2px 0 0'
                                                        }}>
                                                            Welcome back, {profile?.full_name || 'Admin'} 👋
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 16,
                                                flexWrap: 'wrap'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: '6px 14px',
                                                    background: 'rgba(255,255,255,0.06)',
                                                    borderRadius: 20,
                                                    border: '1px solid rgba(255,255,255,0.06)'
                                                }}>
                                                    <div style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        background: '#4CAF50',
                                                        animation: 'pulse 2s infinite'
                                                    }} />
                                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                                                        All systems go
                                                    </span>
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: '6px 14px',
                                                    background: 'rgba(255,255,255,0.06)',
                                                    borderRadius: 20,
                                                    border: '1px solid rgba(255,255,255,0.06)'
                                                }}>
                                                    <Calendar size={14} color="rgba(255,255,255,0.5)" />
                                                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                                                        {new Date().toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <Btn
                                                    variant="ghost"
                                                    icon={RefreshCw}
                                                    size="sm"
                                                    onClick={() => {
                                                        dataFetchedRef.current = false;
                                                        setRefreshing(true);
                                                        fetchAllData(true).finally(() => setRefreshing(false));
                                                    }}
                                                    disabled={refreshing}
                                                    style={{
                                                        borderColor: 'rgba(255,255,255,0.15)',
                                                        color: 'rgba(255,255,255,0.7)',
                                                        padding: '6px 14px'
                                                    }}
                                                >
                                                    {refreshing ? 'Refreshing...' : 'Refresh'}
                                                </Btn>
                                            </div>
                                        </div>
                                    </div>
                                    <style>{`
                                        @keyframes pulse {
                                            0%, 100% { opacity: 1; }
                                            50% { opacity: 0.4; }
                                        }
                                    `}</style>
                                </div>

                                {/* ===== ATTENTION STRIP ===== */}
                                {(stats.pendingHiddenGems + stats.pendingLocalInsights + stats.pendingReviews + unverifiedGuidesCount) > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 10,
                                        marginBottom: 24,
                                        padding: '14px 18px',
                                        background: C.warnBg,
                                        border: `1px solid ${C.gold}30`,
                                        borderRadius: 16,
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#8A6A1F' }}>
                                            <Flame size={16} color={C.gold} /> Needs your attention
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                                            {(stats.pendingHiddenGems + stats.pendingLocalInsights + stats.pendingReviews) > 0 && (
                                                <button onClick={() => setActiveTab('hidden-gems')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, border: `1px solid ${C.gold}40`, background: C.paper, color: C.inkSoft, fontSize: 12, cursor: 'pointer' }}>
                                                    <Clock size={12} color={C.warn} /> {stats.pendingHiddenGems + stats.pendingLocalInsights + stats.pendingReviews} suggestions pending review
                                                </button>
                                            )}
                                            {unverifiedGuidesCount > 0 && (
                                                <button onClick={() => setActiveTab('guides')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, border: `1px solid ${C.gold}40`, background: C.paper, color: C.inkSoft, fontSize: 12, cursor: 'pointer' }}>
                                                    <UserCheck size={12} color={C.warn} /> {unverifiedGuidesCount} guide{unverifiedGuidesCount === 1 ? '' : 's'} awaiting verification
                                                </button>
                                            )}
                                            {inactiveStaffCount > 0 && (
                                                <button onClick={() => setActiveTab('staff')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, border: `1px solid ${C.gold}40`, background: C.paper, color: C.inkSoft, fontSize: 12, cursor: 'pointer' }}>
                                                    <Shield size={12} color={C.warn} /> {inactiveStaffCount} inactive staff account{inactiveStaffCount === 1 ? '' : 's'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ===== TWO COLUMN LAYOUT ===== */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                                    gap: 24,
                                    marginBottom: 24
                                }}>

                                    {/* ===== LEFT COLUMN: Suggestions Status ===== */}
                                    <div style={{
                                        background: '#FFFFFF',
                                        borderRadius: 20,
                                        padding: 24,
                                        border: '1px solid #EFE6CF',
                                        boxShadow: '0 4px 20px rgba(7,46,42,0.04)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 20
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 10,
                                                    background: '#FBF6EA',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <MessageSquare size={16} color="#C79A3E" />
                                                </div>
                                                <div>
                                                    <h3 style={{
                                                        fontFamily: "'Fraunces', Georgia, serif",
                                                        fontStyle: 'italic',
                                                        fontSize: 17,
                                                        fontWeight: 600,
                                                        color: '#0B2422',
                                                        margin: 0
                                                    }}>Suggestion Status</h3>
                                                    <p style={{ fontSize: 12, color: '#7A7568', margin: 0 }}>Real-time overview</p>
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#C79A3E',
                                                background: '#FBF6EA',
                                                padding: '4px 12px',
                                                borderRadius: 20
                                            }}>
                                                {stats.totalHiddenGems + stats.totalLocalInsights + stats.totalReviews} total
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            <StatusProgress
                                                label="Pending"
                                                value={stats.pendingHiddenGems + stats.pendingLocalInsights + stats.pendingReviews}
                                                total={stats.totalHiddenGems + stats.totalLocalInsights + stats.totalReviews}
                                                color="#B4791F"
                                                bg="#FBF1DC"
                                            />
                                            <StatusProgress
                                                label="Implemented"
                                                value={stats.implementedHiddenGems + stats.implementedLocalInsights + stats.implementedReviews}
                                                total={stats.totalHiddenGems + stats.totalLocalInsights + stats.totalReviews}
                                                color="#3F7A5E"
                                                bg="#EAF3EE"
                                            />
                                            <StatusProgress
                                                label="Rejected"
                                                value={(() => {
                                                    const total = stats.totalHiddenGems + stats.totalLocalInsights + stats.totalReviews;
                                                    const pending = stats.pendingHiddenGems + stats.pendingLocalInsights + stats.pendingReviews;
                                                    const implemented = stats.implementedHiddenGems + stats.implementedLocalInsights + stats.implementedReviews;
                                                    return total - pending - implemented;
                                                })()}
                                                total={stats.totalHiddenGems + stats.totalLocalInsights + stats.totalReviews}
                                                color="#B4472A"
                                                bg="#FDF1EC"
                                            />

                                            {/* Per-type breakdown */}
                                            <div style={{ marginTop: 4, paddingTop: 14, borderTop: '1px solid #EFE6CF', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: 12, color: C.sage, display: 'flex', alignItems: 'center', gap: 6 }}>💎 Hidden Gems</span>
                                                    <span style={{ fontSize: 12, color: C.inkSoft }}>{stats.implementedHiddenGems}/{stats.totalHiddenGems} live · <span style={{ color: C.warn }}>{stats.pendingHiddenGems} pending</span></span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: 12, color: C.sage, display: 'flex', alignItems: 'center', gap: 6 }}>💡 Local Insights</span>
                                                    <span style={{ fontSize: 12, color: C.inkSoft }}>{stats.implementedLocalInsights}/{stats.totalLocalInsights} live · <span style={{ color: C.warn }}>{stats.pendingLocalInsights} pending</span></span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: 12, color: C.sage, display: 'flex', alignItems: 'center', gap: 6 }}>⭐ Reviews</span>
                                                    <span style={{ fontSize: 12, color: C.inkSoft }}>{stats.implementedReviews}/{stats.totalReviews} live · <span style={{ color: C.warn }}>{stats.pendingReviews} pending</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            marginTop: 18,
                                            paddingTop: 16,
                                            borderTop: '1px solid #EFE6CF',
                                            display: 'flex',
                                            justifyContent: 'space-around'
                                        }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: 10, color: '#7A7568', margin: 0, textTransform: 'uppercase' }}>Pending</p>
                                                <p style={{ fontSize: 20, fontWeight: 700, color: '#B4791F', margin: 0 }}>
                                                    {stats.pendingHiddenGems + stats.pendingLocalInsights + stats.pendingReviews}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: 10, color: '#7A7568', margin: 0, textTransform: 'uppercase' }}>Implemented</p>
                                                <p style={{ fontSize: 20, fontWeight: 700, color: '#3F7A5E', margin: 0 }}>
                                                    {stats.implementedHiddenGems + stats.implementedLocalInsights + stats.implementedReviews}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ fontSize: 10, color: '#7A7568', margin: 0, textTransform: 'uppercase' }}>Rate</p>
                                                <p style={{ fontSize: 20, fontWeight: 700, color: '#C79A3E', margin: 0 }}>
                                                    {(() => {
                                                        const total = stats.totalHiddenGems + stats.totalLocalInsights + stats.totalReviews;
                                                        const implemented = stats.implementedHiddenGems + stats.implementedLocalInsights + stats.implementedReviews;
                                                        return total > 0 ? Math.round((implemented / total) * 100) : 0;
                                                    })()}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ===== RIGHT COLUMN: Quick Stats ===== */}
                                    <div style={{
                                        background: '#FFFFFF',
                                        borderRadius: 20,
                                        padding: 24,
                                        border: '1px solid #EFE6CF',
                                        boxShadow: '0 4px 20px rgba(7,46,42,0.04)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            marginBottom: 20
                                        }}>
                                            <div style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 10,
                                                background: '#F5F3FF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <LayoutGrid size={16} color="#8B5CF6" />
                                            </div>
                                            <div>
                                                <h3 style={{
                                                    fontFamily: "'Fraunces', Georgia, serif",
                                                    fontStyle: 'italic',
                                                    fontSize: 17,
                                                    fontWeight: 600,
                                                    color: '#0B2422',
                                                    margin: 0
                                                }}>Platform Overview</h3>
                                                <p style={{ fontSize: 12, color: '#7A7568', margin: 0 }}>All your content at a glance</p>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 12
                                        }}>
                                            <OverviewTile
                                                label="Touristers"
                                                value={stats.totalUsers}
                                                icon={Users}
                                                color="#3B82F6"
                                                bg="#EFF6FF"
                                            />
                                            <OverviewTile
                                                label="Staff"
                                                value={stats.totalStaff}
                                                icon={Shield}
                                                color="#8B5CF6"
                                                bg="#F5F3FF"
                                            />
                                            <OverviewTile
                                                label="Guides"
                                                value={stats.totalGuides}
                                                icon={UserCheck}
                                                color="#C79A3E"
                                                bg="#FBF6EA"
                                            />
                                            <OverviewTile
                                                label="Categories"
                                                value={stats.totalCategories}
                                                icon={LayoutGrid}
                                                color="#10B981"
                                                bg="#ECFDF5"
                                            />
                                            <OverviewTile
                                                label="Hidden Gems"
                                                value={stats.totalHiddenGems}
                                                icon={Sparkles}
                                                color="#C79A3E"
                                                bg="#FBF6EA"
                                            />
                                            <OverviewTile
                                                label="Local Insights"
                                                value={stats.totalLocalInsights}
                                                icon={Lightbulb}
                                                color="#B4791F"
                                                bg="#FBF1DC"
                                            />
                                        </div>

                                        {/* Guide verification split */}
                                        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #EFE6CF' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                                <span style={{ fontSize: 12, color: C.sage, display: 'flex', alignItems: 'center', gap: 6 }}><Award size={13} color={C.gold} /> Guide verification</span>
                                                <span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 600 }}>{stats.totalGuides - unverifiedGuidesCount}/{stats.totalGuides} verified</span>
                                            </div>
                                            <StatusBar label="Verified" count={stats.totalGuides - unverifiedGuidesCount} total={stats.totalGuides} color={C.success} bg={C.successBg} />
                                        </div>
                                    </div>
                                </div>

                                {/* ===== THIRD ROW: Top Guides + Top Categories ===== */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                                    gap: 24,
                                    marginBottom: 24
                                }}>
                                    {/* ===== Top Performing Guides ===== */}
                                    <div style={{
                                        background: '#FFFFFF',
                                        borderRadius: 20,
                                        padding: 24,
                                        border: '1px solid #EFE6CF',
                                        boxShadow: '0 4px 20px rgba(7,46,42,0.04)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FBF6EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Award size={16} color="#C79A3E" />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 17, fontWeight: 600, color: '#0B2422', margin: 0 }}>Top Guides</h3>
                                                    <p style={{ fontSize: 12, color: '#7A7568', margin: 0 }}>Ranked by rating</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setActiveTab('guides')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: C.gold, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                                                View all <ArrowUpRight size={13} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {topGuidesByRating.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '24px 0', color: '#7A7568' }}>
                                                    <div style={{ fontSize: 28, marginBottom: 6 }}>🧭</div>
                                                    <p style={{ margin: 0, fontSize: 13 }}>No guides yet</p>
                                                </div>
                                            ) : topGuidesByRating.map((g, idx) => (
                                                <div key={g.id} onClick={() => openViewGuide(g)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: C.cream, borderRadius: 12, border: `1px solid ${C.line}`, cursor: 'pointer' }}>
                                                    <span style={{ fontFamily: FONT.mono, fontSize: 11, color: C.sageLight, width: 14 }}>#{idx + 1}</span>
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.ink, flexShrink: 0, overflow: 'hidden' }}>
                                                        {g.full_name?.charAt(0)?.toUpperCase() || 'G'}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: 13, color: C.inkSoft, margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.full_name}</p>
                                                        <p style={{ fontSize: 10.5, color: C.sage, margin: 0 }}>{g.primary_district || 'N/A'}</p>
                                                    </div>
                                                    <span style={{ fontSize: 12, color: C.gold, fontWeight: 600, flexShrink: 0 }}>{g.rating > 0 ? `★ ${g.rating}` : '— new'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ===== Top Categories ===== */}
                                    <div style={{
                                        background: '#FFFFFF',
                                        borderRadius: 20,
                                        padding: 24,
                                        border: '1px solid #EFE6CF',
                                        boxShadow: '0 4px 20px rgba(7,46,42,0.04)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <TrendingUp size={16} color="#10B981" />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 17, fontWeight: 600, color: '#0B2422', margin: 0 }}>Top Categories</h3>
                                                    <p style={{ fontSize: 12, color: '#7A7568', margin: 0 }}>By number of places</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setActiveTab('categories')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: C.gold, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                                                View all <ArrowUpRight size={13} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {topCategoriesByPlaces.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '24px 0', color: '#7A7568' }}>
                                                    <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
                                                    <p style={{ margin: 0, fontSize: 13 }}>No categories yet</p>
                                                </div>
                                            ) : topCategoriesByPlaces.map((cat) => {
                                                const maxCount = topCategoriesByPlaces[0]?.count || 1;
                                                return (
                                                    <div key={cat.key}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                                            <span style={{ fontSize: 12.5, color: C.inkSoft }}>{cat.title || cat.key}</span>
                                                            <span style={{ fontSize: 12.5, fontWeight: 600, color: C.gold }}>{cat.count}</span>
                                                        </div>
                                                        <div style={{ height: 6, borderRadius: 3, background: C.line, overflow: 'hidden' }}>
                                                            <div style={{ width: `${maxCount > 0 ? Math.max(4, (cat.count / maxCount) * 100) : 0}%`, height: '100%', borderRadius: 3, background: C.gold, transition: 'width 1s ease' }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* ===== BOTTOM ROW: Recent Activity, New Touristers, Quick Actions ===== */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                    gap: 24
                                }}>

                                    {/* ===== Recent Activity ===== */}
                                    <div style={{
                                        background: '#FFFFFF',
                                        borderRadius: 20,
                                        padding: 24,
                                        border: '1px solid #EFE6CF',
                                        boxShadow: '0 4px 20px rgba(7,46,42,0.04)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 16
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 10,
                                                    background: '#EAF3EE',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <RefreshCw size={16} color="#3F7A5E" />
                                                </div>
                                                <div>
                                                    <h3 style={{
                                                        fontFamily: "'Fraunces', Georgia, serif",
                                                        fontStyle: 'italic',
                                                        fontSize: 17,
                                                        fontWeight: 600,
                                                        color: '#0B2422',
                                                        margin: 0
                                                    }}>Recent Activity</h3>
                                                    <p style={{ fontSize: 12, color: '#7A7568', margin: 0 }}>Latest updates</p>
                                                </div>
                                            </div>
                                            <span style={{ fontSize: 11, color: '#7A7568' }}>Last 5</span>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {allSuggestions.slice(0, 5).map((s, idx) => (
                                                <div key={s.id || idx} onClick={() => { setSelectedSuggestion(s); setShowSuggestionModal(true); }} style={{ cursor: 'pointer' }}>
                                                    <ActivityRow
                                                        title={s.name || 'Untitled'}
                                                        type={s.suggestion_type || 'suggestion'}
                                                        status={s.status || 'pending'}
                                                    />
                                                </div>
                                            ))}
                                            {allSuggestions.length === 0 && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '30px 0',
                                                    color: '#7A7568'
                                                }}>
                                                    <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                                                    <p style={{ margin: 0, fontSize: 13 }}>No recent activity</p>
                                                    <p style={{ margin: 0, fontSize: 12, opacity: 0.6 }}>Suggestions will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ===== Newest Touristers ===== */}
                                    <div style={{
                                        background: '#FFFFFF',
                                        borderRadius: 20,
                                        padding: 24,
                                        border: '1px solid #EFE6CF',
                                        boxShadow: '0 4px 20px rgba(7,46,42,0.04)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Users size={16} color="#3B82F6" />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 17, fontWeight: 600, color: '#0B2422', margin: 0 }}>Newest Touristers</h3>
                                                    <p style={{ fontSize: 12, color: '#7A7568', margin: 0 }}>Recently joined</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setActiveTab('touristers')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: C.gold, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                                                View all <ArrowUpRight size={13} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {recentTouristers.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '24px 0', color: '#7A7568' }}>
                                                    <div style={{ fontSize: 28, marginBottom: 6 }}>👥</div>
                                                    <p style={{ margin: 0, fontSize: 13 }}>No touristers yet</p>
                                                </div>
                                            ) : recentTouristers.map((u) => (
                                                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: C.cream, borderRadius: 12, border: `1px solid ${C.line}` }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.ink, flexShrink: 0, overflow: 'hidden' }}>
                                                        {u.profile_image ? <img src={u.profile_image} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u.first_name?.charAt(0)?.toUpperCase() || u.username?.charAt(0)?.toUpperCase() || 'T')}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: 13, color: C.inkSoft, margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.first_name || ''} {u.last_name || ''}</p>
                                                        <p style={{ fontSize: 10.5, color: C.sage, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>
                                                    </div>
                                                    <StatusPill status={u.is_active !== false ? 'active' : 'inactive'} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ===== Quick Actions ===== */}
                                    <div style={{
                                        background: '#FFFFFF',
                                        borderRadius: 20,
                                        padding: 24,
                                        border: '1px solid #EFE6CF',
                                        boxShadow: '0 4px 20px rgba(7,46,42,0.04)'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            marginBottom: 16
                                        }}>
                                            <div style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 10,
                                                background: '#FBF6EA',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <PlusCircle size={16} color="#C79A3E" />
                                            </div>
                                            <div>
                                                <h3 style={{
                                                    fontFamily: "'Fraunces', Georgia, serif",
                                                    fontStyle: 'italic',
                                                    fontSize: 17,
                                                    fontWeight: 600,
                                                    color: '#0B2422',
                                                    margin: 0
                                                }}>Quick Actions</h3>
                                                <p style={{ fontSize: 12, color: '#7A7568', margin: 0 }}>Common tasks</p>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 10
                                        }}>
                                            <ActionButton
                                                label="Add Tourister"
                                                icon={Users}
                                                onClick={openAddTourister}
                                                color="#3B82F6"
                                            />
                                            <ActionButton
                                                label="Add Staff"
                                                icon={Shield}
                                                onClick={openAddStaff}
                                                color="#8B5CF6"
                                            />
                                            <ActionButton
                                                label="Add Guide"
                                                icon={UserCheck}
                                                onClick={() => { resetGuideForm(); setEditingGuide(null); setShowGuideModal(true); }}
                                                color="#C79A3E"
                                            />
                                            <ActionButton
                                                label="Add Category"
                                                icon={FolderPlus}
                                                onClick={() => { setCategoryForm({ key: '', label: '', description: '', image: '', type: 'Nature & Outdoor' }); setShowCategoryModal(true); }}
                                                color="#10B981"
                                            />
                                            <ActionButton
                                                label="Add Hidden Gem"
                                                icon={Sparkles}
                                                onClick={() => { setHiddenGemForm({ name: '', description: '', district: '', category: 'hidden', image: null, imagePreview: null }); setShowAddHiddenGemModal(true); }}
                                                color="#C79A3E"
                                            />
                                            <ActionButton
                                                label="Add Insight"
                                                icon={Lightbulb}
                                                onClick={() => { setInsightForm({ name: '', description: '', district: '', category: 'general', image: null, imagePreview: null }); setShowAddInsightModal(true); }}
                                                color="#B4791F"
                                            />
                                        </div>

                                        <div style={{
                                            marginTop: 16,
                                            paddingTop: 16,
                                            borderTop: '1px solid #EFE6CF',
                                            display: 'flex',
                                            justifyContent: 'center'
                                        }}>
                                            <button onClick={() => setActiveTab('hidden-gems')} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '8px 20px',
                                                background: '#FBF6EA',
                                                border: '1px solid #EFE6CF',
                                                borderRadius: 12,
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                color: '#0B2422',
                                                transition: 'all 0.2s ease'
                                            }} onMouseEnter={(e) => {
                                                e.target.style.background = '#F5EDD6';
                                            }} onMouseLeave={(e) => {
                                                e.target.style.background = '#FBF6EA';
                                            }}>
                                                <Sparkles size={14} color="#C79A3E" />
                                                View All Suggestions
                                                <ChevronRight size={14} color="#C79A3E" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CATEGORIES TAB */}
                        {activeTab === 'categories' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>📂 Categories</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage all categories ({categories.length} total)</p></div>
                                    <Btn variant="primary" icon={Plus} size="sm" onClick={() => { setCategoryForm({ key: '', label: '', description: '', image: '', type: 'Nature & Outdoor' }); setShowCategoryModal(true); }}>Add Category</Btn>
                                </div>
                                {categories.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No categories found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                            {getPaginatedData(categories, categoriesPage).map((cat) => renderCategoryCard(cat))}
                                        </div>
                                        <Pagination currentPage={categoriesPage} totalPages={getTotalPages(categories)} onPageChange={setCategoriesPage} totalItems={categories.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* PLACES TAB */}
                        {activeTab === 'places' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>📍 Places</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage all places ({allPlaces.length} total)</p></div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <input type="text" value={placesSearch} onChange={(e) => setPlacesSearch(e.target.value)} style={{ ...inputStyle, padding: '6px 12px', fontSize: 12, width: 150 }} placeholder="Search places..." />
                                        <select value={placesFilter} onChange={(e) => setPlacesFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All Types</option>
                                            <option value="well-known">⭐ Well Known</option>
                                            <option value="hidden">✨ Hidden</option>
                                        </select>
                                    </div>
                                </div>
                                {filteredPlaces.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No places found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                                            {getPaginatedData(filteredPlaces, placesPage).map((place) => renderPlaceCard(place))}
                                        </div>
                                        <Pagination currentPage={placesPage} totalPages={getTotalPages(filteredPlaces)} onPageChange={setPlacesPage} totalItems={filteredPlaces.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* HIDDEN GEMS TAB */}
                        {activeTab === 'hidden-gems' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>💎 Hidden Gems</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage hidden gem suggestions ({hiddenGems.length} total)</p></div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select value={hiddenGemsFilter} onChange={(e) => setHiddenGemsFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All</option>
                                            <option value="pending">⏳ Pending</option>
                                            <option value="implemented">✨ Implemented</option>
                                            <option value="rejected">❌ Rejected</option>
                                        </select>
                                        <Btn variant="gold" icon={Plus} size="sm" onClick={() => { setHiddenGemForm({ name: '', description: '', district: '', category: 'hidden', image: null, imagePreview: null }); setShowAddHiddenGemModal(true); }}>Add Gem</Btn>
                                    </div>
                                </div>
                                {hiddenGems.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No hidden gems found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredHiddenGems, hiddenGemsPage).map((s) => renderSuggestionCard(s, 'Hidden Gem'))}
                                        </div>
                                        <Pagination currentPage={hiddenGemsPage} totalPages={getTotalPages(filteredHiddenGems)} onPageChange={setHiddenGemsPage} totalItems={filteredHiddenGems.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* LOCAL INSIGHTS TAB */}
                        {activeTab === 'local-insights' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>💡 Local Insights</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage local insight suggestions ({localInsights.length} total)</p></div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select value={localInsightsFilter} onChange={(e) => setLocalInsightsFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All</option>
                                            <option value="pending">⏳ Pending</option>
                                            <option value="implemented">✨ Implemented</option>
                                            <option value="rejected">❌ Rejected</option>
                                        </select>
                                        <Btn variant="primary" icon={Plus} size="sm" onClick={() => { setInsightForm({ name: '', description: '', district: '', category: 'general', image: null, imagePreview: null }); setShowAddInsightModal(true); }}>Add Insight</Btn>
                                    </div>
                                </div>
                                {localInsights.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No local insights found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredLocalInsights, localInsightsPage).map((s) => renderSuggestionCard(s, 'Local Insight'))}
                                        </div>
                                        <Pagination currentPage={localInsightsPage} totalPages={getTotalPages(filteredLocalInsights)} onPageChange={setLocalInsightsPage} totalItems={filteredLocalInsights.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* REVIEWS TAB */}
                        {activeTab === 'reviews' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>⭐ Reviews</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage review suggestions ({reviews.length} total)</p></div>
                                    <select value={reviewsFilter} onChange={(e) => setReviewsFilter(e.target.value)} style={selectStyle}>
                                        <option value="all">All</option>
                                        <option value="pending">⏳ Pending</option>
                                        <option value="implemented">✨ Implemented</option>
                                        <option value="rejected">❌ Rejected</option>
                                    </select>
                                </div>
                                {reviews.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.sage, fontSize: 13, padding: '30px 0' }}>No reviews found.</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'grid', gap: 12 }}>
                                            {getPaginatedData(filteredReviews, reviewsPage).map((s) => renderSuggestionCard(s, 'Review'))}
                                        </div>
                                        <Pagination currentPage={reviewsPage} totalPages={getTotalPages(filteredReviews)} onPageChange={setReviewsPage} totalItems={filteredReviews.length} itemsPerPage={ITEMS_PER_PAGE} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* TOURISTERS TAB */}
                        {activeTab === 'touristers' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>👥 Touristers</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage all touristers ({touristers.length} total)</p></div>
                                    <Btn variant="primary" icon={Plus} size="sm" onClick={openAddTourister}>Add Tourister</Btn>
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

                        {/* STAFF TAB */}
                        {activeTab === 'staff' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>👔 Staff</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage staff members ({staff.length} total)</p></div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All</option>
                                            <option value="active">🟢 Active</option>
                                            <option value="inactive">🔴 Inactive</option>
                                        </select>
                                        <Btn variant="primary" icon={Plus} size="sm" onClick={openAddStaff}>Add Staff</Btn>
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

                        {/* GUIDES TAB */}
                        {activeTab === 'guides' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                                    <div><h3 style={{ fontFamily: FONT.display, fontStyle: 'italic', fontSize: 19, color: C.inkSoft, margin: 0 }}>🧭 Guides</h3>
                                        <p style={{ fontSize: 13, color: C.sage, margin: '4px 0 0' }}>Manage tour guides ({guides.length} total)</p></div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <select value={guidesFilter} onChange={(e) => setGuidesFilter(e.target.value)} style={selectStyle}>
                                            <option value="all">All</option>
                                            <option value="verified">✅ Verified</option>
                                            <option value="unverified">⏳ Unverified</option>
                                            <option value="active">🟢 Active</option>
                                            <option value="inactive">🔴 Inactive</option>
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

            {/* ============================================ */}
            {/* MODALS */}
            {/* ============================================ */}

            {/* Tourister Modal - Add */}
            {showTouristerModal && (
                <ModalShell onClose={() => { setShowTouristerModal(false); setTouristerForm({ full_name: '', email: '', password: '', phone: '', is_active: true }); }}
                    title="Add Tourister" subtitle="Create a new tourister account" icon={Users} maxWidth={560}
                    footer={<>
                        <Btn variant="ghost" onClick={() => { setShowTouristerModal(false); setTouristerForm({ full_name: '', email: '', password: '', phone: '', is_active: true }); }}>Cancel</Btn>
                        <Btn variant="primary" icon={Plus} onClick={handleAddTourister} disabled={touristerLoading}>
                            {touristerLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {touristerLoading ? 'Adding...' : 'Add Tourister'}
                        </Btn>
                    </>}
                >
                    <form onSubmit={handleAddTourister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name <span style={{ color: C.danger }}>*</span></label>
                            <input type="text" value={touristerForm.full_name} onChange={(e) => setTouristerForm({ ...touristerForm, full_name: e.target.value })} style={inputStyle} required placeholder="John Doe" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email <span style={{ color: C.danger }}>*</span></label>
                            <input type="email" value={touristerForm.email} onChange={(e) => setTouristerForm({ ...touristerForm, email: e.target.value })} style={inputStyle} required placeholder="tourister@example.com" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password <span style={{ color: C.danger }}>*</span></label>
                            <input type="password" value={touristerForm.password} onChange={(e) => setTouristerForm({ ...touristerForm, password: e.target.value })} style={inputStyle} required placeholder="Min 6 characters" minLength={6} /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                            <input type="tel" value={touristerForm.phone} onChange={(e) => setTouristerForm({ ...touristerForm, phone: e.target.value })} style={inputStyle} placeholder="+91 9876543210" /></div>
                    </form>
                </ModalShell>
            )}

            {/* Tourister Modal - Edit */}
            {showEditTouristerModal && editingTourister && (
                <ModalShell onClose={() => { setShowEditTouristerModal(false); setEditingTourister(null); setTouristerForm({ full_name: '', email: '', password: '', phone: '', is_active: true }); }}
                    title="✏️ Edit Tourister" subtitle={`Updating ${editingTourister.first_name || ''} ${editingTourister.last_name || ''}`} icon={Users} maxWidth={560}
                    footer={<>
                        <Btn variant="ghost" onClick={() => { setShowEditTouristerModal(false); setEditingTourister(null); setTouristerForm({ full_name: '', email: '', password: '', phone: '', is_active: true }); }}>Cancel</Btn>
                        <Btn variant="primary" icon={Save} onClick={handleUpdateTourister} disabled={touristerLoading}>
                            {touristerLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {touristerLoading ? 'Saving...' : 'Update Tourister'}
                        </Btn>
                    </>}
                >
                    <form onSubmit={handleUpdateTourister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name <span style={{ color: C.danger }}>*</span></label>
                            <input type="text" value={touristerForm.full_name} onChange={(e) => setTouristerForm({ ...touristerForm, full_name: e.target.value })} style={inputStyle} required /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                            <input type="email" value={touristerForm.email} disabled style={{ ...inputStyle, background: '#f5f5f5', cursor: 'not-allowed' }} /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password <span style={{ color: C.sageLight }}>(leave blank to keep current)</span></label>
                            <input type="password" value={touristerForm.password} onChange={(e) => setTouristerForm({ ...touristerForm, password: e.target.value })} style={inputStyle} placeholder="Min 6 characters" minLength={6} /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                            <input type="tel" value={touristerForm.phone} onChange={(e) => setTouristerForm({ ...touristerForm, phone: e.target.value })} style={inputStyle} placeholder="+91 9876543210" /></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <label style={{ fontSize: 11, color: C.sageLight, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</label>
                            <button type="button" onClick={() => setTouristerForm({ ...touristerForm, is_active: !touristerForm.is_active })} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: touristerForm.is_active ? C.success : '#ccc', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}>
                                <span style={{ position: 'absolute', top: 2, left: touristerForm.is_active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </button>
                            <span style={{ fontSize: 12, color: C.sage }}>{touristerForm.is_active ? '✅ Active' : '⛔ Inactive'}</span>
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Staff Modal - Add */}
            {showStaffModal && (
                <ModalShell onClose={() => { setShowStaffModal(false); setStaffForm({ full_name: '', email: '', password: '', phone: '', is_active: true }); }}
                    title="Add Staff" subtitle="Create a new staff account" icon={Shield} maxWidth={560}
                    footer={<>
                        <Btn variant="ghost" onClick={() => { setShowStaffModal(false); setStaffForm({ full_name: '', email: '', password: '', phone: '', is_active: true }); }}>Cancel</Btn>
                        <Btn variant="primary" icon={Plus} onClick={handleAddStaff} disabled={staffLoading}>
                            {staffLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {staffLoading ? 'Adding...' : 'Add Staff'}
                        </Btn>
                    </>}
                >
                    <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name <span style={{ color: C.danger }}>*</span></label>
                            <input type="text" value={staffForm.full_name} onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })} style={inputStyle} required placeholder="John Doe" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email <span style={{ color: C.danger }}>*</span></label>
                            <input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} style={inputStyle} required placeholder="staff@example.com" /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password <span style={{ color: C.danger }}>*</span></label>
                            <input type="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} style={inputStyle} required placeholder="Min 6 characters" minLength={6} /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                            <input type="tel" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} style={inputStyle} placeholder="+91 9876543210" /></div>
                    </form>
                </ModalShell>
            )}

            {/* Staff Modal - Edit */}
            {showEditStaffModal && editingStaff && (
                <ModalShell onClose={() => { setShowEditStaffModal(false); setEditingStaff(null); setStaffForm({ full_name: '', email: '', password: '', phone: '', is_active: true }); }}
                    title="✏️ Edit Staff" subtitle={`Updating ${editingStaff.first_name || ''} ${editingStaff.last_name || ''}`} icon={Shield} maxWidth={560}
                    footer={<>
                        <Btn variant="ghost" onClick={() => { setShowEditStaffModal(false); setEditingStaff(null); setStaffForm({ full_name: '', email: '', password: '', phone: '', is_active: true }); }}>Cancel</Btn>
                        <Btn variant="primary" icon={Save} onClick={handleUpdateStaff} disabled={staffLoading}>
                            {staffLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {staffLoading ? 'Saving...' : 'Update Staff'}
                        </Btn>
                    </>}
                >
                    <form onSubmit={handleUpdateStaff} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name <span style={{ color: C.danger }}>*</span></label>
                            <input type="text" value={staffForm.full_name} onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })} style={inputStyle} required /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                            <input type="email" value={staffForm.email} disabled style={{ ...inputStyle, background: '#f5f5f5', cursor: 'not-allowed' }} /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Password <span style={{ color: C.sageLight }}>(leave blank to keep current)</span></label>
                            <input type="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} style={inputStyle} placeholder="Min 6 characters" minLength={6} /></div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                            <input type="tel" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} style={inputStyle} placeholder="+91 9876543210" /></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <label style={{ fontSize: 11, color: C.sageLight, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</label>
                            <button type="button" onClick={() => setStaffForm({ ...staffForm, is_active: !staffForm.is_active })} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: staffForm.is_active ? C.success : '#ccc', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }}>
                                <span style={{ position: 'absolute', top: 2, left: staffForm.is_active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </button>
                            <span style={{ fontSize: 12, color: C.sage }}>{staffForm.is_active ? '✅ Active' : '⛔ Inactive'}</span>
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Guide Modal - Add/Edit */}
            {showGuideModal && (
                <ModalShell onClose={() => { setShowGuideModal(false); setEditingGuide(null); resetGuideForm(); }}
                    title={editingGuide ? '✏️ Edit Guide' : '👤 Add Guide'}
                    subtitle={editingGuide ? `Update ${editingGuide.full_name}'s profile` : 'Create a new guide account'} icon={UserCheck} maxWidth={640}
                    footer={<>
                        <Btn variant="ghost" onClick={() => { setShowGuideModal(false); setEditingGuide(null); resetGuideForm(); }}>Cancel</Btn>
                        <Btn variant="primary" icon={editingGuide ? Save : Plus} onClick={editingGuide ? handleUpdateGuide : handleAddGuide} disabled={guideLoading}>
                            {guideLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {guideLoading ? 'Saving...' : (editingGuide ? 'Update Guide' : 'Add Guide')}
                        </Btn>
                    </>}
                >
                    <form onSubmit={editingGuide ? handleUpdateGuide : handleAddGuide} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                                <input type="text" value={guideForm.full_name} onChange={(e) => setGuideForm({ ...guideForm, full_name: e.target.value })} style={inputStyle} required placeholder="John Doe" /></div>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email <span style={{ color: C.danger }}>*</span></label>
                                <input type="email" value={guideForm.email} onChange={(e) => setGuideForm({ ...guideForm, email: e.target.value })} style={inputStyle} required disabled={!!editingGuide} placeholder="guide@example.com" /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password {!editingGuide && <span style={{ color: C.danger }}>*</span>}</label>
                                <input type="text" value={guideForm.password} onChange={(e) => setGuideForm({ ...guideForm, password: e.target.value })} style={inputStyle} required={!editingGuide} placeholder={editingGuide ? 'Leave blank to keep current' : 'Set a password'} minLength={6} /></div>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</label>
                                <input type="text" value={guideForm.phone} onChange={(e) => setGuideForm({ ...guideForm, phone: e.target.value })} style={inputStyle} placeholder="+91 9876543210" /></div>
                        </div>
                        <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bio</label>
                            <textarea value={guideForm.bio} onChange={(e) => setGuideForm({ ...guideForm, bio: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Experienced tour guide..." /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Experience (Years)</label>
                                <input type="number" min="0" max="50" value={guideForm.experience_years} onChange={(e) => setGuideForm({ ...guideForm, experience_years: e.target.value })} style={inputStyle} placeholder="5" /></div>
                            <div><label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Languages</label>
                                <input type="text" value={guideForm.languages} onChange={(e) => setGuideForm({ ...guideForm, languages: e.target.value })} style={inputStyle} placeholder="English, Malayalam, Hindi" /></div>
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
                    footer={<>
                        <Btn variant="primary" onClick={() => { navigator.clipboard?.writeText(`Email: ${newCredentials.email}\nPassword: ${newCredentials.password}`); showToast('✅ Credentials copied!'); }}>📋 Copy</Btn>
                        <Btn variant="ghost" onClick={() => { setShowCredentialsModal(false); setNewCredentials({ email: '', password: '' }); }}>Done</Btn>
                    </>}
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
                    <div style={{ marginTop: 8, padding: 10, background: C.cream, borderRadius: RADIUS.sm }}>
                        <p style={{ fontSize: 11, color: C.sage, margin: 0 }}>📅 Created: {selectedSuggestion.created_at ? new Date(selectedSuggestion.created_at).toLocaleString() : 'N/A'}</p>
                    </div>
                </ModalShell>
            )}

            {/* Add Insight Modal */}
            {showAddInsightModal && (
                <ModalShell 
                    onClose={() => { 
                        setShowAddInsightModal(false); 
                        setInsightForm({ 
                            name: '', 
                            description: '', 
                            district: '', 
                            category: 'general', 
                            image: null, 
                            imagePreview: null 
                        }); 
                    }}
                    title="💡 Add Local Insight" 
                    subtitle="Will be automatically implemented" 
                    icon={Lightbulb}
                    footer={
                        <>
                            <Btn variant="ghost" onClick={() => { 
                                setShowAddInsightModal(false); 
                                setInsightForm({ 
                                    name: '', 
                                    description: '', 
                                    district: '', 
                                    category: 'general', 
                                    image: null, 
                                    imagePreview: null 
                                }); 
                            }}>Cancel</Btn>
                            <Btn variant="primary" icon={Plus} onClick={handleAddInsight} disabled={insightLoading}>
                                {insightLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {insightLoading ? 'Adding...' : 'Add & Implement'}
                            </Btn>
                        </>
                    }
                >
                    <form onSubmit={handleAddInsight} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Name <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input 
                                type="text" 
                                value={insightForm.name} 
                                onChange={(e) => setInsightForm({ ...insightForm, name: e.target.value })} 
                                style={inputStyle} 
                                required 
                                placeholder="e.g., Best Time to Visit Munnar" 
                            />
                        </div>
                        
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Description <span style={{ color: C.danger }}>*</span>
                            </label>
                            <textarea 
                                value={insightForm.description} 
                                onChange={(e) => setInsightForm({ ...insightForm, description: e.target.value })} 
                                style={{ ...inputStyle, resize: 'vertical' }} 
                                rows={3} 
                                required 
                                placeholder="Share your local insight..." 
                            />
                        </div>
                        
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                District <span style={{ color: C.danger }}>*</span>
                            </label>
                            <select 
                                value={insightForm.district} 
                                onChange={(e) => setInsightForm({ ...insightForm, district: e.target.value })} 
                                style={selectStyle} 
                                required
                            >
                                <option value="">Select District</option>
                                {KERALA_DISTRICTS.map(d => (
                                    <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Category <span style={{ color: C.danger }}>*</span>
                            </label>
                            <select 
                                value={insightForm.category} 
                                onChange={(e) => setInsightForm({ ...insightForm, category: e.target.value })} 
                                style={selectStyle} 
                                required
                            >
                                <option value="general">General</option>
                                <option value="beach">🏖️ Beach</option>
                                <option value="backwater">🚣 Backwater</option>
                                <option value="hill_station">⛰️ Hill Station</option>
                                <option value="waterfall">💧 Waterfall</option>
                                <option value="temple">🛕 Temple</option>
                                <option value="fort">🏰 Fort</option>
                                <option value="wildlife">🐘 Wildlife</option>
                                <option value="adventure">🧗 Adventure</option>
                                <option value="heritage">🏛️ Heritage</option>
                                <option value="natures">🌿natures</option>
                                <option value="culture">🎭 Culture</option>
                                <option value="zoo">🐘zoo</option>
                                <option value="parks">🚣parks</option>
                                <option value="sacred">🏛️ sacred</option>
                                <option value="other">other</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Image (optional)
                            </label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setInsightForm({ ...insightForm, image: file });
                                        const reader = new FileReader();
                                        reader.onloadend = () => setInsightForm(prev => ({ ...prev, imagePreview: reader.result }));
                                        reader.readAsDataURL(file);
                                    }
                                }} 
                                style={{ ...inputStyle, padding: '8px' }} 
                            />
                            {insightForm.imagePreview && (
                                <img 
                                    src={insightForm.imagePreview} 
                                    alt="Preview" 
                                    style={{ 
                                        width: '100%', 
                                        maxHeight: 200, 
                                        objectFit: 'cover', 
                                        borderRadius: RADIUS.sm, 
                                        marginTop: 8, 
                                        border: `1px solid ${C.line}` 
                                    }} 
                                />
                            )}
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Add Hidden Gem Modal */}
            {showAddHiddenGemModal && (
                <ModalShell 
                    onClose={() => { 
                        setShowAddHiddenGemModal(false); 
                        setHiddenGemForm({ 
                            name: '', 
                            description: '', 
                            district: '', 
                            category: 'hidden', 
                            image: null, 
                            imagePreview: null 
                        }); 
                    }}
                    title="💎 Add Hidden Gem" 
                    subtitle="Will be automatically implemented" 
                    icon={Sparkles}
                    footer={
                        <>
                            <Btn variant="ghost" onClick={() => { 
                                setShowAddHiddenGemModal(false); 
                                setHiddenGemForm({ 
                                    name: '', 
                                    description: '', 
                                    district: '', 
                                    category: 'hidden', 
                                    image: null, 
                                    imagePreview: null 
                                }); 
                            }}>Cancel</Btn>
                            <Btn variant="gold" icon={Plus} onClick={handleAddHiddenGem} disabled={hiddenGemLoading}>
                                {hiddenGemLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                {hiddenGemLoading ? 'Adding...' : 'Add & Implement'}
                            </Btn>
                        </>
                    }
                >
                    <form onSubmit={handleAddHiddenGem} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Name <span style={{ color: C.danger }}>*</span>
                            </label>
                            <input 
                                type="text" 
                                value={hiddenGemForm.name} 
                                onChange={(e) => setHiddenGemForm({ ...hiddenGemForm, name: e.target.value })} 
                                style={inputStyle} 
                                required 
                                placeholder="e.g., Secret Waterfall Near Munnar" 
                            />
                        </div>
                        
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Description <span style={{ color: C.danger }}>*</span>
                            </label>
                            <textarea 
                                value={hiddenGemForm.description} 
                                onChange={(e) => setHiddenGemForm({ ...hiddenGemForm, description: e.target.value })} 
                                style={{ ...inputStyle, resize: 'vertical' }} 
                                rows={3} 
                                required 
                                placeholder="Describe this hidden gem..." 
                            />
                        </div>
                        
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                District <span style={{ color: C.danger }}>*</span>
                            </label>
                            <select 
                                value={hiddenGemForm.district} 
                                onChange={(e) => setHiddenGemForm({ ...hiddenGemForm, district: e.target.value })} 
                                style={selectStyle} 
                                required
                            >
                                <option value="">Select District</option>
                                {KERALA_DISTRICTS.map(d => (
                                    <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Category <span style={{ color: C.danger }}>*</span>
                            </label>
                            <select 
                                value={hiddenGemForm.category} 
                                onChange={(e) => setHiddenGemForm({ ...hiddenGemForm, category: e.target.value })} 
                                style={selectStyle} 
                                required
                            >
                               <option value="general">General</option>
                                <option value="beach">🏖️ Beach</option>
                                <option value="backwater">🚣 Backwater</option>
                                <option value="hill_station">⛰️ Hill Station</option>
                                <option value="waterfall">💧 Waterfall</option>
                                <option value="temple">🛕 Temple</option>
                                <option value="fort">🏰 Fort</option>
                                <option value="wildlife">🐘 Wildlife</option>
                                <option value="adventure">🧗 Adventure</option>
                                <option value="heritage">🏛️ Heritage</option>
                                <option value="natures">🌿natures</option>
                                <option value="culture">🎭 Culture</option>
                                <option value="zoo">🐘zoo</option>
                                <option value="parks">🚣parks</option>
                                <option value="sacred">🏛️ sacred</option>
                                <option value="other">other</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style={{ fontSize: 11, color: C.sageLight, display: 'block', marginBottom: 4, fontFamily: FONT.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Image (optional)
                            </label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setHiddenGemForm({ ...hiddenGemForm, image: file });
                                        const reader = new FileReader();
                                        reader.onloadend = () => setHiddenGemForm(prev => ({ ...prev, imagePreview: reader.result }));
                                        reader.readAsDataURL(file);
                                    }
                                }} 
                                style={{ ...inputStyle, padding: '8px' }} 
                            />
                            {hiddenGemForm.imagePreview && (
                                <img 
                                    src={hiddenGemForm.imagePreview} 
                                    alt="Preview" 
                                    style={{ 
                                        width: '100%', 
                                        maxHeight: 200, 
                                        objectFit: 'cover', 
                                        borderRadius: RADIUS.sm, 
                                        marginTop: 8, 
                                        border: `1px solid ${C.line}` 
                                    }} 
                                />
                            )}
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* Category Modal - Add */}
            {showCategoryModal && (
                <ModalShell onClose={() => { setShowCategoryModal(false); setCategoryForm({ key: '', label: '', description: '', image: '', type: 'Nature & Outdoor' }); }}
                    title="Add Category" subtitle="Create a new category" icon={FolderPlus}
                    footer={<>
                        <Btn variant="ghost" onClick={() => { setShowCategoryModal(false); setCategoryForm({ key: '', label: '', description: '', image: '', type: 'Nature & Outdoor' }); }}>Cancel</Btn>
                        <Btn variant="primary" icon={Plus} onClick={handleAddCategory} disabled={categoryLoading}>
                            {categoryLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {categoryLoading ? 'Adding...' : 'Add Category'}
                        </Btn>
                    </>}
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
                    footer={<>
                        <Btn variant="ghost" onClick={() => { setShowEditCategoryModal(false); setEditingCategory(null); setEditCategoryForm({ title: '', description: '', image: '', type: 'Nature & Outdoor', is_active: true }); }}>Cancel</Btn>
                        <Btn variant="primary" icon={Save} onClick={handleEditCategory} disabled={categoryLoading}>
                            {categoryLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {categoryLoading ? 'Saving...' : 'Update Category'}
                        </Btn>
                    </>}
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
                    footer={<>
                        <Btn variant="ghost" onClick={() => { setShowPlaceModal(false); setEditingPlace(null); }}>Cancel</Btn>
                        <Btn variant="primary" icon={editingPlace ? Save : Plus} onClick={editingPlace ? handleUpdatePlace : handleAddPlace} disabled={placeLoading}>
                            {placeLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                            {placeLoading ? 'Saving...' : (editingPlace ? 'Update Place' : 'Add Place')}
                        </Btn>
                    </>}
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
        </div>
    );
};

export default AdminDashboard;
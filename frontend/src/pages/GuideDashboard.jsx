// src/pages/GuideDashboard.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
    CalendarDays,
    Clock,
    CheckCircle2,
    XCircle,
    Trash2,
    RefreshCw,
    Loader2,
    Bell,
    Star,
    MessageSquare,
    UserCheck,
    PlusCircle,
    X,
    Anchor,
    TrendingUp,
    MapPin,
    User,
    Calendar as CalendarIcon,
    Clock as ClockIcon,
    DollarSign,
    Phone,
    Mail,
    Globe,
    Award,
    Edit2,
    Save,
    Image,
    Eye,
    Check,
    AlertCircle,
    ThumbsUp,
    ThumbsDown,
    CheckCheck,
} from 'lucide-react';

// ============================================
// DESIGN TOKENS
// ============================================
const C = {
    ink: '#072E2A',
    inkSoft: '#0B2422',
    cream: '#FBF6EA',
    paper: '#FFFFFF',
    gold: '#C79A3E',
    goldLight: '#E4C77B',
    coral: '#E2725B',
    sage: '#5C6E69',
    mist: '#8A9A95',
    line: '#E4DEC8',
    success: '#3F7A5E',
    successBg: '#E6F0EA',
    warn: '#B4791F',
    warnBg: '#FBF0DD',
    danger: '#B84A3B',
    dangerBg: '#FBEAE7',
};

const FONT = {
    display: "'Fraunces', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'IBM Plex Mono', 'Courier New', monospace",
};

// ============================================
// PRESENTATIONAL COMPONENTS
// ============================================
const RippleDivider = ({ color = C.gold }) => (
    <svg viewBox="0 0 400 16" preserveAspectRatio="none" style={{ width: '100%', height: 16, display: 'block' }}>
        <path
            d="M0 8 C 30 0, 60 16, 100 8 S 160 0, 200 8 S 260 16, 300 8 S 360 0, 400 8"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            opacity="0.5"
        />
    </svg>
);

const StatusSeal = ({ status }) => {
    const map = {
        pending: { fg: C.warn, bg: C.warnBg, label: 'Pending' },
        confirmed: { fg: C.success, bg: C.successBg, label: 'Confirmed' },
        completed: { fg: C.inkSoft, bg: '#EDECE4', label: 'Completed' },
        cancelled: { fg: C.danger, bg: C.dangerBg, label: 'Cancelled' },
        rejected: { fg: C.danger, bg: C.dangerBg, label: 'Rejected' },
        available: { fg: C.success, bg: C.successBg, label: 'Available' },
        full: { fg: C.danger, bg: C.dangerBg, label: 'Full' },
        approved: { fg: C.success, bg: C.successBg, label: 'Approved ✅' },
        implemented: { fg: C.gold, bg: C.warnBg, label: 'Implemented ✨' },
    };
    const s = map[status] || { fg: C.sage, bg: '#EEEEEE', label: status };
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 999,
                fontFamily: FONT.mono,
                fontSize: 11,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: s.fg,
                background: s.bg,
                border: `1px solid ${s.fg}22`,
            }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.fg }} />
            {s.label}
        </span>
    );
};

const StatCard = ({ label, value, icon: Icon, accent }) => (
    <div
        style={{
            background: C.paper,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minWidth: 0,
        }}>
        <div>
            <p
                style={{
                    fontFamily: FONT.body,
                    fontSize: 12,
                    color: C.sage,
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                }}>
                {label}
            </p>
            <p style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 600, color: C.inkSoft, margin: '4px 0 0' }}>
                {value}
            </p>
        </div>
        <div
            style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `${accent}1A`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
            <Icon size={18} color={accent} />
        </div>
    </div>
);

const LedgerTab = ({ label, active, onClick, icon: Icon }) => (
    <button
        onClick={onClick}
        style={{
            fontFamily: FONT.display,
            fontStyle: active ? 'italic' : 'normal',
            fontSize: 14,
            padding: '10px 20px 8px',
            marginRight: -1,
            background: active ? C.paper : 'transparent',
            color: active ? C.inkSoft : C.sage,
            border: `1px solid ${active ? C.gold : 'transparent'}`,
            borderBottom: active ? `1px solid ${C.paper}` : `1px solid ${C.line}`,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            cursor: 'pointer',
            position: 'relative',
            top: active ? 1 : 0,
            transition: 'color 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
        }}>
        {Icon && <Icon size={14} />}
        {label}
    </button>
);

const EmptyState = ({ text, icon = null }) => (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: C.sage, fontSize: 13 }}>
        {icon && <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>}
        <p>{text}</p>
    </div>
);

const inputStyle = {
    width: '100%',
    border: `1px solid ${C.line}`,
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 13,
    color: C.inkSoft,
    marginTop: 4,
    fontFamily: FONT.mono,
};

const FormField = ({ label, children, style }) => (
    <div style={{ marginBottom: 12, ...style }}>
        <label style={{ fontSize: 12, color: C.sage }}>{label}</label>
        {children}
    </div>
);

const IconButton = ({ icon: Icon, tone, onClick, busy, label }) => {
    const tones = { success: C.success, danger: C.danger, warning: C.warn, info: C.inkSoft, gold: C.gold };
    return (
        <button
            onClick={onClick}
            disabled={busy}
            title={label}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 6,
                border: 'none',
                background: `${tones[tone]}1A`,
                color: tones[tone],
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = tones[tone];
                e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = `${tones[tone]}1A`;
                e.currentTarget.style.color = tones[tone];
            }}>
            {busy ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon size={14} />}
        </button>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
const GuideDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [showNotifications, setShowNotifications] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [bookingFilter, setBookingFilter] = useState('all');
    const [availability, setAvailability] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionFilter, setSuggestionFilter] = useState('pending');
    const [insightData, setInsightData] = useState({
        popularDistricts: [],
        peakHours: [],
        monthlyBookings: [],
        topDestinations: [],
    });
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        fullName: '',
        phone: '',
        bio: '',
        experience: '',
        languages: '',
        specialties: '',
        pricePerDay: '',
        pricePerHour: '',
        facebook: '',
        instagram: '',
        website: '',
    });
    const [showAddSlot, setShowAddSlot] = useState(false);
    const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '', maxBookings: 1 });
    const [slotSaving, setSlotSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const showToast = (message) => {
        setToast({ message });
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => setToast(null), 2800);
    };

    // ============================================
    // FETCH LOCAL SUGGESTIONS
    // ============================================
    const fetchLocalSuggestions = useCallback(() => {
        try {
            const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');

            const guideDistrict = profile?.primary_district || '';

            if (!guideDistrict) {
                setSuggestions(localSuggestions);
                return;
            }

            const normalizeDistrict = (name) => {
                if (!name) return '';
                return name.toLowerCase().trim();
            };

            const normalizedGuideDistrict = normalizeDistrict(guideDistrict);

            const filtered = localSuggestions.filter((s) => {
                const suggestionDistrict = normalizeDistrict(s.district || '');
                const locationMatch = s.location_info?.toLowerCase().includes(normalizedGuideDistrict) || false;
                const nameMatch = s.name?.toLowerCase().includes(normalizedGuideDistrict) || false;
                const isRelevantType = s.type === 'hidden_gem' || s.type === 'insight' || !s.type;
                const matches = suggestionDistrict === normalizedGuideDistrict || locationMatch || nameMatch;
                return isRelevantType && matches;
            });

            setSuggestions(filtered);
        } catch (e) {
            console.error('Error fetching local suggestions:', e);
            setSuggestions([]);
        }
    }, [profile?.primary_district]);

    // ============================================
    // FETCH DATA FROM API - FIXED
    // ============================================
    const fetchDashboardData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            console.log('📊 Fetching guide profile...');
            const profileRes = await api.get('/guides/guides/profile/');
            console.log('📊 Profile response:', profileRes.data);

            if (profileRes.data?.success && profileRes.data?.profile) {
                setProfile(profileRes.data.profile);
                setProfileForm({
                    fullName: profileRes.data.profile.full_name || '',
                    phone: profileRes.data.profile.phone || '',
                    bio: profileRes.data.profile.bio || '',
                    experience: profileRes.data.profile.experience_years || '',
                    languages: profileRes.data.profile.languages || '',
                    specialties: profileRes.data.profile.specialties || '',
                    pricePerDay: profileRes.data.profile.price_per_day || '',
                    pricePerHour: profileRes.data.profile.price_per_hour || '',
                    facebook: profileRes.data.profile.facebook || '',
                    instagram: profileRes.data.profile.instagram || '',
                    website: profileRes.data.profile.website || '',
                });
            }

            console.log('📊 Fetching bookings...');
            const bookingsRes = await api.get('/guides/guides/bookings/');
            console.log('📊 Bookings response:', bookingsRes.data);

            let bookingsData = [];
            if (bookingsRes.data?.success && bookingsRes.data?.bookings) {
                bookingsData = bookingsRes.data.bookings;
            } else if (bookingsRes.data && Array.isArray(bookingsRes.data)) {
                bookingsData = bookingsRes.data;
            } else if (bookingsRes.data?.results && Array.isArray(bookingsRes.data.results)) {
                bookingsData = bookingsRes.data.results;
            }

            // ✅ Ensure destination is extracted from notes if not present
            bookingsData = bookingsData.map(b => ({
                ...b,
                destination: b.destination || b.special_requests || b.notes || 'Not specified',
            }));

            console.log('📊 Bookings data with destinations:', bookingsData);
            setBookings(bookingsData);

            console.log('📊 Fetching availability...');
            const availRes = await api.get('/guides/guides/availability/');
            console.log('📊 Availability response:', availRes.data);

            if (availRes.data?.success) {
                setAvailability(availRes.data.availability || []);
            }

            console.log('📊 Fetching reviews...');
            const reviewsRes = await api.get('/guides/guides/reviews/');
            console.log('📊 Reviews response:', reviewsRes.data);

            if (reviewsRes.data?.success) {
                setReviews(reviewsRes.data.reviews || []);
            }

            fetchLocalSuggestions();

            if (bookingsData.length > 0) {
                generateInsightData(bookingsData);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            console.error('Error details:', error.response?.data);
            showToast('Error loading dashboard data');
        } finally {
            setLoading(false);
        }
    }, [user, fetchLocalSuggestions]);

    const generateInsightData = useCallback((guideBookings) => {
        const districtCount = {};
        guideBookings.forEach((b) => {
            if (b.district?.name) {
                const name = b.district.name;
                districtCount[name] = (districtCount[name] || 0) + 1;
            }
        });
        const popularDistricts = Object.entries(districtCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const monthCount = {};
        guideBookings.forEach((b) => {
            if (b.date) {
                const month = new Date(b.date).toLocaleString('default', { month: 'short' });
                monthCount[month] = (monthCount[month] || 0) + 1;
            }
        });
        const monthlyBookings = Object.entries(monthCount).map(([month, count]) => ({ month, count }));

        setInsightData({
            popularDistricts,
            peakHours: [],
            monthlyBookings,
            topDestinations: [],
        });
    }, []);

    useEffect(() => {
        if (user?.role !== 'guide') {
            navigate('/');
            return;
        }
        fetchDashboardData();
    }, [user, navigate, fetchDashboardData]);

    useEffect(() => {
        if (profile?.primary_district) {
            fetchLocalSuggestions();
        }
    }, [profile?.primary_district, fetchLocalSuggestions]);

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'hidden_gems_suggestions') {
                console.log('📸 Storage changed, refreshing suggestions...');
                fetchLocalSuggestions();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchLocalSuggestions]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
        window.setTimeout(() => {
            setRefreshing(false);
            showToast('Dashboard refreshed');
        }, 300);
    };

    // ============================================
    // DERIVED STATS
    // ============================================
    const stats = useMemo(() => {
        const pending = bookings.filter((b) => b.status === 'pending').length;
        const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
        const completed = bookings.filter((b) => b.status === 'completed').length;
        const approvedReviews = reviews.filter((r) => r.is_approved);
        const rating = approvedReviews.length
            ? (approvedReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / approvedReviews.length).toFixed(1)
            : '—';
        const pendingReviews = reviews.filter((r) => !r.is_approved).length;
        const pendingSuggestions = suggestions.filter((s) => s.status === 'pending').length;
        const approvedSuggestions = suggestions.filter((s) => s.status === 'approved').length;
        const implementedSuggestions = suggestions.filter((s) => s.status === 'implemented').length;
        return {
            total: bookings.length,
            pending,
            confirmed,
            completed,
            rating,
            pendingReviews,
            pendingSuggestions,
            totalSuggestions: suggestions.length,
            approvedSuggestions,
            implementedSuggestions,
        };
    }, [bookings, reviews, suggestions]);

    const notificationItems = useMemo(() => {
        const items = bookings
            .filter((b) => b.status === 'pending')
            .map((b) => ({
                id: `bk-${b.id}`,
                text: `${b.user?.username || 'A traveler'} requested a booking for ${b.district?.name || 'a trip'}`,
                tab: 'bookings',
            }));
        const reviewItems = reviews
            .filter((r) => !r.is_approved)
            .map((r) => ({
                id: `rv-${r.id}`,
                text: `${r.user?.username || 'A traveler'} left a review awaiting approval`,
                tab: 'reviews',
            }));
        const suggestionItems = suggestions
            .filter((s) => s.status === 'pending')
            .map((s) => ({
                id: `sg-${s.id}`,
                text: `📸 New hidden gem suggestion: ${s.name} in ${s.district || 'Unknown'}`,
                tab: 'suggestions',
            }));
        return [...items, ...reviewItems, ...suggestionItems];
    }, [bookings, reviews, suggestions]);

    const filteredBookings = useMemo(
        () => (bookingFilter === 'all' ? bookings : bookings.filter((b) => b.status === bookingFilter)),
        [bookings, bookingFilter],
    );

    const filteredSuggestions = useMemo(
        () => (suggestionFilter === 'all' ? suggestions : suggestions.filter((s) => s.status === suggestionFilter)),
        [suggestions, suggestionFilter],
    );

    // ============================================
    // SUGGESTION ACTIONS
    // ============================================
    const handleSuggestionAction = (suggestionId, action) => {
        setActionLoading(true);
        try {
            const existingSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');

            if (action === 'delete') {
                const updated = existingSuggestions.filter((s) => s.id !== suggestionId);
                localStorage.setItem('hidden_gems_suggestions', JSON.stringify(updated));
                fetchLocalSuggestions();
                showToast('🗑️ Suggestion deleted successfully!');
                if (showSuggestionModal) {
                    setShowSuggestionModal(false);
                    setSelectedSuggestion(null);
                }
                setActionLoading(false);
                return;
            }

            const updated = existingSuggestions.map((s) => {
                if (s.id === suggestionId) {
                    const now = new Date().toISOString();
                    return {
                        ...s,
                        status: action,
                        processed_at: now,
                        processed_by: user?.email || 'guide',
                    };
                }
                return s;
            });

            localStorage.setItem('hidden_gems_suggestions', JSON.stringify(updated));
            fetchLocalSuggestions();

            const actionLabels = {
                approved: '✅ approved',
                rejected: '❌ rejected',
                implemented: '✨ implemented',
            };
            showToast(`Suggestion ${actionLabels[action] || action} successfully!`);

            if (showSuggestionModal) {
                setShowSuggestionModal(false);
                setSelectedSuggestion(null);
            }
        } catch (error) {
            console.error('Error processing suggestion:', error);
            showToast('Error processing suggestion. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // ============================================
    // BOOKING ACTIONS - FIXED URLS
    // ============================================
    const updateBookingStatus = async (bookingId, status) => {
        setProcessingId(bookingId);
        try {
            let action = status;
            if (status === 'confirmed') action = 'confirm';
            if (status === 'rejected') action = 'reject';
            if (status === 'completed') action = 'complete';

            console.log(`🔄 Updating booking ${bookingId} to ${status} (action: ${action})`);

            // ✅ CORRECT: Use /guides/bookings/ (BookingViewSet URLs)
            let response;
            if (action === 'complete') {
                response = await api.post(`/guides/bookings/${bookingId}/complete/`);
            } else {
                response = await api.post(`/guides/bookings/${bookingId}/process/`, { action });
            }

            console.log('📊 Booking update response:', response.data);

            await fetchDashboardData();

            const labels = {
                confirmed: 'confirmed',
                rejected: 'declined',
                completed: 'marked complete',
                cancelled: 'cancelled',
            };
            showToast(`Booking ${labels[status] || 'updated'} successfully!`);
        } catch (error) {
            console.error('Error updating booking:', error);
            console.error('Error details:', error.response?.data);
            showToast(error.response?.data?.error || 'Error updating booking. Please try again.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleComplete = (bookingId) => {
        if (!window.confirm('Mark this booking as completed?')) return;
        updateBookingStatus(bookingId, 'completed');
    };

    // ============================================
    // AVAILABILITY ACTIONS
    // ============================================
    const handleAddSlot = async (e) => {
        e.preventDefault();
        if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
            showToast('Please fill in all fields');
            return;
        }
        setSlotSaving(true);

        try {
            const slotData = {
                date: newSlot.date,
                start_time: newSlot.startTime,
                end_time: newSlot.endTime,
                max_bookings: Number(newSlot.maxBookings) || 1,
            };

            console.log('📊 Adding slot:', slotData);

            const response = await api.post('/guides/guides/availability/add/', slotData);
            console.log('📊 Slot response:', response.data);

            if (response.data?.success) {
                await fetchDashboardData();
                setShowAddSlot(false);
                setNewSlot({ date: '', startTime: '', endTime: '', maxBookings: 1 });
                showToast('Availability slot added successfully!');
            } else {
                showToast(response.data?.error || 'Failed to add slot');
            }
        } catch (error) {
            console.error('Error adding slot:', error);
            console.error('Error details:', error.response?.data);
            showToast(error.response?.data?.error || 'Error adding slot. Please try again.');
        } finally {
            setSlotSaving(false);
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Remove this availability slot?')) return;
        try {
            const response = await api.delete(`/guides/guides/${slotId}/availability/`);
            console.log('📊 Delete slot response:', response.data);

            await fetchDashboardData();
            showToast('Slot removed successfully');
        } catch (error) {
            console.error('Error deleting slot:', error);
            console.error('Error details:', error.response?.data);
            showToast(error.response?.data?.error || 'Error removing slot');
        }
    };

    // ============================================
    // REVIEW ACTIONS
    // ============================================
    const handleReviewAction = async (reviewId, action) => {
        try {
            console.log(`🔄 Processing review ${reviewId} with action: ${action}`);

            // ✅ CORRECT: Use the GuideViewSet reviews endpoint
            const response = await api.post(`/guides/guides/${reviewId}/reviews/process/`, { action });
            console.log('📊 Review response:', response.data);

            await fetchDashboardData();
            showToast(action === 'approve' ? 'Review approved' : 'Review removed');
        } catch (error) {
            console.error('Error processing review:', error);
            console.error('Error details:', error.response?.data);
            showToast('Error processing review');
        }
    };

    // ============================================
    // PROFILE ACTIONS
    // ============================================
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.patch('/auth/update-profile/', {
                full_name: profileForm.fullName,
                phone_number: profileForm.phone,
                bio: profileForm.bio,
                years_of_experience: parseInt(profileForm.experience) || 0,
                languages: profileForm.languages,
                specialties: profileForm.specialties,
                price_per_day: parseFloat(profileForm.pricePerDay) || 0,
                price_per_hour: parseFloat(profileForm.pricePerHour) || 0,
                facebook: profileForm.facebook,
                instagram: profileForm.instagram,
                website: profileForm.website,
            });
            console.log('📊 Profile update response:', response.data);

            await fetchDashboardData();
            setIsEditingProfile(false);
            showToast('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            console.error('Error details:', error.response?.data);
            showToast('Error updating profile');
        }
    };

    const initials = (name) =>
        !name
            ? '?'
            : name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

    const openSuggestionModal = (suggestion) => {
        setSelectedSuggestion(suggestion);
        setShowSuggestionModal(true);
    };

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: C.cream,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={36} color={C.gold} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: 12, color: C.sage, fontFamily: FONT.body }}>Opening the logbook…</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: C.cream, fontFamily: FONT.body }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* HEADER */}
            <header style={{ background: C.ink, color: C.cream, position: 'sticky', top: 0, zIndex: 40 }}>
                <div
                    style={{
                        maxWidth: 1180,
                        margin: '0 auto',
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Anchor size={20} color={C.goldLight} />
                        <h1
                            style={{
                                fontFamily: FONT.display,
                                fontStyle: 'italic',
                                fontSize: 24,
                                color: C.goldLight,
                                margin: 0,
                            }}>
                            The Logbook
                        </h1>
                        <span style={{ width: 1, height: 20, background: `${C.goldLight}44` }} />
                        <span style={{ fontFamily: FONT.body, fontSize: 14, color: C.cream }}>
                            {profile?.full_name || user?.first_name || 'Guide'}
                        </span>
                        {profile?.is_verified && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 11,
                                    color: '#8FD9B6',
                                    border: '1px solid #8FD9B655',
                                    borderRadius: 999,
                                    padding: '2px 8px',
                                    fontFamily: FONT.mono,
                                }}>
                                <UserCheck size={12} /> Verified
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowNotifications((v) => !v)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: C.goldLight,
                                    cursor: 'pointer',
                                    position: 'relative',
                                    padding: 8,
                                    borderRadius: 8,
                                }}
                                aria-label="Notifications">
                                <Bell size={18} />
                                {notificationItems.length > 0 && (
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: 2,
                                            right: 2,
                                            background: C.coral,
                                            color: 'white',
                                            fontSize: 10,
                                            borderRadius: '50%',
                                            width: 16,
                                            height: 16,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontFamily: FONT.mono,
                                        }}>
                                        {notificationItems.length}
                                    </span>
                                )}
                            </button>
                            {showNotifications && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        marginTop: 8,
                                        width: 300,
                                        background: C.paper,
                                        borderRadius: 10,
                                        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                                        border: `1px solid ${C.line}`,
                                        overflow: 'hidden',
                                    }}>
                                    <div
                                        style={{
                                            padding: '10px 14px',
                                            borderBottom: `1px solid ${C.line}`,
                                            fontFamily: FONT.display,
                                            fontStyle: 'italic',
                                            color: C.inkSoft,
                                            fontSize: 14,
                                        }}>
                                        What needs your attention
                                    </div>
                                    {notificationItems.length === 0 ? (
                                        <div style={{ padding: 20, textAlign: 'center', color: C.sage, fontSize: 13 }}>
                                            Nothing pending — well kept log.
                                        </div>
                                    ) : (
                                        notificationItems.map((n) => (
                                            <button
                                                key={n.id}
                                                onClick={() => {
                                                    setActiveTab(n.tab);
                                                    setShowNotifications(false);
                                                }}
                                                style={{
                                                    display: 'block',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    padding: '10px 14px',
                                                    borderBottom: `1px solid ${C.line}`,
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: 13,
                                                    color: C.inkSoft,
                                                }}>
                                                {n.text}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'transparent',
                                border: `1px solid ${C.gold}66`,
                                color: C.goldLight,
                                padding: '7px 12px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: 13,
                            }}>
                            <RefreshCw
                                size={14}
                                style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined}
                            />
                            Refresh
                        </button>
                        <button
                            onClick={logout}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: C.goldLight,
                                cursor: 'pointer',
                                fontSize: 13,
                                padding: '7px 4px',
                            }}>
                            Logout
                        </button>
                    </div>
                </div>
                <RippleDivider color={`${C.gold}55`} />
            </header>

            <div style={{ maxWidth: 1180, margin: '0 auto', padding: '24px' }}>
                {/* STATS */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: 14,
                        marginBottom: 24,
                    }}>
                    <StatCard label="Total Bookings" value={stats.total} icon={CalendarDays} accent={C.inkSoft} />
                    <StatCard label="Pending" value={stats.pending} icon={Clock} accent={C.warn} />
                    <StatCard label="Rating" value={stats.rating} icon={Star} accent={C.gold} />
                    <StatCard
                        label="Reviews to approve"
                        value={stats.pendingReviews}
                        icon={MessageSquare}
                        accent={C.danger}
                    />
                    <StatCard label="📸 Hidden Gems" value={stats.totalSuggestions} icon={Image} accent={C.gold} />
                    <StatCard label="Pending Gems" value={stats.pendingSuggestions} icon={AlertCircle} accent={C.warn} />
                    <StatCard
                        label="✨ Implemented"
                        value={stats.implementedSuggestions}
                        icon={CheckCheck}
                        accent={C.success}
                    />
                </div>

                {/* TABS */}
                <div
                    style={{
                        display: 'flex',
                        borderBottom: `1px solid ${C.line}`,
                        marginBottom: 20,
                        overflowX: 'auto',
                        flexWrap: 'nowrap',
                    }}>
                    <LedgerTab
                        label="Overview"
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                        icon={Anchor}
                    />
                    <LedgerTab
                        label="Bookings"
                        active={activeTab === 'bookings'}
                        onClick={() => setActiveTab('bookings')}
                        icon={CalendarDays}
                    />
                    <LedgerTab
                        label="Availability"
                        active={activeTab === 'availability'}
                        onClick={() => setActiveTab('availability')}
                        icon={Clock}
                    />
                    <LedgerTab
                        label="Reviews"
                        active={activeTab === 'reviews'}
                        onClick={() => setActiveTab('reviews')}
                        icon={Star}
                    />
                    <LedgerTab
                        label="📸 Hidden Gems"
                        active={activeTab === 'suggestions'}
                        onClick={() => setActiveTab('suggestions')}
                        icon={Image}
                    />
                    <LedgerTab
                        label="Insights"
                        active={activeTab === 'insights'}
                        onClick={() => setActiveTab('insights')}
                        icon={TrendingUp}
                    />
                    <LedgerTab
                        label="Profile"
                        active={activeTab === 'profile'}
                        onClick={() => setActiveTab('profile')}
                        icon={User}
                    />
                </div>

                {/* ================= OVERVIEW TAB ================= */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20 }}>
                            <h3
                                style={{
                                    fontFamily: FONT.display,
                                    fontStyle: 'italic',
                                    fontSize: 18,
                                    color: C.inkSoft,
                                    margin: '0 0 4px',
                                }}>
                                Recent bookings
                            </h3>
                            <p style={{ fontSize: 12, color: C.sage, margin: '0 0 14px' }}>
                                Latest requests from travelers
                            </p>
                            {bookings.slice(0, 5).length === 0 ? (
                                <EmptyState text="No bookings yet — they'll land here the moment a traveler books you." />
                            ) : (
                                bookings.slice(0, 5).map((b) => (
                                    <div
                                        key={b.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 0',
                                            borderBottom: `1px solid ${C.line}`,
                                        }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 14, color: C.inkSoft, fontWeight: 500 }}>
                                                {b.user?.username || b.traveler_email || 'Anonymous'}
                                            </p>
                                            <p
                                                style={{
                                                    margin: '2px 0 0',
                                                    fontSize: 12,
                                                    color: C.sage,
                                                    fontFamily: FONT.mono,
                                                }}>
                                                {b.district?.name || 'N/A'} ·{' '}
                                                {b.date ? new Date(b.date).toLocaleDateString() : '—'}
                                                {b.destination && b.destination !== 'Not specified' && (
                                                    <span style={{ display: 'block', marginTop: 2, color: C.gold }}>
                                                        📍 {b.destination}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <StatusSeal status={b.status} />
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20 }}>
                            <h3
                                style={{
                                    fontFamily: FONT.display,
                                    fontStyle: 'italic',
                                    fontSize: 18,
                                    color: C.inkSoft,
                                    margin: '0 0 4px',
                                }}>
                                📸 Recent Hidden Gems
                            </h3>
                            <p style={{ fontSize: 12, color: C.sage, margin: '0 0 14px' }}>
                                Traveler suggestions for your district
                            </p>
                            {suggestions.slice(0, 5).length === 0 ? (
                                <EmptyState text="No hidden gems shared with you yet." icon="📸" />
                            ) : (
                                suggestions.slice(0, 5).map((s) => (
                                    <div
                                        key={s.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 0',
                                            borderBottom: `1px solid ${C.line}`,
                                        }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {s.image ? (
                                                <img
                                                    src={s.image}
                                                    alt={s.name}
                                                    style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 6,
                                                        background: C.line,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 18,
                                                    }}>
                                                    📍
                                                </div>
                                            )}
                                            <div>
                                                <p style={{ margin: 0, fontSize: 14, color: C.inkSoft, fontWeight: 500 }}>
                                                    {s.name}
                                                </p>
                                                <p style={{ margin: '2px 0 0', fontSize: 11, color: C.sage }}>
                                                    {s.district || 'Unknown'} · {s.category}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusSeal status={s.status || 'pending'} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ================= BOOKINGS TAB ================= */}
                {activeTab === 'bookings' && (
                    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 16,
                                flexWrap: 'wrap',
                                gap: 10,
                            }}>
                            <h3
                                style={{
                                    fontFamily: FONT.display,
                                    fontStyle: 'italic',
                                    fontSize: 18,
                                    color: C.inkSoft,
                                    margin: 0,
                                }}>
                                Booking requests
                            </h3>
                            <select
                                value={bookingFilter}
                                onChange={(e) => setBookingFilter(e.target.value)}
                                style={{
                                    border: `1px solid ${C.line}`,
                                    borderRadius: 8,
                                    padding: '7px 10px',
                                    fontSize: 13,
                                    color: C.inkSoft,
                                    background: C.cream,
                                }}>
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {filteredBookings.length === 0 ? (
                            <EmptyState text="No bookings match this filter." />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr
                                            style={{
                                                textAlign: 'left',
                                                color: C.sage,
                                                fontSize: 11,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                            }}>
                                            <th style={{ padding: '6px 8px' }}>Traveler</th>
                                            <th style={{ padding: '6px 8px' }}>District</th>
                                            <th style={{ padding: '6px 8px' }}>📍 Destination</th>
                                            <th style={{ padding: '6px 8px' }}>Date</th>
                                            <th style={{ padding: '6px 8px' }}>Status</th>
                                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.map((b) => (
                                            <tr key={b.id} style={{ borderTop: `1px solid ${C.line}` }}>
                                                <td style={{ padding: '10px 8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div
                                                            style={{
                                                                width: 26,
                                                                height: 26,
                                                                borderRadius: '50%',
                                                                background: C.cream,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: 11,
                                                                fontFamily: FONT.mono,
                                                                color: C.inkSoft,
                                                                border: `1px solid ${C.line}`,
                                                            }}>
                                                            {initials(b.user?.username || b.traveler_email)}
                                                        </div>
                                                        <span style={{ color: C.inkSoft }}>
                                                            {b.user?.username || b.traveler_email || 'Anonymous'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '10px 8px', color: C.inkSoft }}>
                                                    {b.district?.name || 'N/A'}
                                                </td>
                                                <td style={{ padding: '10px 8px' }}>
                                                    <span
                                                        style={{
                                                            background: 'rgba(199,154,62,0.12)',
                                                            padding: '2px 10px',
                                                            borderRadius: 999,
                                                            fontSize: 12,
                                                            color: '#0E5C53',
                                                        }}>
                                                        📍 {b.destination || b.special_requests || b.notes || 'Not specified'}
                                                    </span>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: '10px 8px',
                                                        color: C.inkSoft,
                                                        fontFamily: FONT.mono,
                                                    }}>
                                                    {b.date ? new Date(b.date).toLocaleDateString() : '—'}
                                                </td>
                                                <td style={{ padding: '10px 8px' }}>
                                                    <StatusSeal status={b.status} />
                                                </td>
                                                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: 6 }}>
                                                        {b.status === 'pending' && (
                                                            <>
                                                                <IconButton
                                                                    icon={CheckCircle2}
                                                                    tone="success"
                                                                    busy={processingId === b.id}
                                                                    onClick={() => updateBookingStatus(b.id, 'confirmed')}
                                                                    label="Confirm"
                                                                />
                                                                <IconButton
                                                                    icon={XCircle}
                                                                    tone="danger"
                                                                    busy={processingId === b.id}
                                                                    onClick={() => updateBookingStatus(b.id, 'rejected')}
                                                                    label="Decline"
                                                                />
                                                            </>
                                                        )}
                                                        {b.status === 'confirmed' && (
                                                            <button
                                                                onClick={() => handleComplete(b.id)}
                                                                disabled={processingId === b.id}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: 6,
                                                                    background: C.success,
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: 6,
                                                                    padding: '6px 10px',
                                                                    fontSize: 12,
                                                                    cursor: 'pointer',
                                                                }}>
                                                                <CheckCircle2 size={13} /> Complete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ================= AVAILABILITY TAB ================= */}
                {activeTab === 'availability' && (
                    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 16,
                            }}>
                            <h3
                                style={{
                                    fontFamily: FONT.display,
                                    fontStyle: 'italic',
                                    fontSize: 18,
                                    color: C.inkSoft,
                                    margin: 0,
                                }}>
                                Availability
                            </h3>
                            <button
                                onClick={() => setShowAddSlot(true)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    background: C.ink,
                                    color: C.goldLight,
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 14px',
                                    fontSize: 13,
                                    cursor: 'pointer',
                                }}>
                                <PlusCircle size={15} /> Add slot
                            </button>
                        </div>

                        {availability.length === 0 ? (
                            <EmptyState text="No availability added yet. Add a slot so travelers can book time with you." />
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                    <thead>
                                        <tr
                                            style={{
                                                textAlign: 'left',
                                                color: C.sage,
                                                fontSize: 11,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em',
                                            }}>
                                            <th style={{ padding: '6px 8px' }}>Date</th>
                                            <th style={{ padding: '6px 8px' }}>Time</th>
                                            <th style={{ padding: '6px 8px' }}>Booked</th>
                                            <th style={{ padding: '6px 8px' }}>Status</th>
                                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {availability.map((s) => {
                                            const full = s.is_booked || (s.current_bookings || 0) >= (s.max_bookings || 1);
                                            return (
                                                <tr key={s.id} style={{ borderTop: `1px solid ${C.line}` }}>
                                                    <td
                                                        style={{
                                                            padding: '10px 8px',
                                                            fontFamily: FONT.mono,
                                                            color: C.inkSoft,
                                                        }}>
                                                        {new Date(s.date).toLocaleDateString()}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding: '10px 8px',
                                                            fontFamily: FONT.mono,
                                                            color: C.inkSoft,
                                                        }}>
                                                        {s.start_time}–{s.end_time}
                                                    </td>
                                                    <td style={{ padding: '10px 8px', color: C.inkSoft }}>
                                                        {s.current_bookings || 0} / {s.max_bookings}
                                                    </td>
                                                    <td style={{ padding: '10px 8px' }}>
                                                        {full ? (
                                                            <StatusSeal status="full" />
                                                        ) : (
                                                            <StatusSeal status="available" />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleDeleteSlot(s.id)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: C.danger,
                                                                cursor: 'pointer',
                                                                padding: 6,
                                                            }}
                                                            aria-label="Delete slot">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ================= REVIEWS TAB ================= */}
                {activeTab === 'reviews' && (
                    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20 }}>
                        <h3
                            style={{
                                fontFamily: FONT.display,
                                fontStyle: 'italic',
                                fontSize: 18,
                                color: C.inkSoft,
                                margin: '0 0 4px',
                            }}>
                            Reviews
                        </h3>
                        <p style={{ fontSize: 12, color: C.sage, margin: '0 0 14px' }}>
                            Approve reviews before they appear on your profile
                        </p>

                        {reviews.length === 0 ? (
                            <EmptyState text="No reviews yet." />
                        ) : (
                            reviews.map((r) => (
                                <div key={r.id} style={{ padding: '14px 0', borderBottom: `1px solid ${C.line}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 14, color: C.inkSoft, fontWeight: 500 }}>
                                                {r.user?.username || 'Anonymous'}
                                            </span>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 3,
                                                    color: C.gold,
                                                    fontSize: 12,
                                                }}>
                                                <Star size={12} fill={C.gold} /> {r.rating}
                                            </span>
                                        </div>
                                        {r.is_approved ? (
                                            <StatusSeal status="confirmed" />
                                        ) : (
                                            <div style={{ display: 'inline-flex', gap: 6 }}>
                                                <IconButton
                                                    icon={CheckCircle2}
                                                    tone="success"
                                                    onClick={() => handleReviewAction(r.id, 'approve')}
                                                    label="Approve"
                                                />
                                                <IconButton
                                                    icon={XCircle}
                                                    tone="danger"
                                                    onClick={() => handleReviewAction(r.id, 'reject')}
                                                    label="Remove"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ margin: '6px 0 0', fontSize: 13, color: C.sage }}>
                                        {r.comment || r.review_text || 'No comment left.'}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ================= HIDDEN GEMS TAB ================= */}
                {activeTab === 'suggestions' && (
                    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 16,
                                flexWrap: 'wrap',
                                gap: 10,
                            }}>
                            <div>
                                <h3
                                    style={{
                                        fontFamily: FONT.display,
                                        fontStyle: 'italic',
                                        fontSize: 18,
                                        color: C.inkSoft,
                                        margin: 0,
                                    }}>
                                    📸 Hidden Gems{' '}
                                    <span style={{ fontSize: 12, color: C.sage, fontStyle: 'normal' }}>
                                        ({suggestions.length})
                                    </span>
                                </h3>
                                <p style={{ fontSize: 12, color: C.sage, margin: '4px 0 0' }}>
                                    Travelers have shared these hidden gems in your district
                                </p>
                            </div>
                            <select
                                value={suggestionFilter}
                                onChange={(e) => setSuggestionFilter(e.target.value)}
                                style={{
                                    border: `1px solid ${C.line}`,
                                    borderRadius: 8,
                                    padding: '7px 10px',
                                    fontSize: 13,
                                    color: C.inkSoft,
                                    background: C.cream,
                                }}>
                                <option value="all">All</option>
                                <option value="pending">⏳ Pending Review</option>
                                <option value="approved">✅ Approved</option>
                                <option value="rejected">❌ Rejected</option>
                                <option value="implemented">✨ Implemented</option>
                            </select>
                        </div>

                        {filteredSuggestions.length === 0 ? (
                            <EmptyState text="No hidden gems found in this filter." icon="📸" />
                        ) : (
                            <div style={{ display: 'grid', gap: 16 }}>
                                {filteredSuggestions.map((s) => (
                                    <div
                                        key={s.id}
                                        style={{
                                            background: C.cream,
                                            borderRadius: 10,
                                            padding: 16,
                                            border: `1px solid ${C.line}`,
                                            display: 'flex',
                                            gap: 16,
                                            alignItems: 'flex-start',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onClick={() => openSuggestionModal(s)}
                                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.gold)}
                                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.line)}>
                                        <div style={{ flexShrink: 0 }}>
                                            {s.image ? (
                                                <img
                                                    src={s.image}
                                                    alt={s.name}
                                                    style={{
                                                        width: 100,
                                                        height: 100,
                                                        borderRadius: 8,
                                                        objectFit: 'cover',
                                                        border: `1px solid ${C.line}`,
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 100,
                                                        height: 100,
                                                        borderRadius: 8,
                                                        background: C.line,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: 40,
                                                        border: `1px solid ${C.line}`,
                                                    }}>
                                                    📍
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    flexWrap: 'wrap',
                                                    gap: 8,
                                                }}>
                                                <h4 style={{ fontSize: 16, color: C.inkSoft, margin: 0 }}>{s.name}</h4>
                                                <StatusSeal status={s.status || 'pending'} />
                                            </div>
                                            <p style={{ fontSize: 12, color: C.sage, margin: '4px 0' }}>
                                                📍 {s.district || 'Unknown'} · {s.category || 'Uncategorized'}
                                            </p>
                                            <p style={{ fontSize: 13, color: C.inkSoft, margin: '8px 0', lineHeight: 1.5 }}>
                                                {s.description?.substring(0, 120)}
                                                {s.description?.length > 120 ? '...' : ''}
                                            </p>
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color: C.sage,
                                                        background: C.line,
                                                        padding: '2px 10px',
                                                        borderRadius: 999,
                                                    }}>
                                                    👤 {s.user_email || 'Anonymous'}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        color: C.sage,
                                                        background: C.line,
                                                        padding: '2px 10px',
                                                        borderRadius: 999,
                                                    }}>
                                                    📅{' '}
                                                    {s.created_at
                                                        ? new Date(s.created_at).toLocaleDateString()
                                                        : 'Recently'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                                                {s.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSuggestionAction(s.id, 'approved');
                                                            }}
                                                            disabled={actionLoading}
                                                            style={{
                                                                padding: '6px 16px',
                                                                borderRadius: 999,
                                                                border: 'none',
                                                                background: C.success,
                                                                color: 'white',
                                                                fontSize: 12,
                                                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                opacity: actionLoading ? 0.6 : 1,
                                                            }}
                                                            onMouseEnter={(e) =>
                                                                (e.currentTarget.style.background = '#2E7D32')
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.background = C.success)
                                                            }>
                                                            <Check size={14} /> Approve
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSuggestionAction(s.id, 'rejected');
                                                            }}
                                                            disabled={actionLoading}
                                                            style={{
                                                                padding: '6px 16px',
                                                                borderRadius: 999,
                                                                border: 'none',
                                                                background: C.danger,
                                                                color: 'white',
                                                                fontSize: 12,
                                                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                opacity: actionLoading ? 0.6 : 1,
                                                            }}
                                                            onMouseEnter={(e) =>
                                                                (e.currentTarget.style.background = '#C62828')
                                                            }
                                                            onMouseLeave={(e) =>
                                                                (e.currentTarget.style.background = C.danger)
                                                            }>
                                                            <X size={14} /> Reject
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSuggestionAction(s.id, 'implemented');
                                                            }}
                                                            disabled={actionLoading}
                                                            style={{
                                                                padding: '6px 16px',
                                                                borderRadius: 999,
                                                                border: 'none',
                                                                background: C.ink,
                                                                color: C.goldLight,
                                                                fontSize: 12,
                                                                cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 6,
                                                                opacity: actionLoading ? 0.6 : 1,
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = '#0B2422';
                                                                e.currentTarget.style.color = '#E4C77B';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = C.ink;
                                                                e.currentTarget.style.color = C.goldLight;
                                                            }}>
                                                            <CheckCircle2 size={14} /> Implement ✨
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (
                                                            window.confirm(
                                                                `Delete "${s.name}"? This action cannot be undone.`,
                                                            )
                                                        ) {
                                                            handleSuggestionAction(s.id, 'delete');
                                                        }
                                                    }}
                                                    disabled={actionLoading}
                                                    style={{
                                                        padding: '6px 16px',
                                                        borderRadius: 999,
                                                        border: 'none',
                                                        background: C.danger,
                                                        color: 'white',
                                                        fontSize: 12,
                                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        opacity: actionLoading ? 0.6 : 1,
                                                    }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#C62828')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = C.danger)}>
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openSuggestionModal(s);
                                                    }}
                                                    style={{
                                                        padding: '6px 16px',
                                                        borderRadius: 999,
                                                        border: `1px solid ${C.line}`,
                                                        background: 'transparent',
                                                        color: C.sage,
                                                        fontSize: 12,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = C.gold;
                                                        e.currentTarget.style.color = C.inkSoft;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = C.line;
                                                        e.currentTarget.style.color = C.sage;
                                                    }}>
                                                    <Eye size={14} /> View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ================= INSIGHTS TAB ================= */}
                {activeTab === 'insights' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20 }}>
                            <h3
                                style={{
                                    fontFamily: FONT.display,
                                    fontStyle: 'italic',
                                    fontSize: 16,
                                    color: C.inkSoft,
                                    margin: '0 0 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                <MapPin size={18} color={C.gold} /> Popular Districts
                            </h3>
                            {insightData.popularDistricts.length === 0 ? (
                                <p style={{ color: C.sage, fontSize: 13 }}>No data yet. Start booking to see insights!</p>
                            ) : (
                                insightData.popularDistricts.map((item, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '6px 0',
                                            borderBottom: `1px solid ${C.line}44`,
                                        }}>
                                        <span
                                            style={{ fontFamily: FONT.mono, fontSize: 13, color: C.inkSoft, minWidth: 20 }}>
                                            {i + 1}.
                                        </span>
                                        <span style={{ flex: 1, fontSize: 13, color: C.inkSoft }}>{item.name}</span>
                                        <span style={{ fontSize: 12, color: C.sage }}>{item.count} bookings</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 20 }}>
                            <h3
                                style={{
                                    fontFamily: FONT.display,
                                    fontStyle: 'italic',
                                    fontSize: 16,
                                    color: C.inkSoft,
                                    margin: '0 0 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                <CalendarDays size={18} color={C.gold} /> Monthly Trend
                            </h3>
                            {insightData.monthlyBookings.length === 0 ? (
                                <p style={{ color: C.sage, fontSize: 13 }}>No data yet.</p>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
                                    {insightData.monthlyBookings.map((item, i) => {
                                        const max = Math.max(...insightData.monthlyBookings.map((m) => m.count));
                                        const height = max > 0 ? (item.count / max) * 100 : 0;
                                        return (
                                            <div
                                                key={i}
                                                style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                }}>
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        height: `${Math.max(height, 4)}%`,
                                                        minHeight: 4,
                                                        background: C.gold,
                                                        borderRadius: '4px 4px 0 0',
                                                    }}
                                                />
                                                <span style={{ fontSize: 10, color: C.sage, marginTop: 4 }}>
                                                    {item.month}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ================= PROFILE TAB ================= */}
                {activeTab === 'profile' && (
                    <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 24 }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 16,
                            }}>
                            <h3
                                style={{
                                    fontFamily: FONT.display,
                                    fontStyle: 'italic',
                                    fontSize: 18,
                                    color: C.inkSoft,
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                <User size={20} color={C.gold} /> Guide Profile
                            </h3>
                            <button
                                onClick={() => setIsEditingProfile(!isEditingProfile)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    background: isEditingProfile ? C.success : C.ink,
                                    color: isEditingProfile ? 'white' : C.goldLight,
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 14px',
                                    fontSize: 13,
                                    cursor: 'pointer',
                                }}>
                                {isEditingProfile ? <Save size={15} /> : <Edit2 size={15} />}
                                {isEditingProfile ? 'Save Changes' : 'Edit Profile'}
                            </button>
                        </div>

                        {isEditingProfile ? (
                            <form onSubmit={handleProfileUpdate}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.fullName}
                                            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Phone
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Bio
                                        </label>
                                        <textarea
                                            value={profileForm.bio}
                                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Experience (years)
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.experience}
                                            onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Languages
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.languages}
                                            onChange={(e) => setProfileForm({ ...profileForm, languages: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Specialties
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.specialties}
                                            onChange={(e) =>
                                                setProfileForm({ ...profileForm, specialties: e.target.value })
                                            }
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Price per Day
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.pricePerDay}
                                            onChange={(e) =>
                                                setProfileForm({ ...profileForm, pricePerDay: e.target.value })
                                            }
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Price per Hour
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.pricePerHour}
                                            onChange={(e) =>
                                                setProfileForm({ ...profileForm, pricePerHour: e.target.value })
                                            }
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Facebook
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.facebook}
                                            onChange={(e) => setProfileForm({ ...profileForm, facebook: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Instagram
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.instagram}
                                            onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ fontSize: 12, color: C.sage, display: 'block', marginBottom: 4 }}>
                                            Website
                                        </label>
                                        <input
                                            type="text"
                                            value={profileForm.website}
                                            onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                    <button
                                        type="submit"
                                        style={{
                                            background: C.ink,
                                            color: C.goldLight,
                                            border: 'none',
                                            borderRadius: 8,
                                            padding: '10px 20px',
                                            fontSize: 13,
                                            cursor: 'pointer',
                                        }}>
                                        Save Profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingProfile(false)}
                                        style={{
                                            background: 'transparent',
                                            border: `1px solid ${C.line}`,
                                            borderRadius: 8,
                                            padding: '10px 20px',
                                            fontSize: 13,
                                            cursor: 'pointer',
                                            color: C.sage,
                                        }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 20px' }}>
                                <div
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 32,
                                        fontWeight: 'bold',
                                        color: '#fff',
                                        gridRow: '1 / 5',
                                    }}>
                                    {initials(profile?.full_name || user?.first_name)}
                                </div>
                                <div>
                                    <strong style={{ color: C.inkSoft }}>{profile?.full_name || user?.first_name}</strong>
                                </div>
                                <div style={{ color: C.sage }}>
                                    {profile?.is_verified ? '✅ Verified' : '⏳ Not verified'}
                                </div>
                                <div style={{ gridColumn: '2' }}>
                                    {profile?.bio && <p style={{ margin: '4px 0', color: C.inkSoft }}>{profile.bio}</p>}
                                </div>

                                <hr
                                    style={{
                                        gridColumn: '1 / -1',
                                        border: 'none',
                                        borderTop: `1px solid ${C.line}`,
                                        margin: '8px 0',
                                    }}
                                />

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.sage }}>
                                    <Mail size={14} /> Email:
                                </div>
                                <div style={{ color: C.inkSoft }}>{user?.email}</div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.sage }}>
                                    <Phone size={14} /> Phone:
                                </div>
                                <div style={{ color: C.inkSoft }}>{profile?.phone || 'Not set'}</div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.sage }}>
                                    <ClockIcon size={14} /> Experience:
                                </div>
                                <div style={{ color: C.inkSoft }}>{profile?.experience_years || 'Not set'} years</div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.sage }}>
                                    <Globe size={14} /> Languages:
                                </div>
                                <div style={{ color: C.inkSoft }}>{profile?.languages || 'Not set'}</div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.sage }}>
                                    <Award size={14} /> Specialties:
                                </div>
                                <div style={{ color: C.inkSoft }}>{profile?.specialties || 'Not set'}</div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.sage }}>
                                    <DollarSign size={14} /> Pricing:
                                </div>
                                <div style={{ color: C.inkSoft }}>
                                    {profile?.price_per_day ? `₹${profile.price_per_day}/day` : ''}
                                    {profile?.price_per_day && profile?.price_per_hour ? ' · ' : ''}
                                    {profile?.price_per_hour ? `₹${profile.price_per_hour}/hour` : 'Not set'}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ================= ADD SLOT MODAL ================= */}
            {showAddSlot && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(7,46,42,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                    }}>
                    <div style={{ background: C.paper, borderRadius: 12, padding: 24, width: 360, maxWidth: '90vw' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: 6,
                            }}>
                            <h3
                                style={{
                                    fontFamily: FONT.display,
                                    fontStyle: 'italic',
                                    fontSize: 18,
                                    color: C.inkSoft,
                                    margin: 0,
                                }}>
                                Add availability
                            </h3>
                            <button
                                onClick={() => setShowAddSlot(false)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.sage }}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddSlot}>
                            <FormField label="Date">
                                <input
                                    type="date"
                                    required
                                    value={newSlot.date}
                                    onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                                    style={inputStyle}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </FormField>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <FormField label="Start time" style={{ flex: 1 }}>
                                    <input
                                        type="time"
                                        required
                                        value={newSlot.startTime}
                                        onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                        style={inputStyle}
                                    />
                                </FormField>
                                <FormField label="End time" style={{ flex: 1 }}>
                                    <input
                                        type="time"
                                        required
                                        value={newSlot.endTime}
                                        onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                        style={inputStyle}
                                    />
                                </FormField>
                            </div>
                            <FormField label="Max bookings">
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={newSlot.maxBookings}
                                    onChange={(e) =>
                                        setNewSlot({ ...newSlot, maxBookings: parseInt(e.target.value, 10) || 1 })
                                    }
                                    style={inputStyle}
                                />
                            </FormField>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddSlot(false)}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: 8,
                                        border: `1px solid ${C.line}`,
                                        background: 'transparent',
                                        color: C.sage,
                                        cursor: 'pointer',
                                        fontSize: 13,
                                    }}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={slotSaving}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: C.ink,
                                        color: C.goldLight,
                                        cursor: 'pointer',
                                        fontSize: 13,
                                    }}>
                                    {slotSaving ? 'Adding…' : 'Add slot'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= SUGGESTION DETAIL MODAL ================= */}
            {showSuggestionModal && selectedSuggestion && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(7,46,42,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 60,
                        padding: 20,
                    }}>
                    <div
                        style={{
                            background: C.paper,
                            borderRadius: 16,
                            padding: 32,
                            maxWidth: 600,
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                        }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 20,
                            }}>
                            <h3
                                style={{
                                    fontFamily: FONT.display,
                                    fontStyle: 'italic',
                                    fontSize: 24,
                                    color: C.inkSoft,
                                    margin: 0,
                                }}>
                                📸 {selectedSuggestion.name}
                            </h3>
                            <button
                                onClick={() => setShowSuggestionModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 24,
                                    cursor: 'pointer',
                                    color: C.sage,
                                }}>
                                <X size={24} />
                            </button>
                        </div>

                        {selectedSuggestion.image && (
                            <div style={{ marginBottom: 16 }}>
                                <img
                                    src={selectedSuggestion.image}
                                    alt={selectedSuggestion.name}
                                    style={{
                                        width: '100%',
                                        maxHeight: 300,
                                        objectFit: 'cover',
                                        borderRadius: 8,
                                        border: `1px solid ${C.line}`,
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: C.sage,
                                        background: C.line,
                                        padding: '4px 12px',
                                        borderRadius: 999,
                                    }}>
                                    📍 {selectedSuggestion.district || 'Unknown'}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: C.sage,
                                        background: C.line,
                                        padding: '4px 12px',
                                        borderRadius: 999,
                                    }}>
                                    🏷️ {selectedSuggestion.category || 'Uncategorized'}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: C.sage,
                                        background: C.line,
                                        padding: '4px 12px',
                                        borderRadius: 999,
                                    }}>
                                    👤 {selectedSuggestion.user_email || 'Anonymous'}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: C.sage,
                                        background: C.line,
                                        padding: '4px 12px',
                                        borderRadius: 999,
                                    }}>
                                    📅{' '}
                                    {selectedSuggestion.created_at
                                        ? new Date(selectedSuggestion.created_at).toLocaleDateString()
                                        : 'Recently'}
                                </span>
                            </div>
                            <StatusSeal status={selectedSuggestion.status || 'pending'} />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: C.inkSoft, margin: '0 0 4px' }}>
                                📍 Location
                            </h4>
                            <p style={{ fontSize: 13, color: C.sage, margin: 0 }}>
                                {selectedSuggestion.location_info || 'No location details provided'}
                            </p>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: C.inkSoft, margin: '0 0 4px' }}>
                                📝 Description
                            </h4>
                            <p style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>
                                {selectedSuggestion.description || 'No description provided'}
                            </p>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: 10,
                                flexWrap: 'wrap',
                                marginTop: 8,
                                paddingTop: 16,
                                borderTop: `1px solid ${C.line}`,
                            }}>
                            {selectedSuggestion.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => {
                                            handleSuggestionAction(selectedSuggestion.id, 'approved');
                                        }}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '10px 28px',
                                            borderRadius: 999,
                                            border: 'none',
                                            background: C.success,
                                            color: 'white',
                                            fontSize: 13,
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            flex: 1,
                                            justifyContent: 'center',
                                            opacity: actionLoading ? 0.6 : 1,
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#2E7D32')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = C.success)}>
                                        <Check size={18} /> Approve ✅
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleSuggestionAction(selectedSuggestion.id, 'rejected');
                                        }}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '10px 28px',
                                            borderRadius: 999,
                                            border: 'none',
                                            background: C.danger,
                                            color: 'white',
                                            fontSize: 13,
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            flex: 1,
                                            justifyContent: 'center',
                                            opacity: actionLoading ? 0.6 : 1,
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#C62828')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = C.danger)}>
                                        <X size={18} /> Reject ❌
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleSuggestionAction(selectedSuggestion.id, 'implemented');
                                        }}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '10px 28px',
                                            borderRadius: 999,
                                            border: 'none',
                                            background: C.ink,
                                            color: C.goldLight,
                                            fontSize: 13,
                                            cursor: actionLoading ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            flex: 1,
                                            justifyContent: 'center',
                                            opacity: actionLoading ? 0.6 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#0B2422';
                                            e.currentTarget.style.color = '#E4C77B';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = C.ink;
                                            e.currentTarget.style.color = C.goldLight;
                                        }}>
                                        <CheckCircle2 size={18} /> Implement ✨
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => {
                                    if (
                                        window.confirm(`Delete "${selectedSuggestion.name}"? This action cannot be undone.`)
                                    ) {
                                        handleSuggestionAction(selectedSuggestion.id, 'delete');
                                    }
                                }}
                                disabled={actionLoading}
                                style={{
                                    padding: '10px 28px',
                                    borderRadius: 999,
                                    border: 'none',
                                    background: C.danger,
                                    color: 'white',
                                    fontSize: 13,
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    flex: 1,
                                    justifyContent: 'center',
                                    opacity: actionLoading ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#C62828')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = C.danger)}>
                                <Trash2 size={18} /> Delete Permanently
                            </button>
                        </div>

                        {selectedSuggestion.status !== 'pending' && (
                            <div
                                style={{
                                    padding: 14,
                                    borderRadius: 8,
                                    background: C.cream,
                                    textAlign: 'center',
                                    marginTop: 12,
                                }}>
                                <p style={{ margin: 0, fontSize: 13, color: C.sage }}>
                                    This suggestion has been{' '}
                                    <strong style={{ color: C.inkSoft }}>{selectedSuggestion.status}</strong>
                                    {selectedSuggestion.processed_at && (
                                        <span style={{ display: 'block', fontSize: 11, color: C.mist, marginTop: 4 }}>
                                            Processed on {new Date(selectedSuggestion.processed_at).toLocaleDateString()}
                                            {selectedSuggestion.processed_by && ` by ${selectedSuggestion.processed_by}`}
                                        </span>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ================= TOAST ================= */}
            {toast && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 24,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: C.ink,
                        color: C.goldLight,
                        padding: '10px 18px',
                        borderRadius: 8,
                        fontSize: 13,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        zIndex: 60,
                    }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default GuideDashboard;
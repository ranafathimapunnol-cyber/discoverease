// pages/GuideDashboard.jsx - COMPLETE WORKING VERSION
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ✅ Design tokens
const T = {
  ink: '#0B2422',
  deepTeal: '#072E2A',
  teal2: '#0B3A34',
  cream: '#FBF6EA',
  gold: '#C79A3E',
  goldLight: '#E4C77B',
  muted: '#5C6E69',
  muted2: '#8A9A95',
};

// ✅ KERALA DISTRICTS (14 Districts)
const KERALA_DISTRICTS = [
  { id: 1, name: 'Thiruvananthapuram', code: 'TVM' },
  { id: 2, name: 'Kollam', code: 'KLM' },
  { id: 3, name: 'Pathanamthitta', code: 'PTA' },
  { id: 4, name: 'Alappuzha', code: 'ALP' },
  { id: 5, name: 'Kottayam', code: 'KTM' },
  { id: 6, name: 'Idukki', code: 'IDK' },
  { id: 7, name: 'Ernakulam', code: 'EKM' },
  { id: 8, name: 'Thrissur', code: 'TSR' },
  { id: 9, name: 'Palakkad', code: 'PLK' },
  { id: 10, name: 'Malappuram', code: 'MLP' },
  { id: 11, name: 'Kozhikode', code: 'CLT' },
  { id: 12, name: 'Wayanad', code: 'WYD' },
  { id: 13, name: 'Kannur', code: 'KNR' },
  { id: 14, name: 'Kasaragod', code: 'KSD' },
];

// ✅ Zari divider
const ZariDivider = ({ color = T.gold, opacity = 0.55 }) => (
  <svg width="100%" height="10" viewBox="0 0 400 10" preserveAspectRatio="none" style={{ display: 'block' }}>
    <line x1="0" y1="5" x2="400" y2="5" stroke={color} strokeWidth="0.6" strokeOpacity={opacity * 0.7} />
    {Array.from({ length: 34 }).map((_, i) => (
      <rect key={i} x={i * 12 + 4} y="2" width="4.5" height="4.5" fill={color} fillOpacity={opacity} transform={`rotate(45 ${i * 12 + 6.25} 4.25)`} />
    ))}
  </svg>
);

// ✅ Helper functions
const getDistrictName = (districtId) => {
  const district = KERALA_DISTRICTS.find(d => d.id === districtId);
  return district ? district.name : null;
};

// ✅ Local storage helpers
const readGuideProfiles = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('guide_profiles') || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
};

const readGuideAvailabilityMap = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('guide_availability') || '{}');
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  } catch {
    return {};
  }
};

const writeGuideAvailabilityMap = (map) => {
  localStorage.setItem('guide_availability', JSON.stringify(map));
};

const readSuggestions = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const writeSuggestions = (data) => {
  localStorage.setItem('hidden_gems_suggestions', JSON.stringify(data));
};

const readBookings = () => {
  try {
    const raw = JSON.parse(localStorage.getItem('guide_bookings') || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const GuideDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser, isLoggedIn, logout } = useAuth();
  
  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  // Modal states
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState('');
  
  // Profile state
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    experience_years: 0,
    specialties: [],
    phone: '',
    rating: 4.8,
    total_reviews: 0,
    is_verified: false,
    primary_district: null,
    additional_districts: [],
  });
  
  // Availability state
  const [availability, setAvailability] = useState([]);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    max_slots: 5,
    bio: '',
    experience_years: '',
    specialties: '',
    phone: '',
    primary_district: '',
    additional_districts: [],
  });
  
  // Data states
  const [suggestions, setSuggestions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [districts, setDistricts] = useState(KERALA_DISTRICTS);
  const [categories, setCategories] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    bookings: 0,
    insights: 0,
    suggestions: 0,
    pending: 0,
    in_progress: 0,
    approved: 0,
    rejected: 0,
    implemented: 0,
    hidden_gems: 0,
    insight_suggestions: 0,
    districts_served: 0,
    availability_slots: 0,
  });

  const user = authUser || JSON.parse(localStorage.getItem('user') || '{}');
  const guideKey = user?.email || 'guide_demo';

  // ============================================
  // ✅ EFFECTS
  // ============================================
  
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'guide') {
      loadDistrictsAndCategories();
      fetchDashboardData();
    }
  }, [isLoggedIn, user]);

  // ============================================
  // ✅ DATA LOADING
  // ============================================
  
  const loadDistrictsAndCategories = () => {
    // Set Kerala districts
    setDistricts(KERALA_DISTRICTS);
    
    // Load categories
    const defaultCategories = [
      { id: 1, name: 'History', icon: '🏛️' },
      { id: 2, name: 'Food', icon: '🍜' },
      { id: 3, name: 'Nature', icon: '🌿' },
      { id: 4, name: 'Adventure', icon: '🧗' },
      { id: 5, name: 'Culture', icon: '🎭' },
      { id: 6, name: 'Wildlife', icon: '🐘' },
      { id: 7, name: 'Trekking', icon: '⛰️' },
      { id: 8, name: 'Photography', icon: '📸' },
      { id: 9, name: 'Backwaters', icon: '🛶' },
      { id: 10, name: 'Beaches', icon: '🏖️' },
      { id: 11, name: 'Hill Stations', icon: '🌄' },
      { id: 12, name: 'Spice Plantations', icon: '🌶️' },
    ];
    setCategories(defaultCategories);
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Load profile
      const profiles = readGuideProfiles();
      const savedProfile = profiles[guideKey] || {};
      
      const mergedProfile = { 
        ...user, 
        ...savedProfile,
        primary_district: savedProfile.primary_district || null,
        additional_districts: savedProfile.additional_districts || [],
      };
      setProfile(mergedProfile);
      
      // 2. Set form values
      setAvailabilityForm(prev => ({
        ...prev,
        bio: savedProfile.bio || '',
        experience_years: savedProfile.experience_years || '',
        specialties: Array.isArray(savedProfile.specialties) ? savedProfile.specialties.join(', ') : (savedProfile.specialties || ''),
        phone: savedProfile.phone || '',
        primary_district: savedProfile.primary_district || '',
        additional_districts: savedProfile.additional_districts || [],
      }));

      // 3. Load suggestions
      const localSuggestions = readSuggestions();
      setSuggestions(localSuggestions);
      
      // 4. Load availability
      const availabilityMap = readGuideAvailabilityMap();
      const myAvailability = availabilityMap[guideKey] || [];
      setAvailability(myAvailability);

      // 5. Load bookings
      const localBookings = readBookings();
      setBookings(localBookings);

      // 6. Calculate stats
      const implemented = localSuggestions.filter(s => s.status === 'implemented').length;
      const pending = localSuggestions.filter(s => s.status === 'pending').length;
      const in_progress = localSuggestions.filter(s => s.status === 'in_progress').length;
      const approved = localSuggestions.filter(s => s.status === 'approved').length;
      const rejected = localSuggestions.filter(s => s.status === 'rejected').length;
      const hidden_gems = localSuggestions.filter(s => s.type === 'hidden_gem').length;
      const insight_suggestions = localSuggestions.filter(s => s.type === 'insight').length;
      const districtsServed = (savedProfile.primary_district ? 1 : 0) + (savedProfile.additional_districts?.length || 0);

      setStats({
        suggestions: localSuggestions.length,
        insights: implemented,
        pending: pending,
        in_progress: in_progress,
        approved: approved,
        rejected: rejected,
        implemented: implemented,
        hidden_gems: hidden_gems,
        insight_suggestions: insight_suggestions,
        bookings: localBookings.length,
        districts_served: districtsServed,
        availability_slots: myAvailability.length,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ✅ SUGGESTION HANDLING
  // ============================================
  
  const handleProcessSuggestion = async () => {
    if (!selectedSuggestion) return;
    setProcessing(true);
    
    try {
      const localSuggestions = readSuggestions();
      const updatedSuggestions = localSuggestions.map(s => {
        if (s.id === selectedSuggestion.id) {
          let newStatus = s.status;
          if (actionType === 'approve') newStatus = 'approved';
          else if (actionType === 'implement') newStatus = 'implemented';
          else if (actionType === 'in_progress') newStatus = 'in_progress';
          else if (actionType === 'reject') newStatus = 'rejected';
          else if (actionType === 'remove') newStatus = 'rejected';
          
          return {
            ...s,
            status: newStatus,
            admin_notes: notes || s.admin_notes,
            processed_at: new Date().toISOString()
          };
        }
        return s;
      });
      
      writeSuggestions(updatedSuggestions);
      
      alert(`✅ ${selectedSuggestion.type === 'hidden_gem' ? 'Hidden gem' : 'Insight'} ${actionType}ed successfully!`);
      setShowNotesModal(false);
      setSelectedSuggestion(null);
      setNotes('');
      setActionType('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error processing suggestion:', error);
      alert('Failed to process. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessClick = (suggestion, action) => {
    setSelectedSuggestion(suggestion);
    setActionType(action);
    setNotes(suggestion.admin_notes || '');
    setShowNotesModal(true);
  };

  // ============================================
  // ✅ AVAILABILITY HANDLING
  // ============================================
  
  const handleAddAvailability = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      const newSlot = {
        id: Date.now(),
        date: availabilityForm.date,
        start_time: availabilityForm.start_time,
        end_time: availabilityForm.end_time,
        max_slots: availabilityForm.max_slots,
        booked_slots: 0,
        is_available: true
      };

      // Save availability
      const availabilityMap = readGuideAvailabilityMap();
      const mySlots = availabilityMap[guideKey] || [];
      availabilityMap[guideKey] = [...mySlots, newSlot];
      writeGuideAvailabilityMap(availabilityMap);

      // Save/update profile
      const profiles = readGuideProfiles();
      const existing = profiles[guideKey] || {};
      
      const specialtiesArray = availabilityForm.specialties
        ? availabilityForm.specialties.split(',').map(s => s.trim()).filter(Boolean)
        : (existing.specialties || []);
      
      const additionalDistricts = availabilityForm.additional_districts || [];
      
      profiles[guideKey] = {
        ...existing,
        first_name: user?.first_name || existing.first_name || 'Guide',
        last_name: user?.last_name || existing.last_name || '',
        email: user?.email || existing.email || guideKey,
        bio: availabilityForm.bio || existing.bio || '',
        experience_years: availabilityForm.experience_years ? Number(availabilityForm.experience_years) : (existing.experience_years || 0),
        specialties: specialtiesArray,
        phone: availabilityForm.phone || existing.phone || '',
        rating: existing.rating || 4.8,
        total_reviews: existing.total_reviews || 0,
        is_verified: existing.is_verified !== false,
        primary_district: availabilityForm.primary_district ? Number(availabilityForm.primary_district) : (existing.primary_district || null),
        additional_districts: additionalDistricts.map(Number).filter(Boolean),
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('guide_profiles', JSON.stringify(profiles));

      alert('✅ Availability added successfully! You are now visible to travelers.');
      setShowAvailabilityForm(false);
      setAvailabilityForm(prev => ({ 
        ...prev, 
        date: '', 
        start_time: '', 
        end_time: '', 
        max_slots: 5,
      }));
      fetchDashboardData();
      
    } catch (error) {
      console.error('Error adding availability:', error);
      alert('❌ Failed to add availability');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveAvailability = (slotId) => {
    if (!window.confirm('Remove this availability slot? Travelers will no longer see it.')) return;
    
    try {
      const availabilityMap = readGuideAvailabilityMap();
      const mySlots = availabilityMap[guideKey] || [];
      availabilityMap[guideKey] = mySlots.filter(s => s.id !== slotId);
      writeGuideAvailabilityMap(availabilityMap);
      setAvailability(availabilityMap[guideKey]);
      fetchDashboardData();
    } catch (error) {
      console.error('Error removing availability:', error);
      alert('❌ Failed to remove availability');
    }
  };

  // ============================================
  // ✅ FILTER HELPERS
  // ============================================
  
  const getStatusColor = (status) => {
    const colors = {
      'pending': { bg: '#FEF3C7', text: '#D97706' },
      'in_progress': { bg: '#DBEAFE', text: '#2563EB' },
      'approved': { bg: '#DCFCE7', text: '#16A34A' },
      'rejected': { bg: '#FEE2E2', text: '#DC2626' },
      'implemented': { bg: '#F3E8FF', text: '#7C3AED' }
    };
    return colors[status] || { bg: '#F3F4F6', text: '#6B7280' };
  };

  const getFilteredSuggestions = () => {
    let filtered = suggestions;
    if (filterType === 'hidden_gem') {
      filtered = filtered.filter(s => s.type === 'hidden_gem');
    } else if (filterType === 'insight') {
      filtered = filtered.filter(s => s.type === 'insight');
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }
    return filtered;
  };

  const filteredSuggestions = getFilteredSuggestions();

  // ============================================
  // ✅ RENDER HELPERS
  // ============================================
  
  const handleLogout = async () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access this page.');
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getStatusBadge = (status) => {
    const colors = {
      'pending': { bg: '#FEF3C7', text: '#D97706' },
      'confirmed': { bg: '#DCFCE7', text: '#16A34A' },
      'completed': { bg: '#DBEAFE', text: '#2563EB' },
      'cancelled': { bg: '#FEE2E2', text: '#DC2626' },
      'rejected': { bg: '#FEE2E2', text: '#DC2626' }
    };
    return colors[status] || { bg: '#F3F4F6', text: '#6B7280' };
  };

  // Access denied for non-guides
  if (isLoggedIn && user?.role !== 'guide') {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.cream }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🚫</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: T.ink }}>Access Denied</h1>
          <p style={{ color: T.muted, marginBottom: 20 }}>This page is only for registered guides.</p>
          <button onClick={() => navigate('/')} style={{ padding: "10px 24px", borderRadius: 999, border: "1px solid #C79A3E", background: "transparent", color: "#C79A3E", cursor: "pointer" }}>Go to Home</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.cream }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${T.gold}`, borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: 16, color: T.muted }}>Loading guide dashboard...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ✅ MAIN RENDER
  // ============================================
  
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.cream, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .gd-display { font-family: 'Fraunces', serif; }
        .gd-mono { font-family: 'IBM Plex Mono', monospace; }
        .gd-card:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(7,46,42,0.10); }
        .gd-card { transition: all 0.25s ease; }
        .gd-nav-btn:hover { background: rgba(199,154,62,0.1) !important; }
        .gd-feed-row:hover { background: #F6F1E2; }
        .gd-input:focus { outline: none; border-color: #C79A3E !important; box-shadow: 0 0 0 3px rgba(199,154,62,0.15); }
        .filter-chip {
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .filter-chip:hover { transform: translateY(-1px); }
        .district-chip {
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 500;
          background: rgba(199,154,62,0.15);
          color: #0E5C53;
          display: inline-block;
          margin: 2px;
        }
      `}</style>

      {/* ========================================== */}
      {/* SIDEBAR */}
      {/* ========================================== */}
      <div style={{
        width: 260,
        background: `linear-gradient(180deg, ${T.deepTeal} 0%, ${T.teal2} 100%)`,
        color: "#EDE2C4",
        padding: "24px 0",
        minHeight: "100vh",
        position: "fixed",
        height: "100vh",
        overflow: "auto",
        boxShadow: "2px 0 12px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column"
      }}>
        <div style={{ padding: "0 24px", marginBottom: 16 }}>
          <h2 className="gd-display" style={{ fontSize: 22, fontWeight: 'bold', color: T.goldLight, margin: 0 }}>
            🧭 Discover<span style={{ color: T.gold }}>Ease</span>
          </h2>
          <p className="gd-mono" style={{ fontSize: 10, color: 'rgba(237,226,196,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '2px 0 0' }}>
            Guide Portal · Kerala
          </p>
        </div>

        <div style={{ padding: "0 24px 16px" }}>
          <ZariDivider color={T.gold} opacity={0.35} />
        </div>

        <div style={{ padding: "0 24px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 'bold', color: T.deepTeal }}>
            {profile?.first_name?.charAt(0) || user?.first_name?.charAt(0) || 'G'}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#EDE2C4", margin: 0 }}>
              {profile?.first_name || user?.first_name || 'Guide'}
            </p>
            <p style={{ fontSize: 10, color: "rgba(237,226,196,0.6)", margin: 0 }}>
              {profile?.email || user?.email}
            </p>
          </div>
        </div>

        <div style={{ flex: 1, padding: "0 12px" }}>
          <p className="gd-mono" style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(237,226,196,0.4)', padding: "0 12px", marginBottom: 8 }}>
            Navigation
          </p>

          {[
            { key: 'dashboard', icon: '📊', label: 'Dashboard' },
            { key: 'hidden_gems', icon: '💎', label: 'Hidden Gems', badge: stats.pending, badgeColor: '#EF4444' },
            { key: 'insights', icon: '✨', label: 'Insights', badge: stats.insights, badgeColor: '#7C3AED' },
            { key: 'availability', icon: '🕐', label: 'Availability' },
            { key: 'bookings', icon: '📅', label: 'Bookings', badge: stats.bookings, badgeColor: '#3B82F6' },
            { key: 'settings', icon: '⚙️', label: 'Settings' },
          ].map(item => (
            <button
              key={item.key}
              className="gd-nav-btn"
              onClick={() => {
                setActiveTab(item.key);
                setFilterStatus('all');
                if (item.key === 'hidden_gems') setFilterType('hidden_gem');
                else if (item.key === 'insights') setFilterType('insight');
                else setFilterType('all');
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: activeTab === item.key ? 'rgba(199,154,62,0.2)' : 'transparent',
                color: activeTab === item.key ? T.goldLight : 'rgba(237,226,196,0.7)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                transition: 'all 0.3s ease',
                fontFamily: "'Inter', sans-serif",
                marginBottom: 2
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {!!item.badge && (
                <span style={{ marginLeft: 'auto', background: item.badgeColor, padding: '2px 8px', borderRadius: 999, fontSize: 10, color: 'white' }}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(199,154,62,0.2)" }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none', background: 'transparent', color: '#BE5A34', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* MAIN CONTENT */}
      {/* ========================================== */}
      <div style={{ marginLeft: 260, flex: 1, padding: "32px 40px", background: T.cream, minHeight: "100vh" }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: 24 }}>
          <p className="gd-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: T.gold, margin: "0 0 6px" }}>
            DiscoverEase · Guide Command Center
          </p>
          <h1 className="gd-display" style={{ fontSize: 30, fontWeight: 700, color: T.ink, fontStyle: "italic", margin: 0 }}>
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'hidden_gems' && 'Hidden Gems'}
            {activeTab === 'insights' && 'Insights'}
            {activeTab === 'availability' && 'Manage Availability'}
            {activeTab === 'bookings' && 'My Bookings'}
            {activeTab === 'settings' && 'Settings'}
          </h1>
          <p style={{ color: T.muted, margin: "6px 0 0", fontSize: 14 }}>
            {activeTab === 'dashboard' && `Welcome back, ${profile?.first_name || 'Guide'}! Here's everything happening across your Kerala tours.`}
            {activeTab === 'hidden_gems' && `Review hidden gems submitted by travelers. (${stats.hidden_gems} total)`}
            {activeTab === 'insights' && `Review insight suggestions. (${stats.insight_suggestions} total, ${stats.insights} live)`}
            {activeTab === 'availability' && `Manage your availability slots. (${stats.availability_slots} active slots)`}
            {activeTab === 'bookings' && `View all your bookings from travelers. (${stats.bookings} total)`}
            {activeTab === 'settings' && 'Manage your profile and account settings.'}
          </p>
          <div style={{ marginTop: 16, maxWidth: 480 }}>
            <ZariDivider />
          </div>
        </div>

        {/* ========================================== */}
        {/* DASHBOARD TAB */}
        {/* ========================================== */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Suggestions', value: stats.suggestions, color: T.ink },
                { label: 'Pending Review', value: stats.pending, color: '#D97706' },
                { label: 'Live Insights', value: stats.insights, color: '#7C3AED' },
                { label: 'Kerala Districts', value: stats.districts_served, color: '#C79A3E' },
              ].map((s, i) => (
                <div key={i} className="gd-card" style={{ background: "#fff", padding: 20, borderRadius: 10, border: "1px solid rgba(199,154,62,0.2)", borderTop: `3px solid ${T.gold}`, textAlign: "center" }}>
                  <p className="gd-mono" style={{ fontSize: 11, color: T.muted2, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
                  <p className="gd-display" style={{ fontSize: 32, fontWeight: 'bold', color: s.color, margin: "6px 0 0" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Profile Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
              <div style={{ background: "#fff", padding: 20, borderRadius: 10, border: "1px solid rgba(199,154,62,0.2)" }}>
                <h3 className="gd-display" style={{ fontSize: 16, fontStyle: "italic", color: T.ink, marginBottom: 12 }}>📍 Primary District</h3>
                {profile.primary_district ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }}>📍</span>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 600, color: T.ink, margin: 0 }}>
                        {getDistrictName(profile.primary_district)}
                      </p>
                      <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
                        Additional: {profile.additional_districts?.length || 0} districts
                      </p>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: T.muted2 }}>No primary district set.</p>
                )}
              </div>

              <div style={{ background: "#fff", padding: 20, borderRadius: 10, border: "1px solid rgba(199,154,62,0.2)" }}>
                <h3 className="gd-display" style={{ fontSize: 16, fontStyle: "italic", color: T.ink, marginBottom: 12 }}>🎯 Specialties</h3>
                {profile.specialties?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {profile.specialties.map((spec, i) => (
                      <span key={i} className="district-chip">
                        {getCategoryName(spec) || spec}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: T.muted2 }}>No specialties set.</p>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(199,154,62,0.2)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(199,154,62,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 className="gd-display" style={{ fontSize: 16, fontStyle: "italic", color: T.ink, margin: 0 }}>💎 Recent Submissions</h3>
                  <button onClick={() => { setActiveTab('hidden_gems'); setFilterStatus('all'); }} className="gd-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold, background: 'none', border: 'none', cursor: 'pointer' }}>
                    View all →
                  </button>
                </div>
                {suggestions.length === 0 ? (
                  <p style={{ color: T.muted2, textAlign: "center", padding: "28px 20px", margin: 0 }}>No suggestions yet.</p>
                ) : (
                  suggestions.slice(0, 4).map(s => {
                    const c = getStatusColor(s.status);
                    return (
                      <div key={s.id} className="gd-feed-row" style={{ padding: "12px 20px", borderBottom: "1px solid #F3F1E4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {s.type === 'hidden_gem' ? '💎' : '✨'} {s.name || 'Unnamed'}
                          </p>
                          <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0" }}>
                            📍 {s.location_info || 'No location'}
                          </p>
                        </div>
                        <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 500, background: c.bg, color: c.text, whiteSpace: "nowrap" }}>
                          {s.status || 'pending'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(199,154,62,0.2)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(199,154,62,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 className="gd-display" style={{ fontSize: 16, fontStyle: "italic", color: T.ink, margin: 0 }}>📅 Recent Bookings</h3>
                  <button onClick={() => setActiveTab('bookings')} className="gd-mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.gold, background: 'none', border: 'none', cursor: 'pointer' }}>
                    View all →
                  </button>
                </div>
                {bookings.length === 0 ? (
                  <p style={{ color: T.muted2, textAlign: "center", padding: "28px 20px", margin: 0 }}>No bookings yet.</p>
                ) : (
                  bookings.slice(0, 4).map(b => {
                    const statusColor = getStatusBadge(b.status);
                    return (
                      <div key={b.id} className="gd-feed-row" style={{ padding: "12px 20px", borderBottom: "1px solid #F3F1E4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {b.destination || 'Kerala Tour'}
                          </p>
                          <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0" }}>
                            📅 {b.date} · 👤 {b.traveler_email || 'Traveler'}
                          </p>
                        </div>
                        <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 10, background: statusColor.bg, color: statusColor.text, whiteSpace: "nowrap" }}>
                          {b.status || 'pending'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: 24 }}>
              <h2 className="gd-display" style={{ fontSize: 18, fontStyle: "italic", color: T.ink, marginBottom: 16 }}>Quick Actions</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <button onClick={() => setActiveTab('availability')} className="gd-card" style={{ background: "#fff", padding: "20px", borderRadius: 10, border: "1px solid rgba(199,154,62,0.2)", borderLeft: `3px solid ${T.gold}`, textAlign: "center", cursor: "pointer" }}>
                  <span style={{ fontSize: 28 }}>📍</span>
                  <p style={{ fontSize: 14, fontWeight: 500, color: T.ink, margin: "8px 0 0" }}>Set District</p>
                </button>
                <button onClick={() => { setActiveTab('hidden_gems'); setFilterStatus('all'); }} className="gd-card" style={{ background: "#fff", padding: "20px", borderRadius: 10, border: "1px solid rgba(199,154,62,0.2)", borderLeft: `3px solid ${T.gold}`, textAlign: "center", cursor: "pointer" }}>
                  <span style={{ fontSize: 28 }}>💎</span>
                  <p style={{ fontSize: 14, fontWeight: 500, color: T.ink, margin: "8px 0 0" }}>Review Gems</p>
                  {stats.pending > 0 && <span style={{ display: "inline-block", marginTop: 4, padding: "2px 12px", borderRadius: 999, fontSize: 11, background: "#EF4444", color: "#fff" }}>{stats.pending} pending</span>}
                </button>
                <button onClick={() => { setActiveTab('insights'); setFilterStatus('all'); }} className="gd-card" style={{ background: "#fff", padding: "20px", borderRadius: 10, border: "1px solid rgba(199,154,62,0.2)", borderLeft: `3px solid ${T.gold}`, textAlign: "center", cursor: "pointer" }}>
                  <span style={{ fontSize: 28 }}>✨</span>
                  <p style={{ fontSize: 14, fontWeight: 500, color: T.ink, margin: "8px 0 0" }}>Review Insights</p>
                  {stats.insight_suggestions > 0 && <span style={{ display: "inline-block", marginTop: 4, padding: "2px 12px", borderRadius: 999, fontSize: 11, background: "#7C3AED", color: "#fff" }}>{stats.insight_suggestions} total</span>}
                </button>
                <button onClick={() => setActiveTab('bookings')} className="gd-card" style={{ background: "#fff", padding: "20px", borderRadius: 10, border: "1px solid rgba(199,154,62,0.2)", borderLeft: `3px solid ${T.gold}`, textAlign: "center", cursor: "pointer" }}>
                  <span style={{ fontSize: 28 }}>📅</span>
                  <p style={{ fontSize: 14, fontWeight: 500, color: T.ink, margin: "8px 0 0" }}>My Bookings</p>
                  {stats.bookings > 0 && <span style={{ display: "inline-block", marginTop: 4, padding: "2px 12px", borderRadius: 999, fontSize: 11, background: "#3B82F6", color: "#fff" }}>{stats.bookings} bookings</span>}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ========================================== */}
        {/* HIDDEN GEMS TAB */}
        {/* ========================================== */}
        {activeTab === 'hidden_gems' && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", borderBottom: "1px solid rgba(199,154,62,0.2)", paddingBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0B2422", marginRight: "auto" }}>💎 Hidden Gems ({stats.hidden_gems})</h2>
              {[
                { key: 'all', label: 'All', count: stats.hidden_gems, color: '#0E5C53' },
                { key: 'pending', label: 'Pending', count: suggestions.filter(s => s.type === 'hidden_gem' && s.status === 'pending').length, color: '#EAB308' },
                { key: 'in_progress', label: 'In Progress', count: suggestions.filter(s => s.type === 'hidden_gem' && s.status === 'in_progress').length, color: '#3B82F6' },
                { key: 'approved', label: 'Approved', count: suggestions.filter(s => s.type === 'hidden_gem' && s.status === 'approved').length, color: '#22C55E' },
                { key: 'rejected', label: 'Rejected', count: suggestions.filter(s => s.type === 'hidden_gem' && s.status === 'rejected').length, color: '#EF4444' },
                { key: 'implemented', label: 'Implemented', count: suggestions.filter(s => s.type === 'hidden_gem' && s.status === 'implemented').length, color: '#8B5CF6' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className="filter-chip"
                  onClick={() => setFilterStatus(tab.key)}
                  style={{
                    border: filterStatus === tab.key ? `2px solid ${tab.color || '#0E5C53'}` : '1px solid #D1D5DB',
                    background: filterStatus === tab.key ? (tab.color || '#0E5C53') : 'transparent',
                    color: filterStatus === tab.key ? '#fff' : '#5C6E69',
                  }}
                >
                  {tab.label}
                  <span style={{ background: filterStatus === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', padding: '0px 6px', borderRadius: 999, fontSize: 10 }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {filteredSuggestions.filter(s => s.type === 'hidden_gem').length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 8, border: "1px solid rgba(199,154,62,0.2)" }}>
                  <p style={{ color: "#8A9A95", margin: 0 }}>No hidden gems found.</p>
                </div>
              ) : (
                filteredSuggestions.filter(s => s.type === 'hidden_gem').map((suggestion) => {
                  const colors = getStatusColor(suggestion.status);
                  return (
                    <div key={suggestion.id} className="gd-card" style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", border: `1px solid ${colors.bg}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0B2422", margin: 0 }}>💎 {suggestion.name || 'Unnamed Place'}</h3>
                            <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 500, background: colors.bg, color: colors.text }}>
                              {suggestion.status || 'pending'}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: "#5C6E69", margin: "2px 0" }}>📍 {suggestion.location_info || 'No location'}</p>
                          <p style={{ fontSize: 13, color: "#5C6E69", margin: "2px 0" }}>👤 {suggestion.user_email || 'Anonymous'}</p>
                          <p style={{ fontSize: 14, color: "#4A5F5A", margin: "8px 0 0", lineHeight: 1.6 }}>{suggestion.description || 'No description'}</p>
                          {suggestion.admin_notes && (
                            <p style={{ fontSize: 12, color: "#0E5C53", marginTop: 8, background: "#F4FAF8", padding: "8px 12px", borderRadius: 4 }}>
                              📝 Admin: {suggestion.admin_notes}
                            </p>
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 16, minWidth: 110 }}>
                          {suggestion.status === 'pending' && (
                            <>
                              <button onClick={() => handleProcessClick(suggestion, 'approve')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#22C55E", color: "#fff", fontSize: 11, cursor: "pointer" }}>✅ Approve</button>
                              <button onClick={() => handleProcessClick(suggestion, 'in_progress')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#3B82F6", color: "#fff", fontSize: 11, cursor: "pointer" }}>🔄 In Progress</button>
                              <button onClick={() => handleProcessClick(suggestion, 'reject')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#EF4444", color: "#fff", fontSize: 11, cursor: "pointer" }}>❌ Reject</button>
                            </>
                          )}
                          {(suggestion.status === 'approved' || suggestion.status === 'in_progress') && (
                            <>
                              <button onClick={() => handleProcessClick(suggestion, 'implement')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 11, cursor: "pointer" }}>✨ Implement</button>
                              <button onClick={() => handleProcessClick(suggestion, 'reject')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#EF4444", color: "#fff", fontSize: 11, cursor: "pointer" }}>❌ Reject</button>
                            </>
                          )}
                          {suggestion.status === 'rejected' && <span style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>❌ Rejected</span>}
                          {suggestion.status === 'implemented' && (
                            <button onClick={() => handleProcessClick(suggestion, 'remove')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#EF4444", color: "#fff", fontSize: 11, cursor: "pointer" }}>❌ Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* INSIGHTS TAB */}
        {/* ========================================== */}
        {activeTab === 'insights' && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", borderBottom: "1px solid rgba(199,154,62,0.2)", paddingBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0B2422", marginRight: "auto" }}>✨ Insights ({stats.insight_suggestions})</h2>
              {[
                { key: 'all', label: 'All', count: stats.insight_suggestions, color: '#0E5C53' },
                { key: 'pending', label: 'Pending', count: suggestions.filter(s => s.type === 'insight' && s.status === 'pending').length, color: '#EAB308' },
                { key: 'in_progress', label: 'In Progress', count: suggestions.filter(s => s.type === 'insight' && s.status === 'in_progress').length, color: '#3B82F6' },
                { key: 'approved', label: 'Approved', count: suggestions.filter(s => s.type === 'insight' && s.status === 'approved').length, color: '#22C55E' },
                { key: 'rejected', label: 'Rejected', count: suggestions.filter(s => s.type === 'insight' && s.status === 'rejected').length, color: '#EF4444' },
                { key: 'implemented', label: 'Implemented', count: suggestions.filter(s => s.type === 'insight' && s.status === 'implemented').length, color: '#8B5CF6' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className="filter-chip"
                  onClick={() => setFilterStatus(tab.key)}
                  style={{
                    border: filterStatus === tab.key ? `2px solid ${tab.color || '#0E5C53'}` : '1px solid #D1D5DB',
                    background: filterStatus === tab.key ? (tab.color || '#0E5C53') : 'transparent',
                    color: filterStatus === tab.key ? '#fff' : '#5C6E69',
                  }}
                >
                  {tab.label}
                  <span style={{ background: filterStatus === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', padding: '0px 6px', borderRadius: 999, fontSize: 10 }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {filteredSuggestions.filter(s => s.type === 'insight').length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 8, border: "1px solid rgba(199,154,62,0.2)" }}>
                  <p style={{ color: "#8A9A95", margin: 0 }}>No insights found.</p>
                </div>
              ) : (
                filteredSuggestions.filter(s => s.type === 'insight').map((suggestion) => {
                  const colors = getStatusColor(suggestion.status);
                  return (
                    <div key={suggestion.id} className="gd-card" style={{ background: "#fff", borderRadius: 8, padding: "20px 24px", border: `1px solid ${colors.bg}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0B2422", margin: 0 }}>✨ {suggestion.name || 'Unnamed'}</h3>
                            <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 500, background: colors.bg, color: colors.text }}>
                              {suggestion.status || 'pending'}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: "#5C6E69", margin: "2px 0" }}>📍 {suggestion.location_info || 'No location'}</p>
                          <p style={{ fontSize: 13, color: "#5C6E69", margin: "2px 0" }}>👤 {suggestion.user_email || 'Anonymous'}</p>
                          <p style={{ fontSize: 14, color: "#4A5F5A", margin: "8px 0 0", lineHeight: 1.6 }}>{suggestion.description || 'No description'}</p>
                          {suggestion.admin_notes && (
                            <p style={{ fontSize: 12, color: "#0E5C53", marginTop: 8, background: "#F4FAF8", padding: "8px 12px", borderRadius: 4 }}>
                              📝 Admin: {suggestion.admin_notes}
                            </p>
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 16, minWidth: 110 }}>
                          {suggestion.status === 'pending' && (
                            <>
                              <button onClick={() => handleProcessClick(suggestion, 'approve')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#22C55E", color: "#fff", fontSize: 11, cursor: "pointer" }}>✅ Approve</button>
                              <button onClick={() => handleProcessClick(suggestion, 'in_progress')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#3B82F6", color: "#fff", fontSize: 11, cursor: "pointer" }}>🔄 In Progress</button>
                              <button onClick={() => handleProcessClick(suggestion, 'reject')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#EF4444", color: "#fff", fontSize: 11, cursor: "pointer" }}>❌ Reject</button>
                            </>
                          )}
                          {(suggestion.status === 'approved' || suggestion.status === 'in_progress') && (
                            <>
                              <button onClick={() => handleProcessClick(suggestion, 'implement')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 11, cursor: "pointer" }}>✨ Implement</button>
                              <button onClick={() => handleProcessClick(suggestion, 'reject')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#EF4444", color: "#fff", fontSize: 11, cursor: "pointer" }}>❌ Reject</button>
                            </>
                          )}
                          {suggestion.status === 'rejected' && <span style={{ fontSize: 12, color: "#EF4444", textAlign: "center" }}>❌ Rejected</span>}
                          {suggestion.status === 'implemented' && (
                            <button onClick={() => handleProcessClick(suggestion, 'remove')} style={{ padding: "6px 12px", borderRadius: 4, border: "none", background: "#EF4444", color: "#fff", fontSize: 11, cursor: "pointer" }}>❌ Remove</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* AVAILABILITY TAB */}
        {/* ========================================== */}
        {activeTab === 'availability' && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0B2422" }}>🕐 Manage Availability</h2>
              <button onClick={() => setShowAvailabilityForm(!showAvailabilityForm)} style={{ padding: "10px 24px", borderRadius: 999, border: "none", background: "#0E5C53", color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <span>+</span> Add Availability
              </button>
            </div>

            {showAvailabilityForm && (
              <div style={{ background: "#fff", padding: 24, borderRadius: 8, border: "1px solid rgba(199,154,62,0.2)", marginBottom: 20 }}>
                <form onSubmit={handleAddAvailability}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0E5C53", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    Your Guide Profile
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0B2422" }}>Experience (years)</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={availabilityForm.experience_years}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, experience_years: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0B2422" }}>Phone</label>
                      <input
                        type="text"
                        placeholder="+91 98765 43210"
                        value={availabilityForm.phone}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, phone: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13 }}
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0B2422" }}>Specialties (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g., trekking, wildlife, photography"
                        value={availabilityForm.specialties}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, specialties: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13 }}
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0B2422" }}>Bio</label>
                      <textarea
                        rows="2"
                        placeholder="Tell travelers about yourself..."
                        value={availabilityForm.bio}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, bio: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13, resize: "vertical" }}
                      />
                    </div>
                  </div>

                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0E5C53", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    📍 Kerala Districts
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0B2422" }}>Primary District *</label>
                      <select
                        value={availabilityForm.primary_district}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, primary_district: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13 }}
                        required
                      >
                        <option value="">Select district</option>
                        {districts.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0B2422" }}>Additional Districts</label>
                      <select
                        multiple
                        value={availabilityForm.additional_districts}
                        onChange={(e) => {
                          const options = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                          setAvailabilityForm({ ...availabilityForm, additional_districts: options });
                        }}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13, minHeight: 80 }}
                      >
                        {districts
                          .filter(d => d.id !== parseInt(availabilityForm.primary_district))
                          .map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                      </select>
                      <p style={{ fontSize: 11, color: T.muted2, marginTop: 4 }}>Hold Ctrl/Cmd to select multiple</p>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, fontWeight: 600, color: "#0E5C53", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    Availability Slot
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0B2422" }}>Date *</label>
                      <input
                        type="date"
                        required
                        value={availabilityForm.date}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, date: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0B2422" }}>Start Time *</label>
                      <input
                        type="time"
                        required
                        value={availabilityForm.start_time}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, start_time: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0B2422" }}>End Time *</label>
                      <input
                        type="time"
                        required
                        value={availabilityForm.end_time}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, end_time: e.target.value })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0B2422" }}>Max Slots</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={availabilityForm.max_slots}
                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, max_slots: parseInt(e.target.value) || 1 })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13 }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button type="submit" disabled={processing} style={{ padding: "8px 24px", borderRadius: 999, border: "none", background: processing ? "#9CA3AF" : "#0E5C53", color: "#fff", cursor: processing ? "not-allowed" : "pointer" }}>
                      {processing ? 'Saving...' : 'Save Availability'}
                    </button>
                    <button type="button" onClick={() => setShowAvailabilityForm(false)} style={{ padding: "8px 24px", borderRadius: 999, border: "1px solid #D1D5DB", background: "transparent", color: "#5C6E69", cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ background: "#fff", padding: "20px", borderRadius: 8, border: "1px solid rgba(199,154,62,0.15)" }}>
              {availability.length === 0 ? (
                <p style={{ color: "#8A9A95", textAlign: "center", padding: "20px 0" }}>No availability set. Add your available slots above.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                  {availability.map((slot) => (
                    <div key={slot.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #F3F4F6" }}>
                      <div>
                        <span style={{ fontWeight: 500, color: "#0B2422" }}>📅 {slot.date}</span>
                        <span style={{ marginLeft: 16, color: "#5C6E69", fontSize: 13 }}>⏰ {slot.start_time} - {slot.end_time}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ padding: "2px 12px", borderRadius: 999, fontSize: 12, background: slot.is_available !== false ? '#DCFCE7' : '#FEE2E2', color: slot.is_available !== false ? '#16A34A' : '#DC2626' }}>
                          {slot.is_available !== false ? `${slot.max_slots - (slot.booked_slots || 0)} slots left` : 'Booked'}
                        </span>
                        <button
                          onClick={() => handleRemoveAvailability(slot.id)}
                          style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid #EF4444", background: "transparent", color: "#EF4444", fontSize: 11, cursor: "pointer" }}
                        >
                          ❌ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* BOOKINGS TAB */}
        {/* ========================================== */}
        {activeTab === 'bookings' && (
          <div style={{ background: "#fff", padding: "24px", borderRadius: 8, border: "1px solid rgba(199,154,62,0.15)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0B2422", marginBottom: 16 }}>📅 My Bookings ({stats.bookings})</h2>
            {bookings.length === 0 ? (
              <p style={{ color: "#8A9A95", textAlign: "center", padding: "20px 0" }}>No bookings yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                {bookings.map((booking) => {
                  const statusColor = getStatusBadge(booking.status);
                  return (
                    <div key={booking.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #F3F4F6" }}>
                      <div>
                        <p style={{ fontWeight: 500, color: "#0B2422", margin: 0 }}>{booking.destination || 'Kerala Tour'}</p>
                        <p style={{ fontSize: 12, color: "#5C6E69", margin: "4px 0 0" }}>
                          👤 {booking.traveler_email || 'Traveler'} • 📅 {booking.date} • ⏰ {booking.time}
                          {booking.district && <span style={{ marginLeft: 8 }}>📍 {booking.district}</span>}
                        </p>
                      </div>
                      <span style={{
                        padding: "2px 12px",
                        borderRadius: 999,
                        fontSize: 12,
                        background: statusColor.bg,
                        color: statusColor.text
                      }}>
                        {booking.status || 'pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* SETTINGS TAB */}
        {/* ========================================== */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ background: "#fff", padding: "24px", borderRadius: 8, border: "1px solid rgba(199,154,62,0.15)", maxWidth: 600 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0B2422", marginBottom: 24 }}>Profile Settings</h2>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#0B2422", marginBottom: 4 }}>First Name</label>
                <input type="text" value={profile?.first_name || ''} style={{ width: "100%", padding: "10px 14px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13, background: "#F9FAFB" }} readOnly />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#0B2422", marginBottom: 4 }}>Email</label>
                <input type="email" value={profile?.email || ''} style={{ width: "100%", padding: "10px 14px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13, background: "#F9FAFB" }} disabled />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#0B2422", marginBottom: 4 }}>Primary District</label>
                <div style={{ padding: "10px 14px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13, background: "#F9FAFB", color: "#0E5C53" }}>
                  {profile?.primary_district ? getDistrictName(profile.primary_district) : 'Not set'}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#0B2422", marginBottom: 4 }}>Additional Districts</label>
                <div style={{ padding: "10px 14px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13, background: "#F9FAFB", color: "#0E5C53" }}>
                  {profile?.additional_districts?.length > 0 
                    ? profile.additional_districts.map(id => getDistrictName(id)).join(', ')
                    : 'None'}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#0B2422", marginBottom: 4 }}>Experience</label>
                <div style={{ padding: "10px 14px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13, background: "#F9FAFB", color: "#0E5C53" }}>
                  {profile?.experience_years ? `${profile.experience_years} years` : 'Not set'}
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#0B2422", marginBottom: 4 }}>Role</label>
                <div style={{ padding: "10px 14px", borderRadius: 4, border: "1px solid #D1D5DB", fontSize: 13, background: "#F9FAFB", color: "#0E5C53" }}>⭐ Guide</div>
              </div>
              <button onClick={() => setActiveTab('availability')} style={{ padding: "10px 24px", borderRadius: 999, border: "none", background: "#0E5C53", color: "#fff", fontSize: 13, cursor: "pointer" }}>
                Edit Profile in Availability
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* PROCESS MODAL */}
      {/* ========================================== */}
      {showNotesModal && selectedSuggestion && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowNotesModal(false)}>
          <div style={{ background: "#FBF6EA", borderRadius: 12, padding: 32, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(199,154,62,0.3)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 24, color: "#0B2422", margin: 0, fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>
                {actionType === 'approve' ? '✅ Approve' :
                 actionType === 'implement' ? '✨ Implement' :
                 actionType === 'in_progress' ? '🔄 Mark In Progress' :
                 actionType === 'remove' ? '❌ Remove' :
                 '❌ Reject'}
              </h2>
              <button onClick={() => setShowNotesModal(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#5C6E69" }}>×</button>
            </div>
            <p style={{ fontSize: 14, color: "#5C6E69", marginBottom: 4 }}><strong>Place:</strong> {selectedSuggestion.name || 'Unnamed'}</p>
            <p style={{ fontSize: 14, color: "#5C6E69", marginBottom: 16 }}><strong>Location:</strong> {selectedSuggestion.location_info || 'No location'}</p>
            <p style={{ fontSize: 13, color: "#5C6E69", marginBottom: 16 }}>
              <strong>Type:</strong> {selectedSuggestion.type === 'hidden_gem' ? '💎 Hidden Gem' : '✨ Insight'}
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Admin Notes</label>
              <textarea rows="3" placeholder="Add notes about this decision..." style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff", resize: "vertical", fontFamily: "'Inter', sans-serif" }} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleProcessSuggestion} disabled={processing} style={{ flex: 1, padding: "10px 20px", borderRadius: 999, border: "none", background: processing ? "#9CA3AF" : "#0E5C53", color: "#fff", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.6 : 1 }}>
                {processing ? 'Processing...' : 'Confirm'}
              </button>
              <button onClick={() => setShowNotesModal(false)} style={{ flex: 1, padding: "10px 20px", borderRadius: 999, border: "1px solid #D1D5DB", background: "transparent", color: "#5C6E69", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideDashboard;
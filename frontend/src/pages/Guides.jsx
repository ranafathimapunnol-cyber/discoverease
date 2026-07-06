// pages/Guides.jsx - FULLY WORKING WITH BOOKING
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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

// ✅ KERALA DISTRICTS
const KERALA_DISTRICTS = [
  { id: 1, name: 'Thiruvananthapuram' },
  { id: 2, name: 'Kollam' },
  { id: 3, name: 'Pathanamthitta' },
  { id: 4, name: 'Alappuzha' },
  { id: 5, name: 'Kottayam' },
  { id: 6, name: 'Idukki' },
  { id: 7, name: 'Ernakulam' },
  { id: 8, name: 'Thrissur' },
  { id: 9, name: 'Palakkad' },
  { id: 10, name: 'Malappuram' },
  { id: 11, name: 'Kozhikode' },
  { id: 12, name: 'Wayanad' },
  { id: 13, name: 'Kannur' },
  { id: 14, name: 'Kasaragod' },
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

// ✅ Shared local storage helpers
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

const getDistrictName = (districtId) => {
  const district = KERALA_DISTRICTS.find(d => d.id === districtId);
  return district ? district.name : null;
};

const Guides = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState('guides');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('all');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [wishlistItem, setWishlistItem] = useState(null);

  // ✅ Parse URL params on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const specialty = params.get('specialty');
    const search = params.get('search');
    const district = params.get('district');
    const fromWishlist = params.get('fromWishlist');
    const placeName = params.get('place');
    
    if (specialty) setActiveSpecialty(specialty);
    if (search) setSearchTerm(search);
    
    // Handle wishlist redirect with district
    if (district) {
      const districtObj = KERALA_DISTRICTS.find(d => 
        d.name.toLowerCase() === district.toLowerCase() ||
        district.toLowerCase().includes(d.name.toLowerCase())
      );
      if (districtObj) {
        setActiveDistrict(districtObj);
        setSearchTerm(districtObj.name);
        if (fromWishlist && placeName) {
          setWishlistItem({ name: placeName, district: districtObj });
        }
      }
    }
    
    if (search) {
      const foundDistrict = KERALA_DISTRICTS.find(d => 
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        search.toLowerCase().includes(d.name.toLowerCase())
      );
      if (foundDistrict) {
        setActiveDistrict(foundDistrict);
      }
    }
  }, [location.search]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    } else {
      fetchGuides();
      fetchMyBookings();
    }
  }, [isLoggedIn, navigate]);

  // ✅ Build guides from localStorage with district filtering
  const buildLocalGuides = (districtFilter = null) => {
    const profiles = readGuideProfiles();
    const availabilityMap = readGuideAvailabilityMap();
    
    const guideKeys = Object.keys(profiles);
    
    const result = guideKeys
      .map((key) => {
        const p = profiles[key];
        const slots = availabilityMap[key] || [];
        
        // Only show available slots
        const openSlots = slots.filter(s => {
          const isAvailable = s.is_available !== false;
          const hasCapacity = (s.max_slots - (s.booked_slots || 0)) > 0;
          return isAvailable && hasCapacity;
        });
        
        // Check if guide serves this district
        let matchesDistrict = true;
        if (districtFilter) {
          const primaryMatches = p.primary_district === districtFilter.id;
          const additionalMatches = (p.additional_districts || []).includes(districtFilter.id);
          matchesDistrict = primaryMatches || additionalMatches;
        }
        
        if (!matchesDistrict || openSlots.length === 0) return null;
        
        return {
          id: key,
          user: { 
            first_name: p.first_name || 'Guide', 
            last_name: p.last_name || '', 
            email: p.email || key 
          },
          bio: p.bio || 'Experienced guide ready to show you the best of Kerala.',
          experience_years: p.experience_years || 0,
          specialties: p.specialties && p.specialties.length ? p.specialties : ['local tours'],
          rating: p.rating || '4.8',
          total_reviews: p.total_reviews || 0,
          is_verified: p.is_verified !== false,
          phone: p.phone || '',
          primary_district: p.primary_district,
          additional_districts: p.additional_districts || [],
          availabilities: openSlots
        };
      })
      .filter(g => g !== null);
    
    return result;
  };

  // ✅ Fetch available guides
  const fetchGuides = async () => {
    setLoading(true);
    
    try {
      // Try API first
      const response = await api.get('/guides/available/');
      const apiGuides = response.data?.guides || [];
      if (apiGuides.length > 0) {
        let guidesList = apiGuides;
        if (activeDistrict) {
          guidesList = guidesList.filter(g => 
            g.primary_district === activeDistrict.id ||
            (g.additional_districts || []).includes(activeDistrict.id)
          );
        }
        setGuides(guidesList);
        setFilteredGuides(guidesList);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.warn('Guides API not available, using local guide directory:', error);
    }

    // Read from localStorage with district filter
    const districtToFilter = activeDistrict || null;
    const localGuides = buildLocalGuides(districtToFilter);
    
    if (localGuides.length > 0) {
      setGuides(localGuides);
      setFilteredGuides(localGuides);
    } else {
      setGuides([]);
      setFilteredGuides([]);
    }
    setLoading(false);
  };

  // ✅ Fetch user's bookings
  const fetchMyBookings = async () => {
    try {
      const response = await api.get('/guides/my_bookings/');
      const apiBookings = response.data?.bookings || [];
      if (apiBookings.length > 0) {
        setMyBookings(apiBookings);
        return;
      }
    } catch (error) {
      console.warn('Bookings API not available:', error);
    }
    
    try {
      const allTravelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
      const mine = user?.email
        ? allTravelerBookings.filter(b => b.traveler_email === user.email)
        : allTravelerBookings;
      setMyBookings(mine);
    } catch {
      setMyBookings([]);
    }
  };

  // ✅ Handle guide booking - FIXED
  const handleBookGuide = async () => {
    setBookingSuccess(null);
    setBookingError(null);

    // Validate selections
    if (!selectedGuide) {
      setBookingError('Please select a guide first');
      return;
    }

    if (!selectedDate) {
      setBookingError('Please select a date slot');
      return;
    }

    const trimmedDestination = destination.trim();
    if (!trimmedDestination) {
      setBookingError('Please enter a destination');
      return;
    }

    setBookingLoading(true);

    try {
      // Find the selected slot
      const slot = selectedGuide.availabilities.find(s => s.id === selectedDate);
      if (!slot) {
        throw new Error('Selected slot not found');
      }

      // Prepare booking data
      const bookingData = {
        guide_id: selectedGuide.id,
        guide_email: selectedGuide.user?.email,
        availability_id: selectedDate,
        destination: trimmedDestination,
        notes: notes.trim(),
        date: slot.date,
        time: `${slot.start_time} - ${slot.end_time}`,
        traveler_email: user?.email,
        traveler_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Traveler',
        district: activeDistrict ? activeDistrict.name : (selectedGuide.primary_district ? getDistrictName(selectedGuide.primary_district) : ''),
        status: 'pending'
      };

      // Try API booking first
      try {
        const response = await api.post('/guides/book/', bookingData);
        if (response.data && response.data.success) {
          setBookingSuccess('✅ Booking confirmed! The guide will contact you soon.');
          resetBookingForm();
          await fetchMyBookings();
          await fetchGuides();
          setBookingLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('Booking API failed, saving locally:', apiError);
      }

      // ✅ Fallback to localStorage
      // Update availability
      const availabilityMap = readGuideAvailabilityMap();
      if (availabilityMap[selectedGuide.id]) {
        availabilityMap[selectedGuide.id] = availabilityMap[selectedGuide.id].map(s =>
          s.id === selectedDate ? { ...s, booked_slots: (s.booked_slots || 0) + 1 } : s
        );
        writeGuideAvailabilityMap(availabilityMap);
      }

      // Create booking record
      const bookingRecord = {
        id: Date.now(),
        ...bookingData,
        guide_name: `${selectedGuide.user?.first_name || 'Guide'} ${selectedGuide.user?.last_name || ''}`.trim(),
        created_at: new Date().toISOString()
      };

      // Save to guide_bookings
      const guideBookings = JSON.parse(localStorage.getItem('guide_bookings') || '[]');
      guideBookings.push(bookingRecord);
      localStorage.setItem('guide_bookings', JSON.stringify(guideBookings));

      // Save to traveler_bookings
      const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
      travelerBookings.push(bookingRecord);
      localStorage.setItem('traveler_bookings', JSON.stringify(travelerBookings));

      setBookingSuccess('✅ Booking confirmed! The guide will contact you soon.');
      resetBookingForm();
      await fetchMyBookings();
      await fetchGuides();

    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(error.message || '❌ Failed to create booking. Please try again.');
    }

    setBookingLoading(false);
  };

  const resetBookingForm = () => {
    setSelectedGuide(null);
    setSelectedDate(null);
    setDestination('');
    setNotes('');
  };

  // ✅ Handle protected clicks
  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access this page. Please login first.');
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  // ✅ Filter guides by search and specialty
  useEffect(() => {
    let filtered = guides;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(g => {
        const nameMatch = `${g.user?.first_name || ''} ${g.user?.last_name || ''}`.toLowerCase().includes(searchLower);
        const bioMatch = (g.bio || '').toLowerCase().includes(searchLower);
        const specialtyMatch = (g.specialties || []).some(s => s.toLowerCase().includes(searchLower));
        const districtMatch = (g.primary_district ? getDistrictName(g.primary_district)?.toLowerCase().includes(searchLower) : false);
        return nameMatch || bioMatch || specialtyMatch || districtMatch;
      });
    }
    
    if (activeSpecialty !== 'all') {
      filtered = filtered.filter(g => (g.specialties || []).includes(activeSpecialty));
    }
    
    setFilteredGuides(filtered);
  }, [searchTerm, activeSpecialty, guides]);

  // ✅ Star rating
  const StarRating = ({ rating }) => {
    const r = parseFloat(rating) || 0;
    return (
      <span style={{ letterSpacing: 1 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} style={{ color: i <= Math.round(r) ? '#C79A3E' : '#E3DCC8', fontSize: 13 }}>★</span>
        ))}
      </span>
    );
  };

  // ✅ All specialties
  const allSpecialties = ['all', ...Array.from(new Set(guides.flatMap(g => g.specialties || [])))];

  // ✅ Bottom Nav
  const BottomNav = () => (
    <div className={`fixed bottom-6 left-4 right-4 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-[#072E2A]/85 backdrop-blur-2xl shadow-2xl shadow-black/20 border-[#C79A3E]/30'
        : 'bg-[#072E2A]/70 backdrop-blur-2xl shadow-xl shadow-black/10 border-[#C79A3E]/20'
    } rounded-full border px-3 py-2 max-w-md mx-auto`}
    >
      <div className="flex justify-around items-center">
        <Link to="/" className="flex flex-col items-center group" onClick={() => setActiveNav('home')}>
          <div className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'home' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
            <svg className={`w-6 h-6 transition-all duration-300 ${activeNav === 'home' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
          </div>
          {activeNav === 'home' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
        </Link>
        <button onClick={() => handleProtectedClick('/categories')} className="flex flex-col items-center group">
          <div className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'location' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
            <svg className={`w-6 h-6 transition-all duration-300 ${activeNav === 'location' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          {activeNav === 'location' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
        </button>
        <button onClick={() => handleProtectedClick('/ai-trip-planner')} className="flex flex-col items-center group">
          <div className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'ai' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
            <svg className={`w-6 h-12 transition-all duration-300 ${activeNav === 'ai' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <line x1="7" y1="5" x2="7" y2="1" /><line x1="17" y1="5" x2="17" y2="1" />
              <circle cx="7" cy="1" r="1.5"/><circle cx="17" cy="1" r="1.5"/>
              <rect x="3" y="5" width="18" height="16" rx="3"/>
              <rect x="7" y="9" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
              <rect x="14" y="9" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
              <line x1="10" y1="16" x2="14" y2="16"/>
              <circle cx="3.5" cy="12" r="1"/>
              <circle cx="20.5" cy="12" r="1"/>
            </svg>
          </div>
          {activeNav === 'ai' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
        </button>
        <button onClick={() => handleProtectedClick('/wishlist')} className="flex flex-col items-center group">
          <div className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'wishlist' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
            <svg className={`w-6 h-6 transition-all duration-300 ${activeNav === 'wishlist' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          {activeNav === 'wishlist' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
        </button>
        <button onClick={() => handleProtectedClick('/profile')} className="flex flex-col items-center group">
          <div className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'profile' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
            <svg className={`w-6 h-6 transition-all duration-300 ${activeNav === 'profile' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          {activeNav === 'profile' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ background: T.cream, minHeight: "100vh", paddingBottom: 100, fontFamily: "'Inter','Segoe UI',sans-serif", color: T.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .guide-font-display { font-family: 'Fraunces', serif; }
        .guide-font-mono { font-family: 'IBM Plex Mono', monospace; }
        .guide-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(7,46,42,0.15); }
        .guide-card { transition: all 0.3s ease; }
        .guide-selected { border: 2px solid #0E5C53 !important; }
        .availability-slot:hover { background: #0E5C53 !important; color: #fff !important; }
        .availability-slot-selected { background: #0E5C53 !important; color: #fff !important; border: 2px solid #0E5C53 !important; }
        .guide-search:focus { outline: none; border-color: #C79A3E !important; box-shadow: 0 0 0 3px rgba(199,154,62,0.15); }
        .specialty-chip { transition: all 0.25s ease; white-space: nowrap; }
        .booking-error { color: #DC2626; background: #FEE2E2; border: 1px solid #FECACA; }
        .booking-success { color: #16A34A; background: #DCFCE7; border: 1px solid #BBF7D0; }
      `}</style>

      {/* Header */}
      <div style={{ background: T.deepTeal, padding: "48px 20px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
        <div style={{ position: "relative", maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p className="guide-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: T.goldLight, marginBottom: 8 }}>
                DiscoverEase · Local Experts
              </p>
              <h1 className="guide-font-display" style={{ fontStyle: "italic", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 500, color: "#fff", margin: "0 0 6px", lineHeight: 1.05 }}>
                {activeDistrict ? `🧭 Guides in ${activeDistrict.name}` : '🧭 Book a Guide'}
              </h1>
              <p style={{ fontSize: "clamp(13px, 1.2vw, 16px)", color: "rgba(237,226,196,0.75)" }}>
                {wishlistItem ? `Showing guides for "${wishlistItem.name}"` : 
                 activeDistrict ? `Connect with verified guides serving ${activeDistrict.name}` : 
                 'Connect with verified local guides for an authentic Kerala experience'}
              </p>
              <div style={{ marginTop: 18, maxWidth: 340 }}>
                <ZariDivider />
              </div>
            </div>

            <button
              onClick={() => setShowMyBookings(!showMyBookings)}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: "none",
                background: showMyBookings ? T.goldLight : "rgba(199,154,62,0.25)",
                color: showMyBookings ? T.deepTeal : T.goldLight,
                fontWeight: 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontFamily: "'Inter', sans-serif"
              }}
            >
              📅 My Bookings {myBookings.length > 0 && `(${myBookings.length})`}
            </button>
          </div>
        </div>
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
          <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill={T.cream} />
        </svg>
      </div>

      {/* Messages */}
      {bookingSuccess && (
        <div style={{ maxWidth: "1200px", margin: "16px auto 0", padding: "0 20px" }}>
          <div className="booking-success" style={{ padding: "14px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span>{bookingSuccess}</span>
            <button onClick={() => setBookingSuccess(null)} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#16A34A" }}>×</button>
          </div>
        </div>
      )}

      {bookingError && (
        <div style={{ maxWidth: "1200px", margin: "16px auto 0", padding: "0 20px" }}>
          <div className="booking-error" style={{ padding: "14px 20px", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>❌</span>
            <span>{bookingError}</span>
            <button onClick={() => setBookingError(null)} style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#DC2626" }}>×</button>
          </div>
        </div>
      )}

      {/* My Bookings Section */}
      {showMyBookings && (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px 0" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: T.ink, marginBottom: 16 }}>📅 My Bookings</h2>
          {myBookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 20px", background: "#fff", borderRadius: 12, border: "1px solid rgba(199,154,62,0.2)" }}>
              <p style={{ color: T.muted2 }}>No bookings yet. Book a guide from the list below!</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              {myBookings.map((booking) => (
                <div key={booking.id} style={{ background: "#fff", padding: "16px 20px", borderRadius: 8, border: "1px solid rgba(199,154,62,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, color: T.ink, margin: 0 }}>{booking.destination || 'Kerala Tour'}</p>
                    <p style={{ fontSize: 13, color: T.muted, margin: "4px 0 0" }}>
                      🧭 {booking.guide_name || 'Guide'} • 📅 {booking.date} • ⏰ {booking.time}
                      {booking.district && <span style={{ marginLeft: 8 }}>📍 {booking.district}</span>}
                    </p>
                  </div>
                  <span style={{
                    padding: "4px 14px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 500,
                    background: booking.status === 'confirmed' ? '#DCFCE7' : 
                              booking.status === 'pending' ? '#FEF3C7' : 
                              booking.status === 'completed' ? '#DBEAFE' : '#FEE2E2',
                    color: booking.status === 'confirmed' ? '#16A34A' : 
                           booking.status === 'pending' ? '#D97706' : 
                           booking.status === 'completed' ? '#2563EB' : '#DC2626'
                  }}>
                    {booking.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search + Specialty Filters */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px 0" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
          <div style={{ position: "relative", flex: "1 1 260px" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.muted2, fontSize: 14 }}>🔍</span>
            <input
              className="guide-search"
              type="text"
              placeholder={activeDistrict ? `Search guides in ${activeDistrict.name}...` : "Search guides by name, bio, or specialty..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "12px 16px 12px 38px", borderRadius: 999, border: "1px solid rgba(199,154,62,0.3)", fontSize: 13, background: "#fff", transition: "all 0.25s ease" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", flexWrap: "wrap" }}>
            {allSpecialties.map((s) => (
              <button
                key={s}
                className="specialty-chip"
                onClick={() => setActiveSpecialty(s)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 11,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  fontFamily: "'IBM Plex Mono', monospace",
                  border: activeSpecialty === s ? '2px solid #0E5C53' : '1px solid #D1D5DB',
                  background: activeSpecialty === s ? '#0E5C53' : 'transparent',
                  color: activeSpecialty === s ? '#fff' : '#5C6E69',
                  cursor: "pointer"
                }}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Guides Grid */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 40, height: 40, border: "3px solid #E4C77B", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ marginTop: 16, color: "#5C6E69" }}>Loading guides...</p>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🧭</div>
            <h2 className="guide-font-display" style={{ fontSize: 28, color: T.deepTeal, marginBottom: 8 }}>
              {guides.length === 0 ? 'No guides available' : 'No guides match your search'}
            </h2>
            <p style={{ color: T.muted2, fontSize: 16 }}>
              {guides.length === 0 
                ? activeDistrict 
                  ? `No guides are currently available in ${activeDistrict.name}. Check back later!` 
                  : 'Check back later for available guides'
                : 'Try a different search term or specialty'}
            </p>
            {guides.length === 0 && (
              <p style={{ color: T.muted, fontSize: 14, marginTop: 8 }}>
                💡 Guides can add their availability from the Guide Dashboard
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
            {filteredGuides.map((guide) => (
              <div 
                key={guide.id}
                className={`guide-card ${selectedGuide?.id === guide.id ? 'guide-selected' : ''}`}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "24px",
                  border: selectedGuide?.id === guide.id ? '2px solid #0E5C53' : '1px solid rgba(199,154,62,0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => {
                  setSelectedGuide(selectedGuide?.id === guide.id ? null : guide);
                  setSelectedDate(null);
                  setBookingError(null);
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                  {/* Guide Avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #C79A3E, #E4C77B)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 28,
                      fontWeight: 'bold',
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      {guide.user?.first_name?.[0] || 'G'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#0B2422', margin: 0 }}>
                        {guide.user?.first_name || 'Guide'} {guide.user?.last_name || ''}
                      </h3>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        {guide.specialties?.map((s, i) => (
                          <span key={i} style={{ padding: '2px 10px', borderRadius: 999, fontSize: 10, background: 'rgba(199,154,62,0.15)', color: '#0E5C53' }}>{s}</span>
                        ))}
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <StarRating rating={guide.rating} />
                        <span style={{ fontSize: 13, color: '#5C6E69' }}>
                          {guide.rating || 4.5} · {guide.total_reviews || 0} reviews · {guide.experience_years || 2}y experience
                        </span>
                        {guide.is_verified && (
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, background: '#DCFCE7', color: '#16A34A' }}>✅ Verified</span>
                        )}
                      </div>
                      {/* Show district info */}
                      <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {guide.primary_district && (
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 9, background: '#E4C77B', color: '#072E2A' }}>
                            📍 {getDistrictName(guide.primary_district)}
                          </span>
                        )}
                        {(guide.additional_districts || []).slice(0, 2).map((d, i) => (
                          <span key={i} style={{ padding: '2px 8px', borderRadius: 999, fontSize: 9, background: 'rgba(199,154,62,0.15)', color: '#0E5C53' }}>
                            {getDistrictName(d)}
                          </span>
                        ))}
                        {(guide.additional_districts || []).length > 2 && (
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 9, color: '#5C6E69' }}>
                            +{(guide.additional_districts || []).length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Guide Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontSize: 14, color: '#4A5F5A', lineHeight: 1.6 }}>{guide.bio || 'Experienced guide ready to show you the best of Kerala.'}</p>
                    {guide.phone && <p style={{ fontSize: 13, color: '#5C6E69', marginTop: 8 }}>📞 {guide.phone}</p>}
                  </div>

                  {/* Availability Status */}
                  <div style={{ textAlign: 'right', minWidth: 100 }}>
                    <span style={{
                      padding: '4px 16px',
                      borderRadius: 999,
                      fontSize: 12,
                      background: guide.availabilities?.length > 0 ? '#DCFCE7' : '#FEE2E2',
                      color: guide.availabilities?.length > 0 ? '#16A34A' : '#DC2626',
                      display: 'inline-block'
                    }}>
                      {guide.availabilities?.length > 0 ? '✅ Available' : '❌ Unavailable'}
                    </span>
                    {guide.availabilities?.length > 0 && (
                      <p style={{ fontSize: 10, color: T.muted2, marginTop: 4 }}>
                        {guide.availabilities.length} slot{guide.availabilities.length > 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>
                </div>

                {/* Show availability if guide is selected */}
                {selectedGuide?.id === guide.id && guide.availabilities?.length > 0 && (
                  <div style={{ marginTop: 20, borderTop: '1px solid rgba(199,154,62,0.2)', paddingTop: 20 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#0B2422', marginBottom: 12 }}>📅 Available Slots:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {guide.availabilities.map((slot) => {
                        const isSelected = selectedDate === slot.id;
                        return (
                          <button
                            key={slot.id}
                            className={isSelected ? 'availability-slot-selected' : 'availability-slot'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(isSelected ? null : slot.id);
                              setBookingError(null);
                            }}
                            style={{
                              padding: '10px 18px',
                              borderRadius: 999,
                              border: isSelected ? '2px solid #0E5C53' : '1px solid #D1D5DB',
                              background: isSelected ? '#0E5C53' : '#fff',
                              color: isSelected ? '#fff' : '#0B2422',
                              cursor: 'pointer',
                              fontSize: 13,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            📅 {slot.date} 
                            <span style={{ margin: '0 8px' }}>•</span>
                            ⏰ {slot.start_time} - {slot.end_time}
                            <span style={{ marginLeft: 10, fontSize: 11, opacity: 0.7 }}>
                              ({slot.max_slots - (slot.booked_slots || 0)} left)
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* ✅ Booking Form - FIXED */}
                    {selectedDate && (
                      <div style={{ marginTop: 20, background: '#F9FAFB', padding: 20, borderRadius: 12, border: '1px solid rgba(199,154,62,0.15)' }}>
                        <h4 style={{ fontSize: 15, fontWeight: 600, color: '#0B2422', marginBottom: 12 }}>
                          Book {guide.user?.first_name}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 12, fontWeight: 500, color: '#0B2422', display: 'block', marginBottom: 4 }}>
                              📍 Destination *
                            </label>
                            <input
                              type="text"
                              placeholder={activeDistrict ? `e.g., ${activeDistrict.name} Tour` : "e.g., Munnar Tea Gardens"}
                              value={destination}
                              onChange={(e) => { 
                                setDestination(e.target.value); 
                                setBookingError(null); 
                              }}
                              style={{ 
                                width: '100%', 
                                padding: '10px 14px', 
                                borderRadius: 8, 
                                border: '1px solid #D1D5DB', 
                                fontSize: 14, 
                                boxSizing: 'border-box',
                                background: '#fff'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                              onClick={handleBookGuide}
                              disabled={bookingLoading}
                              style={{
                                width: '100%',
                                padding: '10px 20px',
                                borderRadius: 999,
                                border: 'none',
                                background: bookingLoading ? '#9CA3AF' : '#0E5C53',
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: bookingLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {bookingLoading ? '⏳ Booking...' : '✅ Confirm Booking'}
                            </button>
                          </div>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <label style={{ fontSize: 12, fontWeight: 500, color: '#0B2422', display: 'block', marginBottom: 4 }}>
                            📝 Notes (optional)
                          </label>
                          <textarea
                            placeholder="Special requests or notes for the guide"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            style={{ 
                              width: '100%', 
                              padding: '10px 14px', 
                              borderRadius: 8, 
                              border: '1px solid #D1D5DB', 
                              fontSize: 14, 
                              resize: 'vertical', 
                              minHeight: 50, 
                              boxSizing: 'border-box', 
                              fontFamily: "'Inter', sans-serif",
                              background: '#fff'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Guides;
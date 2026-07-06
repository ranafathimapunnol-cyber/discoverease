// pages/CategoryDetail.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { categoryData } from '../data/categoryData';

// All 14 districts
const districts = [
  "All Districts",
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod"
];

const typeFilters = [
  { value: "all", label: "All Places" },
  { value: "hidden", label: "✨ Hidden Gems" },
  { value: "well-known", label: "⭐ Well Known" }
];

export default function CategoryDetail() {
  const { categoryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState('location');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedType, setSelectedType] = useState("all");
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [wishlist, setWishlist] = useState([]);
  
  // ✅ Refs for dropdown click outside detection
  const districtRef = useRef(null);
  const typeRef = useRef(null);

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // ✅ Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (districtRef.current && !districtRef.current.contains(event.target)) {
        setShowDistrictDropdown(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load wishlist from localStorage
  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        setWishlist([]);
      }
    }
  }, []);

  // Save wishlist to localStorage
  const saveWishlist = (newWishlist) => {
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
    setWishlist(newWishlist);
  };

  // Toggle wishlist
  const toggleWishlist = (place, e) => {
    e.stopPropagation();
    const isInWishlist = wishlist.some(item => item.id === place.id);
    let newWishlist;
    if (isInWishlist) {
      newWishlist = wishlist.filter(item => item.id !== place.id);
    } else {
      newWishlist = [...wishlist, { ...place, categoryId }];
    }
    saveWishlist(newWishlist);
  };

  // Check if place is in wishlist
  const isInWishlist = (placeId) => {
    return wishlist.some(item => item.id === placeId);
  };

  // Get district from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const districtParam = params.get('district');
    if (districtParam && districts.includes(districtParam)) {
      setSelectedDistrict(districtParam);
    }
  }, [location.search]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If category doesn't exist, redirect
  if (!categoryData || !categoryData[categoryId]) {
    return (
      <div style={{ background: "#FBF6EA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 48, color: "#072E2A", margin: 0 }}>404</h1>
        <p style={{ color: "#0E5C53", fontSize: 18 }}>Category not found</p>
        <Link to="/categories" style={{ color: "#C79A3E", textDecoration: "none", marginTop: 12 }}>
          ← Back to Categories
        </Link>
      </div>
    );
  }

  const category = categoryData[categoryId];

  // Filter places by district, type, and search
  useEffect(() => {
    if (!category || !category.places) {
      setFilteredPlaces([]);
      return;
    }

    let filtered = [...category.places];
    
    // Filter by district
    if (selectedDistrict !== "All Districts") {
      filtered = filtered.filter(place => 
        place.location && place.location.includes(selectedDistrict)
      );
    }
    
    // Filter by type (hidden/well-known)
    if (selectedType !== "all") {
      filtered = filtered.filter(place => place.type === selectedType);
    }

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(place =>
        (place.name && place.name.toLowerCase().includes(term)) ||
        (place.description && place.description.toLowerCase().includes(term)) ||
        (place.location && place.location.toLowerCase().includes(term)) ||
        (place.hiddenGem && place.hiddenGem.toLowerCase().includes(term))
      );
    }
    
    setFilteredPlaces(filtered);
  }, [selectedDistrict, selectedType, searchTerm, category]);

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setShowDistrictDropdown(false);
    const params = new URLSearchParams(location.search);
    if (district === "All Districts") {
      params.delete('district');
    } else {
      params.set('district', district);
    }
    navigate(`${location.pathname}?${params.toString()}`);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setShowTypeDropdown(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access this page. Please login first.');
      navigate('/login');
    } else {
      navigate(path);
    }
  };

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
    <div style={{ background: "#FBF6EA", minHeight: "100vh", paddingBottom: 100, fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .cd-font-display { font-family: 'Fraunces', serif; }
        .cd-font-mono { font-family: 'IBM Plex Mono', monospace; }
        .cd-place-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(7,46,42,0.15); }
        
        /* ✅ Dropdown Styles - Fixed */
        .dropdown-wrapper {
          position: relative;
          display: inline-block;
          min-width: 160px;
          z-index: 1000;
        }
        
        .dropdown-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 10px 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(199,154,62,0.4);
          border-radius: 999px;
          color: #fff;
          font-size: 13px;
          font-family: 'Inter',sans-serif;
          cursor: pointer;
          gap: 8px;
          white-space: nowrap;
          min-height: 44px;
          transition: all 0.2s ease;
        }
        
        .dropdown-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(199,154,62,0.6);
        }
        
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(7,46,42,0.3);
          max-height: 280px;
          overflow-y: auto;
          z-index: 9999;
          border: 1px solid rgba(199,154,62,0.15);
          min-width: 200px;
          padding: 6px 0;
          animation: dropdownFade 0.2s ease;
        }
        
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .dropdown-menu::-webkit-scrollbar { width: 4px; }
        .dropdown-menu::-webkit-scrollbar-thumb { background: #C79A3E; border-radius: 4px; }
        .dropdown-menu::-webkit-scrollbar-track { background: transparent; }
        
        .dropdown-item {
          padding: 10px 16px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 13px;
          color: #072E2A;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .dropdown-item:last-child { border-bottom: none; }
        .dropdown-item:hover { background: rgba(199,154,62,0.08); }
        .dropdown-item.active {
          background: rgba(199,154,62,0.12);
          color: #C79A3E;
          font-weight: 600;
        }
        .dropdown-item .check { color: #C79A3E; margin-left: 8px; }

        .cd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .cd-place-card { 
          background: #fff; 
          border-radius: 8px; 
          overflow: hidden; 
          border: 1px solid rgba(199,154,62,0.15); 
          transition: all 0.3s ease; 
          cursor: pointer; 
          position: relative;
        }
        
        .search-input {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(199,154,62,0.4);
          border-radius: 999px;
          padding: 10px 16px;
          color: #fff;
          font-size: 13px;
          font-family: 'Inter',sans-serif;
          outline: none;
          min-width: 180px;
          flex: 1;
        }
        .search-input::placeholder {
          color: rgba(255,255,255,0.5);
        }
        .search-input:focus {
          border-color: #E4C77B;
        }

        .wishlist-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(199,154,62,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 5;
          font-size: 18px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }
        .wishlist-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 20px rgba(199,154,62,0.3);
        }
        .wishlist-btn.active {
          background: #C79A3E;
          border-color: #C79A3E;
        }
        .wishlist-btn.active svg {
          fill: #fff;
          stroke: #fff;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
        }

        @media (min-width: 768px) {
          .cd-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 24px !important; }
          .cd-header-row { flex-direction: row !important; align-items: center !important; }
          .filter-group { flex-direction: row !important; flex-wrap: wrap !important; }
          .dropdown-wrapper { min-width: 180px !important; }
        }
        
        @media (max-width: 767px) {
          .content-wrapper { padding: 0 16px; }
          .cd-grid { grid-template-columns: 1fr !important; }
          .cd-header-row { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .filter-group { flex-direction: column !important; gap: 10px !important; }
          .dropdown-wrapper { width: 100% !important; min-width: unset !important; }
          .dropdown-menu { min-width: unset !important; left: 0 !important; right: 0 !important; }
          .dropdown-item { white-space: normal !important; }
          .search-input { min-width: unset !important; }
          .wishlist-btn { width: 32px; height: 32px; font-size: 15px; top: 8px; right: 8px; }
        }
      `}</style>

      {/* ✅ Header - Added position relative with z-index */}
      <div style={{ background: "#072E2A", padding: "48px 0 28px", position: "relative", zIndex: 10 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
        <div className="content-wrapper" style={{ position: "relative", zIndex: 11 }}>
          <div className="cd-header-row" style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <Link to="/categories" style={{ color: "rgba(237,226,196,0.6)", textDecoration: "none", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace", display: "inline-flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Categories
              </Link>
              <h1 className="cd-font-display" style={{ fontStyle: "italic", fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 500, color: "#fff", margin: "12px 0 6px", lineHeight: 1.05 }}>
                {category.title}
              </h1>
              <p style={{ fontSize: "clamp(14px, 1.2vw, 17px)", color: "rgba(237,226,196,0.75)", maxWidth: 600 }}>
                {category.description}
              </p>
            </div>
            
            {/* ✅ Filter Group */}
            <div className="filter-group" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignSelf: "flex-start", marginTop: "12px", flex: 1 }}>
              <input 
                type="text"
                placeholder="🔍 Search places..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />

              {/* ✅ District Dropdown */}
              <div className="dropdown-wrapper" ref={districtRef}>
                <button className="dropdown-btn" onClick={() => { setShowDistrictDropdown(!showDistrictDropdown); setShowTypeDropdown(false); }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📍</span>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100px" }}>
                      {selectedDistrict}
                    </span>
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E4C77B" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {showDistrictDropdown && (
                  <div className="dropdown-menu">
                    {districts.map((district) => (
                      <div key={district} className={`dropdown-item ${selectedDistrict === district ? 'active' : ''}`} onClick={() => handleDistrictSelect(district)}>
                        <span>{district}</span>
                        {selectedDistrict === district && <span className="check">✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ✅ Type Dropdown */}
              <div className="dropdown-wrapper" ref={typeRef}>
                <button className="dropdown-btn" onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowDistrictDropdown(false); }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {selectedType === "all" && "🔍 All"}
                    {selectedType === "hidden" && "✨ Hidden Gems"}
                    {selectedType === "well-known" && "⭐ Well Known"}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E4C77B" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {showTypeDropdown && (
                  <div className="dropdown-menu">
                    {typeFilters.map((filter) => (
                      <div key={filter.value} className={`dropdown-item ${selectedType === filter.value ? 'active' : ''}`} onClick={() => handleTypeSelect(filter.value)}>
                        <span>{filter.label}</span>
                        {selectedType === filter.value && <span className="check">✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ background: "rgba(199,154,62,0.15)", color: "#E4C77B", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              {filteredPlaces.length} places 
              {selectedDistrict !== "All Districts" && ` in ${selectedDistrict}`}
              {selectedType !== "all" && ` (${selectedType === "hidden" ? "✨ Hidden Gems" : "⭐ Well Known"})`}
              {searchTerm.trim() !== '' && ` matching "${searchTerm}"`}
            </span>
          </div>
        </div>
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
          <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
        </svg>
      </div>

      {/* Places Grid */}
      <div className="content-wrapper" style={{ padding: "24px 0", position: "relative", zIndex: 1 }}>
        {filteredPlaces.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p className="cd-font-display" style={{ fontSize: 24, color: "#072E2A", marginBottom: 8 }}>
              No places found
            </p>
            <p style={{ color: "#8A9A95", fontSize: 14 }}>
              {searchTerm.trim() !== '' && `No results matching "${searchTerm}"`}
              {searchTerm.trim() === '' && selectedDistrict !== "All Districts" && selectedType !== "all" 
                ? `No ${selectedType === "hidden" ? "hidden gems" : "well-known places"} in ${selectedDistrict}`
                : selectedDistrict !== "All Districts" 
                ? `No places found in ${selectedDistrict}`
                : selectedType !== "all" 
                ? `No ${selectedType === "hidden" ? "hidden gems" : "well-known places"} found`
                : "No places found"}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                handleDistrictSelect("All Districts");
                handleTypeSelect("all");
              }}
              style={{
                marginTop: 16,
                padding: "10px 24px",
                background: "#C79A3E",
                color: "#fff",
                border: "none",
                borderRadius: 999,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="cd-grid">
            {filteredPlaces.map((place, index) => (
              <div 
                key={place.id || index}
                className="cd-place-card"
                onClick={() => setSelectedPlace(selectedPlace?.id === place.id ? null : place)}
              >
                <button 
                  className={`wishlist-btn ${isInWishlist(place.id) ? 'active' : ''}`}
                  onClick={(e) => toggleWishlist(place, e)}
                  title={isInWishlist(place.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isInWishlist(place.id) ? "#C79A3E" : "none"} stroke="#C79A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>

                <img 
                  src={place.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'} 
                  alt={place.name}
                  style={{ width: "100%", height: 200, objectFit: "cover" }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80';
                  }}
                />
                <div style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 className="cd-font-display" style={{ fontSize: 18, fontWeight: 500, color: "#072E2A", margin: 0 }}>
                        {place.name}
                      </h3>
                      <p style={{ fontSize: 13, color: "#0E5C53", margin: "4px 0 0" }}>
                        📍 {place.location}
                      </p>
                    </div>
                    {place.type && (
                      <span style={{ 
                        background: place.type === 'hidden' ? 'rgba(199,154,62,0.15)' : 'rgba(46,125,50,0.1)',
                        color: place.type === 'hidden' ? '#C79A3E' : '#2E7D32',
                        padding: "2px 10px",
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        fontFamily: "'IBM Plex Mono', monospace",
                        whiteSpace: "nowrap",
                        border: place.type === 'hidden' ? '1px solid rgba(199,154,62,0.3)' : '1px solid rgba(46,125,50,0.2)'
                      }}>
                        {place.type === 'hidden' ? '✨ Hidden' : '⭐ Well Known'}
                      </span>
                    )}
                  </div>
                  
                  <p style={{ fontSize: 14, color: "#3D5A57", lineHeight: 1.6, marginTop: 10 }}>
                    {place.description}
                  </p>

                  {place.difficulty && (
                    <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                      {place.difficulty && (
                        <div>
                          <span style={{ fontSize: 10, color: "#8A9A95", textTransform: "uppercase", letterSpacing: 1 }}>Difficulty</span>
                          <p style={{ fontSize: 13, color: "#072E2A", margin: 0, fontWeight: 500 }}>{place.difficulty}</p>
                        </div>
                      )}
                      {place.duration && (
                        <div>
                          <span style={{ fontSize: 10, color: "#8A9A95", textTransform: "uppercase", letterSpacing: 1 }}>Duration</span>
                          <p style={{ fontSize: 13, color: "#072E2A", margin: 0, fontWeight: 500 }}>{place.duration}</p>
                        </div>
                      )}
                      {place.bestTime && (
                        <div>
                          <span style={{ fontSize: 10, color: "#8A9A95", textTransform: "uppercase", letterSpacing: 1 }}>Best Time</span>
                          <p style={{ fontSize: 13, color: "#072E2A", margin: 0, fontWeight: 500 }}>{place.bestTime}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedPlace?.id === place.id && place.hiddenGem && (
                    <div style={{ 
                      marginTop: 14, 
                      background: "rgba(199,154,62,0.08)", 
                      padding: "12px 16px", 
                      borderRadius: 6,
                      borderLeft: "3px solid #C79A3E"
                    }}>
                      <p style={{ fontSize: 12, color: "#C79A3E", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", margin: "0 0 4px" }}>
                        ✦ Hidden Gem
                      </p>
                      <p style={{ fontSize: 14, color: "#3D5A57", margin: 0, lineHeight: 1.5 }}>
                        {place.hiddenGem}
                      </p>
                    </div>
                  )}

                  {selectedPlace?.id !== place.id && place.hiddenGem && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlace(place);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#C79A3E",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        padding: 0,
                        marginTop: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      Learn more about this hidden gem →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" style={{ zIndex: 0 }} />
    </div>
  );
}
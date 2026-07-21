// pages/Categories.jsx - COMPLETE FIXED VERSION

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthAPI } from '../services/api';

export default function Categories() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('location');
  const [scrolled, setScrolled] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [categoryTypeFilter, setCategoryTypeFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, places: 0, districts: 14 });
  const [error, setError] = useState(null);
  
  const districtRef = useRef(null);
  const categoryRef = useRef(null);
  const dataLoadedRef = useRef(false);

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // ✅ Scroll handler and click outside
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (event) => {
      if (districtRef.current && !districtRef.current.contains(event.target)) {
        setShowDistrictDropdown(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryFilter(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ✅ Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isLoggedIn) {
        console.log('⏳ Waiting for login to fetch categories...');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('📊 Fetching categories...');
        
        const response = await AuthAPI.getCategoryData();
        console.log('📊 Categories loaded:', response);
        
        if (response && response.success && response.data && response.data.length > 0) {
          console.log('✅ Found', response.data.length, 'categories');
          
          const formattedCategories = response.data.map(cat => ({
            key: cat.key,
            label: cat.title || cat.key.charAt(0).toUpperCase() + cat.key.slice(1),
            count: cat.count || 0,
            countLabel: `${cat.count || 0} places`,
            url: cat.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
            description: cat.description || `Explore ${cat.title || cat.key} in Kerala`,
            type: cat.type || 'Nature & Outdoor',
            icon: cat.icon,
            places: cat.places || [],
            districts: (cat.places || [])
              .map(p => p.location || p.district || '')
              .filter(d => d && d.length > 0)
          }));
          
          console.log('✅ Formatted', formattedCategories.length, 'categories');
          
          setCategories(formattedCategories);
          setFilteredCategories(formattedCategories);
          
          const totalPlaces = response.data.reduce((sum, cat) => sum + (cat.count || 0), 0);
          setStats({
            total: response.data.length,
            places: totalPlaces,
            districts: 14
          });
          
          dataLoadedRef.current = true;
          
          try {
            localStorage.setItem('categories_data', JSON.stringify(formattedCategories));
          } catch (e) {}
        } else {
          console.warn('⚠️ No categories data received');
          try {
            const cached = localStorage.getItem('categories_data');
            if (cached) {
              const parsed = JSON.parse(cached);
              console.log('📦 Using cached categories:', parsed.length);
              setCategories(parsed);
              setFilteredCategories(parsed);
              dataLoadedRef.current = true;
            } else {
              setCategories(fallbackCategories);
              setFilteredCategories(fallbackCategories);
            }
          } catch (e) {
            setCategories(fallbackCategories);
            setFilteredCategories(fallbackCategories);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        setError(error.message || 'Failed to load categories');
        
        try {
          const cached = localStorage.getItem('categories_data');
          if (cached) {
            const parsed = JSON.parse(cached);
            console.log('📦 Using cached categories from error fallback:', parsed.length);
            setCategories(parsed);
            setFilteredCategories(parsed);
            dataLoadedRef.current = true;
          } else {
            setCategories(fallbackCategories);
            setFilteredCategories(fallbackCategories);
          }
        } catch (e) {
          setCategories(fallbackCategories);
          setFilteredCategories(fallbackCategories);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [isLoggedIn]);

  const fallbackCategories = [
    { key: "beaches", label: "Beaches", count: 0, countLabel: "0 places", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80", description: "Kerala's stunning coastline", type: "Nature & Outdoor", districts: [] },
    { key: "backwaters", label: "Backwaters", count: 0, countLabel: "0 places", url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80", description: "Serene canals and lagoons", type: "Nature & Outdoor", districts: [] },
    { key: "waterfall", label: "Waterfalls", count: 0, countLabel: "0 places", url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80", description: "Spectacular cascades", type: "Nature & Outdoor", districts: [] },
    { key: "hillstations", label: "Hill Stations", count: 0, countLabel: "0 places", url: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=80", description: "Misty mountains and tea gardens", type: "Nature & Outdoor", districts: [] },
    { key: "wildlife", label: "Wildlife Sanctuaries", count: 0, countLabel: "0 places", url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80", description: "National parks and reserves", type: "Nature & Outdoor", districts: [] },
  ];

  // ✅ Filter categories
  useEffect(() => {
    console.log('🔄 Filtering categories. Total:', categories.length);
    
    let filtered = [...categories];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.label.toLowerCase().includes(term) ||
        cat.key.toLowerCase().includes(term) ||
        (cat.description && cat.description.toLowerCase().includes(term))
      );
    }
    
    if (selectedDistrict !== "All Districts") {
      filtered = filtered.filter(cat => 
        cat.districts && cat.districts.some(d => 
          d.toLowerCase().includes(selectedDistrict.toLowerCase())
        )
      );
    }
    
    if (categoryTypeFilter !== "all") {
      filtered = filtered.filter(cat => cat.type === categoryTypeFilter);
    }
    
    setFilteredCategories(filtered);
  }, [searchTerm, categories, categoryTypeFilter, selectedDistrict]);

  const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());
  
  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setShowDistrictDropdown(false);
  };

  const handleCategoryTypeSelect = (type) => {
    setCategoryTypeFilter(type);
    setShowCategoryFilter(false);
  };

  const handleCategoryClick = (categoryKey) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to view places. Please login first.');
      navigate('/login');
    } else {
      navigate(`/category/${categoryKey}`);
    }
  };

  const goToLocalInsights = () => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access Local Insights. Please login first.');
      navigate('/login');
    } else {
      navigate('/local-insights');
    }
  };

  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required. Please login first.');
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const districts = [
    "All Districts",
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
    "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
    "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
  ];

  const categoryGroups = [
    "Nature & Outdoor",
    "Adventure & Activities",
    "Parks & Recreation",
    "Cultural & Heritage",
    "Wellness & Relaxation"
  ];

  // ✅ BOTTOM NAVIGATION COMPONENT (FIXED)
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

  // ✅ SHOW LOADING
  if (loading) {
    return (
      <div style={{ background: "#FBF6EA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "inline-block", width: 40, height: 40, border: "3px solid #C79A3E", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ marginTop: 12, color: "#5C6E69", fontFamily: "'Inter', sans-serif" }}>Loading categories...</p>
        </div>
      </div>
    );
  }

  // ✅ SHOW ERROR
  if (error) {
    return (
      <div style={{ background: "#FBF6EA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ color: "#072E2A", fontFamily: "'Fraunces', serif" }}>Something went wrong</h2>
          <p style={{ color: "#5C6E69" }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: "10px 24px", background: "#C79A3E", color: "#fff", border: "none", borderRadius: 999, cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ✅ SHOW EMPTY STATE
  if (!loading && (!categories || categories.length === 0)) {
    return (
      <div style={{ background: "#FBF6EA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <h2 style={{ color: "#072E2A", fontFamily: "'Fraunces', serif" }}>No Categories Found</h2>
          <p style={{ color: "#5C6E69" }}>No categories are available right now.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: "10px 24px", background: "#C79A3E", color: "#fff", border: "none", borderRadius: 999, cursor: "pointer" }}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // ✅ RENDER CATEGORIES
  return (
    <div style={{ background: "#FBF6EA", minHeight: "100vh", paddingBottom: 100, fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .cat-font-display { font-family: 'Fraunces', serif; }
        .cat-font-mono { font-family: 'IBM Plex Mono', monospace; }
        .cat-card:hover .cat-card-img { transform: scale(1.08); }
        .dropdown-wrapper { position: relative; display: inline-block; min-width: 160px; z-index: 1000; }
        .dropdown-btn {
          display: flex; align-items: center; justify-content: space-between; width: 100%;
          padding: 10px 16px; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(199,154,62,0.4); border-radius: 999px; color: #fff;
          font-size: 13px; font-family: 'Inter',sans-serif; cursor: pointer; gap: 8px;
          white-space: nowrap; min-height: 44px; transition: all 0.2s ease;
        }
        .dropdown-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(199,154,62,0.6); }
        .dropdown-menu {
          position: absolute; top: calc(100% + 8px); left: 0; right: 0;
          background: #ffffff; border-radius: 12px;
          box-shadow: 0 20px 60px rgba(7,46,42,0.3); max-height: 280px;
          overflow-y: auto; z-index: 9999; border: 1px solid rgba(199,154,62,0.15);
          min-width: 200px; padding: 6px 0; animation: dropdownFade 0.2s ease;
        }
        @keyframes dropdownFade { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .dropdown-menu::-webkit-scrollbar { width: 4px; }
        .dropdown-menu::-webkit-scrollbar-thumb { background: #C79A3E; border-radius: 4px; }
        .dropdown-item {
          padding: 10px 16px; cursor: pointer; transition: all 0.15s ease;
          font-size: 13px; color: #072E2A; border-bottom: 1px solid rgba(0,0,0,0.05);
          display: flex; justify-content: space-between; align-items: center;
        }
        .dropdown-item:last-child { border-bottom: none; }
        .dropdown-item:hover { background: rgba(199,154,62,0.08); }
        .dropdown-item.active { background: rgba(199,154,62,0.12); color: #C79A3E; font-weight: 600; }
        .dropdown-item .check { color: #C79A3E; margin-left: 8px; }
        .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cat-card {
          border-radius: 4px; overflow: hidden; position: relative;
          height: 150px; cursor: pointer; border: 1px solid rgba(199,154,62,0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .cat-card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s ease; }
        .cat-card:hover .cat-card-img { transform: scale(1.08); }
        .cat-card .overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(7,46,42,0.9) 0%, rgba(7,46,42,0.15) 55%, transparent 100%);
        }
        .cat-card .content { position: absolute; bottom: 0; left: 0; right: 0; padding: 10px 12px; }
        .insights-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 20px 10px 18px; border-radius: 999px;
          background: rgba(199,154,62,0.12); border: 1.5px solid rgba(199,154,62,0.4);
          color: #E4C77B; font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 500; cursor: pointer; transition: all 0.3s ease;
          white-space: nowrap;
        }
        .insights-btn:hover { background: rgba(199,154,62,0.2); border-color: #C79A3E; transform: translateY(-2px); box-shadow: 0 8px 30px rgba(199,154,62,0.2); }
        .insights-btn .bulb-icon {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(199,154,62,0.15); transition: all 0.3s ease;
          position: relative;
        }
        .insights-btn .bulb-icon svg { width: 18px; height: 18px; transition: all 0.3s ease; }
        .insights-btn:hover .bulb-icon { background: #C79A3E; box-shadow: 0 0 30px rgba(199,154,62,0.4); }
        .insights-btn:hover .bulb-icon svg { color: #072E2A; }
        .content-wrapper { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        @media (min-width: 768px) {
          .content-wrapper { padding: 0 40px; }
          .cat-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 20px !important; }
          .cat-card { height: 200px !important; }
          .filter-row { flex-direction: row !important; flex-wrap: wrap !important; }
          .dropdown-wrapper { min-width: 180px !important; }
        }
        @media (min-width: 1024px) { .cat-grid { grid-template-columns: repeat(4, 1fr) !important; } .cat-card { height: 220px !important; } }
        @media (max-width: 767px) {
          .cat-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .cat-card { height: 150px !important; }
          .filter-row { flex-direction: column !important; gap: 10px !important; }
          .dropdown-wrapper { width: 100% !important; min-width: unset !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#072E2A", padding: "48px 0 28px", position: "relative", zIndex: 10 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
        <div className="content-wrapper" style={{ position: "relative", zIndex: 11 }}>
          <p className="cat-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", marginBottom: 8 }}>DiscoverEase · Field Guide</p>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 className="cat-font-display" style={{ fontStyle: "italic", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 500, color: "#fff", margin: "0 0 6px", lineHeight: 1.05 }}>
                Categories
              </h1>
              <p style={{ fontSize: "clamp(13px, 1.2vw, 16px)", color: "rgba(237,226,196,0.75)" }}>
                explore Kerala by your interest
              </p>
            </div>
            
            <button onClick={goToLocalInsights} className="insights-btn">
              <span className="bulb-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </span>
              <span className="label-text">Local Insights</span>
              <span className="arrow-icon">→</span>
            </button>
          </div>

          {/* Filters Row */}
          <div className="filter-row" style={{ display: "flex", gap: 12, flexWrap: "wrap", position: "relative", zIndex: 100, marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(199,154,62,0.4)", borderRadius: 999, padding: "11px 16px", gap: 10, flex: 1, minWidth: "180px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E4C77B" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                placeholder="Search categories..." 
                value={searchTerm} 
                onChange={handleSearch} 
                style={{ background: "none", border: "none", outline: "none", color: "#fff", flex: 1, fontSize: 13, fontFamily: "'Inter',sans-serif", width: "100%" }} 
              />
            </div>

            <div className="dropdown-wrapper" ref={districtRef}>
              <button className="dropdown-btn" onClick={() => { setShowDistrictDropdown(!showDistrictDropdown); setShowCategoryFilter(false); }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📍</span>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100px" }}>{selectedDistrict}</span>
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

            <div className="dropdown-wrapper" ref={categoryRef}>
              <button className="dropdown-btn" onClick={() => { setShowCategoryFilter(!showCategoryFilter); setShowDistrictDropdown(false); }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📂</span>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100px" }}>
                    {categoryTypeFilter === "all" ? "All Types" : categoryTypeFilter}
                  </span>
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E4C77B" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {showCategoryFilter && (
                <div className="dropdown-menu">
                  <div className={`dropdown-item ${categoryTypeFilter === 'all' ? 'active' : ''}`} onClick={() => handleCategoryTypeSelect('all')}>
                    <span>All Categories</span>
                    {categoryTypeFilter === 'all' && <span className="check">✓</span>}
                  </div>
                  {categoryGroups.map((group) => (
                    <div key={group} className={`dropdown-item ${categoryTypeFilter === group ? 'active' : ''}`} onClick={() => handleCategoryTypeSelect(group)}>
                      <span>{group}</span>
                      {categoryTypeFilter === group && <span className="check">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "clamp(18px, 3vw, 32px)", marginTop: 22 }}>
            {[
              [filteredCategories.length, "categories"],
              [filteredCategories.reduce((sum, cat) => sum + (cat.count || 0), 0), "places"],
              [stats.districts || "14", "districts"]
            ].map(([n, l], i) => (
              <div key={i}>
                <div className="cat-font-display" style={{ fontSize: "clamp(20px, 2vw, 28px)", color: "#E4C77B" }}>{n}</div>
                <div className="cat-font-mono" style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(237,226,196,0.6)" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
          <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
        </svg>
      </div>

      {/* Category Grid */}
      <div className="content-wrapper" style={{ padding: "20px 0 0", position: "relative", zIndex: 1 }}>
        <p className="cat-font-mono" style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#0E5C53", marginBottom: 12 }}>
          {filteredCategories.length} {filteredCategories.length === 1 ? "category" : "categories"}
          {selectedDistrict !== "All Districts" && ` in ${selectedDistrict}`}
          {categoryTypeFilter !== "all" && ` • ${categoryTypeFilter}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
        <div className="cat-grid">
          {filteredCategories.map((cat) => (
            <div 
              key={cat.key} 
              className="cat-card" 
              onClick={() => handleCategoryClick(cat.key)}
              style={{ cursor: 'pointer' }}
            >
              <img src={cat.url} alt={cat.label} className="cat-card-img" loading="lazy" />
              <div className="overlay" />
              <div className="content">
                <div className="cat-font-display" style={{ fontSize: "clamp(15px, 1.2vw, 18px)", fontWeight: 500, color: "#fff", marginBottom: 2 }}>
                  {cat.label}
                </div>
                <div className="cat-font-mono" style={{ fontSize: 9, letterSpacing: 0.5, color: "rgba(237,226,196,0.7)" }}>
                  {cat.countLabel || `${cat.count || 0} places`}
                </div>
                {cat.type && (
                  <div style={{ fontSize: 8, letterSpacing: 0.5, color: "rgba(237,226,196,0.5)", marginTop: 2, textTransform: "uppercase" }}>
                    {cat.type}
                  </div>
                )}
              </div>
              <div style={{ position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: "50%", border: "1px solid rgba(228,199,123,0.6)", background: "rgba(7,46,42,0.4)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E4C77B" strokeWidth="2.5">
                  <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                </svg>
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "32px 0", color: "#8A9A95" }}>
              <p className="cat-font-mono" style={{ fontSize: 12 }}>No categories match your filters</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDistrict("All Districts");
                  setCategoryTypeFilter("all");
                }}
                style={{ marginTop: 12, padding: "8px 20px", background: "#C79A3E", color: "#fff", border: "none", borderRadius: 999, cursor: "pointer", fontSize: 12 }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" style={{ zIndex: 0 }} />
    </div>
  );
}
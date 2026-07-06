// pages/Categories.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const categories = [
  // ============================================================
  // NATURE & OUTDOOR CATEGORIES
  // ============================================================
  { 
    key: "beaches", 
    label: "Beaches", 
    count: "55+ places", 
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    description: "Kerala's stunning coastline with golden sands and palm-fringed shores"
  },
  { 
    key: "backwaters", 
    label: "Backwaters", 
    count: "30+ places", 
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80",
    description: "Serene canals, lagoons, and houseboat destinations"
  },
  { 
    key: "waterfall", 
    label: "Waterfalls", 
    count: "50+ places", 
    url: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80",
    description: "Spectacular cascades from hidden gems to famous falls"
  },
  { 
    key: "hillstations", 
    label: "Hill Stations & Trekking", 
    count: "35+ places", 
    url: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=80",
    description: "Misty mountains, tea plantations, trekking trails and cool retreats"
  },
  { 
    key: "wildlife", 
    label: "Wildlife Sanctuaries", 
    count: "28+ places", 
    url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80",
    description: "National parks, tiger reserves, butterfly sanctuaries, and bird sanctuaries"
  },
  { 
    key: "walking", 
    label: "Walking Trails", 
    count: "30+ places", 
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
    description: "Scenic trails through forests, hills, and villages"
  },

  // ============================================================
  // ADVENTURE & ACTIVITIES
  // ============================================================
  { 
    key: "junglesafari", 
    label: "Jungle Safaris", 
    count: "18+ places", 
    url: "https://i.pinimg.com/736x/01/4c/c3/014cc3081dbc2870c6e446ee47b7e1ee.jpg",
    description: "Wildlife safaris and forest expeditions"
  },
  { 
    key: "rappelling", 
    label: "Waterfall Rappelling", 
    count: "10+ places", 
    url: "https://i.pinimg.com/736x/ca/f6/42/caf64275a9fa7795370c1c05918315d9.jpg",
    description: "Thrilling waterfall rappelling experiences"
  },
  { 
    key: "mountainbiking", 
    label: "Mountain Biking", 
    count: "12+ places", 
    url: "https://i.pinimg.com/736x/78/a4/45/78a4450bc672b2c03f1eb245684ba76d.jpg",
    description: "Off-road biking through rugged terrain"
  },
  { 
    key: "kayaking", 
    label: "Kayaking & Canoeing", 
    count: "15+ places", 
    url: "https://i.pinimg.com/736x/02/ba/5e/02ba5e17aaa0b6897ee138306d568853.jpg",
    description: "Paddle through hidden backwaters"
  },
  { 
    key: "offroading", 
    label: "Off-Road Jeep Trails", 
    count: "12+ places", 
    url: "https://i.pinimg.com/736x/c2/c4/80/c2c480b17bac2d52359eb24da9122f05.jpg",
    description: "Jeep trails through rugged terrain"
  },
  { 
    key: "camping", 
    label: "Camping Spots", 
    count: "20+ places", 
    url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80",
    description: "Camping spots under starry skies"
  },
  { 
    key: "stargazing", 
    label: "Stargazing Sites", 
    count: "15+ places", 
    url: "https://i.pinimg.com/736x/bd/b3/7f/bdb37fdd324941a4180bde4f727106e9.jpg",
    description: "Pristine night skies away from city lights"
  },

  // ============================================================
  // PARKS & RECREATION
  // ============================================================
  { 
    key: "parks", 
    label: "Adventures & Parks", 
    count: "30+ places", 
    url: "https://i.pinimg.com/736x/19/24/5e/19245e71ff64965f2eff45c13bc2144f.jpg",
    description: "Botanical gardens, eco-parks, and green spaces"
  },
  { 
    key: "zoos", 
    label: "Zoos & Animal Parks", 
    count: "10+ places", 
    url: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80",
    description: "Wildlife parks and zoological gardens"
  },

  // ============================================================
  // CULTURAL & HERITAGE
  // ============================================================
  { 
    key: "heritage", 
    label: "Heritage & Forts", 
    count: "30+ places", 
    url: "https://i.pinimg.com/736x/d0/a5/a5/d0a5a56573a329cb0ac8c75c97f8b2ba.jpg",
    description: "Ancient forts, palaces, and historical sites"
  },
  { 
    key: "sacred", 
    label: "Sacred Places", 
    count: "50+ places", 
    url: "https://i.pinimg.com/736x/53/8a/12/538a12040c1ee7b51bae7d8b0b939f13.jpg",
    description: "Temples, churches, mosques, and spiritual sites"
  },
  { 
    key: "caves", 
    label: "Caves & Spelunking", 
    count: "15+ places", 
    url: "https://i.pinimg.com/1200x/f0/a9/7a/f0a97ace5ad199ac240c62d57011eac8.jpg",
    description: "Ancient caves and rock formations"
  },
  { 
    key: "islands", 
    label: "Islands", 
    count: "15+ places", 
    url: "https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&q=80",
    description: "Hidden islands and backwater escapes"
  },
  { 
    key: "museums", 
    label: "Museums & Art Galleries", 
    count: "20+ places", 
    url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80",
    description: "History, art, and cultural museums"
  },

  // ============================================================
  // WELLNESS & RELAXATION
  // ============================================================
  { 
    key: "houseboats", 
    label: "Houseboats & Cruises", 
    count: "20+ places", 
    url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=600&q=80",
    description: "Luxury houseboat cruises and stays"
  },
  { 
    key: "resorts", 
    label: "Luxury Resorts", 
    count: "35+ places", 
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    description: "Premium resorts with stunning views"
  },
];

// All 14 districts of Kerala
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

// Category to District mapping
const categoryDistrictMap = {
  beaches: [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", 
    "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad", 
    "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
  ],
  backwaters: ["Alappuzha", "Kottayam", "Kollam", "Kasaragod", "Kozhikode", "Ernakulam", "Thiruvananthapuram"],
  waterfall: [
    "Thiruvananthapuram", "Kollam", "Palakkad", "Thrissur", "Malappuram", 
    "Wayanad", "Idukki", "Ernakulam", "Kottayam", "Pathanamthitta", "Kozhikode"
  ],
  hillstations: ["Idukki", "Wayanad", "Palakkad", "Thiruvananthapuram", "Malappuram", "Kasaragod", "Kannur", "Kottayam", "Kozhikode"],
  wildlife: [
    "Kasaragod", "Kannur", "Wayanad", "Kozhikode", "Palakkad", 
    "Thrissur", "Ernakulam", "Idukki", "Kottayam", "Malappuram",
    "Pathanamthitta", "Kollam", "Thiruvananthapuram"
  ],
  walking: ["Wayanad", "Kollam", "Malappuram", "Thrissur", "Ernakulam", "Pathanamthitta", "Idukki", "Kottayam"],
  adventureparks: ["Thiruvananthapuram", "Ernakulam", "Thrissur", "Kozhikode", "Kollam", "Alappuzha", "Kannur"],
  waterparks: ["Thiruvananthapuram", "Ernakulam", "Thrissur", "Kozhikode", "Kollam", "Alappuzha"],
  amusementparks: ["Thiruvananthapuram", "Ernakulam", "Thrissur", "Kozhikode", "Kollam"],
  junglesafari: ["Idukki", "Palakkad", "Pathanamthitta", "Kannur", "Thrissur", "Wayanad"],
  rappelling: ["Wayanad", "Idukki", "Palakkad", "Thrissur", "Kozhikode"],
  mountainbiking: ["Idukki", "Wayanad", "Palakkad", "Thiruvananthapuram"],
  kayaking: ["Alappuzha", "Kollam", "Kasaragod", "Kottayam", "Ernakulam", "Kozhikode"],
  offroading: ["Idukki", "Pathanamthitta", "Wayanad", "Palakkad", "Kannur"],
  camping: ["Wayanad", "Idukki", "Kottayam", "Palakkad", "Thrissur"],
  stargazing: ["Wayanad", "Idukki", "Palakkad", "Kannur", "Kottayam"],
  parks: ["Thiruvananthapuram", "Kollam", "Ernakulam", "Thrissur", "Kozhikode", "Idukki", "Wayanad", "Kannur"],
  ecotourism: ["Kollam", "Thiruvananthapuram", "Idukki", "Palakkad", "Wayanad", "Kannur"],
  butterflyparks: ["Thiruvananthapuram", "Kollam", "Ernakulam", "Thrissur", "Kozhikode"],
  zoos: ["Thiruvananthapuram", "Ernakulam", "Thrissur", "Kozhikode", "Kollam"],
  heritage: ["Thiruvananthapuram", "Kollam", "Palakkad", "Ernakulam", "Kannur", "Kasaragod", "Kozhikode", "Alappuzha"],
  sacred: [
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", 
    "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", 
    "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
  ],
  caves: ["Wayanad", "Kannur", "Kasaragod", "Kollam", "Thiruvananthapuram"],
  islands: ["Kollam", "Thiruvananthapuram", "Alappuzha", "Kasaragod", "Ernakulam", "Kozhikode"],
  museums: ["Thiruvananthapuram", "Ernakulam", "Kozhikode", "Kollam", "Thrissur", "Kannur"],
  houseboats: ["Alappuzha", "Kollam", "Kottayam", "Kasaragod", "Ernakulam", "Kozhikode"],
  resorts: [
    "Thiruvananthapuram", "Kollam", "Alappuzha", "Kottayam", "Idukki", 
    "Ernakulam", "Wayanad", "Kannur", "Kozhikode", "Kasaragod"
  ],
};

// Category type grouping
const categoryGroups = {
  "Nature & Outdoor": ["beaches", "backwaters", "waterfall", "hillstations", "wildlife", "walking"],
  "Adventure & Activities": ["adventureparks", "waterparks", "amusementparks", "junglesafari", "rappelling", "mountainbiking", "kayaking", "offroading", "camping", "stargazing"],
  "Parks & Recreation": ["parks", "ecotourism", "butterflyparks", "zoos"],
  "Cultural & Heritage": ["heritage", "sacred", "caves", "islands", "museums"],
  "Wellness & Relaxation": ["houseboats", "resorts"]
};

export default function Categories() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth(); // ✅ Use AuthContext
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [activeNav, setActiveNav] = useState('location');
  const [scrolled, setScrolled] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [categoryTypeFilter, setCategoryTypeFilter] = useState("all");
  
  const districtRef = useRef(null);
  const categoryRef = useRef(null);

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

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

  useEffect(() => {
    let filtered = categories;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(cat =>
        cat.label.toLowerCase().includes(term) ||
        cat.key.toLowerCase().includes(term) ||
        (cat.description && cat.description.toLowerCase().includes(term))
      );
    }
    
    if (selectedDistrict !== "All Districts") {
      filtered = filtered.filter(cat => {
        const districtsForCategory = categoryDistrictMap[cat.key] || [];
        return districtsForCategory.includes(selectedDistrict);
      });
    }
    
    if (categoryTypeFilter !== "all") {
      filtered = filtered.filter(cat => {
        const keys = categoryGroups[categoryTypeFilter] || [];
        return keys.includes(cat.key);
      });
    }
    
    setFilteredCategories(filtered);
  }, [searchTerm, selectedDistrict, categoryTypeFilter]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    setShowDistrictDropdown(false);
  };

  const handleCategoryTypeSelect = (type) => {
    setCategoryTypeFilter(type);
    setShowCategoryFilter(false);
  };

  // ✅ Handle protected link clicks using AuthContext
  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access this page. Please login first.');
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  // ✅ Handle category click using AuthContext
  const handleCategoryClick = (categoryKey) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to view places. Please login first.');
      navigate('/login');
    } else {
      navigate(`/category/${categoryKey}?district=${encodeURIComponent(selectedDistrict)}`);
    }
  };

  // ✅ Go to Local Insights using AuthContext
  const goToLocalInsights = () => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access Local Insights. Please login first.');
      navigate('/login');
    } else {
      navigate('/local-insights');
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
        .cat-font-display { font-family: 'Fraunces', serif; }
        .cat-font-mono { font-family: 'IBM Plex Mono', monospace; }
        .cat-card:hover .cat-card-img { transform: scale(1.08); }
        
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

        .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        
        .cat-card { 
          border-radius: 4px; 
          overflow: hidden; 
          position: relative; 
          height: 150px; 
          cursor: pointer; 
          border: 1px solid rgba(199,154,62,0.3); 
          transition: transform 0.2s ease, box-shadow 0.2s ease; 
        }
        
        .cat-card-img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          transition: transform 0.6s ease; 
        }
        
        .cat-card:hover .cat-card-img { transform: scale(1.08); }
        
        .cat-card .overlay { 
          position: absolute; 
          inset: 0; 
          background: linear-gradient(to top, rgba(7,46,42,0.9) 0%, rgba(7,46,42,0.15) 55%, transparent 100%); 
        }
        
        .cat-card .content { 
          position: absolute; 
          bottom: 0; 
          left: 0; 
          right: 0; 
          padding: 10px 12px; 
        }

        .insights-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px 10px 18px;
          border-radius: 999px;
          background: rgba(199,154,62,0.12);
          border: 1.5px solid rgba(199,154,62,0.4);
          color: #E4C77B;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          white-space: nowrap;
        }
        .insights-btn:hover {
          background: rgba(199,154,62,0.2);
          border-color: #C79A3E;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(199,154,62,0.2);
        }
        .insights-btn .bulb-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(199,154,62,0.15);
          transition: all 0.3s ease;
          position: relative;
        }
        .insights-btn .bulb-icon svg {
          width: 18px;
          height: 18px;
          transition: all 0.3s ease;
        }
        .insights-btn:hover .bulb-icon {
          background: #C79A3E;
          box-shadow: 0 0 30px rgba(199,154,62,0.4);
        }
        .insights-btn:hover .bulb-icon svg {
          color: #072E2A;
        }
        .insights-btn .bulb-icon::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1.5px solid rgba(199,154,62,0.2);
          animation: pulseGlow 2s ease-in-out infinite;
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        .insights-btn .label-text {
          letter-spacing: 0.3px;
        }
        .insights-btn .arrow-icon {
          opacity: 0.6;
          transition: all 0.3s ease;
          margin-left: 4px;
        }
        .insights-btn:hover .arrow-icon {
          opacity: 1;
          transform: translateX(3px);
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        @media (min-width: 768px) {
          .content-wrapper { padding: 0 40px; }
          .cat-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 20px !important; }
          .cat-card { height: 200px !important; }
          .cat-stats { gap: 32px !important; }
          .filter-row { flex-direction: row !important; flex-wrap: wrap !important; }
          .dropdown-wrapper { min-width: 180px !important; }
          .header-top-row { flex-direction: row !important; align-items: center !important; justify-content: space-between !important; }
        }

        @media (min-width: 1024px) {
          .cat-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .cat-card { height: 220px !important; }
        }

        @media (max-width: 767px) {
          .cat-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .cat-card { height: 150px !important; }
          .filter-row { flex-direction: column !important; gap: 10px !important; }
          .dropdown-wrapper { width: 100% !important; min-width: unset !important; }
          .dropdown-menu { min-width: unset !important; }
          .header-top-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .insights-btn { width: 100% !important; justify-content: center !important; }
          .content-wrapper { padding: 0 16px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#072E2A", padding: "48px 0 28px", position: "relative", zIndex: 10 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
        <div className="content-wrapper" style={{ position: "relative", zIndex: 11 }}>
          <p className="cat-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", marginBottom: 8 }}>DiscoverEase · Field Guide</p>
          
          <div className="header-top-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 className="cat-font-display" style={{ fontStyle: "italic", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 500, color: "#fff", margin: "0 0 6px", lineHeight: 1.05 }}>
                Categories
              </h1>
              <p style={{ fontSize: "clamp(13px, 1.2vw, 16px)", color: "rgba(237,226,196,0.75)" }}>
                explore Kerala by your interest
              </p>
            </div>
            
            <button 
              onClick={goToLocalInsights}
              className="insights-btn"
            >
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
            {/* Search */}
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

            {/* District Filter */}
            <div className="dropdown-wrapper" ref={districtRef}>
              <button className="dropdown-btn" onClick={() => { setShowDistrictDropdown(!showDistrictDropdown); setShowCategoryFilter(false); }}>
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

            {/* Category Type Filter */}
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
                  {Object.keys(categoryGroups).map((group) => (
                    <div key={group} className={`dropdown-item ${categoryTypeFilter === group ? 'active' : ''}`} onClick={() => handleCategoryTypeSelect(group)}>
                      <span>{group}</span>
                      {categoryTypeFilter === group && <span className="check">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="cat-stats" style={{ display: "flex", gap: "clamp(18px, 3vw, 32px)", marginTop: 22 }}>
            {[
              [filteredCategories.length, "categories"],
              ["500+", "places"],
              [selectedDistrict !== "All Districts" ? "1" : "14", "districts"]
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
        </p>
        <div className="cat-grid">
          {filteredCategories.map((cat) => (
            <div 
              key={cat.key} 
              className="cat-card" 
              onClick={() => handleCategoryClick(cat.key)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "20px 8px 24px rgba(7,46,42,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <img src={cat.url} alt={cat.label} className="cat-card-img" />
              <div className="overlay" />
              <div className="content">
                <div className="cat-font-display" style={{ fontSize: "clamp(15px, 1.2vw, 18px)", fontWeight: 500, color: "#fff", marginBottom: 2 }}>{cat.label}</div>
                <div className="cat-font-mono" style={{ fontSize: 9, letterSpacing: 0.5, color: "rgba(237,226,196,0.7)" }}>{cat.count}</div>
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
            </div>
          )}
        </div>
      </div>

      <BottomNav />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" style={{ zIndex: 0 }} />
    </div>
  );
}
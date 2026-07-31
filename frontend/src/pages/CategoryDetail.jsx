// pages/CategoryDetail.jsx - COMPLETE FIXED with correct wishlist messages

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthAPI } from '../services/api';
import api from '../services/api';

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
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [error, setError] = useState(null);
  const [implementedSuggestions, setImplementedSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [toast, setToast] = useState(null);
  
  const districtRef = useRef(null);
  const typeRef = useRef(null);
  const dataLoadedRef = useRef(false);
  const wishlistFetchedRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Handle click outside dropdowns
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

  // Fetch implemented suggestions
  const fetchImplementedSuggestions = async () => {
    if (!isLoggedIn) return;
    
    try {
      const response = await api.get('/suggestions/implemented/', {
        params: { category: categoryId, limit: 100 }
      });
      
      let items = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        items = response.data.data;
      } else if (response.data?.results?.data && Array.isArray(response.data.results.data)) {
        items = response.data.results.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        items = response.data.results;
      }
      
      const allResponse = await api.get('/suggestions/implemented/', {
        params: { limit: 200 }
      });
      
      let allItems = [];
      if (allResponse.data?.data && Array.isArray(allResponse.data.data)) {
        allItems = allResponse.data.data;
      } else if (allResponse.data?.results?.data && Array.isArray(allResponse.data.results.data)) {
        allItems = allResponse.data.results.data;
      } else if (allResponse.data?.results && Array.isArray(allResponse.data.results)) {
        allItems = allResponse.data.results;
      }
      
      const extraItems = allItems.filter(s => {
        const suggestionCategory = (s.category || '').toLowerCase();
        const suggestionDistrict = (s.district || '').toLowerCase();
        const categoryLower = (categoryId || '').toLowerCase();
        return suggestionCategory === categoryLower ||
               suggestionCategory.replace(/_/g, '') === categoryLower.replace(/_/g, '') ||
               suggestionDistrict === categoryLower ||
               suggestionDistrict.replace(/\s+/g, '') === categoryLower.replace(/\s+/g, '');
      });
      
      const allSuggestions = [...items];
      extraItems.forEach(s => {
        if (!allSuggestions.some(existing => existing.id === s.id)) {
          allSuggestions.push(s);
        }
      });
      
      const formattedSuggestions = allSuggestions.map(s => ({
        id: s.id,
        destination_id: s.id,
        name: s.name || s.title || 'Unknown Place',
        location: s.district || s.location_info || '',
        description: s.description || s.review_text || '',
        image: s.image_url || s.primary_image || s.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
        type: s.suggestion_type === 'hidden_gem' ? 'hidden' : 'well-known',
        hiddenGem: s.description || '',
        district: s.district || '',
        rating: s.rating || 0,
        isSuggestion: true,
        suggestion_type: s.suggestion_type,
        implemented_at: s.implemented_at || s.created_at,
        admin_notes: s.admin_notes || '',
        _suggestion_id: s.id
      }));
      
      setImplementedSuggestions(formattedSuggestions);
      
    } catch (error) {
      console.error('Error fetching implemented suggestions:', error);
      setImplementedSuggestions([]);
    }
  };

  // Fetch wishlist
  const fetchWishlist = async () => {
    if (!isLoggedIn) return;
    if (wishlistFetchedRef.current) return;
    
    try {
      const response = await AuthAPI.getWishlist();
      let items = [];
      if (response && response.results) {
        items = response.results.map(item => ({
          id: item.destination_id || item.destination || item.id,
          wishlistId: item.id,
          name: item.destination_name || '',
          location: item.destination_district || '',
          district: item.destination_district || '',
          image: item.destination_image || '',
          category: item.destination_category || '',
          rating: item.destination_rating || 0,
        }));
      }
      setWishlist(items);
      wishlistFetchedRef.current = true;
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlist([]);
    }
  };

  // Get destination ID from place with safe checks
  const getDestinationId = (place) => {
    if (!place) return null;
    if (place.destination_id) return place.destination_id;
    if (place.id) return place.id;
    if (place._id) return place._id;
    if (place._suggestion_id) return place._suggestion_id;
    if (typeof place.id === 'string' && place.id.startsWith('suggestion-')) {
      const extracted = place.id.replace('suggestion-', '');
      if (extracted && !isNaN(extracted)) {
        return parseInt(extracted);
      }
    }
    if (place.originalData) {
      return place.originalData.destination_id || place.originalData.id || place.originalData._id;
    }
    return null;
  };

  // ✅ FIXED: Toggle wishlist with correct messages
  const toggleWishlist = async (place, e) => {
    if (e) e.stopPropagation();
    
    if (!isLoggedIn) {
      setToast({ type: 'error', message: '⚠️ Please login to add to wishlist' });
      navigate('/login');
      return;
    }

    const destinationId = getDestinationId(place);
    
    if (!destinationId) {
      setToast({ type: 'error', message: `"${place?.name || 'Place'}" cannot be added to wishlist` });
      return;
    }
    
    // ✅ Check current state BEFORE toggling
    const currentlyInWishlist = isInWishlist(destinationId);
    
    setWishlistLoading(true);
    try {
      const response = await AuthAPI.toggleWishlist(destinationId);
      
      if (response && response.success) {
        // Force refresh wishlist
        wishlistFetchedRef.current = false;
        await fetchWishlist();
        
        // ✅ Show correct message based on what we just did
        setToast({ 
          type: 'success', 
          message: currentlyInWishlist 
            ? `💔 "${place?.name}" removed from wishlist` 
            : `❤️ "${place?.name}" added to wishlist` 
        });
      } else {
        setToast({ type: 'error', message: response?.message || 'Failed to update wishlist' });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      if (error.response?.status === 401) {
        setToast({ type: 'error', message: '⚠️ Session expired. Please login again.' });
        navigate('/login');
      } else if (error.response?.status === 404) {
        setToast({ type: 'error', message: `"${place?.name}" is no longer available` });
      } else {
        setToast({ type: 'error', message: 'Failed to update wishlist' });
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const isInWishlist = (placeId) => {
    if (!placeId) return false;
    const idStr = String(placeId);
    return wishlist.some(item => {
      const itemId = String(item.id || item.destination || item.destination_id || '');
      return itemId === idStr;
    });
  };

  // Get district from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const districtParam = params.get('district');
    if (districtParam && districts.includes(districtParam)) {
      setSelectedDistrict(districtParam);
    }
  }, [location.search]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch category details
  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!isLoggedIn) return;
      if (dataLoadedRef.current) return;
      
      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);
      
      try {
        const response = await AuthAPI.getCategoryData();
        
        if (response && response.success && response.data && response.data.length > 0) {
          let category = null;
          category = response.data.find(cat => cat.key === categoryId);
          if (!category) {
            category = response.data.find(cat => 
              cat.key && cat.key.toLowerCase() === categoryId.toLowerCase()
            );
          }
          if (!category) {
            category = response.data.find(cat => 
              cat.title && cat.title.toLowerCase().replace(/\s+/g, '') === categoryId.toLowerCase().replace(/\s+/g, '')
            );
          }
          
          if (category) {
            setCategoryInfo({
              title: category.title || categoryId,
              description: category.description || `Explore ${categoryId} in Kerala`
            });
            
            const formattedPlaces = (category.places || []).map(place => ({
              id: place.id || place.destination_id,
              destination_id: place.destination_id || place.id || place._id,
              name: place.name || 'Unknown',
              location: place.location || place.district || '',
              description: place.description || '',
              image: place.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
              type: place.type || 'well-known',
              hiddenGem: place.hidden_gem || '',
              difficulty: place.difficulty || '',
              duration: place.duration || '',
              bestTime: place.best_time || '',
              district: place.district || place.location || '',
              isSuggestion: false,
              rating: place.rating || 0,
              entryFee: place.entry_fee || '',
              timings: place.timings || '',
              originalData: place
            }));
            
            setPlaces(formattedPlaces);
            dataLoadedRef.current = true;
          } else {
            setError(`Category "${categoryId}" not found`);
            setCategoryInfo({ title: categoryId, description: 'Category not found' });
            setPlaces([]);
          }
        } else {
          setError('No data received from server');
        }
      } catch (error) {
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return;
        }
        console.error('Error fetching category:', error);
        setError(error.message || 'Failed to load category');
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    };

    fetchCategoryDetails();
    fetchWishlist();
    fetchImplementedSuggestions();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [categoryId, isLoggedIn]);

  // Combine places and suggestions
  const getAllPlaces = () => {
    const all = [...places];
    if (showSuggestions) {
      implementedSuggestions.forEach(suggestion => {
        const exists = all.some(p => 
          p.name && suggestion.name && 
          p.name.toLowerCase() === suggestion.name.toLowerCase() && 
          p.district === suggestion.district
        );
        if (!exists) {
          all.push(suggestion);
        }
      });
    }
    return all;
  };

  // Filter places with safe checks
  useEffect(() => {
    const allPlaces = getAllPlaces();
    
    if (!allPlaces || allPlaces.length === 0) {
      setFilteredPlaces([]);
      return;
    }

    let filtered = [...allPlaces];
    
    // Filter by district - with safe checks
    if (selectedDistrict !== "All Districts") {
      const searchDistrict = selectedDistrict.toLowerCase();
      filtered = filtered.filter(place => {
        const location = (place?.location || '').toLowerCase();
        const district = (place?.district || '').toLowerCase();
        return location.includes(searchDistrict) || district.includes(searchDistrict);
      });
    }
    
    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(place => place?.type === selectedType);
    }

    // Filter by search
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(place => {
        const name = (place?.name || '').toLowerCase();
        const description = (place?.description || '').toLowerCase();
        const location = (place?.location || '').toLowerCase();
        const hiddenGem = (place?.hiddenGem || '').toLowerCase();
        return name.includes(term) ||
               description.includes(term) ||
               location.includes(term) ||
               hiddenGem.includes(term);
      });
    }
    
    setFilteredPlaces(filtered);
  }, [selectedDistrict, selectedType, searchTerm, places, implementedSuggestions, showSuggestions]);

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
      setToast({ type: 'error', message: '⚠️ Login required.' });
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const openDetailModal = (place) => {
    setSelectedPlace(place);
  };

  const closeDetailModal = () => {
    setSelectedPlace(null);
  };

  // Toast Component
  const Toast = () => {
    if (!toast) return null;
    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[10001] transition-all duration-500">
        <div className={`px-6 py-3 rounded-xl shadow-2xl backdrop-blur-lg flex items-center gap-3 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/90 text-white border border-emerald-400/30' 
            : 'bg-rose-500/90 text-white border border-rose-400/30'
        }`}>
          <span className="text-lg">{toast.type === 'success' ? '✅' : '❌'}</span>
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      </div>
    );
  };

  // Bottom Navigation
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

  // LOADING
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
          <p style={{ marginTop: 12, color: "#5C6E69", fontFamily: "'Inter', sans-serif" }}>Loading places...</p>
        </div>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div style={{ background: "#FBF6EA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "20px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ color: "#072E2A" }}>Error Loading Category</h2>
          <p style={{ color: "#5C6E69" }}>{error}</p>
          <Link to="/categories" style={{ display: "inline-block", marginTop: 16, padding: "10px 24px", background: "#C79A3E", color: "#fff", borderRadius: 999, textDecoration: "none" }}>
            Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  const totalPlaces = filteredPlaces.length;
  const suggestionCount = filteredPlaces.filter(p => p.isSuggestion).length;

  return (
    <div style={{ background: "#FBF6EA", minHeight: "100vh", paddingBottom: 100, fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422" }}>
      <Toast />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .cd-font-display { font-family: 'Fraunces', serif; }
        .cd-font-mono { font-family: 'IBM Plex Mono', monospace; }
        .cd-place-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(7,46,42,0.15); }
        
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
          border-radius: 12px; 
          overflow: hidden; 
          border: 1px solid rgba(199,154,62,0.15); 
          transition: all 0.3s ease; 
          cursor: pointer; 
          position: relative;
        }
        .cd-place-card img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
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
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(199,154,62,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 5;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
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

        .suggestion-badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 9px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: rgba(45,143,110,0.15);
          color: #2D8F6E;
          border: 1px solid rgba(45,143,110,0.2);
          margin-top: 4px;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(7,46,42,0.7);
          backdrop-filter: blur(12px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
          padding: 20px;
          animation: modalFade 0.3s ease;
        }
        @keyframes modalFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-card {
          width: 100%;
          max-width: 750px;
          max-height: 90vh;
          overflow-y: auto;
          background: #FBF6EA;
          border-radius: 20px;
          box-shadow: 0 40px 80px rgba(7,46,42,0.4);
          animation: modalSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalSlide {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-card::-webkit-scrollbar { width: 4px; }
        .modal-card::-webkit-scrollbar-thumb { background: #C79A3E; border-radius: 4px; }
        
        .modal-image {
          width: 100%;
          height: 320px;
          object-fit: cover;
          display: block;
        }
        .modal-body { padding: 28px 32px 32px; }
        .modal-close {
          border: none;
          background: #072E2A;
          color: #fff;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        .modal-close:hover {
          transform: rotate(90deg);
          background: #C79A3E;
        }
        .modal-badge {
          padding: 4px 14px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.03em;
          font-family: 'IBM Plex Mono', monospace;
        }
        .modal-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 16px;
        }
        .modal-info-item {
          background: rgba(199,154,62,0.04);
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid rgba(199,154,62,0.06);
        }
        .modal-info-item label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #8A9A95;
          font-weight: 500;
          display: block;
          margin-bottom: 2px;
        }
        .modal-info-item span {
          font-size: 14px;
          color: #072E2A;
          font-weight: 500;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(199,154,62,0.08);
        }
        .modal-btn {
          padding: 12px 24px;
          border-radius: 999px;
          border: none;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: center;
        }
        .modal-btn-primary {
          background: #C79A3E;
          color: #fff;
        }
        .modal-btn-primary:hover {
          background: #B0842E;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(199,154,62,0.3);
        }
        .modal-btn-secondary {
          background: rgba(199,154,62,0.08);
          color: #C79A3E;
          border: 1px solid rgba(199,154,62,0.12);
        }
        .modal-btn-secondary:hover {
          background: rgba(199,154,62,0.15);
        }

        @media (min-width: 768px) {
          .cd-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 24px !important; }
          .cd-header-row { flex-direction: row !important; align-items: center !important; }
          .filter-group { flex-direction: row !important; flex-wrap: wrap !important; }
          .dropdown-wrapper { min-width: 180px !important; }
        }
        
        @media (max-width: 767px) {
          .content-wrapper { padding: 0 16px; }
          .cd-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .cd-header-row { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
          .filter-group { flex-direction: column !important; gap: 10px !important; }
          .dropdown-wrapper { width: 100% !important; min-width: unset !important; }
          .dropdown-menu { min-width: unset !important; left: 0 !important; right: 0 !important; }
          .dropdown-item { white-space: normal !important; }
          .search-input { min-width: unset !important; }
          .wishlist-btn { width: 34px; height: 34px; top: 10px; right: 10px; }
          
          .modal-image { height: 220px; }
          .modal-body { padding: 20px; }
          .modal-info-grid { grid-template-columns: 1fr; }
          .modal-actions { flex-direction: column; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#072E2A", padding: "48px 0 28px", position: "relative", zIndex: 10 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
        <div className="content-wrapper" style={{ position: "relative", zIndex: 11 }}>
          <div className="cd-header-row" style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <Link 
                to="/categories" 
                style={{ 
                  color: "rgba(237,226,196,0.6)", 
                  textDecoration: "none", 
                  fontSize: 12, 
                  letterSpacing: 1.5, 
                  textTransform: "uppercase", 
                  fontFamily: "'IBM Plex Mono', monospace", 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: 8 
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Categories
              </Link>
              <h1 className="cd-font-display" style={{ fontStyle: "italic", fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 500, color: "#fff", margin: "12px 0 6px", lineHeight: 1.05 }}>
                {categoryInfo?.title || categoryId}
              </h1>
              <p style={{ fontSize: "clamp(14px, 1.2vw, 17px)", color: "rgba(237,226,196,0.75)", maxWidth: 600 }}>
                {categoryInfo?.description || `Explore ${categoryId} in Kerala`}
              </p>
            </div>
            
            <div className="filter-group" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignSelf: "flex-start", marginTop: "12px", flex: 1 }}>
              <input 
                type="text"
                placeholder="🔍 Search places..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />

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
          
          <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ background: "rgba(199,154,62,0.15)", color: "#E4C77B", padding: "4px 14px", borderRadius: 999, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
              {totalPlaces} places 
              {suggestionCount > 0 && ` (${suggestionCount} from suggestions)`}
              {selectedDistrict !== "All Districts" && ` in ${selectedDistrict}`}
              {selectedType !== "all" && ` (${selectedType === "hidden" ? "✨ Hidden Gems" : "⭐ Well Known"})`}
              {searchTerm.trim() !== '' && ` matching "${searchTerm}"`}
            </span>
            
            {implementedSuggestions.length > 0 && (
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                style={{
                  background: showSuggestions ? 'rgba(45,143,110,0.15)' : 'rgba(199,154,62,0.1)',
                  border: showSuggestions ? '1px solid rgba(45,143,110,0.3)' : '1px solid rgba(199,154,62,0.2)',
                  borderRadius: 999,
                  padding: "4px 14px",
                  fontSize: 11,
                  color: showSuggestions ? '#2D8F6E' : '#C79A3E',
                  cursor: 'pointer',
                  fontFamily: "'IBM Plex Mono', monospace",
                  transition: 'all 0.2s ease'
                }}
              >
                {showSuggestions ? '✅ Showing suggestions' : '👁️ Show suggestions'}
              </button>
            )}
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
              {places.length === 0 && implementedSuggestions.length === 0 ? 'No places found for this category' : 'No places match your filters'}
            </p>
            <p style={{ color: "#8A9A95", fontSize: 14 }}>
              {places.length === 0 && implementedSuggestions.length === 0 ? 'Try exploring other categories' : 'Try adjusting your filters'}
            </p>
            {places.length === 0 && implementedSuggestions.length === 0 && (
              <Link to="/categories" style={{ display: "inline-block", marginTop: 16, padding: "10px 24px", background: "#C79A3E", color: "#fff", borderRadius: 999, textDecoration: "none", fontSize: 14 }}>
                Browse Categories →
              </Link>
            )}
            {(places.length > 0 || implementedSuggestions.length > 0) && (
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
            )}
          </div>
        ) : (
          <div className="cd-grid">
            {filteredPlaces.map((place, index) => {
              const placeId = getDestinationId(place);
              const inWishlist = isInWishlist(placeId);
              
              return (
                <div 
                  key={place?.id || placeId || index}
                  className="cd-place-card"
                  onClick={() => openDetailModal(place)}
                >
                  {placeId && (
                    <button 
                      className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
                      onClick={(e) => toggleWishlist(place, e)}
                      disabled={wishlistLoading}
                      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                      style={{
                        opacity: wishlistLoading ? 0.5 : 1,
                        cursor: wishlistLoading ? 'wait' : 'pointer',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={inWishlist ? "#C79A3E" : "none"} stroke="#C79A3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  )}

                  <img 
                    src={place?.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'} 
                    alt={place?.name || 'Place'}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80';
                    }}
                  />
                  <div style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 className="cd-font-display" style={{ fontSize: 18, fontWeight: 500, color: "#072E2A", margin: 0 }}>
                          {place?.name || 'Unknown'}
                        </h3>
                        <p style={{ fontSize: 13, color: "#0E5C53", margin: "4px 0 0" }}>
                          📍 {place?.location || 'Location not specified'}
                        </p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        {place?.type && (
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
                        {place?.isSuggestion && (
                          <span className="suggestion-badge">
                            💡 Suggested
                          </span>
                        )}
                        {place?.rating > 0 && (
                          <span style={{ fontSize: 12, color: '#FF9800' }}>
                            {'★'.repeat(Math.round(place.rating))}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p style={{ 
                      fontSize: 14, 
                      color: "#3D5A57", 
                      lineHeight: 1.6, 
                      marginTop: 10,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {place?.description || place?.hiddenGem || 'A beautiful place to explore in Kerala.'}
                    </p>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(place);
                      }}
                      style={{
                        background: "#C79A3E",
                        color: "#fff",
                        border: "none",
                        borderRadius: 999,
                        padding: "6px 18px",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "'Inter', sans-serif",
                        transition: "all 0.2s ease",
                        marginTop: 10
                      }}
                      onMouseEnter={(e) => e.target.style.background = "#B0842E"}
                      onMouseLeave={(e) => e.target.style.background = "#C79A3E"}
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedPlace && (
        <div 
          className="modal-overlay"
          onClick={closeDetailModal}
        >
          <div 
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedPlace?.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80'} 
              alt={selectedPlace?.name || 'Place'}
              className="modal-image"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80';
              }}
            />

            <div className="modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    {selectedPlace?.type && (
                      <span className="modal-badge" style={{
                        background: selectedPlace.type === 'hidden' ? 'rgba(199,154,62,0.15)' : 'rgba(46,125,50,0.1)',
                        color: selectedPlace.type === 'hidden' ? '#C79A3E' : '#2E7D32',
                        border: selectedPlace.type === 'hidden' ? '1px solid rgba(199,154,62,0.2)' : '1px solid rgba(46,125,50,0.15)'
                      }}>
                        {selectedPlace.type === 'hidden' ? '✨ Hidden Gem' : '⭐ Well Known'}
                      </span>
                    )}
                    {selectedPlace?.isSuggestion && (
                      <span className="modal-badge" style={{
                        background: 'rgba(45,143,110,0.12)',
                        color: '#2D8F6E',
                        border: '1px solid rgba(45,143,110,0.15)'
                      }}>
                        💡 Community Suggestion
                      </span>
                    )}
                    {selectedPlace?.rating > 0 && (
                      <span className="modal-badge" style={{
                        background: 'rgba(255,152,0,0.1)',
                        color: '#FF9800',
                        border: '1px solid rgba(255,152,0,0.15)'
                      }}>
                        {'★'.repeat(Math.round(selectedPlace.rating))} {selectedPlace.rating}
                      </span>
                    )}
                  </div>
                  <h2 className="cd-font-display" style={{ fontSize: 28, fontWeight: 500, color: "#072E2A", margin: "0 0 4px" }}>
                    {selectedPlace?.name || 'Unknown'}
                  </h2>
                  <p style={{ fontSize: 15, color: "#0E5C53", margin: 0 }}>
                    📍 {selectedPlace?.location || 'Location not specified'}
                  </p>
                </div>
                <button 
                  className="modal-close"
                  onClick={closeDetailModal}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: 15, color: "#3D5A57", lineHeight: 1.7, marginTop: 16 }}>
                {selectedPlace?.description || selectedPlace?.hiddenGem || 'A beautiful place to explore in Kerala.'}
              </p>

              {selectedPlace?.hiddenGem && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(199,154,62,0.08)' }}>
                  <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 14, color: "#C79A3E", margin: "0 0 6px" }}>
                    ✦ Hidden Gem Insight
                  </h4>
                  <p style={{ fontSize: 14, color: "#3D5A57", margin: 0, lineHeight: 1.6, background: 'rgba(199,154,62,0.04)', padding: '12px 16px', borderRadius: 10, borderLeft: '3px solid #C79A3E' }}>
                    {selectedPlace.hiddenGem}
                  </p>
                </div>
              )}

              {selectedPlace?.isSuggestion && selectedPlace?.admin_notes && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(199,154,62,0.08)' }}>
                  <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 14, color: "#2D8F6E", margin: "0 0 6px" }}>
                    📝 Implementation Notes
                  </h4>
                  <p style={{ fontSize: 13, color: "#3D5A57", margin: 0, background: 'rgba(45,143,110,0.04)', padding: '10px 14px', borderRadius: 8, borderLeft: '3px solid #2D8F6E' }}>
                    {selectedPlace.admin_notes}
                  </p>
                </div>
              )}

              {(selectedPlace?.difficulty || selectedPlace?.duration || selectedPlace?.bestTime || selectedPlace?.entryFee || selectedPlace?.timings || selectedPlace?.district) && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(199,154,62,0.08)' }}>
                  <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 14, color: "#8A9A95", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                    📋 Details
                  </h4>
                  <div className="modal-info-grid">
                    {selectedPlace?.district && (
                      <div className="modal-info-item">
                        <label>District</label>
                        <span>{selectedPlace.district}</span>
                      </div>
                    )}
                    {selectedPlace?.difficulty && (
                      <div className="modal-info-item">
                        <label>Difficulty</label>
                        <span>{selectedPlace.difficulty}</span>
                      </div>
                    )}
                    {selectedPlace?.duration && (
                      <div className="modal-info-item">
                        <label>Duration</label>
                        <span>{selectedPlace.duration}</span>
                      </div>
                    )}
                    {selectedPlace?.bestTime && (
                      <div className="modal-info-item">
                        <label>Best Time</label>
                        <span>{selectedPlace.bestTime}</span>
                      </div>
                    )}
                    {selectedPlace?.entryFee && (
                      <div className="modal-info-item">
                        <label>Entry Fee</label>
                        <span>{selectedPlace.entryFee}</span>
                      </div>
                    )}
                    {selectedPlace?.timings && (
                      <div className="modal-info-item">
                        <label>Timings</label>
                        <span>{selectedPlace.timings}</span>
                      </div>
                    )}
                    {selectedPlace?.implemented_at && (
                      <div className="modal-info-item">
                        <label>Added</label>
                        <span>{new Date(selectedPlace.implemented_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                {(() => {
                  const modalId = getDestinationId(selectedPlace);
                  const inWishlistModal = isInWishlist(modalId);
                  
                  return modalId ? (
                    <button 
                      className="modal-btn modal-btn-primary"
                      onClick={(e) => toggleWishlist(selectedPlace, e)}
                      disabled={wishlistLoading}
                      style={{ opacity: wishlistLoading ? 0.6 : 1 }}
                    >
                      {inWishlistModal ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          Remove from Wishlist
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          Add to Wishlist
                        </>
                      )}
                    </button>
                  ) : (
                    <div style={{ padding: '10px', color: '#8A9A95', fontSize: 13, textAlign: 'center', flex: 1 }}>
                      ⚠️ Cannot add to wishlist
                    </div>
                  );
                })()}
                <button 
                  className="modal-btn modal-btn-secondary"
                  onClick={closeDetailModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" style={{ zIndex: 0 }} />
    </div>
  );
}
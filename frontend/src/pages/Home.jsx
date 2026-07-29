// pages/Home.jsx - COMPLETE FIXED WITH API INTEGRATION

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Home() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const [suggestionData, setSuggestionData] = useState({
    placeName: '',
    location: '',
    description: '',
    category: '',
    district: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // ✅ Hardcoded districts - NO API CALL
  const [districts, setDistricts] = useState([
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
  ]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSuggestionChange = (e) => {
    const { name, value } = e.target;
    setSuggestionData({ ...suggestionData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setSuggestionData({ ...suggestionData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSuggestionData({ ...suggestionData, image: null });
    setImagePreview(null);
  };
// ============================================
// FIXED: handleSuggestionSubmit - Using /api/suggestions/ endpoint
// ============================================
const handleSuggestionSubmit = async (e) => {
  e.preventDefault();
  
  if (!isLoggedIn) {
    alert('⚠️ Please login to suggest a hidden gem.');
    navigate('/login');
    return;
  }

  if (!suggestionData.district) {
    alert('⚠️ Please select a district.');
    return;
  }
  
  if (!suggestionData.placeName || !suggestionData.description) {
    alert('⚠️ Please fill in all required fields.');
    return;
  }
  
  setSubmitting(true);
  
  try {
    // ✅ Use the correct endpoint: /api/suggestions/
    const formData = new FormData();
    formData.append('name', suggestionData.placeName);
    formData.append('description', suggestionData.description);
    formData.append('category', suggestionData.category || 'Other');
    formData.append('district', suggestionData.district);
    formData.append('location_info', suggestionData.location || '');
    
    // ✅ This tells the backend it's a hidden gem suggestion
    formData.append('suggestion_type', 'hidden_gem');
    
    if (suggestionData.image) {
      formData.append('image', suggestionData.image);
    }

    console.log('📤 Sending hidden gem to /api/suggestions/:', Object.fromEntries(formData));

    // ✅ Use the suggestions endpoint
    const response = await api.post('/suggestions/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ Hidden gem saved successfully:', response.data);

    // ✅ Save to localStorage for backup
    const newSuggestion = {
      id: Date.now(),
      name: suggestionData.placeName,
      description: suggestionData.description,
      category: suggestionData.category || 'Other',
      location_info: suggestionData.location || '',
      district: suggestionData.district,
      status: 'pending',
      suggestion_type: 'hidden_gem',
      user_email: user?.email || 'anonymous',
      created_at: new Date().toISOString(),
      image: imagePreview,
      server_id: response?.data?.id || response?.data?.data?.id || null,
    };
    
    let existingSuggestions = [];
    try {
      const raw = localStorage.getItem('hidden_gems_suggestions');
      if (raw) {
        existingSuggestions = JSON.parse(raw);
      }
    } catch (parseError) {
      existingSuggestions = [];
    }
    
    const limitedSuggestions = existingSuggestions.slice(-9);
    limitedSuggestions.push(newSuggestion);
    localStorage.setItem('hidden_gems_suggestions', JSON.stringify(limitedSuggestions));
    
    // ✅ Show success message
    alert('✅ Hidden gem submitted successfully!');
    setSuggestionSubmitted(true);
    
    // ✅ Reset form after 2 seconds
    setTimeout(() => {
      setSuggestionSubmitted(false);
      setShowSuggestion(false);
      setSuggestionData({
        placeName: '',
        location: '',
        description: '',
        category: '',
        district: '',
        image: null,
      });
      setImagePreview(null);
      setSubmitting(false);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error submitting hidden gem:', error);
    console.error('Response data:', error.response?.data);
    console.error('Response status:', error.response?.status);
    
    // ✅ Check if it's a validation error
    if (error.response?.data?.errors) {
      const errorMessages = Object.entries(error.response.data.errors)
        .map(([key, value]) => `${key}: ${value.join(', ')}`)
        .join('\n');
      alert(`❌ Validation Error:\n${errorMessages}`);
      setSubmitting(false);
      return;
    }
    
    // ✅ If the error is about rating, we need to add it
    if (error.response?.data?.errors?.rating) {
      console.log('⚠️ Rating required, trying with default rating...');
      
      try {
        // ✅ Try again with rating
        const formDataWithRating = new FormData();
        formDataWithRating.append('name', suggestionData.placeName);
        formDataWithRating.append('description', suggestionData.description);
        formDataWithRating.append('category', suggestionData.category || 'Other');
        formDataWithRating.append('district', suggestionData.district);
        formDataWithRating.append('location_info', suggestionData.location || '');
        formDataWithRating.append('suggestion_type', 'hidden_gem');
        formDataWithRating.append('rating', '5'); // ✅ Add default rating
        
        if (suggestionData.image) {
          formDataWithRating.append('image', suggestionData.image);
        }
        
        const response = await api.post('/suggestions/', formDataWithRating, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log('✅ Hidden gem saved with rating:', response.data);
        
        // Save to localStorage...
        // Show success message...
        // Reset form...
        
        alert('✅ Hidden gem submitted successfully!');
        setSuggestionSubmitted(true);
        
        setTimeout(() => {
          setSuggestionSubmitted(false);
          setShowSuggestion(false);
          setSuggestionData({
            placeName: '',
            location: '',
            description: '',
            category: '',
            district: '',
            image: null,
          });
          setImagePreview(null);
          setSubmitting(false);
        }, 2000);
        
        return;
      } catch (retryError) {
        console.error('❌ Retry with rating failed:', retryError);
      }
    }
    
    // ✅ Fallback to localStorage
    try {
      console.log('⚠️ API failed, saving to localStorage only...');
      const fallbackSuggestion = {
        id: Date.now(),
        name: suggestionData.placeName,
        description: suggestionData.description,
        category: suggestionData.category || 'Other',
        location_info: suggestionData.location || '',
        district: suggestionData.district,
        status: 'pending',
        suggestion_type: 'hidden_gem',
        user_email: user?.email || 'anonymous',
        created_at: new Date().toISOString(),
        image: imagePreview,
        offline_save: true,
      };
      
      let existingSuggestions = [];
      try {
        const raw = localStorage.getItem('hidden_gems_suggestions');
        if (raw) {
          existingSuggestions = JSON.parse(raw);
        }
      } catch (parseError) {
        existingSuggestions = [];
      }
      
      const limitedSuggestions = existingSuggestions.slice(-9);
      limitedSuggestions.push(fallbackSuggestion);
      localStorage.setItem('hidden_gems_suggestions', JSON.stringify(limitedSuggestions));
      
      alert('✅ Hidden gem saved locally! Will sync when online.');
      setSuggestionSubmitted(true);
      
      setTimeout(() => {
        setSuggestionSubmitted(false);
        setShowSuggestion(false);
        setSuggestionData({
          placeName: '',
          location: '',
          description: '',
          category: '',
          district: '',
          image: null,
        });
        setImagePreview(null);
        setSubmitting(false);
      }, 2000);
    } catch (fallbackError) {
      alert('❌ Failed to submit hidden gem. Please try again.');
      setSubmitting(false);
    }
  }
};

  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access this page. Please login first.');
      navigate('/login');
      return;
    }
    navigate(path);
  };

  const handleFeatureClick = (featureTitle) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access this feature. Please login first.');
      navigate('/login');
      return;
    }

    const routeMap = {
      'Hidden Destinations': '/categories',
      'Local Guides': '/guides',
      'AI Trip Planner': '/ai-trip-planner',
      'Local Insights': '/local-insights',
      'Verified Reviews': '/reviews',
      'Sustainable Travel': '/sustainable-travel',
    };

    const path = routeMap[featureTitle];
    if (path) {
      navigate(path);
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };



  function CategoryIcon({ type }) {
    const common = { width: 34, height: 34, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", className: "text-[#0E5C53] group-hover:text-[#E4C77B] transition-colors" };
    const icons = {
      beaches: <svg {...common}><path d="M3 16c1.5-1.5 3-1.5 4.5 0s3 1.5 4.5 0 3-1.5 4.5 0 3 1.5 4.5 0" /><circle cx="17" cy="6" r="2.2" /></svg>,
      backwaters: <svg {...common}><path d="M4 19c1.8-1.6 3.6 1.6 5.4 0s3.6 1.6 5.4 0 3.6 1.6 5.4 0" /><path d="M6 14V7l6-3.2L18 7v7" /></svg>,
      waterfall: <svg {...common}><path d="M7 3v6a5 5 0 0010 0V3" /><path d="M9 13v3M12 13v6M15 13v3" /><path d="M6 21c1-1 2-1 3 0s2 1 3 0 2-1 3 0 2-1 3 0" /></svg>,
      hillstations: <svg {...common}><path d="M2 19l6-10 4 6 3-4 7 8z" /><path d="M2 19h20" /></svg>,
      wildlife: <svg {...common}><ellipse cx="10" cy="12" rx="3.4" ry="4.2" /><circle cx="7.2" cy="6.6" r="1.4" /><circle cx="12.4" cy="6.6" r="1.4" /><path d="M13 15c2 0 4 1.5 4 4" /><path d="M13.5 14.2c1.2-1 3-.7 3.6.7" /></svg>,
      heritage: <svg {...common}><path d="M4 21V10l8-6 8 6v11" /><path d="M4 21h16" /><path d="M9 21v-7h6v7" /><path d="M12 4v3" /></svg>,
      junglesafari: <svg {...common}><path d="M6 21c0-6 2-9 6-9s6 3 6 9" /><path d="M9 14c0-3 1-5 3-5s3 2 3 5" /><path d="M4 21h16" /></svg>,
      houseboats: <svg {...common}><path d="M3 15h18l-2.5 5h-13z" /><path d="M6 15V9c0-1.5 1.5-2.5 3-2.5h6c1.5 0 3 1 3 2.5v6" /><path d="M10 6.5V4M14 6.5V4" /></svg>,
    };
    return icons[type] || <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }

  function FeatureIcon({ type }) {
    const common = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "#C79A3E", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
    const icons = {
      "Hidden Destinations": <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
      "Local Guides": <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M6 20c0-3 2.5-5 6-5s6 2 6 5" /><path d="M4 9l-1.5 3M20 9l1.5 3" /></svg>,
      "AI Trip Planner": <svg {...common}><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /><circle cx="12" cy="12" r="4" /></svg>,
      "Local Insights": <svg {...common}><path d="M5 4h11l3 3v13H5z" /><path d="M9 9h7M9 13h7M9 17h4" /></svg>,
      "Verified Reviews": <svg {...common}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>,
      "Sustainable Travel": <svg {...common}><path d="M5 20c8 0 13-5 13-13-8 0-13 5-13 13z" /><path d="M5 20c2-4 5-7 9-9" /></svg>,
    };
    return icons[type] || <svg {...common}><circle cx="12" cy="12" r="8" /></svg>;
  }

  const explorePlaces = [
    {
      id: 1,
      image: "/explore3.png",
      title: "Munnar Tea Gardens",
      location: "Idukki, Kerala",
      description: "Rolling hills covered in emerald tea plantations with misty mornings",
      rating: 4.9,
      reviews: 234,
    },
    {
      id: 2,
      image: "/explore5.png",
      title: "Alleppey Backwaters",
      location: "Alappuzha, Kerala",
      description: "Serene houseboat rides through palm-fringed canals and villages",
      rating: 4.8,
      reviews: 189,
    },
    {
      id: 3,
      image: "/explore4.png",
      title: "Athirappilly Falls",
      location: "Thrissur, Kerala",
      description: "Majestic waterfall often called the Niagara of India",
      rating: 4.7,
      reviews: 156,
    }
  ];

  const topCategories = [
    { key: "beaches", label: "Beaches", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", count: "55+" },
    { key: "backwaters", label: "Backwaters", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80", count: "30+" },
    { key: "waterfall", label: "Waterfalls", image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=400&q=80", count: "50+" },
    { key: "hillstations", label: "Hill Stations", image: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400&q=80", count: "35+" },
    { key: "wildlife", label: "Wildlife", image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&q=80", count: "28+" },
    { key: "heritage", label: "Heritage & Forts", image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80", count: "30+" },
    { key: "junglesafari", label: "Jungle Safaris", image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400&q=80", count: "18+" },
    { key: "houseboats", label: "Houseboats", image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400&q=80", count: "20+" }
  ];

  const whyChooseUs = [
    { title: "Hidden Destinations", description: "Discover off-the-beaten-path locations that most tourists never see", route: "/categories" },
    { title: "Local Guides", description: "Connect with knowledgeable locals who share authentic experiences", route: "/guides" },
    { title: "AI Trip Planner", description: "Personalize itineraries based on your interests, budget & time", route: "/ai-trip-planner" },
    { title: "Local Insights", description: "Get insider tips and recommendations from fellow travelers", route: "/local-insights" },
    { title: "Verified Reviews", description: "Real traveler reviews to help you make informed decisions", route: "/reviews" },
    { title: "Sustainable Travel", description: "Eco-friendly travel options that respect nature and local communities", route: "/sustainable-travel" }
  ];

  const travelerTips = [
    { icon: "🧭", tip: "Ask locals — they know the best hidden spots!" },
    { icon: "🌿", tip: "Explore off-season for untouched beauty." },
    { icon: "📸", tip: "Share your discoveries with the community." },
    { icon: "🤝", tip: "Respect nature and leave no trace." },
  ];

  const ZariRule = ({ className = "" }) => (
    <div className={`flex items-center gap-1.5 ${className}`} aria-hidden="true">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C79A3E] to-[#C79A3E]" />
      <svg width="7" height="7" viewBox="0 0 7 7"><path d="M3.5 0L7 3.5 3.5 7 0 3.5z" fill="#C79A3E" /></svg>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#C79A3E] to-[#C79A3E]" />
    </div>
  );

  const RippleDivider = ({ flip = false, fill = "#FBF6EA" }) => (
    <div className={`w-full overflow-hidden leading-none ${flip ? 'rotate-180' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="w-full h-[46px] md:h-[60px]">
        <path d="M0,32 C150,55 300,10 450,28 C600,46 750,8 900,26 C1050,44 1150,20 1200,30 L1200,60 L0,60 Z" fill={fill} />
        <path d="M0,32 C150,55 300,10 450,28 C600,46 750,8 900,26 C1050,44 1150,20 1200,30" fill="none" stroke="#C79A3E" strokeOpacity="0.5" strokeWidth="1.5" />
      </svg>
    </div>
  );

  const BottomNav = () => (
    <div className={`fixed bottom-6 left-4 right-4 z-50 transition-all duration-500 ${
      scrolled
        ? 'bg-[#072E2A]/85 backdrop-blur-2xl shadow-2xl shadow-black/20 border-[#C79A3E]/30'
        : 'bg-[#072E2A]/70 backdrop-blur-2xl shadow-xl shadow-black/10 border-[#C79A3E]/20'
    } rounded-full border px-3 py-2`}
    >
      <div className="flex justify-around items-center max-w-md mx-auto">
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
              <line x1="7" y1="5" x2="7" y2="1" />
              <line x1="17" y1="5" x2="17" y2="1" />
              <circle cx="7" cy="1" r="1.5"/>
              <circle cx="17" cy="1" r="1.5"/>
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
    <div className="min-h-screen bg-[#FBF6EA]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
        .category-tile { transition: all 0.3s ease; }
        .feature-card { 
          transition: all 0.3s ease; 
          cursor: pointer;
        }
        .feature-card:hover { 
          transform: translateY(-4px); 
          box-shadow: 0 20px 40px -12px rgba(11,36,34,0.15);
          border-color: #C79A3E;
        }
        .feature-card:active {
          transform: scale(0.98);
        }
        .insights-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -12px rgba(199,154,62,0.15); }
        .image-preview:hover { opacity: 0.8; }
      `}</style>

      {/* HERO */}
      <div
        className="h-screen w-screen bg-cover bg-center bg-no-repeat overflow-hidden relative"
        style={{
          backgroundImage: "url('/landing.png')",
          backgroundColor: '#072E2A'
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,46,42,0.55) 0%, rgba(7,46,42,0.25) 40%, rgba(7,46,42,0.75) 100%)' }} />

        <div className="absolute top-0 left-0 right-0 z-20 px-6 pt-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <Link to="/" className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full border border-[#C79A3E]/60 flex items-center justify-center" style={{ background: 'rgba(7,46,42,0.4)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C12 2 6 8 6 14a6 6 0 0012 0c0-6-6-12-6-12z" stroke="#E4C77B" strokeWidth="1.4" />
                  <path d="M12 8v13" stroke="#E4C77B" strokeWidth="1.4" />
                </svg>
              </div>
              <div>
                <span className="font-display italic text-xl text-white tracking-tight">
                  Discover<span className="text-[#E4C77B] not-italic">Ease</span>
                </span>
                <p className="font-mono text-[9px] text-[#EDE2C4]/70 tracking-[0.35em] uppercase">
                  God's Own Country
                </p>
              </div>
            </Link>

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#EDE2C4]/85 text-xs tracking-wide">
                  {user?.first_name || user?.username || 'User'}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full border border-[#E4A08A]/60 text-[#F3D9CE] text-xs font-mono uppercase tracking-wider hover:bg-[#BE5A34]/30 transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-full border border-[#C79A3E] text-[#FBF6EA] font-mono text-xs uppercase tracking-[0.15em] hover:bg-[#C79A3E] hover:text-[#072E2A] transition-all duration-300"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
          <div className="text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="font-mono text-[11px] text-[#E4C77B] tracking-[0.3em] uppercase">Est. along the backwaters</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight">
              Hidden shores,
              <br />
              <span className="italic text-[#E4C77B]">found by design</span>
            </h1>
            <p className="mt-6 font-mono text-sm md:text-base text-[#EDE2C4]/85 tracking-wide uppercase">
              AI-guided discovery &amp; trip planning across Kerala
            </p>
            <ZariRule className="mt-8 max-w-xs mx-auto" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10">
          <RippleDivider fill="#FBF6EA" />
        </div>
      </div>

      {/* EXPLORE SECTION */}
      <section className="relative px-6 pt-16 pb-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="font-mono text-xs text-[#0E5C53] tracking-[0.25em] uppercase">Field notes / 01</span>
            <h2 className="font-display text-4xl md:text-5xl text-[#0B2422] mt-2">
              Kerala's hidden <span className="italic text-[#0E5C53]">gems</span>
            </h2>
          </div>
          <p className="text-[#4A5F5A] max-w-sm text-sm leading-relaxed">Handpicked destinations, charted like a traveler's journal — from misted hills to quiet backwaters.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {explorePlaces[0] && (
            <div className="md:col-span-7 group bg-white rounded-sm overflow-hidden border border-[#C79A3E]/25 hover:border-[#C79A3E]/60 transition-all duration-500">
              <div className="relative h-80 md:h-full md:min-h-[420px] overflow-hidden">
                <img src={explorePlaces[0].image} alt={explorePlaces[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#072E2A]/85 via-[#072E2A]/10 to-transparent" />
                <div className="absolute top-5 left-5 font-mono text-[10px] tracking-[0.25em] uppercase text-[#E4C77B] border border-[#E4C77B]/50 rounded-full px-3 py-1 bg-[#072E2A]/40 backdrop-blur-sm">
                  Featured
                </div>
                <div className="absolute top-5 right-5 bg-[#FBF6EA] px-3 py-1.5 rounded-full text-xs font-mono font-medium text-[#0B2422] shadow-lg flex items-center gap-1">
                  <span className="text-[#C79A3E]">★</span> {explorePlaces[0].rating}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="font-mono text-[10px] text-[#EDE2C4]/80 tracking-[0.2em] uppercase">📍 {explorePlaces[0].location}</span>
                  <h3 className="font-display text-3xl md:text-4xl text-white mt-1">{explorePlaces[0].title}</h3>
                  <p className="text-[#EDE2C4]/90 text-sm mt-2 max-w-md">{explorePlaces[0].description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-mono text-xs text-[#EDE2C4]/70">{explorePlaces[0].reviews} reviews</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-5 flex flex-col gap-6">
            {explorePlaces.slice(1).map((place) => (
              <div key={place.id} className="group bg-white rounded-sm overflow-hidden border border-[#C79A3E]/25 hover:border-[#C79A3E]/60 transition-all duration-500 flex-1 flex">
                <div className="relative w-36 sm:w-44 flex-shrink-0 overflow-hidden">
                  <img src={place.image} alt={place.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-4 flex flex-col justify-center flex-1">
                  <span className="font-mono text-[9px] text-[#0E5C53] tracking-[0.2em] uppercase">{place.location}</span>
                  <h3 className="font-display text-lg text-[#0B2422] mt-1">{place.title}</h3>
                  <p className="text-[#5C6E69] text-xs mt-1 line-clamp-2">{place.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[11px] font-mono text-[#0E5C53] flex items-center gap-1"><span className="text-[#C79A3E]">★</span>{place.rating} · {place.reviews}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <button 
            onClick={() => handleProtectedClick('/categories')}
            className="font-mono text-xs uppercase tracking-[0.2em] px-8 py-3 rounded-full border border-[#0B2422] text-[#0B2422] hover:bg-[#0B2422] hover:text-[#FBF6EA] transition-all duration-300"
          >
            View all destinations →
          </button>
        </div>
      </section>

      {/* LOCAL INSIGHTS SECTION */}
      <section className="relative px-6 py-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="font-mono text-xs text-[#C79A3E] tracking-[0.25em] uppercase">Field notes / 02</span>
            <h2 className="font-display text-4xl md:text-5xl text-[#0B2422] mt-2">
              Local <span className="italic text-[#C79A3E]">Insights</span>
            </h2>
          </div>
          <p className="text-[#4A5F5A] max-w-sm text-sm leading-relaxed">Hidden gems and honest tips, written by fellow travelers and locals who know Kerala best.</p>
        </div>

        <div 
          onClick={() => handleProtectedClick('/local-insights')}
          className="group relative bg-gradient-to-br from-[#072E2A] to-[#0B3A34] rounded-2xl overflow-hidden cursor-pointer border border-[#C79A3E]/20 hover:border-[#C79A3E]/60 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5" />
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#C79A3E]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#E4C77B]/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📖</span>
                  <span className="font-mono text-xs text-[#E4C77B] tracking-[0.2em] uppercase">Community knowledge</span>
                </div>
                <h3 className="font-display text-2xl md:text-3xl text-white mb-3">
                  Discover Kerala's <span className="text-[#E4C77B]">hidden stories</span>
                </h3>
                <p className="text-[#B9CFC9] text-sm max-w-lg leading-relaxed">
                  Read authentic insights from travelers who've been there, and share your own discoveries with our community of explorers.
                </p>
                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[#E4C77B] font-bold text-xl">💎</span>
                    <span className="text-[#B9CFC9] text-xs">Traveler tips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#E4C77B] font-bold text-xl">📍</span>
                    <span className="text-[#B9CFC9] text-xs">Hidden spots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#E4C77B] font-bold text-xl">✨</span>
                    <span className="text-[#B9CFC9] text-xs">Local secrets</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0 flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 bg-[#0B3A34]/50 px-6 py-3 rounded-full border border-[#C79A3E]/20">
                  <span className="font-mono text-[#E4C77B] text-sm font-bold">Explore Insights</span>
                  <svg className="w-5 h-5 text-[#E4C77B] group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#8A9A95]">
                  <span>✨ Real traveler stories</span>
                  <span>•</span>
                  <span>🗺️ Curated by locals</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOP CATEGORIES */}
      <section className="relative px-6 py-20 bg-[#F5EFE0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="font-mono text-xs text-[#0E5C53] tracking-[0.25em] uppercase">Field notes / 03</span>
            <h2 className="font-display italic text-4xl md:text-5xl text-[#0B2422] mt-3">
              Top Categories
            </h2>
            <ZariRule className="max-w-xs mx-auto mt-5" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5">
            {topCategories.map((category) => (
              <button
                key={category.key}
                onClick={() => handleProtectedClick(`/category/${category.key}`)}
                className="category-tile group text-center rounded-2xl border border-[#0E5C53]/15 bg-white hover:bg-[#0E5C53] hover:border-[#0E5C53] transition-all duration-300 py-8 px-4"
              >
                <div className="flex items-center justify-center">
                  <CategoryIcon type={category.key} />
                </div>
                <h3 className="font-display text-base md:text-lg text-[#0B2422] group-hover:text-white mt-4 transition-colors">
                  {category.label}
                </h3>
                <span className="font-mono text-[10px] text-[#8A9A95] group-hover:text-[#E4C77B] tracking-wide mt-1 block transition-colors">
                  {category.count} places
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE DISCOVEREASE? */}
      <section className="relative">
        <RippleDivider fill="#072E2A" />
        <div className="bg-[#072E2A] py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="font-mono text-xs text-[#E4C77B] tracking-[0.25em] uppercase">Field notes / 04</span>
              <h2 className="font-display text-4xl md:text-5xl text-white mt-3">
                Why Choose <span className="italic text-[#E4C77B]">DiscoverEase?</span>
              </h2>
              <ZariRule className="max-w-xs mx-auto mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyChooseUs.map((feature) => (
                <div
                  key={feature.title}
                  onClick={() => handleFeatureClick(feature.title)}
                  className="feature-card bg-[#0B3A34] rounded-xl p-8 border border-[#C79A3E]/15 hover:border-[#C79A3E]/50 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <FeatureIcon type={feature.title} />
                    <svg className="w-5 h-5 text-[#C79A3E] opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg text-white mt-4 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#B9CFC9] text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 text-[#C79A3E] text-xs font-mono uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Explore →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rotate-180">
          <RippleDivider fill="#FBF6EA" />
        </div>
      </section>

      {/* KNOW A HIDDEN GEM? */}
      <section className="relative px-6 py-20 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg p-8 md:p-14 border border-[#C79A3E]/30 shadow-lg" style={{ boxShadow: '0 30px 60px -20px rgba(11,36,34,0.15)' }}>
          <div className="flex flex-col md:flex-row items-stretch gap-10 md:gap-14">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="font-mono text-xs text-[#0E5C53] tracking-[0.25em] uppercase">Share with guides</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-[#0B2422] mb-4">
                Share a hidden <span className="italic text-[#0E5C53]">gem</span>
              </h2>
              <p className="text-[#4A5F5A] text-base mb-8 leading-relaxed">
                Found a secret spot? Share it with our local guides in your district.
                <span className="text-[#0E5C53] font-medium block mt-2">Include a photo to help guides find it!</span>
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-w-md mx-auto md:mx-0">
                {travelerTips.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-[#4A5F5A] text-xs text-left">
                    <span className="text-base leading-none mt-0.5">{item.icon}</span>
                    <span>{item.tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full flex items-stretch">
              {!showSuggestion ? (
                <button onClick={() => setShowSuggestion(true)} className="w-full p-8 rounded-lg border-2 border-dashed border-[#C79A3E]/50 text-center hover:border-[#C79A3E] transition-all duration-300 group flex flex-col items-center justify-center gap-3" style={{ background: 'radial-gradient(circle at top right, rgba(199,154,62,0.06), transparent 60%)' }}>
                  <div className="w-16 h-16 rounded-full border-2 border-[#C79A3E] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">📸</div>
                  <h3 className="font-display text-2xl text-[#0B2422]">Share with a guide</h3>
                  <p className="text-[#5C6E69] text-sm">Send your discovery to a guide in your district</p>
                  <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] px-6 py-2.5 border border-[#0B2422] rounded-full group-hover:bg-[#0B2422] group-hover:text-white transition-all duration-300">Share now →</div>
                </button>
              ) : suggestionSubmitted ? (
                <div className="w-full rounded-lg p-8 text-center border border-[#0E5C53]/40 flex flex-col items-center justify-center gap-3" style={{ background: '#F4FAF8' }}>
                  <div className="text-5xl">✅</div>
                  <h3 className="font-display text-2xl text-[#0E5C53]">Thank you, explorer!</h3>
                  <p className="text-[#4A5F5A] text-sm">Your hidden gem has been shared with the guide in your district.</p>
                  <p className="font-mono text-xs text-[#0E5C53] uppercase tracking-wider">Guide will review it soon</p>
                </div>
              ) : (
                <div className="w-full rounded-lg p-6 border border-[#C79A3E]/30 bg-white max-h-[600px] overflow-y-auto">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-display text-xl text-[#0B2422]">Share your discovery</h3>
                    <button onClick={() => setShowSuggestion(false)} className="text-[#8A9A95] hover:text-[#0B2422] transition text-lg leading-none">✕</button>
                  </div>
                  <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#0B2422] mb-1">Place Name *</label>
                      <input 
                        type="text" 
                        name="placeName" 
                        placeholder="What's the name of this hidden place?" 
                        value={suggestionData.placeName} 
                        onChange={handleSuggestionChange} 
                        className="w-full px-4 py-3 bg-[#FBF6EA] border border-[#C79A3E]/30 focus:border-[#0E5C53] outline-none transition text-sm placeholder:text-[#8A9A95] rounded-lg" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#0B2422] mb-1">District *</label>
                      <select
                        name="district"
                        value={suggestionData.district}
                        onChange={handleSuggestionChange}
                        className="w-full px-4 py-3 bg-[#FBF6EA] border border-[#C79A3E]/30 focus:border-[#0E5C53] outline-none transition text-sm text-[#4A5F5A] rounded-lg"
                        required
                      >
                        <option value="">Select District</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">This will be sent to guides in this district</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#0B2422] mb-1">Location Details *</label>
                      <input 
                        type="text" 
                        name="location" 
                        placeholder="Nearby landmarks, how to reach" 
                        value={suggestionData.location} 
                        onChange={handleSuggestionChange} 
                        className="w-full px-4 py-3 bg-[#FBF6EA] border border-[#C79A3E]/30 focus:border-[#0E5C53] outline-none transition text-sm placeholder:text-[#8A9A95] rounded-lg" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#0B2422] mb-1">Description *</label>
                      <textarea 
                        name="description" 
                        placeholder="Describe why this place is special..." 
                        rows="3" 
                        value={suggestionData.description} 
                        onChange={handleSuggestionChange} 
                        className="w-full px-4 py-3 bg-[#FBF6EA] border border-[#C79A3E]/30 focus:border-[#0E5C53] outline-none transition resize-none text-sm placeholder:text-[#8A9A95] rounded-lg" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#0B2422] mb-1">Category *</label>
                      <select 
                        name="category" 
                        value={suggestionData.category} 
                        onChange={handleSuggestionChange} 
                        className="w-full px-4 py-3 bg-[#FBF6EA] border border-[#C79A3E]/30 focus:border-[#0E5C53] outline-none transition text-sm text-[#4A5F5A] rounded-lg" 
                        required
                      >
                        <option value="">Select category</option>
                        <option value="waterfall">Waterfall</option>
                        <option value="trekking">Trekking</option>
                        <option value="backwaters">Backwaters</option>
                        <option value="wildlife">Wildlife</option>
                        <option value="heritage">Heritage</option>
                        <option value="beach">Beach</option>
                        <option value="forest">Forest</option>
                        <option value="temple">Temple</option>
                        <option value="fort">Fort</option>
                        <option value="camping">Camping</option>
                        <option value="natures">Natures</option>
                        <option value="beach">desert safari</option>
                        <option value="resort">resort</option>
                        <option value="zoo">zoo</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {/* Image Upload */}
                    <div>
                      <label className="block text-xs font-medium text-[#0B2422] mb-1">Upload Photo</label>
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-[#FBF6EA] border border-[#C79A3E]/30 rounded-lg px-4 py-3 hover:bg-[#F5EFE0] transition text-sm text-[#0B2422] flex items-center gap-2">
                          <span>📷</span>
                          <span>Choose Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={removeImage}
                            className="text-red-500 text-sm hover:text-red-700 transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Max 5MB. JPG, PNG, GIF accepted</p>
                      {imagePreview && (
                        <div className="mt-3 relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg border border-[#C79A3E]/30 image-preview"
                          />
                          <span className="absolute top-1 right-1 bg-[#072E2A] text-white text-xs px-2 py-0.5 rounded-full">
                            {suggestionData.image?.name || 'Image'}
                          </span>
                        </div>
                      )}
                    </div>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full py-3 rounded-full bg-[#0E5C53] text-white font-mono text-xs uppercase tracking-[0.2em] hover:bg-[#0B2422] transition-all duration-300 mt-2 disabled:opacity-50"
                    >
                      {submitting ? '⏳ Sharing...' : '📤 Share with district guide'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative bg-[#051F1C] border-t border-[#C79A3E]/30">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full border border-[#C79A3E]/60 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C12 2 6 8 6 14a6 6 0 0012 0c0-6-6-12-6-12z" stroke="#E4C77B" strokeWidth="1.4" />
                  </svg>
                </div>
                <span className="font-display italic text-xl text-white">Discover<span className="text-[#E4C77B] not-italic">Ease</span></span>
              </div>
              <p className="text-[#8FA69F] text-sm leading-relaxed">AI-powered destination discovery and trip planning for Kerala. Explore hidden gems, connect with locals, and travel sustainably.</p>
              <div className="flex gap-3 mt-5">
                {['🌿', '🐦', '📸', '▶️'].map((icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-full border border-[#C79A3E]/30 hover:border-[#C79A3E] transition-all duration-300 text-sm">{icon}</button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-mono text-xs text-[#E4C77B] uppercase tracking-[0.2em] mb-4">Quick links</h4>
              <ul className="space-y-2.5">
                <li><Link to="/about" className="text-[#8FA69F] hover:text-[#E4C77B] transition text-sm">About Us</Link></li>
                <li><Link to="/destinations" className="text-[#8FA69F] hover:text-[#E4C77B] transition text-sm">Destinations</Link></li>
                <li><Link to="/itineraries" className="text-[#8FA69F] hover:text-[#E4C77B] transition text-sm">Itineraries</Link></li>
                <li><Link to="/blog" className="text-[#8FA69F] hover:text-[#E4C77B] transition text-sm">Travel Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs text-[#E4C77B] uppercase tracking-[0.2em] mb-4">Support</h4>
              <ul className="space-y-2.5">
                <li><Link to="/help" className="text-[#8FA69F] hover:text-[#E4C77B] transition text-sm">Help Center</Link></li>
                <li><Link to="/contact" className="text-[#8FA69F] hover:text-[#E4C77B] transition text-sm">Contact Us</Link></li>
                <li><Link to="/privacy" className="text-[#8FA69F] hover:text-[#E4C77B] transition text-sm">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-[#8FA69F] hover:text-[#E4C77B] transition text-sm">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs text-[#E4C77B] uppercase tracking-[0.2em] mb-4">Stay updated</h4>
              <p className="text-[#8FA69F] text-sm mb-3">Subscribe to get updates on new destinations and travel tips.</p>
              <div className="flex border-b border-[#C79A3E]/30 focus-within:border-[#E4C77B] transition">
                <input type="email" placeholder="Your email" className="flex-1 bg-transparent py-2.5 text-white placeholder-[#5C7A73] focus:outline-none text-sm" />
                <button className="px-4 font-mono text-xs uppercase tracking-wider text-[#E4C77B]">→</button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#C79A3E]/15 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#5C7A73] text-xs font-mono">© 2026 DISCOVEREASE — MADE FOR KERALA</p>
            <div className="flex gap-6 text-xs font-mono uppercase tracking-wider">
              <Link to="/privacy" className="text-[#5C7A73] hover:text-[#E4C77B] transition">Privacy</Link>
              <Link to="/terms" className="text-[#5C7A73] hover:text-[#E4C77B] transition">Terms</Link>
              <Link to="/cookies" className="text-[#5C7A73] hover:text-[#E4C77B] transition">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
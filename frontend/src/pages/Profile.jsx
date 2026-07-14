// src/pages/Profile.jsx - FIXED VERSION (Includes both Suggestions & Reviews)
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ============================================
// SMALL INLINE ICONS
// ============================================
const Icon = {
  Camera: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Edit: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  ),
  Save: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <path d="M17 21v-8H7v8M7 3v5h8" />
    </svg>
  ),
  Close: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Trash: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
    </svg>
  ),
  Logout: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  Gem: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M2 9h20M11 3l-3 6 4 12 4-12-3-6" />
    </svg>
  ),
  Sparkle: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
    </svg>
  ),
  Warning: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  Delete: (p) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
    </svg>
  ),
  Back: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('profile');
  const [scrolled, setScrolled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tripStats, setTripStats] = useState({
    total_trips: 0,
    completed_trips: 0,
    pending_trips: 0
  });
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const fileInputRef = useRef(null);
  
  // User Suggestions Stats
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [suggestionStats, setSuggestionStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    implemented: 0,
    rejected: 0,
    hidden_gems: 0,
    insights: 0,
  });
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // ============================================
  // EFFECTS
  // ============================================
  
  useEffect(() => {
    if (user) {
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
      loadProfilePicture();
    }
  }, [user]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchTripStats();
      fetchUserSuggestions();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isLoggedIn, navigate]);

  // ============================================
  // PROFILE PICTURE FUNCTIONS
  // ============================================
  
  const loadProfilePicture = () => {
    const savedPicture = localStorage.getItem('profile_picture');
    if (savedPicture) {
      setProfilePicture(savedPicture);
      return;
    }
    if (user?.profile_picture_upload) {
      setProfilePicture(user.profile_picture_upload);
    } else if (user?.profile_picture) {
      setProfilePicture(user.profile_picture);
    } else {
      setProfilePicture(null);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('❌ File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('❌ Please upload an image file');
      return;
    }

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        localStorage.setItem('profile_picture', base64String);
        setProfilePicture(base64String);
        setUploading(false);
        alert('✅ Profile picture updated successfully!');
        
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.profile_picture_upload = base64String;
        localStorage.setItem('user', JSON.stringify(userData));
      };
      reader.readAsDataURL(file);
      
      try {
        const formData = new FormData();
        formData.append('profile_picture', file);
        await api.post('/auth/upload-profile-picture/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (apiError) {
        console.warn('API upload failed, using localStorage only:', apiError);
      }
      
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('❌ Failed to upload profile picture. Please try again.');
      setUploading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    try {
      localStorage.removeItem('profile_picture');
      setProfilePicture(null);
      
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      delete userData.profile_picture_upload;
      delete userData.profile_picture;
      localStorage.setItem('user', JSON.stringify(userData));
      
      try {
        await api.post('/auth/delete-profile-picture/');
      } catch (apiError) {
        console.warn('API delete failed, using localStorage only:', apiError);
      }
      
      alert('✅ Profile picture deleted successfully!');
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      alert('❌ Failed to delete profile picture. Please try again.');
    }
  };

  // ============================================
  // USER SUGGESTIONS & REVIEWS FUNCTIONS - FIXED
  // ============================================
  
  const fetchUserSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const userEmail = user?.email || '';
      let allItems = [];

      // 1️⃣ Fetch from localStorage - Suggestions
      try {
        const allSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
        const userSuggestions = allSuggestions.filter(s => 
          s.user_email === userEmail || 
          (s.user && s.user.email === userEmail)
        );
        allItems = [...allItems, ...userSuggestions];
        console.log('📊 Local suggestions found:', userSuggestions.length);
      } catch (e) {
        console.log('⚠️ No local suggestions found');
      }

      // 2️⃣ Fetch from localStorage - Reviews
      try {
        const allReviews = JSON.parse(localStorage.getItem('user_reviews') || '[]');
        const userReviews = allReviews.filter(r => 
          r.user_email === userEmail || 
          (r.user && r.user.email === userEmail)
        );
        // Add reviews to allItems with proper type
        const reviewsWithType = userReviews.map(r => ({
          ...r,
          type: 'review',
          suggestion_type: 'review',
          name: r.destination || r.name,
          place: r.destination || r.place,
          description: r.review_text || r.description,
        }));
        allItems = [...allItems, ...reviewsWithType];
        console.log('📊 Local reviews found:', userReviews.length);
      } catch (e) {
        console.log('⚠️ No local reviews found');
      }

      // 3️⃣ Try to fetch from API
      try {
        const response = await api.get('/suggestions/user/');
        console.log('📊 API user suggestions:', response.data);
        
        if (response.data?.success && response.data?.suggestions) {
          const apiItems = response.data.suggestions;
          // Merge with existing, avoid duplicates by id
          const existingIds = new Set(allItems.map(s => s.id));
          const uniqueApiItems = apiItems.filter(s => !existingIds.has(s.id));
          allItems = [...allItems, ...uniqueApiItems];
        }
      } catch (apiError) {
        console.log('⚠️ API suggestions fetch failed:', apiError.message);
      }

      // 4️⃣ Try to fetch reviews from API
      try {
        const response = await api.get('/reviews/user/');
        console.log('📊 API user reviews:', response.data);
        
        if (response.data?.success && response.data?.reviews) {
          const apiItems = response.data.reviews;
          const existingIds = new Set(allItems.map(s => s.id));
          const uniqueApiItems = apiItems.filter(s => !existingIds.has(s.id));
          allItems = [...allItems, ...uniqueApiItems];
        }
      } catch (apiError) {
        console.log('⚠️ API reviews fetch failed:', apiError.message);
      }

      console.log('📊 Total items found:', allItems.length);
      setUserSuggestions(allItems);
      updateSuggestionStats(allItems);
      
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
      setUserSuggestions([]);
      setSuggestionStats({
        total: 0,
        pending: 0,
        approved: 0,
        implemented: 0,
        rejected: 0,
        hidden_gems: 0,
        insights: 0,
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const updateSuggestionStats = (items) => {
    const total = items.length;
    const pending = items.filter(s => s.status === 'pending' || s.status === 'Pending').length;
    const approved = items.filter(s => s.status === 'approved' || s.status === 'Approved').length;
    const implemented = items.filter(s => s.status === 'implemented' || s.status === 'Implemented').length;
    const rejected = items.filter(s => s.status === 'rejected' || s.status === 'Rejected').length;
    const hidden_gems = items.filter(s => s.type === 'hidden_gem' || s.suggestion_type === 'hidden_gem').length;
    const insights = items.filter(s => s.type === 'insight' || s.suggestion_type === 'insight').length;
    const reviews = items.filter(s => s.type === 'review' || s.suggestion_type === 'review').length;
    
    setSuggestionStats({
      total,
      pending,
      approved,
      implemented,
      rejected,
      hidden_gems,
      insights,
    });
  };

  // ============================================
  // TRIP STATS
  // ============================================
  
  const fetchTripStats = async () => {
    try {
      const response = await api.get('/auth/trip-stats/');
      if (response.data.success) {
        setTripStats({
          total_trips: response.data.total_trips || 0,
          completed_trips: response.data.completed_trips || 0,
          pending_trips: response.data.pending_trips || 0
        });
      }
    } catch (error) {
      console.warn('Trip stats fetch failed:', error);
      setTripStats({
        total_trips: 0,
        completed_trips: 0,
        pending_trips: 0
      });
    }
  };

  // ============================================
  // PROFILE EDIT FUNCTIONS
  // ============================================
  
  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.patch('/auth/update-profile/', editData);
      if (response.data.success) {
        alert('✅ Profile updated successfully!');
        setIsEditing(false);
        window.location.reload();
      } else {
        alert('❌ ' + (response.data.error || 'Failed to update profile'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Failed to update profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
    }
  };

  // ============================================
  // DELETE ACCOUNT
  // ============================================
  
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      alert('Please enter your password to confirm deletion.');
      return;
    }

    if (!window.confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone!')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await api.post('/auth/delete-account/', {
        password: deletePassword
      });
      
      if (response.data.success) {
        alert('✅ Account deleted successfully.');
        logout();
        navigate('/login', { replace: true });
      } else {
        alert('❌ ' + (response.data.error || 'Failed to delete account'));
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('❌ Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setDeletePassword('');
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access this page. Please login first.');
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#D97706',
      'Pending': '#D97706',
      'approved': '#16A34A',
      'Approved': '#16A34A',
      'implemented': '#2563EB',
      'Implemented': '#2563EB',
      'rejected': '#DC2626',
      'Rejected': '#DC2626',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusBg = (status) => {
    const colors = {
      'pending': '#FEF3C7',
      'Pending': '#FEF3C7',
      'approved': '#DCFCE7',
      'Approved': '#DCFCE7',
      'implemented': '#DBEAFE',
      'Implemented': '#DBEAFE',
      'rejected': '#FEE2E2',
      'Rejected': '#FEE2E2',
    };
    return colors[status] || '#F3F4F6';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': '⏳ Pending',
      'Pending': '⏳ Pending',
      'approved': '✅ Approved',
      'Approved': '✅ Approved',
      'implemented': '🎯 Implemented',
      'Implemented': '🎯 Implemented',
      'rejected': '❌ Rejected',
      'Rejected': '❌ Rejected',
    };
    return labels[status] || status;
  };

  // Filter suggestions based on status
  const getFilteredSuggestions = () => {
    if (filterStatus === 'all') return userSuggestions;
    return userSuggestions.filter(s => {
      const status = s.status || 'pending';
      return status.toLowerCase() === filterStatus.toLowerCase();
    });
  };

  // ============================================
  // BOTTOM NAVIGATION
  // ============================================
  
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

  // ============================================
  // LOADING STATE
  // ============================================
  
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#FBF6EA"
      }}>
        <div style={{ 
          width: 40, 
          height: 40, 
          border: "3px solid #E4C77B", 
          borderTop: "3px solid transparent", 
          borderRadius: "50%", 
          animation: "spin 0.8s linear infinite" 
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  const filteredSuggestions = getFilteredSuggestions();

  // ============================================
  // RENDER
  // ============================================

  const card = {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid rgba(199,154,62,0.18)",
    boxShadow: "0 1px 2px rgba(11,36,34,0.04)",
  };
  const sectionLabel = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#0E5C53",
    margin: 0,
  };
  const fieldTile = {
    background: "#FBF6EA",
    borderRadius: 8,
    padding: "12px 14px",
    border: "1px solid rgba(199,154,62,0.2)",
  };
  const fieldLabel = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#8A9A95",
    display: "block",
    margin: "0 0 4px",
  };
  const pillButton = (variant = 'outline') => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    borderRadius: 999,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: variant === 'solid' ? '1px solid #0E5C53' : '1px solid #C79A3E',
    background: variant === 'solid' ? '#0E5C53' : 'transparent',
    color: variant === 'solid' ? '#fff' : '#0B2422',
  });

  return (
    <div style={{ background: "#FBF6EA", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422", paddingBottom: 112 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .pf-font-display { font-family: 'Fraunces', serif; }
        .pf-font-mono { font-family: 'IBM Plex Mono', monospace; }
        .pf-stamp { animation: pf-spin 22s linear infinite; }
        @keyframes pf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pf-input { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .pf-input:focus { border-color: #C79A3E; box-shadow: 0 0 0 3px rgba(199,154,62,0.12); outline: none; }
        .pf-profile-pic:hover .pf-overlay { opacity: 1; }
        .pf-overlay { opacity: 0; transition: opacity 0.2s ease; }
        .pf-ghost-btn:hover { background: rgba(190,90,52,0.08) !important; }
        .pf-solid-hover:hover { filter: brightness(0.94); }
        .pf-outline-hover:hover { background: #C79A3E !important; color: #fff !important; }
        .suggestion-card:hover { border-color: rgba(199,154,62,0.4) !important; box-shadow: 0 4px 14px rgba(11,36,34,0.08); }
        .status-filter-btn { transition: all 0.2s ease; }
        .status-filter-btn:hover { border-color: #0E5C53; }
        .status-filter-btn.active { border-color: #0E5C53; background: #0E5C53; color: #fff; }
        @media (max-width: 640px) {
          .pf-two-col { grid-template-columns: 1fr !important; }
          .pf-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "#072E2A", padding: "40px 20px 34px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <Link to="/" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(199,154,62,0.5)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <Icon.Back stroke="#E4C77B" />
            </Link>
            <Link to="/" className="pf-font-mono" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#E4C77B", textDecoration: "none" }}>
              Back to home →
            </Link>
          </div>
          <p className="pf-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", marginBottom: 10 }}>Traveler passport</p>
          <h1 className="pf-font-display" style={{ fontStyle: "italic", fontSize: 36, fontWeight: 500, color: "#fff", margin: 0, lineHeight: 1.05 }}>My Profile</h1>
        </div>
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
          <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
        </svg>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 0", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* IDENTITY CARD */}
        <div style={{ ...card, padding: "28px 26px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundImage: "linear-gradient(to right, rgba(199,154,62,0.5) 50%, transparent 50%)", backgroundSize: "10px 1px" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            {/* Profile Picture */}
            <div className="pf-profile-pic" style={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  border: "1.5px solid #C79A3E",
                  background: "#072E2A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  color: "#E4C77B",
                  fontStyle: "italic",
                  fontFamily: "'Fraunces', serif",
                  overflow: "hidden",
                  cursor: "pointer"
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : user?.profile_picture_upload ? (
                  <img src={user.profile_picture_upload} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  user?.first_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>

              <div
                className="pf-overlay"
                style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(7,46,42,0.62)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E4C77B", cursor: "pointer", flexDirection: "column", gap: 3 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon.Camera stroke="#E4C77B" />
                <span className="pf-font-mono" style={{ fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Change</span>
              </div>

              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleProfilePictureUpload} disabled={uploading} />

              {uploading && (
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(7,46,42,0.7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E4C77B", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>
                  Uploading…
                </div>
              )}

              {(profilePicture || user?.profile_picture_upload || user?.profile_picture) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteProfilePicture(); }}
                  style={{ position: "absolute", top: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "#BE5A34", border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Remove profile picture"
                >
                  <Icon.Close stroke="#fff" width="10" height="10" />
                </button>
              )}

              <svg className="pf-stamp" width="30" height="30" viewBox="0 0 100 100" style={{ position: "absolute", bottom: -6, right: -6 }}>
                <circle cx="50" cy="50" r="46" fill="#FBF6EA" stroke="#C79A3E" strokeWidth="2" />
                <path id="pf-circle-path" d="M50,10 a40,40 0 1,1 -0.1,0" fill="none" />
                <text fontSize="9.5" fill="#0E5C53" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5">
                  <textPath href="#pf-circle-path" startOffset="0%">• VERIFIED • VERIFIED •</textPath>
                </text>
              </svg>
            </div>

            {/* Name & Email */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <h2 className="pf-font-display" style={{ fontSize: 25, color: "#0B2422", margin: 0 }}>
                {user?.first_name || user?.username || 'Traveler'} {user?.last_name || ''}
              </h2>
              <p style={{ color: "#5C6E69", fontSize: 13, margin: "4px 0 10px" }}>{user?.email || 'No email on file'}</p>
              <span className="pf-font-mono" style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0E5C53", border: "1px solid rgba(14,92,83,0.35)", borderRadius: 999, padding: "4px 10px" }}>
                Verified account
              </span>
            </div>

            {/* Edit/Save Buttons */}
            <div>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="pf-font-mono pf-outline-hover" style={pillButton('outline')}>
                  <Icon.Edit /> Edit profile
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={handleSaveProfile} className="pf-font-mono pf-solid-hover" style={pillButton('solid')}>
                    <Icon.Save /> Save
                  </button>
                  <button onClick={handleCancelEdit} className="pf-font-mono" style={{ ...pillButton('outline'), border: "1px solid #BE5A34", color: "#BE5A34" }}>
                    <Icon.Close /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Trip Stats */}
          <div className="pf-stat-grid" style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <div style={{ ...fieldTile, background: "#F4FAF8", textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#0E5C53", margin: 0 }}>{tripStats.total_trips}</p>
              <p style={fieldLabel}>Total trips</p>
            </div>
            <div style={{ ...fieldTile, background: "#F4FAF8", textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#16A34A", margin: 0 }}>{tripStats.completed_trips}</p>
              <p style={fieldLabel}>Completed</p>
            </div>
            <div style={{ ...fieldTile, background: "#F4FAF8", textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#EAB308", margin: 0 }}>{tripStats.pending_trips}</p>
              <p style={fieldLabel}>Pending</p>
            </div>
          </div>
        </div>

        {/* ACCOUNT DETAILS CARD */}
        <div style={{ ...card, padding: "26px" }}>
          <p style={{ ...sectionLabel, marginBottom: 16 }}>Account details</p>

          {!isEditing ? (
            <div className="pf-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={fieldTile}>
                <p style={fieldLabel}>First name</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.first_name || '—'}</p>
              </div>
              <div style={fieldTile}>
                <p style={fieldLabel}>Last name</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.last_name || '—'}</p>
              </div>
              <div style={fieldTile}>
                <p style={fieldLabel}>Username</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.username || '—'}</p>
              </div>
              <div style={fieldTile}>
                <p style={fieldLabel}>Phone</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.phone || 'Not set'}</p>
              </div>
              <div style={{ ...fieldTile, gridColumn: "1 / -1" }}>
                <p style={fieldLabel}>Email</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.email || '—'}</p>
              </div>
              {user?.bio && (
                <div style={{ ...fieldTile, gridColumn: "1 / -1" }}>
                  <p style={fieldLabel}>Bio</p>
                  <p style={{ fontWeight: 500, color: "#0B2422", margin: 0, fontSize: 14, lineHeight: 1.5 }}>{user?.bio}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="pf-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={fieldLabel}>First name</label>
                <input type="text" name="first_name" value={editData.first_name} onChange={handleEditChange} className="pf-input" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#FBF6EA" }} />
              </div>
              <div>
                <label style={fieldLabel}>Last name</label>
                <input type="text" name="last_name" value={editData.last_name} onChange={handleEditChange} className="pf-input" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#FBF6EA" }} />
              </div>
              <div>
                <label style={fieldLabel}>Username</label>
                <input type="text" name="username" value={editData.username} onChange={handleEditChange} className="pf-input" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#FBF6EA" }} />
              </div>
              <div>
                <label style={fieldLabel}>Phone</label>
                <input type="text" name="phone" value={editData.phone} onChange={handleEditChange} className="pf-input" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#FBF6EA" }} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={fieldLabel}>Bio</label>
                <textarea name="bio" value={editData.bio} onChange={handleEditChange} className="pf-input" rows="3" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#FBF6EA", resize: "vertical", fontFamily: "'Inter', sans-serif" }} placeholder="Tell us about yourself..." />
              </div>
            </div>
          )}
        </div>

        {/* CONTRIBUTIONS CARD - Shows ALL user contributions including reviews */}
        <div style={{ ...card, padding: "26px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div>
              <p style={sectionLabel}>My contributions</p>
              <p style={{ fontSize: 12, color: "#5C6E69", margin: "4px 0 0" }}>
                {suggestionStats.total} total contributions (Suggestions + Reviews)
              </p>
            </div>
            <button onClick={() => setShowSuggestions(!showSuggestions)} className="pf-font-mono" style={pillButton(showSuggestions ? 'solid' : 'outline')}>
              {showSuggestions ? 'Hide' : 'View all'} {suggestionStats.total > 0 && `(${suggestionStats.total})`}
            </button>
          </div>

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))", gap: 8, marginBottom: 14 }}>
            <div style={{ ...fieldTile, background: "#F4FAF8", textAlign: "center", padding: "10px 8px" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#0E5C53", margin: 0 }}>{suggestionStats.total}</p>
              <p style={{ ...fieldLabel, margin: 0 }}>Total</p>
            </div>
            <div style={{ background: "#FEF3C7", borderRadius: 8, textAlign: "center", padding: "10px 8px" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#D97706", margin: 0 }}>{suggestionStats.pending}</p>
              <p style={{ ...fieldLabel, color: "#D97706", margin: 0 }}>Pending</p>
            </div>
            <div style={{ background: "#DCFCE7", borderRadius: 8, textAlign: "center", padding: "10px 8px" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#16A34A", margin: 0 }}>{suggestionStats.approved}</p>
              <p style={{ ...fieldLabel, color: "#16A34A", margin: 0 }}>Approved</p>
            </div>
            <div style={{ background: "#DBEAFE", borderRadius: 8, textAlign: "center", padding: "10px 8px" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#2563EB", margin: 0 }}>{suggestionStats.implemented}</p>
              <p style={{ ...fieldLabel, color: "#2563EB", margin: 0 }}>Live</p>
            </div>
            <div style={{ background: "#FEE2E2", borderRadius: 8, textAlign: "center", padding: "10px 8px" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#DC2626", margin: 0 }}>{suggestionStats.rejected}</p>
              <p style={{ ...fieldLabel, color: "#DC2626", margin: 0 }}>Rejected</p>
            </div>
          </div>

          {/* Type Breakdown */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ ...fieldTile, flex: 1, background: "#F4FAF8", display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
              <Icon.Gem stroke="#0E5C53" />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#0E5C53", margin: 0 }}>{suggestionStats.hidden_gems}</p>
                <p style={{ ...fieldLabel, margin: 0 }}>Hidden gems</p>
              </div>
            </div>
            <div style={{ ...fieldTile, flex: 1, background: "#F4FAF8", display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
              <Icon.Sparkle stroke="#C79A3E" />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#C79A3E", margin: 0 }}>{suggestionStats.insights}</p>
                <p style={{ ...fieldLabel, margin: 0 }}>Insights</p>
              </div>
            </div>
          </div>

          {/* Suggestions & Reviews List */}
          {showSuggestions && (
            <div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {['all', 'pending', 'approved', 'implemented', 'rejected'].map((status) => (
                  <button
                    key={status}
                    className={`status-filter-btn pf-font-mono ${filterStatus === status ? 'active' : ''}`}
                    onClick={() => setFilterStatus(status)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 999,
                      border: filterStatus === status ? "1px solid #0E5C53" : "1px solid rgba(199,154,62,0.3)",
                      background: filterStatus === status ? "#0E5C53" : "transparent",
                      color: filterStatus === status ? "#fff" : "#5C6E69",
                      fontSize: 10,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      letterSpacing: "0.06em"
                    }}
                  >
                    {status === 'all' ? 'All' : status} · {status === 'all' ? suggestionStats.total : suggestionStats[status] || 0}
                  </button>
                ))}
              </div>

              {loadingSuggestions ? (
                <div style={{ textAlign: "center", padding: "24px" }}>
                  <div style={{ display: "inline-block", width: 22, height: 22, border: "2px solid #C79A3E", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
              ) : (
                <div style={{ maxHeight: 480, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredSuggestions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "28px 16px", color: "#5C6E69", fontSize: 13, background: "#FBF6EA", borderRadius: 8 }}>
                      {filterStatus === 'all'
                        ? "You haven't made any contributions yet."
                        : `No ${filterStatus} contributions found.`}
                      {filterStatus === 'all' && (
                        <p style={{ fontSize: 12, marginTop: 6, color: "#8A9A95" }}>
                          Share a review or suggest a hidden gem!
                        </p>
                      )}
                    </div>
                  ) : (
                    filteredSuggestions.map((item) => (
                      <div
                        key={item.id}
                        className="suggestion-card"
                        style={{ background: "#FBF6EA", padding: "14px 16px", borderRadius: 8, border: "1px solid rgba(199,154,62,0.15)", transition: "all 0.2s ease" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>
                                {item.name || item.destination || item.place || 'Untitled'}
                              </p>
                              {/* Type Badge */}
                              <span style={{
                                display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, padding: "2px 8px", borderRadius: 999,
                                background: item.type === 'review' || item.suggestion_type === 'review' 
                                  ? 'rgba(255,152,0,0.15)' 
                                  : item.type === 'hidden_gem' || item.suggestion_type === 'hidden_gem' 
                                    ? 'rgba(14,92,83,0.15)' 
                                    : 'rgba(199,154,62,0.15)',
                                color: item.type === 'review' || item.suggestion_type === 'review'
                                  ? '#FF9800'
                                  : item.type === 'hidden_gem' || item.suggestion_type === 'hidden_gem'
                                    ? '#0E5C53'
                                    : '#C79A3E'
                              }}>
                                {item.type === 'review' || item.suggestion_type === 'review' ? '⭐ Review' : 
                                 item.type === 'hidden_gem' || item.suggestion_type === 'hidden_gem' ? '💎 Gem' : '✨ Insight'}
                              </span>
                              {/* Status Badge */}
                              <span style={{ fontSize: 9, padding: "2px 10px", borderRadius: 999, background: getStatusBg(item.status || 'pending'), color: getStatusColor(item.status || 'pending'), fontWeight: 500 }}>
                                {getStatusLabel(item.status || 'pending')}
                              </span>
                              {item.rating && (
                                <span style={{ fontSize: 9, color: '#FF9800' }}>
                                  {'★'.repeat(Math.round(item.rating))}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: "#5C6E69", margin: "6px 0 0" }}>
                              {item.district || 'N/A'} · {item.category || 'Uncategorized'}
                            </p>
                            {item.review_text && (
                              <p style={{ fontSize: 12, color: "#4A5F5A", margin: "6px 0 0", lineHeight: 1.5 }}>
                                {item.review_text.length > 120 ? item.review_text.substring(0, 120) + '...' : item.review_text}
                              </p>
                            )}
                            {item.description && !item.review_text && (
                              <p style={{ fontSize: 12, color: "#4A5F5A", margin: "6px 0 0", lineHeight: 1.5 }}>
                                {item.description.length > 120 ? item.description.substring(0, 120) + '...' : item.description}
                              </p>
                            )}
                            {item.tips && (
                              <p style={{ fontSize: 11, color: "#0E5C53", margin: "4px 0 0", background: "#E6F0EA", padding: "4px 8px", borderRadius: 4 }}>
                                💡 {item.tips}
                              </p>
                            )}
                            {item.admin_notes && item.status === 'rejected' && (
                              <p style={{ fontSize: 10, color: "#DC2626", margin: "8px 0 0", background: "#FEE2E2", padding: "5px 9px", borderRadius: 6 }}>
                                Reason: {item.admin_notes}
                              </p>
                            )}
                            {item.image && (
                              <img src={item.image} alt={item.name || item.destination} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, marginTop: 8, border: "1px solid rgba(199,154,62,0.2)" }} />
                            )}
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <p style={{ fontSize: 9, color: "#8A9A95", margin: 0 }}>
                              {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ACCOUNT ACTIONS CARD */}
        <div style={{ ...card, padding: "20px 26px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <button
            onClick={handleLogout}
            className="pf-font-mono pf-ghost-btn"
            style={{ ...pillButton('outline'), border: "1px solid #BE5A34", color: "#BE5A34" }}
          >
            <Icon.Logout /> Logout
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="pf-font-mono pf-ghost-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 999, border: "1px solid transparent", background: "transparent", color: "#BE5A34", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
          >
            <Icon.Delete /> Delete account
          </button>
        </div>
      </div>

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(7,46,42,0.55)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowDeleteModal(false)}>
          <div style={{ background: "#FBF6EA", borderRadius: 14, padding: 30, maxWidth: 440, width: "100%", border: "1px solid rgba(199,154,62,0.3)", boxShadow: "0 20px 50px rgba(7,46,42,0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FBEAE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon.Warning stroke="#BE5A34" />
                </div>
                <h2 className="pf-font-display" style={{ fontSize: 22, color: "#0B2422", margin: 0, fontStyle: "italic" }}>Delete account</h2>
              </div>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5C6E69", padding: 4 }}>
                <Icon.Close width="16" height="16" />
              </button>
            </div>

            <p style={{ fontSize: 13.5, color: "#5C6E69", marginBottom: 18, lineHeight: 1.55 }}>
              This action is <strong style={{ color: "#0B2422" }}>permanent</strong> and cannot be undone. All of your data will be deleted.
            </p>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 6 }}>
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="pf-input"
                style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#fff", fontFamily: "'Inter', sans-serif" }}
                onKeyPress={(e) => { if (e.key === 'Enter') handleDeleteAccount(); }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="pf-font-mono"
                style={{ flex: 1, padding: "11px 20px", borderRadius: 999, border: "none", background: deleteLoading ? "#9CA3AF" : "#BE5A34", color: "#fff", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: deleteLoading ? "not-allowed" : "pointer", opacity: deleteLoading ? 0.7 : 1 }}
              >
                {deleteLoading ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }}
                className="pf-font-mono"
                style={{ flex: 1, padding: "11px 20px", borderRadius: 999, border: "1px solid #D1D5DB", background: "transparent", color: "#5C6E69", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default Profile;
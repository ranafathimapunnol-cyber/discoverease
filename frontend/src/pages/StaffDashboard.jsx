// src/pages/StaffDashboard.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const KERALA_DISTRICTS = [
  { id: 1, name: 'Thiruvananthapuram' }, { id: 2, name: 'Kollam' },
  { id: 3, name: 'Pathanamthitta' }, { id: 4, name: 'Alappuzha' },
  { id: 5, name: 'Kottayam' }, { id: 6, name: 'Idukki' },
  { id: 7, name: 'Ernakulam' }, { id: 8, name: 'Thrissur' },
  { id: 9, name: 'Palakkad' }, { id: 10, name: 'Malappuram' },
  { id: 11, name: 'Kozhikode' }, { id: 12, name: 'Wayanad' },
  { id: 13, name: 'Kannur' }, { id: 14, name: 'Kasaragod' },
];

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    pendingSuggestions: 0,
    totalSuggestions: 0,
    totalGuides: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    implementedReviews: 0,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [guides, setGuides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [showAddGuide, setShowAddGuide] = useState(false);
  const [guideForm, setGuideForm] = useState({
    full_name: '', email: '', password: '',
    phone: '', bio: '',
    experience_years: '0', languages: '', primary_district: '',
    price_per_day: '0', price_per_hour: '0'
  });
  const [guideLoading, setGuideLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newGuidePassword, setNewGuidePassword] = useState('');
  const [autoVerify, setAutoVerify] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  // ============================================
  // PROFILE STATE
  // ============================================
  const [profile, setProfile] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    department: '',
    position: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ============================================
  // PROFILE PICTURE FUNCTIONS
  // ============================================
  const loadProfilePicture = () => {
    const savedPicture = localStorage.getItem('staff_profile_picture');
    if (savedPicture) {
      setProfilePicture(savedPicture);
      return;
    }
    if (user?.profile_image) {
      setProfilePicture(user.profile_image);
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
        localStorage.setItem('staff_profile_picture', base64String);
        setProfilePicture(base64String);
        setUploading(false);
        alert('✅ Profile picture updated!');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('❌ Failed to upload profile picture.');
      setUploading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!window.confirm('Remove your profile picture?')) return;
    try {
      localStorage.removeItem('staff_profile_picture');
      setProfilePicture(null);
      alert('✅ Profile picture removed');
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      alert('❌ Failed to delete profile picture.');
    }
  };

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Stats
      try {
        const statsRes = await api.get('/staff/stats/');
        if (statsRes?.data?.success) {
          const s = statsRes.data.stats;
          setStats({
            pendingSuggestions: s.pendingSuggestions || 0,
            totalSuggestions: s.totalSuggestions || 0,
            totalGuides: s.totalGuides || 0,
            totalBookings: s.totalBookings || 0,
            confirmedBookings: s.confirmedBookings || 0,
            totalReviews: s.totalReviews || 0,
            pendingReviews: s.pendingReviews || 0,
            approvedReviews: s.approvedReviews || 0,
            implementedReviews: s.implementedReviews || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching staff stats:', error);
      }

      // 2. Guides
      try {
        const guidesRes = await api.get('/staff/guides/');
        if (guidesRes?.data?.success) {
          setGuides(guidesRes.data.guides || []);
        } else if (Array.isArray(guidesRes?.data)) {
          setGuides(guidesRes.data);
        } else {
          setGuides([]);
        }
      } catch (error) {
        console.error('Error fetching guides:', error);
        setGuides([]);
      }

      // 3. Bookings
      try {
        const bookRes = await api.get('/staff/bookings/');
        if (bookRes?.data?.success) {
          setBookings(bookRes.data.bookings || []);
        } else if (Array.isArray(bookRes?.data)) {
          setBookings(bookRes.data);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      }

      // 4. Suggestions
      try {
        const suggRes = await api.get('/staff/suggestions/');
        let all = [];
        if (suggRes?.data?.success) {
          all = suggRes.data.suggestions || [];
        } else if (Array.isArray(suggRes?.data)) {
          all = suggRes.data;
        }
        try {
          const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
          const allIds = new Set(all.map(s => s.id));
          const uniqueLocal = localSuggestions.filter(s => !allIds.has(s.id));
          all = [...all, ...uniqueLocal];
        } catch (e) {
          console.log('No local suggestions found');
        }
        setAllSuggestions(all);
        const pending = all.filter(s => s.status === 'pending');
        setSuggestions(pending);
        setStats(prev => ({
          ...prev,
          pendingSuggestions: pending.length,
          totalSuggestions: all.length,
        }));
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        try {
          const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
          setAllSuggestions(localSuggestions);
          const pending = localSuggestions.filter(s => s.status === 'pending');
          setSuggestions(pending);
          setStats(prev => ({
            ...prev,
            pendingSuggestions: pending.length,
            totalSuggestions: localSuggestions.length,
          }));
        } catch (e) {
          setAllSuggestions([]);
          setSuggestions([]);
        }
      }

      // 5. 🔥 REVIEWS - FETCH FROM LOCALSTORAGE user_reviews
      try {
        const allReviews = JSON.parse(localStorage.getItem('user_reviews') || '[]');
        console.log('📊 All reviews from localStorage:', allReviews.length);
        
        // Filter reviews that are approved by guide (status: 'approved' or 'pending' for staff to review)
        const staffReviews = allReviews.filter(r => 
          r.status === 'approved' || r.status === 'pending' || r.status === 'rejected' || r.status === 'implemented'
        );
        
        setReviews(staffReviews);
        
        // Update stats with review counts
        const pendingReviews = staffReviews.filter(r => r.status === 'pending').length;
        const approvedReviews = staffReviews.filter(r => r.status === 'approved').length;
        const implementedReviews = staffReviews.filter(r => r.status === 'implemented').length;
        
        setStats(prev => ({
          ...prev,
          totalReviews: staffReviews.length,
          pendingReviews: pendingReviews,
          approvedReviews: approvedReviews,
          implementedReviews: implementedReviews,
        }));
        
        console.log('📊 Staff reviews:', staffReviews.length, 'pending:', pendingReviews, 'approved:', approvedReviews);
      } catch (error) {
        console.error('Error fetching reviews from localStorage:', error);
        setReviews([]);
      }

      // 6. Profile
      try {
        const profileRes = await api.get('/auth/me/');
        if (profileRes?.data?.success) {
          setProfile(profileRes.data.user);
          loadProfilePicture();
          setProfileForm({
            full_name: profileRes.data.user?.full_name || profileRes.data.user?.first_name || '',
            email: profileRes.data.user?.email || '',
            phone: profileRes.data.user?.phone || '',
            bio: profileRes.data.user?.bio || '',
            department: profileRes.data.user?.department || 'Staff',
            position: profileRes.data.user?.position || 'Staff Member',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'staff' && user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
    
    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'user_reviews' || e.key === 'hidden_gems_suggestions') {
        console.log('🔄 Storage changed, refreshing...');
        fetchData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, navigate, fetchData]);

  // ============================================
  // PROFILE UPDATE
  // ============================================
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/auth/update-profile/', {
        first_name: profileForm.full_name.split(' ')[0] || '',
        last_name: profileForm.full_name.split(' ').slice(1).join(' ') || '',
        phone: profileForm.phone,
        bio: profileForm.bio,
        department: profileForm.department,
        position: profileForm.position,
      });
      alert('✅ Profile updated successfully!');
      setIsEditingProfile(false);
      fetchData();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Failed to update profile');
    }
  };

  // ============================================
  // PROCESS SUGGESTION
  // ============================================
  const processSuggestion = async (id, action) => {
    setActionLoading(true);
    setProcessingId(id);
    try {
      if (action === 'delete') {
        if (!window.confirm('Are you sure you want to permanently delete this suggestion?')) {
          setActionLoading(false);
          setProcessingId(null);
          return;
        }
        try {
          const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
          const updated = localSuggestions.filter(s => s.id !== id);
          localStorage.setItem('hidden_gems_suggestions', JSON.stringify(updated));
        } catch (e) {
          console.log('Error updating localStorage:', e);
        }
        try {
          await api.delete(`/suggestions/${id}/`);
        } catch (e) {
          console.log('API delete failed, but removed from localStorage:', e);
        }
        alert('🗑️ Suggestion deleted successfully!');
        fetchData();
        if (showSuggestionModal) {
          setShowSuggestionModal(false);
          setSelectedSuggestion(null);
        }
        setActionLoading(false);
        setProcessingId(null);
        return;
      }

      let notes = '';
      if (action === 'reject') {
        notes = prompt('Reason for rejection:');
        if (notes === null) { 
          setActionLoading(false);
          setProcessingId(null);
          return; 
        }
      } else if (action === 'implement') {
        notes = `✅ Implemented by Staff: ${user?.email || 'Staff'}`;
      } else if (action === 'approve') {
        notes = `✅ Approved by Staff: ${user?.email || 'Staff'}`;
      } else {
        notes = `Processed by ${user?.email || 'Staff'}`;
      }
      
      try {
        const response = await api.post(`/staff/suggestions/${id}/process/`, {
          action,
          notes: notes || `Processed by ${user?.email || 'Staff'}`
        });
        if (response?.data?.success) {
          alert(`✅ Suggestion ${action}ed successfully!`);
          fetchData();
          if (showSuggestionModal) {
            setShowSuggestionModal(false);
            setSelectedSuggestion(null);
          }
          setActionLoading(false);
          setProcessingId(null);
          return;
        }
      } catch (error) {
        console.error('API process failed, trying localStorage fallback:', error);
      }
      
      try {
        const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
        const updated = localSuggestions.map(s => {
          if (s.id === id) {
            const now = new Date().toISOString();
            const newStatus = action === 'approve' ? 'approved' : 
                           action === 'implement' ? 'implemented' : 'rejected';
            return { 
              ...s, 
              status: newStatus,
              processed_at: now,
              processed_by: user?.email || 'staff',
              admin_notes: notes || `Processed by ${user?.email || 'Staff'}`,
              staff_approved: action === 'approve' ? user?.email : s.staff_approved,
              staff_implemented: action === 'implement' ? user?.email : s.staff_implemented,
              staff_rejected: action === 'reject' ? user?.email : s.staff_rejected,
            };
          }
          return s;
        });
        localStorage.setItem('hidden_gems_suggestions', JSON.stringify(updated));
        window.dispatchEvent(new StorageEvent('storage', { key: 'hidden_gems_suggestions' }));
        
        alert(`✅ Suggestion ${action}ed successfully!`);
        fetchData();
        if (showSuggestionModal) {
          setShowSuggestionModal(false);
          setSelectedSuggestion(null);
        }
      } catch (e) {
        alert('❌ Failed to process suggestion');
        console.error(e);
      }
    } catch (error) {
      alert('❌ Failed to process suggestion');
      console.error(error);
    } finally {
      setActionLoading(false);
      setProcessingId(null);
    }
  };

  // ============================================
  // PROCESS REVIEW - FIXED FOR LOCALSTORAGE
  // ============================================
  const processReview = async (reviewId, action) => {
    setActionLoading(true);
    try {
      // Get all reviews from localStorage
      const allReviews = JSON.parse(localStorage.getItem('user_reviews') || '[]');
      
      // Find the review
      const reviewIndex = allReviews.findIndex(r => r.id === reviewId);
      if (reviewIndex === -1) {
        alert('❌ Review not found');
        setActionLoading(false);
        return;
      }
      
      const review = allReviews[reviewIndex];
      const now = new Date().toISOString();
      
      // Update the review status
      let newStatus = '';
      let notes = '';
      
      if (action === 'approve') {
        newStatus = 'approved';
        notes = `✅ Approved by Staff: ${user?.email || 'Staff'}`;
      } else if (action === 'reject') {
        newStatus = 'rejected';
        notes = prompt('Reason for rejection:') || 'Rejected by Staff';
      } else if (action === 'implement') {
        newStatus = 'implemented';
        notes = `✅ Implemented by Staff: ${user?.email || 'Staff'}`;
      } else {
        alert('❌ Invalid action');
        setActionLoading(false);
        return;
      }
      
      // Update the review
      const updatedReview = {
        ...review,
        status: newStatus,
        processed_at: now,
        processed_by: user?.email || 'staff',
        staff_notes: notes,
        staff_approved: action === 'approve' ? user?.email : review.staff_approved,
        staff_implemented: action === 'implement' ? user?.email : review.staff_implemented,
        staff_rejected: action === 'reject' ? user?.email : review.staff_rejected,
      };
      
      allReviews[reviewIndex] = updatedReview;
      
      // Save back to localStorage
      localStorage.setItem('user_reviews', JSON.stringify(allReviews));
      
      // Dispatch storage event to update other components
      window.dispatchEvent(new StorageEvent('storage', { key: 'user_reviews' }));
      window.dispatchEvent(new CustomEvent('reviewUpdated', { detail: { reviewId, action } }));
      
      alert(`✅ Review ${action}ed successfully!`);
      fetchData();
      
    } catch (error) {
      console.error('Error processing review:', error);
      alert('❌ Failed to process review');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // ADD GUIDE
  // ============================================
  const handleAddGuide = async (e) => {
    e.preventDefault();
    setGuideLoading(true);
    try {
      const guideData = {
        full_name: guideForm.full_name,
        email: guideForm.email,
        password: guideForm.password,
        phone: guideForm.phone,
        bio: guideForm.bio,
        experience_years: parseInt(guideForm.experience_years) || 0,
        languages: guideForm.languages,
        primary_district: guideForm.primary_district,
        price_per_day: parseFloat(guideForm.price_per_day) || 0,
        price_per_hour: parseFloat(guideForm.price_per_hour) || 0,
        is_verified: autoVerify,
      };
      
      const res = await api.post('/staff/guides/add/', guideData);
      if (res?.data?.success) {
        setNewGuidePassword(res.data.password || guideForm.password || 'TempPass123');
        setShowPasswordModal(true);
        setShowAddGuide(false);
        setGuideForm({
          full_name: '', email: '', password: '',
          phone: '', bio: '',
          experience_years: '0', languages: '', primary_district: '',
          price_per_day: '0', price_per_hour: '0'
        });
        fetchData();
        alert('✅ Guide added successfully!');
      } else {
        alert(res?.data?.error || 'Failed to add guide');
      }
    } catch (error) {
      console.error('Add guide error:', error);
      alert(error.response?.data?.error || 'Failed to add guide. Please check all fields.');
    } finally {
      setGuideLoading(false);
    }
  };

  // ============================================
  // VERIFY GUIDE
  // ============================================
  const verifyGuide = async (id) => {
    try {
      const response = await api.post(`/staff/guides/${id}/verify/`);
      if (response?.data?.success) {
        alert('✅ Guide verified successfully!');
        fetchData();
      } else {
        alert(response?.data?.error || 'Failed to verify guide');
      }
    } catch (error) {
      console.error('Verify guide error:', error);
      alert('Failed to verify guide');
    }
  };

  // ============================================
  // DELETE GUIDE
  // ============================================
  const deleteGuide = async (id) => {
    if (!window.confirm('Delete this guide?')) return;
    try {
      const response = await api.delete(`/staff/guides/${id}/delete/`);
      if (response?.data?.success) {
        alert('Guide deleted successfully');
        fetchData();
      } else {
        alert(response?.data?.error || 'Failed to delete guide');
      }
    } catch (error) {
      console.error('Delete guide error:', error);
      alert('Failed to delete guide');
    }
  };

  // ============================================
  // GET FILTERED SUGGESTIONS & REVIEWS
  // ============================================
  const getFilteredSuggestions = () => {
    if (suggestionFilter === 'all') return allSuggestions;
    return allSuggestions.filter(s => s.status === suggestionFilter);
  };

  const getFilteredReviews = () => {
    if (reviewFilter === 'all') return reviews;
    return reviews.filter(r => r.status === reviewFilter);
  };

  const filteredSuggestions = getFilteredSuggestions();
  const filteredReviews = getFilteredReviews();

  // ============================================
  // GET STATUS COLOR
  // ============================================
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'implemented': 'bg-blue-100 text-blue-700',
      'rejected': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': '⏳ Pending',
      'approved': '✅ Approved',
      'implemented': '🚀 Implemented',
      'rejected': '❌ Rejected',
    };
    return labels[status] || status;
  };

  const openSuggestionModal = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowSuggestionModal(true);
  };

  const initials = (name) =>
    !name ? '?' : name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF6EA]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#C79A3E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#5C6E69]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF6EA]">
      {/* Header */}
      <header className="bg-[#072E2A] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C79A3E]/20 flex items-center justify-center">
              <span className="text-xl">👔</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Staff Dashboard</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#C79A3E] text-[#072E2A] px-2 py-0.5 rounded-full font-semibold">STAFF</span>
                <span className="text-xs text-[#E4C77B]">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div 
              className="w-10 h-10 rounded-full border-2 border-[#C79A3E] overflow-hidden cursor-pointer flex items-center justify-center bg-[#0E5C53]"
              onClick={() => fileInputRef.current?.click()}
            >
              {profilePicture ? (
                <img src={profilePicture} alt="Staff" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-[#E4C77B]">
                  {user?.email?.[0]?.toUpperCase() || 'S'}
                </span>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureUpload}
              disabled={uploading}
            />
            {uploading && (
              <div className="absolute -top-1 -right-1 w-4 h-4">
                <div className="w-4 h-4 border-2 border-[#C79A3E] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
              {profilePicture ? 'Change Photo' : 'Add Photo'}
            </div>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-[#C79A3E] text-[#072E2A] rounded-lg hover:bg-[#E4C77B] transition font-medium">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending Suggestions</p>
                <p className="text-3xl font-bold text-[#F59E0B]">{stats.pendingSuggestions || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Suggestions</p>
                <p className="text-3xl font-bold text-[#8B5CF6]">{stats.totalSuggestions || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Guides</p>
                <p className="text-3xl font-bold text-[#10B981]">{stats.totalGuides || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl">🧭</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Reviews</p>
                <p className="text-3xl font-bold text-[#EC4899]">{stats.totalReviews || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending Reviews</p>
                <p className="text-3xl font-bold text-[#F59E0B]">{stats.pendingReviews || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto pb-1">
          {['overview', 'suggestions', 'guides', 'bookings', 'reviews', 'profile'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition rounded-t-lg ${
                activeTab === tab
                  ? 'bg-[#072E2A] text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'suggestions' && `💡 Suggestions (${allSuggestions.length})`}
              {tab === 'guides' && `🧭 Guides (${guides.length})`}
              {tab === 'bookings' && `📅 Bookings (${bookings.length})`}
              {tab === 'reviews' && `⭐ Reviews (${reviews.length})`}
              {tab === 'profile' && `👤 Profile`}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">📅 Recent Bookings</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{bookings.length} total</span>
              </div>
              {bookings.slice(0, 5).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No recent bookings</p>
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div>
                        <p className="font-medium text-sm">{b.traveler_email || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">📍 {b.destination || b.district?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-400">👤 {b.guide_name} • {b.date}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">⭐ Reviews from Guides</h3>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">{reviews.length} total</span>
              </div>
              {reviews.slice(0, 5).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No reviews from guides yet</p>
              ) : (
                <div className="space-y-3">
                  {reviews.slice(0, 5).map(r => (
                    <div key={r.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div>
                        <p className="font-medium text-sm">{r.destination || r.name || 'Untitled'}</p>
                        <p className="text-xs text-gray-500">👤 {r.user_email || 'Anonymous'} • 📍 {r.district || 'N/A'}</p>
                        {r.rating && <p className="text-xs text-yellow-500">{'★'.repeat(Math.round(r.rating))}</p>}
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        r.status === 'approved' ? 'bg-green-100 text-green-700' :
                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        r.status === 'implemented' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {r.status || 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUGGESTIONS TAB */}
        {activeTab === 'suggestions' && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setSuggestionFilter('all')}
                className={`px-4 py-2 text-sm rounded-full transition font-medium ${
                  suggestionFilter === 'all' 
                    ? 'bg-[#072E2A] text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                All ({allSuggestions.length})
              </button>
              <button
                onClick={() => setSuggestionFilter('pending')}
                className={`px-4 py-2 text-sm rounded-full transition font-medium ${
                  suggestionFilter === 'pending' 
                    ? 'bg-yellow-600 text-white shadow-lg' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                ⏳ Pending ({allSuggestions.filter(s => s.status === 'pending').length})
              </button>
              <button
                onClick={() => setSuggestionFilter('approved')}
                className={`px-4 py-2 text-sm rounded-full transition font-medium ${
                  suggestionFilter === 'approved' 
                    ? 'bg-green-600 text-white shadow-lg' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                ✅ Approved ({allSuggestions.filter(s => s.status === 'approved').length})
              </button>
              <button
                onClick={() => setSuggestionFilter('implemented')}
                className={`px-4 py-2 text-sm rounded-full transition font-medium ${
                  suggestionFilter === 'implemented' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                🚀 Implemented ({allSuggestions.filter(s => s.status === 'implemented').length})
              </button>
              <button
                onClick={() => setSuggestionFilter('rejected')}
                className={`px-4 py-2 text-sm rounded-full transition font-medium ${
                  suggestionFilter === 'rejected' 
                    ? 'bg-red-600 text-white shadow-lg' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                ❌ Rejected ({allSuggestions.filter(s => s.status === 'rejected').length})
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">District</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuggestions.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-gray-500">No suggestions found</td></tr>
                    ) : (
                      filteredSuggestions.map(s => (
                        <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium">{s.name || 'Untitled'}</td>
                          <td className="px-4 py-3">{s.user?.email || s.user_email || 'Anonymous'}</td>
                          <td className="px-4 py-3">{s.district || 'N/A'}</td>
                          <td className="px-4 py-3">{s.category || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(s.status)}`}>
                              {getStatusLabel(s.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {s.status === 'pending' && (
                                <>
                                  <button onClick={() => processSuggestion(s.id, 'approve')} disabled={processingId === s.id || actionLoading} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition">Approve</button>
                                  <button onClick={() => processSuggestion(s.id, 'reject')} disabled={processingId === s.id || actionLoading} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition">Reject</button>
                                  <button onClick={() => processSuggestion(s.id, 'implement')} disabled={processingId === s.id || actionLoading} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">Implement</button>
                                </>
                              )}
                              {s.status === 'approved' && (
                                <>
                                  <button onClick={() => processSuggestion(s.id, 'implement')} disabled={processingId === s.id || actionLoading} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">🚀 Implement</button>
                                  <button onClick={() => processSuggestion(s.id, 'reject')} disabled={processingId === s.id || actionLoading} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition">❌ Reject</button>
                                </>
                              )}
                              {s.status === 'implemented' && <span className="text-xs text-gray-400 px-2 py-1">✅ Implemented</span>}
                              {s.status === 'rejected' && <span className="text-xs text-gray-400 px-2 py-1">❌ Rejected</span>}
                              <button onClick={() => processSuggestion(s.id, 'delete')} disabled={processingId === s.id || actionLoading} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition">Delete</button>
                              <button onClick={() => openSuggestionModal(s)} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">View</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Guides Tab */}
        {activeTab === 'guides' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-lg">🧭 Guides</h3>
                <p className="text-sm text-gray-500">Manage your tour guides</p>
              </div>
              <button onClick={() => setShowAddGuide(true)} className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition shadow-md hover:shadow-lg font-medium">
                + Add Guide
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {guides.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p className="text-lg">No guides found</p>
                  <p className="text-sm">Click "Add Guide" to create your first guide!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">District</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Verified</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guides.map(g => (
                        <tr key={g.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium">{g.full_name}</td>
                          <td className="px-4 py-3">{g.email}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                              {g.primary_district || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${g.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {g.is_verified ? '✅ Verified' : '⏳ Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {!g.is_verified && (
                                <button onClick={() => verifyGuide(g.id)} className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-medium">
                                  Verify
                                </button>
                              )}
                              <button onClick={() => deleteGuide(g.id)} className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-medium">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg">📅 All Bookings</h3>
              <p className="text-sm text-gray-500">View all bookings made by travelers</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Traveler</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Guide</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">📍 Place</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No bookings found</td></tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono text-xs">{b.booking_id || b.id}</td>
                        <td className="px-4 py-3">{b.traveler_email || 'Anonymous'}</td>
                        <td className="px-4 py-3"><span className="font-medium">{b.guide_name}</span></td>
                        <td className="px-4 py-3">{b.date}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                            {b.destination || b.district?.name || b.place || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {b.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 🔥 REVIEWS TAB - FIXED WITH IMAGES */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">⭐ Reviews from Guides</h3>
                  <p className="text-sm text-gray-500">Reviews approved by guides - Staff can approve/reject/implement</p>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={reviewFilter} 
                    onChange={(e) => setReviewFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                  >
                    <option value="all">All ({reviews.length})</option>
                    <option value="pending">⏳ Pending ({reviews.filter(r => r.status === 'pending').length})</option>
                    <option value="approved">✅ Approved ({reviews.filter(r => r.status === 'approved').length})</option>
                    <option value="implemented">🚀 Implemented ({reviews.filter(r => r.status === 'implemented').length})</option>
                    <option value="rejected">❌ Rejected ({reviews.filter(r => r.status === 'rejected').length})</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Photo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">District</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">No reviews found</td></tr>
                  ) : (
                    filteredReviews.map(r => (
                      <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          {r.image ? (
                            <img 
                              src={r.image} 
                              alt={r.destination || r.name} 
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Crect width="48" height="48" fill="%23f3f4f6"/%3E%3Ctext x="24" y="28" font-size="20" text-anchor="middle" fill="%239ca3af"%3E📷%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-2xl border border-gray-200">
                              📷
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{r.destination || r.name || 'Untitled'}</td>
                        <td className="px-4 py-3">{r.user_email || 'Anonymous'}</td>
                        <td className="px-4 py-3">{r.district || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="text-yellow-500">{'★'.repeat(Math.round(r.rating || 0))}</span>
                          <span className="text-gray-300">{'☆'.repeat(5 - Math.round(r.rating || 0))}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(r.status)}`}>
                            {getStatusLabel(r.status || 'pending')}
                          </span>
                          {r.guide_approved && (
                            <p className="text-xs text-green-600 mt-1">✅ Guide approved</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {r.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => processReview(r.id, 'approve')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-medium"
                                >
                                  Approve ✅
                                </button>
                                <button
                                  onClick={() => processReview(r.id, 'reject')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-medium"
                                >
                                  Reject ❌
                                </button>
                                <button
                                  onClick={() => processReview(r.id, 'implement')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-medium"
                                >
                                  Implement 🚀
                                </button>
                              </>
                            )}
                            {r.status === 'approved' && (
                              <>
                                <button
                                  onClick={() => processReview(r.id, 'implement')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-medium"
                                >
                                  Implement 🚀
                                </button>
                                <button
                                  onClick={() => processReview(r.id, 'reject')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-medium"
                                >
                                  Reject ❌
                                </button>
                              </>
                            )}
                            {r.status === 'implemented' && (
                              <span className="text-xs text-green-600 px-2 py-1">✅ Implemented</span>
                            )}
                            {r.status === 'rejected' && (
                              <span className="text-xs text-red-600 px-2 py-1">❌ Rejected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold">👤 Staff Profile</h3>
                <p className="text-sm text-gray-500">Manage your personal information</p>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  isEditingProfile 
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-md' 
                    : 'bg-[#072E2A] text-[#E4C77B] hover:bg-[#0B2422] shadow-md hover:shadow-lg'
                }`}
              >
                {isEditingProfile ? '💾 Save Changes' : '✏️ Edit Profile'}
              </button>
            </div>

            {/* Profile Picture Section */}
            <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
              <div className="relative">
                <div 
                  className="w-24 h-24 rounded-full border-2 border-[#C79A3E] overflow-hidden cursor-pointer flex items-center justify-center bg-[#0E5C53] shadow-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-[#E4C77B]">
                      {user?.email?.[0]?.toUpperCase() || 'S'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-[#072E2A] text-[#E4C77B] rounded-full p-1.5 border border-[#C79A3E] hover:bg-[#0B2422] transition shadow-md"
                  title="Upload profile picture"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xl font-semibold text-[#072E2A]">
                  {profile?.first_name || user?.first_name || 'Staff Member'}
                </h4>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-[#C79A3E]/20 text-[#C79A3E] px-2 py-0.5 rounded-full font-medium">
                    {profile?.department || 'Staff'}
                  </span>
                  <span className="text-xs bg-[#072E2A]/10 text-[#072E2A] px-2 py-0.5 rounded-full font-medium">
                    {profile?.position || 'Staff Member'}
                  </span>
                </div>
              </div>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A] bg-gray-50"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      disabled
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
                      placeholder="Tourism Department"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={profileForm.position}
                      onChange={(e) => setProfileForm({...profileForm, position: e.target.value})}
                      placeholder="Staff Member"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      rows="3"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition shadow-md hover:shadow-lg font-medium"
                  >
                    💾 Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Full Name</p>
                  <p className="text-sm font-semibold text-[#072E2A]">
                    {profile?.first_name || user?.first_name || 'Not set'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
                  <p className="text-sm font-semibold text-[#072E2A]">{user?.email}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Phone</p>
                  <p className="text-sm font-semibold text-[#072E2A]">
                    {profile?.phone || 'Not set'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Department</p>
                  <p className="text-sm font-semibold text-[#072E2A]">
                    {profile?.department || 'Staff'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Position</p>
                  <p className="text-sm font-semibold text-[#072E2A]">
                    {profile?.position || 'Staff Member'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase font-medium">Role</p>
                  <p className="text-sm font-semibold text-[#C79A3E]">
                    {user?.role || 'staff'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-medium">Bio</p>
                  <p className="text-sm text-[#072E2A]">
                    {profile?.bio || 'No bio provided.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SUGGESTION DETAIL MODAL */}
      {showSuggestionModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-[#072E2A]">{selectedSuggestion.name}</h3>
              <button onClick={() => setShowSuggestionModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            {selectedSuggestion.image && (
              <div className="mb-4">
                <img 
                  src={selectedSuggestion.image} 
                  alt={selectedSuggestion.name} 
                  className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">User</p>
                <p className="font-medium">{selectedSuggestion.user?.email || selectedSuggestion.user_email || 'Anonymous'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">District</p>
                <p className="font-medium">{selectedSuggestion.district || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{selectedSuggestion.category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSuggestion.status)}`}>
                  {getStatusLabel(selectedSuggestion.status)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">Location Info</p>
              <p className="text-sm">{selectedSuggestion.location_info || 'N/A'}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-sm text-gray-700">{selectedSuggestion.description || 'No description'}</p>
            </div>

            {selectedSuggestion.processed_by && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Processed By</p>
                <p className="text-sm font-medium">
                  {selectedSuggestion.processed_by?.email || selectedSuggestion.processed_by || 'Unknown'}
                </p>
                {selectedSuggestion.guide_approved && (
                  <p className="text-xs text-green-600">✅ Guide approved: {selectedSuggestion.guide_approved}</p>
                )}
                {selectedSuggestion.guide_rejected && (
                  <p className="text-xs text-red-600">❌ Guide rejected: {selectedSuggestion.guide_rejected}</p>
                )}
                {selectedSuggestion.staff_approved && (
                  <p className="text-xs text-blue-600">👔 Staff approved: {selectedSuggestion.staff_approved}</p>
                )}
                {selectedSuggestion.staff_implemented && (
                  <p className="text-xs text-purple-600">🚀 Staff implemented: {selectedSuggestion.staff_implemented}</p>
                )}
                {selectedSuggestion.processed_at && (
                  <p className="text-xs text-gray-400">{new Date(selectedSuggestion.processed_at).toLocaleString()}</p>
                )}
              </div>
            )}

            {selectedSuggestion.admin_notes && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Admin Notes</p>
                <p className="text-sm">{selectedSuggestion.admin_notes}</p>
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 flex-wrap">
              {selectedSuggestion.status === 'pending' && (
                <>
                  <button
                    onClick={() => processSuggestion(selectedSuggestion.id, 'approve')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => processSuggestion(selectedSuggestion.id, 'reject')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-medium"
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => processSuggestion(selectedSuggestion.id, 'implement')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                  >
                    🚀 Implement
                  </button>
                </>
              )}
              
              {selectedSuggestion.status === 'approved' && (
                <>
                  <button
                    onClick={() => processSuggestion(selectedSuggestion.id, 'implement')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                  >
                    🚀 Implement
                  </button>
                  <button
                    onClick={() => processSuggestion(selectedSuggestion.id, 'reject')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-medium"
                  >
                    ❌ Reject
                  </button>
                </>
              )}
              
              <button
                onClick={() => processSuggestion(selectedSuggestion.id, 'delete')}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition disabled:opacity-50 font-medium"
              >
                🗑️ Delete Permanently
              </button>
              <button
                onClick={() => setShowSuggestionModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GUIDE MODAL */}
      {showAddGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Add New Guide</h3>
            <form onSubmit={handleAddGuide}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={guideForm.full_name}
                    onChange={(e) => setGuideForm({...guideForm, full_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={guideForm.email}
                    onChange={(e) => setGuideForm({...guideForm, email: e.target.value})}
                    placeholder="guide@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Set a password for the guide"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={guideForm.password}
                    onChange={(e) => setGuideForm({...guideForm, password: e.target.value})}
                  />
                  <p className="text-xs text-gray-400 mt-1">This password will be used to login</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={guideForm.phone}
                    onChange={(e) => setGuideForm({...guideForm, phone: e.target.value})}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    rows="3"
                    value={guideForm.bio}
                    onChange={(e) => setGuideForm({...guideForm, bio: e.target.value})}
                    placeholder="Experienced tour guide with 5 years of experience..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={guideForm.experience_years}
                      onChange={(e) => setGuideForm({...guideForm, experience_years: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Languages</label>
                    <input
                      type="text"
                      placeholder="English, Malayalam, Hindi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={guideForm.languages}
                      onChange={(e) => setGuideForm({...guideForm, languages: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Primary District *</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={guideForm.primary_district}
                    onChange={(e) => setGuideForm({...guideForm, primary_district: e.target.value})}
                  >
                    <option value="">Select District</option>
                    {KERALA_DISTRICTS.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price/Day ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={guideForm.price_per_day}
                      onChange={(e) => setGuideForm({...guideForm, price_per_day: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price/Hour ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={guideForm.price_per_hour}
                      onChange={(e) => setGuideForm({...guideForm, price_per_hour: e.target.value})}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoVerify}
                        onChange={(e) => setAutoVerify(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#072E2A]/25 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#072E2A]"></div>
                      <span className="ms-3 text-sm font-medium text-gray-700">
                        {autoVerify ? '✅ Auto-Verify Guide' : '⏳ Manual Verification Required'}
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-14">
                    {autoVerify 
                      ? 'Guide will be immediately visible in "Book a Guide" section' 
                      : 'Guide will appear as "Pending" and need manual verification'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddGuide(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={guideLoading}
                  className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition disabled:opacity-50 shadow-md hover:shadow-lg font-medium"
                >
                  {guideLoading ? 'Adding...' : 'Add Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-2">✅ Guide Added Successfully!</h3>
            <p className="text-sm text-gray-600 mb-4">Guide can now login with these credentials:</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-mono font-semibold">{guideForm.email}</p>
              <p className="text-sm text-gray-500 mt-2">Password</p>
              <p className="font-mono font-semibold text-[#C79A3E]">{newGuidePassword || guideForm.password || 'TempPass123'}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`Email: ${guideForm.email}\nPassword: ${newGuidePassword || guideForm.password}`);
                  alert('Copied to clipboard!');
                }}
                className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition font-medium"
              >
                Copy Credentials
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
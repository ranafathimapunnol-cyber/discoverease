// pages/Profile.jsx - FIXED VERSION WITH WORKING BIO AND PHONE FETCHING

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ============================================
// ICON COMPONENTS
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2-2z" />
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
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
  Eye: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  ArrowRight: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  Refresh: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Calendar: (p) => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  ),
  Trip: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
      <path d="M12 11v3M9 13h6" />
    </svg>
  ),
};

// ============================================
// ✅ GET IMAGE URL
// ============================================
const getImageUrl = (item) => {
  if (!item) return null;

  const fields = ['primary_image', 'image_url', 'image', 'images_data'];
  
  for (const field of fields) {
    const value = item[field];
    if (!value) continue;
    
    if (typeof value === 'string') {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
      }
      if (value.startsWith('/media/') || value.startsWith('/uploads/')) {
        return `http://localhost:8000${value}`;
      }
      if (value.length > 0 && !value.startsWith('http')) {
        return `http://localhost:8000${value}`;
      }
    }
    
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (first?.image) {
        const url = first.image;
        if (typeof url === 'string') {
          if (url.startsWith('http://') || url.startsWith('https://')) return url;
          if (url.startsWith('/media/') || url.startsWith('/uploads/')) {
            return `http://localhost:8000${url}`;
          }
        }
      }
    }
  }

  return null;
};

// ============================================
// ✅ STATUS HELPERS
// ============================================
const getStatusCategory = (status) => {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s === 'pending' || s === 'pending_guide' || s === 'pending_admin') return 'pending';
  if (s === 'approved' || s === 'approved_by_guide' || s === 'approved_by_admin' || s === 'staff_approved') return 'approved';
  if (s === 'implemented') return 'implemented';
  if (s === 'rejected' || s === 'rejected_by_guide' || s === 'rejected_by_admin' || s === 'staff_rejected') return 'rejected';
  return 'pending';
};

const getStatusColor = (status) => {
  const colors = {
    'pending': '#D97706',
    'approved': '#16A34A',
    'implemented': '#2563EB',
    'rejected': '#DC2626',
  };
  return colors[getStatusCategory(status)] || '#6B7280';
};

const getStatusBg = (status) => {
  const colors = {
    'pending': '#FEF3C7',
    'approved': '#DCFCE7',
    'implemented': '#DBEAFE',
    'rejected': '#FEE2E2',
  };
  return colors[getStatusCategory(status)] || '#F3F4F6';
};

const getStatusLabel = (status) => {
  const labels = {
    'pending': '⏳ Pending',
    'approved': '✅ Approved',
    'implemented': '🎯 Implemented',
    'rejected': '❌ Rejected',
  };
  return labels[getStatusCategory(status)] || status;
};

// ============================================
// MAIN PROFILE COMPONENT
// ============================================
const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading, logout, updateUser } = useAuth();
  const [activeNav, setActiveNav] = useState('profile');
  const [scrolled, setScrolled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [profileData, setProfileData] = useState(null);
  
  // ✅ FIXED: Initialize stats with proper structure
  const [stats, setStats] = useState({
    total_trips: 0,
    completed_trips: 0,
    pending_trips: 0,
    confirmed_trips: 0,
    cancelled_trips: 0,
    rejected_trips: 0,
  });
  
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [suggestionStats, setSuggestionStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    implemented: 0,
    rejected: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ✅ FIXED: Initialize editData with proper bio and phone fields
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
  const [filterStatus, setFilterStatus] = useState('all');
  const fileInputRef = useRef(null);

  const isMountedRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (user) {
      setProfileData(user);
      // ✅ FIXED: Properly set editData with bio and phone
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',  // Make sure phone is included
        bio: user.bio || ''      // Make sure bio is included
      });
      loadProfilePicture();
    }
  }, [user]);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    fetchProfileData();
  }, [isLoggedIn, user]);

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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  // ============================================
  // ✅ GET SUGGESTION STATS FROM ARRAY
  // ============================================
  const getSuggestionStatsFromArray = (suggestions) => {
    if (!suggestions || !Array.isArray(suggestions)) {
      return { total: 0, pending: 0, approved: 0, implemented: 0, rejected: 0 };
    }
    
    let pending = 0;
    let approved = 0;
    let implemented = 0;
    let rejected = 0;
    
    suggestions.forEach(s => {
      const status = (s.status || '').toLowerCase();
      if (status === 'pending' || status === 'pending_guide' || status === 'pending_admin') {
        pending++;
      } else if (status === 'approved' || status === 'approved_by_guide' || status === 'approved_by_admin' || status === 'staff_approved') {
        approved++;
      } else if (status === 'implemented') {
        implemented++;
      } else if (status === 'rejected' || status === 'rejected_by_guide' || status === 'rejected_by_admin' || status === 'staff_rejected') {
        rejected++;
      }
    });
    
    return {
      total: suggestions.length,
      pending,
      approved,
      implemented,
      rejected,
    };
  };

  // In Profile.jsx - Updated handleDeleteSuggestion function
const handleDeleteSuggestion = async (suggestionId) => {
    // ✅ Find the suggestion to check its status
    const suggestion = userSuggestions.find(s => s.id === suggestionId);
    
    // ✅ Only allow deletion for pending suggestions
    if (!suggestion) {
        alert('❌ Suggestion not found.');
        return;
    }
    
    const statusCategory = getStatusCategory(suggestion.status);
    if (statusCategory !== 'pending') {
        alert(`❌ You can only delete pending suggestions. This suggestion is ${suggestion.status}.`);
        return;
    }
    
    if (!window.confirm('Are you sure you want to delete this suggestion? This action cannot be undone.')) {
        return;
    }

    setDeletingId(suggestionId);
    try {
        const response = await api.delete(`/suggestions/${suggestionId}/`);
        
        if (response.status === 204 || response.data?.success) {
            const updatedSuggestions = userSuggestions.filter(s => s.id !== suggestionId);
            setUserSuggestions(updatedSuggestions);
            const stats = getSuggestionStatsFromArray(updatedSuggestions);
            setSuggestionStats(stats);
            alert('✅ Suggestion deleted successfully!');
        } else {
            alert('❌ Failed to delete suggestion. Please try again.');
        }
    } catch (error) {
        console.error('Error deleting suggestion:', error);
        // ✅ Better error handling
        if (error.response?.status === 403) {
            const errorMsg = error.response?.data?.error || 'You do not have permission to delete this suggestion.';
            alert(`❌ ${errorMsg}\n\nYou can only delete suggestions that are in pending status.`);
        } else if (error.response?.status === 404) {
            alert('❌ Suggestion not found. It may have been already deleted.');
        } else {
            alert('❌ Failed to delete suggestion. Please try again.');
        }
    } finally {
        setDeletingId(null);
    }
};
  // ============================================
  // ✅ FETCH PROFILE DATA - FIXED WITH TRIP STATS
  // ============================================
  const fetchProfileData = async () => {
    if (isRefreshing || !isLoggedIn) return;

    setIsRefreshing(true);
    setError(null);

    try {
      console.log('🔄 Fetching user profile data...');
      
      // 1. Get user profile
      let profileResponse;
      try {
        profileResponse = await api.get('/auth/me/');
        console.log('📊 Profile response:', profileResponse.data);
      } catch (error) {
        console.error('❌ Failed to fetch profile:', error);
        profileResponse = null;
      }
      
      // 2. ✅ GET TRIP STATS - FIXED
      let tripStats = {
        total_trips: 0,
        completed_trips: 0,
        pending_trips: 0,
        confirmed_trips: 0,
        cancelled_trips: 0,
        rejected_trips: 0,
      };
      
      try {
        const statsResponse = await api.get('/auth/trip-stats/');
        console.log('📊 Trip stats response:', statsResponse.data);
        
        if (statsResponse.data?.success) {
          tripStats = {
            total_trips: statsResponse.data.total_trips || 0,
            completed_trips: statsResponse.data.completed_trips || 0,
            pending_trips: statsResponse.data.pending_trips || 0,
            confirmed_trips: statsResponse.data.confirmed_trips || 0,
            cancelled_trips: statsResponse.data.cancelled_trips || 0,
            rejected_trips: statsResponse.data.rejected_trips || 0,
          };
          console.log('✅ Trip stats loaded:', tripStats);
        } else {
          console.warn('⚠️ Trip stats response not successful:', statsResponse.data);
        }
      } catch (statsError) {
        console.error('❌ Error fetching trip stats:', statsError);
        // Keep default values
      }
      
      // 3. Get user's suggestions
      let suggestions = [];
      try {
        const suggestionsResponse = await api.get('/suggestions/my-suggestions/');
        console.log('📊 My suggestions raw response:', suggestionsResponse.data);
        
        const data = suggestionsResponse.data;
        
        // Try all possible paths
        const possiblePaths = [
          () => data?.results?.data,
          () => data?.results,
          () => data?.data,
          () => data,
          () => data?.results?.data?.data,
          () => data?.results?.results,
          () => data?.data?.results,
        ];
        
        let extracted = null;
        for (const pathFn of possiblePaths) {
          try {
            const result = pathFn();
            if (Array.isArray(result) && result.length > 0) {
              extracted = result;
              break;
            }
          } catch (e) {}
        }
        
        if (!extracted) {
          const findArray = (obj) => {
            if (!obj || typeof obj !== 'object') return null;
            if (Array.isArray(obj) && obj.length > 0) return obj;
            for (const key of Object.keys(obj)) {
              const val = obj[key];
              if (Array.isArray(val) && val.length > 0) return val;
              if (typeof val === 'object') {
                const found = findArray(val);
                if (found) return found;
              }
            }
            return null;
          };
          extracted = findArray(data);
        }
        
        suggestions = extracted || [];
        console.log(`✅ Found ${suggestions.length} suggestions`);
        
      } catch (suggestionsError) {
        console.error('❌ Error fetching user suggestions:', suggestionsError);
      }
      
      // ✅ Format suggestions
      const formattedSuggestions = suggestions.map(s => ({
        ...s,
        _type: 'suggestion',
        image: s.primary_image || s.image_url || s.image || null,
        name: s.name || s.title || 'Untitled',
        description: s.description || s.review_text || '',
        status: s.status || 'pending',
        category: s.category || 'Uncategorized',
        district: s.district || 'N/A',
        created_at: s.created_at || s.createdAt || new Date().toISOString(),
      }));
      
      // ✅ Update all states
      setUserSuggestions(formattedSuggestions);
      const suggStats = getSuggestionStatsFromArray(formattedSuggestions);
      setSuggestionStats(suggStats);
      
      // ✅ UPDATE STATS WITH TRIP DATA
      setStats(tripStats);
      
      console.log('📊 Updated stats:', tripStats);
      console.log('📊 User suggestions:', formattedSuggestions.length);
      console.log('📊 Suggestion stats:', suggStats);
      
      // ✅ UPDATE PROFILE DATA WITH BIO AND PHONE
      if (profileResponse?.data) {
        const userData = profileResponse.data.user || profileResponse.data;
        if (userData) {
          // ✅ IMPORTANT: Update profileData with complete user data including bio and phone
          setProfileData({
            ...userData,
            phone: userData.phone || '',
            bio: userData.bio || ''
          });
          
          // ✅ Update editData with bio and phone
          setEditData({
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            username: userData.username || '',
            email: userData.email || '',
            phone: userData.phone || '',
            bio: userData.bio || ''
          });
          
          // ✅ Update AuthContext user if possible
          if (updateUser) {
            updateUser({
              ...userData,
              phone: userData.phone || '',
              bio: userData.bio || ''
            });
          }
          
          console.log('✅ Profile updated with bio:', userData.bio);
          console.log('✅ Profile updated with phone:', userData.phone);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      if (isMountedRef.current) {
        setError('Failed to load profile data. Please refresh.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };

  // ============================================
  // PAGINATION HELPERS
  // ============================================
  const getFilteredItems = useCallback(() => {
    let items = [...userSuggestions];
    
    if (filterStatus !== 'all') {
      items = items.filter(item => {
        const statusCategory = getStatusCategory(item.status);
        return statusCategory === filterStatus;
      });
    }
    
    items.sort((a, b) => {
      const dateA = a.created_at || a.createdAt || a.date || '';
      const dateB = b.created_at || b.createdAt || b.date || '';
      return new Date(dateB) - new Date(dateA);
    });
    
    return items;
  }, [userSuggestions, filterStatus]);

  const getPaginatedItems = useCallback(() => {
    const filtered = getFilteredItems();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [getFilteredItems, currentPage, itemsPerPage]);

  const getTotalPages = useCallback(() => {
    const filtered = getFilteredItems();
    return Math.ceil(filtered.length / itemsPerPage);
  }, [getFilteredItems, itemsPerPage]);

  const paginatedItems = getPaginatedItems();
  const totalPages = getTotalPages();

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
        formData.append('profile_image', file);
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
  // ✅ PROFILE EDIT FUNCTIONS - FIXED
  // ============================================
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      console.log('💾 Saving profile with data:', editData);
      
      const response = await api.patch('/auth/update-profile/', editData);
      console.log('📊 Update response:', response.data);
      
      if (response.data.success) {
        alert('✅ Profile updated successfully!');
        setIsEditing(false);
        
        // ✅ IMPORTANT: Update local state with the new data
        const updatedUser = {
          ...profileData,
          ...editData,
          phone: editData.phone || '',
          bio: editData.bio || ''
        };
        
        // Update profileData state
        setProfileData(updatedUser);
        
        // Update AuthContext if available
        if (updateUser) {
          updateUser(updatedUser);
        }
        
        // ✅ Also update localStorage
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedStoredUser = {
            ...storedUser,
            ...editData,
            phone: editData.phone || '',
            bio: editData.bio || ''
          };
          localStorage.setItem('user', JSON.stringify(updatedStoredUser));
        } catch (e) {
          console.warn('Could not update localStorage:', e);
        }
        
        // Refresh data from server to ensure consistency
        await fetchProfileData();
        
        console.log('✅ Profile saved successfully with bio:', editData.bio);
        console.log('✅ Profile saved successfully with phone:', editData.phone);
      } else {
        alert('❌ ' + (response.data.error || 'Failed to update profile'));
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        alert('❌ Failed to update profile: ' + (error.response.data?.error || error.response.data?.message || 'Please try again.'));
      } else {
        alert('❌ Failed to update profile. Please try again.');
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profileData || user) {
      const data = profileData || user;
      setEditData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        username: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || ''
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
  // VIEW DETAILS
  // ============================================
  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // ============================================
  // REFRESH DATA
  // ============================================
  const handleRefresh = () => {
    if (isRefreshing) return;
    // Clear cache before refresh
    try {
      localStorage.removeItem('profile_suggestions');
      localStorage.removeItem('suggestions_data');
      localStorage.removeItem('local_insights');
    } catch (e) {}
    fetchProfileData();
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FBF6EA" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #E4C77B", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, color: "#5C6E69" }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return null;
  }

  // ✅ Use profileData for display to ensure bio and phone are shown
  const displayName = profileData?.first_name || user?.first_name || user?.username || 'User';
  const displayEmail = profileData?.email || user?.email || 'No email';
  const displayBio = profileData?.bio || user?.bio || '';
  const displayPhone = profileData?.phone || user?.phone || 'Not set';

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

  // ============================================
  // MAIN RENDER
  // ============================================
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
        .suggestion-card:hover { border-color: rgba(199,154,62,0.4) !important; box-shadow: 0 4px 14px rgba(11,36,34,0.08); transform: translateY(-2px); }
        .status-filter-btn { transition: all 0.2s ease; }
        .status-filter-btn:hover { border-color: #0E5C53; }
        .status-filter-btn.active { border-color: #0E5C53; background: #0E5C53; color: #fff; }
        .suggestion-image { object-fit: cover; border-radius: 6px; border: 1px solid rgba(199,154,62,0.15); }
        .pagination-btn { transition: all 0.2s ease; }
        .pagination-btn:hover:not(:disabled) { background: #C79A3E; color: #fff; }
        .pagination-btn.active { background: #C79A3E; color: #fff; }
        .view-btn:hover { background: #C79A3E; color: #fff; }
        .delete-btn:hover { background: #DC2626; color: #fff; border-color: #DC2626; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(7,46,42,0.6); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-content { background: #FBF6EA; border-radius: 16px; padding: 28px; max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(199,154,62,0.3); box-shadow: 0 20px 60px rgba(7,46,42,0.25); }
        .modal-image { width: 100%; max-height: 300px; object-fit: cover; border-radius: 10px; border: 1px solid rgba(199,154,62,0.15); }
        .action-btn { transition: all 0.2s ease; }
        .action-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .stat-card { transition: all 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(11,36,34,0.08); }
        @media (max-width: 640px) { .pf-two-col { grid-template-columns: 1fr !important; } .pf-stat-grid { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>

      {/* HEADER */}
      <div style={{ background: "#072E2A", padding: "40px 20px 34px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <Link to="/" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(199,154,62,0.5)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <Icon.Back stroke="#E4C77B" />
            </Link>
            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: '#E4C77B', 
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                opacity: isRefreshing ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: 1,
              }}
            >
              <Icon.Refresh /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
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
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(199,154,62,0.18)", padding: "28px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <div className="pf-profile-pic" style={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
              <div style={{ width: 92, height: 92, borderRadius: "50%", border: "1.5px solid #C79A3E", background: "#072E2A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: "#E4C77B", overflow: "hidden", cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
                {profilePicture ? <img src={profilePicture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user?.first_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="pf-overlay" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(7,46,42,0.62)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E4C77B", cursor: "pointer", flexDirection: "column", gap: 3 }} onClick={() => fileInputRef.current?.click()}>
                <Icon.Camera stroke="#E4C77B" /><span className="pf-font-mono" style={{ fontSize: 8 }}>Change</span>
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleProfilePictureUpload} disabled={uploading} />
              {uploading && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(7,46,42,0.7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E4C77B", fontSize: 10 }}>Uploading…</div>}
            </div>
            <div style={{ flex: 1 }}>
              <h2 className="pf-font-display" style={{ fontSize: 25, color: "#0B2422", margin: 0 }}>{displayName}</h2>
              <p style={{ color: "#5C6E69", fontSize: 13, margin: "4px 0 10px" }}>{displayEmail}</p>
              {/* ✅ Display Bio if available */}
              {displayBio && (
                <p style={{ color: "#4A5F5A", fontSize: 12, margin: "4px 0 8px", fontStyle: "italic" }}>"{displayBio}"</p>
              )}
      
            </div>
            <div>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="pf-font-mono" style={{ padding: "9px 18px", borderRadius: 999, border: "1px solid #C79A3E", background: "transparent", color: "#0B2422", fontSize: 10, cursor: "pointer" }}><Icon.Edit /> Edit</button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleSaveProfile} className="pf-font-mono" style={{ padding: "9px 18px", borderRadius: 999, border: "1px solid #0E5C53", background: "#0E5C53", color: "#fff", fontSize: 10, cursor: "pointer" }}><Icon.Save /> Save</button>
                  <button onClick={handleCancelEdit} className="pf-font-mono" style={{ padding: "9px 18px", borderRadius: 999, border: "1px solid #BE5A34", background: "transparent", color: "#BE5A34", fontSize: 10, cursor: "pointer" }}><Icon.Close /> Cancel</button>
                </div>
              )}
            </div>
          </div>
          
          {/* ✅ TRIP STATS - FIXED WITH REAL DATA */}
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 10 }}>
            <div className="stat-card" style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", textAlign: "center", border: "1px solid rgba(199,154,62,0.2)" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#0E5C53", margin: 0 }}>{stats.total_trips || 0}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: 0 }}>Total trips</p>
            </div>
            <div className="stat-card" style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", textAlign: "center", border: "1px solid rgba(199,154,62,0.2)" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#16A34A", margin: 0 }}>{stats.completed_trips || 0}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: 0 }}>Completed</p>
            </div>
            <div className="stat-card" style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", textAlign: "center", border: "1px solid rgba(199,154,62,0.2)" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#EAB308", margin: 0 }}>{stats.pending_trips || 0}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: 0 }}>Pending</p>
            </div>
            <div className="stat-card" style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", textAlign: "center", border: "1px solid rgba(199,154,62,0.2)" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#2563EB", margin: 0 }}>{stats.confirmed_trips || 0}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: 0 }}>Confirmed</p>
            </div>
            <div className="stat-card" style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", textAlign: "center", border: "1px solid rgba(199,154,62,0.2)" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#DC2626", margin: 0 }}>{stats.cancelled_trips || 0}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: 0 }}>Cancelled</p>
            </div>
          </div>
        </div>

        {/* ✅ ACCOUNT DETAILS CARD - FIXED WITH BIO AND PHONE */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(199,154,62,0.18)", padding: "26px" }}>
          <p className="pf-font-mono" style={{ fontSize: 10, color: "#0E5C53", margin: "0 0 16px" }}>Account details</p>
          {!isEditing ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(199,154,62,0.2)" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: "0 0 4px" }}>First name</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{profileData?.first_name || user?.first_name || '—'}</p>
              </div>
              <div style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(199,154,62,0.2)" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: "0 0 4px" }}>Last name</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{profileData?.last_name || user?.last_name || '—'}</p>
              </div>
              <div style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(199,154,62,0.2)" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: "0 0 4px" }}>Username</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{profileData?.username || user?.username || '—'}</p>
              </div>
              {/* ✅ PHONE FIELD - FIXED */}
              <div style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(199,154,62,0.2)" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: "0 0 4px" }}>Phone</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{displayPhone}</p>
              </div>
              <div style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(199,154,62,0.2)", gridColumn: "1 / -1" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: "0 0 4px" }}>Email</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{profileData?.email || user?.email || '—'}</p>
              </div>
              {/* ✅ BIO FIELD - FIXED */}
              <div style={{ background: "#FBF6EA", borderRadius: 8, padding: "12px 14px", border: "1px solid rgba(199,154,62,0.2)", gridColumn: "1 / -1" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: "0 0 4px" }}>Bio</p>
                <p style={{ fontWeight: 400, color: "#0B2422", margin: 0, fontSize: 14, fontStyle: displayBio ? 'italic' : 'normal' }}>{displayBio || 'No bio yet'}</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <input type="text" name="first_name" value={editData.first_name} onChange={handleEditChange} className="pf-input" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#FBF6EA" }} placeholder="First name" />
              <input type="text" name="last_name" value={editData.last_name} onChange={handleEditChange} className="pf-input" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#FBF6EA" }} placeholder="Last name" />
              <input type="text" name="username" value={editData.username} onChange={handleEditChange} className="pf-input" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#FBF6EA" }} placeholder="Username" />
              <input type="text" name="phone" value={editData.phone} onChange={handleEditChange} className="pf-input" style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#FBF6EA" }} placeholder="Phone" />
              <div style={{ gridColumn: "1 / -1" }}>
                <textarea 
                  name="bio" 
                  value={editData.bio} 
                  onChange={handleEditChange} 
                  className="pf-input" 
                  rows="3" 
                  style={{ 
                    width: "100%", 
                    padding: "10px 12px", 
                    border: "1px solid rgba(199,154,62,0.3)", 
                    borderRadius: 6, 
                    fontSize: 14, 
                    background: "#FBF6EA", 
                    resize: "vertical",
                    fontFamily: "'Inter','Segoe UI',sans-serif",
                  }} 
                  placeholder="Tell us about yourself..." 
                />
                <p style={{ fontSize: 10, color: "#8A9A95", margin: "4px 0 0" }}>Share your travel interests, favorite destinations, or a fun fact about yourself</p>
              </div>
            </div>
          )}
        </div>

        {/* CONTRIBUTIONS CARD - User's Suggestions */}
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(199,154,62,0.18)", padding: "26px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <p className="pf-font-mono" style={{ fontSize: 10, color: "#0E5C53", margin: 0 }}>My Suggestions</p>
              <p style={{ fontSize: 12, color: "#5C6E69", margin: "4px 0 0" }}>
                {userSuggestions.length || 0} suggestions submitted
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))", gap: 8, marginBottom: 14 }}>
            <div style={{ background: "#F4FAF8", borderRadius: 8, textAlign: "center", padding: "10px 8px" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#0E5C53", margin: 0 }}>{suggestionStats.total || 0}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, color: "#8A9A95", margin: 0 }}>Total</p>
            </div>
            <div style={{ background: "#FEF3C7", borderRadius: 8, textAlign: "center", padding: "10px 8px" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#D97706", margin: 0 }}>{suggestionStats.pending || 0}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, color: "#D97706", margin: 0 }}>Pending</p>
            </div>
            <div style={{ background: "#DCFCE7", borderRadius: 8, textAlign: "center", padding: "10px 8px" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#16A34A", margin: 0 }}>{suggestionStats.approved || 0}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, color: "#16A34A", margin: 0 }}>Approved</p>
            </div>
            <div style={{ background: "#DBEAFE", borderRadius: 8, textAlign: "center", padding: "10px 8px" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#2563EB", margin: 0 }}>{suggestionStats.implemented || 0}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, color: "#2563EB", margin: 0 }}>Live</p>
            </div>
            <div style={{ background: "#FEE2E2", borderRadius: 8, textAlign: "center", padding: "10px 8px" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#DC2626", margin: 0 }}>{suggestionStats.rejected || 0}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, color: "#DC2626", margin: 0 }}>Rejected</p>
            </div>
          </div>

          {/* Items List */}
          <div>
            {/* Status Filter */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {['all', 'pending', 'approved', 'implemented', 'rejected'].map((status) => {
                let count = 0;
                if (status === 'all') {
                  count = userSuggestions.length;
                } else {
                  userSuggestions.forEach(s => {
                    if (getStatusCategory(s.status) === status) count++;
                  });
                }
                
                return (
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
                      cursor: "pointer" 
                    }}
                  >
                    {status === 'all' ? 'All' : status} · {count}
                  </button>
                );
              })}
            </div>

            {/* Items */}
            <div style={{ maxHeight: 520, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {paginatedItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 16px", color: "#5C6E69", fontSize: 13, background: "#FBF6EA", borderRadius: 8 }}>
                  {filterStatus === 'all' ? "You haven't submitted any suggestions yet." : `No ${filterStatus} suggestions found.`}
                  {filterStatus === 'all' && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: 12, color: "#8A9A95" }}>Suggest a hidden gem or local insight!</p>
                      <button 
                        onClick={() => navigate('/local-insights')}
                        style={{ marginTop: 8, padding: "6px 16px", borderRadius: 999, border: "1px solid #C79A3E", background: "#C79A3E", color: "#fff", fontSize: 11, cursor: "pointer" }}
                      >
                        Go to Local Insights →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                paginatedItems.map((item, index) => {
                  const uniqueKey = `${item.id || index}-${Date.now()}-${index}`;
                  const imageUrl = getImageUrl(item);
                  const itemName = item.name || item.title || 'Untitled';
                  const itemDescription = item.description || '';
                  const itemDistrict = item.district || 'N/A';
                  const itemCategory = item.category || 'Uncategorized';
                  const itemStatus = item.status || 'pending';
                  const itemRating = item.rating || 0;
                  const statusCategory = getStatusCategory(itemStatus);
                  const createdDate = formatDate(item.created_at);

                  return (
                    <div key={uniqueKey} style={{ background: "#FBF6EA", padding: "14px 16px", borderRadius: 8, border: "1px solid rgba(199,154,62,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
                      {/* Image - Left */}
                      <div style={{ flexShrink: 0 }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt={itemName} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(199,154,62,0.15)" }} onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          <div style={{ width: 56, height: 56, borderRadius: 6, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                            💎
                          </div>
                        )}
                      </div>

                      {/* Content - Middle */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                          <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{itemName}</p>
                          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 999, background: 'rgba(14,92,83,0.15)', color: '#0E5C53' }}>💎 Suggestion</span>
                          <span style={{ fontSize: 9, padding: "2px 10px", borderRadius: 999, background: getStatusBg(itemStatus), color: getStatusColor(itemStatus), fontWeight: 500 }}>{getStatusLabel(itemStatus)}</span>
                          {itemRating > 0 && <span style={{ fontSize: 9, color: '#FF9800' }}>{'★'.repeat(Math.round(itemRating))}</span>}
                        </div>
                        
                        {/* District and Category */}
                        <p style={{ fontSize: 11, color: "#5C6E69", margin: "2px 0 0" }}>
                          {itemDistrict} · {itemCategory}
                        </p>
                        
                        {/* Description */}
                        {itemDescription && (
                          <p style={{ fontSize: 12, color: "#4A5F5A", margin: "4px 0 0" }}>
                            {itemDescription.length > 80 ? itemDescription.substring(0, 80) + '...' : itemDescription}
                          </p>
                        )}
                        
                        {/* Date - Small font */}
                        {createdDate && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                            <Icon.Calendar />
                            <span style={{ fontSize: 9, color: "#8A9A95" }}>{createdDate}</span>
                          </div>
                        )}
                        
                        {/* Rejection reason */}
                        {item.admin_notes && statusCategory === 'rejected' && 
                          <p style={{ fontSize: 10, color: "#DC2626", margin: "6px 0 0", background: "#FEE2E2", padding: "4px 8px", borderRadius: 4 }}>
                            Reason: {item.admin_notes}
                          </p>
                        }
                      </div>

                      {/* Action Buttons - Right side */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                        <button 
                          onClick={() => handleViewDetails(item)} 
                          className="view-btn" 
                          style={{ 
                            padding: "4px 12px", 
                            borderRadius: 999, 
                            border: "1px solid rgba(199,154,62,0.3)", 
                            background: "transparent", 
                            color: "#0E5C53", 
                            fontSize: 10, 
                            cursor: "pointer", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 4, 
                            transition: "all 0.2s ease",
                            whiteSpace: "nowrap"
                          }}
                        >
                          <Icon.Eye width="12" height="12" /> View
                        </button>
                        
                        {/* ✅ DELETE BUTTON */}
                        <button 
                          onClick={() => handleDeleteSuggestion(item.id)} 
                          className="delete-btn"
                          disabled={deletingId === item.id}
                          style={{ 
                            padding: "4px 12px", 
                            borderRadius: 999, 
                            border: "1px solid #EFCBB5", 
                            background: "transparent", 
                            color: "#DC2626", 
                            fontSize: 10, 
                            cursor: deletingId === item.id ? "not-allowed" : "pointer", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 4, 
                            transition: "all 0.2s ease",
                            whiteSpace: "nowrap",
                            opacity: deletingId === item.id ? 0.5 : 1
                          }}
                        >
                          <Icon.Trash width="12" height="12" /> 
                          {deletingId === item.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(199,154,62,0.15)" }}>
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(199,154,62,0.2)", background: "transparent", color: currentPage === 1 ? "#ccc" : "#0B2422", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4, opacity: currentPage === 1 ? 0.5 : 1 }}>
                  <Icon.ArrowLeft /> Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                  return (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} style={{ padding: "6px 12px", borderRadius: 6, border: currentPage === pageNum ? "1px solid #C79A3E" : "1px solid rgba(199,154,62,0.2)", background: currentPage === pageNum ? "#C79A3E" : "transparent", color: currentPage === pageNum ? "#fff" : "#0B2422", cursor: "pointer", fontSize: 12, fontWeight: currentPage === pageNum ? 600 : 400, minWidth: 32 }}>
                      {pageNum}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(199,154,62,0.2)", background: "transparent", color: currentPage === totalPages ? "#ccc" : "#0B2422", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4, opacity: currentPage === totalPages ? 0.5 : 1 }}>
                  Next <Icon.ArrowRight />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ACCOUNT ACTIONS - IMPROVED UI */}
        <div style={{ 
          background: "#fff", 
          borderRadius: 10, 
          border: "1px solid rgba(199,154,62,0.18)", 
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12
        }}>
          {/* Logout Button - Improved */}
          <button 
            onClick={handleLogout} 
            className="action-btn"
            style={{ 
              padding: "12px 20px", 
              borderRadius: 999, 
              border: "1px solid #DC2626", 
              background: "transparent", 
              color: "#DC2626", 
              fontSize: 12, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontWeight: 600,
              transition: "all 0.3s ease",
              width: "100%",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#DC2626";
              e.target.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = "#DC2626";
            }}
          >
            <Icon.Logout /> 
            <span>Logout</span>
          </button>
          
          {/* Delete Account - Smaller secondary action */}
          <button 
            onClick={() => setShowDeleteModal(true)} 
            style={{ 
              padding: "8px 16px", 
              borderRadius: 999, 
              border: "1px solid transparent", 
              background: "transparent", 
              color: "#9CA3AF", 
              fontSize: 11, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "#DC2626";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#9CA3AF";
            }}
          >
            <Icon.Delete width="12" height="12" /> Delete Account
          </button>
        </div>

        {error && <div style={{ padding: "12px 16px", background: "#FEE2E2", borderRadius: 8, border: "1px solid #FCA5A5", color: "#DC2626", fontSize: 14 }}>⚠️ {error}</div>}
      </div>

      {/* VIEW DETAILS MODAL */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h2 className="pf-font-display" style={{ fontSize: 22, color: "#0B2422", margin: 0 }}>{selectedItem.name || selectedItem.title || 'Details'}</h2>
              <button onClick={() => setShowDetailModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5C6E69", padding: 4 }}><Icon.Close width="20" height="20" /></button>
            </div>
            {(() => {
              const imgUrl = getImageUrl(selectedItem);
              return imgUrl ? <img src={imgUrl} alt={selectedItem.name || 'Details'} className="modal-image" onError={(e) => { e.target.style.display = 'none'; }} /> : <div style={{ width: "100%", height: 150, borderRadius: 10, background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>💎</div>;
            })()}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <span style={{ fontSize: 11, padding: "3px 12px", borderRadius: 999, background: getStatusBg(selectedItem.status || 'pending'), color: getStatusColor(selectedItem.status || 'pending') }}>{getStatusLabel(selectedItem.status || 'pending')}</span>
                {selectedItem.rating > 0 && <span style={{ fontSize: 11, padding: "3px 12px", borderRadius: 999, background: "#FEF3C7", color: "#D97706" }}>{'★'.repeat(Math.round(selectedItem.rating))} {selectedItem.rating}</span>}
                <span style={{ fontSize: 11, padding: "3px 12px", borderRadius: 999, background: "#F3F4F6", color: "#6B7280" }}>{selectedItem.district || 'N/A'}</span>
                <span style={{ fontSize: 11, padding: "3px 12px", borderRadius: 999, background: 'rgba(14,92,83,0.15)', color: '#0E5C53' }}>
                  💎 Suggestion
                </span>
              </div>
              <p style={{ fontSize: 14, color: "#4A5F5A", lineHeight: 1.6, marginBottom: 10 }}>{selectedItem.description || 'No description available.'}</p>
              {selectedItem.admin_notes && getStatusCategory(selectedItem.status) === 'rejected' && 
                <div style={{ background: "#FEE2E2", padding: "10px 14px", borderRadius: 8, border: "1px solid #FCA5A5", marginTop: 10 }}>
                  <p style={{ fontSize: 11, color: "#DC2626", margin: 0, fontWeight: 600 }}>📝 Admin Notes</p>
                  <p style={{ fontSize: 12, color: "#991B1B", margin: "4px 0 0" }}>{selectedItem.admin_notes}</p>
                </div>
              }
              {selectedItem.implemented_at && (
                <div style={{ background: "#DBEAFE", padding: "10px 14px", borderRadius: 8, border: "1px solid #93C5FD", marginTop: 10 }}>
                  <p style={{ fontSize: 11, color: "#1D4ED8", margin: 0, fontWeight: 600 }}>🎯 Implemented</p>
                  <p style={{ fontSize: 12, color: "#1E3A8A", margin: "4px 0 0" }}>Implemented on: {new Date(selectedItem.implemented_at).toLocaleDateString()}</p>
                  {selectedItem.implemented_by && <p style={{ fontSize: 12, color: "#1E3A8A", margin: "2px 0 0" }}>By: {selectedItem.implemented_by}</p>}
                </div>
              )}
            </div>
            <button onClick={() => setShowDetailModal(false)} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 999, border: "1px solid #C79A3E", background: "#C79A3E", color: "#fff", cursor: "pointer", fontSize: 12, width: "100%" }}>Close</button>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#FBEAE7", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon.Warning stroke="#BE5A34" /></div>
                <h2 className="pf-font-display" style={{ fontSize: 22, color: "#0B2422", margin: 0 }}>Delete account</h2>
              </div>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#5C6E69", padding: 4 }}><Icon.Close width="16" height="16" /></button>
            </div>
            <p style={{ fontSize: 13.5, color: "#5C6E69", marginBottom: 18, lineHeight: 1.55 }}>This action is <strong>permanent</strong> and cannot be undone. All of your data will be deleted.</p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 6 }}>Enter your password to confirm</label>
              <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Enter your password" style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 6, fontSize: 14, background: "#fff" }} onKeyPress={(e) => { if (e.key === 'Enter') handleDeleteAccount(); }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleDeleteAccount} disabled={deleteLoading} style={{ flex: 1, padding: "11px 20px", borderRadius: 999, border: "none", background: deleteLoading ? "#9CA3AF" : "#BE5A34", color: "#fff", fontSize: 11, cursor: deleteLoading ? "not-allowed" : "pointer", opacity: deleteLoading ? 0.7 : 1 }}>{deleteLoading ? 'Deleting…' : 'Confirm delete'}</button>
              <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }} style={{ flex: 1, padding: "11px 20px", borderRadius: 999, border: "1px solid #D1D5DB", background: "transparent", color: "#5C6E69", fontSize: 11, cursor: "pointer" }}>Cancel</button>
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
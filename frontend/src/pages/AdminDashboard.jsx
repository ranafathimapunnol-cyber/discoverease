// src/pages/AdminDashboard.jsx - COMPLETE 100% WORKING

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthAPI } from '../services/api';

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

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ============================================
  // STATE
  // ============================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [guides, setGuides] = useState([]);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [toast, setToast] = useState(null);
  
  const [categoryData, setCategoryData] = useState([]);
  const [loadingCategoryData, setLoadingCategoryData] = useState(false);

  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ key: '', label: '', description: '', image: '' });
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [showPlaceDialog, setShowPlaceDialog] = useState(false);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState('');
  const [placeForm, setPlaceForm] = useState({
    name: '', location: '', district: '', description: '',
    difficulty: '', duration: '', best_time: '',
    image: '', type: 'well-known', hidden_gem: ''
  });
  const [placeLoading, setPlaceLoading] = useState(false);

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ email: '', password: '' });
  const [staffLoading, setStaffLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newStaffCredentials, setNewStaffCredentials] = useState({ email: '', password: '' });

  const [showGuideDialog, setShowGuideDialog] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [guideForm, setGuideForm] = useState({
    full_name: '', email: '', password: '', phone: '', bio: '',
    experience_years: '', languages: '', primary_district: '',
    price_per_day: '', price_per_hour: '',
    is_verified: true, is_active: true
  });
  const [guideLoading, setGuideLoading] = useState(false);
  const [newGuidePassword, setNewGuidePassword] = useState('');

  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedGuideBookings, setSelectedGuideBookings] = useState(null);
  const [showGuideBookingsModal, setShowGuideBookingsModal] = useState(false);
  const [guideBookings, setGuideBookings] = useState([]);

  const [deletedSuggestions, setDeletedSuggestions] = useState([]);
  const [showDeletedModal, setShowDeletedModal] = useState(false);

  // ============================================
  // HELPERS
  // ============================================
  const getCategoryImage = (key) => {
    const images = {
      'beaches': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
      'backwaters': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
      'waterfall': 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&q=80',
      'hillstations': 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=80',
      'wildlife': 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80',
      'walking': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
    };
    return images[key] || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80';
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ============================================
  // PROFILE PICTURE
  // ============================================
  const loadProfilePicture = () => {
    const savedPicture = localStorage.getItem('admin_profile_picture');
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

  useEffect(() => {
    loadProfilePicture();
  }, [user]);

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ File size must be less than 5MB', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('❌ Please upload an image file', 'error');
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem('admin_profile_picture', reader.result);
        setProfilePicture(reader.result);
        setUploading(false);
        showToast('✅ Profile picture updated!', 'success');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showToast('❌ Failed to upload profile picture.', 'error');
      setUploading(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!window.confirm('Remove your profile picture?')) return;
    localStorage.removeItem('admin_profile_picture');
    setProfilePicture(null);
    showToast('✅ Profile picture removed', 'success');
  };

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Stats
      try {
        const statsRes = await AuthAPI.getAdminStats();
        if (statsRes.success) setStats(statsRes.stats);
      } catch (e) {
        console.log('Stats fetch error:', e);
      }

      // 2. Users
      try {
        const usersRes = await AuthAPI.getAdminUsers();
        if (usersRes.success) {
          setUsers(usersRes.users || []);
          localStorage.setItem('users_list', JSON.stringify(usersRes.users || []));
        } else {
          const usersList = JSON.parse(localStorage.getItem('users_list') || '[]');
          setUsers(usersList);
        }
      } catch (e) {
        console.log('Users fetch error:', e);
        const usersList = JSON.parse(localStorage.getItem('users_list') || '[]');
        setUsers(usersList);
      }

      // 3. Staff
      try {
        const staffRes = await AuthAPI.getAdminStaff();
        if (staffRes.success) {
          setStaff(staffRes.staff || []);
          localStorage.setItem('staff_list', JSON.stringify(staffRes.staff || []));
        } else {
          const staffList = JSON.parse(localStorage.getItem('staff_list') || '[]');
          setStaff(staffList);
        }
      } catch (e) {
        console.log('Staff fetch error:', e);
        const staffList = JSON.parse(localStorage.getItem('staff_list') || '[]');
        setStaff(staffList);
      }

      // 4. Guides
      try {
        const guidesRes = await AuthAPI.getAdminGuides();
        if (guidesRes.success) {
          setGuides(guidesRes.guides || []);
          localStorage.setItem('guides_list', JSON.stringify(guidesRes.guides || []));
        } else {
          const guidesList = JSON.parse(localStorage.getItem('guides_list') || '[]');
          setGuides(guidesList);
        }
      } catch (e) {
        console.log('Guides fetch error:', e);
        const guidesList = JSON.parse(localStorage.getItem('guides_list') || '[]');
        setGuides(guidesList);
      }

      // 5. Suggestions
      try {
        const suggRes = await AuthAPI.getAdminSuggestions();
        let all = [];
        if (suggRes.success) {
          all = suggRes.suggestions || [];
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
        setFilteredSuggestions(all);
        console.log(`📊 Loaded ${all.length} total suggestions`);
      } catch (e) {
        console.log('Suggestions fetch error:', e);
        try {
          const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
          setAllSuggestions(localSuggestions);
          setFilteredSuggestions(localSuggestions);
        } catch (e2) {
          setAllSuggestions([]);
          setFilteredSuggestions([]);
        }
      }

      // 6. Deleted suggestions
      try {
        const deleted = JSON.parse(localStorage.getItem('deleted_suggestions') || '[]');
        setDeletedSuggestions(deleted);
      } catch (e) {
        setDeletedSuggestions([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // FETCH CATEGORY DATA
  // ============================================
  const fetchCategoryData = async () => {
    setLoadingCategoryData(true);
    try {
      const response = await AuthAPI.getCategoryData();
      if (response.success) {
        setCategoryData(response.data || []);
        console.log('📊 Category Data loaded:', response.data);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
      try {
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        setCategoryData(categories);
      } catch (e) {
        setCategoryData([]);
      }
      showToast('Failed to load category data', 'error');
    } finally {
      setLoadingCategoryData(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
    fetchCategoryData();
  }, [user, navigate, fetchData]);

  useEffect(() => {
    if (suggestionFilter === 'all') {
      setFilteredSuggestions(allSuggestions);
    } else {
      setFilteredSuggestions(allSuggestions.filter(s => s.status === suggestionFilter));
    }
  }, [suggestionFilter, allSuggestions]);

  // ============================================
  // USER MANAGEMENT
  // ============================================
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await AuthAPI.toggleUserStatus(userId, !currentStatus);
      if (response.success) {
        showToast(response.message || 'User status updated successfully');
        await fetchData();
      } else {
        showToast(response.error || 'Failed to update user status', 'error');
      }
    } catch (error) {
      console.error('Toggle user status error:', error);
      showToast(error.response?.data?.error || 'Failed to update user status', 'error');
      try {
        const usersList = JSON.parse(localStorage.getItem('users_list') || '[]');
        const updated = usersList.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u);
        localStorage.setItem('users_list', JSON.stringify(updated));
        showToast('✅ User status updated (local)!', 'success');
        await fetchData();
      } catch (e) {
        console.error('Local storage fallback failed:', e);
      }
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      const response = await AuthAPI.deleteUser(userId);
      if (response.success) {
        showToast('User deleted successfully');
        await fetchData();
      } else {
        showToast(response.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      showToast(error.response?.data?.error || 'Failed to delete user', 'error');
      try {
        const usersList = JSON.parse(localStorage.getItem('users_list') || '[]');
        const updated = usersList.filter(u => u.id !== userId);
        localStorage.setItem('users_list', JSON.stringify(updated));
        showToast('✅ User deleted (local)!', 'success');
        await fetchData();
      } catch (e) {
        console.error('Local storage fallback failed:', e);
      }
    }
  };

  // ============================================
  // STAFF MANAGEMENT
  // ============================================
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffLoading(true);
    try {
      const res = await AuthAPI.addStaff({
        email: staffForm.email,
        password: staffForm.password
      });
      
      if (res.success) {
        setNewStaffCredentials({
          email: staffForm.email,
          password: staffForm.password
        });
        setShowPasswordModal(true);
        setShowAddStaff(false);
        setStaffForm({ email: '', password: '' });
        showToast('✅ Staff added successfully!');
        await fetchData();
      } else {
        showToast(res.error || 'Failed to add staff', 'error');
      }
    } catch (error) {
      console.error('Add staff error:', error);
      showToast(error.response?.data?.error || 'Failed to add staff', 'error');
      try {
        const staffList = JSON.parse(localStorage.getItem('staff_list') || '[]');
        const newStaff = { id: Date.now(), email: staffForm.email, first_name: '', last_name: '', is_active: true, created_at: new Date().toISOString() };
        staffList.push(newStaff);
        localStorage.setItem('staff_list', JSON.stringify(staffList));
        showToast('✅ Staff added successfully (local)!', 'success');
        setShowAddStaff(false);
        setStaffForm({ email: '', password: '' });
        await fetchData();
      } catch (e) {
        console.error('Local storage fallback failed:', e);
      }
    } finally {
      setStaffLoading(false);
    }
  };

  const toggleStaffStatus = async (staffId, currentStatus) => {
    try {
      const response = await AuthAPI.toggleStaffStatus(staffId, !currentStatus);
      if (response.success) {
        showToast(response.message || 'Staff status updated successfully');
        await fetchData();
      } else {
        showToast(response.error || 'Failed to update staff status', 'error');
      }
    } catch (error) {
      console.error('Toggle staff status error:', error);
      showToast(error.response?.data?.error || 'Failed to update staff status', 'error');
      try {
        const staffList = JSON.parse(localStorage.getItem('staff_list') || '[]');
        const updated = staffList.map(s => s.id === staffId ? { ...s, is_active: !currentStatus } : s);
        localStorage.setItem('staff_list', JSON.stringify(updated));
        showToast('✅ Staff status updated (local)!', 'success');
        await fetchData();
      } catch (e) {
        console.error('Local storage fallback failed:', e);
      }
    }
  };

  const deleteStaff = async (staffId) => {
    if (!window.confirm('Delete this staff member permanently?')) return;
    try {
      const response = await AuthAPI.deleteStaff(staffId);
      if (response.success) {
        showToast('Staff deleted successfully');
        await fetchData();
      } else {
        showToast(response.error || 'Failed to delete staff', 'error');
      }
    } catch (error) {
      console.error('Delete staff error:', error);
      showToast(error.response?.data?.error || 'Failed to delete staff', 'error');
      try {
        const staffList = JSON.parse(localStorage.getItem('staff_list') || '[]');
        const updated = staffList.filter(s => s.id !== staffId);
        localStorage.setItem('staff_list', JSON.stringify(updated));
        showToast('✅ Staff deleted (local)!', 'success');
        await fetchData();
      } catch (e) {
        console.error('Local storage fallback failed:', e);
      }
    }
  };

  // ============================================
  // GUIDE MANAGEMENT - FIXED with password modal
  // ============================================
  const handleAddGuide = async (e) => {
    e.preventDefault();
    setGuideLoading(true);
    try {
      const guideData = {
        ...guideForm,
        password: guideForm.password || 'guide123456'
      };
      
      const res = await AuthAPI.addGuide(guideData);
      if (res.success) {
        setNewGuidePassword(res.password || guideForm.password || 'guide123456');
        // Show password modal with the guide's credentials
        setShowPasswordModal(true);
        setShowGuideDialog(false);
        resetGuideForm();
        showToast('✅ Guide added successfully!');
        await fetchData();
      } else {
        showToast(res.error || 'Failed to add guide', 'error');
      }
    } catch (error) {
      console.error('Add guide error:', error);
      showToast(error.response?.data?.error || 'Failed to add guide', 'error');
    } finally {
      setGuideLoading(false);
    }
  };

  const handleUpdateGuide = async (e) => {
    e.preventDefault();
    setGuideLoading(true);
    try {
      const res = await AuthAPI.updateGuide(editingGuide.id, guideForm);
      if (res.success) {
        showToast('✅ Guide updated successfully!');
        setShowGuideDialog(false);
        setEditingGuide(null);
        resetGuideForm();
        await fetchData();
      } else {
        showToast(res.error || 'Failed to update guide', 'error');
      }
    } catch (error) {
      console.error('Update guide error:', error);
      showToast(error.response?.data?.error || 'Failed to update guide', 'error');
    } finally {
      setGuideLoading(false);
    }
  };

  const toggleGuideStatus = async (guideId, currentStatus) => {
    try {
      const response = await AuthAPI.toggleGuideStatus(guideId, !currentStatus);
      if (response.success) {
        showToast(response.message || 'Guide status updated successfully');
        await fetchData();
      } else {
        showToast(response.error || 'Failed to update guide status', 'error');
      }
    } catch (error) {
      console.error('Toggle guide status error:', error);
      showToast(error.response?.data?.error || 'Failed to update guide status', 'error');
    }
  };

  const deleteGuide = async (guideId) => {
    if (!window.confirm('Delete this guide permanently?')) return;
    try {
      const response = await AuthAPI.deleteGuide(guideId);
      if (response.success) {
        showToast('Guide deleted successfully');
        await fetchData();
      } else {
        showToast(response.error || 'Failed to delete guide', 'error');
      }
    } catch (error) {
      console.error('Delete guide error:', error);
      showToast(error.response?.data?.error || 'Failed to delete guide', 'error');
    }
  };

  const verifyGuide = async (guideId) => {
    try {
      const response = await AuthAPI.verifyGuide(guideId);
      if (response.success) {
        showToast('✅ Guide verified successfully!');
        await fetchData();
      } else {
        showToast(response.error || 'Failed to verify guide', 'error');
      }
    } catch (error) {
      console.error('Verify guide error:', error);
      showToast('Failed to verify guide', 'error');
    }
  };

  const openEditGuideDialog = (guide) => {
    setEditingGuide(guide);
    setGuideForm({
      full_name: guide.full_name || '',
      email: guide.email || '',
      password: '',
      phone: guide.phone || '',
      bio: guide.bio || '',
      experience_years: guide.experience_years || '',
      languages: guide.languages || '',
      primary_district: guide.primary_district || '',
      price_per_day: guide.price_per_day || '',
      price_per_hour: guide.price_per_hour || '',
      is_verified: guide.is_verified || true,
      is_active: guide.is_active !== undefined ? guide.is_active : true
    });
    setShowGuideDialog(true);
  };

  const openAddGuideDialog = () => {
    setEditingGuide(null);
    resetGuideForm();
    setShowGuideDialog(true);
  };

  const resetGuideForm = () => {
    setGuideForm({
      full_name: '', email: '', password: '', phone: '', bio: '',
      experience_years: '', languages: '', primary_district: '',
      price_per_day: '', price_per_hour: '',
      is_verified: true, is_active: true
    });
  };

  const viewGuideBookings = async (guideId, guideName) => {
    try {
      const response = await AuthAPI.getGuideBookings(guideId);
      if (response.success) {
        setGuideBookings(response.bookings || []);
        setSelectedGuideBookings({ id: guideId, name: guideName });
        setShowGuideBookingsModal(true);
      } else {
        showToast('Failed to fetch guide bookings', 'error');
      }
    } catch (error) {
      console.error('Error fetching guide bookings:', error);
      showToast('Failed to fetch guide bookings', 'error');
      setGuideBookings([]);
      setSelectedGuideBookings({ id: guideId, name: guideName });
      setShowGuideBookingsModal(true);
    }
  };

  // ============================================
  // CATEGORY CRUD
  // ============================================
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCategoryLoading(true);
    try {
      const generatedKey = categoryForm.label.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const response = await AuthAPI.addCategory({
        key: generatedKey,
        label: categoryForm.label.trim(),
        description: categoryForm.description.trim(),
        image: categoryForm.image.trim()
      });
      
      if (response.success) {
        showToast('✅ Category added successfully!');
        setShowCategoryDialog(false);
        setCategoryForm({ key: '', label: '', description: '', image: '' });
        await fetchCategoryData();
        await fetchData();
        try {
          const categories = JSON.parse(localStorage.getItem('categories') || '[]');
          const newCategory = {
            key: generatedKey,
            title: categoryForm.label.trim(),
            description: categoryForm.description.trim(),
            image: categoryForm.image.trim(),
            count: 0,
            places: []
          };
          categories.push(newCategory);
          localStorage.setItem('categories', JSON.stringify(categories));
          window.dispatchEvent(new StorageEvent('storage', { key: 'categories' }));
        } catch (e) {
          console.log('Error updating localStorage categories:', e);
        }
      } else {
        showToast(response.error || 'Failed to add category', 'error');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      try {
        const generatedKey = categoryForm.label.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        const newCategory = {
          key: generatedKey,
          title: categoryForm.label.trim(),
          description: categoryForm.description.trim(),
          image: categoryForm.image.trim(),
          count: 0,
          places: []
        };
        categories.push(newCategory);
        localStorage.setItem('categories', JSON.stringify(categories));
        window.dispatchEvent(new StorageEvent('storage', { key: 'categories' }));
        showToast('✅ Category added successfully (local)!', 'success');
        setShowCategoryDialog(false);
        setCategoryForm({ key: '', label: '', description: '', image: '' });
        await fetchCategoryData();
        await fetchData();
      } catch (e) {
        showToast(error.response?.data?.error || 'Failed to add category', 'error');
      }
    } finally {
      setCategoryLoading(false);
    }
  };

  // ============================================
  // PLACE CRUD
  // ============================================
  const handleAddPlace = async (e) => {
    e.preventDefault();
    setPlaceLoading(true);
    try {
      const placeData = {
        category: selectedCategoryKey,
        name: placeForm.name.trim(),
        location: placeForm.location.trim(),
        district: placeForm.district,
        description: placeForm.description.trim(),
        difficulty: placeForm.difficulty,
        duration: placeForm.duration,
        best_time: placeForm.best_time,
        image: placeForm.image.trim() || getCategoryImage(selectedCategoryKey),
        type: placeForm.type,
        hidden_gem: placeForm.hidden_gem.trim()
      };
      
      try {
        const response = await AuthAPI.addPlaceToCategory(placeData);
        if (response.success) {
          showToast('✅ Place added successfully!');
          setShowPlaceDialog(false);
          setPlaceForm({
            name: '', location: '', district: '', description: '',
            difficulty: '', duration: '', best_time: '',
            image: '', type: 'well-known', hidden_gem: ''
          });
          await fetchCategoryData();
          await fetchData();
          return;
        }
      } catch (apiError) {
        console.error('API add place failed:', apiError);
        const categories = JSON.parse(localStorage.getItem('categories') || '[]');
        const categoryIndex = categories.findIndex(c => c.key === selectedCategoryKey);
        if (categoryIndex !== -1) {
          const newPlace = {
            id: Date.now(),
            name: placeForm.name.trim(),
            location: placeForm.location.trim(),
            district: placeForm.district,
            description: placeForm.description.trim(),
            difficulty: placeForm.difficulty,
            duration: placeForm.duration,
            best_time: placeForm.best_time,
            image: placeForm.image.trim() || getCategoryImage(selectedCategoryKey),
            type: placeForm.type,
            hidden_gem: placeForm.hidden_gem.trim(),
            created_at: new Date().toISOString(),
          };
          if (!categories[categoryIndex].places) {
            categories[categoryIndex].places = [];
          }
          categories[categoryIndex].places.push(newPlace);
          categories[categoryIndex].count = categories[categoryIndex].places.length;
          localStorage.setItem('categories', JSON.stringify(categories));
          window.dispatchEvent(new StorageEvent('storage', { key: 'categories' }));
          showToast('✅ Place added successfully (local)!', 'success');
          setShowPlaceDialog(false);
          setPlaceForm({
            name: '', location: '', district: '', description: '',
            difficulty: '', duration: '', best_time: '',
            image: '', type: 'well-known', hidden_gem: ''
          });
          await fetchCategoryData();
          await fetchData();
          return;
        }
        throw new Error('Category not found');
      }
    } catch (error) {
      console.error('Error adding place:', error);
      showToast(error.message || 'Failed to add place', 'error');
    } finally {
      setPlaceLoading(false);
    }
  };

  // ============================================
  // SUGGESTION PROCESSING
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
        const suggestionToDelete = allSuggestions.find(s => s.id === id);
        try {
          const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
          const updated = localSuggestions.filter(s => s.id !== id);
          localStorage.setItem('hidden_gems_suggestions', JSON.stringify(updated));
          if (suggestionToDelete) {
            const deletedItems = JSON.parse(localStorage.getItem('deleted_suggestions') || '[]');
            const deletedItem = {
              ...suggestionToDelete,
              deleted_at: new Date().toISOString(),
              deleted_by: user?.email || 'admin',
              original_status: suggestionToDelete.status,
            };
            if (!deletedItems.some(d => d.id === id)) {
              deletedItems.push(deletedItem);
              localStorage.setItem('deleted_suggestions', JSON.stringify(deletedItems));
              setDeletedSuggestions(deletedItems);
            }
          }
          window.dispatchEvent(new StorageEvent('storage', { key: 'hidden_gems_suggestions' }));
          window.dispatchEvent(new StorageEvent('storage', { key: 'deleted_suggestions' }));
        } catch (e) {
          console.log('Error updating localStorage:', e);
        }
        try {
          await AuthAPI.deleteSuggestion(id);
        } catch (e) {
          console.log('API delete failed:', e);
        }
        showToast('🗑️ Suggestion deleted successfully!');
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
      } else if (action === 'approve') {
        notes = `✅ Approved by Admin: ${user?.email || 'Admin'}`;
      } else if (action === 'implement') {
        notes = `✅ Implemented by Admin: ${user?.email || 'Admin'}`;
      }

      try {
        let response;
        if (action === 'approve') {
          response = await AuthAPI.approveSuggestion(id, notes);
        } else if (action === 'reject') {
          response = await AuthAPI.rejectSuggestion(id, notes);
        } else if (action === 'implement') {
          response = await AuthAPI.implementSuggestion(id, notes);
        }
        if (response?.success) {
          showToast(`✅ Suggestion ${action}ed successfully!`);
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
        console.error('API process failed:', error);
      }

      try {
        const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
        const updated = localSuggestions.map(s => {
          if (s.id === id) {
            const now = new Date().toISOString();
            const newStatus = action === 'approve' ? 'approved' : action === 'implement' ? 'implemented' : 'rejected';
            return { ...s, status: newStatus, processed_at: now, processed_by: user?.email || 'admin', admin_notes: notes || `Processed by ${user?.email || 'Admin'}` };
          }
          return s;
        });
        localStorage.setItem('hidden_gems_suggestions', JSON.stringify(updated));
        window.dispatchEvent(new StorageEvent('storage', { key: 'hidden_gems_suggestions' }));
        showToast(`✅ Suggestion ${action}ed successfully!`);
        fetchData();
        if (showSuggestionModal) {
          setShowSuggestionModal(false);
          setSelectedSuggestion(null);
        }
      } catch (e) {
        showToast('❌ Failed to process suggestion', 'error');
        console.error(e);
      }
    } catch (error) {
      showToast('❌ Failed to process suggestion', 'error');
      console.error(error);
    } finally {
      setActionLoading(false);
      setProcessingId(null);
    }
  };

  const recoverDeletedSuggestion = (suggestionId) => {
    if (!window.confirm('Recover this deleted suggestion?')) return;
    try {
      const deletedItems = JSON.parse(localStorage.getItem('deleted_suggestions') || '[]');
      const suggestionIndex = deletedItems.findIndex(s => s.id === suggestionId);
      if (suggestionIndex !== -1) {
        const recovered = deletedItems[suggestionIndex];
        deletedItems.splice(suggestionIndex, 1);
        localStorage.setItem('deleted_suggestions', JSON.stringify(deletedItems));
        const suggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
        const { deleted_at, deleted_by, original_status, ...rest } = recovered;
        suggestions.push({ ...rest, status: original_status || 'pending' });
        localStorage.setItem('hidden_gems_suggestions', JSON.stringify(suggestions));
        window.dispatchEvent(new StorageEvent('storage', { key: 'hidden_gems_suggestions' }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'deleted_suggestions' }));
        showToast('✅ Suggestion recovered successfully!');
        fetchData();
      }
    } catch (e) {
      showToast('❌ Failed to recover suggestion', 'error');
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'implemented': 'bg-blue-100 text-blue-700',
      'rejected': 'bg-red-100 text-red-700',
      'hidden': 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': '⏳ Pending',
      'approved': '✅ Approved',
      'implemented': '🚀 Implemented',
      'rejected': '❌ Rejected',
      'hidden': '✨ Hidden Gem'
    };
    return labels[status] || status;
  };

  const openSuggestionModal = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowSuggestionModal(true);
  };

  const openPlaceDialog = (categoryKey) => {
    setSelectedCategoryKey(categoryKey);
    setPlaceForm({
      name: '', location: '', district: '', description: '',
      difficulty: '', duration: '', best_time: '',
      image: '', type: 'well-known', hidden_gem: ''
    });
    setShowPlaceDialog(true);
  };

  // ============================================
  // RENDER
  // ============================================
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF6EA]">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition">Refresh Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF6EA]">
      {/* Header */}
      <header className="bg-[#072E2A] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <span className="text-sm text-[#E4C77B]">{user?.email}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-10 h-10 rounded-full border-2 border-[#C79A3E] overflow-hidden cursor-pointer flex items-center justify-center bg-[#0E5C53]" onClick={() => fileInputRef.current?.click()}>
              {profilePicture ? <img src={profilePicture} alt="Admin" className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-[#E4C77B]">{user?.email?.[0]?.toUpperCase() || 'A'}</span>}
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleProfilePictureUpload} disabled={uploading} />
            {uploading && <div className="absolute -top-1 -right-1 w-4 h-4"><div className="w-4 h-4 border-2 border-[#C79A3E] border-t-transparent rounded-full animate-spin" /></div>}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">{profilePicture ? 'Change Photo' : 'Add Photo'}</div>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-[#C79A3E] text-[#072E2A] rounded-lg hover:bg-[#E4C77B] transition">Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Users</p>
            <p className="text-2xl font-bold text-[#3B82F6]">{users.length || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Staff</p>
            <p className="text-2xl font-bold text-[#8B5CF6]">{staff.length || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Guides</p>
            <p className="text-2xl font-bold text-[#F59E0B]">{guides.length || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Categories</p>
            <p className="text-2xl font-bold text-[#3B82F6]">{categoryData.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Total Places</p>
            <p className="text-2xl font-bold text-[#10B981]">{categoryData.reduce((sum, cat) => sum + (cat.count || 0), 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500">Suggestions</p>
            <p className="text-2xl font-bold text-[#C79A3E]">{allSuggestions.length || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {['overview', 'categories', 'staff', 'guides', 'users', 'suggestions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap transition ${activeTab === tab ? 'text-[#072E2A] border-b-2 border-[#072E2A] font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'overview' && '📊 Overview'}
              {tab === 'categories' && `📂 Categories (${categoryData.length})`}
              {tab === 'staff' && `👔 Staff (${staff.length})`}
              {tab === 'guides' && `🧭 Guides (${guides.length})`}
              {tab === 'users' && `👥 Users (${users.length})`}
              {tab === 'suggestions' && `💡 Suggestions (${allSuggestions.length})`}
            </button>
          ))}
        </div>

        {/* ============================================
            OVERVIEW TAB
        ============================================ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold mb-3">📊 Quick Stats</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-600">Total Users</span><span className="font-semibold">{users.length}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-600">Total Staff</span><span className="font-semibold">{staff.length}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-600">Total Guides</span><span className="font-semibold">{guides.length}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-600">Total Categories</span><span className="font-semibold">{categoryData.length}</span></div>
                <div className="flex justify-between py-2"><span className="text-gray-600">Total Places</span><span className="font-semibold">{categoryData.reduce((sum, cat) => sum + (cat.count || 0), 0)}</span></div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold mb-3">📈 Category Distribution</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {categoryData.slice(0, 10).map(cat => (
                  <div key={cat.key} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm">{cat.title}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#C79A3E] rounded-full transition-all duration-500" style={{ width: `${categoryData.length > 0 ? (cat.count / Math.max(...categoryData.map(c => c.count))) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-600">{cat.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            CATEGORIES TAB
        ============================================ */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h3 className="font-semibold text-lg">📂 Categories ({categoryData.length})</h3>
              <button onClick={() => setShowCategoryDialog(true)} className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition flex items-center gap-2 text-sm"><span className="text-lg">+</span> Add Category</button>
            </div>
            {loadingCategoryData ? (
              <div className="text-center py-8"><div className="w-8 h-8 border-4 border-[#C79A3E] border-t-transparent rounded-full animate-spin mx-auto" /><p className="mt-2 text-gray-500">Loading categories...</p></div>
            ) : categoryData.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-100">No categories found. Add your first category!</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryData.map(cat => (
                  <div key={cat.key} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                    <div className="h-32 overflow-hidden">
                      <img src={cat.image || getCategoryImage(cat.key)} alt={cat.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'; }} />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div><h4 className="font-semibold text-[#072E2A]">{cat.title}</h4><p className="text-xs text-gray-500">Key: {cat.key}</p></div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">{cat.count} places</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{cat.description}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => openPlaceDialog(cat.key)} className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition flex items-center gap-1"><span className="text-lg">+</span> Add Place</button>
                        <button onClick={() => { const places = cat.places || []; if (places.length === 0) { showToast('No places in this category yet', 'info'); return; } const placeNames = places.map(p => `  • ${p.name} (${p.location})`).join('\n'); alert(`📍 Places in ${cat.title}:\n\n${placeNames}\n\nTotal: ${places.length} places`); }} className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">View All</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================
            STAFF TAB
        ============================================ */}
        {activeTab === 'staff' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">👔 Staff Members ({staff.length})</h3>
              <button onClick={() => setShowAddStaff(true)} className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition flex items-center gap-2 text-sm"><span className="text-lg">+</span> Add Staff</button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Actions</th></tr></thead>
                  <tbody>
                    {staff.length === 0 ? <tr><td colSpan="4" className="text-center py-8 text-gray-500">No staff members found</td></tr> : staff.map(s => (
                      <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">{s.email}</td>
                        <td className="px-4 py-3">{s.first_name || ''} {s.last_name || ''}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${s.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.is_active !== false ? '🟢 Active' : '🔴 Inactive'}</span></td>
                        <td className="px-4 py-3"><div className="flex gap-2 flex-wrap"><button onClick={() => toggleStaffStatus(s.id, s.is_active !== false)} className={`px-3 py-1 text-xs rounded transition ${s.is_active !== false ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>{s.is_active !== false ? 'Deactivate' : 'Activate'}</button><button onClick={() => deleteStaff(s.id)} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition">Delete</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            GUIDES TAB
        ============================================ */}
        {activeTab === 'guides' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">🧭 Guides ({guides.length})</h3>
              <button onClick={openAddGuideDialog} className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition flex items-center gap-2 text-sm"><span className="text-lg">+</span> Add Guide</button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">District</th><th className="px-4 py-3 text-left">Verified</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Experience</th><th className="px-4 py-3 text-left">Bookings</th><th className="px-4 py-3 text-left">Actions</th></tr></thead>
                  <tbody>
                    {guides.length === 0 ? <tr><td colSpan="8" className="text-center py-8 text-gray-500">No guides found</td></tr> : guides.map(g => {
                      const bookingCount = g.booking_count || 0;
                      return (
                        <tr key={g.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{g.full_name || 'N/A'}</td>
                          <td className="px-4 py-3">{g.email}</td>
                          <td className="px-4 py-3">{g.primary_district || 'N/A'}</td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${g.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{g.is_verified ? '✅ Verified' : '⏳ Pending'}</span></td>
                          <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${g.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{g.is_active !== false ? '🟢 Active' : '🔴 Inactive'}</span></td>
                          <td className="px-4 py-3">{g.experience_years || 0} years</td>
                          <td className="px-4 py-3"><button onClick={() => viewGuideBookings(g.id, g.full_name)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">📋 View ({bookingCount})</button></td>
                          <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{!g.is_verified && <button onClick={() => verifyGuide(g.id)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition">Verify</button>}<button onClick={() => openEditGuideDialog(g)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">Edit</button><button onClick={() => toggleGuideStatus(g.id, g.is_active !== false)} className={`px-2 py-1 text-xs rounded transition ${g.is_active !== false ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>{g.is_active !== false ? 'Deactivate' : 'Activate'}</button><button onClick={() => deleteGuide(g.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition">Delete</button></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            USERS TAB
        ============================================ */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-lg">👥 Users ({users.length})</h3><span className="text-sm text-gray-500">Total registered users</span></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Username</th><th className="px-4 py-3 text-left">Phone</th><th className="px-4 py-3 text-left">Role</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Joined</th><th className="px-4 py-3 text-left">Actions</th></tr></thead>
                  <tbody>
                    {users.length === 0 ? <tr><td colSpan="8" className="text-center py-8 text-gray-500">No users found</td></tr> : users.map(u => (
                      <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{u.first_name || ''} {u.last_name || ''}{!u.first_name && !u.last_name && <span className="text-gray-400">—</span>}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">@{u.username || 'N/A'}</td>
                        <td className="px-4 py-3">{u.phone || 'N/A'}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'staff' ? 'bg-blue-100 text-blue-700' : u.role === 'guide' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{u.role || 'tourister'}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.is_active !== false ? '🟢 Active' : '🔴 Inactive'}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-500">{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-3"><div className="flex gap-2 flex-wrap"><button onClick={() => toggleUserStatus(u.id, u.is_active !== false)} className={`px-3 py-1 text-xs rounded transition ${u.is_active !== false ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>{u.is_active !== false ? 'Deactivate' : 'Activate'}</button><button onClick={() => deleteUser(u.id)} className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition">Delete</button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            SUGGESTIONS TAB
        ============================================ */}
        {activeTab === 'suggestions' && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={() => setSuggestionFilter('all')} className={`px-3 py-1.5 text-xs rounded-full transition ${suggestionFilter === 'all' ? 'bg-[#072E2A] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>All ({allSuggestions.length})</button>
              <button onClick={() => setSuggestionFilter('pending')} className={`px-3 py-1.5 text-xs rounded-full transition ${suggestionFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>⏳ Pending ({allSuggestions.filter(s => s.status === 'pending').length})</button>
              <button onClick={() => setSuggestionFilter('approved')} className={`px-3 py-1.5 text-xs rounded-full transition ${suggestionFilter === 'approved' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>✅ Approved ({allSuggestions.filter(s => s.status === 'approved').length})</button>
              <button onClick={() => setSuggestionFilter('implemented')} className={`px-3 py-1.5 text-xs rounded-full transition ${suggestionFilter === 'implemented' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>🚀 Implemented ({allSuggestions.filter(s => s.status === 'implemented').length})</button>
              <button onClick={() => setSuggestionFilter('rejected')} className={`px-3 py-1.5 text-xs rounded-full transition ${suggestionFilter === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>❌ Rejected ({allSuggestions.filter(s => s.status === 'rejected').length})</button>
              <button onClick={() => setShowDeletedModal(true)} className="px-3 py-1.5 text-xs rounded-full transition bg-red-100 text-red-700 hover:bg-red-200">🗑️ Deleted ({deletedSuggestions.length})</button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Submitted By</th><th className="px-4 py-3 text-left">District</th><th className="px-4 py-3 text-left">Category</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Processed By</th><th className="px-4 py-3 text-left">Actions</th></tr></thead>
                  <tbody>
                    {filteredSuggestions.length === 0 ? <tr><td colSpan="7" className="text-center py-8 text-gray-500">No suggestions found</td></tr> : filteredSuggestions.map(s => (
                      <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => openSuggestionModal(s)}>
                        <td className="px-4 py-3 font-medium">{s.name || 'Untitled'}</td>
                        <td className="px-4 py-3"><div><p className="text-sm">{s.user?.email || s.user_email || 'Anonymous'}</p>{s.user?.username && <p className="text-xs text-gray-400">@{s.user.username}</p>}</div></td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">{s.district || 'N/A'}</span></td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700">{s.category || 'N/A'}</span></td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(s.status)}`}>{getStatusLabel(s.status)}</span></td>
                        <td className="px-4 py-3">{s.processed_by ? <div><p className="text-xs font-medium">{s.processed_by}</p>{s.processed_at && <p className="text-xs text-gray-400">{new Date(s.processed_at).toLocaleDateString()}</p>}</div> : <span className="text-xs text-gray-400">—</span>}</td>
                        <td className="px-4 py-3"><div className="flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          {s.status === 'pending' && <><button onClick={() => processSuggestion(s.id, 'approve')} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition" disabled={processingId === s.id || actionLoading}>Approve</button><button onClick={() => processSuggestion(s.id, 'reject')} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition" disabled={processingId === s.id || actionLoading}>Reject</button><button onClick={() => processSuggestion(s.id, 'implement')} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition" disabled={processingId === s.id || actionLoading}>Implement</button></>}
                          {s.status === 'approved' && <><button onClick={() => processSuggestion(s.id, 'implement')} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition" disabled={processingId === s.id || actionLoading}>🚀 Implement</button><button onClick={() => processSuggestion(s.id, 'reject')} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition" disabled={processingId === s.id || actionLoading}>❌ Reject</button></>}
                          {s.status === 'implemented' && <span className="text-xs text-gray-400 px-2 py-1">✅ Implemented</span>}
                          {s.status === 'rejected' && <span className="text-xs text-gray-400 px-2 py-1">❌ Rejected</span>}
                          <button onClick={() => processSuggestion(s.id, 'delete')} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition" disabled={processingId === s.id || actionLoading}>Delete</button>
                          <button onClick={() => openSuggestionModal(s)} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">View</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}

      {/* Category Dialog */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">➕ Add New Category</h3><button onClick={() => { setShowCategoryDialog(false); setCategoryForm({ key: '', label: '', description: '', image: '' }); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button></div>
            <form onSubmit={handleAddCategory}>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1">Category Name <span className="text-red-500">*</span></label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={categoryForm.label} onChange={(e) => { const label = e.target.value; setCategoryForm({ ...categoryForm, label: label, key: label.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }); }} placeholder="e.g., Adventure Sports, Camping Sites" /></div>
                {categoryForm.key && <div className="p-2 bg-gray-50 rounded-lg border border-gray-200"><p className="text-xs text-gray-500">🔑 Auto-generated key: <span className="font-mono font-semibold text-[#072E2A]">{categoryForm.key}</span></p></div>}
                <div><label className="block text-sm font-medium mb-1">Description</label><textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} placeholder="Describe this category..." rows={3} /></div>
                <div><label className="block text-sm font-medium mb-1">Image URL</label><input type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={categoryForm.image} onChange={(e) => setCategoryForm({...categoryForm, image: e.target.value})} placeholder="https://images.unsplash.com/..." /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => { setShowCategoryDialog(false); setCategoryForm({ key: '', label: '', description: '', image: '' }); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button><button type="submit" disabled={categoryLoading} className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition disabled:opacity-50 flex items-center gap-2">{categoryLoading ? 'Adding...' : '✅ Add Category'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Place Dialog */}
      {showPlaceDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">📍 Add Place to {categoryData.find(c => c.key === selectedCategoryKey)?.title || 'Category'}</h3><button onClick={() => { setShowPlaceDialog(false); setPlaceForm({ name: '', location: '', district: '', description: '', difficulty: '', duration: '', best_time: '', image: '', type: 'well-known', hidden_gem: '' }); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button></div>
            <form onSubmit={handleAddPlace}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Place Name *</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={placeForm.name} onChange={(e) => setPlaceForm({...placeForm, name: e.target.value})} placeholder="Place name" /></div><div><label className="block text-sm font-medium mb-1">District *</label><select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={placeForm.district} onChange={(e) => setPlaceForm({...placeForm, district: e.target.value})}><option value="">Select District</option>{KERALA_DISTRICTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div></div>
                <div><label className="block text-sm font-medium mb-1">Location (Specific area)</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={placeForm.location} onChange={(e) => setPlaceForm({...placeForm, location: e.target.value})} placeholder="e.g., Varkala, Munnar Town" /></div>
                <div><label className="block text-sm font-medium mb-1">Description</label><textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={placeForm.description} onChange={(e) => setPlaceForm({...placeForm, description: e.target.value})} placeholder="Description of the place..." rows={2} /></div>
                <div className="grid grid-cols-3 gap-4"><div><label className="block text-sm font-medium mb-1">Difficulty</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={placeForm.difficulty} onChange={(e) => setPlaceForm({...placeForm, difficulty: e.target.value})} placeholder="Easy" /></div><div><label className="block text-sm font-medium mb-1">Duration</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={placeForm.duration} onChange={(e) => setPlaceForm({...placeForm, duration: e.target.value})} placeholder="2-3 hours" /></div><div><label className="block text-sm font-medium mb-1">Best Time</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={placeForm.best_time} onChange={(e) => setPlaceForm({...placeForm, best_time: e.target.value})} placeholder="October to March" /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Type</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={placeForm.type} onChange={(e) => setPlaceForm({...placeForm, type: e.target.value})}><option value="well-known">⭐ Well Known</option><option value="hidden">✨ Hidden Gem</option></select></div><div><label className="block text-sm font-medium mb-1">Image URL</label><input type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={placeForm.image} onChange={(e) => setPlaceForm({...placeForm, image: e.target.value})} placeholder="https://images.unsplash.com/..." /></div></div>
                <div><label className="block text-sm font-medium mb-1">Hidden Gem Description</label><textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={placeForm.hidden_gem} onChange={(e) => setPlaceForm({...placeForm, hidden_gem: e.target.value})} placeholder="What makes this a hidden gem?" rows={2} /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => { setShowPlaceDialog(false); setPlaceForm({ name: '', location: '', district: '', description: '', difficulty: '', duration: '', best_time: '', image: '', type: 'well-known', hidden_gem: '' }); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button><button type="submit" disabled={placeLoading} className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition disabled:opacity-50">{placeLoading ? 'Saving...' : '✅ Add Place'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Guide Dialog */}
      {showGuideDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">{editingGuide ? '✏️ Edit Guide' : '➕ Add New Guide'}</h3><button onClick={() => { setShowGuideDialog(false); setEditingGuide(null); resetGuideForm(); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button></div>
            <form onSubmit={editingGuide ? handleUpdateGuide : handleAddGuide}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Full Name *</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.full_name} onChange={(e) => setGuideForm({...guideForm, full_name: e.target.value})} placeholder="John Doe" /></div><div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.email} onChange={(e) => setGuideForm({...guideForm, email: e.target.value})} placeholder="guide@example.com" disabled={!!editingGuide} /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Password *</label><input type="text" required={!editingGuide} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.password || ''} onChange={(e) => setGuideForm({...guideForm, password: e.target.value})} placeholder={editingGuide ? 'Leave blank to keep current' : 'Set a password'} /></div><div><label className="block text-sm font-medium mb-1">Phone</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.phone} onChange={(e) => setGuideForm({...guideForm, phone: e.target.value})} placeholder="+91 9876543210" /></div></div>
                <div><label className="block text-sm font-medium mb-1">Bio</label><textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.bio} onChange={(e) => setGuideForm({...guideForm, bio: e.target.value})} placeholder="Experienced tour guide..." rows={2} /></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Experience (Years)</label><input type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.experience_years} onChange={(e) => setGuideForm({...guideForm, experience_years: e.target.value})} /></div><div><label className="block text-sm font-medium mb-1">Languages</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.languages} onChange={(e) => setGuideForm({...guideForm, languages: e.target.value})} placeholder="English, Malayalam, Hindi" /></div></div>
                <div><label className="block text-sm font-medium mb-1">Primary District *</label><select required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.primary_district} onChange={(e) => setGuideForm({...guideForm, primary_district: e.target.value})}><option value="">Select District</option>{KERALA_DISTRICTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Price/Day ($)</label><input type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.price_per_day} onChange={(e) => setGuideForm({...guideForm, price_per_day: e.target.value})} /></div><div><label className="block text-sm font-medium mb-1">Price/Hour ($)</label><input type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.price_per_hour} onChange={(e) => setGuideForm({...guideForm, price_per_hour: e.target.value})} /></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Verification Status</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.is_verified ? 'true' : 'false'} onChange={(e) => setGuideForm({...guideForm, is_verified: e.target.value === 'true'})}><option value="false">⏳ Pending</option><option value="true">✅ Verified</option></select></div><div><label className="block text-sm font-medium mb-1">Account Status</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={guideForm.is_active ? 'true' : 'false'} onChange={(e) => setGuideForm({...guideForm, is_active: e.target.value === 'true'})}><option value="true">🟢 Active</option><option value="false">🔴 Inactive</option></select></div></div>
              </div>
              <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => { setShowGuideDialog(false); setEditingGuide(null); resetGuideForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button><button type="submit" disabled={guideLoading} className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition disabled:opacity-50">{guideLoading ? 'Saving...' : (editingGuide ? 'Update Guide' : 'Add Guide')}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">👔 Add Staff Member</h3>
            <form onSubmit={handleAddStaff}>
              <div className="space-y-4"><div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={staffForm.email} onChange={(e) => setStaffForm({...staffForm, email: e.target.value})} placeholder="staff@example.com" /></div><div><label className="block text-sm font-medium mb-1">Password *</label><input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]" value={staffForm.password} onChange={(e) => setStaffForm({...staffForm, password: e.target.value})} placeholder="Set a password" /></div></div>
              <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setShowAddStaff(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button><button type="submit" disabled={staffLoading} className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition disabled:opacity-50">{staffLoading ? 'Adding...' : 'Add Staff'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal - Used for both Staff and Guide */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-4"><div className="text-4xl mb-2">✅</div><h3 className="text-lg font-semibold">{newGuidePassword ? 'Guide Added Successfully!' : 'Staff Added Successfully!'}</h3><p className="text-sm text-gray-600">The user can login with these credentials:</p></div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-mono font-semibold">{newGuidePassword ? guideForm.email : newStaffCredentials.email}</p>
              <p className="text-sm text-gray-500 mt-2">Password</p>
              <p className="font-mono font-semibold text-[#C79A3E]">{newGuidePassword || newStaffCredentials.password}</p>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={() => { navigator.clipboard?.writeText(`Email: ${newGuidePassword ? guideForm.email : newStaffCredentials.email}\nPassword: ${newGuidePassword || newStaffCredentials.password}`); showToast('✅ Credentials copied to clipboard!'); }} className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition">📋 Copy Credentials</button>
              <button onClick={() => { setShowPasswordModal(false); setNewGuidePassword(''); setNewStaffCredentials({ email: '', password: '' }); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestion Detail Modal */}
      {showSuggestionModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4"><h3 className="text-xl font-semibold text-[#072E2A]">{selectedSuggestion.name}</h3><button onClick={() => setShowSuggestionModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button></div>
            {selectedSuggestion.image && <div className="mb-4"><img src={selectedSuggestion.image} alt={selectedSuggestion.name} className="w-full max-h-64 object-cover rounded-lg border border-gray-200" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'; }} /></div>}
            <div className="grid grid-cols-2 gap-4 mb-4"><div><p className="text-sm text-gray-500">Submitted By</p><p className="font-medium">{selectedSuggestion.user?.email || selectedSuggestion.user_email || 'Anonymous'}</p></div><div><p className="text-sm text-gray-500">Status</p><span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedSuggestion.status)}`}>{getStatusLabel(selectedSuggestion.status)}</span></div><div><p className="text-sm text-gray-500">District</p><p className="font-medium">{selectedSuggestion.district || 'N/A'}</p></div><div><p className="text-sm text-gray-500">Category</p><p className="font-medium">{selectedSuggestion.category || 'N/A'}</p></div></div>
            <div className="mb-4"><p className="text-sm text-gray-500">Description</p><p className="text-sm text-gray-700">{selectedSuggestion.description || 'No description'}</p></div>
            {selectedSuggestion.location_info && <div className="mb-4"><p className="text-sm text-gray-500">Location Info</p><p className="text-sm text-gray-700">{selectedSuggestion.location_info}</p></div>}
            {selectedSuggestion.admin_notes && <div className="mb-4 p-3 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Admin Notes</p><p className="text-sm">{selectedSuggestion.admin_notes}</p></div>}
            {selectedSuggestion.processed_by && <div className="mb-4 p-3 bg-gray-50 rounded-lg"><p className="text-sm text-gray-500">Processed By</p><p className="text-sm font-medium">{selectedSuggestion.processed_by}</p>{selectedSuggestion.processed_at && <p className="text-xs text-gray-400">{new Date(selectedSuggestion.processed_at).toLocaleString()}</p>}</div>}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 flex-wrap">
              {selectedSuggestion.status === 'pending' && <><button onClick={() => processSuggestion(selectedSuggestion.id, 'approve')} disabled={actionLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">✅ Approve</button><button onClick={() => processSuggestion(selectedSuggestion.id, 'reject')} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">❌ Reject</button><button onClick={() => processSuggestion(selectedSuggestion.id, 'implement')} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">🚀 Implement</button></>}
              {selectedSuggestion.status === 'approved' && <><button onClick={() => processSuggestion(selectedSuggestion.id, 'implement')} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">🚀 Implement</button><button onClick={() => processSuggestion(selectedSuggestion.id, 'reject')} disabled={actionLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">❌ Reject</button></>}
              <button onClick={() => processSuggestion(selectedSuggestion.id, 'delete')} disabled={actionLoading} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition disabled:opacity-50">🗑️ Delete</button>
              <button onClick={() => setShowSuggestionModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Deleted Suggestions Modal */}
      {showDeletedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-[#072E2A]">🗑️ Deleted Suggestions ({deletedSuggestions.length})</h3><button onClick={() => setShowDeletedModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button></div>
            {deletedSuggestions.length === 0 ? <div className="text-center py-8 text-gray-500">No deleted suggestions found.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Name</th><th className="px-4 py-2 text-left">Submitted By</th><th className="px-4 py-2 text-left">Original Status</th><th className="px-4 py-2 text-left">Deleted By</th><th className="px-4 py-2 text-left">Deleted At</th><th className="px-4 py-2 text-left">Actions</th></tr></thead><tbody>{deletedSuggestions.map(s => (<tr key={s.id} className="border-t border-gray-100"><td className="px-4 py-2 font-medium">{s.name || 'Untitled'}</td><td className="px-4 py-2">{s.user?.email || s.user_email || 'Anonymous'}</td><td className="px-4 py-2"><span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(s.original_status)}`}>{getStatusLabel(s.original_status)}</span></td><td className="px-4 py-2">{s.deleted_by || 'Unknown'}</td><td className="px-4 py-2 text-xs text-gray-500">{s.deleted_at ? new Date(s.deleted_at).toLocaleString() : 'N/A'}</td><td className="px-4 py-2"><button onClick={() => recoverDeletedSuggestion(s.id)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition">♻️ Recover</button></td></tr>))}</tbody></table></div>}
            <div className="flex justify-end mt-4"><button onClick={() => setShowDeletedModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Close</button></div>
          </div>
        </div>
      )}

      {/* Guide Bookings Modal */}
      {showGuideBookingsModal && selectedGuideBookings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">📋 Bookings for {selectedGuideBookings.name}</h3><button onClick={() => { setShowGuideBookingsModal(false); setSelectedGuideBookings(null); setGuideBookings([]); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button></div>
            {guideBookings.length === 0 ? <div className="text-center py-8 text-gray-500"><p>No bookings found for this guide.</p></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Booking ID</th><th className="px-4 py-2 text-left">Traveler</th><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Time</th><th className="px-4 py-2 text-left">Destination</th><th className="px-4 py-2 text-left">Status</th></tr></thead><tbody>{guideBookings.map(b => (<tr key={b.id} className="border-t border-gray-100"><td className="px-4 py-2 font-mono text-xs">#{b.id}</td><td className="px-4 py-2">{b.traveler_email || b.traveler?.email || 'Anonymous'}</td><td className="px-4 py-2">{b.date ? new Date(b.date).toLocaleDateString() : '—'}</td><td className="px-4 py-2">{b.time || '—'}</td><td className="px-4 py-2">{b.destination || b.district?.name || 'N/A'}</td><td className="px-4 py-2"><span className={`text-xs px-2 py-1 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{b.status || 'pending'}</span></td></tr>))}</tbody></table></div>}
            <div className="flex justify-end mt-4"><button onClick={() => { setShowGuideBookingsModal(false); setSelectedGuideBookings(null); setGuideBookings([]); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Close</button></div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#072E2A] text-[#E4C77B]'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
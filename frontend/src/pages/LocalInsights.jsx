// pages/LocalInsights.jsx - COMPLETE FULLY FIXED VERSION
// Shows implemented suggestions with category mapping

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ============================================
// IMAGE HANDLER HELPER
// ============================================
const getImageUrl = (item) => {
  if (!item) return null;

  const possibleFields = [
    'image', 'image_url', 'primary_image', 'images', 'images_data',
    'profile_image', 'photo', 'avatar'
  ];

  for (const field of possibleFields) {
    const value = item[field];
    if (!value) continue;

    if (typeof value === 'string') {
      if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
      }
      if (value.startsWith('/media/') || value.startsWith('/uploads/')) {
        const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
        const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
        const mediaBase = cleanBase.replace('/api', '');
        return `${mediaBase}${value}`;
      }
      if (value.startsWith('data:image')) {
        return value;
      }
      if (!value.startsWith('http') && !value.startsWith('data:')) {
        const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
        const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
        const mediaBase = cleanBase.replace('/api', '');
        return `${mediaBase}/media/${value}`;
      }
      return value;
    }

    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      if (typeof firstItem === 'string') {
        if (firstItem.startsWith('http://') || firstItem.startsWith('https://')) {
          return firstItem;
        }
        if (firstItem.startsWith('/media/') || firstItem.startsWith('/uploads/')) {
          const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
          const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
          const mediaBase = cleanBase.replace('/api', '');
          return `${mediaBase}${firstItem}`;
        }
        return firstItem;
      }
      if (typeof firstItem === 'object' && firstItem.image_url) {
        return firstItem.image_url;
      }
      if (typeof firstItem === 'object' && firstItem.image) {
        if (typeof firstItem.image === 'string') {
          if (firstItem.image.startsWith('http://') || firstItem.image.startsWith('https://')) {
            return firstItem.image;
          }
          if (firstItem.image.startsWith('/media/') || firstItem.image.startsWith('/uploads/')) {
            const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
            const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            const mediaBase = cleanBase.replace('/api', '');
            return `${mediaBase}${firstItem.image}`;
          }
          return firstItem.image;
        }
      }
    }

    if (typeof value === 'object' && value !== null) {
      if (value.image_url) return value.image_url;
      if (value.image) {
        if (typeof value.image === 'string') {
          if (value.image.startsWith('http://') || value.image.startsWith('https://')) {
            return value.image;
          }
          if (value.image.startsWith('/media/') || value.image.startsWith('/uploads/')) {
            const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
            const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
            const mediaBase = cleanBase.replace('/api', '');
            return `${mediaBase}${value.image}`;
          }
          return value.image;
        }
      }
    }
  }

  return null;
};

// ============================================
// GET TYPE INFO
// ============================================
const getTypeInfo = (item) => {
  if (!item) return { label: 'Insight', type: 'insight' };

  const type = item.suggestion_type || item.type || item._type || '';
  const lowerType = type.toLowerCase().trim();

  if (lowerType === 'review' || lowerType === 'reviews') {
    return { label: 'Review', type: 'review' };
  }
  if (lowerType === 'hidden_gem' || lowerType === 'hidden gem' || lowerType === 'hidden_gems' || lowerType === 'new') {
    return { label: 'Hidden Gem', type: 'hidden_gem' };
  }
  if (lowerType === 'local_insight' || lowerType === 'local insight' || lowerType === 'insight' || lowerType === 'insights') {
    return { label: 'Local Insight', type: 'insight' };
  }
  return { label: 'Local Insight', type: 'insight' };
};

// ============================================
// LINE ICONS
// ============================================
const Icon = {
  Back: (p) => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Refresh: (p) => (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Star: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z" />
    </svg>
  ),
  Pin: (p) => (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" {...p}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Tag: (p) => (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" {...p}>
      <path d="M20.59 13.41L11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83z" />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Mail: (p) => (
    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" {...p}>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5l8 6.2 8-6.2" />
    </svg>
  ),
  Gem: (p) => (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" {...p}>
      <path strokeLinejoin="round" d="M4 9l4-6h8l4 6-10 12z" />
      <path strokeLinejoin="round" d="M4 9h16M8.5 3l1.7 6-2.6 0M15.5 3l-1.7 6 2.6 0M9.5 9l2.5 12 2.5-12" />
    </svg>
  ),
  Bulb: (p) => (
    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6M10 21h4M8 14a4 4 0 1 1 8 0c0 1.5-.8 2.3-1.5 3-.5.5-.5 1-.5 1h-4s0-.5-.5-1c-.7-.7-1.5-1.5-1.5-3z" />
      <path strokeLinecap="round" d="M12 2v1.5M4.5 6L5.6 7M19.5 6L18.4 7" />
    </svg>
  ),
  Sparkle: (p) => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.6" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
      <circle cx="12" cy="12" r="2.3" />
    </svg>
  ),
  Plus: (p) => (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.4" {...p}>
      <path strokeLinecap="round" d="M12 4v16M4 12h16" />
    </svg>
  ),
  Camera: (p) => (
    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8a2 2 0 0 1 2-2h1.2l.9-1.5A1.5 1.5 0 0 1 9.4 4h5.2a1.5 1.5 0 0 1 1.3.75L16.8 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  ),
  Send: (p) => (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
    </svg>
  ),
  Check: (p) => (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.4" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Alert: (p) => (
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" {...p}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01M10.3 3.9L2.5 17a1.6 1.6 0 0 0 1.4 2.4h16.2a1.6 1.6 0 0 0 1.4-2.4L13.7 3.9a1.6 1.6 0 0 0-2.8 0z" />
    </svg>
  ),
  Calendar: (p) => (
    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  ),
  Compass: (p) => (
    <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.6" {...p}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinejoin="round" d="M14.5 9.5L13 13l-3.5 1.5L11 11z" />
    </svg>
  ),
};

const TYPE_STYLE = {
  review: { icon: Icon.Star, bg: 'rgba(255,152,0,0.12)', fg: '#B4700C' },
  hidden_gem: { icon: Icon.Gem, bg: 'rgba(199,154,62,0.15)', fg: '#93701F' },
  insight: { icon: Icon.Bulb, bg: 'rgba(14,92,83,0.13)', fg: '#0E5C53' },
};

const LocalInsights = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useAuth();
    const [activeNav, setActiveNav] = useState('insights');
    const [scrolled, setScrolled] = useState(false);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [selectedInsight, setSelectedInsight] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // ✅ Dynamic categories state
    const [availableCategories, setAvailableCategories] = useState([
        'beach', 'hill', 'backwater', 'heritage', 'wildlife', 'temple',
        'waterfalls', 'natures', 'fort', 'museum', 'camping', 'islands',
        'sacred', 'off-road', 'parks', 'other'
    ]);
    const [customCategory, setCustomCategory] = useState('');
    const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        location_info: '',
        district: '',
        suggestion_type: 'local_insight',
        rating: 0,
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [stats, setStats] = useState({
        insights: 0,
        places: 0,
        categories: 0
    });

    // ✅ Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [totalItems, setTotalItems] = useState(0);

    const isMounted = useRef(true);
    const initialFetchDone = useRef(false);

    // Auth check
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    // Scroll handler
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cleanup
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // ✅ Extract categories from insights
    useEffect(() => {
        if (insights.length > 0) {
            const categories = insights
                .map(i => i.category)
                .filter(Boolean)
                .filter(c => c !== 'other' && c !== 'general' && c.trim() !== '');

            setAvailableCategories(prev => {
                const newCategories = [...prev];
                categories.forEach(cat => {
                    if (!newCategories.includes(cat) && cat.trim() !== '') {
                        newCategories.push(cat);
                    }
                });
                return newCategories.sort();
            });
        }
    }, [insights]);

    // Clear cache
    const clearCache = () => {
        try {
            localStorage.removeItem('local_insights');
            console.log('🗑️ Local insights cache cleared');
        } catch (e) {
            console.log('Cache clear failed:', e);
        }
    };

    // Force refresh
    const forceRefresh = useCallback(() => {
        clearCache();
        setCurrentPage(1);
        setInsights([]);
        setTotalItems(0);
        initialFetchDone.current = false;
        fetchInsights(true, 1);
    }, []);

    // Handle image change
    const handleImageChange = async (e) => {
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
            try {
                setImageFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error processing image:', error);
                alert('Failed to process image. Please try again.');
            }
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        const fileInput = document.getElementById('image-upload-input');
        if (fileInput) fileInput.value = '';
    };

    // ✅ FETCH INSIGHTS
    const fetchInsights = useCallback(async (isRefresh = false, pageNum = 1) => {
        console.log('🔍 Fetching implemented suggestions...', { isRefresh, pageNum });

        if (!isLoggedIn) {
            console.log('⚠️ User not logged in');
            setLoading(false);
            return;
        }

        if (isRefresh) {
            setRefreshing(true);
            setCurrentPage(1);
            clearCache();
        }

        if (isRefresh || pageNum === 1) {
            setLoading(true);
        }

        try {
            const response = await api.get('/suggestions/implemented/', {
                params: {
                    limit: itemsPerPage,
                    offset: (pageNum - 1) * itemsPerPage
                }
            });

            console.log('📊 Full API Response:', response.data);

            let allItems = [];
            let totalCount = 0;

            const data = response.data;

            // ✅ Extract data from nested structure
            if (data && data.results) {
                if (data.results.data && Array.isArray(data.results.data)) {
                    allItems = data.results.data;
                    totalCount = data.results.count || data.count || allItems.length;
                    console.log(`✅ Found ${allItems.length} items in results.data`);
                } else if (data.results.results && Array.isArray(data.results.results)) {
                    allItems = data.results.results;
                    totalCount = data.results.count || data.count || allItems.length;
                } else if (Array.isArray(data.results)) {
                    allItems = data.results;
                    totalCount = data.count || allItems.length;
                } else {
                    for (const key of Object.keys(data.results)) {
                        if (Array.isArray(data.results[key])) {
                            allItems = data.results[key];
                            totalCount = data.results.count || data.count || allItems.length;
                            break;
                        }
                    }
                }
            } else if (data.data && Array.isArray(data.data)) {
                allItems = data.data;
                totalCount = data.count || allItems.length;
            } else if (Array.isArray(data)) {
                allItems = data;
                totalCount = allItems.length;
            }

            console.log(`📊 Total items from API: ${allItems.length}, Total count: ${totalCount}`);

            const formattedItems = allItems.map(s => {
                const typeInfo = getTypeInfo(s);
                const imageUrl = getImageUrl(s);

                return {
                    id: s.id || `item-${Date.now()}-${Math.random()}`,
                    author: s.author || s.user_email || s.username || s.user?.email || 'Anonymous Traveler',
                    email: s.user_email || s.user?.email || s.author_email || '',
                    place: s.place || s.name || s.destination || s.title || 'Unknown Place',
                    tip: s.tip || s.description || s.review_text || s.content || '',
                    category: s.category || 'general',
                    location: s.location || s.location_info || '',
                    district: s.district || 'Unknown',
                    type: s.suggestion_type || s.type || 'local_insight',
                    status: s.status || 'implemented',
                    created_at: s.created_at || new Date().toISOString(),
                    image: imageUrl,
                    description: s.description || s.review_text || s.tip || s.content || '',
                    rating: s.rating || null,
                    user_email: s.user_email || s.user?.email,
                    username: s.username || s.user?.username,
                    suggestion_type: s.suggestion_type || s.type || 'local_insight',
                    typeLabel: typeInfo.label,
                    typeDisplay: typeInfo.type,
                    admin_notes: s.admin_notes || '',
                    processed_by: s.processed_by || '',
                    processed_at: s.processed_at || '',
                    implemented_at: s.implemented_at || '',
                    implemented_by: s.implemented_by || '',
                    _raw: s
                };
            });

            if (isMounted.current) {
                if (isRefresh || pageNum === 1) {
                    setInsights(formattedItems);
                } else {
                    setInsights(prev => {
                        const existingIds = new Set(prev.map(item => item.id));
                        const newUniqueItems = formattedItems.filter(item => !existingIds.has(item.id));
                        return [...prev, ...newUniqueItems];
                    });
                }

                setTotalItems(totalCount || formattedItems.length);

                const uniquePlaces = new Set(formattedItems.map(i => i.place).filter(Boolean));
                const uniqueCategories = new Set(formattedItems.map(i => i.category).filter(Boolean));

                setStats({
                    insights: totalCount || formattedItems.length,
                    places: uniquePlaces.size,
                    categories: uniqueCategories.size
                });

                if (formattedItems.length > 0 && (isRefresh || pageNum === 1)) {
                    try {
                        localStorage.setItem('local_insights', JSON.stringify(formattedItems));
                    } catch (e) {}
                }
            }

        } catch (error) {
            console.error('❌ Error fetching insights:', error);

            if (isMounted.current && insights.length === 0) {
                try {
                    const localInsights = JSON.parse(localStorage.getItem('local_insights') || '[]');
                    if (localInsights.length > 0) {
                        setInsights(localInsights);
                        setTotalItems(localInsights.length);
                        const uniquePlaces = new Set(localInsights.map(i => i.place).filter(Boolean));
                        const uniqueCategories = new Set(localInsights.map(i => i.category).filter(Boolean));
                        setStats({
                            insights: localInsights.length,
                            places: uniquePlaces.size,
                            categories: uniqueCategories.size
                        });
                    }
                } catch (localError) {
                    console.error('LocalStorage fallback failed:', localError);
                }
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [isLoggedIn, itemsPerPage, insights.length]);

    // ✅ Get paginated items based on category filter
    const getFilteredItems = useCallback(() => {
        let items = [...insights];

        if (activeCategory !== 'all') {
            items = items.filter(item => item.category === activeCategory);
        }

        return items;
    }, [insights, activeCategory]);

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
    const filteredCount = getFilteredItems().length;

    // ✅ Initial fetch
    useEffect(() => {
        if (isLoggedIn && !initialFetchDone.current) {
            initialFetchDone.current = true;
            fetchInsights(true, 1);
        } else if (!isLoggedIn) {
            setLoading(false);
        }
    }, [isLoggedIn, fetchInsights]);

    // Reset to page 1 when category changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory]);

    // Handle refresh
    const handleRefresh = () => {
        if (refreshing || loading) return;
        forceRefresh();
    };

    // ✅ Handle submit suggestion
    const handleSubmitSuggestion = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        setSubmitSuccess(false);

        if (!isLoggedIn) {
            alert('⚠️ Please login first to suggest a destination.');
            navigate('/login');
            return;
        }

        if (!formData.district) {
            setSubmitError('Please select a district.');
            return;
        }

        if (!formData.name || !formData.name.trim()) {
            setSubmitError('Please enter a place name.');
            return;
        }

        if (!formData.description || !formData.description.trim()) {
            setSubmitError('Please enter a description.');
            return;
        }

        setSubmitting(true);

        try {
            const formDataObj = new FormData();

            formDataObj.append('name', formData.name.trim());
            formDataObj.append('description', formData.description.trim());
            
            // ✅ Use the selected category or default to 'general'
            const categoryValue = formData.category || 'general';
            formDataObj.append('category', categoryValue);
            
            formDataObj.append('location_info', formData.location_info || '');
            formDataObj.append('district', formData.district);
            formDataObj.append('suggestion_type', 'local_insight');

            if (formData.rating > 0) {
                formDataObj.append('rating', formData.rating.toString());
            }

            if (imageFile) {
                formDataObj.append('image', imageFile);
            }

            const response = await api.post('/suggestions/', formDataObj, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('📊 Suggestion response:', response.data);

            if (response.data && response.data.success !== false) {
                if (formData.category && !availableCategories.includes(formData.category) && formData.category !== 'general' && formData.category !== 'other') {
                    setAvailableCategories(prev => [...prev, formData.category].sort());
                }

                setSubmitSuccess(true);
                alert('✅ Your local insight has been sent to the guides!');
                setShowSuggestionModal(false);
                resetForm();

                clearCache();
                setCurrentPage(1);
                initialFetchDone.current = false;
                fetchInsights(true, 1);
            } else {
                const errorMsg = response.data?.message || response.data?.error || 'Failed to submit insight.';
                setSubmitError(errorMsg);
                alert(`⚠️ ${errorMsg}`);
            }
        } catch (error) {
            console.error('❌ Error submitting insight:', error);

            let errorMsg = 'Failed to submit insight. Please try again.';
            if (error.response?.data) {
                const data = error.response.data;
                if (data.errors) {
                    const fieldErrors = [];
                    for (const [field, errors] of Object.entries(data.errors)) {
                        if (Array.isArray(errors)) {
                            fieldErrors.push(`${field}: ${errors.join(', ')}`);
                        } else {
                            fieldErrors.push(`${field}: ${errors}`);
                        }
                    }
                    if (fieldErrors.length > 0) {
                        errorMsg = fieldErrors.join('; ');
                    }
                } else if (data.message) {
                    errorMsg = data.message;
                } else if (data.error) {
                    errorMsg = data.error;
                } else if (data.detail) {
                    errorMsg = data.detail;
                }
            }
            setSubmitError(errorMsg);
            alert(`⚠️ ${errorMsg}`);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: '',
            location_info: '',
            district: '',
            suggestion_type: 'local_insight',
            rating: 0,
        });
        setImagePreview(null);
        setImageFile(null);
        setSubmitError(null);
        setSubmitSuccess(false);
        setShowCustomCategoryInput(false);
        setCustomCategory('');
        const fileInput = document.getElementById('image-upload-input');
        if (fileInput) fileInput.value = '';
    };

    const openDetailModal = (insight) => {
        setSelectedInsight(insight);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedInsight(null);
    };

    const handleProtectedClick = (path) => {
        if (!isLoggedIn) {
            alert('⚠️ Login required to access this page.');
            navigate('/login');
        } else {
            navigate(path);
        }
    };

    const categories = ['all', ...availableCategories];

    const ZariDivider = () => (
        <svg width="100%" height="10" viewBox="0 0 400 10" preserveAspectRatio="none" style={{ display: 'block' }}>
            <line x1="0" y1="5" x2="400" y2="5" stroke="#C79A3E" strokeWidth="0.6" strokeOpacity="0.4" />
            {Array.from({ length: 34 }).map((_, i) => (
                <rect key={i} x={i * 12 + 4} y="2" width="4.5" height="4.5" fill="#C79A3E" fillOpacity="0.55" transform={`rotate(45 ${i * 12 + 6.25} 4.25)`} />
            ))}
        </svg>
    );

    // ============================================
    // BOTTOM NAV
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
    // RENDER
    // ============================================
    return (
        <div style={{ background: "#FBF6EA", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422", paddingBottom: 100 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                .li-font-display { font-family: 'Fraunces', serif; }
                .li-font-mono { font-family: 'IBM Plex Mono', monospace; }

                .refresh-btn { transition: transform 0.3s ease; }
                .refresh-btn:hover { transform: rotate(180deg); }
                .action-btn { transition: all 0.3s ease; }
                .action-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.16); }
                .spinning { animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                .modal-overlay { position: fixed; inset: 0; background: rgba(5,20,18,0.55); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-content, .modal-content-detail { background: #FBF6EA; border-radius: 14px; padding: 32px; max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(199,154,62,0.3); box-shadow: 0 24px 60px rgba(0,0,0,0.35); animation: fadeUp 0.25s ease; }
                .modal-content-detail { max-width: 600px; padding: 0; }

                .category-chip { padding: 7px 18px; border-radius: 999px; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; transition: all 0.25s ease; font-family: 'IBM Plex Mono', monospace; white-space: nowrap; }

                .pagination-btn { transition: all 0.2s ease; }
                .pagination-btn:hover:not(:disabled) { background: #C79A3E; color: #fff; border-color: #C79A3E; }
                .pagination-btn.active { background: #C79A3E; color: #fff; }

                .custom-category-input { display: flex; gap: 8px; align-items: center; width: 100%; }
                .custom-category-input input { flex: 1; padding: 10px 14px; border: 1px solid rgba(199,154,62,0.3); border-radius: 6px; font-size: 13px; background: #fff; }
                .custom-category-input input:focus { outline: none; border-color: #C79A3E; }
                .custom-category-input button { padding: 8px 16px; border-radius: 6px; border: 1px solid #0E5C53; background: #0E5C53; color: #fff; font-size: 12px; cursor: pointer; white-space: nowrap; transition: all 0.2s ease; }
                .custom-category-input button:hover { background: #0B3A34; }
                .custom-category-input .cancel-btn { border: 1px solid #ccc; background: transparent; color: #666; }
                .custom-category-input .cancel-btn:hover { background: #f5f5f5; }

                .insight-card {
                    background: #fff;
                    border-radius: 14px;
                    border: 1px solid rgba(199,154,62,0.18);
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.28s cubic-bezier(.2,.8,.2,1), box-shadow 0.28s ease, border-color 0.28s ease;
                    display: flex;
                    flex-direction: column;
                    animation: fadeUp 0.35s ease both;
                }
                .insight-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 16px 32px rgba(7,46,42,0.14);
                    border-color: rgba(199,154,62,0.45);
                }
                .insight-card__media { position: relative; width: 100%; aspect-ratio: 4/3; background: linear-gradient(135deg, #EFE7CF, #E4D9B8); overflow: hidden; }
                .insight-card__media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
                .insight-card:hover .insight-card__media img { transform: scale(1.06); }
                .insight-card__fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(11,36,34,0.25); }
                .insight-card__type {
                    position: absolute; top: 10px; left: 10px;
                    display: flex; align-items: center; gap: 5px;
                    padding: 4px 10px; border-radius: 999px;
                    font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: 0.06em; text-transform: uppercase;
                    backdrop-filter: blur(6px);
                }
                .insight-card__rating {
                    position: absolute; bottom: 10px; right: 10px;
                    display: flex; align-items: center; gap: 3px;
                    background: rgba(7,46,42,0.82); color: #E4C77B;
                    padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600;
                }
                .insight-card__body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
                .insight-card__place { font-size: 16.5px; font-weight: 500; font-style: italic; color: #0B2422; line-height: 1.25; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .insight-card__district { display: flex; align-items: center; gap: 4px; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.03em; color: #0E5C53; }
                .insight-card__meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-top: 8px; margin-top: auto; border-top: 1px dashed rgba(199,154,62,0.3); }
                .insight-card__author { display: flex; align-items: center; gap: 6px; min-width: 0; }
                .insight-card__avatar { width: 20px; height: 20px; border-radius: 50%; background: #0E5C53; color: #EDE2C4; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .insight-card__mail { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; color: #8A9A95; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .insight-card__category { display: inline-flex; align-items: center; gap: 3px; font-size: 9.5px; letter-spacing: 0.03em; color: #93701F; flex-shrink: 0; }

                .detail-hero { position: relative; width: 100%; aspect-ratio: 16/9; background: linear-gradient(135deg, #EFE7CF, #E4D9B8); }
                .detail-hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .detail-hero__overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(7,46,42,0.85), rgba(7,46,42,0) 55%); }
                .detail-hero__title { position: absolute; left: 28px; right: 28px; bottom: 18px; color: #fff; }
                .detail-close { position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 50%; background: rgba(7,46,42,0.6); color: #fff; border: none; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); transition: background 0.2s ease; }
                .detail-close:hover { background: rgba(7,46,42,0.85); }
                .detail-body { padding: 26px 30px 30px; }
                .pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 999px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; }
                .author-strip { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #FBF6EA; border: 1px solid rgba(199,154,62,0.18); border-radius: 10px; }
                .author-strip__avatar { width: 38px; height: 38px; border-radius: 50%; background: #0E5C53; color: #EDE2C4; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; flex-shrink: 0; }
                .author-strip__mail { display: flex; align-items: center; gap: 5px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5C6E69; }

                .stat-block { display: flex; flex-direction: column; }
                .stat-block__num { font-family: 'Fraunces', serif; font-size: 21px; color: #E4C77B; line-height: 1; }
                .stat-block__label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 1.6px; text-transform: uppercase; color: rgba(237,226,196,0.6); margin-top: 4px; }
                .stat-divider { width: 1px; align-self: stretch; background: rgba(228,199,123,0.2); }

                .field-label { display: block; font-size: 11.5px; font-weight: 600; letter-spacing: 0.02em; color: #0B2422; margin-bottom: 5px; text-transform: uppercase; font-family: 'IBM Plex Mono', monospace; }
                .field-input { width: 100%; padding: 11px 14px; border: 1px solid rgba(199,154,62,0.32); border-radius: 7px; font-size: 13.5px; background: #fff; transition: border-color 0.2s ease, box-shadow 0.2s ease; font-family: inherit; }
                .field-input:focus { outline: none; border-color: #0E5C53; box-shadow: 0 0 0 3px rgba(14,92,83,0.1); }

                .empty-state { text-align: center; padding: 64px 24px; color: #5C6E69; background: #fff; border-radius: 14px; border: 1px solid rgba(199,154,62,0.18); }

                @media (max-width: 640px) {
                    .detail-body { padding: 20px; }
                    .detail-hero__title { left: 18px; right: 18px; }
                }
            `}</style>

            {/* HEADER */}
            <div style={{ background: "#072E2A", padding: "40px 20px 32px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
                <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                        <Link to="/" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(199,154,62,0.5)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: "#E4C77B" }}>
                            <Icon.Back />
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button
                                onClick={handleRefresh}
                                className="refresh-btn"
                                disabled={refreshing || loading}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid rgba(199,154,62,0.3)',
                                    borderRadius: '50%',
                                    width: 32,
                                    height: 32,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: (refreshing || loading) ? 'not-allowed' : 'pointer',
                                    color: '#E4C77B',
                                    opacity: (refreshing || loading) ? 0.5 : 1,
                                }}
                                title="Refresh insights"
                            >
                                {(refreshing || loading) ? (
                                    <div className="spinning" style={{ width: 15, height: 15, border: "2px solid #E4C77B", borderTop: "2px solid transparent", borderRadius: "50%" }} />
                                ) : (
                                    <Icon.Refresh />
                                )}
                            </button>
                            <Link to="/" className="li-font-mono" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#E4C77B", textDecoration: "none" }}>
                                Back to home
                            </Link>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                            <div style={{ width: 46, height: 46, borderRadius: "50%", border: "1px solid rgba(228,199,123,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E4C77B", flexShrink: 0, marginTop: 4 }}>
                                <Icon.Compass />
                            </div>
                            <div>
                                <p className="li-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", marginBottom: 8 }}>
                                    Field notes from the ground
                                </p>
                                <h1 className="li-font-display" style={{ fontStyle: "italic", fontSize: 36, fontWeight: 500, color: "#fff", margin: 0, lineHeight: 1.05 }}>
                                    Local Insights
                                </h1>
                                <p style={{ fontSize: 12.5, color: "rgba(237,226,196,0.65)", marginTop: 6 }}>
                                    Real tips, hidden gems, and honest reviews from travelers on the ground
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/reviews')}
                            className="action-btn"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "11px 24px",
                                borderRadius: 999,
                                border: "1.5px solid rgba(228,199,123,0.6)",
                                background: "rgba(228,199,123,0.12)",
                                color: "#E4C77B",
                                fontSize: 12,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                fontFamily: "'IBM Plex Mono', monospace",
                                backdropFilter: "blur(4px)",
                            }}
                        >
                            <Icon.Star />
                            Write Review
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: 24, marginTop: 28, alignItems: "stretch" }}>
                        <div className="stat-block">
                            <div className="stat-block__num">{stats.insights}</div>
                            <div className="stat-block__label">Items</div>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-block">
                            <div className="stat-block__num">{stats.places}</div>
                            <div className="stat-block__label">Places</div>
                        </div>
                        <div className="stat-divider" />
                        <div className="stat-block">
                            <div className="stat-block__num">{stats.categories}</div>
                            <div className="stat-block__label">Categories</div>
                        </div>
                    </div>
                </div>
                <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
                    <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
                </svg>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ maxWidth: 900, margin: "0 auto", padding: "30px 20px 0" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 22 }}>
                    <button
                        onClick={() => setShowSuggestionModal(true)}
                        className="action-btn"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "11px 24px",
                            borderRadius: 999,
                            border: "2px solid #072E2A",
                            background: "#072E2A",
                            color: "#E4C77B",
                            fontSize: 12,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            fontFamily: "'IBM Plex Mono', monospace",
                        }}
                    >
                        <Icon.Plus />
                        Suggest
                    </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                    <p className="li-font-mono" style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#0E5C53", margin: 0 }}>
                        Implemented Suggestions ({filteredCount})
                    </p>
                    <p style={{ fontSize: 11, color: "#8A9A95", margin: 0 }}>
                        {totalItems} total items
                    </p>
                </div>

                <div style={{ marginBottom: 22 }}>
                    <ZariDivider />
                </div>

                {/* Category Filter */}
                {insights.length > 0 && !loading && (
                    <div style={{ display: "flex", gap: 22, marginBottom: 24, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "thin", WebkitOverflowScrolling: "touch", borderBottom: "1px solid rgba(199,154,62,0.2)" }}>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className="li-font-mono"
                                style={{
                                    background: "none",
                                    border: "none",
                                    borderBottom: activeCategory === cat ? "2px solid #0E5C53" : "2px solid transparent",
                                    marginBottom: -11,
                                    paddingBottom: 10,
                                    color: activeCategory === cat ? "#0E5C53" : "#8A9A95",
                                    fontSize: 11.5,
                                    letterSpacing: "0.06em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    fontWeight: activeCategory === cat ? 600 : 400,
                                    transition: "color 0.2s ease",
                                }}
                            >
                                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                )}

                {/* ✅ GRID */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <div style={{ display: "inline-block", width: 30, height: 30, border: "2px solid #C79A3E", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <p style={{ marginTop: 12, color: "#5C6E69", fontSize: 13 }}>Loading...</p>
                    </div>
                ) : insights.length === 0 ? (
                    <div className="empty-state">
                        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid rgba(199,154,62,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#C79A3E" }}>
                            <Icon.Bulb />
                        </div>
                        <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
                            No implemented suggestions yet
                        </p>
                        <p style={{ fontSize: 13, marginTop: 8 }}>
                            Check back later or suggest a new destination!
                        </p>
                        <button
                            onClick={() => setShowSuggestionModal(true)}
                            style={{
                                marginTop: 18,
                                padding: "10px 24px",
                                borderRadius: 999,
                                border: "1px solid #072E2A",
                                background: "#072E2A",
                                color: "#E4C77B",
                                fontSize: 11,
                                cursor: "pointer",
                                fontFamily: "'IBM Plex Mono', monospace",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <Icon.Plus /> Suggest a Destination
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                            gap: 18
                        }}>
                            {paginatedItems.map((insight, idx) => {
                                const hasImage = insight.image && insight.image.length > 0;
                                const t = TYPE_STYLE[insight.typeDisplay] || TYPE_STYLE.insight;
                                const TypeIcon = t.icon;
                                const authorLabel = insight.author || 'Anonymous Traveler';
                                const mailLabel = insight.email || insight.user_email || '';

                                return (
                                    <div
                                        key={insight.id}
                                        className="insight-card"
                                        style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                                        onClick={() => openDetailModal(insight)}
                                    >
                                        <div className="insight-card__media">
                                            {hasImage ? (
                                                <img
                                                    src={insight.image}
                                                    alt={insight.place}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        const parent = e.target.parentElement;
                                                        const fallback = parent.querySelector('.insight-card__fallback');
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className="insight-card__fallback" style={{ display: hasImage ? 'none' : 'flex' }}>
                                                <TypeIcon width="34" height="34" />
                                            </div>
                                            <span className="insight-card__type" style={{ background: t.bg, color: t.fg }}>
                                                <TypeIcon />
                                                {insight.typeLabel}
                                            </span>
                                            {insight.rating ? (
                                                <span className="insight-card__rating">
                                                    <Icon.Star /> {insight.rating}
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="insight-card__body">
                                            <p className="li-font-display insight-card__place">{insight.place || 'Unknown Place'}</p>

                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                                {insight.district && insight.district !== 'Unknown' && (
                                                    <span className="insight-card__district">
                                                        <Icon.Pin /> {insight.district}
                                                    </span>
                                                )}
                                                {insight.category && insight.category !== 'other' && insight.category !== 'general' && (
                                                    <span className="insight-card__category">
                                                        <Icon.Tag /> {insight.category}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="insight-card__meta">
                                                <div className="insight-card__author">
                                                    <div className="insight-card__avatar">{authorLabel?.[0]?.toUpperCase() || 'U'}</div>
                                                    {mailLabel ? (
                                                        <span className="insight-card__mail" title={mailLabel}>
                                                            {mailLabel}
                                                        </span>
                                                    ) : (
                                                        <span className="insight-card__mail" style={{ fontStyle: 'italic' }}>{authorLabel}</span>
                                                    )}
                                                </div>
                                                <Icon.Mail style={{ color: '#C79A3E', flexShrink: 0 }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ✅ Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 28,
                                paddingTop: 18,
                                borderTop: "1px solid rgba(199,154,62,0.15)",
                                flexWrap: "wrap"
                            }}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="pagination-btn"
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: 6,
                                        border: "1px solid rgba(199,154,62,0.25)",
                                        background: "transparent",
                                        color: currentPage === 1 ? "#ccc" : "#0B2422",
                                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                        fontSize: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        opacity: currentPage === 1 ? 0.5 : 1,
                                    }}
                                >
                                    <Icon.Back width="12" height="12" /> Prev
                                </button>

                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                                            style={{
                                                padding: "8px 14px",
                                                borderRadius: 6,
                                                border: currentPage === pageNum ? "1px solid #C79A3E" : "1px solid rgba(199,154,62,0.25)",
                                                background: currentPage === pageNum ? "#C79A3E" : "transparent",
                                                color: currentPage === pageNum ? "#fff" : "#0B2422",
                                                cursor: "pointer",
                                                fontSize: 12,
                                                fontWeight: currentPage === pageNum ? 600 : 400,
                                                minWidth: 36,
                                            }}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="pagination-btn"
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: 6,
                                        border: "1px solid rgba(199,154,62,0.25)",
                                        background: "transparent",
                                        color: currentPage === totalPages ? "#ccc" : "#0B2422",
                                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                        fontSize: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        opacity: currentPage === totalPages ? 0.5 : 1,
                                    }}
                                >
                                    Next <Icon.Back width="12" height="12" style={{ transform: 'rotate(180deg)' }} />
                                </button>
                            </div>
                        )}

                        {/* Page info */}
                        {filteredCount > 0 && (
                            <div style={{
                                textAlign: "center",
                                marginTop: 14,
                                fontSize: 12,
                                color: "#8A9A95",
                                fontFamily: "'IBM Plex Mono', monospace"
                            }}>
                                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredCount)} of {filteredCount} items
                                {totalItems !== filteredCount && ` (filtered from ${totalItems} total)`}
                            </div>
                        )}
                    </>
                )}

                {/* CTA Section */}
                {!loading && !refreshing && (
                    <div style={{ marginTop: 36, borderRadius: 14, border: "2px dashed rgba(199,154,62,0.4)", padding: "42px 24px", textAlign: "center", background: "radial-gradient(circle at top right, rgba(199,154,62,0.06), transparent 60%)" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid #C79A3E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "#C79A3E" }}>
                            <Icon.Sparkle />
                        </div>
                        <h3 className="li-font-display" style={{ fontSize: 23, fontStyle: "italic", color: "#0B2422", margin: "0 0 6px" }}>Know a hidden gem?</h3>
                        <p style={{ fontSize: 14, color: "#5C6E69", margin: "0 0 22px", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                            Suggest a destination or write a review to help fellow travelers!
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                                onClick={() => setShowSuggestionModal(true)}
                                className="li-font-mono action-btn"
                                style={{ padding: "13px 32px", borderRadius: 999, border: "1px solid #0B2422", background: "#0B2422", color: "#fff", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                            >
                                <Icon.Sparkle width="14" height="14" /> Suggest
                            </button>
                            <button
                                onClick={() => navigate('/reviews')}
                                className="li-font-mono action-btn"
                                style={{ padding: "13px 32px", borderRadius: 999, border: "1px solid #0E5C53", background: "transparent", color: "#0E5C53", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                            >
                                <Icon.Star width="13" height="13" /> Write a Review
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* SUGGEST MODAL */}
            {showSuggestionModal && (
                <div className="modal-overlay" onClick={() => setShowSuggestionModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <h2 className="li-font-display" style={{ fontSize: 25, fontStyle: "italic", color: "#0B2422", margin: 0 }}>Suggest a Destination</h2>
                            <button onClick={() => setShowSuggestionModal(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#5C6E69", lineHeight: 1 }}>×</button>
                        </div>
                        <p style={{ fontSize: 13, color: "#5C6E69", marginBottom: 22 }}>
                            Share a hidden gem with our local guides. They'll review and add it to our collection.
                        </p>

                        {submitError && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #FCA5A5" }}>
                                <Icon.Alert /> {submitError}
                            </div>
                        )}

                        {submitSuccess && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#DCFCE7", color: "#16A34A", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #86EFAC" }}>
                                <Icon.Check /> Your suggestion has been submitted successfully!
                            </div>
                        )}

                        <form onSubmit={handleSubmitSuggestion} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label className="field-label">Place Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Ranipuram, Kottayam"
                                    className="field-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="field-label">District *</label>
                                <select
                                    required
                                    className="field-input"
                                    value={formData.district}
                                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                >
                                    <option value="">Select District</option>
                                    <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                                    <option value="Kollam">Kollam</option>
                                    <option value="Pathanamthitta">Pathanamthitta</option>
                                    <option value="Alappuzha">Alappuzha</option>
                                    <option value="Kottayam">Kottayam</option>
                                    <option value="Idukki">Idukki</option>
                                    <option value="Ernakulam">Ernakulam</option>
                                    <option value="Thrissur">Thrissur</option>
                                    <option value="Palakkad">Palakkad</option>
                                    <option value="Malappuram">Malappuram</option>
                                    <option value="Kozhikode">Kozhikode</option>
                                    <option value="Wayanad">Wayanad</option>
                                    <option value="Kannur">Kannur</option>
                                    <option value="Kasaragod">Kasaragod</option>
                                </select>
                                <p style={{ fontSize: 11, color: "#8A9A95", marginTop: 4 }}>This will be sent to guides in this district</p>
                            </div>

                            <div>
                                <label className="field-label">Category</label>
                                {!showCustomCategoryInput ? (
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <select
                                            className="field-input"
                                            value={formData.category}
                                            onChange={(e) => {
                                                if (e.target.value === '__custom__') {
                                                    setShowCustomCategoryInput(true);
                                                    setCustomCategory('');
                                                } else {
                                                    setFormData({ ...formData, category: e.target.value });
                                                }
                                            }}
                                        >
                                            <option value="">Select category</option>
                                            {availableCategories
                                                .filter(c => c && c.trim() !== '')
                                                .sort()
                                                .map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                    </option>
                                                ))
                                            }
                                            <option value="__custom__">+ Add new category...</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="custom-category-input">
                                        <input
                                            type="text"
                                            placeholder="Enter new category name..."
                                            value={customCategory}
                                            onChange={(e) => {
                                                setCustomCategory(e.target.value);
                                                setFormData({ ...formData, category: e.target.value });
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (customCategory.trim()) {
                                                    const newCategory = customCategory.trim().toLowerCase();
                                                    setAvailableCategories(prev => {
                                                        if (!prev.includes(newCategory)) {
                                                            return [...prev, newCategory].sort();
                                                        }
                                                        return prev;
                                                    });
                                                    setFormData({ ...formData, category: newCategory });
                                                    setShowCustomCategoryInput(false);
                                                    setCustomCategory('');
                                                }
                                            }}
                                        >
                                            Add
                                        </button>
                                        <button
                                            type="button"
                                            className="cancel-btn"
                                            onClick={() => {
                                                setShowCustomCategoryInput(false);
                                                setCustomCategory('');
                                                setFormData({ ...formData, category: '' });
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                <p style={{ fontSize: 11, color: "#8A9A95", marginTop: 4 }}>
                                    {availableCategories.length} categories available. Add your own!
                                </p>
                            </div>

                            <div>
                                <label className="field-label">Location Info</label>
                                <input
                                    type="text"
                                    placeholder="e.g., District, nearby landmarks, how to reach"
                                    className="field-input"
                                    value={formData.location_info}
                                    onChange={(e) => setFormData({ ...formData, location_info: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="field-label">Description *</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Describe this place in detail... What makes it special? Any tips for travelers?"
                                    className="field-input"
                                    style={{ resize: "vertical" }}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="field-label">Upload Photo</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "#FBF6EA", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#0B2422" }}>
                                        <Icon.Camera /> Choose Image
                                        <input
                                            id="image-upload-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ display: "none" }}
                                        />
                                    </label>
                                    {imagePreview && (
                                        <button type="button" onClick={removeImage} style={{ background: "none", border: "none", color: "#DC2626", fontSize: 13, cursor: "pointer" }}>Remove</button>
                                    )}
                                </div>
                                <p style={{ fontSize: 11, color: "#8A9A95", marginTop: 4 }}>Max 5MB.</p>
                                {imagePreview && (
                                    <div style={{ marginTop: 8 }}>
                                        <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(199,154,62,0.2)' }} />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: 8, background: "#f0f7f5", padding: "14px", borderRadius: 8, fontSize: 12, color: "#0E5C53", lineHeight: 1.5 }}>
                                <Icon.Bulb style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>Your suggestion will be sent to our local guides for review. Once implemented, it will appear for all travelers to see.</span>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                    padding: "14px 28px",
                                    borderRadius: 999,
                                    border: "none",
                                    background: submitting ? "#9CA3AF" : "#072E2A",
                                    color: "#E4C77B",
                                    fontSize: 12,
                                    letterSpacing: "0.15em",
                                    textTransform: "uppercase",
                                    cursor: submitting ? "not-allowed" : "pointer",
                                    opacity: submitting ? 0.6 : 1,
                                    fontFamily: "'IBM Plex Mono', monospace",
                                }}
                            >
                                <Icon.Send /> {submitting ? 'Submitting...' : 'Submit Suggestion'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL */}
            {showDetailModal && selectedInsight && (
                <div className="modal-overlay" onClick={closeDetailModal}>
                    <div className="modal-content-detail" onClick={(e) => e.stopPropagation()}>
                        <div className="detail-hero">
                            {selectedInsight.image ? (
                                <img
                                    src={selectedInsight.image}
                                    alt={selectedInsight.place}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            ) : null}
                            <div className="detail-hero__overlay" />
                            <button className="detail-close" onClick={closeDetailModal}>×</button>
                            <div className="detail-hero__title">
                                <h2 className="li-font-display" style={{ fontSize: 26, fontStyle: "italic", margin: 0 }}>{selectedInsight.place}</h2>
                            </div>
                        </div>

                        <div className="detail-body">
                            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                                {(() => {
                                    const t = TYPE_STYLE[selectedInsight.typeDisplay] || TYPE_STYLE.insight;
                                    const TypeIcon = t.icon;
                                    return (
                                        <span className="pill" style={{ background: t.bg, color: t.fg }}>
                                            <TypeIcon /> {selectedInsight.typeLabel || 'Insight'}
                                        </span>
                                    );
                                })()}
                                {selectedInsight.category && selectedInsight.category !== 'other' && selectedInsight.category !== 'general' && (
                                    <span className="pill" style={{ background: 'rgba(14,92,83,0.13)', color: '#0E5C53' }}>
                                        <Icon.Tag /> {selectedInsight.category}
                                    </span>
                                )}
                                {selectedInsight.district && selectedInsight.district !== 'Unknown' && (
                                    <span className="pill" style={{ background: "rgba(199,154,62,0.2)", color: "#8A6A1F" }}>
                                        <Icon.Pin /> {selectedInsight.district}
                                    </span>
                                )}
                                {selectedInsight.rating && (
                                    <span className="pill" style={{ background: 'rgba(255,152,0,0.14)', color: '#B4700C' }}>
                                        <Icon.Star /> {selectedInsight.rating}/5
                                    </span>
                                )}
                            </div>

                            <div className="author-strip" style={{ marginBottom: 18 }}>
                                <div className="author-strip__avatar">
                                    {selectedInsight.author?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>
                                        {selectedInsight.author || 'Anonymous Traveler'}
                                    </p>
                                    <p className="author-strip__mail" style={{ margin: "2px 0 0" }}>
                                        <Icon.Mail /> {selectedInsight.email || 'No email provided'}
                                    </p>
                                </div>
                                <p className="li-font-mono" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#5C6E69", flexShrink: 0 }}>
                                    <Icon.Calendar /> {selectedInsight.created_at ? new Date(selectedInsight.created_at).toLocaleDateString() : 'Recently'}
                                </p>
                            </div>

                            {selectedInsight.location && (
                                <div style={{ marginBottom: 14 }}>
                                    <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#0B2422", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.03em" }}><Icon.Pin /> Location</h4>
                                    <p style={{ fontSize: 13, color: "#5C6E69", margin: 0 }}>{selectedInsight.location}</p>
                                </div>
                            )}

                            <div style={{ marginBottom: 14 }}>
                                <h4 style={{ fontSize: 12.5, fontWeight: 600, color: "#0B2422", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.03em" }}>Description</h4>
                                <p style={{ fontSize: 13.5, color: "#4A5F5A", lineHeight: 1.65, margin: 0 }}>
                                    {selectedInsight.description || selectedInsight.tip || 'No description provided.'}
                                </p>
                            </div>

                            {selectedInsight.tip && selectedInsight.tip !== selectedInsight.description && (
                                <div style={{ marginBottom: 14, background: "#F0F7F5", padding: "14px 16px", borderRadius: 10, borderLeft: "3px solid #0E5C53" }}>
                                    <h4 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#0E5C53", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.03em" }}><Icon.Bulb /> Tips</h4>
                                    <p style={{ fontSize: 13.5, color: "#4A5F5A", lineHeight: 1.65, margin: 0 }}>{selectedInsight.tip}</p>
                                </div>
                            )}

                            {selectedInsight.admin_notes && (
                                <div style={{ marginBottom: 6, background: "rgba(45,143,110,0.08)", padding: "12px 16px", borderRadius: 8, borderLeft: "3px solid #2D8F6E" }}>
                                    <h4 className="li-font-mono" style={{ fontSize: 11.5, color: "#2D8F6E", fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase" }}>Implementation Notes</h4>
                                    <p style={{ fontSize: 13, color: "#3D5A57", margin: 0, lineHeight: 1.5 }}>{selectedInsight.admin_notes}</p>
                                </div>
                            )}

                            <button
                                onClick={closeDetailModal}
                                className="li-font-mono"
                                style={{
                                    marginTop: 18,
                                    padding: "12px 24px",
                                    borderRadius: 999,
                                    border: "1px solid #0B2422",
                                    background: "transparent",
                                    color: "#0B2422",
                                    fontSize: 11,
                                    letterSpacing: "0.15em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                    width: "100%",
                                }}
                            >
                                Close
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

export default LocalInsights;
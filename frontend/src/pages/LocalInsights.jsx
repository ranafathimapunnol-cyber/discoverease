// pages/LocalInsights.jsx - FIXED VERSION with place as heading and email below

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ============================================
// IMAGE HANDLER HELPER
// ============================================
const getImageUrl = (item) => {
  if (!item) return null;
  
  const imageField = item.image_url || item.image || item.profile_image || item.photo || item.avatar;
  if (!imageField || typeof imageField !== 'string') return null;
  
  const cleanedUrl = imageField.trim();
  if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
    return cleanedUrl;
  }
  if (cleanedUrl.startsWith('/media/') || cleanedUrl.startsWith('/uploads/')) {
    const baseURL = api.defaults?.baseURL || 'http://localhost:8000';
    const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    const mediaBase = cleanBase.replace('/api', '');
    return `${mediaBase}${cleanedUrl}`;
  }
  if (cleanedUrl.startsWith('data:image')) {
    return cleanedUrl;
  }
  return null;
};

// ============================================
// GET TYPE BADGE AND LABEL
// ============================================
const getTypeInfo = (item) => {
  if (!item) return { label: '💡 Insight', emoji: '💡', type: 'insight' };
  
  const type = item.suggestion_type || item.type || item._type || '';
  const lowerType = type.toLowerCase().trim();
  
  if (lowerType === 'review') {
    return { label: '⭐ Review', emoji: '⭐', type: 'review' };
  }
  if (lowerType === 'hidden_gem' || lowerType === 'hidden gem') {
    return { label: '💎 Hidden Gem', emoji: '💎', type: 'hidden_gem' };
  }
  return { label: '💡 Local Insight', emoji: '💡', type: 'insight' };
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

    const [page, setPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const observerRef = useRef(null);
    const lastElementRef = useRef(null);
    const fetchCalled = useRef(false);
    const isMounted = useRef(true);

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
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // ============================================
    // CLEAR CACHE FUNCTION
    // ============================================
    const clearCache = () => {
        try {
            localStorage.removeItem('local_insights');
            console.log('🗑️ Local insights cache cleared');
        } catch (e) {
            console.log('Cache clear failed:', e);
        }
    };

    // ============================================
    // FORCE REFRESH
    // ============================================
    const forceRefresh = useCallback(() => {
        clearCache();
        fetchCalled.current = false;
        setPage(1);
        setInsights([]);
        setTotalItems(0);
        setHasMore(true);
        fetchInsights(true, 1);
    }, []);

    // ============================================
    // HANDLE IMAGE CHANGE
    // ============================================
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

    // ============================================
    // FETCH INSIGHTS - ALL IMPLEMENTED SUGGESTIONS
    // ============================================
    const fetchInsights = useCallback(async (isRefresh = false, pageNum = 1) => {
        console.log('🔍 Fetching ALL implemented suggestions...', { isRefresh, pageNum });
        
        if (!isLoggedIn) {
            console.log('⚠️ User not logged in');
            setLoading(false);
            return;
        }

        if (isRefresh) {
            setRefreshing(true);
            setPage(1);
            setInsights([]);
            setHasMore(true);
            clearCache();
        }

        if (!isRefresh && pageNum > 1) {
            setIsLoadingMore(true);
        }

        try {
            // ✅ Fetch ALL suggestions with implemented status
            const response = await api.get('/suggestions/', {
                params: {
                    status: 'implemented',
                    page: pageNum,
                    page_size: 20
                }
            });
            
            console.log('📊 API Response:', response.data);

            let allItems = [];
            let totalCount = 0;

            // Parse response - handle nested results structure
            if (response.data?.results?.data && Array.isArray(response.data.results.data)) {
                allItems = response.data.results.data;
                totalCount = response.data.results.count || allItems.length;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                allItems = response.data.data;
                totalCount = response.data.count || allItems.length;
            } else if (response.data?.results && Array.isArray(response.data.results)) {
                allItems = response.data.results;
                totalCount = response.data.count || allItems.length;
            } else if (Array.isArray(response.data)) {
                allItems = response.data;
                totalCount = allItems.length;
            }

            console.log(`📊 Total items from API: ${allItems.length}`);

            // ✅ Log what types we found
            const typeCounts = {};
            allItems.forEach(item => {
                const type = item.suggestion_type || 'unknown';
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });
            console.log('📊 Type counts:', typeCounts);

            // ✅ Only use localStorage if API returned NO items
            if (allItems.length === 0 && pageNum === 1) {
                console.log('🔄 No items from API, checking localStorage...');
                try {
                    const localInsights = JSON.parse(localStorage.getItem('local_insights') || '[]');
                    if (localInsights.length > 0 && !isRefresh) {
                        console.log(`✅ Found ${localInsights.length} items in localStorage (cached)`);
                        allItems = localInsights;
                        totalCount = localInsights.length;
                    }
                } catch (e) {
                    console.log('⚠️ localStorage read failed:', e.message);
                }
            }

            // ✅ Format all items with their correct types
            const formattedItems = allItems.map(s => {
                const typeInfo = getTypeInfo(s);
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
                    image: getImageUrl(s) || null,
                    description: s.description || s.review_text || s.tip || s.content || '',
                    rating: s.rating || null,
                    user_email: s.user_email || s.user?.email,
                    username: s.username || s.user?.username,
                    suggestion_type: s.suggestion_type || s.type || 'local_insight',
                    // ✅ Type info for display
                    typeLabel: typeInfo.label,
                    typeEmoji: typeInfo.emoji,
                    typeDisplay: typeInfo.type,
                };
            });

            // ✅ Update state
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
                setHasMore(formattedItems.length === 20 && formattedItems.length > 0);

                const uniquePlaces = new Set(formattedItems.map(i => i.place).filter(Boolean));
                const uniqueCategories = new Set(formattedItems.map(i => i.category).filter(Boolean));
                
                setStats({
                    insights: formattedItems.length,
                    places: uniquePlaces.size,
                    categories: uniqueCategories.size
                });

                // ✅ Cache the insights
                if (formattedItems.length > 0) {
                    try {
                        localStorage.setItem('local_insights', JSON.stringify(formattedItems));
                    } catch (e) {}
                }
            }

        } catch (error) {
            console.error('❌ Error fetching insights:', error);
            
            // ✅ Fallback to localStorage
            if (isMounted.current && insights.length === 0) {
                try {
                    const localInsights = JSON.parse(localStorage.getItem('local_insights') || '[]');
                    if (localInsights.length > 0) {
                        setInsights(localInsights);
                        setTotalItems(localInsights.length);
                        setHasMore(false);
                        setStats({
                            insights: localInsights.length,
                            places: new Set(localInsights.map(i => i.place).filter(Boolean)).size,
                            categories: new Set(localInsights.map(i => i.category).filter(Boolean)).size
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
                setIsLoadingMore(false);
            }
        }
    }, [isLoggedIn, insights.length]);

    // Load more
    const loadMore = useCallback(() => {
        if (!hasMore || isLoadingMore || refreshing || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchInsights(false, nextPage);
    }, [hasMore, isLoadingMore, refreshing, loading, page, fetchInsights]);

    // Intersection Observer
    useEffect(() => {
        if (loading || refreshing || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (lastElementRef.current) {
            observer.observe(lastElementRef.current);
        }

        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loading, refreshing, hasMore, loadMore]);

    // Initial fetch
    useEffect(() => {
        if (isLoggedIn && !fetchCalled.current) {
            fetchCalled.current = true;
            setTimeout(() => {
                fetchInsights(true, 1);
            }, 300);
        } else if (!isLoggedIn) {
            setLoading(false);
        }
    }, [isLoggedIn, fetchInsights]);

    // Handle refresh
    const handleRefresh = () => {
        if (refreshing || loading) return;
        forceRefresh();
    };

    // ============================================
    // HANDLE SUBMIT
    // ============================================
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
            formDataObj.append('category', formData.category || 'general');
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
                setSubmitSuccess(true);
                alert('✅ Your local insight has been sent to the guides!');
                setShowSuggestionModal(false);
                resetForm();
                
                clearCache();
                setPage(1);
                fetchCalled.current = true;
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

    const categories = ['all', ...Array.from(new Set(insights.map(i => i.category).filter(Boolean)))];
    const filteredInsights = activeCategory === 'all'
        ? insights
        : insights.filter(i => i.category === activeCategory);

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
                .insight-card { transition: all 0.3s ease; cursor: pointer; }
                .insight-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .type-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 8px; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid rgba(199,154,62,0.2); }
                .category-badge { display: inline-block; padding: 2px 12px; border-radius: 999px; font-size: 9px; letter-spacing: 0.05em; text-transform: uppercase; background: rgba(199,154,62,0.15); color: #0E5C53; }
                .category-chip { padding: 6px 16px; border-radius: 999px; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; transition: all 0.25s ease; font-family: 'IBM Plex Mono', monospace; white-space: nowrap; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-content { background: #FBF6EA; border-radius: 12px; padding: 32px; max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(199,154,62,0.3); }
                .modal-content-detail { background: #FBF6EA; border-radius: 12px; padding: 32px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(199,154,62,0.3); }
                .refresh-btn { transition: transform 0.3s ease; }
                .refresh-btn:hover { transform: rotate(180deg); }
                .action-btn { transition: all 0.3s ease; }
                .action-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
                .spinning { animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            {/* HEADER */}
            <div style={{ background: "#072E2A", padding: "40px 20px 30px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
                <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                        <Link to="/" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(199,154,62,0.5)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                            <svg width="16" height="16" fill="none" stroke="#E4C77B" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
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
                                    <div className="spinning" style={{ width: 16, height: 16, border: "2px solid #E4C77B", borderTop: "2px solid transparent", borderRadius: "50%" }} />
                                ) : (
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )}
                            </button>
                            <Link to="/" className="li-font-mono" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#E4C77B", textDecoration: "none" }}>
                                Back to home
                            </Link>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                        <div>
                            <p className="li-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", marginBottom: 8 }}>
                                Field notes from the ground
                            </p>
                            <h1 className="li-font-display" style={{ fontStyle: "italic", fontSize: 34, fontWeight: 500, color: "#fff", margin: 0, lineHeight: 1.05 }}>
                                Local Insights
                            </h1>
                            <p style={{ fontSize: 12, color: "rgba(237,226,196,0.6)", marginTop: 4 }}>
                                🌟 All implemented suggestions from travelers
                            </p>
                        </div>
                        
                        <button
                            onClick={() => navigate('/reviews')}
                            className="action-btn"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "10px 22px",
                                borderRadius: 999,
                                border: "2px solid rgba(228,199,123,0.6)",
                                background: "rgba(228,199,123,0.12)",
                                color: "#E4C77B",
                                fontSize: 12,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                cursor: "pointer",
                                fontFamily: "'IBM Plex Mono', monospace",
                                transition: "all 0.3s ease",
                                backdropFilter: "blur(4px)",
                            }}
                        >
                            <span style={{ fontSize: 16 }}>⭐</span>
                            Write Review
                        </button>
                    </div>

                    <p style={{ fontSize: 13, color: "rgba(237,226,196,0.75)", maxWidth: 460, lineHeight: 1.5, marginTop: 10 }}>
                        Discover implemented suggestions from travelers across Kerala.
                        {stats.insights > 0 && ` Currently showing ${stats.insights} items.`}
                        {(refreshing) && ` 🔄 Refreshing...`}
                    </p>

                    <div style={{ display: "flex", gap: 22, marginTop: 24 }}>
                        <div>
                            <div className="li-font-display" style={{ fontSize: 20, color: "#E4C77B" }}>{stats.insights}</div>
                            <div className="li-font-mono" style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(237,226,196,0.6)" }}>items</div>
                        </div>
                        <div>
                            <div className="li-font-display" style={{ fontSize: 20, color: "#E4C77B" }}>{stats.places}</div>
                            <div className="li-font-mono" style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(237,226,196,0.6)" }}>places</div>
                        </div>
                        <div>
                            <div className="li-font-display" style={{ fontSize: 20, color: "#E4C77B" }}>{stats.categories}</div>
                            <div className="li-font-mono" style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(237,226,196,0.6)" }}>categories</div>
                        </div>
                    </div>
                </div>
                <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
                    <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
                </svg>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 0" }}>
                
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                    <button
                        onClick={() => setShowSuggestionModal(true)}
                        className="action-btn"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 22px",
                            borderRadius: 999,
                            border: "2px solid #072E2A",
                            background: "#072E2A",
                            color: "#E4C77B",
                            fontSize: 12,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            fontFamily: "'IBM Plex Mono', monospace",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <span style={{ fontSize: 16 }}>+</span>
                        Suggest
                    </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                    <p className="li-font-mono" style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#0E5C53", margin: 0 }}>
                        Implemented Suggestions ({filteredInsights.length})
                    </p>
                    <p style={{ fontSize: 11, color: "#8A9A95", margin: 0 }}>
                        {totalItems} total items
                    </p>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <ZariDivider />
                </div>

                {/* Category Filter */}
                {insights.length > 0 && !loading && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className="category-chip"
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    border: activeCategory === cat ? '2px solid #0E5C53' : '1px solid rgba(199,154,62,0.35)',
                                    background: activeCategory === cat ? '#0E5C53' : 'transparent',
                                    color: activeCategory === cat ? '#fff' : '#5C6E69',
                                    padding: "6px 18px",
                                    borderRadius: 999,
                                    fontSize: 11,
                                    letterSpacing: "0.05em",
                                    textTransform: "uppercase",
                                    cursor: "pointer",
                                    transition: "all 0.25s ease",
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {cat === 'all' ? 'All' : cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Insights List */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <div style={{ display: "inline-block", width: 30, height: 30, border: "2px solid #C79A3E", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <p style={{ marginTop: 12, color: "#5C6E69", fontSize: 13 }}>Loading...</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
                        {filteredInsights.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px 20px", color: "#5C6E69", background: "#fff", borderRadius: 8, border: "1px solid rgba(199,154,62,0.15)" }}>
                                <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
                                    No implemented suggestions yet
                                </p>
                                <p style={{ fontSize: 13, marginTop: 8 }}>
                                    Check back later or suggest a new destination!
                                </p>
                                <button
                                    onClick={() => setShowSuggestionModal(true)}
                                    style={{
                                        marginTop: 16,
                                        padding: "10px 24px",
                                        borderRadius: 999,
                                        border: "1px solid #072E2A",
                                        background: "#072E2A",
                                        color: "#E4C77B",
                                        fontSize: 11,
                                        cursor: "pointer",
                                        fontFamily: "'IBM Plex Mono', monospace"
                                    }}
                                >
                                    + Suggest a Destination
                                </button>
                            </div>
                        ) : (
                            <>
                                {filteredInsights.map((insight, index) => {
                                    // Get type info for display
                                    const typeEmoji = insight.typeEmoji || '💡';
                                    const typeLabel = insight.typeLabel || '💡 Insight';
                                    
                                    return (
                                        <div
                                            key={insight.id}
                                            ref={index === filteredInsights.length - 1 ? lastElementRef : null}
                                            className="insight-card"
                                            onClick={() => openDetailModal(insight)}
                                            style={{
                                                background: "#fff",
                                                borderRadius: 8,
                                                padding: "20px 24px",
                                                border: "1px solid rgba(199,154,62,0.25)",
                                                position: 'relative',
                                                transition: "all 0.3s ease",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div style={{ display: "flex", gap: 6, position: 'absolute', top: 14, right: 16 }}>
                                                <span className="type-badge" style={{ 
                                                    background: insight.typeDisplay === 'review' ? 'rgba(255,152,0,0.15)' : 
                                                               insight.typeDisplay === 'hidden_gem' ? 'rgba(199,154,62,0.15)' : 
                                                               'rgba(14,92,83,0.15)',
                                                    color: insight.typeDisplay === 'review' ? '#FF9800' : 
                                                           insight.typeDisplay === 'hidden_gem' ? '#C79A3E' : 
                                                           '#0E5C53',
                                                    borderColor: insight.typeDisplay === 'review' ? 'rgba(255,152,0,0.3)' : 
                                                                insight.typeDisplay === 'hidden_gem' ? 'rgba(199,154,62,0.3)' : 
                                                                'rgba(14,92,83,0.3)',
                                                }}>
                                                    {typeEmoji} {typeLabel}
                                                </span>
                                            </div>

                                            <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                                                {insight.image && (
                                                    <div style={{ flexShrink: 0 }}>
                                                        <img 
                                                            src={insight.image} 
                                                            alt={insight.place} 
                                                            style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(199,154,62,0.15)' }} 
                                                        />
                                                    </div>
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {/* ✅ PLACE NAME AS HEADING */}
                                                    <h3 style={{ 
                                                        fontWeight: 600, 
                                                        fontSize: 18, 
                                                        color: "#0B2422", 
                                                        margin: "0 0 4px 0",
                                                        fontFamily: "'Fraunces', serif",
                                                        fontStyle: "italic",
                                                        letterSpacing: "-0.3px",
                                                    }}>
                                                        {insight.place || 'Unknown Place'}
                                                    </h3>
                                                    
                                                    {/* ✅ EMAIL IN GREY BELOW */}
                                                    <p style={{ 
                                                        fontSize: 12, 
                                                        color: "#8A9A95", 
                                                        margin: 0,
                                                        fontFamily: "'IBM Plex Mono', monospace",
                                                        letterSpacing: "0.3px",
                                                    }}>
                                                        {insight.email || insight.author || 'Anonymous'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Description/Tip */}
                                            <p style={{ 
                                                fontSize: 13, 
                                                color: "#4A5F5A", 
                                                margin: "0 0 10px 0", 
                                                lineHeight: 1.6,
                                                paddingLeft: insight.image ? 0 : 0,
                                            }}>
                                                {insight.tip || insight.description}
                                            </p>

                                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                                                {insight.category && insight.category !== 'other' && (
                                                    <span className="category-badge">{insight.category}</span>
                                                )}
                                                {insight.rating && (
                                                    <span className="category-badge" style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800' }}>
                                                        {'★'.repeat(Math.round(insight.rating))} {insight.rating}/5
                                                    </span>
                                                )}
                                                {insight.district && insight.district !== 'Unknown' && (
                                                    <span className="category-badge" style={{ background: 'rgba(199,154,62,0.25)' }}>
                                                        📍 {insight.district}
                                                    </span>
                                                )}
                                                <span className="category-badge" style={{ background: 'rgba(45,143,110,0.15)', color: '#2D8F6E' }}>
                                                    ✅ Implemented
                                                </span>
                                            </div>

                                            <div style={{ marginTop: 10, fontSize: 11, color: "#C79A3E", display: "flex", alignItems: "center", gap: 4 }}>
                                                <span>👆 Click to view details</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {isLoadingMore && (
                                    <div style={{ textAlign: "center", padding: "20px" }}>
                                        <div style={{ display: "inline-block", width: 24, height: 24, border: "2px solid #C79A3E", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                        <p style={{ marginTop: 8, color: "#8A9A95", fontSize: 12 }}>Loading more...</p>
                                    </div>
                                )}
                                
                                {!hasMore && filteredInsights.length > 0 && (
                                    <div style={{ textAlign: "center", padding: "20px", color: "#8A9A95", fontSize: 12 }}>
                                        <p>✨ You've seen all {totalItems} items</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* CTA Section */}
                {!loading && !refreshing && (
                    <div style={{ marginTop: 32, borderRadius: 8, border: "2px dashed rgba(199,154,62,0.4)", padding: "40px 24px", textAlign: "center", background: "radial-gradient(circle at top right, rgba(199,154,62,0.05), transparent 60%)" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid #C79A3E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px" }}>✨</div>
                        <h3 className="li-font-display" style={{ fontSize: 22, color: "#0B2422", margin: "0 0 6px" }}>Know a hidden gem?</h3>
                        <p style={{ fontSize: 14, color: "#5C6E69", margin: "0 0 20px", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
                            Suggest a destination or write a review to help fellow travelers!
                        </p>
                        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                                onClick={() => setShowSuggestionModal(true)}
                                className="li-font-mono"
                                style={{ padding: "12px 32px", borderRadius: 999, border: "1px solid #0B2422", background: "#0B2422", color: "#fff", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s ease" }}
                            >
                                ✨ Suggest
                            </button>
                            <button
                                onClick={() => navigate('/reviews')}
                                className="li-font-mono"
                                style={{ padding: "12px 32px", borderRadius: 999, border: "1px solid #0E5C53", background: "transparent", color: "#0E5C53", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s ease" }}
                            >
                                ⭐ Write a Review
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* SUGGEST MODAL */}
            {showSuggestionModal && (
                <div className="modal-overlay" onClick={() => setShowSuggestionModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 className="li-font-display" style={{ fontSize: 24, color: "#0B2422", margin: 0 }}>Suggest a Destination</h2>
                            <button onClick={() => setShowSuggestionModal(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#5C6E69" }}>×</button>
                        </div>
                        <p style={{ fontSize: 13, color: "#5C6E69", marginBottom: 20 }}>
                            Share a hidden gem with our local guides. They'll review and add it to our collection.
                        </p>

                        {submitError && (
                            <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #FCA5A5" }}>
                                ❌ {submitError}
                            </div>
                        )}

                        {submitSuccess && (
                            <div style={{ background: "#DCFCE7", color: "#16A34A", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, border: "1px solid #86EFAC" }}>
                                ✅ Your suggestion has been submitted successfully!
                            </div>
                        )}

                        <form onSubmit={handleSubmitSuggestion} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Place Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Ranipuram, Kottayam"
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>District *</label>
                                <select
                                    required
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff" }}
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
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Category</label>
                                <select
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Select category</option>
                                    <option value="beach">Beach</option>
                                    <option value="hill">Hill Station</option>
                                    <option value="backwater">Backwater</option>
                                    <option value="heritage">Heritage</option>
                                    <option value="wildlife">Wildlife</option>
                                    <option value="temple">Temple</option>
                                    <option value="waterfalls">Waterfalls</option>
                                    <option value="nature">Nature</option>
                                    <option value="fort">Fort/Palace</option>
                                    <option value="museum">Museum</option>
                                    <option value="camping">Camping</option>
                                    <option value="islands">Islands</option>
                                    <option value="sacred">Sacred Site</option>
                                    <option value="off-road">Off Road</option>
                                    <option value="parks">Parks</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Location Info</label>
                                <input
                                    type="text"
                                    placeholder="e.g., District, nearby landmarks, how to reach"
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                                    value={formData.location_info}
                                    onChange={(e) => setFormData({ ...formData, location_info: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Description *</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Describe this place in detail... What makes it special? Any tips for travelers?"
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff", resize: "vertical" }}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Upload Photo</label>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <label style={{ cursor: "pointer", background: "#FBF6EA", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 8, padding: "10px 16px", transition: "all 0.3s ease", fontSize: 13, color: "#0B2422" }}>
                                        <span>📷 Choose Image</span>
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

                            <div style={{ background: "#f0f7f5", padding: "14px", borderRadius: 8, fontSize: 12, color: "#0E5C53", lineHeight: 1.5 }}>
                                💡 Your suggestion will be sent to our local guides for review. Once implemented, it will appear for all travelers to see.
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
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
                                    transition: "all 0.3s ease"
                                }}
                            >
                                {submitting ? 'Submitting...' : '📤 Submit Suggestion'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL */}
            {showDetailModal && selectedInsight && (
                <div className="modal-overlay" onClick={closeDetailModal}>
                    <div className="modal-content-detail" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h2 className="li-font-display" style={{ fontSize: 24, color: "#0B2422", margin: 0 }}>{selectedInsight.place}</h2>
                            <button onClick={closeDetailModal} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#5C6E69" }}>×</button>
                        </div>

                        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                            <span className="type-badge" style={{ 
                                background: selectedInsight.typeDisplay === 'review' ? 'rgba(255,152,0,0.15)' : 
                                           selectedInsight.typeDisplay === 'hidden_gem' ? 'rgba(199,154,62,0.15)' : 
                                           'rgba(14,92,83,0.15)',
                                color: selectedInsight.typeDisplay === 'review' ? '#FF9800' : 
                                       selectedInsight.typeDisplay === 'hidden_gem' ? '#C79A3E' : 
                                       '#0E5C53',
                            }}>
                                {selectedInsight.typeEmoji || '💡'} {selectedInsight.typeLabel || 'Insight'}
                            </span>
                            {selectedInsight.category && <span className="category-badge">{selectedInsight.category}</span>}
                            {selectedInsight.district && <span className="category-badge" style={{ background: "rgba(199,154,62,0.25)" }}>📍 {selectedInsight.district}</span>}
                            {selectedInsight.rating && (
                                <span className="category-badge" style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800' }}>
                                    {'★'.repeat(Math.round(selectedInsight.rating))} {selectedInsight.rating}/5
                                </span>
                            )}
                            <span className="category-badge" style={{ background: 'rgba(45,143,110,0.15)', color: '#2D8F6E' }}>
                                ✅ Implemented
                            </span>
                        </div>

                        {selectedInsight.image && (
                            <div style={{ marginBottom: 16 }}>
                                <img src={selectedInsight.image} alt={selectedInsight.place} style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(199,154,62,0.2)' }} />
                            </div>
                        )}

                        {/* Author Email Section */}
                        <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 12, 
                            marginBottom: 16,
                            padding: "12px 16px",
                            background: "#FBF6EA",
                            borderRadius: 8,
                            border: "1px solid rgba(199,154,62,0.1)",
                        }}>
                            <div style={{ 
                                width: 36, 
                                height: 36, 
                                borderRadius: "50%", 
                                border: "1px solid #C79A3E", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                fontSize: 14, 
                                color: "#0E5C53", 
                                background: "#FBF6EA",
                                flexShrink: 0,
                            }}>
                                {selectedInsight.author?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>
                                    {selectedInsight.author || 'Anonymous Traveler'}
                                </p>
                                <p className="li-font-mono" style={{ fontSize: 11, color: "#8A9A95", margin: 0 }}>
                                    {selectedInsight.email || 'No email provided'}
                                </p>
                            </div>
                            <p className="li-font-mono" style={{ fontSize: 10, color: "#5C6E69", marginLeft: "auto" }}>
                                📅 {selectedInsight.created_at ? new Date(selectedInsight.created_at).toLocaleDateString() : 'Recently'}
                            </p>
                        </div>

                        {selectedInsight.location && (
                            <div style={{ marginBottom: 12 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#0B2422", margin: "0 0 4px" }}>📍 Location</h4>
                                <p style={{ fontSize: 13, color: "#5C6E69", margin: 0 }}>{selectedInsight.location}</p>
                            </div>
                        )}

                        <div style={{ marginBottom: 12 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#0B2422", margin: "0 0 4px" }}>📝 Description</h4>
                            <p style={{ fontSize: 13, color: "#4A5F5A", lineHeight: 1.6, margin: 0 }}>
                                {selectedInsight.description || selectedInsight.tip || 'No description provided.'}
                            </p>
                        </div>

                        {selectedInsight.tip && selectedInsight.tip !== selectedInsight.description && (
                            <div style={{ marginBottom: 12, background: "#F0F7F5", padding: "14px", borderRadius: 8 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#0E5C53", margin: "0 0 4px" }}>💡 Tips</h4>
                                <p style={{ fontSize: 13, color: "#4A5F5A", lineHeight: 1.6, margin: 0 }}>{selectedInsight.tip}</p>
                            </div>
                        )}

                        <button
                            onClick={closeDetailModal}
                            style={{
                                marginTop: 16,
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
                                fontFamily: "'IBM Plex Mono', monospace",
                                transition: "all 0.3s ease"
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <BottomNav />
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" />
        </div>
    );
};

export default LocalInsights;
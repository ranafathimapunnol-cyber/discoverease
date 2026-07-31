// pages/Wishlist.jsx - REMOVED View Details button

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// ============================================
// DISTRICT UTILITIES
// ============================================

const KERALA_DISTRICTS = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
    'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad',
    'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
];

const DISTRICT_ALIASES = {
    thiruvananthapuram: 'Thiruvananthapuram',
    trivandrum: 'Thiruvananthapuram',
    tvm: 'Thiruvananthapuram',
    kollam: 'Kollam',
    quilon: 'Kollam',
    pathanamthitta: 'Pathanamthitta',
    alappuzha: 'Alappuzha',
    alleppey: 'Alappuzha',
    kottayam: 'Kottayam',
    idukki: 'Idukki',
    ernakulam: 'Ernakulam',
    kochi: 'Ernakulam',
    cochin: 'Ernakulam',
    thrissur: 'Thrissur',
    trichur: 'Thrissur',
    palakkad: 'Palakkad',
    palghat: 'Palakkad',
    malappuram: 'Malappuram',
    kozhikode: 'Kozhikode',
    calicut: 'Kozhikode',
    wayanad: 'Wayanad',
    kannur: 'Kannur',
    cannanore: 'Kannur',
    kasaragod: 'Kasaragod',
    kasargod: 'Kasaragod',
};

const LOCATION_TO_DISTRICT = {
    trivandrum: 'Thiruvananthapuram',
    tvm: 'Thiruvananthapuram',
    cochin: 'Ernakulam',
    kochi: 'Ernakulam',
    alleppey: 'Alappuzha',
    calicut: 'Kozhikode',
    quilon: 'Kollam',
    trichur: 'Thrissur',
    palghat: 'Palakkad',
    cannanore: 'Kannur',
    kasargod: 'Kasaragod',
};

const extractDistrictFromLocation = (locationText) => {
    if (!locationText) return null;
    const text = String(locationText).trim();
    if (!text) return null;

    const textLower = text.toLowerCase();

    if (textLower in LOCATION_TO_DISTRICT) {
        return LOCATION_TO_DISTRICT[textLower];
    }

    for (const district of KERALA_DISTRICTS) {
        if (district.toLowerCase() === textLower) {
            return district;
        }
    }

    if (textLower in DISTRICT_ALIASES) {
        return DISTRICT_ALIASES[textLower];
    }

    if (text.includes(',')) {
        const parts = text.split(',').map((p) => p.trim());
        for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i].toLowerCase();
            if (part in LOCATION_TO_DISTRICT) {
                return LOCATION_TO_DISTRICT[part];
            }
            for (const district of KERALA_DISTRICTS) {
                if (district.toLowerCase() === part) {
                    return district;
                }
            }
            if (part in DISTRICT_ALIASES) {
                return DISTRICT_ALIASES[part];
            }
        }
    }

    for (const district of KERALA_DISTRICTS) {
        if (textLower.includes(district.toLowerCase())) {
            return district;
        }
    }

    return null;
};

const standardizeDistrict = (districtName) => {
    if (!districtName) return null;
    const cleaned = String(districtName).trim();
    if (!cleaned) return null;

    const lower = cleaned.toLowerCase();

    if (lower in LOCATION_TO_DISTRICT) {
        return LOCATION_TO_DISTRICT[lower];
    }

    if (lower in DISTRICT_ALIASES) {
        return DISTRICT_ALIASES[lower];
    }

    for (const district of KERALA_DISTRICTS) {
        if (district.toLowerCase() === lower) {
            return district;
        }
    }

    for (const district of KERALA_DISTRICTS) {
        if (lower.includes(district.toLowerCase()) || district.toLowerCase().includes(lower)) {
            return district;
        }
    }

    return cleaned;
};

const getDisplayDistrict = (place) => {
    if (place.standardizedDistrict) {
        return place.standardizedDistrict;
    }

    if (place.district) {
        const std = standardizeDistrict(place.district);
        if (std) return std;
    }

    if (place.location) {
        const extracted = extractDistrictFromLocation(place.location);
        if (extracted) return extracted;
    }

    if (place.name) {
        const extracted = extractDistrictFromLocation(place.name);
        if (extracted) return extracted;
    }

    return 'Location not specified';
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function Wishlist() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const [activeNav, setActiveNav] = useState('wishlist');
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [toast, setToast] = useState(null);

    const fetchWishlist = useCallback(async () => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setRefreshing(true);
            setError(null);

            const response = await api.get('/destinations/wishlist/');

            let items = [];

            if (response.data) {
                let dataArray = [];

                if (response.data.results && Array.isArray(response.data.results)) {
                    dataArray = response.data.results;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    dataArray = response.data.data;
                } else if (Array.isArray(response.data)) {
                    dataArray = response.data;
                }

                items = dataArray.map((item) => {
                    const destinationId = item.destination || item.id || null;
                    const wishlistId = item.id || null;

                    const district = item.destination_district || '';
                    const location = item.destination_description || item.location || '';

                    let extractedDistrict = district;
                    if (!extractedDistrict) {
                        extractedDistrict = extractDistrictFromLocation(location) || '';
                    }

                    const standardized = standardizeDistrict(extractedDistrict || district);

                    return {
                        id: destinationId,
                        wishlistId: wishlistId,
                        name: item.destination_name || item.name || 'Unknown Place',
                        slug: item.destination_slug || item.slug || '',
                        location: district || location,
                        district: extractedDistrict || district,
                        standardizedDistrict: standardized,
                        displayDistrict: standardized || extractedDistrict || district || 'Location not specified',
                        description: item.destination_description || item.description || '',
                        image:
                            item.destination_image ||
                            item.image ||
                            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
                        category: item.destination_category || item.category || '',
                        rating: parseFloat(item.destination_rating || item.rating) || 0,
                        added_at: item.added_at || item.created_at || new Date().toISOString(),
                    };
                });
            }

            setWishlist(items);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            setError('Failed to load wishlist. Please try again.');
            setWishlist([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchWishlist();
        } else {
            setLoading(false);
        }
    }, [isLoggedIn, fetchWishlist]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const removeFromWishlist = useCallback(async (placeId, wishlistId) => {
        const idToDelete = wishlistId || placeId;

        if (!idToDelete) {
            return;
        }

        try {
            await api.delete(`/destinations/wishlist/${idToDelete}/`);
            setWishlist((prev) => prev.filter((item) => item.id !== placeId && item.wishlistId !== wishlistId));
            setToast({ type: 'success', message: `💔 "${placeId}" removed from wishlist` });
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            if (placeId) {
                try {
                    await api.post('/destinations/wishlist/toggle/', { destination_id: placeId });
                    setWishlist((prev) => prev.filter((item) => item.id !== placeId));
                    setToast({ type: 'success', message: `💔 Removed from wishlist` });
                } catch (e) {
                    console.error('Toggle fallback also failed:', e);
                    setToast({ type: 'error', message: 'Failed to remove from wishlist' });
                }
            }
        }
    }, []);

    const handleFindGuides = useCallback(
        (place) => {
            let districtToUse = null;

            if (place.standardizedDistrict && place.standardizedDistrict !== 'Location not specified') {
                districtToUse = place.standardizedDistrict;
            } else if (place.district) {
                districtToUse = standardizeDistrict(place.district);
            } else if (place.location) {
                districtToUse = extractDistrictFromLocation(place.location);
            } else if (place.name) {
                districtToUse = extractDistrictFromLocation(place.name);
            }

            if (!districtToUse) {
                const allText = `${place.name} ${place.location} ${place.description}`;
                for (const district of KERALA_DISTRICTS) {
                    if (allText.toLowerCase().includes(district.toLowerCase())) {
                        districtToUse = district;
                        break;
                    }
                }
            }

            if (districtToUse && districtToUse !== 'Location not specified') {
                navigate(`/guides?district=${encodeURIComponent(districtToUse)}`);
            } else {
                navigate(`/guides?search=${encodeURIComponent(place.location || place.name || 'Kerala')}`);
            }
        },
        [navigate],
    );

    const handleRefresh = useCallback(() => {
        if (!refreshing) {
            setWishlist([]);
            fetchWishlist();
        }
    }, [refreshing, fetchWishlist]);

    const handleProtectedClick = useCallback(
        (path) => {
            if (!isLoggedIn) {
                alert('Login required to access this page.');
                navigate('/login');
            } else {
                navigate(path);
            }
        },
        [isLoggedIn, navigate],
    );

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

    const BottomNav = useCallback(
        () => (
            <div
                className={`fixed bottom-6 left-4 right-4 z-50 transition-all duration-500 ${
                    scrolled
                        ? 'bg-[#072E2A]/85 backdrop-blur-2xl shadow-2xl shadow-black/20 border-[#C79A3E]/30'
                        : 'bg-[#072E2A]/70 backdrop-blur-2xl shadow-xl shadow-black/10 border-[#C79A3E]/20'
                } rounded-full border px-3 py-2 max-w-md mx-auto`}>
                <div className="flex justify-around items-center">
                    <Link to="/" className="flex flex-col items-center group" onClick={() => setActiveNav('home')}>
                        <div
                            className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'home' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
                            <svg
                                className={`w-6 h-6 transition-all duration-300 ${activeNav === 'home' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2">
                                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        {activeNav === 'home' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
                    </Link>

                    <button
                        onClick={() => handleProtectedClick('/categories')}
                        className="flex flex-col items-center group">
                        <div
                            className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'location' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
                            <svg
                                className={`w-6 h-6 transition-all duration-300 ${activeNav === 'location' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        </div>
                        {activeNav === 'location' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
                    </button>

                    <button
                        onClick={() => handleProtectedClick('/ai-trip-planner')}
                        className="flex flex-col items-center group">
                        <div
                            className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'ai' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
                            <svg
                                className={`w-6 h-12 transition-all duration-300 ${activeNav === 'ai' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2">
                                <line x1="7" y1="5" x2="7" y2="1" />
                                <line x1="17" y1="5" x2="17" y2="1" />
                                <circle cx="7" cy="1" r="1.5" />
                                <circle cx="17" cy="1" r="1.5" />
                                <rect x="3" y="5" width="18" height="16" rx="3" />
                                <rect x="7" y="9" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3" />
                                <rect x="14" y="9" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                                <line x1="10" y1="16" x2="14" y2="16" />
                                <circle cx="3.5" cy="12" r="1" />
                                <circle cx="20.5" cy="12" r="1" />
                            </svg>
                        </div>
                        {activeNav === 'ai' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
                    </button>

                    <button onClick={() => handleProtectedClick('/wishlist')} className="flex flex-col items-center group">
                        <div
                            className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'wishlist' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
                            <svg
                                className={`w-6 h-6 transition-all duration-300 ${activeNav === 'wishlist' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </div>
                        {activeNav === 'wishlist' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
                    </button>

                    <button onClick={() => handleProtectedClick('/profile')} className="flex flex-col items-center group">
                        <div
                            className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'profile' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
                            <svg
                                className={`w-6 h-6 transition-all duration-300 ${activeNav === 'profile' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        {activeNav === 'profile' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
                    </button>
                </div>
            </div>
        ),
        [scrolled, activeNav, handleProtectedClick],
    );

    if (loading) {
        return (
            <div
                style={{
                    background: '#FBF6EA',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                <div style={{ textAlign: 'center' }}>
                    <div
                        style={{
                            display: 'inline-block',
                            width: 40,
                            height: 40,
                            border: '3px solid #C79A3E',
                            borderTop: '3px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }}
                    />
                    <p style={{ marginTop: 12, color: '#5C6E69', fontFamily: "'Inter', sans-serif" }}>
                        Loading your wishlist...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                background: '#FBF6EA',
                minHeight: '100vh',
                paddingBottom: 100,
                fontFamily: "'Inter','Segoe UI',sans-serif",
                color: '#0B2422',
            }}>
            <Toast />
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                .wl-font-display { font-family: 'Fraunces', serif; }
                .wl-font-mono { font-family: 'IBM Plex Mono', monospace; }
                .wl-place-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(7,46,42,0.15); }
                .wl-place-card { transition: all 0.3s ease; cursor: default; }
                .wl-remove-btn {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.9);
                    backdrop-filter: blur(4px);
                    border: 1px solid rgba(199,154,62,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 16px;
                    color: #C79A3E;
                    transition: all 0.3s ease;
                    z-index: 5;
                }
                .wl-remove-btn:hover {
                    transform: scale(1.1);
                    background: #DC2626;
                    color: #fff;
                    border-color: #DC2626;
                }
                .wl-find-guides-btn {
                    background: #0E5C53;
                    color: #fff;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Inter', sans-serif;
                }
                .wl-find-guides-btn:hover {
                    background: #072E2A;
                    transform: scale(1.02);
                }
                .wl-book-guide-btn {
                    background: linear-gradient(135deg, #C79A3E, #E4C77B);
                    color: #072E2A;
                    border: none;
                    padding: 12px 28px;
                    border-radius: 999px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 16px rgba(199,154,62,0.3);
                    font-family: 'Inter', sans-serif;
                }
                .wl-book-guide-btn:hover {
                    transform: scale(1.03);
                    box-shadow: 0 6px 24px rgba(199,154,62,0.4);
                }
                .wl-stats {
                    display: flex;
                    gap: clamp(18px, 3vw, 32px);
                    margin-top: 12px;
                }
                .wl-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px;
                }
                .wl-refresh-btn {
                    background: transparent;
                    border: 1px solid rgba(199,154,62,0.3);
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #E4C77B;
                    transition: transform 0.3s ease;
                }
                .wl-refresh-btn:hover {
                    transform: rotate(180deg);
                }

                @media (min-width: 768px) {
                    .wl-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (min-width: 1024px) {
                    .wl-grid { grid-template-columns: repeat(3, 1fr); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Header */}
            <div style={{ background: '#072E2A', padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 85% 0%, rgba(199,154,62,0.15), transparent 55%)',
                    }}
                />
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 16,
                        }}>
                        <div>
                            <p
                                className="wl-font-mono"
                                style={{
                                    fontSize: 10,
                                    letterSpacing: 3,
                                    textTransform: 'uppercase',
                                    color: '#E4C77B',
                                    marginBottom: 8,
                                }}>
                                DiscoverEase · Your Collection
                            </p>
                            <h1
                                className="wl-font-display"
                                style={{
                                    fontStyle: 'italic',
                                    fontSize: 'clamp(32px, 5vw, 48px)',
                                    fontWeight: 500,
                                    color: '#fff',
                                    margin: 0,
                                    lineHeight: 1.05,
                                }}>
                                My Wishlist
                            </h1>
                            <p
                                style={{
                                    fontSize: 'clamp(13px, 1.2vw, 16px)',
                                    color: 'rgba(237,226,196,0.75)',
                                    marginTop: 4,
                                }}>
                                {wishlist.length} {wishlist.length === 1 ? 'place' : 'places'} saved for your Kerala journey
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button
                                onClick={handleRefresh}
                                className="wl-refresh-btn"
                                disabled={refreshing}
                                style={{
                                    opacity: refreshing ? 0.5 : 1,
                                    cursor: refreshing ? 'not-allowed' : 'pointer',
                                }}>
                                {refreshing ? (
                                    <div
                                        style={{
                                            width: 16,
                                            height: 16,
                                            border: '2px solid #E4C77B',
                                            borderTop: '2px solid transparent',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite',
                                        }}
                                    />
                                ) : (
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                        />
                                    </svg>
                                )}
                            </button>
                            <button onClick={() => navigate('/guides')} className="wl-book-guide-btn">
                                <span style={{ fontSize: 20 }}>👤</span>
                                Book a Guide
                            </button>
                        </div>
                    </div>
                    <div className="wl-stats">
                        <div>
                            <div
                                className="wl-font-display"
                                style={{ fontSize: 'clamp(20px, 2vw, 28px)', color: '#E4C77B' }}>
                                {wishlist.length}
                            </div>
                            <div
                                className="wl-font-mono"
                                style={{
                                    fontSize: 9,
                                    letterSpacing: 1.5,
                                    textTransform: 'uppercase',
                                    color: 'rgba(237,226,196,0.6)',
                                }}>
                                Saved
                            </div>
                        </div>
                        <div>
                            <div
                                className="wl-font-display"
                                style={{ fontSize: 'clamp(20px, 2vw, 28px)', color: '#E4C77B' }}>
                                {
                                    new Set(
                                        wishlist.map((item) => item.standardizedDistrict || item.district).filter(Boolean),
                                    ).size
                                }
                            </div>
                            <div
                                className="wl-font-mono"
                                style={{
                                    fontSize: 9,
                                    letterSpacing: 1.5,
                                    textTransform: 'uppercase',
                                    color: 'rgba(237,226,196,0.6)',
                                }}>
                                Districts
                            </div>
                        </div>
                        <div>
                            <div
                                className="wl-font-display"
                                style={{ fontSize: 'clamp(20px, 2vw, 28px)', color: '#E4C77B' }}>
                                {new Set(wishlist.map((item) => item.category).filter(Boolean)).size}
                            </div>
                            <div
                                className="wl-font-mono"
                                style={{
                                    fontSize: 9,
                                    letterSpacing: 1.5,
                                    textTransform: 'uppercase',
                                    color: 'rgba(237,226,196,0.6)',
                                }}>
                                Categories
                            </div>
                        </div>
                    </div>
                </div>
                <svg
                    viewBox="0 0 1200 40"
                    preserveAspectRatio="none"
                    style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: 26 }}>
                    <path
                        d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z"
                        fill="#FBF6EA"
                    />
                </svg>
            </div>

            {/* Wishlist Grid */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
                {error && (
                    <div
                        style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            padding: '12px 20px',
                            borderRadius: 8,
                            marginBottom: 20,
                            border: '1px solid #FCA5A5',
                        }}>
                        ⚠️ {error}
                        <button
                            onClick={() => setError(null)}
                            style={{
                                marginLeft: 12,
                                background: 'none',
                                border: 'none',
                                color: '#DC2626',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}>
                            Dismiss
                        </button>
                    </div>
                )}

                {wishlist.length === 0 ? (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: '#fff',
                            borderRadius: 12,
                            border: '1px solid rgba(199,154,62,0.15)',
                        }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>❤️</div>
                        <h2 className="wl-font-display" style={{ fontSize: 28, color: '#072E2A', marginBottom: 8 }}>
                            Your wishlist is empty
                        </h2>
                        <p style={{ color: '#8A9A95', fontSize: 16, maxWidth: 400, margin: '0 auto' }}>
                            Start exploring Kerala and save your favorite places by clicking the ❤️ icon.
                        </p>
                        <Link
                            to="/categories"
                            style={{
                                display: 'inline-block',
                                marginTop: 20,
                                padding: '12px 32px',
                                background: '#C79A3E',
                                color: '#fff',
                                borderRadius: 999,
                                textDecoration: 'none',
                                fontSize: 14,
                                fontWeight: 500,
                            }}>
                            Explore Categories →
                        </Link>
                    </div>
                ) : (
                    <div className="wl-grid">
                        {wishlist.map((place) => {
                            const displayDistrict = place.displayDistrict || getDisplayDistrict(place);
                            const districtForGuides =
                                place.standardizedDistrict || standardizeDistrict(displayDistrict) || displayDistrict;

                            return (
                                <div
                                    key={place.wishlistId || place.id || Math.random()}
                                    className="wl-place-card"
                                    style={{
                                        background: '#fff',
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        border: '1px solid rgba(199,154,62,0.15)',
                                        position: 'relative',
                                    }}>
                                    <img
                                        src={
                                            place.image ||
                                            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'
                                        }
                                        alt={place.name}
                                        style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                                        onError={(e) => {
                                            e.target.src =
                                                'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80';
                                        }}
                                    />
                                    <button
                                        className="wl-remove-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Remove "${place.name}" from wishlist?`)) {
                                                removeFromWishlist(place.id, place.wishlistId);
                                            }
                                        }}>
                                        ✕
                                    </button>
                                    <div style={{ padding: 20 }}>
                                        <h3
                                            className="wl-font-display"
                                            style={{ fontSize: 18, fontWeight: 500, color: '#072E2A', margin: 0 }}>
                                            {place.name}
                                        </h3>
                                        <p style={{ fontSize: 13, color: '#0E5C53', margin: '4px 0 8px' }}>
                                            📍{' '}
                                            {displayDistrict !== 'Location not specified'
                                                ? displayDistrict
                                                : place.location || 'Location not specified'}
                                        </p>
                                        {place.rating > 0 && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                                                <span style={{ color: '#FFB300' }}>
                                                    {'★'.repeat(Math.round(place.rating))}
                                                </span>
                                                <span style={{ color: '#8A9A95', fontSize: 12 }}>({place.rating})</span>
                                            </div>
                                        )}
                                        <p style={{ fontSize: 14, color: '#3D5A57', lineHeight: 1.5, marginBottom: 14 }}>
                                            {place.description?.substring(0, 120)}
                                            {place.description?.length > 120 && '...'}
                                        </p>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFindGuides(place);
                                            }}
                                            className="wl-find-guides-btn"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}>
                                            <span>🧭</span>
                                            {districtForGuides && districtForGuides !== 'Location not specified'
                                                ? `Find Guides in ${districtForGuides}`
                                                : 'Find Guides'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <BottomNav />
            <div
                className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none"
                style={{ zIndex: 0 }}
            />
        </div>
    );
}
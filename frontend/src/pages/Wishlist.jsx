// src/pages/Wishlist.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

const getDistrictId = (name) => {
    const found = KERALA_DISTRICTS.find(d => d.name.toLowerCase() === name.toLowerCase());
    return found ? found.id : null;
};

export default function Wishlist() {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const [wishlist, setWishlist] = useState([]);
    const [scrolled, setScrolled] = useState(false);
    const [activeNav, setActiveNav] = useState('wishlist');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
            try {
                const parsed = JSON.parse(savedWishlist);
                setWishlist(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                setWishlist([]);
            }
        }
        setLoading(false);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    const removeFromWishlist = (placeId) => {
        const newWishlist = wishlist.filter(item => item.id !== placeId);
        setWishlist(newWishlist);
        localStorage.setItem('wishlist', JSON.stringify(newWishlist));
    };

    const handleFindGuides = (category, location) => {
        let districtName = '';
        const locationParts = location?.split(',') || [];

        for (const part of locationParts) {
            const trimmed = part.trim();
            const found = KERALA_DISTRICTS.find(d =>
                d.name.toLowerCase() === trimmed.toLowerCase()
            );
            if (found) {
                districtName = found.name;
                break;
            }
        }

        if (!districtName) {
            const lowerLocation = location?.toLowerCase() || '';
            for (const d of KERALA_DISTRICTS) {
                if (lowerLocation.includes(d.name.toLowerCase())) {
                    districtName = d.name;
                    break;
                }
            }
        }

        const params = new URLSearchParams();

        if (districtName) {
            params.append('district', districtName);
            params.append('search', districtName);
        } else if (location) {
            params.append('search', location);
        }

        const categoryToSpecialty = {
            'beach': 'beach',
            'beaches': 'beach',
            'hill': 'trekking',
            'hill station': 'trekking',
            'mountain': 'trekking',
            'backwater': 'backwater',
            'backwaters': 'backwater',
            'heritage': 'heritage',
            'wildlife': 'wildlife',
            'sanctuary': 'wildlife',
            'national park': 'wildlife',
            'temple': 'heritage',
            'waterfalls': 'nature',
            'nature': 'nature',
            'fort': 'heritage',
            'palace': 'heritage',
            'museum': 'heritage',
            'camping': 'camping',
            'off-road': 'off-road',
            'park': 'nature',
            'islands': 'beach',
            'sacred': 'heritage',
            'tea garden': 'nature',
            'tea plantation': 'nature',
            'plantation': 'nature',
            'spice': 'nature',
            'spice garden': 'nature',
            'lake': 'nature',
            'river': 'nature',
            'water sports': 'adventure',
            'adventure': 'adventure',
            'rafting': 'adventure',
            'trekking': 'trekking',
            'hiking': 'trekking',
            'culture': 'culture',
            'cultural': 'culture',
            'art': 'culture',
            'shopping': 'shopping',
            'market': 'shopping',
            'local market': 'shopping',
            'food': 'food',
            'culinary': 'food',
            'cuisine': 'food',
            'photography': 'photography',
        };

        const specialty = categoryToSpecialty[category?.toLowerCase()] || category?.toLowerCase() || 'local tours';

        if (specialty && specialty !== 'local tours') {
            params.append('specialty', specialty);
        }

        console.log('🔍 Navigating to guides with params:', params.toString());
        navigate(`/guides?${params.toString()}`);
    };

    const handleProtectedClick = (path) => {
        if (!isLoggedIn) {
            alert('⚠️ Login required to access this page. Please login first.');
            navigate('/login');
        } else {
            navigate(path);
        }
    };

    const BottomNav = () => (
        <div className={`fixed bottom-6 left-4 right-4 z-50 transition-all duration-500 ${scrolled
                ? 'bg-[#072E2A]/85 backdrop-blur-2xl shadow-2xl shadow-black/20 border-[#C79A3E]/30'
                : 'bg-[#072E2A]/70 backdrop-blur-2xl shadow-xl shadow-black/10 border-[#C79A3E]/20'
            } rounded-full border px-3 py-2 max-w-md mx-auto`}
        >
            <div className="flex justify-around items-center">
                <Link to="/" className="flex flex-col items-center group" onClick={() => setActiveNav('home')}>
                    <div className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'home' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
                        <svg className={`w-6 h-6 transition-all duration-300 ${activeNav === 'home' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    {activeNav === 'home' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
                </Link>

                <button onClick={() => handleProtectedClick('/categories')} className="flex flex-col items-center group">
                    <div className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'location' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
                        <svg className={`w-6 h-6 transition-all duration-300 ${activeNav === 'location' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                    </div>
                    {activeNav === 'location' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
                </button>

                <button onClick={() => handleProtectedClick('/ai-trip-planner')} className="flex flex-col items-center group">
                    <div className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'ai' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
                        <svg className={`w-6 h-12 transition-all duration-300 ${activeNav === 'ai' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <line x1="7" y1="5" x2="7" y2="1" /><line x1="17" y1="5" x2="17" y2="1" />
                            <circle cx="7" cy="1" r="1.5" /><circle cx="17" cy="1" r="1.5" />
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
                    <div className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'wishlist' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
                        <svg className={`w-6 h-6 transition-all duration-300 ${activeNav === 'wishlist' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </div>
                    {activeNav === 'wishlist' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
                </button>

                <button onClick={() => handleProtectedClick('/profile')} className="flex flex-col items-center group">
                    <div className={`p-2 rounded-full transition-all duration-300 ${activeNav === 'profile' ? 'bg-[#C79A3E]/20' : 'group-hover:bg-white/5'}`}>
                        <svg className={`w-6 h-6 transition-all duration-300 ${activeNav === 'profile' ? 'text-[#E4C77B]' : 'text-[#B9CFC9] group-hover:text-[#EDE2C4]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    {activeNav === 'profile' && <div className="w-1.5 h-1.5 rounded-full bg-[#E4C77B] mt-0.5" />}
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#FBF6EA",
                fontFamily: "'Inter', sans-serif"
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

    return (
        <div style={{ background: "#FBF6EA", minHeight: "100vh", paddingBottom: 100, fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                .wl-font-display { font-family: 'Fraunces', serif; }
                .wl-font-mono { font-family: 'IBM Plex Mono', monospace; }
                .wl-place-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(7,46,42,0.15); }
                .wl-place-card { transition: all 0.3s ease; }
                .book-guide-btn {
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
                    text-decoration: none;
                }
                .book-guide-btn:hover {
                    transform: scale(1.03);
                    box-shadow: 0 6px 24px rgba(199,154,62,0.4);
                }
                .find-guides-btn {
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
                .find-guides-btn:hover {
                    background: #072E2A;
                    transform: scale(1.02);
                }
                .find-guides-btn:active {
                    transform: scale(0.98);
                }
            `}</style>

            <div style={{ background: "#072E2A", padding: "48px 20px 28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
                <div style={{ position: "relative", maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                        <div>
                            <p className="wl-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", marginBottom: 8 }}>DiscoverEase · Your Collection</p>
                            <h1 className="wl-font-display" style={{ fontStyle: "italic", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 500, color: "#fff", margin: "0 0 6px", lineHeight: 1.05 }}>
                                My Wishlist
                            </h1>
                            <p style={{ fontSize: "clamp(13px, 1.2vw, 16px)", color: "rgba(237,226,196,0.75)" }}>
                                {wishlist.length} {wishlist.length === 1 ? 'place' : 'places'} saved for your Kerala journey
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/guides')}
                            className="book-guide-btn"
                        >
                            <span style={{ fontSize: 20 }}>👤</span>
                            Book a Guide
                        </button>
                    </div>
                </div>
                <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
                    <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
                </svg>
            </div>

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
                {wishlist.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>❤️</div>
                        <h2 className="wl-font-display" style={{ fontSize: 28, color: "#072E2A", marginBottom: 8 }}>Your wishlist is empty</h2>
                        <p style={{ color: "#8A9A95", fontSize: 16 }}>Start exploring Kerala and save your favorite places</p>
                        <Link to="/categories" style={{ display: "inline-block", marginTop: 20, padding: "12px 32px", background: "#C79A3E", color: "#fff", borderRadius: 999, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
                            Explore Categories →
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                        {wishlist.map((place) => {
                            let districtName = '';
                            const locationParts = place.location?.split(',') || [];

                            for (const part of locationParts) {
                                const trimmed = part.trim();
                                const found = KERALA_DISTRICTS.find(d =>
                                    d.name.toLowerCase() === trimmed.toLowerCase()
                                );
                                if (found) {
                                    districtName = found.name;
                                    break;
                                }
                            }

                            if (!districtName) {
                                const lowerLocation = place.location?.toLowerCase() || '';
                                for (const d of KERALA_DISTRICTS) {
                                    if (lowerLocation.includes(d.name.toLowerCase())) {
                                        districtName = d.name;
                                        break;
                                    }
                                }
                            }

                            return (
                                <div
                                    key={place.id}
                                    className="wl-place-card"
                                    style={{
                                        background: "#fff",
                                        borderRadius: 12,
                                        overflow: "hidden",
                                        border: "1px solid rgba(199,154,62,0.15)",
                                        transition: "all 0.3s ease",
                                        position: "relative"
                                    }}
                                >
                                    <img
                                        src={place.image || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80'}
                                        alt={place.name}
                                        style={{ width: "100%", height: 200, objectFit: "cover" }}
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80';
                                        }}
                                    />
                                    <button
                                        onClick={() => removeFromWishlist(place.id)}
                                        style={{
                                            position: "absolute",
                                            top: 12,
                                            right: 12,
                                            width: 36,
                                            height: 36,
                                            borderRadius: "50%",
                                            background: "rgba(255,255,255,0.9)",
                                            backdropFilter: "blur(4px)",
                                            border: "1px solid rgba(199,154,62,0.2)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            fontSize: 16,
                                            color: "#C79A3E",
                                            transition: "all 0.3s ease"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "scale(1.1)";
                                            e.currentTarget.style.background = "#C79A3E";
                                            e.currentTarget.style.color = "#fff";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "scale(1)";
                                            e.currentTarget.style.background = "rgba(255,255,255,0.9)";
                                            e.currentTarget.style.color = "#C79A3E";
                                        }}
                                    >
                                        ✕
                                    </button>
                                    <div style={{ padding: 20 }}>
                                        <h3 className="wl-font-display" style={{ fontSize: 18, fontWeight: 500, color: "#072E2A", margin: 0 }}>
                                            {place.name}
                                        </h3>
                                        <p style={{ fontSize: 13, color: "#0E5C53", margin: "4px 0 8px" }}>
                                            📍 {place.location}
                                        </p>
                                        <p style={{ fontSize: 14, color: "#3D5A57", lineHeight: 1.5, marginBottom: 14 }}>
                                            {place.description?.substring(0, 120)}...
                                        </p>

                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => handleFindGuides(place.category, place.location)}
                                                className="find-guides-btn"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    background: '#0E5C53',
                                                    color: '#fff',
                                                    border: 'none',
                                                    padding: '8px 20px',
                                                    borderRadius: 999,
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    fontFamily: "'Inter', sans-serif"
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#072E2A';
                                                    e.currentTarget.style.transform = 'scale(1.02)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = '#0E5C53';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                <span>🧭</span>
                                                {districtName ? `Find Guides in ${districtName}` : `Find Guides for ${place.category || 'this place'}`}
                                            </button>

                                            <Link
                                                to={`/category/${place.categoryId || 'beaches'}?district=${encodeURIComponent(districtName)}`}
                                                style={{
                                                    color: "#C79A3E",
                                                    textDecoration: "none",
                                                    fontSize: 13,
                                                    fontWeight: 500,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    padding: '8px 16px',
                                                    borderRadius: 999,
                                                    border: '1px solid rgba(199,154,62,0.3)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(199,154,62,0.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                View Details →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <BottomNav />
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" />
        </div>
    );
}
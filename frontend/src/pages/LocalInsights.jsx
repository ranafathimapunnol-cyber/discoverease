// pages/LocalInsights.jsx - WITH APPROVED STATUS AND DETAIL VIEW
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LocalInsights = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const [activeNav, setActiveNav] = useState('insights');
    const [scrolled, setScrolled] = useState(false);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
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
        suggestion_type: 'new',
        image: null,
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState({
        insights: 0,
        places: 0,
        categories: 0
    });
    const [districts, setDistricts] = useState([]);

    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ✅ Fetch insights from localStorage - SHOW APPROVED AND IMPLEMENTED
    const fetchInsights = async () => {
        setLoading(true);
        try {
            const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
            
            // ✅ Show both 'approved' and 'implemented' as "Approved" status
            const approvedAndImplemented = localSuggestions.filter(s => 
                s.status === 'approved' || s.status === 'implemented'
            );
            
            const insightsData = approvedAndImplemented.map(s => ({
                id: s.id,
                author: s.user_email || 'Anonymous Traveler',
                place: s.name,
                tip: s.description,
                category: s.category,
                location: s.location_info,
                district: s.district || 'Unknown',
                type: s.type || 'insight',
                status: s.status || 'approved',
                created_at: s.created_at,
                image: s.image || null,
                processed_at: s.processed_at || null,
                processed_by: s.processed_by || 'Guide',
                description: s.description,
            }));
            
            // Sort by most recent first
            insightsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            setInsights(insightsData);
            
            const uniquePlaces = new Set(insightsData.map(i => i.place));
            const uniqueCategories = new Set(insightsData.map(i => i.category).filter(Boolean));
            
            setStats({
                insights: insightsData.length,
                places: uniquePlaces.size,
                categories: uniqueCategories.size
            });
            
        } catch (error) {
            console.error('Error fetching insights:', error);
            setInsights([]);
            setStats({ insights: 0, places: 0, categories: 0 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchInsights();
        }
    }, [isLoggedIn]);

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
            setFormData({ ...formData, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setFormData({ ...formData, image: null });
        setImagePreview(null);
    };

    const handleSubmitSuggestion = async (e) => {
        e.preventDefault();

        if (!isLoggedIn) {
            alert('⚠️ Please login first to suggest a destination.');
            navigate('/login');
            return;
        }

        if (!formData.district) {
            alert('⚠️ Please select a district.');
            return;
        }

        setSubmitting(true);
        try {
            const existingSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
            
            let userEmail = 'anonymous';
            try {
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                userEmail = userData.email || 'anonymous';
            } catch (e) {
                userEmail = 'anonymous';
            }
            
            const newSuggestion = {
                id: Date.now(),
                name: formData.name,
                description: formData.description,
                category: formData.category,
                location_info: formData.location_info,
                district: formData.district,
                status: 'pending',
                type: 'insight',
                user_email: userEmail,
                created_at: new Date().toISOString(),
                suggestion_type: 'new',
                image: imagePreview,
            };
            
            existingSuggestions.push(newSuggestion);
            localStorage.setItem('hidden_gems_suggestions', JSON.stringify(existingSuggestions));

            alert('✅ Your insight suggestion has been sent to the guides!');
            setShowSuggestionModal(false);
            setFormData({
                name: '',
                description: '',
                category: '',
                location_info: '',
                district: '',
                suggestion_type: 'new',
                image: null,
            });
            setImagePreview(null);
            fetchInsights();
        } catch (error) {
            console.error('Error submitting suggestion:', error);
            alert('Failed to submit suggestion. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ✅ Open detail modal
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
        <div style={{ background: "#FBF6EA", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422", paddingBottom: 100 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                .li-font-display { font-family: 'Fraunces', serif; }
                .li-font-mono { font-family: 'IBM Plex Mono', monospace; }
                .li-card { transition: border-color 0.3s ease, transform 0.3s ease; }
                .li-card:hover { border-color: rgba(199,154,62,0.7); transform: translateY(-2px); }
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .modal-content {
                    background: #FBF6EA;
                    border-radius: 12px;
                    padding: 32px;
                    max-width: 560px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    border: 1px solid rgba(199,154,62,0.3);
                }
                .modal-content-detail {
                    background: #FBF6EA;
                    border-radius: 12px;
                    padding: 32px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    border: 1px solid rgba(199,154,62,0.3);
                }
                .category-badge {
                    display: inline-block;
                    padding: 2px 12px;
                    border-radius: 999px;
                    font-size: 9px;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    background: rgba(199,154,62,0.15);
                    color: #0E5C53;
                }
                .category-chip {
                    padding: 6px 16px;
                    border-radius: 999px;
                    font-size: 11px;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    font-family: 'IBM Plex Mono', monospace;
                    white-space: nowrap;
                }
                .insight-card {
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                .insight-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                }
                .approved-badge {
                    display: inline-block;
                    padding: 2px 10px;
                    border-radius: 999px;
                    font-size: 8px;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    background: rgba(46, 125, 50, 0.15);
                    color: #2E7D32;
                    border: 1px solid rgba(46, 125, 50, 0.2);
                }
                .type-badge {
                    display: inline-block;
                    padding: 2px 10px;
                    border-radius: 999px;
                    font-size: 8px;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    background: rgba(199,154,62,0.15);
                    color: #0E5C53;
                    border: 1px solid rgba(199,154,62,0.2);
                    margin-left: 6px;
                }
                .image-preview {
                    max-width: 100%;
                    max-height: 200px;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 1px solid rgba(199,154,62,0.2);
                }
                .insight-image {
                    width: 100%;
                    max-height: 300px;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 1px solid rgba(199,154,62,0.2);
                }
            `}</style>

            {/* Header */}
            <div style={{ background: "#072E2A", padding: "40px 20px 30px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
                <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                        <Link to="/" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(199,154,62,0.5)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                            <svg width="16" height="16" fill="none" stroke="#E4C77B" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                        </Link>
                        <Link to="/" className="li-font-mono" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#E4C77B", textDecoration: "none" }}>
                            Back to home
                        </Link>
                    </div>
                    <p className="li-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", marginBottom: 8 }}>Field notes from the ground</p>
                    <h1 className="li-font-display" style={{ fontStyle: "italic", fontSize: 34, fontWeight: 500, color: "#fff", margin: "0 0 8px", lineHeight: 1.05 }}>Local Insights</h1>
                    <p style={{ fontSize: 13, color: "rgba(237,226,196,0.75)", maxWidth: 460, lineHeight: 1.5 }}>
                        Hidden gems and honest tips, written by fellow travelers and locals who know Kerala best.
                    </p>

                    <div style={{ display: "flex", gap: 22, marginTop: 24 }}>
                        <div>
                            <div className="li-font-display" style={{ fontSize: 20, color: "#E4C77B" }}>{stats.insights}</div>
                            <div className="li-font-mono" style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(237,226,196,0.6)" }}>insights</div>
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

            <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 0" }}>
                {/* Suggest Destination Button */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
                    <p className="li-font-mono" style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#0E5C53", margin: 0 }}>
                        Latest notes from travelers ({filteredInsights.length})
                    </p>
                    <button
                        onClick={() => setShowSuggestionModal(true)}
                        style={{
                            background: "#072E2A",
                            color: "#E4C77B",
                            border: "none",
                            padding: "8px 20px",
                            borderRadius: 999,
                            fontSize: 11,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            fontFamily: "'IBM Plex Mono', monospace",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#0B2422"}
                        onMouseLeave={(e) => e.target.style.background = "#072E2A"}
                    >
                        <span>+</span> Suggest Destination
                    </button>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <ZariDivider />
                </div>

                {/* Category filter chips */}
                {insights.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className="category-chip"
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    border: activeCategory === cat ? '2px solid #0E5C53' : '1px solid rgba(199,154,62,0.35)',
                                    background: activeCategory === cat ? '#0E5C53' : 'transparent',
                                    color: activeCategory === cat ? '#fff' : '#5C6E69',
                                }}
                            >
                                {cat === 'all' ? 'All' : cat}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <div style={{ display: "inline-block", width: 30, height: 30, border: "2px solid #C79A3E", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                        {filteredInsights.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "40px 0", color: "#5C6E69" }}>
                                <p>No insights yet. Be the first to suggest one!</p>
                                <p style={{ fontSize: 12, marginTop: 8 }}>Suggestions approved by guides will appear here.</p>
                            </div>
                        ) : (
                            filteredInsights.map((insight) => (
                                <div
                                    key={insight.id}
                                    className="insight-card"
                                    onClick={() => openDetailModal(insight)}
                                    style={{
                                        background: "#fff",
                                        borderRadius: 4,
                                        padding: "18px 20px",
                                        border: "1px solid rgba(199,154,62,0.3)",
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: "flex", gap: 6, position: 'absolute', top: 12, right: 12 }}>
                                        <span className="approved-badge">✅ Approved</span>
                                        {insight.type === 'hidden_gem' ? (
                                            <span className="type-badge">💎 From Traveler</span>
                                        ) : (
                                            <span className="type-badge">✨ From Expert</span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                                        {insight.image && (
                                            <div style={{ flexShrink: 0 }}>
                                                <img 
                                                    src={insight.image} 
                                                    alt={insight.place} 
                                                    style={{ 
                                                        width: 60, 
                                                        height: 60, 
                                                        borderRadius: 8, 
                                                        objectFit: 'cover',
                                                        border: '1px solid rgba(199,154,62,0.2)'
                                                    }} 
                                                />
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                width: 38,
                                                height: 38,
                                                borderRadius: "50%",
                                                border: "1px solid #C79A3E",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 15,
                                                color: "#0E5C53",
                                                flexShrink: 0,
                                                fontStyle: "italic"
                                            }}>
                                                {insight.author?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: 13, color: "#0B2422", margin: 0 }}>
                                                    {insight.author || 'Anonymous Traveler'}
                                                </p>
                                                <p className="li-font-mono" style={{ fontSize: 10, color: "#5C6E69", margin: "2px 0 0" }}>
                                                    📍 {insight.place || insight.location}
                                                    {insight.district && ` · ${insight.district}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 13, color: "#4A5F5A", margin: "0 0 8px 0", lineHeight: 1.55 }}>
                                        {insight.tip || insight.description}
                                    </p>
                                    {insight.category && insight.category !== 'other' && (
                                        <span className="category-badge">
                                            {insight.category}
                                        </span>
                                    )}
                                    <div style={{ marginTop: 8, fontSize: 11, color: "#8A9A95" }}>
                                        <span>✅ Approved by {insight.processed_by || 'Guide'}</span>
                                        {insight.processed_at && (
                                            <span style={{ marginLeft: 12 }}>
                                                📅 {new Date(insight.processed_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: 11, color: "#C79A3E" }}>
                                        👆 Click to view details
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* CTA Section */}
                <div style={{ marginTop: 28, borderRadius: 4, border: "2px dashed rgba(199,154,62,0.5)", padding: "34px 24px", textAlign: "center", background: "radial-gradient(circle at top right, rgba(199,154,62,0.06), transparent 60%)" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid #C79A3E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 14px" }}>✨</div>
                    <h3 className="li-font-display" style={{ fontSize: 22, color: "#0B2422", margin: "0 0 6px" }}>Know a hidden gem?</h3>
                    <p style={{ fontSize: 13, color: "#5C6E69", margin: "0 0 18px" }}>Suggest a destination to our local guides. They'll review and add it to our collection.</p>
                    <button
                        onClick={() => setShowSuggestionModal(true)}
                        className="li-font-mono"
                        style={{ padding: "12px 28px", borderRadius: 999, border: "1px solid #0B2422", background: "transparent", color: "#0B2422", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}
                    >
                        Suggest Destination
                    </button>
                </div>
            </div>

            {/* Suggest Destination Modal with District & Image */}
            {showSuggestionModal && (
                <div className="modal-overlay" onClick={() => setShowSuggestionModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <h2 className="li-font-display" style={{ fontSize: 24, color: "#0B2422", margin: 0 }}>Suggest a Destination</h2>
                            <button onClick={() => setShowSuggestionModal(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#5C6E69" }}>×</button>
                        </div>
                        <p style={{ fontSize: 13, color: "#5C6E69", marginBottom: 20 }}>
                            Share a hidden gem with our local guides. They'll review and add it to our insights collection.
                        </p>

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
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Category *</label>
                                <select
                                    required
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
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Location Info *</label>
                                <input
                                    type="text"
                                    required
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

                            {/* Image Upload */}
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Upload Photo</label>
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
                                    <div className="mt-3">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="image-preview"
                                            style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(199,154,62,0.2)' }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div style={{ background: "#f0f7f5", padding: "12px", borderRadius: 4, fontSize: 12, color: "#0E5C53" }}>
                                💡 Your suggestion will be sent to our local guides for review.
                                Once approved, it will appear in the insights section for all travelers to see.
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    padding: "12px 28px",
                                    borderRadius: 999,
                                    border: "none",
                                    background: "#072E2A",
                                    color: "#E4C77B",
                                    fontSize: 11,
                                    letterSpacing: "0.15em",
                                    textTransform: "uppercase",
                                    cursor: submitting ? "not-allowed" : "pointer",
                                    opacity: submitting ? 0.6 : 1
                                }}
                            >
                                {submitting ? 'Submitting...' : '📤 Submit Suggestion'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ✅ Detail Modal */}
            {showDetailModal && selectedInsight && (
                <div className="modal-overlay" onClick={closeDetailModal}>
                    <div className="modal-content-detail" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h2 className="li-font-display" style={{ fontSize: 24, color: "#0B2422", margin: 0 }}>
                                {selectedInsight.place}
                            </h2>
                            <button onClick={closeDetailModal} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#5C6E69" }}>×</button>
                        </div>

                        {/* Status Badge */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                            <span className="approved-badge">✅ Approved</span>
                            {selectedInsight.category && (
                                <span className="category-badge">{selectedInsight.category}</span>
                            )}
                            {selectedInsight.district && (
                                <span className="category-badge" style={{ background: "rgba(199,154,62,0.25)" }}>
                                    📍 {selectedInsight.district}
                                </span>
                            )}
                        </div>

                        {/* Image */}
                        {selectedInsight.image && (
                            <div style={{ marginBottom: 16 }}>
                                <img 
                                    src={selectedInsight.image} 
                                    alt={selectedInsight.place} 
                                    className="insight-image"
                                    style={{ 
                                        width: '100%', 
                                        maxHeight: 300, 
                                        objectFit: 'cover', 
                                        borderRadius: 8,
                                        border: '1px solid rgba(199,154,62,0.2)'
                                    }}
                                />
                            </div>
                        )}

                        {/* Author Info */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                border: "1px solid #C79A3E",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 16,
                                color: "#0E5C53",
                            }}>
                                {selectedInsight.author?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0 }}>
                                    {selectedInsight.author || 'Anonymous Traveler'}
                                </p>
                                <p className="li-font-mono" style={{ fontSize: 10, color: "#5C6E69", margin: 0 }}>
                                    📅 {selectedInsight.created_at ? new Date(selectedInsight.created_at).toLocaleDateString() : 'Recently'}
                                </p>
                            </div>
                        </div>

                        {/* Location */}
                        {selectedInsight.location && (
                            <div style={{ marginBottom: 12 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#0B2422", margin: "0 0 4px" }}>📍 Location</h4>
                                <p style={{ fontSize: 13, color: "#5C6E69", margin: 0 }}>{selectedInsight.location}</p>
                            </div>
                        )}

                        {/* Description */}
                        <div style={{ marginBottom: 12 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, color: "#0B2422", margin: "0 0 4px" }}>📝 Description</h4>
                            <p style={{ fontSize: 13, color: "#4A5F5A", lineHeight: 1.6, margin: 0 }}>
                                {selectedInsight.description || selectedInsight.tip || 'No description provided.'}
                            </p>
                        </div>

                        {/* Tips */}
                        {selectedInsight.tip && selectedInsight.tip !== selectedInsight.description && (
                            <div style={{ marginBottom: 12 }}>
                                <h4 style={{ fontSize: 13, fontWeight: 600, color: "#0B2422", margin: "0 0 4px" }}>💡 Tips</h4>
                                <p style={{ fontSize: 13, color: "#4A5F5A", lineHeight: 1.6, margin: 0 }}>
                                    {selectedInsight.tip}
                                </p>
                            </div>
                        )}

                        {/* Approval Info */}
                        <div style={{ padding: 12, background: "#E6F0EA", borderRadius: 8, marginTop: 8 }}>
                            <p style={{ fontSize: 12, color: "#3F7A5E", margin: 0 }}>
                                ✅ Approved by {selectedInsight.processed_by || 'Guide'}
                                {selectedInsight.processed_at && (
                                    <span style={{ marginLeft: 8 }}>
                                        on {new Date(selectedInsight.processed_at).toLocaleDateString()}
                                    </span>
                                )}
                            </p>
                        </div>

                        <button
                            onClick={closeDetailModal}
                            style={{
                                marginTop: 16,
                                padding: "10px 24px",
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
                            onMouseEnter={(e) => {
                                e.target.style.background = "#0B2422";
                                e.target.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = "transparent";
                                e.target.style.color = "#0B2422";
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
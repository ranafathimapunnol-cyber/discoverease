
  import React, { useState, useEffect, useRef } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';
  import AIChat from '../components/AIChat';

  // ============================================
  // LINE ICONS
  // ============================================
  const Icon = {
    Back: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    ),
    Bot: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <line x1="7" y1="5" x2="7" y2="1" />
        <line x1="17" y1="5" x2="17" y2="1" />
        <circle cx="7" cy="1" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="17" cy="1" r="1.2" fill="currentColor" stroke="none" />
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <rect x="7" y="9" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="none" />
        <rect x="14" y="9" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="none" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="20.5" cy="12" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    Seal: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" {...p}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5.4" />
        <path strokeLinecap="round" d="M12 8.6l1 2.2 2.4.3-1.7 1.7.4 2.4-2.1-1.2-2.1 1.2.4-2.4-1.7-1.7 2.4-.3z" />
      </svg>
    ),
    Compass: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinejoin="round" d="M14.6 9.4L13 13l-3.6 1.6L11 11z" />
      </svg>
    ),
    Mountain: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 19l5.5-9 4 5 3-6 5.5 10z" />
      </svg>
    ),
    Waves: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
        <path strokeLinecap="round" d="M2 10c2-2 4 2 6 0s4 2 6 0 4 2 6 0 2.5 0 2.5 0" />
        <path strokeLinecap="round" d="M2 15c2-2 4 2 6 0s4 2 6 0 4 2 6 0 2.5 0 2.5 0" />
        <path strokeLinecap="round" d="M2 20c2-2 4 2 6 0s4 2 6 0 4 2 6 0 2.5 0 2.5 0" />
      </svg>
    ),
    Leaf: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20C4 12 8 5 19 4c1 11-6 15-14 16z" />
        <path strokeLinecap="round" d="M6 19c3-4 6-7 12-13" />
      </svg>
    ),
    Wallet: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
        <rect x="2.5" y="6" width="19" height="13" rx="2.4" />
        <path strokeLinecap="round" d="M2.5 10h19" />
        <circle cx="16.8" cy="14" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
    Calendar: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    ),
    Users: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
        <circle cx="9" cy="8" r="3.4" />
        <path strokeLinecap="round" d="M3 20v-1c0-3 2.7-5.4 6-5.4s6 2.4 6 5.4v1" />
        <circle cx="17.5" cy="9.5" r="2.4" />
        <path strokeLinecap="round" d="M20.5 20v-.8c0-2-1.4-3.7-3.3-4.2" />
      </svg>
    ),
    Star: (p) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
        <path d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z" />
      </svg>
    ),
    Bookmark: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path strokeLinejoin="round" d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z" />
      </svg>
    ),
    Trash: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
      </svg>
    ),
    Bulb: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6M10 21h4M8 14a4 4 0 1 1 8 0c0 1.5-.8 2.3-1.5 3-.5.5-.5 1-.5 1h-4s0-.5-.5-1c-.7-.7-1.5-1.5-1.5-3z" />
      </svg>
    ),
    Chevron: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    ),
    Send: (p) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
      </svg>
    ),
  };

  // Category tags double as functional filters below
  const CATEGORY_META = {
    backwater: { label: 'Backwater', icon: Icon.Compass, color: '#0E5C53' },
    trekking: { label: 'Trekking', icon: Icon.Mountain, color: '#93701F' },
    coast: { label: 'Coast', icon: Icon.Waves, color: '#2D6A9F' },
    natures: { label: 'Natures', icon: Icon.Leaf, color: '#2D7D6C' },
    budget: { label: 'Budget', icon: Icon.Wallet, color: '#8A6A1F' },
    family: { label: 'Family', icon: Icon.Users, color: '#4A5F5A' },
  };

  const QUICK_PROMPTS = [
    { id: 1, category: 'backwater', text: 'Plan a 4-day backwater escape in Alleppey for two' },
    { id: 2, category: 'trekking', text: 'Budget trekking itinerary for Munnar under ₹10,000' },
    { id: 3, category: 'natures', text: 'Hidden gems in Wayanad off the tourist trail' },
    { id: 4, category: 'coast', text: 'A 3-day trip to Varkala built around the sunset' },
    { id: 5, category: 'family', text: 'Family-friendly plan with kid activities in Kochi' },
    { id: 6, category: 'coast', text: 'Monsoon itinerary through Kerala\u2019s waterfalls' },
  ];

  // Fill the AIChat text input honestly — scoped to the chat panel only, and using
  // the native value setter so React's onChange actually fires on a controlled input.
  const injectPrompt = (containerEl, text) => {
    if (!containerEl) return;
    const field = containerEl.querySelector('input[type="text"], textarea');
    if (!field) return;
    const proto = field.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) {
      setter.call(field, text);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      field.value = text;
    }
    field.focus();
  };

  const AiTripPlanner = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();
    const [showChat, setShowChat] = useState(true);
    const [activeNav, setActiveNav] = useState('ai');
    const [scrolled, setScrolled] = useState(false);
    const [sidebarTab, setSidebarTab] = useState('prompts'); // 'prompts' | 'saved' | 'tips'
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [savedSessions, setSavedSessions] = useState([]);
    const chatPanelRef = useRef(null);

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

    const handleProtectedClick = (path) => {
      if (!isLoggedIn) {
        alert('⚠️ Login required to access this page. Please login first.');
        navigate('/login');
      } else {
        navigate(path);
      }
    };

    const handleUsePrompt = (text) => {
      injectPrompt(chatPanelRef.current, text);
    };

    const handleSaveSession = () => {
      const stamp = new Date();
      setSavedSessions((prev) => [
        { id: Date.now(), timestamp: stamp.toISOString() },
        ...prev,
      ]);
    };

    const handleRemoveSession = (id) => {
      setSavedSessions((prev) => prev.filter((s) => s.id !== id));
    };

    const visiblePrompts = selectedFilter
      ? QUICK_PROMPTS.filter((p) => p.category === selectedFilter)
      : QUICK_PROMPTS;

    const BottomNav = () => (
      <div className={`fixed bottom-6 left-4 right-4 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#072E2A]/85 backdrop-blur-2xl shadow-2xl shadow-black/20 border-[#C79A3E]/30'
          : 'bg-[#072E2A]/70 backdrop-blur-2xl shadow-xl shadow-black/10 border-[#C79A3E]/20'
      } rounded-full border px-3 py-2 max-w-md mx-auto`}
      >
        <div className="flex justify-around items-center">
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

    return (
      <div style={{ background: "#FBF6EA", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422", paddingBottom: 110 }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
          .jp-display { font-family: 'Fraunces', serif; }
          .jp-mono { font-family: 'IBM Plex Mono', monospace; }

          @keyframes jp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          @keyframes jp-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          .jp-dot { animation: jp-pulse 1.8s ease-in-out infinite; }
          .jp-fade { animation: jp-fade 0.35s ease both; }

          .jp-rail-tab {
            flex: 1;
            padding: 10px 6px;
            text-align: center;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 10.5px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: #8A9A95;
            cursor: pointer;
            transition: color 0.2s ease, border-color 0.2s ease;
          }
          .jp-rail-tab.active { color: #0E5C53; border-color: #0E5C53; font-weight: 600; }
          .jp-rail-tab:hover:not(.active) { color: #0B2422; }

          .jp-filter-chip {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 5px 12px; border-radius: 999px;
            font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase;
            border: 1px solid rgba(199,154,62,0.3);
            background: #fff; color: #5C6E69; cursor: pointer;
            transition: all 0.2s ease; white-space: nowrap;
          }
          .jp-filter-chip.active { background: #0E5C53; border-color: #0E5C53; color: #fff; }
          .jp-filter-chip:hover:not(.active) { border-color: #0E5C53; color: #0E5C53; }

          .jp-prompt-card {
            display: flex; align-items: flex-start; gap: 12px;
            width: 100%; text-align: left;
            padding: 13px 14px; border-radius: 11px;
            background: #fff; border: 1px solid rgba(199,154,62,0.2);
            cursor: pointer; transition: all 0.25s ease;
          }
          .jp-prompt-card:hover {
            border-color: #0E5C53;
            box-shadow: 0 8px 22px rgba(7,46,42,0.08);
            transform: translateY(-2px);
          }
          .jp-prompt-card__icon {
            width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
          }

          .jp-panel {
            background: #fff; border: 1px solid rgba(199,154,62,0.22); border-radius: 16px;
          }

          .jp-chat-card {
            border-radius: 18px; overflow: hidden;
            border: 1px solid rgba(199,154,62,0.25);
            background: #fff;
            box-shadow: 0 20px 44px rgba(7,46,42,0.1);
          }
          .jp-chat-card__bar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 15px 20px; background: #072E2A;
          }
          .jp-chat-card__body { padding: 18px; background: #FDFBF3; min-height: 200px; }

          .jp-icon-btn {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            padding: 7px 14px; border-radius: 999px;
            border: 1px solid rgba(228,199,123,0.35);
            background: rgba(228,199,123,0.08);
            color: #E4C77B; font-family: 'IBM Plex Mono', monospace;
            font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase;
            cursor: pointer; transition: all 0.2s ease;
          }
          .jp-icon-btn:hover { background: rgba(228,199,123,0.18); }

          .jp-session-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 12px; border-radius: 9px;
            background: #FBF6EA; border: 1px solid rgba(199,154,62,0.18);
          }

          @media (max-width: 960px) {
            .jp-layout { grid-template-columns: 1fr !important; }
            .jp-rail { order: 2; }
            .jp-chat-col { order: 1; }
          }
        `}</style>

        {/* HEADER */}
        <div style={{ background: "#072E2A", padding: "42px 20px 60px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 0%, rgba(199,154,62,0.16), transparent 55%)" }} />
          <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
              <Link to="/" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(199,154,62,0.5)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", color: "#E4C77B" }}>
                <Icon.Back width="16" height="16" />
              </Link>
              <Link to="/" className="jp-mono" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#E4C77B", textDecoration: "none" }}>
                Back to home
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16, maxWidth: 620 }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", border: "1px solid rgba(228,199,123,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E4C77B", flexShrink: 0 }}>
                  <Icon.Seal width="24" height="24" />
                </div>
                <div>
                  <p className="jp-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", margin: "0 0 8px" }}>
                    Field notes, drafted live
                  </p>
                  <h1 className="jp-display" style={{ fontStyle: "italic", fontSize: "clamp(32px, 4.5vw, 46px)", fontWeight: 500, color: "#fff", margin: "0 0 8px", lineHeight: 1.06 }}>
                    AI Trip Planner
                  </h1>
                  <p style={{ fontSize: 13.5, color: "rgba(237,226,196,0.7)", lineHeight: 1.55, margin: 0 }}>
                    Describe the trip you want — dates, budget, mood — and shape it together with the assistant on the right.
                  </p>
                </div>
              </div>

              <div className="jp-mono" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(228,199,123,0.35)", background: "rgba(228,199,123,0.08)", color: "#E4C77B", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
                <span className="jp-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#5FD9A4", display: "inline-block" }} />
                Assistant online
              </div>
            </div>
          </div>
        </div>

        {/* MAIN — journal split layout, cards float up over the header */}
        <div style={{ maxWidth: 1180, margin: "-34px auto 0", padding: "0 20px 10px", position: "relative" }}>
          <div className="jp-layout" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 22, alignItems: "start" }}>

            {/* LEFT RAIL */}
            <div className="jp-rail jp-panel jp-fade" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", borderBottom: "1px solid rgba(199,154,62,0.2)" }}>
                <button className={`jp-rail-tab ${sidebarTab === 'prompts' ? 'active' : ''}`} onClick={() => setSidebarTab('prompts')}>Prompts</button>
                <button className={`jp-rail-tab ${sidebarTab === 'saved' ? 'active' : ''}`} onClick={() => setSidebarTab('saved')}>
                  Saved{savedSessions.length > 0 ? ` (${savedSessions.length})` : ''}
                </button>
                <button className={`jp-rail-tab ${sidebarTab === 'tips' ? 'active' : ''}`} onClick={() => setSidebarTab('tips')}>Tips</button>
              </div>

              <div style={{ padding: 18 }}>
                {sidebarTab === 'prompts' && (
                  <div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                      <button
                        className={`jp-filter-chip ${!selectedFilter ? 'active' : ''}`}
                        onClick={() => setSelectedFilter(null)}
                      >
                        All
                      </button>
                      {Object.entries(CATEGORY_META).map(([key, meta]) => (
                        <button
                          key={key}
                          className={`jp-filter-chip ${selectedFilter === key ? 'active' : ''}`}
                          onClick={() => setSelectedFilter(selectedFilter === key ? null : key)}
                        >
                          {meta.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {visiblePrompts.map((prompt, i) => {
                        const meta = CATEGORY_META[prompt.category];
                        const PIcon = meta.icon;
                        return (
                          <button
                            key={prompt.id}
                            className="jp-prompt-card jp-fade"
                            style={{ animationDelay: `${i * 40}ms` }}
                            onClick={() => handleUsePrompt(prompt.text)}
                          >
                            <span className="jp-prompt-card__icon" style={{ background: `${meta.color}18`, color: meta.color }}>
                              <PIcon width="16" height="16" />
                            </span>
                            <span style={{ fontSize: 12.5, color: "#0B2422", lineHeight: 1.45 }}>{prompt.text}</span>
                          </button>
                        );
                      })}
                      {visiblePrompts.length === 0 && (
                        <p style={{ fontSize: 12.5, color: "#8A9A95", textAlign: "center", padding: "16px 0" }}>No prompts in this category yet.</p>
                      )}
                    </div>
                    <p style={{ fontSize: 10.5, color: "#8A9A95", marginTop: 12, textAlign: "center" }}>Tap a prompt to drop it into the message box.</p>
                  </div>
                )}

                {sidebarTab === 'saved' && (
                  <div>
                    <button className="jp-icon-btn" onClick={handleSaveSession} style={{ width: "100%", justifyContent: "center", marginBottom: 14, borderColor: 'rgba(14,92,83,0.3)', background: 'rgba(14,92,83,0.06)', color: '#0E5C53' }}>
                      <Icon.Bookmark width="13" height="13" /> Bookmark this session
                    </button>
                    {savedSessions.length === 0 ? (
                      <p style={{ fontSize: 12.5, color: "#8A9A95", textAlign: "center", padding: "20px 0" }}>
                        No bookmarks yet — save the current session to find it here later.
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {savedSessions.map((s) => (
                          <div key={s.id} className="jp-session-row">
                            <span className="jp-mono" style={{ fontSize: 11, color: "#5C6E69" }}>
                              {new Date(s.timestamp).toLocaleString()}
                            </span>
                            <button onClick={() => handleRemoveSession(s.id)} style={{ background: "none", border: "none", color: "#B45", cursor: "pointer", display: "flex" }} title="Remove bookmark">
                              <Icon.Trash width="14" height="14" style={{ color: '#8A6A1F' }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {sidebarTab === 'tips' && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      'Name your dates and trip length up front — the plan is easier to shape around a fixed window.',
                      'Mention your budget range so suggestions stay realistic.',
                      'Say what pace you like: packed and full days, or slow with room to wander.',
                    ].map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(199,154,62,0.15)", color: "#93701F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon.Bulb width="13" height="13" />
                        </span>
                        <p style={{ fontSize: 12.5, color: "#4A5F5A", lineHeight: 1.55, margin: 0 }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CHAT COLUMN */}
            <div className="jp-chat-col">
              <div className="jp-chat-card jp-fade" ref={chatPanelRef}>
                <div className="jp-chat-card__bar">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(228,199,123,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E4C77B" }}>
                      <Icon.Bot width="17" height="17" />
                    </div>
                    <div>
                      <p className="jp-display" style={{ fontSize: 15, fontStyle: "italic", color: "#fff", margin: 0, lineHeight: 1.1 }}>Travel Assistant</p>
                      <p className="jp-mono" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "rgba(237,226,196,0.6)", margin: "2px 0 0" }}>
                        <span className="jp-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "#5FD9A4", display: "inline-block" }} />
                        Ready
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowChat(!showChat)} className="jp-icon-btn">
                    {showChat ? 'Hide' : 'Show'}
                    <Icon.Chevron width="11" height="11" style={{ transform: showChat ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }} />
                  </button>
                </div>
                {showChat && (
                  <div className="jp-chat-card__body">
                    <AIChat />
                  </div>
                )}
              </div>

              <p style={{ fontSize: 11, color: "#8A9A95", textAlign: "center", marginTop: 12 }}>
                Responses come from the assistant above — this page just helps you get started faster.
              </p>
            </div>
          </div>
        </div>

        <BottomNav />
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" />
      </div>
    );
  };

  export default AiTripPlanner;
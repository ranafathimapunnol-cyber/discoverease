// pages/AiTripPlanner.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const destinations = [
  { id: 1, name: "Ranipuram", district: "Kasargod", difficulty: "Easy", distance: "7 km", rating: 4.8, reviews: 120, tags: ["trekking", "nature"], url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80" },
  { id: 2, name: "Paithalmala", district: "Kannur", difficulty: "Moderate", distance: "9 km", rating: 4.7, reviews: 99, tags: ["trekking", "nature"], url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
  { id: 3, name: "Chembra Peak", district: "Wayanad", difficulty: "Moderate", distance: "11 km", rating: 4.3, reviews: 90, tags: ["trekking", "wildlife"], url: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400&q=80" },
  { id: 4, name: "Meesapulimala", district: "Idukki", difficulty: "Hard", distance: "12 km", rating: 4.8, reviews: 120, tags: ["trekking", "nature"], url: "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?w=400&q=80" },
  { id: 5, name: "Pookode Lake", district: "Wayanad", difficulty: "Easy", distance: "2 km", rating: 4.5, reviews: 156, tags: ["nature", "backwaters"], url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80" },
  { id: 6, name: "Kurisumala", district: "Idukki", difficulty: "Moderate", distance: "8 km", rating: 4.6, reviews: 74, tags: ["trekking", "nature"], url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=400&q=80" },
];

const interestOptions = ["Trekking", "Waterfalls", "Nature", "Wildlife", "Beach", "Backwaters"];
const districts = ["Kasargod", "Kannur", "Wayanad", "Idukki", "Kozhikode", "Malappuram", "Thrissur", "Ernakulam", "Kottayam", "Alappuzha", "Kollam", "Pathanamthitta", "Palakkad", "Thiruvananthapuram"];
const difficultyColor = { Easy: "#0E5C53", Moderate: "#C79A3E", Hard: "#BE5A34" };

const AiTripPlanner = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [liked, setLiked] = useState(new Set());
  const [budget, setBudget] = useState("₹5,000");
  const [duration, setDuration] = useState("2 Days");
  const [interests, setInterests] = useState(["Trekking"]);
  const [district, setDistrict] = useState("");
  const [travellers, setTravellers] = useState("2 Adults");
  const [plan, setPlan] = useState(null);
  const [activeNav, setActiveNav] = useState('ai');
  const [scrolled, setScrolled] = useState(false);

  // ✅ Redirect if not logged in
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

  const toggleLike = (id) => {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleInterest = (tag) => {
    setInterests((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access this page. Please login first.');
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const filteredForPlan = useMemo(() => {
    const lowerInterests = interests.map((i) => i.toLowerCase());
    let pool = destinations.filter((d) => {
      const matchesDistrict = !district || d.district === district;
      const matchesInterest = lowerInterests.length === 0 || d.tags.some((t) => lowerInterests.includes(t));
      return matchesDistrict && matchesInterest;
    });
    if (pool.length === 0) pool = district ? destinations.filter((d) => d.district === district) : destinations;
    if (pool.length === 0) pool = destinations;
    return pool;
  }, [interests, district]);

  const handleGenerate = () => {
    const numDays = parseInt(duration) || 2;
    const days = [];
    for (let i = 0; i < numDays; i++) {
      const place = filteredForPlan[i % filteredForPlan.length];
      days.push({
        day: i + 1,
        title: `${place.name} Trek`,
        morning: [`Reach ${place.name}`, "Trek to the top", "Enjoy the view"],
        evening: i === numDays - 1 ? ["Sunset point", "Return"] : ["Sunset point", "Stay at nearby homestay"],
      });
    }
    setPlan({ days, budget, duration, interests: interests.join(", ") || "Open" });
  };

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

  const selectStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 3,
    border: "1px solid rgba(199,154,62,0.35)",
    background: "#FBF6EA",
    color: "#0B2422",
    fontSize: 13,
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ background: "#FBF6EA", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422", paddingBottom: 100 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .tp-font-display { font-family: 'Fraunces', serif; }
        .tp-font-mono { font-family: 'IBM Plex Mono', monospace; }
        .tp-card { transition: border-color 0.3s ease, transform 0.3s ease; }
        .tp-card:hover { border-color: rgba(199,154,62,0.7); transform: translateY(-2px); }
        .tp-chip { transition: all 0.2s ease; cursor: pointer; }
        .tp-select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%230E5C53'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; }
        .tp-scroll::-webkit-scrollbar { width: 5px; }
        .tp-scroll::-webkit-scrollbar-thumb { background: rgba(199,154,62,0.4); border-radius: 4px; }
        
        @media (min-width: 768px) {
          .tp-header-content { max-width: 1200px; margin: 0 auto; padding: 0 40px; }
          .tp-container { max-width: 1200px; margin: 0 auto; padding: 28px 40px 0; }
        }

        @media (min-width: 900px) {
          .tp-grid { grid-template-columns: 1fr 1.15fr !important; align-items: start; gap: 30px !important; }
          .tp-destinations-scroll { max-height: 640px; overflow-y: auto; padding-right: 4px; }
        }

        @media (max-width: 899px) {
          .tp-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .tp-destinations-scroll { max-height: 400px; overflow-y: auto; padding-right: 4px; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#072E2A", padding: "40px 20px 30px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
        <div className="tp-header-content" style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <Link to="/" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(199,154,62,0.5)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <svg width="16" height="16" fill="none" stroke="#E4C77B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </Link>
            <Link to="/" className="tp-font-mono" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#E4C77B", textDecoration: "none" }}>
              Back to home →
            </Link>
          </div>
          <p className="tp-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", marginBottom: 8 }}>Plan with intelligence</p>
          <h1 className="tp-font-display" style={{ fontStyle: "italic", fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 500, color: "#fff", margin: "0 0 8px", lineHeight: 1.05 }}>AI Trip Planner</h1>
          <p style={{ fontSize: "clamp(13px, 1.2vw, 16px)", color: "rgba(237,226,196,0.75)", maxWidth: 580, lineHeight: 1.5 }}>
            Tell us your preferences — we'll chart the perfect route through Kerala's trails, hills and shores.
          </p>
        </div>
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
          <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
        </svg>
      </div>

      <div className="tp-container" style={{ padding: "28px 20px 0" }}>
        <div className="tp-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          <div>
            <p className="tp-font-mono" style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#0E5C53", marginBottom: 12 }}>
              Curated for the trail
            </p>
            <div className="tp-destinations-scroll" style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 640, overflowY: "auto", paddingRight: 4 }}>
              {destinations.map((d) => (
                <div key={d.id} className="tp-card" style={{ display: "flex", gap: 12, background: "#fff", borderRadius: 4, border: "1px solid rgba(199,154,62,0.3)", padding: 10 }}>
                  <img src={d.url} alt={d.name} style={{ width: 68, height: 68, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <div>
                        <h3 className="tp-font-display" style={{ fontSize: "clamp(15px, 1.2vw, 17px)", margin: 0, color: "#0B2422" }}>{d.name}</h3>
                        <p className="tp-font-mono" style={{ fontSize: 9.5, color: "#5C6E69", margin: "2px 0 0" }}>{d.district}</p>
                      </div>
                      <button onClick={() => toggleLike(d.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }} aria-label="Save destination">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={liked.has(d.id) ? "#C79A3E" : "none"} stroke={liked.has(d.id) ? "#C79A3E" : "#8A9A95"} strokeWidth="1.8">
                          <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
                        </svg>
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                      <span className="tp-font-mono" style={{ fontSize: 9, color: difficultyColor[d.difficulty], border: `1px solid ${difficultyColor[d.difficulty]}55`, borderRadius: 999, padding: "1px 7px" }}>{d.difficulty}</span>
                      <span className="tp-font-mono" style={{ fontSize: 9, color: "#8A9A95" }}>{d.distance}</span>
                      <span className="tp-font-mono" style={{ fontSize: 9, color: "#8A9A95" }}>★ {d.rating} ({d.reviews})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {!plan ? (
              <div style={{ background: "#fff", borderRadius: 4, border: "1px solid rgba(199,154,62,0.35)", padding: "28px 26px" }}>
                <p className="tp-font-mono" style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#0E5C53", margin: "0 0 4px" }}>Build your route</p>
                <h2 className="tp-font-display" style={{ fontSize: "clamp(24px, 2vw, 28px)", margin: "0 0 4px", color: "#0B2422" }}>Plan your trip with AI</h2>
                <p style={{ fontSize: 12, color: "#5C6E69", margin: "0 0 22px" }}>Tell us your preferences, we'll craft the perfect plan for you.</p>

                <label className="tp-font-mono" style={{ display: "block", fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", marginBottom: 6 }}>Budget</label>
                <select className="tp-select" value={budget} onChange={(e) => setBudget(e.target.value)} style={selectStyle}>
                  {["₹5,000", "₹10,000", "₹20,000", "₹40,000+"].map((b) => <option key={b} value={b}>{b}</option>)}
                </select>

                <label className="tp-font-mono" style={{ display: "block", fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", margin: "18px 0 6px" }}>Trip Duration</label>
                <select className="tp-select" value={duration} onChange={(e) => setDuration(e.target.value)} style={selectStyle}>
                  {["1 Day", "2 Days", "3 Days", "5 Days", "7 Days"].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                <label className="tp-font-mono" style={{ display: "block", fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", margin: "18px 0 8px" }}>Interest</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {interestOptions.map((tag) => {
                    const active = interests.includes(tag);
                    return (
                      <span
                        key={tag}
                        className="tp-chip tp-font-mono"
                        onClick={() => toggleInterest(tag)}
                        style={{
                          fontSize: "clamp(10.5px, 0.9vw, 12px)", letterSpacing: 0.5, padding: "7px 14px", borderRadius: 999,
                          border: active ? "1px solid #0E5C53" : "1px solid rgba(199,154,62,0.35)",
                          background: active ? "#0E5C53" : "#FBF6EA",
                          color: active ? "#fff" : "#5C6E69",
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>

                <label className="tp-font-mono" style={{ display: "block", fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", margin: "18px 0 6px" }}>District / Area</label>
                <select className="tp-select" value={district} onChange={(e) => setDistrict(e.target.value)} style={selectStyle}>
                  <option value="">Any district</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>

                <label className="tp-font-mono" style={{ display: "block", fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", margin: "18px 0 6px" }}>Travellers</label>
                <select className="tp-select" value={travellers} onChange={(e) => setTravellers(e.target.value)} style={selectStyle}>
                  {["1 Adult", "2 Adults", "Family (4)", "Group (6+)"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>

                <button
                  onClick={handleGenerate}
                  className="tp-font-mono"
                  style={{ width: "100%", marginTop: 26, padding: "13px 0", borderRadius: 999, border: "none", background: "#0E5C53", color: "#fff", fontSize: "clamp(11.5px, 1vw, 13px)", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.3s ease" }}
                  onMouseEnter={(e) => e.target.style.background = "#0B2422"}
                  onMouseLeave={(e) => e.target.style.background = "#0E5C53"}
                >
                  Generate Plan ✨
                </button>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 4, border: "1px solid rgba(199,154,62,0.35)", padding: "28px 26px" }}>
                <button onClick={() => setPlan(null)} className="tp-font-mono" style={{ background: "none", border: "none", cursor: "pointer", color: "#0E5C53", fontSize: 11, letterSpacing: 1, marginBottom: 16, padding: 0 }}>
                  ← Edit plan
                </button>
                <h2 className="tp-font-display" style={{ fontSize: "clamp(26px, 2.2vw, 32px)", margin: "0 0 4px", color: "#0B2422" }}>Your Trip Plan ✨</h2>
                <p className="tp-font-mono" style={{ fontSize: 10.5, color: "#5C6E69", margin: "0 0 22px" }}>
                  {plan.duration} · {plan.budget} · {plan.interests}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {plan.days.map((d, i) => (
                    <div key={i} style={{ borderRadius: 4, overflow: "hidden", border: "1px solid rgba(199,154,62,0.3)" }}>
                      <div style={{ padding: "14px 18px", background: i % 2 === 0 ? "#F5EFE0" : "#EAF1EE" }}>
                        <p className="tp-font-mono" style={{ fontSize: 9.5, letterSpacing: 1.5, textTransform: "uppercase", color: "#8A9A95", margin: 0 }}>Day {d.day}</p>
                        <p className="tp-font-display" style={{ fontSize: "clamp(17px, 1.4vw, 20px)", margin: "2px 0 0", color: "#0B2422" }}>{d.title}</p>
                      </div>
                      <div style={{ padding: "14px 18px", display: "flex", gap: 24, flexWrap: "wrap" }}>
                        <div>
                          <p className="tp-font-mono" style={{ fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: "#0E5C53", margin: "0 0 6px" }}>Morning</p>
                          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                            {d.morning.map((item, j) => <li key={j} style={{ fontSize: "clamp(12.5px, 1vw, 14px)", color: "#4A5F5A", marginBottom: 3 }}>· {item}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="tp-font-mono" style={{ fontSize: 9.5, letterSpacing: 1, textTransform: "uppercase", color: "#0E5C53", margin: "0 0 6px" }}>Evening</p>
                          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                            {d.evening.map((item, j) => <li key={j} style={{ fontSize: "clamp(12.5px, 1vw, 14px)", color: "#4A5F5A", marginBottom: 3 }}>· {item}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default AiTripPlanner;
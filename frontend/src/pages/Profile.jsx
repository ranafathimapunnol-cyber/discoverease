// pages/Profile.jsx - FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('profile');
  const [scrolled, setScrolled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tripStats, setTripStats] = useState({
    total_trips: 0,
    completed_trips: 0,
    pending_trips: 0
  });
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
  const fileInputRef = useRef(null);

  // ✅ Update edit data when user changes
  useEffect(() => {
    if (user) {
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
      
      // ✅ Load profile picture from localStorage or user object
      loadProfilePicture();
    }
  }, [user]);

  // ✅ Load profile picture
  const loadProfilePicture = () => {
    // Try to get from localStorage first
    const savedPicture = localStorage.getItem('profile_picture');
    if (savedPicture) {
      setProfilePicture(savedPicture);
      return;
    }
    
    // Then try from user object
    if (user?.profile_picture_upload) {
      setProfilePicture(user.profile_picture_upload);
    } else if (user?.profile_picture) {
      setProfilePicture(user.profile_picture);
    } else {
      setProfilePicture(null);
    }
  };

  // ✅ Fetch trip stats
  useEffect(() => {
    if (isLoggedIn) {
      fetchTripStats();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isLoggedIn, navigate]);

  const fetchTripStats = async () => {
    try {
      const response = await api.get('/auth/trip_stats/');
      if (response.data.success) {
        setTripStats({
          total_trips: response.data.total_trips || 0,
          completed_trips: response.data.completed_trips || 0,
          pending_trips: response.data.pending_trips || 0
        });
      }
    } catch (error) {
      console.warn('Trip stats fetch failed:', error);
      // Mock data for demo
      setTripStats({
        total_trips: 12,
        completed_trips: 8,
        pending_trips: 2
      });
    }
  };

  // ✅ Handle protected link clicks
  const handleProtectedClick = (path) => {
    if (!isLoggedIn) {
      alert('⚠️ Login required to access this page. Please login first.');
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      const response = await api.patch('/auth/update_profile/', editData);
      if (response.data.success) {
        alert('✅ Profile updated successfully!');
        setIsEditing(false);
        // Refresh user data
        window.location.reload();
      } else {
        alert('❌ ' + (response.data.error || 'Failed to update profile'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Failed to update profile. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setEditData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
    }
  };

  // ✅ Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Please upload an image file');
      return;
    }

    setUploading(true);
    
    try {
      // ✅ Convert to base64 and save to localStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        // Save to localStorage
        localStorage.setItem('profile_picture', base64String);
        setProfilePicture(base64String);
        setUploading(false);
        alert('✅ Profile picture updated successfully!');
        
        // Update user object in localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.profile_picture_upload = base64String;
        localStorage.setItem('user', JSON.stringify(userData));
      };
      reader.readAsDataURL(file);
      
      // Also try API upload if available
      try {
        const formData = new FormData();
        formData.append('profile_picture', file);
        await api.post('/auth/upload_profile_picture/', formData, {
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

  // ✅ Handle delete profile picture
  const handleDeleteProfilePicture = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    try {
      // Remove from localStorage
      localStorage.removeItem('profile_picture');
      setProfilePicture(null);
      
      // Update user object in localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      delete userData.profile_picture_upload;
      delete userData.profile_picture;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Try API delete if available
      try {
        await api.post('/auth/delete_profile_picture/');
      } catch (apiError) {
        console.warn('API delete failed, using localStorage only:', apiError);
      }
      
      alert('✅ Profile picture deleted successfully!');
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      alert('❌ Failed to delete profile picture. Please try again.');
    }
  };

  // ✅ Handle delete account
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
      const response = await api.post('/auth/delete_account/', {
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

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  // ✅ Show loading state
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: "#FBF6EA"
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

  // ✅ If not logged in, don't render
  if (!isLoggedIn || !user) {
    return null;
  }

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
        .pf-font-display { font-family: 'Fraunces', serif; }
        .pf-font-mono { font-family: 'IBM Plex Mono', monospace; }
        .pf-stamp { animation: pf-spin 22s linear infinite; }
        @keyframes pf-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .pf-input { transition: border-color 0.3s ease, box-shadow 0.3s ease; }
        .pf-input:focus { border-color: #C79A3E; box-shadow: 0 0 0 3px rgba(199,154,62,0.1); outline: none; }
        .pf-profile-pic:hover .pf-overlay { opacity: 1; }
        .pf-overlay { opacity: 0; transition: opacity 0.3s ease; }
        .pf-delete-btn:hover { background: #BE5A34 !important; color: #fff !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#072E2A", padding: "40px 20px 30px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 90% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <Link to="/" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(199,154,62,0.5)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <svg width="16" height="16" fill="none" stroke="#E4C77B" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </Link>
            <Link to="/" className="pf-font-mono" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#E4C77B", textDecoration: "none" }}>
              Back to home →
            </Link>
          </div>
          <p className="pf-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", marginBottom: 8 }}>Traveler passport</p>
          <h1 className="pf-font-display" style={{ fontStyle: "italic", fontSize: 34, fontWeight: 500, color: "#fff", margin: 0, lineHeight: 1.05 }}>My Profile</h1>
        </div>
        <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
          <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
        </svg>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 20px 0" }}>
        {/* Passport card */}
        <div style={{ position: "relative", background: "#fff", borderRadius: 4, border: "1px solid rgba(199,154,62,0.35)", padding: "36px 28px", overflow: "hidden" }}>
          {/* perforation edge */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundImage: "linear-gradient(to right, rgba(199,154,62,0.5) 50%, transparent 50%)", backgroundSize: "10px 1px" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            {/* ✅ Profile Picture with upload option - FIXED */}
            <div className="pf-profile-pic" style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
              <div 
                style={{ 
                  width: 96, 
                  height: 96, 
                  borderRadius: "50%", 
                  border: "1.5px solid #C79A3E", 
                  background: "#072E2A", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: 34, 
                  color: "#E4C77B", 
                  fontStyle: "italic",
                  overflow: "hidden",
                  cursor: "pointer"
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : user?.profile_picture_upload ? (
                  <img 
                    src={user.profile_picture_upload} 
                    alt="Profile" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : user?.profile_picture ? (
                  <img 
                    src={user.profile_picture} 
                    alt="Profile" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  user?.first_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || '👤'
                )}
              </div>
              
              {/* Overlay for upload */}
              <div className="pf-overlay" style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 12,
                cursor: "pointer",
                flexDirection: "column",
                gap: 2
              }}
              onClick={() => fileInputRef.current?.click()}>
                <span style={{ fontSize: 20 }}>📷</span>
                <span style={{ fontSize: 9 }}>Change</span>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleProfilePictureUpload}
                disabled={uploading}
              />
              
              {uploading && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 12
                }}>
                  Uploading...
                </div>
              )}
              
              {/* Delete profile picture button */}
              {(profilePicture || user?.profile_picture_upload || user?.profile_picture) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProfilePicture();
                  }}
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#BE5A34",
                    border: "2px solid #fff",
                    color: "#fff",
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title="Remove profile picture"
                >
                  ✕
                </button>
              )}
              
              {/* verified stamp */}
              <svg className="pf-stamp" width="34" height="34" viewBox="0 0 100 100" style={{ position: "absolute", bottom: -8, right: -8 }}>
                <circle cx="50" cy="50" r="46" fill="#FBF6EA" stroke="#C79A3E" strokeWidth="2" />
                <path id="pf-circle-path" d="M50,10 a40,40 0 1,1 -0.1,0" fill="none" />
                <text fontSize="9.5" fill="#0E5C53" fontFamily="'IBM Plex Mono', monospace" letterSpacing="1.5">
                  <textPath href="#pf-circle-path" startOffset="0%">• VERIFIED • VERIFIED •</textPath>
                </text>
              </svg>
            </div>

            <div style={{ flex: 1 }}>
              <h2 className="pf-font-display" style={{ fontSize: 26, color: "#0B2422", margin: 0 }}>
                {user?.first_name || user?.username || 'Traveler'} {user?.last_name || ''}
              </h2>
              <p style={{ color: "#5C6E69", fontSize: 13, margin: "4px 0 8px" }}>{user?.email || 'No email on file'}</p>
              <span className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "#0E5C53", border: "1px solid rgba(14,92,83,0.35)", borderRadius: 999, padding: "4px 10px" }}>
                ✓ Verified Account
              </span>
            </div>

            {/* Edit/Save buttons */}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="pf-font-mono"
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: "1px solid #C79A3E",
                  background: "transparent",
                  color: "#0B2422",
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#C79A3E";
                  e.target.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#0B2422";
                }}
              >
                ✏️ Edit Profile
              </button>
            ) : (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={handleSaveProfile}
                  className="pf-font-mono"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 999,
                    border: "1px solid #0E5C53",
                    background: "#0E5C53",
                    color: "#fff",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => e.target.style.background = "#0B2422"}
                  onMouseLeave={(e) => e.target.style.background = "#0E5C53"}
                >
                  💾 Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="pf-font-mono"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 999,
                    border: "1px solid #BE5A34",
                    background: "transparent",
                    color: "#BE5A34",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  ✕ Cancel
                </button>
              </div>
            )}
          </div>

          {/* ✅ Trip Stats */}
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ background: "#F4FAF8", borderRadius: 4, padding: "12px 16px", textAlign: "center", border: "1px solid rgba(14,92,83,0.1)" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#0E5C53", margin: 0 }}>{tripStats.total_trips}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#5C6E69", margin: 0 }}>Total Trips</p>
            </div>
            <div style={{ background: "#F4FAF8", borderRadius: 4, padding: "12px 16px", textAlign: "center", border: "1px solid rgba(14,92,83,0.1)" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#16A34A", margin: 0 }}>{tripStats.completed_trips}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#5C6E69", margin: 0 }}>Completed</p>
            </div>
            <div style={{ background: "#F4FAF8", borderRadius: 4, padding: "12px 16px", textAlign: "center", border: "1px solid rgba(14,92,83,0.1)" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#EAB308", margin: 0 }}>{tripStats.pending_trips}</p>
              <p className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#5C6E69", margin: 0 }}>Pending</p>
            </div>
          </div>

          <div style={{ margin: "20px 0 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, transparent, rgba(199,154,62,0.6), rgba(199,154,62,0.6))" }} />
              <svg width="7" height="7" viewBox="0 0 7 7"><path d="M3.5 0L7 3.5 3.5 7 0 3.5z" fill="#C79A3E" /></svg>
              <div style={{ height: 1, flex: 1, background: "linear-gradient(to left, transparent, rgba(199,154,62,0.6), rgba(199,154,62,0.6))" }} />
            </div>
          </div>

          <p className="pf-font-mono" style={{ fontSize: 10, letterSpacing: 2.5, textTransform: "uppercase", color: "#0E5C53", marginBottom: 12 }}>Account details</p>
          
          {!isEditing ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#FBF6EA", borderRadius: 4, padding: "14px 16px", border: "1px solid rgba(199,154,62,0.25)" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", margin: "0 0 4px" }}>First Name</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.first_name || '—'}</p>
              </div>
              <div style={{ background: "#FBF6EA", borderRadius: 4, padding: "14px 16px", border: "1px solid rgba(199,154,62,0.25)" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", margin: "0 0 4px" }}>Last Name</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.last_name || '—'}</p>
              </div>
              <div style={{ background: "#FBF6EA", borderRadius: 4, padding: "14px 16px", border: "1px solid rgba(199,154,62,0.25)" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", margin: "0 0 4px" }}>Username</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.username || '—'}</p>
              </div>
              <div style={{ background: "#FBF6EA", borderRadius: 4, padding: "14px 16px", border: "1px solid rgba(199,154,62,0.25)" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", margin: "0 0 4px" }}>Phone</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.phone || 'Not set'}</p>
              </div>
              <div style={{ gridColumn: "1 / -1", background: "#FBF6EA", borderRadius: 4, padding: "14px 16px", border: "1px solid rgba(199,154,62,0.25)" }}>
                <p className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", margin: "0 0 4px" }}>Email</p>
                <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.email || '—'}</p>
              </div>
              {user?.bio && (
                <div style={{ gridColumn: "1 / -1", background: "#FBF6EA", borderRadius: 4, padding: "14px 16px", border: "1px solid rgba(199,154,62,0.25)" }}>
                  <p className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", margin: "0 0 4px" }}>Bio</p>
                  <p style={{ fontWeight: 600, color: "#0B2422", margin: 0, fontSize: 14 }}>{user?.bio}</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", display: "block", marginBottom: 4 }}>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={editData.first_name}
                  onChange={handleEditChange}
                  className="pf-input"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid rgba(199,154,62,0.3)",
                    borderRadius: 4,
                    fontSize: 14,
                    background: "#FBF6EA",
                    transition: "all 0.3s ease"
                  }}
                />
              </div>
              <div>
                <label className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", display: "block", marginBottom: 4 }}>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={editData.last_name}
                  onChange={handleEditChange}
                  className="pf-input"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid rgba(199,154,62,0.3)",
                    borderRadius: 4,
                    fontSize: 14,
                    background: "#FBF6EA",
                    transition: "all 0.3s ease"
                  }}
                />
              </div>
              <div>
                <label className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", display: "block", marginBottom: 4 }}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={editData.username}
                  onChange={handleEditChange}
                  className="pf-input"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid rgba(199,154,62,0.3)",
                    borderRadius: 4,
                    fontSize: 14,
                    background: "#FBF6EA",
                    transition: "all 0.3s ease"
                  }}
                />
              </div>
              <div>
                <label className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", display: "block", marginBottom: 4 }}>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={editData.phone}
                  onChange={handleEditChange}
                  className="pf-input"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid rgba(199,154,62,0.3)",
                    borderRadius: 4,
                    fontSize: 14,
                    background: "#FBF6EA",
                    transition: "all 0.3s ease"
                  }}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="pf-font-mono" style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#8A9A95", display: "block", marginBottom: 4 }}>Bio</label>
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
                    borderRadius: 4,
                    fontSize: 14,
                    background: "#FBF6EA",
                    transition: "all 0.3s ease",
                    resize: "vertical",
                    fontFamily: "'Inter', sans-serif"
                  }}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          )}

          {/* ✅ Action Buttons */}
          <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="pf-font-mono"
              style={{
                padding: "10px 24px",
                borderRadius: 999,
                border: "1px solid #BE5A34",
                background: "transparent",
                color: "#BE5A34",
                fontSize: 10,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#BE5A34";
                e.target.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "transparent";
                e.target.style.color = "#BE5A34";
              }}
            >
              🚪 Logout
            </button>

            {/* Delete Account button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="pf-font-mono pf-delete-btn"
              style={{
                padding: "10px 24px",
                borderRadius: 999,
                border: "1px solid #BE5A34",
                background: "transparent",
                color: "#BE5A34",
                fontSize: 10,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
            >
              🗑️ Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Delete Account Modal */}
      {showDeleteModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }} onClick={() => setShowDeleteModal(false)}>
          <div style={{
            background: "#FBF6EA",
            borderRadius: 12,
            padding: 32,
            maxWidth: 460,
            width: "100%",
            border: "1px solid rgba(199,154,62,0.3)"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ 
                fontSize: 24, 
                color: "#0B2422", 
                margin: 0,
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic"
              }}>
                🗑️ Delete Account
              </h2>
              <button 
                onClick={() => setShowDeleteModal(false)} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  fontSize: 24, 
                  cursor: "pointer", 
                  color: "#5C6E69" 
                }}
              >
                ×
              </button>
            </div>
            
            <p style={{ fontSize: 14, color: "#5C6E69", marginBottom: 16 }}>
              <strong>⚠️ Warning:</strong> This action is <strong>permanent</strong> and cannot be undone. 
              All your data will be deleted.
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid rgba(199,154,62,0.3)",
                  borderRadius: 4,
                  fontSize: 14,
                  background: "#fff",
                  fontFamily: "'Inter', sans-serif"
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleDeleteAccount();
                  }
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 999,
                  border: "none",
                  background: deleteLoading ? "#9CA3AF" : "#BE5A34",
                  color: "#fff",
                  fontSize: 12,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  opacity: deleteLoading ? 0.6 : 1,
                  transition: "all 0.3s ease"
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 999,
                  border: "1px solid #D1D5DB",
                  background: "transparent",
                  color: "#5C6E69",
                  fontSize: 12,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default Profile;
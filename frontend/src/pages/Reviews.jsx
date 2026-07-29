// pages/Reviews.jsx - FIXED VERSION (Image upload as File)

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Reviews = () => {
    const navigate = useNavigate();
    const { isLoggedIn, user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        destination: '',
        district: '',
        rating: 5,
        title: '',
        review_text: '',
        tips: '',
        best_time: '',
        category: 'general'
    });

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

    const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to blob for file upload
                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', quality);
                };
            };
            reader.onerror = reject;
        });
    };

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
                // Store the original file for upload
                setImageFile(file);
                
                // Create preview
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        if (!isLoggedIn) {
            alert('⚠️ Please login first to submit a review.');
            navigate('/login');
            return;
        }

        if (!formData.district) {
            alert('⚠️ Please select a district.');
            return;
        }

        if (!formData.destination) {
            alert('⚠️ Please enter a destination name.');
            return;
        }

        if (!formData.review_text || formData.review_text.trim() === '') {
            alert('⚠️ Please write your review.');
            return;
        }

        setSubmitting(true);
        try {
            // ✅ Use FormData for file upload
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.destination);
            formDataToSend.append('title', formData.title || formData.destination);
            formDataToSend.append('description', formData.review_text);
            formDataToSend.append('suggestion_type', 'review');
            formDataToSend.append('district', formData.district);
            formDataToSend.append('category', formData.category || 'general');
            formDataToSend.append('location_info', formData.district);
            formDataToSend.append('rating', formData.rating);
            formDataToSend.append('tips', formData.tips || '');
            formDataToSend.append('best_time', formData.best_time || '');
            
            // ✅ Append image file if exists
            if (imageFile) {
                formDataToSend.append('image', imageFile);
            }

            console.log('📤 Sending review with image:', imageFile ? imageFile.name : 'No image');
            
            const response = await api.post('/suggestions/', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            console.log('📥 Response:', response.data);
            
            if (response.data?.success || response.status === 201 || response.status === 200) {
                alert('✅ Your review has been submitted for approval!');
                resetForm();
                setSubmitting(false);
                return;
            } else {
                if (response.data?.errors) {
                    const errors = Object.values(response.data.errors).flat().join('\n');
                    alert(`⚠️ ${errors}`);
                } else if (response.data?.error) {
                    alert(`⚠️ ${response.data.error}`);
                } else {
                    alert('⚠️ Failed to submit review. Please try again.');
                }
            }
        } catch (error) {
            console.error('❌ API submission failed:', error);
            console.error('❌ Error response:', error.response?.data);
            
            if (error.response?.data?.errors) {
                const errors = Object.values(error.response.data.errors).flat().join('\n');
                alert(`⚠️ ${errors}`);
            } else if (error.response?.data?.error) {
                alert(`⚠️ ${error.response.data.error}`);
            } else if (error.response?.data?.message) {
                alert(`⚠️ ${error.response.data.message}`);
            } else {
                alert('❌ Failed to submit review. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            destination: '',
            district: '',
            rating: 5,
            title: '',
            review_text: '',
            tips: '',
            best_time: '',
            category: 'general'
        });
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleProtectedClick = (path) => {
        if (!isLoggedIn) {
            alert('⚠️ Login required to access this page.');
            navigate('/login');
        } else {
            navigate(path);
        }
    };

    const BottomNav = () => (
        <div className={`fixed bottom-6 left-4 right-4 z-50 transition-all duration-500 ${
            scrolled
                ? 'bg-[#072E2A]/85 backdrop-blur-2xl shadow-2xl shadow-black/20 border-[#C79A3E]/30'
                : 'bg-[#072E2A]/70 backdrop-blur-2xl shadow-xl shadow-black/10 border-[#C79A3E]/20'
        } rounded-full border px-3 py-2`}
        >
            <div className="flex justify-around items-center max-w-md mx-auto">
                <Link to="/" className="flex flex-col items-center group">
                    <div className="p-2 rounded-full transition-all duration-300 group-hover:bg-white/5">
                        <svg className="w-6 h-6 transition-all duration-300 text-[#B9CFC9] group-hover:text-[#EDE2C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                    </div>
                </Link>

                <button onClick={() => handleProtectedClick('/categories')} className="flex flex-col items-center group">
                    <div className="p-2 rounded-full transition-all duration-300 group-hover:bg-white/5">
                        <svg className="w-6 h-6 transition-all duration-300 text-[#B9CFC9] group-hover:text-[#EDE2C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                    </div>
                </button>

                <button onClick={() => handleProtectedClick('/ai-trip-planner')} className="flex flex-col items-center group">
                    <div className="p-2 rounded-full transition-all duration-300 group-hover:bg-white/5">
                        <svg className="w-6 h-12 transition-all duration-300 text-[#B9CFC9] group-hover:text-[#EDE2C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
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
                </button>

                <button onClick={() => handleProtectedClick('/wishlist')} className="flex flex-col items-center group">
                    <div className="p-2 rounded-full transition-all duration-300 group-hover:bg-white/5">
                        <svg className="w-6 h-6 transition-all duration-300 text-[#B9CFC9] group-hover:text-[#EDE2C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </div>
                </button>

                <button onClick={() => handleProtectedClick('/profile')} className="flex flex-col items-center group">
                    <div className="p-2 rounded-full transition-all duration-300 group-hover:bg-white/5">
                        <svg className="w-6 h-6 transition-all duration-300 text-[#B9CFC9] group-hover:text-[#EDE2C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ background: "#FBF6EA", minHeight: "100vh", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422", paddingBottom: 100 }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                .rv-font-display { font-family: 'Fraunces', serif; }
                .rv-font-mono { font-family: 'IBM Plex Mono', monospace; }
                .rv-input { transition: border-color 0.3s ease, box-shadow 0.3s ease; }
                .rv-input:focus { border-color: #C79A3E; box-shadow: 0 0 0 3px rgba(199,154,62,0.1); outline: none; }
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
                        <Link to="/" className="rv-font-mono" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#E4C77B", textDecoration: "none" }}>
                            Back to home
                        </Link>
                    </div>
                    <p className="rv-font-mono" style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#E4C77B", marginBottom: 8 }}>Share your experience</p>
                    <h1 className="rv-font-display" style={{ fontStyle: "italic", fontSize: 34, fontWeight: 500, color: "#fff", margin: "0 0 8px", lineHeight: 1.05 }}>Write a Review</h1>
                    <p style={{ fontSize: 13, color: "rgba(237,226,196,0.75)", maxWidth: 460, lineHeight: 1.5 }}>
                        Share your travel experiences and help others discover Kerala.
                    </p>
                </div>
                <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
                    <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
                </svg>
            </div>

            <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px 0" }}>
                <div style={{ 
                    background: "#fff", 
                    borderRadius: 12, 
                    padding: "32px 28px",
                    border: "1px solid rgba(199,154,62,0.2)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.04)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                        <div style={{ 
                            width: 48, 
                            height: 48, 
                            borderRadius: "50%", 
                            background: "rgba(199,154,62,0.12)", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            fontSize: 24
                        }}>
                            ⭐
                        </div>
                        <div>
                            <h2 className="rv-font-display" style={{ fontSize: 22, color: "#0B2422", margin: 0 }}>Share Your Experience</h2>
                            <p style={{ fontSize: 12, color: "#5C6E69", margin: 0 }}>Your review will be submitted for approval</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Destination *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g., Munnar, Alleppey, Varkala"
                                className="rv-input"
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>District *</label>
                            <select
                                required
                                className="rv-input"
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
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Rating *</label>
                            <div style={{ display: "flex", gap: 4, fontSize: 32 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, rating: star })}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            fontSize: 32,
                                            cursor: "pointer",
                                            color: star <= formData.rating ? '#FFD700' : '#D1D5DB',
                                            transition: "all 0.2s ease",
                                            padding: "0 2px"
                                        }}
                                        onMouseEnter={(e) => e.target.style.transform = "scale(1.2)"}
                                        onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span style={{ fontSize: 14, color: "#5C6E69", marginLeft: 8, alignSelf: "center" }}>
                                    {formData.rating}/5
                                </span>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Review Title *</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g., Amazing experience at Munnar"
                                className="rv-input"
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Review *</label>
                            <textarea
                                required
                                rows="4"
                                placeholder="Describe your experience in detail..."
                                className="rv-input"
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff", resize: "vertical" }}
                                value={formData.review_text}
                                onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Tips for Travelers</label>
                            <textarea
                                rows="2"
                                placeholder="Any tips for other travelers? (e.g., best time to visit, what to carry)"
                                className="rv-input"
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff", resize: "vertical" }}
                                value={formData.tips}
                                onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Best Time to Visit</label>
                            <input
                                type="text"
                                placeholder="e.g., October to March"
                                className="rv-input"
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                                value={formData.best_time}
                                onChange={(e) => setFormData({ ...formData, best_time: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Category</label>
                            <select
                                className="rv-input"
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(199,154,62,0.3)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="beach">Beach</option>
                                <option value="hill">Hill Station</option>
                                <option value="backwater">Backwater</option>
                                <option value="heritage">Heritage</option>
                                <option value="wildlife">Wildlife</option>
                                <option value="temple">Temple</option>
                                <option value="waterfalls">Waterfalls</option>
                                <option value="natures">Natures</option>
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
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Upload Photo</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <label style={{ 
                                    cursor: "pointer", 
                                    background: "#FBF6EA", 
                                    border: "1px solid rgba(199,154,62,0.3)", 
                                    borderRadius: 8, 
                                    padding: "10px 16px", 
                                    transition: "all 0.3s ease",
                                    fontSize: 13,
                                    color: "#0B2422"
                                }}
                                onMouseEnter={(e) => e.target.style.background = "#F5EFE0"}
                                onMouseLeave={(e) => e.target.style.background = "#FBF6EA"}>
                                    <span>📷 Choose Image</span>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: "none" }}
                                    />
                                </label>
                                {imagePreview && (
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        style={{ 
                                            background: "none", 
                                            border: "none", 
                                            color: "#DC2626", 
                                            fontSize: 13, 
                                            cursor: "pointer" 
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                            <p style={{ fontSize: 11, color: "#8A9A95", marginTop: 4 }}>Max 5MB. Image will be compressed</p>
                            {imagePreview && (
                                <div style={{ marginTop: 8 }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: 180, 
                                            objectFit: 'cover', 
                                            borderRadius: 8, 
                                            border: '1px solid rgba(199,154,62,0.2)' 
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ 
                            background: "#f0f7f5", 
                            padding: "14px", 
                            borderRadius: 8, 
                            fontSize: 12, 
                            color: "#0E5C53",
                            lineHeight: 1.5,
                            marginTop: 4
                        }}>
                            💡 Your review will be sent for approval.
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !formData.review_text || formData.review_text.trim() === ''}
                            style={{
                                padding: "14px 28px",
                                borderRadius: 999,
                                border: "none",
                                background: (submitting || !formData.review_text || formData.review_text.trim() === '') ? "#9CA3AF" : "#072E2A",
                                color: "#E4C77B",
                                fontSize: 13,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                cursor: (submitting || !formData.review_text || formData.review_text.trim() === '') ? "not-allowed" : "pointer",
                                opacity: (submitting || !formData.review_text || formData.review_text.trim() === '') ? 0.6 : 1,
                                transition: "all 0.3s ease",
                                fontFamily: "'IBM Plex Mono', monospace",
                                marginTop: 4
                            }}
                            onMouseEnter={(e) => {
                                if (!submitting && formData.review_text && formData.review_text.trim() !== '') {
                                    e.target.style.background = "#0B2422";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!submitting) {
                                    e.target.style.background = "#072E2A";
                                }
                            }}
                        >
                            {submitting ? 'Submitting...' : '⭐ Submit Review'}
                        </button>
                    </form>
                </div>
            </div>

            <BottomNav />
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" />
        </div>
    );
};

export default Reviews;
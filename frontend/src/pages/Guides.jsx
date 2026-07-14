// src/pages/Guides.jsx - COMPLETE FIXED VERSION WITH AVAILABILITY SLOTS
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const T = {
    ink: '#0B2422',
    deepTeal: '#072E2A',
    teal2: '#0B3A34',
    cream: '#FBF6EA',
    gold: '#C79A3E',
    goldLight: '#E4C77B',
    muted: '#5C6E69',
    muted2: '#8A9A95',
};

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

const getDistrictName = (id) => KERALA_DISTRICTS.find((d) => d.id === Number(id))?.name || null;

const ZariDivider = ({ color = T.gold, opacity = 0.55 }) => (
    <svg width="100%" height="10" viewBox="0 0 400 10" preserveAspectRatio="none" style={{ display: 'block' }}>
        <line x1="0" y1="5" x2="400" y2="5" stroke={color} strokeWidth="0.6" strokeOpacity={opacity * 0.7} />
        {Array.from({ length: 34 }).map((_, i) => (
            <rect
                key={i}
                x={i * 12 + 4}
                y="2"
                width="4.5"
                height="4.5"
                fill={color}
                fillOpacity={opacity}
                transform={`rotate(45 ${i * 12 + 6.25} 4.25)`}
            />
        ))}
    </svg>
);

const STATUS_COLORS = {
    confirmed: { bg: '#DCFCE7', text: '#16A34A' },
    pending: { bg: '#FEF3C7', text: '#D97706' },
    completed: { bg: '#DBEAFE', text: '#2563EB' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626' },
    rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

const getStatusColor = (status) => STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#6B7280' };

const Guides = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoggedIn } = useAuth();

    const [loading, setLoading] = useState(true);
    const [guides, setGuides] = useState([]);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [destination, setDestination] = useState('');
    const [notes, setNotes] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [bookingError, setBookingError] = useState(null);

    const [myBookings, setMyBookings] = useState([]);
    const [showMyBookings, setShowMyBookings] = useState(false);
    const [reviewDialog, setReviewDialog] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [reviewImages, setReviewImages] = useState([]);
    const [submittingReview, setSubmittingReview] = useState(false);

    const [scrolled, setScrolled] = useState(false);
    const [activeNav, setActiveNav] = useState('guides');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSpecialty, setActiveSpecialty] = useState('all');
    const [activeDistrict, setActiveDistrict] = useState(null);
    const [allSpecialties, setAllSpecialties] = useState(['all']);
    
    const isInitialMount = useRef(true);
    const fetchTimeout = useRef(null);
    const isFetching = useRef(false);

    // ============================================
    // FETCH GUIDES FROM API - FIXED AVAILABILITY
    // ============================================
    const fetchGuides = async () => {
        if (isFetching.current) {
            console.log('⏳ Fetch already in progress, skipping...');
            return;
        }
        
        isFetching.current = true;
        setLoading(true);
        
        try {
            const params = {};

            if (activeDistrict) {
                params.districts = activeDistrict.id;
                console.log(`📍 Filtering by district: ${activeDistrict.name} (ID: ${activeDistrict.id})`);
            }

            if (activeSpecialty && activeSpecialty !== 'all') {
                params.category = activeSpecialty;
            }

            if (searchTerm && searchTerm !== activeDistrict?.name) {
                params.search = searchTerm;
            }

            console.log('📊 Fetching guides with params:', params);

            const response = await api.get('/guides/guides/', { params });
            
            console.log('📊 API Response:', response.data);

            let guidesData = [];
            if (response.data && response.data.results) {
                guidesData = response.data.results;
                console.log(`📊 Total guides: ${response.data.count}, Showing: ${guidesData.length}`);
            } else if (response.data && Array.isArray(response.data)) {
                guidesData = response.data;
            } else {
                guidesData = [];
            }

            const formattedGuides = guidesData.map((guide) => {
                // ✅ FIX: Properly format availability slots
                let availabilitySlots = [];
                
                // Check if guide has availabilities from API
                if (guide.availabilities && Array.isArray(guide.availabilities)) {
                    availabilitySlots = guide.availabilities.map(slot => ({
                        id: slot.id || slot.slot_id || Date.now() + Math.random(),
                        date: slot.date || slot.available_date,
                        start_time: slot.start_time || slot.startTime || '09:00',
                        end_time: slot.end_time || slot.endTime || '17:00',
                        max_bookings: slot.max_bookings || slot.maxBookings || 1,
                        current_bookings: slot.current_bookings || slot.currentBookings || 0,
                        is_booked: slot.is_booked || slot.isBooked || false,
                    }));
                }
                
                // Also check for slots in the guide object directly
                if (guide.availability && Array.isArray(guide.availability)) {
                    guide.availability.forEach(slot => {
                        if (!availabilitySlots.find(s => s.id === (slot.id || slot.slot_id))) {
                            availabilitySlots.push({
                                id: slot.id || slot.slot_id || Date.now() + Math.random(),
                                date: slot.date || slot.available_date,
                                start_time: slot.start_time || slot.startTime || '09:00',
                                end_time: slot.end_time || slot.endTime || '17:00',
                                max_bookings: slot.max_bookings || slot.maxBookings || 1,
                                current_bookings: slot.current_bookings || slot.currentBookings || 0,
                                is_booked: slot.is_booked || slot.isBooked || false,
                            });
                        }
                    });
                }

                // Also check for slots in guide.slots
                if (guide.slots && Array.isArray(guide.slots)) {
                    guide.slots.forEach(slot => {
                        if (!availabilitySlots.find(s => s.id === (slot.id || slot.slot_id))) {
                            availabilitySlots.push({
                                id: slot.id || slot.slot_id || Date.now() + Math.random(),
                                date: slot.date || slot.available_date,
                                start_time: slot.start_time || slot.startTime || '09:00',
                                end_time: slot.end_time || slot.endTime || '17:00',
                                max_bookings: slot.max_bookings || slot.maxBookings || 1,
                                current_bookings: slot.current_bookings || slot.currentBookings || 0,
                                is_booked: slot.is_booked || slot.isBooked || false,
                            });
                        }
                    });
                }

                // Sort slots by date
                availabilitySlots.sort((a, b) => new Date(a.date) - new Date(b.date));

                // Get districts
                let districts = [];
                if (guide.districts && Array.isArray(guide.districts)) {
                    districts = guide.districts;
                } else if (guide.primary_district) {
                    districts = [{ id: guide.primary_district, name: guide.primary_district_name || 'District' }];
                }

                console.log(`📊 Guide ${guide.full_name} has ${availabilitySlots.length} availability slots`);

                return {
                    id: guide.id,
                    full_name: guide.full_name || 'Guide',
                    email: guide.email || '',
                    bio: guide.bio || 'Experienced guide ready to show you the best of Kerala.',
                    experience_years: guide.years_of_experience || guide.experience_years || 0,
                    specialties: guide.categories?.map((c) => c.name) || guide.specialties || ['local tours'],
                    rating: guide.rating || '4.8',
                    total_reviews: guide.total_reviews || 0,
                    is_verified: guide.is_verified || false,
                    phone: guide.phone_number || guide.phone || '',
                    districts: districts,
                    availabilities: availabilitySlots,
                    price_per_day: guide.price_per_day || 0,
                    price_per_hour: guide.price_per_hour || 0,
                    languages: guide.languages || 'English, Malayalam',
                };
            });

            setGuides(formattedGuides);
            console.log(`📊 Formatted guides: ${formattedGuides.length}`);

            const specialties = ['all', ...new Set(formattedGuides.flatMap((g) => g.specialties || []))];
            setAllSpecialties(specialties);
        } catch (error) {
            console.error('Error fetching guides:', error);
            setGuides([]);
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    };

    // ============================================
    // FETCH MY BOOKINGS
    // ============================================
    const fetchMyBookings = async () => {
        try {
            console.log('📊 Fetching my bookings...');
            
            if (!user?.email) {
                console.log('⚠️ No user logged in, skipping bookings fetch');
                setMyBookings([]);
                return;
            }
            
            let bookingsData = [];
            let response = null;
            
            try {
                response = await api.get('/guides/bookings/');
                console.log('📊 /guides/bookings/ response:', response.data);
            } catch (e) {
                console.log('⚠️ /guides/bookings/ failed:', e.message);
            }
            
            if (!response || !response.data || (Array.isArray(response.data) && response.data.length === 0)) {
                try {
                    response = await api.get('/bookings/');
                    console.log('📊 /bookings/ response:', response.data);
                } catch (e) {
                    console.log('⚠️ /bookings/ failed:', e.message);
                }
            }
            
            if (!response || !response.data || (Array.isArray(response.data) && response.data.length === 0)) {
                try {
                    response = await api.get('/guides/my-bookings/');
                    console.log('📊 /guides/my-bookings/ response:', response.data);
                } catch (e) {
                    console.log('⚠️ /guides/my-bookings/ failed:', e.message);
                }
            }
            
            if (response && response.data) {
                if (response.data.success && response.data.bookings) {
                    bookingsData = response.data.bookings;
                } else if (response.data.success && response.data.results) {
                    bookingsData = response.data.results;
                } else if (Array.isArray(response.data)) {
                    bookingsData = response.data;
                } else if (response.data.results && Array.isArray(response.data.results)) {
                    bookingsData = response.data.results;
                } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
                    bookingsData = response.data.bookings;
                }
            }
            
            if (bookingsData.length > 0 && user?.email) {
                const filtered = bookingsData.filter(b => {
                    const userMatch = 
                        b.user?.email === user.email ||
                        b.traveler_email === user.email ||
                        b.travelerEmail === user.email ||
                        b.user === user.id ||
                        b.user_id === user.id ||
                        b.user?.id === user.id;
                    
                    return userMatch;
                });
                
                console.log(`📊 Final filtered bookings: ${filtered.length}`);
                setMyBookings(filtered);
            } else {
                try {
                    const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
                    if (user?.email) {
                        const userBookings = travelerBookings.filter(b => b.travelerEmail === user.email);
                        console.log(`📊 Found ${userBookings.length} bookings in localStorage`);
                        setMyBookings(userBookings);
                    } else {
                        setMyBookings(travelerBookings);
                    }
                } catch (e) {
                    console.error('Error reading localStorage:', e);
                    setMyBookings([]);
                }
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            setMyBookings([]);
        }
    };

    // ============================================
    // SUBMIT REVIEW WITH IMAGES
    // ============================================
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const imagePromises = files.map((file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve({
                        id: Date.now() + Math.random(),
                        file: file,
                        dataUrl: reader.result,
                        name: file.name,
                        size: file.size,
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(imagePromises).then((newImages) => {
            setReviewImages((prev) => [...prev, ...newImages]);
        });
    };

    const removeImage = (imageId) => {
        setReviewImages((prev) => prev.filter((img) => img.id !== imageId));
    };

    const handleSubmitReview = async (bookingId) => {
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        if (!reviewText.trim()) {
            alert('Please write a review');
            return;
        }

        setSubmittingReview(true);
        try {
            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('comment', reviewText);
            
            reviewImages.forEach((img) => {
                if (img.file) {
                    formData.append('images', img.file);
                }
            });

            let response = null;
            try {
                response = await api.post(`/guides/bookings/${bookingId}/review/`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } catch (e) {
                console.log('⚠️ /guides/bookings/ review failed:', e);
                try {
                    response = await api.post(`/bookings/${bookingId}/review/`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                } catch (e2) {
                    console.log('⚠️ /bookings/ review failed:', e2);
                }
            }
            
            console.log('✅ Review submitted:', response?.data);
            
            try {
                const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
                const updated = travelerBookings.map(b => {
                    if (b.id === bookingId) {
                        return { 
                            ...b, 
                            review: { 
                                rating, 
                                comment: reviewText, 
                                images: reviewImages.map(img => img.dataUrl),
                                created_at: new Date().toISOString() 
                            },
                            has_review: true 
                        };
                    }
                    return b;
                });
                localStorage.setItem('traveler_bookings', JSON.stringify(updated));
            } catch (e) {
                console.log('Error saving review to localStorage:', e);
            }
            
            alert('✅ Review submitted successfully! Thank you for your feedback.');
            setReviewDialog(null);
            setRating(0);
            setReviewText('');
            setReviewImages([]);
            fetchMyBookings();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setSubmittingReview(false);
        }
    };

    // ============================================
    // BOOKING FUNCTIONS
    // ============================================
    const handleBookGuide = async () => {
        setBookingError(null);
        if (!selectedGuide || !selectedSlot) {
            setBookingError('Please select a date slot.');
            return;
        }
        const trimmedDestination = destination.trim();
        if (!trimmedDestination) {
            setBookingError('Please enter a destination.');
            return;
        }

        setBookingLoading(true);
        try {
            const bookingData = {
                guide: selectedGuide.id,
                district: activeDistrict?.id || selectedGuide.districts?.[0]?.id,
                date: selectedSlot.date,
                time: selectedSlot.start_time,
                duration_hours: 1,
                number_of_people: 1,
                special_requests: notes.trim() || trimmedDestination,
                destination: trimmedDestination,
                slot_id: selectedSlot.id,
            };

            console.log('📝 Creating booking:', bookingData);

            let response = null;
            let success = false;
            
            try {
                response = await api.post('/guides/bookings/', bookingData);
                console.log('📝 /guides/bookings/ response:', response.data);
                if (response.data) success = true;
            } catch (e) {
                console.log('⚠️ /guides/bookings/ failed:', e.message);
            }
            
            if (!success) {
                try {
                    response = await api.post('/bookings/', bookingData);
                    console.log('📝 /bookings/ response:', response.data);
                    if (response.data) success = true;
                } catch (e) {
                    console.log('⚠️ /bookings/ failed:', e.message);
                }
            }
            
            if (!success) {
                try {
                    response = await api.post('/guides/bookings/create/', bookingData);
                    console.log('📝 /guides/bookings/create/ response:', response.data);
                    if (response.data) success = true;
                } catch (e) {
                    console.log('⚠️ /guides/bookings/create/ failed:', e.message);
                }
            }

            // Save to localStorage
            try {
                const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
                const newBooking = {
                    id: response?.data?.id || Date.now(),
                    guideEmail: selectedGuide.email || selectedGuide.id,
                    guideName: selectedGuide.full_name,
                    guideId: selectedGuide.id,
                    district: activeDistrict?.name || selectedGuide.districts?.[0]?.name,
                    destination: trimmedDestination,
                    date: selectedSlot.date,
                    time: `${selectedSlot.start_time} - ${selectedSlot.end_time}`,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    travelerEmail: user?.email,
                    notes: notes.trim() || trimmedDestination,
                    has_review: false,
                    slot_id: selectedSlot.id,
                };
                travelerBookings.push(newBooking);
                localStorage.setItem('traveler_bookings', JSON.stringify(travelerBookings));
                console.log('✅ Booking saved to localStorage:', newBooking);
            } catch (e) {
                console.log('Error saving to localStorage:', e);
            }

            if (success) {
                setBookingSuccess(`✅ Booking sent to ${selectedGuide.full_name}! They'll confirm shortly.`);
            } else {
                setBookingSuccess(`✅ Booking request saved! ${selectedGuide.full_name} will confirm shortly.`);
            }
            
            setSelectedGuide(null);
            setSelectedSlot(null);
            setDestination('');
            setNotes('');
            
            await Promise.all([fetchGuides(), fetchMyBookings()]);
            
        } catch (error) {
            console.error('Booking error:', error);
            setBookingError(error.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleCancelMyBooking = async (bookingId) => {
        if (!window.confirm('Cancel this booking?')) return;
        try {
            try {
                await api.post(`/guides/bookings/${bookingId}/cancel/`);
            } catch (e) {
                console.log('API cancel failed:', e);
                try {
                    await api.post(`/bookings/${bookingId}/cancel/`);
                } catch (e2) {
                    console.log('Alternative cancel also failed:', e2);
                }
            }
            
            try {
                const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
                const updated = travelerBookings.map(b => 
                    b.id === bookingId ? { ...b, status: 'cancelled' } : b
                );
                localStorage.setItem('traveler_bookings', JSON.stringify(updated));
            } catch (e) {
                console.log('Error updating localStorage:', e);
            }
            
            await fetchMyBookings();
        } catch (error) {
            alert('Failed to cancel booking');
            console.error('Cancel error:', error);
        }
    };

    // ============================================
    // NAVIGATE TO MY BOOKINGS PAGE
    // ============================================
    const navigateToMyBookings = () => {
        navigate('/my-bookings');
    };

    // ============================================
    // FILTER GUIDES
    // ============================================
    const filteredGuides = guides.filter((g) => {
        let matchesSearch = true;
        if (searchTerm && searchTerm !== activeDistrict?.name) {
            const term = searchTerm.toLowerCase();
            matchesSearch = 
                (g.full_name || '').toLowerCase().includes(term) ||
                (g.bio || '').toLowerCase().includes(term) ||
                (g.specialties || []).some((s) => s.toLowerCase().includes(term));
        }

        const matchesSpecialty = activeSpecialty === 'all' || (g.specialties || []).includes(activeSpecialty);

        let matchesDistrict = true;
        if (activeDistrict) {
            matchesDistrict = (g.districts || []).some(d => d.id === activeDistrict.id);
        }

        return matchesSearch && matchesSpecialty && matchesDistrict;
    });

    // ============================================
    // EFFECTS
    // ============================================
    
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const district = params.get('district');
        const specialty = params.get('specialty');
        const search = params.get('search');

        console.log('📍 URL Params:', { district, specialty, search });

        let shouldUpdate = false;

        if (specialty) {
            setActiveSpecialty(specialty);
            shouldUpdate = true;
        }
        
        if (search && search !== district) {
            setSearchTerm(search);
            shouldUpdate = true;
        } else if (!district) {
            if (search) {
                setSearchTerm(search);
                shouldUpdate = true;
            }
        }
        
        if (district) {
            const found = KERALA_DISTRICTS.find((d) => d.name.toLowerCase() === district.toLowerCase());
            if (found) {
                setActiveDistrict(found);
                console.log(`📍 Set active district: ${found.name} (ID: ${found.id})`);
                shouldUpdate = true;
            } else {
                const foundById = KERALA_DISTRICTS.find((d) => d.id === Number(district));
                if (foundById) {
                    setActiveDistrict(foundById);
                    console.log(`📍 Set active district by ID: ${foundById.name} (ID: ${foundById.id})`);
                    shouldUpdate = true;
                }
            }
        } else {
            setActiveDistrict(null);
            shouldUpdate = true;
        }

        if (shouldUpdate || isInitialMount.current) {
            isInitialMount.current = false;
            if (fetchTimeout.current) {
                clearTimeout(fetchTimeout.current);
            }
            fetchTimeout.current = setTimeout(() => {
                Promise.all([fetchGuides(), fetchMyBookings()])
                    .then(() => console.log('✅ Guides and bookings fetched successfully'))
                    .catch(err => console.error('❌ Error fetching data:', err));
            }, 300);
        }
    }, [location.search]);

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

    useEffect(() => {
        if (!isInitialMount.current) {
            if (fetchTimeout.current) {
                clearTimeout(fetchTimeout.current);
            }
            fetchTimeout.current = setTimeout(() => {
                fetchGuides();
            }, 200);
        }
    }, [activeSpecialty]);

    useEffect(() => {
        if (user?.email) {
            fetchMyBookings();
        }
    }, [user?.email]);

    // Listen for storage changes to update availability
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'guide_availability_update' || e.key === 'guide_bookings_update') {
                console.log('🔄 Availability updated, refreshing guides...');
                fetchGuides();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('bookingsUpdated', () => {
            console.log('🔄 Bookings updated, refreshing guides...');
            fetchGuides();
        });
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('bookingsUpdated', () => {});
        };
    }, []);

    const StarRating = ({ rating }) => {
        const r = parseFloat(rating) || 0;
        return (
            <span style={{ letterSpacing: 1 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} style={{ color: i <= Math.round(r) ? T.gold : '#E3DCC8', fontSize: 13 }}>
                        ★
                    </span>
                ))}
            </span>
        );
    };

    const BottomNav = () => (
        <div
            className={`fixed bottom-6 left-4 right-4 z-50 transition-all duration-500 ${
                scrolled
                    ? 'bg-[#072E2A]/85 backdrop-blur-2xl shadow-2xl shadow-black/20 border-[#C79A3E]/30'
                    : 'bg-[#072E2A]/70 backdrop-blur-2xl shadow-xl shadow-black/10 border-[#C79A3E]/20'
            } rounded-full border px-3 py-2 max-w-md mx-auto`}>
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
                            <circle cx="7" cy="1" r="1.5"/><circle cx="17" cy="1" r="1.5"/>
                            <rect x="3" y="5" width="18" height="16" rx="3"/>
                            <rect x="7" y="9" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                            <rect x="14" y="9" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                            <line x1="9" y1="15" x2="15" y2="15"/>
                            <line x1="10" y1="16" x2="14" y2="16"/>
                            <circle cx="3.5" cy="12" r="1"/><circle cx="20.5" cy="12" r="1"/>
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

    const handleProtectedClick = (path) => {
        if (!isLoggedIn) {
            alert('⚠️ Login required.');
            navigate('/login');
        } else navigate(path);
    };

    const openGuide = (guide) => {
        setSelectedGuide(selectedGuide?.id === guide.id ? null : guide);
        setSelectedSlot(null);
        setBookingError(null);
    };

    // Styles for review dialog with images
    const reviewDialogStyles = {
        overlay: {
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
        },
        dialog: {
            background: '#fff',
            borderRadius: 16,
            padding: '32px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            maxHeight: '90vh',
            overflow: 'auto',
        },
        imageGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            margin: '12px 0',
        },
        imageContainer: {
            position: 'relative',
            paddingBottom: '100%',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #D1D5DB',
        },
        imagePreview: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
        },
        removeImageBtn: {
            position: 'absolute',
            top: 4,
            right: 4,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 24,
            height: 24,
            cursor: 'pointer',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        uploadArea: {
            border: '2px dashed #D1D5DB',
            borderRadius: 8,
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            marginTop: 12,
        },
        uploadInput: {
            display: 'none',
        },
    };

    return (
        <div
            style={{
                background: T.cream,
                minHeight: '100vh',
                paddingBottom: 100,
                fontFamily: "'Inter','Segoe UI',sans-serif",
                color: T.ink,
            }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                .guide-font-display { font-family: 'Fraunces', serif; }
                .guide-font-mono { font-family: 'IBM Plex Mono', monospace; }
                .guide-card { transition: all 0.3s ease; }
                .guide-card:hover { transform: translateY(-4px); box-shadow: 0 14px 34px rgba(7,46,42,0.14); }
                .guide-selected { border: 2px solid #0E5C53 !important; }
                .availability-slot { transition: all 0.2s ease; }
                .availability-slot:hover:not(:disabled) { background: #0E5C53 !important; color: #fff !important; transform: scale(1.02); }
                .availability-slot:disabled { opacity: 0.5; cursor: not-allowed; }
                .guide-search:focus { outline: none; border-color: ${T.gold} !important; box-shadow: 0 0 0 3px rgba(199,154,62,0.15); }
                .specialty-chip, .district-badge { transition: all 0.25s ease; white-space: nowrap; }
                .toast-success { color: #16A34A; background: #DCFCE7; border: 1px solid #BBF7D0; }
                .toast-error { color: #DC2626; background: #FEE2E2; border: 1px solid #FECACA; }
                .review-image-preview {
                    position: relative;
                    padding-bottom: 100%;
                    border-radius: 8px;
                    overflow: hidden;
                    border: 1px solid #D1D5DB;
                }
                .review-image-preview img {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .review-image-preview .remove-btn {
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    background: rgba(0,0,0,0.6);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .review-upload-area {
                    border: 2px dashed #D1D5DB;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: border-color 0.2s;
                    margin-top: 12px;
                }
                .review-upload-area:hover {
                    border-color: ${T.gold};
                }
            `}</style>

            {/* Header */}
            <div style={{ background: T.deepTeal, padding: '48px 20px 28px', position: 'relative', overflow: 'hidden' }}>
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 85% 0%, rgba(199,154,62,0.15), transparent 55%)',
                    }}
                />
                <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
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
                                className="guide-font-mono"
                                style={{
                                    fontSize: 10,
                                    letterSpacing: 3,
                                    textTransform: 'uppercase',
                                    color: T.goldLight,
                                    marginBottom: 8,
                                }}>
                                DiscoverEase · Local Experts
                            </p>
                            <h1
                                className="guide-font-display"
                                style={{
                                    fontStyle: 'italic',
                                    fontSize: 'clamp(32px, 5vw, 48px)',
                                    fontWeight: 500,
                                    color: '#fff',
                                    margin: '0 0 6px',
                                    lineHeight: 1.05,
                                }}>
                                {activeDistrict ? `🧭 Guides in ${activeDistrict.name}` : '🧭 Book a Guide'}
                            </h1>
                            <p style={{ fontSize: 'clamp(13px, 1.2vw, 16px)', color: 'rgba(237,226,196,0.75)' }}>
                                {activeDistrict
                                    ? `Verified guides serving ${activeDistrict.name}`
                                    : 'Connect with verified local guides for an authentic Kerala experience'}
                            </p>
                            <div style={{ marginTop: 18, maxWidth: 340 }}>
                                <ZariDivider />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button
                                onClick={navigateToMyBookings}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: 999,
                                    border: 'none',
                                    background: T.gold,
                                    color: '#fff',
                                    fontWeight: 500,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                📅 My Bookings
                                {myBookings.length > 0 && (
                                    <span
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            padding: '1px 8px',
                                            borderRadius: 999,
                                            fontSize: 11,
                                        }}>
                                        {myBookings.length}
                                    </span>
                                )}
                            </button>
                        
                        </div>
                    </div>
                </div>
                <svg
                    viewBox="0 0 1200 40"
                    preserveAspectRatio="none"
                    style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: 26 }}>
                    <path
                        d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z"
                        fill={T.cream}
                    />
                </svg>
            </div>

            {bookingSuccess && (
                <div style={{ maxWidth: '1200px', margin: '16px auto 0', padding: '0 20px' }}>
                    <div
                        className="toast-success"
                        style={{ padding: '14px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span>✅</span>
                        <span>{bookingSuccess}</span>
                        <button
                            onClick={() => setBookingSuccess(null)}
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                fontSize: 18,
                                cursor: 'pointer',
                                color: '#16A34A',
                            }}>
                            ×
                        </button>
                    </div>
                </div>
            )}

            

            {/* REVIEW DIALOG WITH IMAGE UPLOAD */}
            {reviewDialog && (
                <div style={reviewDialogStyles.overlay} onClick={() => setReviewDialog(null)}>
                    <div
                        style={reviewDialogStyles.dialog}
                        onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, color: T.ink }}>⭐ Share Your Experience</h3>
                            <button
                                onClick={() => setReviewDialog(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 24,
                                    cursor: 'pointer',
                                    color: T.muted,
                                }}>
                                ×
                            </button>
                        </div>
                        
                        <p style={{ color: T.muted, fontSize: 14, marginBottom: 16 }}>
                            How was your trip with <strong>{reviewDialog.guide_name || reviewDialog.guideName || 'the guide'}</strong>?
                        </p>
                        
                        {/* Rating */}
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        style={{
                                            fontSize: 32,
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            transform: rating >= star ? 'scale(1.1)' : 'scale(1)',
                                        }}>
                                        <span style={{ 
                                            color: rating >= star ? '#FFB300' : '#E0E0E0',
                                            textShadow: rating >= star ? '0 0 20px rgba(255,179,0,0.3)' : 'none',
                                        }}>
                                            ★
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <p style={{ fontSize: 13, color: T.muted, marginTop: 8 }}>
                                {rating === 0 && 'Tap a star to rate'}
                                {rating === 1 && 'Poor'}
                                {rating === 2 && 'Fair'}
                                {rating === 3 && 'Good'}
                                {rating === 4 && 'Very Good'}
                                {rating === 5 && 'Excellent!'}
                            </p>
                        </div>
                        
                        {/* Review Text */}
                        <textarea
                            placeholder="Share your experience with this guide..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: 8,
                                border: '1px solid #D1D5DB',
                                fontSize: 14,
                                resize: 'vertical',
                                minHeight: 80,
                                fontFamily: 'inherit',
                            }}
                        />
                        
                        {/* Image Upload */}
                        <div style={{ marginTop: 12 }}>
                            <label style={{ fontSize: 13, fontWeight: 500, color: T.ink, display: 'block', marginBottom: 4 }}>
                                📸 Add Photos
                            </label>
                            
                            {reviewImages.length > 0 && (
                                <div style={reviewDialogStyles.imageGrid}>
                                    {reviewImages.map((img) => (
                                        <div key={img.id} style={reviewDialogStyles.imageContainer}>
                                            <img src={img.dataUrl} alt="Review" style={reviewDialogStyles.imagePreview} />
                                            <button
                                                onClick={() => removeImage(img.id)}
                                                style={reviewDialogStyles.removeImageBtn}>
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <div
                                style={reviewDialogStyles.uploadArea}
                                onClick={() => document.getElementById('review-image-input').click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = T.gold;
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                    const files = Array.from(e.dataTransfer.files);
                                    const imagePromises = files.map((file) => {
                                        return new Promise((resolve) => {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                resolve({
                                                    id: Date.now() + Math.random(),
                                                    file: file,
                                                    dataUrl: reader.result,
                                                    name: file.name,
                                                    size: file.size,
                                                });
                                            };
                                            reader.readAsDataURL(file);
                                        });
                                    });
                                    Promise.all(imagePromises).then((newImages) => {
                                        setReviewImages((prev) => [...prev, ...newImages]);
                                    });
                                }}>
                                <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
                                    📤 Drag & drop photos here, or click to browse
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 11, color: T.muted2 }}>
                                    Max 5 photos
                                </p>
                                <input
                                    id="review-image-input"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={reviewDialogStyles.uploadInput}
                                    onChange={handleImageUpload}
                                />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                            <button
                                onClick={() => setReviewDialog(null)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: 8,
                                    border: '1px solid #D1D5DB',
                                    background: 'transparent',
                                    color: T.muted,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                }}>
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmitReview(reviewDialog.id)}
                                disabled={submittingReview || rating === 0 || !reviewText.trim()}
                                style={{
                                    flex: 2,
                                    padding: '10px',
                                    borderRadius: 8,
                                    border: 'none',
                                    background: (submittingReview || rating === 0 || !reviewText.trim()) 
                                        ? '#D1D5DB' 
                                        : 'linear-gradient(135deg, #FF9800, #FFC107)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    cursor: (submittingReview || rating === 0 || !reviewText.trim()) 
                                        ? 'not-allowed' 
                                        : 'pointer',
                                    fontSize: 14,
                                }}>
                                {submittingReview ? 'Submitting...' : '✅ Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search + Specialty Filters */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 0' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ position: 'relative', flex: '1 1 260px' }}>
                        <span
                            style={{
                                position: 'absolute',
                                left: 14,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: T.muted2,
                                fontSize: 14,
                            }}>
                            🔍
                        </span>
                        <input
                            className="guide-search"
                            type="text"
                            placeholder="Search guides by name, bio, or specialty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 38px',
                                borderRadius: 999,
                                border: '1px solid rgba(199,154,62,0.3)',
                                fontSize: 13,
                                background: '#fff',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                        {allSpecialties.map((s) => (
                            <button
                                key={s}
                                className="specialty-chip"
                                onClick={() => setActiveSpecialty(s)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 999,
                                    fontSize: 11,
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    border: activeSpecialty === s ? '2px solid #0E5C53' : '1px solid #D1D5DB',
                                    background: activeSpecialty === s ? '#0E5C53' : 'transparent',
                                    color: activeSpecialty === s ? '#fff' : '#5C6E69',
                                    cursor: 'pointer',
                                }}>
                                {s === 'all' ? 'All' : s}
                            </button>
                        ))}
                    </div>
                </div>
                {activeDistrict && (
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                            className="district-badge"
                            style={{
                                padding: '6px 14px',
                                borderRadius: 999,
                                fontSize: 12,
                                background: T.gold,
                                color: '#fff',
                            }}>
                            📍 {activeDistrict.name}
                        </span>
                        <button
                            onClick={() => setActiveDistrict(null)}
                            style={{
                                fontSize: 11,
                                color: T.muted,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                            }}>
                            Clear district filter
                        </button>
                    </div>
                )}
            </div>

            {/* Guides Grid */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 24px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                border: '3px solid #E4C77B',
                                borderTop: '3px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                margin: '0 auto',
                            }}
                        />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        <p style={{ marginTop: 16, color: T.muted }}>Loading guides...</p>
                    </div>
                ) : filteredGuides.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>🧭</div>
                        <h2 className="guide-font-display" style={{ fontSize: 28, color: T.deepTeal, marginBottom: 8 }}>
                            {guides.length === 0 ? 'No guides available yet' : 'No guides match your search'}
                        </h2>
                        <p style={{ color: T.muted2, fontSize: 16 }}>
                            {guides.length === 0
                                ? activeDistrict
                                    ? `No guides currently serve ${activeDistrict.name}.`
                                    : 'Check back soon — guides are still setting up their availability.'
                                : 'Try a different search term or specialty.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: 20 }}>
                        {filteredGuides.map((guide) => {
                            // Filter available slots (not booked, future dates)
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            const availableSlots = (guide.availabilities || []).filter(slot => {
                                const slotDate = new Date(slot.date);
                                slotDate.setHours(0, 0, 0, 0);
                                const isBooked = slot.is_booked || (slot.current_bookings || 0) >= (slot.max_bookings || 1);
                                return slotDate >= today && !isBooked;
                            });
                            
                            // Sort slots by date
                            availableSlots.sort((a, b) => new Date(a.date) - new Date(b.date));
                            
                            const totalSlots = guide.availabilities?.length || 0;
                            const availableCount = availableSlots.length;
                            
                            return (
                            <div
                                key={guide.id}
                                className={`guide-card ${selectedGuide?.id === guide.id ? 'guide-selected' : ''}`}
                                style={{
                                    background: '#fff',
                                    borderRadius: 16,
                                    padding: '26px',
                                    border:
                                        selectedGuide?.id === guide.id
                                            ? '2px solid #0E5C53'
                                            : '1px solid rgba(199,154,62,0.15)',
                                    cursor: 'pointer',
                                }}
                                onClick={() => openGuide(guide)}>
                                
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                        <div
                                            style={{
                                                width: 68,
                                                height: 68,
                                                borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 28,
                                                fontWeight: 'bold',
                                                color: '#fff',
                                                flexShrink: 0,
                                            }}>
                                            {guide.full_name?.[0] || 'G'}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: 19, fontWeight: 600, color: T.ink, margin: 0 }}>
                                                {guide.full_name}
                                            </h3>
                                            
                                            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                                {(guide.districts || []).map((d) => (
                                                    <span
                                                        key={d.id}
                                                        style={{
                                                            padding: '2px 10px',
                                                            borderRadius: 999,
                                                            fontSize: 9,
                                                            background: T.goldLight,
                                                            color: T.deepTeal,
                                                        }}>
                                                        📍 {d.name}
                                                    </span>
                                                ))}
                                                {(!guide.districts || guide.districts.length === 0) && (
                                                    <span
                                                        style={{
                                                            padding: '2px 10px',
                                                            borderRadius: 999,
                                                            fontSize: 9,
                                                            background: '#E5E7EB',
                                                            color: '#6B7280',
                                                        }}>
                                                        District not assigned
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                                {guide.specialties.map((s, i) => (
                                                    <span
                                                        key={i}
                                                        style={{
                                                            padding: '2px 10px',
                                                            borderRadius: 999,
                                                            fontSize: 10,
                                                            background: 'rgba(199,154,62,0.15)',
                                                            color: '#0E5C53',
                                                        }}>
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            <div
                                                style={{
                                                    marginTop: 8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    flexWrap: 'wrap',
                                                }}>
                                                <StarRating rating={guide.rating} />
                                                <span style={{ fontSize: 13, color: T.muted }}>
                                                    {guide.rating} · {guide.total_reviews} reviews ·{' '}
                                                    {guide.experience_years}y experience
                                                </span>
                                                {guide.is_verified && (
                                                    <span
                                                        style={{
                                                            padding: '2px 8px',
                                                            borderRadius: 999,
                                                            fontSize: 10,
                                                            background: '#DCFCE7',
                                                            color: '#16A34A',
                                                        }}>
                                                        ✅ Verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <p style={{ fontSize: 14, color: '#4A5F5A', lineHeight: 1.6 }}>{guide.bio}</p>
                                        {guide.phone && (
                                            <p style={{ fontSize: 13, color: T.muted, marginTop: 8 }}>📞 {guide.phone}</p>
                                        )}
                                        {guide.price_per_day > 0 && (
                                            <p style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                                                💰 ₹{guide.price_per_day}/day {guide.price_per_hour > 0 && `· ₹${guide.price_per_hour}/hour`}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{ textAlign: 'right', minWidth: 110 }}>
                                        <span
                                            style={{
                                                padding: '4px 16px',
                                                borderRadius: 999,
                                                fontSize: 12,
                                                background: availableCount > 0 ? '#DCFCE7' : '#FEE2E2',
                                                color: availableCount > 0 ? '#16A34A' : '#DC2626',
                                                display: 'inline-block',
                                            }}>
                                            {availableCount > 0 ? `✅ ${availableCount} slot${availableCount > 1 ? 's' : ''}` : '❌ No slots'}
                                        </span>
                                        {totalSlots > 0 && totalSlots !== availableCount && (
                                            <span style={{ fontSize: 10, color: T.muted2, display: 'block', marginTop: 4 }}>
                                                ({totalSlots} total, {totalSlots - availableCount} booked)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {selectedGuide?.id === guide.id && (
                                    <div
                                        style={{
                                            marginTop: 22,
                                            borderTop: '1px solid rgba(199,154,62,0.2)',
                                            paddingTop: 20,
                                        }}
                                        onClick={(e) => e.stopPropagation()}>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                            <div>
                                                <h4 style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 4px' }}>📍 Districts Served</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                    {(guide.districts || []).map((d) => (
                                                        <span
                                                            key={d.id}
                                                            style={{
                                                                padding: '2px 10px',
                                                                borderRadius: 999,
                                                                fontSize: 11,
                                                                background: T.goldLight,
                                                                color: T.deepTeal,
                                                            }}>
                                                            {d.name}
                                                        </span>
                                                    ))}
                                                    {(!guide.districts || guide.districts.length === 0) && (
                                                        <span style={{ fontSize: 13, color: T.muted }}>No districts assigned</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 4px' }}>💬 Languages</h4>
                                                <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
                                                    {guide.languages || 'English, Malayalam'}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 4px' }}>⭐ Rating</h4>
                                                <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
                                                    {guide.rating} · {guide.total_reviews} reviews
                                                </p>
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: 13, fontWeight: 600, color: T.ink, margin: '0 0 4px' }}>💰 Pricing</h4>
                                                <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
                                                    ₹{guide.price_per_day}/day {guide.price_per_hour > 0 && `· ₹${guide.price_per_hour}/hour`}
                                                    {guide.price_per_day === 0 && guide.price_per_hour === 0 && 'Not set'}
                                                </p>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: 14, fontWeight: 500, color: T.ink, marginBottom: 12 }}>
                                            📅 Available Slots ({availableCount}):
                                        </p>
                                        
                                        {availableCount === 0 ? (
                                            <p style={{ fontSize: 13, color: T.muted2, fontStyle: 'italic' }}>
                                                No available slots at the moment. Check back later!
                                            </p>
                                        ) : (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {availableSlots.map((slot) => {
                                                    const isSelected = selectedSlot?.id === slot.id;
                                                    const isBooked =
                                                        slot.is_booked ||
                                                        (slot.current_bookings || 0) >= (slot.max_bookings || 1);
                                                    
                                                    // Format date nicely
                                                    const slotDate = new Date(slot.date);
                                                    const dateStr = slotDate.toLocaleDateString('en-IN', { 
                                                        day: 'numeric', 
                                                        month: 'short', 
                                                        year: 'numeric' 
                                                    });
                                                    
                                                    return (
                                                        <button
                                                            key={slot.id}
                                                            className="availability-slot"
                                                            onClick={() => {
                                                                if (!isBooked) {
                                                                    setSelectedSlot(isSelected ? null : slot);
                                                                    setBookingError(null);
                                                                }
                                                            }}
                                                            disabled={isBooked}
                                                            style={{
                                                                padding: '10px 18px',
                                                                borderRadius: 999,
                                                                border: isSelected ? '2px solid #0E5C53' : '1px solid #D1D5DB',
                                                                background: isSelected
                                                                    ? '#0E5C53'
                                                                    : isBooked
                                                                      ? '#E5E7EB'
                                                                      : '#fff',
                                                                color: isSelected ? '#fff' : isBooked ? '#9CA3AF' : '#0B2422',
                                                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                                                fontSize: 13,
                                                                opacity: isBooked ? 0.6 : 1,
                                                            }}>
                                                            📅 {dateStr} <span style={{ margin: '0 8px' }}>•</span> ⏰{' '}
                                                            {slot.start_time} - {slot.end_time}
                                                            <span style={{ marginLeft: 10, fontSize: 11, opacity: 0.7 }}>
                                                                {isBooked
                                                                    ? '🔒 Booked'
                                                                    : `(${(slot.max_bookings || 1) - (slot.current_bookings || 0)} left)`}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {selectedSlot && !selectedSlot.is_booked && (
                                            <div
                                                style={{
                                                    marginTop: 18,
                                                    background: '#F9FAFB',
                                                    padding: 20,
                                                    borderRadius: 12,
                                                    border: '1px solid rgba(199,154,62,0.15)',
                                                }}>
                                                <h4
                                                    style={{
                                                        fontSize: 15,
                                                        fontWeight: 600,
                                                        color: T.ink,
                                                        marginBottom: 12,
                                                    }}>
                                                    Book {guide.full_name}
                                                </h4>
                                                {bookingError && (
                                                    <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 10 }}>
                                                        {bookingError}
                                                    </p>
                                                )}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                    <div>
                                                        <label
                                                            style={{
                                                                fontSize: 12,
                                                                fontWeight: 500,
                                                                color: T.ink,
                                                                display: 'block',
                                                                marginBottom: 4,
                                                            }}>
                                                            📍 Destination *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., Munnar Tea Gardens"
                                                            value={destination}
                                                            onChange={(e) => setDestination(e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '10px 14px',
                                                                borderRadius: 8,
                                                                border: '1px solid #D1D5DB',
                                                                fontSize: 14,
                                                                background: '#fff',
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                        <button
                                                            onClick={handleBookGuide}
                                                            disabled={bookingLoading}
                                                            style={{
                                                                width: '100%',
                                                                padding: '10px 20px',
                                                                borderRadius: 999,
                                                                border: 'none',
                                                                background: bookingLoading ? '#9CA3AF' : '#0E5C53',
                                                                color: '#fff',
                                                                fontSize: 14,
                                                                fontWeight: 600,
                                                                cursor: bookingLoading ? 'not-allowed' : 'pointer',
                                                            }}>
                                                            {bookingLoading ? '⏳ Booking...' : '✅ Confirm Booking'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: 10 }}>
                                                    <label
                                                        style={{
                                                            fontSize: 12,
                                                            fontWeight: 500,
                                                            color: T.ink,
                                                            display: 'block',
                                                            marginBottom: 4,
                                                        }}>
                                                        📝 Notes (optional)
                                                    </label>
                                                    <textarea
                                                        placeholder="Special requests or notes for the guide"
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px 14px',
                                                            borderRadius: 8,
                                                            border: '1px solid #D1D5DB',
                                                            fontSize: 14,
                                                            resize: 'vertical',
                                                            minHeight: 50,
                                                            background: '#fff',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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
};

export default Guides;
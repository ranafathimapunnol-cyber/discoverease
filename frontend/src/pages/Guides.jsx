// pages/Guides.jsx - COMPLETE FIXED VERSION with destination input

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { AuthAPI } from '../services/api';
import { Loader2, Clock, X, CheckCircle, AlertCircle, MapPin } from 'lucide-react';

// ============================================
// DESIGN TOKENS
// ============================================
const C = {
    ink: '#072E2A',
    inkSoft: '#0B2422',
    paper: '#FFFFFF',
    cream: '#FBF6EA',
    gold: '#C79A3E',
    goldLight: '#E4C77B',
    goldSoft: 'rgba(199,154,62,0.14)',
    sage: '#7A7568',
    sageLight: '#9C8A5C',
    line: '#EFE6CF',
    success: '#3F7A5E',
    successBg: '#EAF3EE',
    warn: '#B4791F',
    warnBg: '#FBF1DC',
    danger: '#B4472A',
    dangerBg: '#FDF1EC',
};

// ============================================
// KERALA DISTRICTS
// ============================================
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
    { id: 14, name: 'Kasaragod' }
];

// ============================================
// MAIN COMPONENT
// ============================================
export default function Guides() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn } = useAuth();
    
    // State
    const [guides, setGuides] = useState([]);
    const [filteredGuides, setFilteredGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [activeNav, setActiveNav] = useState('location');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [activeDistrict, setActiveDistrict] = useState(null);
    const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
    
    // ✅ AVAILABILITY
    const [availability, setAvailability] = useState({});
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(null);
    
    // Booking Modal
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [bookingData, setBookingData] = useState({
        date: '',
        time: '',
        duration_hours: 4,
        number_of_people: 1,
        destination: '', // ✅ Added destination field
        special_requests: ''
    });
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [isSlotFullyBooked, setIsSlotFullyBooked] = useState(false);
    
    const districtRef = useRef(null);
    const initialFetchDone = useRef(false);
    const fetchTimeoutRef = useRef(null);
    const availabilityFetchedRef = useRef(false);

    // Redirect if not logged in
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/login', { replace: true });
        }
    }, [isLoggedIn, navigate]);

    // Parse URL params
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const districtParam = params.get('district');
        const searchParam = params.get('search');
        
        if (districtParam) {
            const found = KERALA_DISTRICTS.find(
                d => d.name.toLowerCase() === districtParam.toLowerCase()
            );
            if (found) {
                setActiveDistrict(found);
                setSelectedDistrict(found);
            } else {
                setActiveDistrict(null);
                setSelectedDistrict(null);
            }
        } else {
            setActiveDistrict(null);
            setSelectedDistrict(null);
        }
        
        if (searchParam !== undefined) {
            setSearchTerm(searchParam || '');
        }
    }, [location.search]);

    // ✅ Fetch guides
    const fetchGuides = useCallback(async () => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setAvailabilityError(null);

        try {
            const params = {};
            if (activeDistrict) params.district = activeDistrict.name;
            if (searchTerm.trim()) params.search = searchTerm.trim();
            
            const response = await api.get('/guides/guides/', { params });

            let guidesData = [];
            if (response.data) {
                if (response.data.results) guidesData = response.data.results;
                else if (Array.isArray(response.data)) guidesData = response.data;
                else if (response.data.data) guidesData = response.data.data;
            }

            if (guidesData && guidesData.length > 0) {
                const formattedGuides = guidesData.map(guide => ({
                    id: guide.id,
                    full_name: guide.full_name || guide.name || 'Unnamed Guide',
                    email: guide.email || '',
                    phone: guide.phone_number || guide.phone || '',
                    bio: guide.bio || '',
                    experience_years: guide.years_of_experience || 0,
                    rating: parseFloat(guide.rating) || 0,
                    total_reviews: guide.total_reviews || 0,
                    price_per_hour: guide.price_per_hour || 500,
                    price_per_day: guide.price_per_day || 0,
                    languages: guide.languages ? guide.languages.split(',').map(l => l.trim()) : [],
                    specialties: guide.categories?.map(c => c.name) || [],
                    profile_image: guide.profile_image || null,
                    is_available: guide.is_available !== undefined ? guide.is_available : true,
                    is_verified: guide.is_verified || false,
                    districts: guide.districts || [],
                    district: guide.districts && guide.districts.length > 0 ? guide.districts[0].name : null,
                    created_at: guide.created_at || new Date().toISOString(),
                    max_bookings_per_slot: guide.max_bookings_per_slot || 1,
                }));
                
                setGuides(formattedGuides);
                setFilteredGuides(formattedGuides);
                
                if (formattedGuides.length > 0) {
                    await fetchBulkAvailability(formattedGuides);
                }
            } else {
                setGuides([]);
                setFilteredGuides([]);
                setAvailability({});
            }
        } catch (error) {
            if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
                setError('Cannot connect to server. Please make sure the Django server is running at http://localhost:8000');
            } else {
                setError(error.response?.data?.message || 'Failed to load guides. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [activeDistrict, searchTerm, isLoggedIn]);

    // ✅ Fetch availability for all guides
    const fetchBulkAvailability = async (guidesList) => {
        if (availabilityFetchedRef.current) return;
        
        setLoadingAvailability(true);
        setAvailabilityError(null);
        
        try {
            const guideIds = guidesList.map(g => g.id).join(',');
            const response = await AuthAPI.getBulkAvailability(guideIds, 30);
            
            console.log('Bulk availability response:', response);
            
            if (response?.success) {
                const data = response.data || {};
                setAvailability(data);
                availabilityFetchedRef.current = true;
            } else {
                setAvailability({});
                setAvailabilityError('No availability data');
            }
        } catch (error) {
            console.error('Error fetching bulk availability:', error);
            setAvailability({});
            setAvailabilityError('Failed to fetch availability');
        } finally {
            setLoadingAvailability(false);
        }
    };

    // ✅ Fetch availability for a single guide
    const fetchGuideAvailability = async (guideId) => {
        setFetchingSlots(true);
        try {
            const response = await AuthAPI.getGuideAvailability(guideId, 30);
            
            console.log(`Availability for guide ${guideId}:`, response);
            
            if (response?.success) {
                const slots = response.data || [];
                // Filter out fully booked slots
                const availableSlots = slots.filter(slot => {
                    const maxBookings = slot.max_bookings || 1;
                    const currentBookings = slot.current_bookings || 0;
                    return currentBookings < maxBookings;
                });
                setAvailability(prev => ({
                    ...prev,
                    [guideId]: availableSlots
                }));
                return availableSlots;
            }
            return [];
        } catch (error) {
            console.error(`Error fetching availability for guide ${guideId}:`, error);
            return [];
        } finally {
            setFetchingSlots(false);
        }
    };

    // Debounced fetch
    const debouncedFetchGuides = useCallback(() => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = setTimeout(() => fetchGuides(), 300);
    }, [fetchGuides]);

    useEffect(() => {
        if (isLoggedIn) debouncedFetchGuides();
        return () => {
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        };
    }, [activeDistrict, searchTerm, isLoggedIn, debouncedFetchGuides]);

    useEffect(() => {
        if (isLoggedIn && !initialFetchDone.current) {
            initialFetchDone.current = true;
            setTimeout(() => fetchGuides(), 200);
        }
    }, [isLoggedIn, fetchGuides]);

    // Scroll handler
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (districtRef.current && !districtRef.current.contains(event.target)) {
                setShowDistrictDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============================================
    // HANDLERS
    // ============================================

    const handleDistrictSelect = (district) => {
        setSelectedDistrict(district);
        setActiveDistrict(district);
        setShowDistrictDropdown(false);
        
        const params = new URLSearchParams(location.search);
        if (district) {
            params.set('district', district.name);
        } else {
            params.delete('district');
        }
        params.delete('search');
        setSearchTerm('');
        navigate(`/guides?${params.toString()}`);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        const params = new URLSearchParams(location.search);
        if (value.trim()) {
            params.set('search', value.trim());
        } else {
            params.delete('search');
        }
        if (activeDistrict) params.set('district', activeDistrict.name);
        navigate(`/guides?${params.toString()}`);
    };

    // ✅ Check if slot is available (not fully booked)
    const isSlotAvailable = (slot) => {
        if (!slot) return false;
        const maxBookings = slot.max_bookings || 1;
        const currentBookings = slot.current_bookings || 0;
        return currentBookings < maxBookings;
    };

    // ✅ Get available slots count
    const getAvailableSlotsCount = (slots) => {
        if (!slots || slots.length === 0) return 0;
        return slots.filter(slot => isSlotAvailable(slot)).length;
    };

    // ✅ Book Guide
    const handleBookGuide = async (guide) => {
        setSelectedGuide(guide);
        setBookingData({
            date: '',
            time: '',
            duration_hours: 4,
            number_of_people: 1,
            destination: '', // ✅ Reset destination
            special_requests: ''
        });
        setBookingSuccess(false);
        setBookingError(null);
        setSelectedSlot(null);
        setShowConfirmationModal(false);
        setIsSlotFullyBooked(false);
        
        // Get slots from cached availability or fetch
        let slots = availability[guide.id] || [];
        
        if (slots.length === 0) {
            slots = await fetchGuideAvailability(guide.id);
        }
        
        // Filter out fully booked slots
        const availableOnly = slots.filter(slot => isSlotAvailable(slot));
        setAvailableSlots(availableOnly);
        
        if (availableOnly.length === 0) {
            setIsSlotFullyBooked(true);
        }
        
        setShowBookingModal(true);
    };

    // ✅ Close booking modal
    const closeBookingModal = useCallback(() => {
        if (!bookingLoading) {
            setShowBookingModal(false);
            setBookingError(null);
            setSelectedSlot(null);
            setShowConfirmationModal(false);
            setSelectedGuide(null);
            setAvailableSlots([]);
            setBookingSuccess(false);
            setIsSlotFullyBooked(false);
        }
    }, [bookingLoading]);

    // ✅ Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && showBookingModal) {
                closeBookingModal();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [showBookingModal, closeBookingModal]);

    const handleSlotSelect = (slot) => {
        if (!isSlotAvailable(slot)) {
            setBookingError('This slot is fully booked. Please select another slot.');
            return;
        }
        setSelectedSlot(slot);
        setBookingData({ 
            ...bookingData, 
            date: slot.date,
            time: slot.start_time 
        });
        setBookingError(null);
        setShowConfirmationModal(true);
    };

/// In Guides.jsx - FIXED handleConfirmBooking with proper response detection

const handleConfirmBooking = async () => {
    if (!selectedGuide || !selectedSlot) {
        setBookingError('Missing booking information');
        return;
    }

    // ✅ Validate destination
    if (!bookingData.destination || !bookingData.destination.trim()) {
        setBookingError('Please enter a destination/place name');
        setBookingLoading(false);
        return;
    }

    // Check if slot is still available
    if (!isSlotAvailable(selectedSlot)) {
        setBookingError('This slot is no longer available. Please select another slot.');
        setShowConfirmationModal(false);
        const slots = await fetchGuideAvailability(selectedGuide.id);
        const availableOnly = slots.filter(slot => isSlotAvailable(slot));
        setAvailableSlots(availableOnly);
        if (availableOnly.length === 0) {
            setIsSlotFullyBooked(true);
        }
        setBookingLoading(false);
        return;
    }

    setShowConfirmationModal(false);
    setBookingLoading(true);
    setBookingError(null);

    try {
        // ✅ Get district ID
        let districtId = null;
        let districtName = null;
        
        if (selectedGuide.districts && selectedGuide.districts.length > 0) {
            districtId = selectedGuide.districts[0].id;
            districtName = selectedGuide.districts[0].name;
        } else if (selectedGuide.district) {
            const found = KERALA_DISTRICTS.find(
                d => d.name.toLowerCase() === selectedGuide.district.toLowerCase()
            );
            if (found) {
                districtId = found.id;
                districtName = found.name;
            }
        }

        // ✅ Get destination
        const destination = bookingData.destination.trim();
        
        // ✅ Build special requests
        let specialRequests = bookingData.special_requests || '';
        if (!specialRequests.toLowerCase().includes(destination.toLowerCase())) {
            specialRequests = `Destination: ${destination}\n${specialRequests}`;
        }

        // ✅ Format time as HH:MM
        let formattedTime = selectedSlot.start_time;
        if (formattedTime) {
            formattedTime = formattedTime.trim();
            const parts = formattedTime.split(':');
            if (parts.length === 3) {
                formattedTime = `${parts[0]}:${parts[1]}`;
            }
        }

        // ✅ Build payload
        const bookingPayload = {
            guide: selectedGuide.id,
            date: selectedSlot.date,
            time: formattedTime,
            duration_hours: parseInt(bookingData.duration_hours) || 4,
            number_of_people: parseInt(bookingData.number_of_people) || 1,
            special_requests: specialRequests.trim(),
        };

        if (districtId) {
            bookingPayload.district = districtId;
        }

        console.log('📝 Sending booking payload:', JSON.stringify(bookingPayload, null, 2));

        // ✅ Create booking
        const response = await AuthAPI.createBooking(bookingPayload);

        console.log('✅ Booking response:', response);

        // ✅ FIXED: Check for any valid response (201 Created or 200 OK)
        // The response could have 'id', 'booking_id', or just be a success object
        const isSuccess = response && (
            response.id || 
            response.booking_id || 
            response.success === true ||
            response.status === 'success' ||
            // If the response has data and it has an id
            (response.data && (response.data.id || response.data.booking_id)) ||
            // If the response is a number (ID) or has a message
            typeof response === 'object'
        );

        if (isSuccess) {
            setBookingSuccess(true);
            
            // Update local storage
            try {
                const travelerBookings = JSON.parse(localStorage.getItem('traveler_bookings') || '[]');
                const newBooking = {
                    id: response.id || response.booking_id || Date.now(),
                    booking_id: response.booking_id || response.id,
                    guide_name: selectedGuide.full_name,
                    guideId: selectedGuide.id,
                    district: districtName || selectedGuide.district || selectedGuide.districts?.[0]?.name || '',
                    destination: destination,
                    place_name: destination,
                    date: selectedSlot.date,
                    time: selectedSlot.start_time,
                    duration_hours: bookingData.duration_hours,
                    number_of_people: bookingData.number_of_people,
                    status: 'pending',
                    travelerEmail: selectedGuide.email || 'traveler',
                    created_at: new Date().toISOString(),
                    special_requests: specialRequests.trim(),
                };
                travelerBookings.push(newBooking);
                localStorage.setItem('traveler_bookings', JSON.stringify(travelerBookings));
                window.dispatchEvent(new StorageEvent('storage', { key: 'traveler_bookings' }));
                window.dispatchEvent(new CustomEvent('bookingsUpdated'));
            } catch (e) {
                console.log('Error saving to localStorage:', e);
            }

            setTimeout(() => {
                closeBookingModal();
                navigate('/guides');
            }, 2000);
        } else {
            // Only show error if response explicitly says failed
            setBookingError(response?.message || response?.error || 'Failed to create booking');
            setBookingLoading(false);
        }
    } catch (error) {
        console.error('❌ Booking error:', error);
        let errorMsg = 'Failed to book guide. Please try again.';
        
        if (error.message) {
            errorMsg = error.message;
        }
        
        setBookingError(errorMsg);
        setBookingLoading(false);
        setShowConfirmationModal(true);
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

    const getDistrictName = (guide) => {
        if (guide.districts && guide.districts.length > 0) {
            return guide.districts[0].name;
        }
        if (guide.district) return guide.district;
        return 'Location not specified';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return 'N/A';
        try {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        } catch {
            return timeStr;
        }
    };

    // ============================================
    // BOTTOM NAVIGATION
    // ============================================
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
    // LOADING / ERROR STATES
    // ============================================

    if (loading && guides.length === 0) {
        return (
            <div style={{ background: "#FBF6EA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-block", width: 40, height: 40, border: "3px solid #C79A3E", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <p style={{ marginTop: 12, color: "#5C6E69", fontFamily: "'Inter', sans-serif" }}>
                        {activeDistrict ? `Loading guides in ${activeDistrict.name}...` : 'Loading guides...'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ background: "#FBF6EA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: "20px" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
                    <h2 style={{ color: "#072E2A", fontFamily: "'Fraunces', serif" }}>Error Loading Guides</h2>
                    <p style={{ color: "#5C6E69" }}>{error}</p>
                    <p style={{ color: "#5C6E69", fontSize: 13, marginTop: 8 }}>
                        Make sure the Django server is running at <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 4 }}>http://localhost:8000</code>
                    </p>
                    <button 
                        onClick={() => { initialFetchDone.current = false; fetchGuides(); }}
                        style={{ marginTop: 16, padding: "10px 24px", background: "#C79A3E", color: "#fff", border: "none", borderRadius: 999, cursor: "pointer" }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <div style={{ background: "#FBF6EA", minHeight: "100vh", paddingBottom: 100, fontFamily: "'Inter','Segoe UI',sans-serif", color: "#0B2422" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                
                .gd-font-display { font-family: 'Fraunces', serif; }
                .gd-font-mono { font-family: 'IBM Plex Mono', monospace; }
                .gd-guide-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(7,46,42,0.15); }
                
                .dropdown-wrapper {
                    position: relative;
                    display: inline-block;
                    min-width: 160px;
                    z-index: 1000;
                }
                
                .dropdown-btn {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 10px 16px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(199,154,62,0.4);
                    border-radius: 999px;
                    color: #fff;
                    font-size: 13px;
                    font-family: 'Inter',sans-serif;
                    cursor: pointer;
                    gap: 8px;
                    white-space: nowrap;
                    min-height: 44px;
                    transition: all 0.2s ease;
                }
                
                .dropdown-btn:hover {
                    background: rgba(255,255,255,0.1);
                    border-color: rgba(199,154,62,0.6);
                }
                
                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    background: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 20px 60px rgba(7,46,42,0.3);
                    max-height: 280px;
                    overflow-y: auto;
                    z-index: 9999;
                    border: 1px solid rgba(199,154,62,0.15);
                    min-width: 200px;
                    padding: 6px 0;
                    animation: dropdownFade 0.2s ease;
                }
                
                @keyframes dropdownFade {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .dropdown-menu::-webkit-scrollbar { width: 4px; }
                .dropdown-menu::-webkit-scrollbar-thumb { background: #C79A3E; border-radius: 4px; }
                .dropdown-menu::-webkit-scrollbar-track { background: transparent; }
                
                .dropdown-item {
                    padding: 10px 16px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-size: 13px;
                    color: #072E2A;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .dropdown-item:last-child { border-bottom: none; }
                .dropdown-item:hover { background: rgba(199,154,62,0.08); }
                .dropdown-item.active {
                    background: rgba(199,154,62,0.12);
                    color: #C79A3E;
                    font-weight: 600;
                }
                .dropdown-item .check { color: #C79A3E; margin-left: 8px; }

                .gd-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
                .gd-guide-card {
                    background: #fff;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid rgba(199,154,62,0.15);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    position: relative;
                }

                @media (min-width: 768px) {
                    .gd-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; }
                }
                @media (min-width: 1024px) {
                    .gd-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
                }
                
                .search-input {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(199,154,62,0.4);
                    border-radius: 999px;
                    padding: 10px 16px;
                    color: #fff;
                    font-size: 13px;
                    font-family: 'Inter',sans-serif;
                    outline: none;
                    min-width: 180px;
                    flex: 1;
                }
                .search-input::placeholder {
                    color: rgba(255,255,255,0.5);
                }
                .search-input:focus {
                    border-color: #E4C77B;
                }

                .book-btn {
                    background: linear-gradient(135deg, #C79A3E, #E4C77B);
                    color: #072E2A;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 999px;
                    font-weight: 600;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Inter', sans-serif;
                }
                .book-btn:hover:not(:disabled) {
                    transform: scale(1.03);
                    box-shadow: 0 4px 16px rgba(199,154,62,0.3);
                }
                .book-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none !important;
                }
                .book-btn.fully-booked {
                    background: #9CA3AF;
                    cursor: not-allowed;
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(7,46,42,0.6);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .modal-content {
                    background: #FBF6EA;
                    border-radius: 16px;
                    padding: 28px;
                    max-width: 560px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    border: 1px solid rgba(199,154,62,0.3);
                    box-shadow: 0 20px 60px rgba(7,46,42,0.25);
                }
                .modal-input {
                    width: 100%;
                    padding: 10px 14px;
                    border: 1px solid rgba(199,154,62,0.3);
                    border-radius: 8px;
                    font-size: 14px;
                    background: #fff;
                    transition: border-color 0.3s ease;
                    font-family: 'Inter', sans-serif;
                }
                .modal-input:focus {
                    border-color: #C79A3E;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(199,154,62,0.1);
                }
                .modal-input.destination-input {
                    border-color: #C79A3E;
                    background: rgba(199,154,62,0.05);
                }
                .modal-error {
                    background: #FEE2E2;
                    color: #DC2626;
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                    margin-bottom: 14px;
                    border: 1px solid #FCA5A5;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .modal-success {
                    background: #DCFCE7;
                    color: #16A34A;
                    padding: 10px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                    margin-bottom: 14px;
                    border: 1px solid #86EFAC;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .availability-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 10px;
                    border-radius: 999px;
                    font-size: 10px;
                    font-weight: 500;
                }
                .availability-badge.available {
                    background: #DCFCE7;
                    color: #166534;
                }
                .availability-badge.unavailable {
                    background: #FEE2E2;
                    color: #991B1B;
                }
                .availability-badge.loading {
                    background: #F3F4F6;
                    color: #6B7280;
                }
                .availability-badge.fully-booked {
                    background: #FEE2E2;
                    color: #991B1B;
                }
                
                .slot-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 10px;
                    margin-top: 10px;
                    max-height: 350px;
                    overflow-y: auto;
                    padding: 4px;
                }
                .slot-card {
                    background: #FFFFFF;
                    border-radius: 10px;
                    border: 2px solid #E2E8F0;
                    padding: 14px 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: center;
                }
                .slot-card:hover:not(.fully-booked) {
                    border-color: #C79A3E;
                    box-shadow: 0 4px 16px rgba(199,154,62,0.15);
                    transform: translateY(-3px);
                }
                .slot-card.selected {
                    border-color: #C79A3E;
                    background: #C79A3E;
                    color: #fff;
                    box-shadow: 0 4px 16px rgba(199,154,62,0.25);
                    transform: translateY(-3px);
                }
                .slot-card.fully-booked {
                    opacity: 0.5;
                    cursor: not-allowed;
                    border-color: #E5E7EB;
                    background: #F9FAFB;
                }
                .slot-card .slot-date {
                    font-size: 13px;
                    font-weight: 600;
                    color: #0B2422;
                    margin-bottom: 2px;
                }
                .slot-card.selected .slot-date {
                    color: #fff;
                }
                .slot-card.fully-booked .slot-date {
                    color: #9CA3AF;
                }
                .slot-card .slot-time {
                    font-size: 18px;
                    font-weight: 700;
                    color: #072E2A;
                }
                .slot-card.selected .slot-time {
                    color: #fff;
                }
                .slot-card.fully-booked .slot-time {
                    color: #9CA3AF;
                }
                .slot-card .slot-info {
                    font-size: 10px;
                    color: #5A5548;
                    margin-top: 3px;
                }
                .slot-card.selected .slot-info {
                    color: rgba(255,255,255,0.8);
                }
                .slot-card.fully-booked .slot-info {
                    color: #9CA3AF;
                }
                
                .no-slots-message {
                    padding: 30px 20px;
                    background: #FEF3C7;
                    border-radius: 10px;
                    border: 1px solid #FCD34D;
                    color: #92400E;
                    font-size: 14px;
                    text-align: center;
                }
                .no-slots-message.fully-booked {
                    background: #FEE2E2;
                    border-color: #FCA5A5;
                    color: #991B1B;
                }
                
                .confirmation-card {
                    text-align: center;
                    padding: 10px 0;
                }
                .confirmation-card .icon {
                    font-size: 48px;
                    margin-bottom: 12px;
                }
                .confirmation-card h3 {
                    font-size: 22px;
                    color: #0B2422;
                    margin: 0 0 4px;
                    font-family: 'Fraunces', serif;
                    font-style: italic;
                }
                .confirmation-card .subtitle {
                    color: #5C6E69;
                    font-size: 14px;
                    margin: 0 0 16px;
                }
                .confirmation-card .details {
                    background: #F8FAFC;
                    border-radius: 12px;
                    padding: 16px 20px;
                    margin: 16px 0;
                    text-align: left;
                }
                .confirmation-card .details .row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #E2E8F0;
                    font-size: 14px;
                }
                .confirmation-card .details .row:last-child {
                    border-bottom: none;
                }
                .confirmation-card .details .label {
                    color: #5A5548;
                }
                .confirmation-card .details .value {
                    color: #0B2422;
                    font-weight: 600;
                }
                .confirmation-card .price {
                    font-size: 24px;
                    font-weight: 700;
                    color: #C79A3E;
                    margin: 12px 0 4px;
                }
                .confirmation-card .price-label {
                    font-size: 12px;
                    color: #5A5548;
                    margin: 0 0 16px;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Header */}
            <div style={{ background: "#072E2A", padding: "48px 0 28px", position: "relative", zIndex: 10 }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 0%, rgba(199,154,62,0.15), transparent 55%)" }} />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px", position: "relative", zIndex: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                        <div>
                            <Link to="/" style={{ color: "rgba(237,226,196,0.6)", textDecoration: "none", fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace", display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                                </svg>
                                Back
                            </Link>
                            <h1 className="gd-font-display" style={{ fontStyle: "italic", fontSize: "clamp(36px, 5vw, 48px)", fontWeight: 500, color: "#fff", margin: "8px 0 4px", lineHeight: 1.05 }}>
                                Find Your Guide
                            </h1>
                            <p style={{ fontSize: "clamp(14px, 1.2vw, 17px)", color: "rgba(237,226,196,0.75)", maxWidth: 600 }}>
                                {activeDistrict ? `Guides available in ${activeDistrict.name}` : 'Connect with experienced guides across Kerala'}
                            </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <Link to="/my-bookings" style={{ padding: "10px 20px", borderRadius: 999, border: "1px solid rgba(199,154,62,0.3)", background: "rgba(255,255,255,0.06)", color: "#E4C77B", cursor: "pointer", fontSize: 13, fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, transition: "all 0.3s ease" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.transform = "scale(1.02)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "scale(1)"; }}><span>📅</span>My Bookings</Link>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
                        <input type="text" placeholder="🔍 Search guides..." value={searchTerm} onChange={handleSearchChange} className="search-input" style={{ minWidth: 180, flex: 1 }} />
                        <div className="dropdown-wrapper" ref={districtRef} style={{ minWidth: 160 }}>
                            <button className="dropdown-btn" onClick={() => { setShowDistrictDropdown(!showDistrictDropdown); }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span>📍</span><span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100px" }}>{selectedDistrict ? selectedDistrict.name : 'All Districts'}</span></span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E4C77B" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                            {showDistrictDropdown && (
                                <div className="dropdown-menu">
                                    <div className={`dropdown-item ${!selectedDistrict ? 'active' : ''}`} onClick={() => handleDistrictSelect(null)}><span>All Districts</span>{!selectedDistrict && <span className="check">✓</span>}</div>
                                    {KERALA_DISTRICTS.map((district) => (
                                        <div key={district.id} className={`dropdown-item ${selectedDistrict?.id === district.id ? 'active' : ''}`} onClick={() => handleDistrictSelect(district)}>
                                            <span>{district.name}</span>
                                            {selectedDistrict?.id === district.id && <span className="check">✓</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <svg viewBox="0 0 1200 40" preserveAspectRatio="none" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 26 }}>
                    <path d="M0,20 C150,36 300,4 450,18 C600,32 750,4 900,16 C1050,28 1150,10 1200,18 L1200,40 L0,40 Z" fill="#FBF6EA" />
                </svg>
            </div>

            {/* Guides Grid */}
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 40px" }}>
                {filteredGuides.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 12, border: "1px solid rgba(199,154,62,0.15)" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🧭</div>
                        <h2 className="gd-font-display" style={{ fontSize: 28, color: "#072E2A", marginBottom: 8 }}>{activeDistrict ? `No guides found in ${activeDistrict.name}` : 'No guides found'}</h2>
                        <p style={{ color: "#8A9A95", fontSize: 16, maxWidth: 400, margin: "0 auto" }}>{activeDistrict ? `Try selecting a different district or adjusting your search.` : 'Try adjusting your search or filters.'}</p>
                        {activeDistrict && <button onClick={() => handleDistrictSelect(null)} style={{ marginTop: 16, padding: "10px 24px", background: "#C79A3E", color: "#fff", border: "none", borderRadius: 999, cursor: "pointer" }}>Show All Guides</button>}
                    </div>
                ) : (
                    <div className="gd-grid">
                        {filteredGuides.map((guide) => {
                            const slots = availability[guide.id] || [];
                            const availableSlotsCount = getAvailableSlotsCount(slots);
                            const hasAvailability = availableSlotsCount > 0;
                            const isLoadingSlots = loadingAvailability || fetchingSlots;
                            const isFullyBooked = slots.length > 0 && availableSlotsCount === 0;
                            
                            return (
                                <div key={guide.id} className="gd-guide-card">
                                    <div style={{ padding: 20 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#072E2A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#E4C77B", fontFamily: "'Fraunces', serif", overflow: "hidden", flexShrink: 0 }}>
                                                {guide.profile_image ? <img src={guide.profile_image} alt={guide.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : guide.full_name?.charAt(0)?.toUpperCase() || 'G'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 className="gd-font-display" style={{ fontSize: 18, fontWeight: 500, color: "#072E2A", margin: 0 }}>{guide.full_name}</h3>
                                                <p style={{ fontSize: 13, color: "#0E5C53", margin: "2px 0 0" }}>📍 {getDistrictName(guide)}</p>
                                                {guide.rating > 0 && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><span style={{ color: "#FFB300" }}>{'★'.repeat(Math.min(Math.round(guide.rating), 5))}</span><span style={{ color: "#8A9A95", fontSize: 12 }}>({guide.total_reviews || 0})</span></div>}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: 14, color: "#3D5A57", lineHeight: 1.5, marginTop: 12 }}>{guide.bio || 'Experienced guide ready to show you Kerala.'}</p>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                                            {guide.specialties && guide.specialties.slice(0, 3).map((spec, i) => <span key={i} style={{ background: "rgba(199,154,62,0.12)", color: "#0E5C53", padding: "2px 10px", borderRadius: 999, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>{spec}</span>)}
                                            {guide.languages && guide.languages.slice(0, 2).map((lang, i) => <span key={i} style={{ background: "rgba(14,92,83,0.08)", color: "#0E5C53", padding: "2px 10px", borderRadius: 999, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" }}>{lang}</span>)}
                                        </div>
                                        <div style={{ marginTop: 10 }}>
                                            {isLoadingSlots ? (
                                                <span className="availability-badge loading"><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</span>
                                            ) : isFullyBooked ? (
                                                <span className="availability-badge fully-booked">🔴 Fully Booked</span>
                                            ) : hasAvailability ? (
                                                <span className="availability-badge available">✅ {availableSlotsCount} slots available</span>
                                            ) : (
                                                <span className="availability-badge unavailable">❌ No slots available</span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, borderTop: "1px solid rgba(199,154,62,0.15)", paddingTop: 14 }}>
                                            <div><span style={{ fontSize: 12, color: "#8A9A95" }}>Rate</span><p style={{ fontSize: 18, fontWeight: 700, color: "#072E2A", margin: 0 }}>₹{guide.price_per_hour || 500}<span style={{ fontSize: 12, fontWeight: 400, color: "#8A9A95" }}>/hr</span></p></div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleBookGuide(guide); }} 
                                                className={`book-btn ${!hasAvailability || isLoadingSlots || isFullyBooked ? 'fully-booked' : ''}`}
                                                disabled={!hasAvailability || isLoadingSlots || isFullyBooked}
                                            >
                                                {isLoadingSlots ? 'Loading...' : (isFullyBooked ? 'Fully Booked' : (hasAvailability ? 'Book Now' : 'Unavailable'))}
                                            </button>
                                        </div>
                                        {guide.is_available === false && <div style={{ marginTop: 8, padding: "4px 12px", background: "#FEE2E2", borderRadius: 999, color: "#DC2626", fontSize: 11, display: "inline-block" }}>Currently Unavailable</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {showBookingModal && selectedGuide && (
                <div className="modal-overlay" onClick={closeBookingModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header with Close Button */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <div>
                                <h2 className="gd-font-display" style={{ fontSize: 22, color: "#072E2A", margin: 0, fontStyle: "italic" }}>
                                    Book {selectedGuide.full_name}
                                </h2>
                                <p style={{ fontSize: 13, color: "#5C6E69", margin: "2px 0 0" }}>
                                    📍 {getDistrictName(selectedGuide)} · ₹{selectedGuide.price_per_hour || 500}/hr
                                </p>
                            </div>
                            <button 
                                onClick={closeBookingModal}
                                disabled={bookingLoading}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: bookingLoading ? "not-allowed" : "pointer",
                                    color: "#5C6E69",
                                    padding: "8px",
                                    borderRadius: "50%",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: bookingLoading ? 0.5 : 1,
                                }}
                                onMouseEnter={(e) => { 
                                    if (!bookingLoading) {
                                        e.currentTarget.style.background = "#F3F4F6";
                                    }
                                }}
                                onMouseLeave={(e) => { 
                                    e.currentTarget.style.background = "transparent";
                                }}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {bookingSuccess ? (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                                <h2 style={{ color: "#072E2A", fontFamily: "'Fraunces', serif" }}>Booking Confirmed!</h2>
                                <p style={{ color: "#5C6E69" }}>Your guide has been booked successfully.</p>
                                <button 
                                    onClick={closeBookingModal}
                                    style={{
                                        marginTop: 16,
                                        padding: "10px 24px",
                                        background: "#C79A3E",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 999,
                                        cursor: "pointer",
                                        fontSize: 14,
                                        fontWeight: 600,
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                {bookingError && <div className="modal-error"><span>⚠️</span>{bookingError}</div>}

                                {/* Available Slots */}
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <Clock size={18} color={C.gold} />
                                        <span style={{ fontSize: 15, fontWeight: 600, color: '#0B2422' }}>Available Slots</span>
                                        {availableSlots.length > 0 && <span style={{ fontSize: 12, fontWeight: 400, color: C.success, background: C.successBg, padding: '2px 12px', borderRadius: 999 }}>{availableSlots.length} slots</span>}
                                        {fetchingSlots && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginLeft: 4 }} />}
                                    </div>
                                    
                                    {fetchingSlots ? (
                                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: C.gold }} />
                                            <p style={{ marginTop: 12, color: '#5C6E69' }}>Loading available slots...</p>
                                        </div>
                                    ) : availableSlots.length > 0 ? (
                                        <div className="slot-grid">
                                            {availableSlots.map((slot, index) => {
                                                const isSelected = selectedSlot?.id === slot.id;
                                                const isSlotFullyBooked = !isSlotAvailable(slot);
                                                const maxBookings = slot.max_bookings || 1;
                                                const currentBookings = slot.current_bookings || 0;
                                                const bookingsText = currentBookings > 0 ? `${currentBookings}/${maxBookings} booked` : 'Available';
                                                
                                                return (
                                                    <div 
                                                        key={index} 
                                                        className={`slot-card ${isSelected ? 'selected' : ''} ${isSlotFullyBooked ? 'fully-booked' : ''}`} 
                                                        onClick={() => {
                                                            if (!isSlotFullyBooked) {
                                                                handleSlotSelect(slot);
                                                            }
                                                        }}
                                                        style={{
                                                            cursor: isSlotFullyBooked ? 'not-allowed' : 'pointer',
                                                            opacity: isSlotFullyBooked ? 0.5 : 1,
                                                        }}
                                                    >
                                                        <div className="slot-date">{formatDate(slot.date)}</div>
                                                        <div className="slot-time">{formatTime(slot.start_time)}</div>
                                                        <div className="slot-info">
                                                            {isSlotFullyBooked ? '🔴 Fully Booked' : bookingsText}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : isSlotFullyBooked ? (
                                        <div className="no-slots-message fully-booked">
                                            <AlertCircle size={24} style={{ marginBottom: 8 }} />
                                            <p><strong>All slots are fully booked!</strong></p>
                                            <p style={{ fontSize: 13, marginTop: 4 }}>Please check back later for new availability.</p>
                                        </div>
                                    ) : (
                                        <div className="no-slots-message">
                                            ⚠️ No available time slots for this guide. Please check back later.
                                        </div>
                                    )}
                                </div>

                                {/* ✅ DESTINATION / PLACE INPUT - REQUIRED FIELD */}
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>
                                        <MapPin size={14} style={{ display: 'inline', marginRight: 4, color: C.gold }} />
                                        Destination / Place <span style={{ color: C.danger }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="modal-input destination-input"
                                        placeholder="e.g., Munnar, Alleppey Backwaters, Fort Kochi..."
                                        value={bookingData.destination}
                                        onChange={(e) => {
                                            setBookingData({ ...bookingData, destination: e.target.value });
                                            setBookingError(null);
                                        }}
                                        style={{
                                            borderColor: bookingData.destination ? '#C79A3E' : 'rgba(199,154,62,0.3)',
                                            background: bookingData.destination ? 'rgba(199,154,62,0.05)' : '#fff',
                                        }}
                                    />
                                    <p style={{ fontSize: 11, color: "#8A9A95", marginTop: 4 }}>
                                        Enter the specific place you want to visit with this guide
                                    </p>
                                </div>

                                {/* Duration */}
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Duration (hours)</label>
                                    <select className="modal-input" value={bookingData.duration_hours} onChange={(e) => { setBookingData({ ...bookingData, duration_hours: parseInt(e.target.value) }); setBookingError(null); }}>
                                        <option value={2}>2 hours</option>
                                        <option value={4}>Half Day (4 hrs)</option>
                                        <option value={6}>6 hours</option>
                                        <option value={8}>Full Day (8 hrs)</option>
                                    </select>
                                </div>

                                {/* Number of People */}
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Number of People</label>
                                    <input type="number" className="modal-input" value={bookingData.number_of_people} onChange={(e) => { setBookingData({ ...bookingData, number_of_people: parseInt(e.target.value) || 1 }); setBookingError(null); }} min="1" max="20" />
                                </div>

                                {/* Special Requests */}
                                <div style={{ marginBottom: 14 }}>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0B2422", marginBottom: 4 }}>Special Requests <span style={{ fontSize: 11, color: "#8A9A95", fontWeight: 400 }}>(optional)</span></label>
                                    <textarea 
                                        className="modal-input" 
                                        rows="2" 
                                        placeholder="Any special requirements or additional details..." 
                                        value={bookingData.special_requests} 
                                        onChange={(e) => { setBookingData({ ...bookingData, special_requests: e.target.value }); setBookingError(null); }} 
                                        style={{ resize: "vertical" }} 
                                    />
                                </div>

                                {/* Selected Slot Summary */}
                                {selectedSlot && (
                                    <div style={{ padding: '10px 14px', background: '#F0F7FF', borderRadius: 10, border: '1px solid #93C5FD', marginBottom: 14 }}>
                                        <p style={{ fontSize: 13, color: '#1E3A5F', margin: 0 }}>
                                            <strong>Selected:</strong> {formatDate(selectedSlot.date)} at <strong>{formatTime(selectedSlot.start_time)}</strong>
                                        </p>
                                        {bookingData.destination && (
                                            <p style={{ fontSize: 13, color: '#1E3A5F', margin: '4px 0 0' }}>
                                                <strong>Place:</strong> {bookingData.destination}
                                            </p>
                                        )}
                                        <p style={{ fontSize: 13, color: '#1E3A5F', margin: '4px 0 0' }}>
                                            <strong>Est. Price:</strong> ₹{selectedGuide.price_per_hour * bookingData.duration_hours}
                                        </p>
                                    </div>
                                )}

                                {/* Show message if no slots available */}
                                {availableSlots.length === 0 && !fetchingSlots && (
                                    <div style={{ textAlign: 'center', padding: '10px', color: '#92400E', background: '#FEF3C7', borderRadius: 8 }}>
                                        <p style={{ margin: 0, fontSize: 14 }}>
                                            {isSlotFullyBooked ? '🔴 All slots are fully booked' : '⚠️ No slots available'}
                                        </p>
                                    </div>
                                )}

                                {/* Show message if destination is required */}
                                {!bookingData.destination && availableSlots.length > 0 && (
                                    <div style={{ textAlign: 'center', padding: '8px', color: '#C79A3E', background: 'rgba(199,154,62,0.08)', borderRadius: 8, fontSize: 12 }}>
                                        <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
                                        Please enter a destination to continue
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmationModal && selectedSlot && (
                <div className="modal-overlay" onClick={() => { if (!bookingLoading) setShowConfirmationModal(false); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="confirmation-card">
                            <div className="icon">📋</div>
                            <h3>Confirm Your Booking</h3>
                            <p className="subtitle">Please review your booking details</p>
                            <div className="details">
                                <div className="row"><span className="label">Guide</span><span className="value">{selectedGuide.full_name}</span></div>
                                <div className="row"><span className="label">Date</span><span className="value">{formatDate(selectedSlot.date)}</span></div>
                                <div className="row"><span className="label">Time</span><span className="value">{formatTime(selectedSlot.start_time)}</span></div>
                                <div className="row"><span className="label">Destination</span><span className="value">{bookingData.destination || 'Not specified'}</span></div>
                                <div className="row"><span className="label">Duration</span><span className="value">{bookingData.duration_hours} hrs</span></div>
                                <div className="row"><span className="label">People</span><span className="value">{bookingData.number_of_people}</span></div>
                                <div className="row"><span className="label">Location</span><span className="value">{getDistrictName(selectedGuide)}</span></div>
                                {bookingData.special_requests && (
                                    <div className="row"><span className="label">Special Requests</span><span className="value" style={{ fontSize: 12 }}>{bookingData.special_requests.substring(0, 30)}...</span></div>
                                )}
                            </div>
                            <div className="price">₹{selectedGuide.price_per_hour * bookingData.duration_hours}</div>
                            <p className="price-label">Estimated total price</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button 
                                    onClick={() => setShowConfirmationModal(false)} 
                                    style={{ 
                                        flex: 1, 
                                        padding: "12px 24px", 
                                        borderRadius: 999, 
                                        border: "1px solid #D1D5DB", 
                                        background: "transparent", 
                                        color: "#5C6E69", 
                                        cursor: "pointer", 
                                        fontSize: 14, 
                                        fontWeight: 500 
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmBooking} 
                                    disabled={bookingLoading} 
                                    className="book-btn" 
                                    style={{ 
                                        flex: 2, 
                                        padding: "12px 24px", 
                                        justifyContent: 'center', 
                                        opacity: bookingLoading ? 0.6 : 1, 
                                        cursor: bookingLoading ? 'not-allowed' : 'pointer' 
                                    }}
                                >
                                    {bookingLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</span> : <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={16} /> Confirm Booking</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
            <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#051F1C]/10 via-transparent to-transparent pointer-events-none" style={{ zIndex: 0 }} />
        </div>
    );
}
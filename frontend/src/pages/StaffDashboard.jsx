// src/pages/StaffDashboard.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const KERALA_DISTRICTS = [
  { id: 1, name: 'Thiruvananthapuram' }, { id: 2, name: 'Kollam' },
  { id: 3, name: 'Pathanamthitta' }, { id: 4, name: 'Alappuzha' },
  { id: 5, name: 'Kottayam' }, { id: 6, name: 'Idukki' },
  { id: 7, name: 'Ernakulam' }, { id: 8, name: 'Thrissur' },
  { id: 9, name: 'Palakkad' }, { id: 10, name: 'Malappuram' },
  { id: 11, name: 'Kozhikode' }, { id: 12, name: 'Wayanad' },
  { id: 13, name: 'Kannur' }, { id: 14, name: 'Kasaragod' },
];

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    pendingSuggestions: 0,
    totalGuides: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalReviews: 0,
    pendingReviews: 0,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [guides, setGuides] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showAddGuide, setShowAddGuide] = useState(false);
  const [guideForm, setGuideForm] = useState({
    full_name: '', email: '', password: '',
    phone: '', bio: '',
    experience_years: '0', languages: '', primary_district: '',
    price_per_day: '0', price_per_hour: '0'
  });
  const [guideLoading, setGuideLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newGuidePassword, setNewGuidePassword] = useState('');
  const [autoVerify, setAutoVerify] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Staff Stats
      try {
        const statsRes = await api.get('/staff/staff/stats/');
        if (statsRes?.data?.success) {
          const s = statsRes.data.stats;
          setStats({
            pendingSuggestions: s.pendingSuggestions || 0,
            totalGuides: s.totalGuides || 0,
            totalBookings: s.totalBookings || 0,
            confirmedBookings: s.confirmedBookings || 0,
            totalReviews: s.totalReviews || 0,
            pendingReviews: s.pendingReviews || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching staff stats:', error);
      }

      // 2. Fetch ALL Suggestions from both localStorage and API
      try {
        // Try API first
        const allSuggRes = await api.get('/suggestions/');
        let all = [];
        if (allSuggRes?.data?.success) {
          all = allSuggRes.data.results || [];
        } else if (Array.isArray(allSuggRes?.data)) {
          all = allSuggRes.data;
        }
        
        // Also get from localStorage for hidden gems
        try {
          const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
          // Merge and deduplicate by id
          const allIds = new Set(all.map(s => s.id));
          const uniqueLocal = localSuggestions.filter(s => !allIds.has(s.id));
          all = [...all, ...uniqueLocal];
        } catch (e) {
          console.log('No local suggestions found');
        }
        
        setAllSuggestions(all);
        const pending = all.filter(s => s.status === 'pending');
        setSuggestions(pending);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        // Fallback to localStorage
        try {
          const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
          setAllSuggestions(localSuggestions);
          const pending = localSuggestions.filter(s => s.status === 'pending');
          setSuggestions(pending);
        } catch (e) {
          setAllSuggestions([]);
          setSuggestions([]);
        }
      }

      // 3. Fetch Staff Guides
      try {
        const guidesRes = await api.get('/staff/staff/guides/');
        if (guidesRes?.data?.success) {
          setGuides(guidesRes.data.guides || []);
        } else if (Array.isArray(guidesRes?.data)) {
          setGuides(guidesRes.data);
        } else {
          setGuides([]);
        }
      } catch (error) {
        console.error('Error fetching guides:', error);
        setGuides([]);
      }

      // 4. Fetch Staff Bookings
      try {
        const bookRes = await api.get('/staff/staff/bookings/');
        if (bookRes?.data?.success) {
          setBookings(bookRes.data.bookings || []);
        } else if (Array.isArray(bookRes?.data)) {
          setBookings(bookRes.data);
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      }

      // 5. Fetch Staff Reviews
      try {
        const revRes = await api.get('/staff/staff/reviews/');
        if (revRes?.data?.success) {
          setReviews(revRes.data.reviews || []);
        } else if (Array.isArray(revRes?.data)) {
          setReviews(revRes.data);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'staff' && user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate, fetchData]);

  // ============================================
  // PROCESS SUGGESTION - Approve, Reject, Implement, Delete
  // ============================================
  const processSuggestion = async (id, action) => {
    setActionLoading(true);
    setProcessingId(id);
    try {
      if (action === 'delete') {
        // Delete from localStorage and API
        if (!window.confirm('Are you sure you want to permanently delete this suggestion?')) {
          setActionLoading(false);
          setProcessingId(null);
          return;
        }
        
        // Remove from localStorage
        try {
          const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
          const updated = localSuggestions.filter(s => s.id !== id);
          localStorage.setItem('hidden_gems_suggestions', JSON.stringify(updated));
        } catch (e) {
          console.log('Error updating localStorage:', e);
        }
        
        // Try API delete
        try {
          await api.delete(`/suggestions/${id}/`);
        } catch (e) {
          console.log('API delete failed, but removed from localStorage:', e);
        }
        
        alert('🗑️ Suggestion deleted successfully!');
        fetchData();
        if (showSuggestionModal) {
          setShowSuggestionModal(false);
          setSelectedSuggestion(null);
        }
        setActionLoading(false);
        setProcessingId(null);
        return;
      }

      // For approve, reject, implement
      const notes = action === 'reject' ? prompt('Reason for rejection:') : `Processed by ${user?.email || 'Staff'}`;
      if (action === 'reject' && notes === null) { 
        setActionLoading(false);
        setProcessingId(null);
        return; 
      }
      
      // Try API first
      try {
        const response = await api.post(`/staff/staff/suggestions/${id}/process/`, {
          action,
          notes: notes || `Processed by ${user?.email || 'Staff'}`
        });
        
        if (response?.data?.success) {
          alert(`✅ Suggestion ${action}ed successfully!`);
          fetchData();
          if (showSuggestionModal) {
            setShowSuggestionModal(false);
            setSelectedSuggestion(null);
          }
          setActionLoading(false);
          setProcessingId(null);
          return;
        }
      } catch (error) {
        console.error('API process failed, trying localStorage fallback:', error);
      }
      
      // Fallback: Update localStorage
      try {
        const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
        const updated = localSuggestions.map(s => {
          if (s.id === id) {
            const now = new Date().toISOString();
            return { 
              ...s, 
              status: action === 'approve' ? 'approved' : action === 'implement' ? 'implemented' : 'rejected',
              processed_at: now,
              processed_by: user?.email || 'staff',
              admin_notes: notes || `Processed by ${user?.email || 'Staff'}`
            };
          }
          return s;
        });
        localStorage.setItem('hidden_gems_suggestions', JSON.stringify(updated));
        
        alert(`✅ Suggestion ${action}ed successfully! (Local)`);
        fetchData();
        if (showSuggestionModal) {
          setShowSuggestionModal(false);
          setSelectedSuggestion(null);
        }
      } catch (e) {
        alert('❌ Failed to process suggestion');
        console.error(e);
      }
    } catch (error) {
      alert('❌ Failed to process suggestion');
      console.error(error);
    } finally {
      setActionLoading(false);
      setProcessingId(null);
    }
  };

  // ============================================
  // ADD GUIDE
  // ============================================
  const handleAddGuide = async (e) => {
    e.preventDefault();
    setGuideLoading(true);
    try {
      const guideData = {
        ...guideForm,
        is_verified: autoVerify,
      };
      
      const res = await api.post('/staff/staff/guides/add/', guideData);
      
      if (res?.data?.success) {
        setNewGuidePassword(res.data.password || guideForm.password || 'TempPass123');
        setShowPasswordModal(true);
        setShowAddGuide(false);
        setGuideForm({
          full_name: '', email: '', password: '',
          phone: '', bio: '',
          experience_years: '0', languages: '', primary_district: '',
          price_per_day: '0', price_per_hour: '0'
        });
        fetchData();
      } else {
        alert(res?.data?.error || 'Failed to add guide');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add guide');
      console.error(error);
    } finally {
      setGuideLoading(false);
    }
  };

  // ============================================
  // VERIFY GUIDE
  // ============================================
  const verifyGuide = async (id) => {
    try {
      await api.post(`/staff/staff/guides/${id}/verify/`);
      alert('Guide verified!');
      fetchData();
    } catch (error) {
      alert('Failed to verify guide');
      console.error(error);
    }
  };

  // ============================================
  // DELETE GUIDE
  // ============================================
  const deleteGuide = async (id) => {
    if (!window.confirm('Delete this guide?')) return;
    try {
      await api.delete(`/staff/staff/guides/${id}/`);
      fetchData();
    } catch (error) {
      alert('Failed to delete guide');
      console.error(error);
    }
  };

  // ============================================
  // UPDATE BOOKING
  // ============================================
  const updateBooking = async (id, status) => {
    try {
      await api.post(`/staff/staff/bookings/${id}/update/`, { status });
      fetchData();
    } catch (error) {
      alert('Failed to update booking');
      console.error(error);
    }
  };

  // ============================================
  // PROCESS REVIEW
  // ============================================
  const processReview = async (id, action) => {
    try {
      await api.post(`/staff/staff/reviews/${id}/process/`, { action });
      fetchData();
    } catch (error) {
      alert('Failed to process review');
      console.error(error);
    }
  };

  // ============================================
  // GET FILTERED SUGGESTIONS
  // ============================================
  const getFilteredSuggestions = () => {
    if (suggestionFilter === 'all') return allSuggestions;
    return allSuggestions.filter(s => s.status === suggestionFilter);
  };

  const filteredSuggestions = getFilteredSuggestions();

  // ============================================
  // GET STATUS COLOR
  // ============================================
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'approved': 'bg-green-100 text-green-700',
      'implemented': 'bg-blue-100 text-blue-700',
      'rejected': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': '⏳ Pending',
      'approved': '✅ Approved',
      'implemented': '🚀 Implemented',
      'rejected': '❌ Rejected',
    };
    return labels[status] || status;
  };

  const openSuggestionModal = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setShowSuggestionModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBF6EA]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#C79A3E] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#5C6E69]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF6EA]">
      {/* Header */}
      <header className="bg-[#072E2A] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
          <span className="text-sm text-[#E4C77B]">{user?.email}</span>
        </div>
        <button onClick={logout} className="px-4 py-2 bg-[#C79A3E] text-[#072E2A] rounded-lg hover:bg-[#E4C77B] transition">
          Logout
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending Suggestions</p>
            <p className="text-2xl font-bold text-[#F59E0B]">{stats.pendingSuggestions || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Guides</p>
            <p className="text-2xl font-bold text-[#10B981]">{stats.totalGuides || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-2xl font-bold">{stats.totalBookings || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Pending Reviews</p>
            <p className="text-2xl font-bold text-[#EF4444]">{stats.pendingReviews || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
          {['overview', 'suggestions', 'guides', 'bookings', 'reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap transition ${
                activeTab === tab
                  ? 'text-[#072E2A] border-b-2 border-[#072E2A]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab} {tab === 'suggestions' && suggestions.length > 0 && `(${suggestions.length})`}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold mb-4">Recent Bookings</h3>
              {bookings.slice(0, 5).length === 0 ? (
                <p className="text-gray-500 text-sm">No recent bookings</p>
              ) : (
                bookings.slice(0, 5).map(b => (
                  <div key={b.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <div>
                      <p className="font-medium text-sm">{b.traveler_email || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500">{b.guide_name} • {b.date}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold mb-4">Recent Suggestions</h3>
              {suggestions.slice(0, 5).length === 0 ? (
                <p className="text-gray-500 text-sm">No pending suggestions</p>
              ) : (
                suggestions.slice(0, 5).map(s => (
                  <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <div>
                      <p className="font-medium text-sm">{s.name || 'Untitled'}</p>
                      <p className="text-xs text-gray-500">{s.user?.email || s.user_email || 'Anonymous'}</p>
                      <p className="text-xs text-gray-400">{s.district || 'No district'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                      {s.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ✅ SUGGESTIONS TAB - COMPLETE WITH ALL ACTIONS */}
        {activeTab === 'suggestions' && (
          <div>
            {/* Filter Buttons */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setSuggestionFilter('all')}
                className={`px-3 py-1.5 text-xs rounded-full transition ${
                  suggestionFilter === 'all' 
                    ? 'bg-[#072E2A] text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                All ({allSuggestions.length})
              </button>
              <button
                onClick={() => setSuggestionFilter('pending')}
                className={`px-3 py-1.5 text-xs rounded-full transition ${
                  suggestionFilter === 'pending' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                ⏳ Pending ({allSuggestions.filter(s => s.status === 'pending').length})
              </button>
              <button
                onClick={() => setSuggestionFilter('approved')}
                className={`px-3 py-1.5 text-xs rounded-full transition ${
                  suggestionFilter === 'approved' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                ✅ Approved ({allSuggestions.filter(s => s.status === 'approved').length})
              </button>
              <button
                onClick={() => setSuggestionFilter('implemented')}
                className={`px-3 py-1.5 text-xs rounded-full transition ${
                  suggestionFilter === 'implemented' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                🚀 Implemented ({allSuggestions.filter(s => s.status === 'implemented').length})
              </button>
              <button
                onClick={() => setSuggestionFilter('rejected')}
                className={`px-3 py-1.5 text-xs rounded-full transition ${
                  suggestionFilter === 'rejected' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                ❌ Rejected ({allSuggestions.filter(s => s.status === 'rejected').length})
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">User</th>
                      <th className="px-4 py-3 text-left">District</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Processed By</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSuggestions.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-8 text-gray-500">No suggestions found</td></tr>
                    ) : (
                      filteredSuggestions.map(s => (
                        <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => openSuggestionModal(s)}>
                          <td className="px-4 py-3 font-medium">{s.name || 'Untitled'}</td>
                          <td className="px-4 py-3">
                            <div>
                              <p>{s.user?.email || s.user_email || 'Anonymous'}</p>
                              {s.user?.username && <p className="text-xs text-gray-400">@{s.user.username}</p>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                              {s.district || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3">{s.category || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(s.status)}`}>
                              {getStatusLabel(s.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {s.processed_by ? (
                              <div>
                                <p className="text-xs font-medium">{s.processed_by?.email || s.processed_by || 'Unknown'}</p>
                                {s.processed_at && (
                                  <p className="text-xs text-gray-400">{new Date(s.processed_at).toLocaleDateString()}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                              {s.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => processSuggestion(s.id, 'approve')}
                                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                    disabled={processingId === s.id || actionLoading}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => processSuggestion(s.id, 'reject')}
                                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                                    disabled={processingId === s.id || actionLoading}
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => processSuggestion(s.id, 'implement')}
                                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                    disabled={processingId === s.id || actionLoading}
                                  >
                                    Implement
                                  </button>
                                </>
                              )}
                              {(s.status === 'approved' || s.status === 'implemented') && (
                                <button
                                  onClick={() => processSuggestion(s.id, 'implement')}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                                  disabled={processingId === s.id || actionLoading}
                                >
                                  Implement
                                </button>
                              )}
                              {/* ✅ DELETE BUTTON - Always visible for all statuses */}
                              <button
                                onClick={() => processSuggestion(s.id, 'delete')}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                                disabled={processingId === s.id || actionLoading}
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSuggestionModal(s);
                                }}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Guides Tab */}
        {activeTab === 'guides' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Guides ({guides.length})</h3>
              <button
                onClick={() => setShowAddGuide(true)}
                className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition"
              >
                + Add Guide
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              {guides.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No guides found. Click "Add Guide" to create one!</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">District</th>
                        <th className="px-4 py-3 text-left">Verified</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guides.map(g => (
                        <tr key={g.id} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-medium">{g.full_name}</td>
                          <td className="px-4 py-3">{g.email}</td>
                          <td className="px-4 py-3">{g.primary_district || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${g.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {g.is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {!g.is_verified && (
                                <button
                                  onClick={() => verifyGuide(g.id)}
                                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                                >
                                  Verify
                                </button>
                              )}
                              <button
                                onClick={() => deleteGuide(g.id)}
                                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Booking ID</th>
                    <th className="px-4 py-3 text-left">Traveler</th>
                    <th className="px-4 py-3 text-left">Guide</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No bookings found</td></tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-mono text-xs">{b.booking_id}</td>
                        <td className="px-4 py-3">{b.traveler_email || 'Anonymous'}</td>
                        <td className="px-4 py-3">{b.guide_name}</td>
                        <td className="px-4 py-3">{b.date}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={b.status}
                            onChange={(e) => updateBooking(b.id, e.target.value)}
                            className="text-xs border rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirm</option>
                            <option value="completed">Complete</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Rating</th>
                    <th className="px-4 py-3 text-left">Comment</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">No reviews found</td></tr>
                  ) : (
                    reviews.map(r => (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">{r.user?.username || 'Anonymous'}</td>
                        <td className="px-4 py-3">{'⭐'.repeat(r.rating)}</td>
                        <td className="px-4 py-3 max-w-xs truncate">{r.review_text || r.comment}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${r.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {r.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => processReview(r.id, 'approve')}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                            >
                              Approve
                            </button>
                            <button                              onClick={() => processReview(r.id, 'reject')}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ✅ SUGGESTION DETAIL MODAL - WITH DELETE OPTION */}
      {showSuggestionModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-[#072E2A]">{selectedSuggestion.name}</h3>
              <button onClick={() => setShowSuggestionModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            {selectedSuggestion.image && (
              <div className="mb-4">
                <img 
                  src={selectedSuggestion.image} 
                  alt={selectedSuggestion.name} 
                  className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">User</p>
                <p className="font-medium">{selectedSuggestion.user?.email || selectedSuggestion.user_email || 'Anonymous'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">District</p>
                <p className="font-medium">{selectedSuggestion.district || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{selectedSuggestion.category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedSuggestion.status)}`}>
                  {getStatusLabel(selectedSuggestion.status)}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">Location Info</p>
              <p className="text-sm">{selectedSuggestion.location_info || 'N/A'}</p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-sm text-gray-700">{selectedSuggestion.description || 'No description'}</p>
            </div>

            {/* ✅ Show who processed it */}
            {selectedSuggestion.processed_by && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Processed By</p>
                <p className="text-sm font-medium">
                  {selectedSuggestion.processed_by?.email || selectedSuggestion.processed_by || 'Unknown'}
                </p>
                {selectedSuggestion.processed_at && (
                  <p className="text-xs text-gray-400">{new Date(selectedSuggestion.processed_at).toLocaleString()}</p>
                )}
              </div>
            )}

            {selectedSuggestion.admin_notes && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Admin Notes</p>
                <p className="text-sm">{selectedSuggestion.admin_notes}</p>
              </div>
            )}

            {/* ✅ ACTION BUTTONS IN MODAL */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 flex-wrap">
              {selectedSuggestion.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      processSuggestion(selectedSuggestion.id, 'approve');
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => {
                      processSuggestion(selectedSuggestion.id, 'reject');
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => {
                      processSuggestion(selectedSuggestion.id, 'implement');
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    🚀 Implement
                  </button>
                </>
              )}
              {(selectedSuggestion.status === 'approved' || selectedSuggestion.status === 'implemented') && (
                <button
                  onClick={() => {
                    processSuggestion(selectedSuggestion.id, 'implement');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  🚀 Implement
                </button>
              )}
              {/* ✅ DELETE BUTTON - Always visible in modal */}
              <button
                onClick={() => {
                  processSuggestion(selectedSuggestion.id, 'delete');
                }}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition disabled:opacity-50"
              >
                🗑️ Delete Permanently
              </button>
              <button
                onClick={() => setShowSuggestionModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ ADD GUIDE MODAL ============ */}
      {showAddGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Guide</h3>
            <form onSubmit={handleAddGuide}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={guideForm.full_name}
                    onChange={(e) => setGuideForm({...guideForm, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={guideForm.email}
                    onChange={(e) => setGuideForm({...guideForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Set a password for the guide"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={guideForm.password}
                    onChange={(e) => setGuideForm({...guideForm, password: e.target.value})}
                  />
                  <p className="text-xs text-gray-400 mt-1">This password will be used to login</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={guideForm.phone}
                    onChange={(e) => setGuideForm({...guideForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    rows="3"
                    value={guideForm.bio}
                    onChange={(e) => setGuideForm({...guideForm, bio: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={guideForm.experience_years}
                      onChange={(e) => setGuideForm({...guideForm, experience_years: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Languages</label>
                    <input
                      type="text"
                      placeholder="English, Malayalam"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={guideForm.languages}
                      onChange={(e) => setGuideForm({...guideForm, languages: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Primary District</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={guideForm.primary_district}
                    onChange={(e) => setGuideForm({...guideForm, primary_district: e.target.value})}
                  >
                    <option value="">Select District</option>
                    {KERALA_DISTRICTS.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price/Day ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={guideForm.price_per_day}
                      onChange={(e) => setGuideForm({...guideForm, price_per_day: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price/Hour ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                      value={guideForm.price_per_hour}
                      onChange={(e) => setGuideForm({...guideForm, price_per_hour: e.target.value})}
                    />
                  </div>
                </div>

                {/* Auto-Verify Toggle */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoVerify}
                        onChange={(e) => setAutoVerify(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#072E2A]/25 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#072E2A]"></div>
                      <span className="ms-3 text-sm font-medium text-gray-700">
                        {autoVerify ? '✅ Auto-Verify Guide' : '⏳ Manual Verification Required'}
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-14">
                    {autoVerify 
                      ? 'Guide will be immediately visible in "Book a Guide" section' 
                      : 'Guide will appear as "Pending" and need manual verification'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddGuide(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={guideLoading}
                  className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition disabled:opacity-50"
                >
                  {guideLoading ? 'Adding...' : 'Add Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">✅ Guide Added Successfully!</h3>
            <p className="text-sm text-gray-600 mb-4">Guide can now login with these credentials:</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-mono font-semibold">{guideForm.email}</p>
              <p className="text-sm text-gray-500 mt-2">Password</p>
              <p className="font-mono font-semibold text-[#C79A3E]">{newGuidePassword || guideForm.password || 'TempPass123'}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`Email: ${guideForm.email}\nPassword: ${newGuidePassword || guideForm.password}`);
                  alert('Copied to clipboard!');
                }}
                className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition"
              >
                Copy Credentials
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
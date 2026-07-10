// src/pages/StaffDashboard.jsx - COMPLETE FIXED WITH AUTO-VERIFY TOGGLE
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
  
  // ✅ AUTO-VERIFY TOGGLE STATE
  const [autoVerify, setAutoVerify] = useState(true);

  // ============================================
  // FETCH DATA - UPDATED URLS
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

      // 2. Fetch Suggestions
      try {
        const suggRes = await api.get('/suggestions/', { params: { status: 'pending' } });
        if (suggRes?.data?.success) {
          setSuggestions(suggRes.data.results || []);
        } else if (Array.isArray(suggRes?.data)) {
          setSuggestions(suggRes.data);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
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
  // PROCESS SUGGESTION
  // ============================================
  const processSuggestion = async (id, action) => {
    setProcessingId(id);
    try {
      const notes = action === 'reject' ? prompt('Reason for rejection:') : 'Approved by staff';
      if (action === 'reject' && notes === null) { 
        setProcessingId(null); 
        return; 
      }
      
      const response = await api.post(`/staff/staff/suggestions/${id}/process/`, {
        action,
        notes: notes || 'Approved by staff'
      });
      
      if (response?.data?.success) {
        alert(`✅ Suggestion ${action}ed successfully!`);
        fetchData();
      } else {
        alert('❌ Failed to process suggestion');
      }
    } catch (error) {
      alert('❌ Failed to process suggestion');
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================
  // ADD GUIDE - WITH AUTO-VERIFY TOGGLE
  // ============================================
  const handleAddGuide = async (e) => {
    e.preventDefault();
    setGuideLoading(true);
    try {
      const guideData = {
        ...guideForm,
        password: guideForm.password || 'TempPass123',
        auto_verify: autoVerify  // ✅ Send auto-verify preference
      };
      
      const response = await api.post('/staff/staff/guides/add/', guideData);
      if (response?.data?.success) {
        setNewGuidePassword(response.data.password || guideForm.password);
        setShowPasswordModal(true);
        setShowAddGuide(false);
        setGuideForm({ 
          full_name: '', email: '', password: '', phone: '', bio: '', 
          experience_years: '0', languages: '', primary_district: '', 
          price_per_day: '0', price_per_hour: '0' 
        });
        await fetchData();
        alert(`✅ Guide added ${response.data.is_verified ? 'and verified' : ''} successfully!`);
      } else {
        alert(response?.data?.error || 'Failed to add guide');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to add guide';
      alert('❌ ' + errorMsg);
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
      const response = await api.post(`/staff/staff/guides/${id}/verify/`);
      if (response?.data?.success) {
        alert('✅ Guide verified!');
        fetchData();
      } else {
        alert('❌ Failed to verify guide');
      }
    } catch (error) {
      alert('❌ Failed to verify guide');
      console.error(error);
    }
  };

  // ============================================
  // DELETE GUIDE
  // ============================================
  const deleteGuide = async (id) => {
    if (!window.confirm('Delete this guide?')) return;
    try {
      const response = await api.delete(`/staff/staff/guides/${id}/`);
      if (response?.data?.success) {
        alert('✅ Guide deleted');
        fetchData();
      } else {
        alert('❌ Failed to delete guide');
      }
    } catch (error) {
      alert('❌ Failed to delete guide');
      console.error(error);
    }
  };

  // ============================================
  // UPDATE BOOKING
  // ============================================
  const updateBooking = async (id, status) => {
    try {
      const response = await api.post(`/staff/staff/bookings/${id}/update/`, { status });
      if (response?.data?.success) {
        alert(`✅ Booking ${status}!`);
        fetchData();
      } else {
        alert('❌ Failed to update booking');
      }
    } catch (error) {
      alert('❌ Failed to update booking');
      console.error(error);
    }
  };

  // ============================================
  // PROCESS REVIEW
  // ============================================
  const processReview = async (id, action) => {
    try {
      const response = await api.post(`/staff/staff/reviews/${id}/process/`, { action });
      if (response?.data?.success) {
        alert(`✅ Review ${action === 'approve' ? 'approved' : 'rejected'}!`);
        fetchData();
      } else {
        alert('❌ Failed to process review');
      }
    } catch (error) {
      alert('❌ Failed to process review');
      console.error(error);
    }
  };

  // ============================================
  // RENDER
  // ============================================
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
          <div>
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
                        <p className="text-xs text-gray-500">{s.user?.email || 'Anonymous'}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        {s.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">No pending suggestions</td></tr>
                  ) : (
                    suggestions.map(s => (
                      <tr key={s.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium">{s.name || 'Untitled'}</td>
                        <td className="px-4 py-3">{s.user?.email || 'Anonymous'}</td>
                        <td className="px-4 py-3">{s.category || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => processSuggestion(s.id, 'approve')}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                              disabled={processingId === s.id}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => processSuggestion(s.id, 'reject')}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                              disabled={processingId === s.id}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => processSuggestion(s.id, 'implement')}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                              disabled={processingId === s.id}
                            >
                              Implement
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

        {/* ============ GUIDES TAB ============ */}
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
                            <button
                              onClick={() => processReview(r.id, 'reject')}
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

                {/* ✅ AUTO-VERIFY TOGGLE */}
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

      {/* ============ PASSWORD MODAL ============ */}
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
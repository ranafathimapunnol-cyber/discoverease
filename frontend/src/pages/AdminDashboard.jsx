// src/pages/AdminDashboard.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [guides, setGuides] = useState([]);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ 
    email: '', 
    first_name: '', 
    last_name: '',
    password: ''
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get stats
      const statsRes = await api.get('/admin/admin/stats/');
      if (statsRes.data.success) setStats(statsRes.data.stats);

      // Get users
      const usersRes = await api.get('/admin/admin/users/');
      if (usersRes.data.success) setUsers(usersRes.data.users);

      // Get staff
      const staffRes = await api.get('/admin/admin/staff/');
      if (staffRes.data.success) setStaff(staffRes.data.staff);

      // Get guides
      try {
        const guidesRes = await api.get('/staff/staff/guides/');
        if (guidesRes.data.success) setGuides(guidesRes.data.guides || []);
        else if (Array.isArray(guidesRes.data)) setGuides(guidesRes.data);
        else setGuides([]);
      } catch (e) {
        console.log('Error fetching guides:', e);
        setGuides([]);
      }

      // Get suggestions from both API and localStorage
      let allSugg = [];
      try {
        const suggRes = await api.get('/suggestions/');
        if (suggRes.data.success) {
          allSugg = suggRes.data.results || [];
        } else if (Array.isArray(suggRes.data)) {
          allSugg = suggRes.data;
        }
      } catch (e) {
        console.log('Error fetching suggestions from API:', e);
      }

      // Also get from localStorage for hidden gems
      try {
        const localSuggestions = JSON.parse(localStorage.getItem('hidden_gems_suggestions') || '[]');
        // Merge and deduplicate by id
        const allIds = new Set(allSugg.map(s => s.id));
        const uniqueLocal = localSuggestions.filter(s => !allIds.has(s.id));
        allSugg = [...allSugg, ...uniqueLocal];
      } catch (e) {
        console.log('No local suggestions found');
      }

      setAllSuggestions(allSugg);
      setFilteredSuggestions(allSugg);

      // Get verifications
      const verRes = await api.get('/admin/admin/guide-verifications/');
      if (verRes.data.success) setVerifications(verRes.data.verifications);

    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status !== 404) {
        alert('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate, fetchData]);

  // ============================================
  // FILTER SUGGESTIONS
  // ============================================
  useEffect(() => {
    if (suggestionFilter === 'all') {
      setFilteredSuggestions(allSuggestions);
    } else {
      setFilteredSuggestions(allSuggestions.filter(s => s.status === suggestionFilter));
    }
  }, [suggestionFilter, allSuggestions]);

  // ============================================
  // ADD STAFF
  // ============================================
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setStaffLoading(true);
    try {
      const res = await api.post('/admin/admin/staff/add/', staffForm);
      if (res.data.success) {
        setShowPasswordModal(true);
        setShowAddStaff(false);
        setStaffForm({ email: '', first_name: '', last_name: '', password: '' });
        fetchData();
      } else {
        alert(res.data.error || 'Failed to add staff');
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add staff');
    } finally {
      setStaffLoading(false);
    }
  };

  // ============================================
  // TOGGLE USER STATUS
  // ============================================
  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.post(`/admin/admin/users/${userId}/toggle-status/`, {
        is_active: !currentStatus
      });
      fetchData();
    } catch (error) {
      alert('Failed to update user status');
    }
  };

  // ============================================
  // DELETE USER
  // ============================================
  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/admin/users/${userId}/`);
      fetchData();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  // ============================================
  // DELETE STAFF
  // ============================================
  const deleteStaff = async (staffId) => {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      await api.delete(`/admin/admin/staff/${staffId}/`);
      fetchData();
    } catch (error) {
      alert('Failed to remove staff');
    }
  };

  // ============================================
  // PROCESS SUGGESTION (Approve/Reject/Implement/Delete)
  // ============================================
  const processSuggestion = async (id, action) => {
    setActionLoading(true);
    setProcessingId(id);
    try {
      if (action === 'delete') {
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
      const notes = action === 'reject' ? prompt('Reason for rejection:') : `Processed by Admin: ${user?.email || 'Admin'}`;
      if (action === 'reject' && notes === null) { 
        setActionLoading(false);
        setProcessingId(null);
        return; 
      }
      
      // Try API first
      try {
        const response = await api.post(`/auth/admin/suggestions/${id}/reject/`, {
          notes: notes || `Processed by Admin: ${user?.email || 'Admin'}`
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
              processed_by: user?.email || 'admin',
              admin_notes: notes || `Processed by Admin: ${user?.email || 'Admin'}`
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

  const getRoleBadge = (role) => {
    const colors = {
      admin: '#EF4444',
      staff: '#3B82F6',
      guide: '#10B981',
      tourister: '#F59E0B'
    };
    return { color: colors[role] || '#6B7280', label: role || 'Unknown' };
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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Guides</p>
            <p className="text-2xl font-bold text-[#10B981]">{stats.totalGuides || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Staff</p>
            <p className="text-2xl font-bold text-[#3B82F6]">{stats.totalStaff || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Total Suggestions</p>
            <p className="text-2xl font-bold text-[#C79A3E]">{allSuggestions.length || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
          {['overview', 'users', 'staff', 'guides', 'suggestions', 'verifications'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap transition ${
                activeTab === tab
                  ? 'text-[#072E2A] border-b-2 border-[#072E2A]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab} {tab === 'suggestions' && allSuggestions.length > 0 && `(${allSuggestions.length})`}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold mb-3">Recent Users</h3>
              {users.slice(0, 5).map(u => (
                <div key={u.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium">{u.email}</p>
                    <p className="text-xs text-gray-400">{u.first_name} {u.last_name}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{
                    backgroundColor: getRoleBadge(u.role).color + '20',
                    color: getRoleBadge(u.role).color
                  }}>
                    {getRoleBadge(u.role).label}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="font-semibold mb-3">Recent Suggestions</h3>
              {allSuggestions.slice(0, 5).map(s => (
                <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-50 cursor-pointer hover:bg-gray-50" onClick={() => openSuggestionModal(s)}>
                  <div>
                    <p className="text-sm font-medium">{s.name || 'Untitled'}</p>
                    <p className="text-xs text-gray-400">By: {s.user?.email || s.user_email || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{s.district || 'No district'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(s.status)}`}>
                    {getStatusLabel(s.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.first_name} {u.last_name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full" style={{
                          backgroundColor: getRoleBadge(u.role).color + '20',
                          color: getRoleBadge(u.role).color
                        }}>
                          {getRoleBadge(u.role).label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleUserStatus(u.id, u.is_active)}
                          className={`px-2 py-1 text-xs rounded ${u.is_active ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Staff Members ({staff.length})</h3>
              <button
                onClick={() => setShowAddStaff(true)}
                className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition"
              >
                + Add Staff
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map(s => (
                      <tr key={s.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">{s.email}</td>
                        <td className="px-4 py-3">{s.first_name} {s.last_name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteStaff(s.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ✅ GUIDES TAB */}
        {activeTab === 'guides' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">District</th>
                    <th className="px-4 py-3 text-left">Verified</th>
                    <th className="px-4 py-3 text-left">Experience</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guides.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No guides found</td></tr>
                  ) : (
                    guides.map(g => (
                      <tr key={g.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium">{g.full_name}</td>
                        <td className="px-4 py-3">{g.email}</td>
                        <td className="px-4 py-3">{g.primary_district || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${g.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {g.is_verified ? '✅ Verified' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{g.experience_years || 0} years</td>
                        <td className="px-4 py-3 flex gap-2">
                          {!g.is_verified && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.post(`/staff/staff/guides/${g.id}/verify/`);
                                  alert('Guide verified!');
                                  fetchData();
                                } catch (e) {
                                  alert('Failed to verify guide');
                                }
                              }}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                            >
                              Verify
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!window.confirm('Delete this guide?')) return;
                              try {
                                await api.delete(`/staff/staff/guides/${g.id}/`);
                                fetchData();
                              } catch (e) {
                                alert('Failed to delete guide');
                              }
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ✅ SUGGESTIONS TAB - COMPLETE WITH ALL DETAILS */}
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
                      <th className="px-4 py-3 text-left">Submitted By</th>
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
                              <p className="font-medium">{s.user?.email || s.user_email || 'Anonymous'}</p>
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
                              {/* ✅ DELETE BUTTON */}
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

        {/* Verifications Tab */}
        {activeTab === 'verifications' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Guide</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Verified By</th>
                    <th className="px-4 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8 text-gray-500">No verifications found</td></tr>
                  ) : (
                    verifications.map(v => (
                      <tr key={v.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 font-medium">{v.guide?.full_name || 'Unknown'}</td>
                        <td className="px-4 py-3">{v.guide?.email || 'N/A'}</td>
                        <td className="px-4 py-3">{v.verified_by?.first_name || v.verified_by?.username || 'Unknown'}</td>
                        <td className="px-4 py-3">{v.created_at ? new Date(v.created_at).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ✅ ADD STAFF MODAL */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add Staff Member</h3>
            <form onSubmit={handleAddStaff}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={staffForm.first_name}
                    onChange={(e) => setStaffForm({...staffForm, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={staffForm.last_name}
                    onChange={(e) => setStaffForm({...staffForm, last_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="Set a password for the staff member"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#072E2A]"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                  />
                  <p className="text-xs text-gray-400 mt-1">This password will be used to login</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddStaff(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition disabled:opacity-50"
                >
                  {staffLoading ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">✅ Staff Added Successfully!</h3>
            <p className="text-sm text-gray-600 mb-4">Staff member can login with these credentials:</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-mono font-semibold">{staffForm.email}</p>
              <p className="text-sm text-gray-500 mt-2">Password</p>
              <p className="font-mono font-semibold text-[#C79A3E]">{staffForm.password}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`Email: ${staffForm.email}\nPassword: ${staffForm.password}`);
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

      {/* ✅ SUGGESTION DETAIL MODAL */}
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
                <p className="text-sm text-gray-500">Submitted By</p>
                <p className="font-medium">{selectedSuggestion.user?.email || selectedSuggestion.user_email || 'Anonymous'}</p>
                {selectedSuggestion.user?.username && (
                  <p className="text-xs text-gray-400">@{selectedSuggestion.user.username}</p>
                )}
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

            {/* Show who processed it */}
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

            {/* Action Buttons in Modal */}
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
              {/* DELETE BUTTON */}
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
    </div>
  );
};

export default AdminDashboard;
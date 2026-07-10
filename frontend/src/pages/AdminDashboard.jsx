// src/pages/AdminDashboard.jsx - COMPLETE FIXED VERSION WITH PASSWORD FIELD

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
  const [suggestions, setSuggestions] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ 
    email: '', 
    first_name: '', 
    last_name: '',
    password: ''  // ✅ Added password field
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // ✅ FIXED: Fetch data with correct URLs
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Get stats - FIXED URL
      const statsRes = await api.get('/admin/admin/stats/');
      if (statsRes.data.success) setStats(statsRes.data.stats);

      // Get users - FIXED URL
      const usersRes = await api.get('/admin/admin/users/');
      if (usersRes.data.success) setUsers(usersRes.data.users);

      // Get staff - FIXED URL
      const staffRes = await api.get('/admin/admin/staff/');
      if (staffRes.data.success) setStaff(staffRes.data.staff);

      // Get suggestions - FIXED URL
      const suggRes = await api.get('/admin/admin/suggestions/');
      if (suggRes.data.success) setSuggestions(suggRes.data.suggestions);

      // Get verifications - FIXED URL
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

  // ✅ FIXED: Add staff with password - Correct URL
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
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add staff');
    } finally {
      setStaffLoading(false);
    }
  };

  // ✅ FIXED: Toggle user status - Correct URL
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

  // ✅ FIXED: Delete user - Correct URL
  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/admin/users/${userId}/`);
      fetchData();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  // ✅ FIXED: Delete staff - Correct URL
  const deleteStaff = async (staffId) => {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      await api.delete(`/admin/admin/staff/${staffId}/`);
      fetchData();
    } catch (error) {
      alert('Failed to remove staff');
    }
  };

  // ✅ FIXED: Reject suggestion - Correct URL
  const rejectSuggestion = async (suggestionId) => {
    if (!window.confirm('Reject this suggestion?')) return;
    try {
      await api.post(`/admin/admin/suggestions/${suggestionId}/reject/`);
      fetchData();
    } catch (error) {
      alert('Failed to reject suggestion');
    }
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
            <p className="text-sm text-gray-500">Bookings</p>
            <p className="text-2xl font-bold text-[#C79A3E]">{stats.totalBookings || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          {['overview', 'users', 'staff', 'suggestions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'text-[#072E2A] border-b-2 border-[#072E2A]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
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
                  <span>{u.email}</span>
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
              <h3 className="font-semibold mb-3">Recent Verifications</h3>
              {verifications.slice(0, 5).map(v => (
                <div key={v.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span>{v.guide?.full_name || 'Unknown'}</span>
                  <span className="text-xs text-[#10B981]">✓ Verified</span>
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
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => toggleUserStatus(u.id, u.is_active)}
                          className={`px-2 py-1 text-xs rounded ${u.is_active ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
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
              <h3 className="font-semibold">Staff Members</h3>
              <button
                onClick={() => setShowAddStaff(true)}
                className="px-4 py-2 bg-[#072E2A] text-white rounded-lg hover:bg-[#0B2422] transition"
              >
                + Add Staff
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
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
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
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
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map(s => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{s.name || s.title || 'Untitled'}</td>
                    <td className="px-4 py-3">{s.user?.email || 'Anonymous'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => rejectSuggestion(s.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ Add Staff Modal WITH PASSWORD FIELD */}
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
                {/* ✅ NEW: Password Field */}
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

      {/* ✅ Password Modal - Shows the password set by admin */}
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
    </div>
  );
};

export default AdminDashboard;
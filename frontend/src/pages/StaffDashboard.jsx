import React from 'react';
import { Link } from 'react-router-dom';

const StaffDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg p-6 flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-blue-600">DiscoverEase</h1>
          </div>
          
          <nav className="flex-1 space-y-2">
            <Link to="/staff/dashboard" className="block py-2 px-4 bg-blue-50 text-blue-600 rounded-lg">Dashboard</Link>
            <Link to="/staff/verify-places" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Verify places</Link>
            <Link to="/staff/verify-stays" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Verify stays</Link>
            <Link to="/staff/verify-guides" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Verify Guides</Link>
            <Link to="/staff/reports" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">report</Link>
            <Link to="/staff/users" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Users</Link>
            <Link to="/staff/analytics" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Analys</Link>
            <Link to="/staff/settings" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Setti ng</Link>
          </nav>
          
          <div className="mt-auto pt-4 border-t">
            <Link to="/logout" className="block py-2 px-4 text-red-500 hover:bg-red-50 rounded-lg">Logout</Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome Staff</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Pending Verifications</p>
                <p className="text-3xl font-bold text-yellow-600">8</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Verified Places</p>
                <p className="text-3xl font-bold text-green-600">42</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Reports</p>
                <p className="text-3xl font-bold text-red-600">3</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {['Place verification pending', 'New user registered', 'Report submitted'].map((activity, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">{activity}</span>
                  <span className="text-sm text-gray-400">{new Date().toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
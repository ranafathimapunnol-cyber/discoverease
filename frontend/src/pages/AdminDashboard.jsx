import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg p-6 flex flex-col">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-red-600">DiscoverEase</h1>
          </div>
          
          <nav className="flex-1 space-y-2">
            <Link to="/admin/dashboard" className="block py-2 px-4 bg-red-50 text-red-600 rounded-lg">Dashboard</Link>
            <Link to="/admin/users" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Users</Link>
            <Link to="/admin/category" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Category</Link>
            <Link to="/admin/destinations" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Destination</Link>
            <Link to="/admin/guides" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Guides</Link>
            <Link to="/admin/stays" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Stay</Link>
            <Link to="/admin/bookings" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Book</Link>
            <Link to="/admin/analytics" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Analys</Link>
            <Link to="/admin/settings" className="block py-2 px-4 text-gray-600 hover:bg-gray-50 rounded-lg">Setti ng</Link>
          </nav>
          
          <div className="mt-auto pt-4 border-t">
            <Link to="/logout" className="block py-2 px-4 text-red-500 hover:bg-red-50 rounded-lg">Logout</Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Analytics Overview */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-3xl font-bold text-gray-800">2,568</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-800">1,245</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-800">95,000</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">Active Guides</p>
                <p className="text-3xl font-bold text-gray-800">150</p>
              </div>
            </div>
          </div>

          {/* Users Growth Chart - Simplified */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Users Growth</h3>
            <div className="h-64 flex items-end space-x-1">
              {Array.from({ length: 30 }, (_, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-red-500 rounded-t"
                  style={{ height: `${20 + Math.random() * 80}%` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
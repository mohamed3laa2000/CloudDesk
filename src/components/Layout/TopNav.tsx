import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, HelpCircle, User, LogOut, Menu } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { DemoModeBadge } from '../ui/DemoModeBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useDemo } from '../../contexts/DemoContext';

interface TopNavProps {
  onMenuClick?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  
  // Check if we're in demo mode (will return undefined if not in DemoProvider)
  let isDemo = false;
  try {
    const demoContext = useDemo();
    isDemo = demoContext.isDemo;
  } catch {
    // Not in demo mode - useDemo throws if not in DemoProvider
    isDemo = false;
  }

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Instance "ML Training" started', time: '5 min ago', unread: true },
    { id: 2, title: 'Monthly bill ready: $127.50', time: '2 hours ago', unread: true },
    { id: 3, title: 'Instance "Dev Environment" stopped', time: '1 day ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-60 z-40 bg-white border-b border-gray-200 h-16">
      <div className="px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Hamburger + Page Title + Demo Badge */}
          <div className="flex items-center gap-3">
            {/* Hamburger Menu - visible on mobile/tablet */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            
            <h1 className="text-base font-semibold text-gray-900 hidden sm:block">
              {location.pathname === '/dashboard' && 'Instances'}
              {location.pathname === '/create' && 'Create Instance'}
              {location.pathname === '/usage' && 'Usage & Billing'}
              {location.pathname === '/classroom' && 'Classroom Mode'}
              {location.pathname.startsWith('/instances/') && 'Instance Details'}
              {location.pathname === '/demo/dashboard' && 'Instances'}
              {location.pathname === '/demo/create' && 'Create Instance'}
              {location.pathname === '/demo/usage' && 'Usage & Billing'}
              {location.pathname === '/demo/classroom' && 'Classroom Mode'}
            </h1>
            
            {/* Demo Mode Badge - only shown in demo mode */}
            {isDemo && (
              <DemoModeBadge className="hidden md:inline-flex" />
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Help */}
            <Link to="/docs">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Documentation">
                <HelpCircle className="w-5 h-5" />
              </button>
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserMenu(false);
                }}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <Badge variant="info">{unreadCount} new</Badge>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <button
                        key={notif.id}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          notif.unread ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{notif.time}</p>
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                  </span>
                </div>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.email || ''}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full">
                      <User className="w-4 h-4" />
                      Account Settings
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-200 pt-1">
                    <button 
                      onClick={logout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </nav>
  );
};

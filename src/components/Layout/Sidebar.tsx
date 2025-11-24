import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: 'Instances',
    path: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Backups',
    path: '/backups',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  {
    name: 'Create Instance',
    path: '/create',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    name: 'Usage & Cost',
    path: '/usage',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Classroom Mode',
    path: '/classroom',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();

  const handleNavClick = () => {
    // Close sidebar on mobile/tablet when nav item clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen w-60 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-50
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo & Brand */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-slate-700">
          <Link to="/dashboard" className="flex items-center justify-center hover:opacity-80 transition-opacity flex-1">
            <img src="/logo-clouddesk.png" alt="CloudDesk EDU" className="h-11 w-auto object-contain dark:hidden" />
            <img src="/logo-clouddesk-white.png" alt="CloudDesk EDU" className="h-11 w-auto object-contain hidden dark:block" />
          </Link>
          
          {/* Close button - only visible on mobile/tablet */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path === '/dashboard' && location.pathname.startsWith('/instances/')) ||
                           (item.path === '/backups' && location.pathname.startsWith('/backups'));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`
                  flex items-center gap-3 px-3 py-2 sm:py-2.5 lg:py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' 
                    : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }
                `}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

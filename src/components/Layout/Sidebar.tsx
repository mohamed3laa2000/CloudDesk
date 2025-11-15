import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-slate-200 bg-white">
      <div className="flex flex-col h-full">
        {/* Logo & Brand */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-200">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo-clouddesk.png" alt="CloudDesk EDU" className="w-9 h-9 object-contain" />
            <span className="text-base font-semibold text-gray-900">CloudDesk</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path === '/dashboard' && location.pathname.startsWith('/instances/'));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-900 hover:bg-slate-50'
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

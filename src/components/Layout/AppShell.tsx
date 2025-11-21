import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  showSidebar?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ showSidebar = true }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {showSidebar && (
        <>
          <TopNav onMenuClick={toggleSidebar} />
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
          
          {/* Backdrop for mobile/tablet */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={closeSidebar}
            />
          )}
        </>
      )}
      
      {!showSidebar && <TopNav onMenuClick={toggleSidebar} />}
      
      <main className={`${showSidebar ? 'lg:ml-60' : ''} ${showSidebar ? 'pt-16' : 'pt-16'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

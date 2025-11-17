import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { DemoProvider } from '../../contexts/DemoContext';
import { TopNav } from '../Layout/TopNav';
import { Sidebar } from '../Layout/Sidebar';
import { ArrowRight } from 'lucide-react';

/**
 * DemoWrapper component wraps authenticated pages for demo mode access
 * - Displays DemoModeBadge in header
 * - Provides sign-up CTA
 * - Sets demo mode context
 * - Allows unauthenticated users to explore the interface
 */
export const DemoWrapper: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <DemoProvider isDemo={true}>
      <div className="min-h-screen bg-slate-50">
        {/* Demo Mode Banner with CTA */}
        <div className="fixed top-16 right-0 left-0 lg:left-60 z-30 bg-gradient-to-r from-amber-50 via-blue-50 to-indigo-50 border-b border-blue-200 shadow-sm">
          <div className="px-4 sm:px-6 md:px-8 py-2.5">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Demo info text */}
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-600 hidden sm:block">
                  Exploring with sample data. Changes won't be saved.
                </p>
                <p className="text-xs text-gray-600 sm:hidden">
                  Sample data only
                </p>
              </div>

              {/* Right: Sign-up CTA */}
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md whitespace-nowrap"
              >
                <span className="hidden sm:inline">Sign Up to Save Your Work</span>
                <span className="sm:hidden">Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <TopNav onMenuClick={toggleSidebar} />
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        {/* Backdrop for mobile/tablet */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Main Content - adjusted for demo banner */}
        <main className="lg:ml-60 pt-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </DemoProvider>
  );
};

import { useState } from 'react';
import type { ReactNode } from 'react';
import { User, Palette } from 'lucide-react';
import { UnderlineTabs } from '../ui/Tabs';

/**
 * SettingsLayout component
 * Layout component with sidebar/tabs navigation for settings sections
 * 
 * Features:
 * - Responsive design: sidebar on desktop (lg+), tabs on mobile/tablet
 * - Manages active section state (profile, appearance)
 * - Navigation items for Profile and Appearance sections
 * - Unsaved changes warning when switching sections
 * 
 * Requirements: 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */

export type SettingsSection = 'profile' | 'appearance';

interface SettingsSectionItem {
  id: SettingsSection;
  label: string;
  icon: ReactNode;
  description: string;
}

const SETTINGS_SECTIONS: SettingsSectionItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="w-5 h-5" />,
    description: 'Manage your profile information',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <Palette className="w-5 h-5" />,
    description: 'Customize theme and colors',
  },
];

interface SettingsLayoutProps {
  children?: ReactNode;
  hasUnsavedChanges?: boolean;
  activeSection?: SettingsSection;
  onSectionChange?: (section: SettingsSection) => void;
}

export function SettingsLayout({ 
  children, 
  hasUnsavedChanges = false,
  activeSection: controlledActiveSection,
  onSectionChange 
}: SettingsLayoutProps) {
  const [internalActiveSection, setInternalActiveSection] = useState<SettingsSection>('profile');
  
  // Use controlled activeSection if provided, otherwise use internal state
  const activeSection = controlledActiveSection ?? internalActiveSection;

  const handleSectionChange = (newSection: SettingsSection) => {
    // Warn user about unsaved changes
    if (hasUnsavedChanges && activeSection !== newSection) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this section? Your changes will be lost.'
      );
      
      if (!confirmed) {
        return;
      }
    }

    // Update internal state if not controlled
    if (controlledActiveSection === undefined) {
      setInternalActiveSection(newSection);
    }
    
    // Call parent callback
    onSectionChange?.(newSection);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 mb-1 sm:mb-2">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Mobile/Tablet Tabs (< lg) */}
      <div className="lg:hidden mb-4 sm:mb-6">
        <UnderlineTabs
          items={SETTINGS_SECTIONS.map(section => ({
            id: section.id,
            label: section.label,
          }))}
          activeId={activeSection}
          onChange={(id) => handleSectionChange(id as SettingsSection)}
        />
      </div>

      {/* Desktop Layout with Sidebar (lg+) */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8">
        {/* Sidebar Navigation - Desktop Only */}
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-3">
          <nav className="space-y-1 sticky top-4">
            {SETTINGS_SECTIONS.map((section) => {
              const isActive = section.id === activeSection;
              
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionChange(section.id)}
                  className={`
                    w-full flex items-start gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-left
                    transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
                    ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {section.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {section.label}
                    </p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {section.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 xl:col-span-9">
          {children || (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 mb-3 sm:mb-4">
                  {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.icon}
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.label}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  This section will be implemented in upcoming tasks
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

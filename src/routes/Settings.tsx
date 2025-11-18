import { useState } from 'react';
import { AuthGuard } from '../components/Auth/AuthGuard';
import { SettingsLayout, type SettingsSection } from '../components/Settings/SettingsLayout';
import { ProfileSection } from '../components/Settings/ProfileSection';
import { AppearanceSection } from '../components/Settings/AppearanceSection';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Settings route component
 * Main settings page for authenticated users to manage their account preferences
 * 
 * Requirements: 1.1, 1.2, 1.4
 */
export default function Settings() {
  // Set document title
  useDocumentTitle('Settings');

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    setHasUnsavedChanges(false);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />;
      case 'appearance':
        return <AppearanceSection />;
      default:
        return null;
    }
  };

  return (
    <AuthGuard>
      <SettingsLayout 
        activeSection={activeSection}
        hasUnsavedChanges={hasUnsavedChanges}
        onSectionChange={handleSectionChange}
      >
        {renderSection()}
      </SettingsLayout>
    </AuthGuard>
  );
}

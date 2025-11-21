/**
 * Example usage of PasskeyEnrollment component
 * 
 * This file demonstrates how to integrate the PasskeyEnrollment component
 * into your application.
 */

import React from 'react';
import { PasskeyEnrollment } from './PasskeyEnrollment';
import { useAuth } from '../../contexts/AuthContext';

export const ProfilePageExample: React.FC = () => {
  const { user } = useAuth();

  const handleEnrollmentComplete = () => {
    // Refresh passkey list or show notification
    console.log('Passkey enrolled successfully!');
    // You might want to refresh the passkey list here
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Other profile sections */}
      
      {/* Passkey Enrollment Section */}
      <PasskeyEnrollment
        userEmail={user.email}
        onEnrollmentComplete={handleEnrollmentComplete}
      />
      
      {/* Other sections like PasskeyList, Passkey2FAToggle, etc. */}
    </div>
  );
};

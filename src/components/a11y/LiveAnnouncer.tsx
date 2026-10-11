import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const LiveAnnouncer: React.FC = () => {
  const { announcement, announcementPriority } = useAccessibility();

  return (
    <div
      aria-live={announcementPriority}
      aria-atomic="true"
      className="sr-only"
      id="a11y-live-announcer"
    >
      {announcement}
    </div>
  );
};

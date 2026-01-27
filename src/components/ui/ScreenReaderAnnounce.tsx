import { useEffect, useState } from 'react';

interface AnnounceProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export function ScreenReaderAnnounce({
  message,
  politeness = 'polite'
}: AnnounceProps) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Clear and re-set to ensure screen readers announce
    setAnnouncement('');
    const timer = setTimeout(() => setAnnouncement(message), 100);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

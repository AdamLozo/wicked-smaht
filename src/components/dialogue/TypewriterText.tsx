import { useState, useEffect, useCallback } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export function TypewriterText({
  text,
  speed = 30,
  onComplete,
  className = ''
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayText('');
    setIsComplete(false);

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  // Allow click to complete instantly
  const handleClick = useCallback(() => {
    if (!isComplete) {
      setDisplayText(text);
      setIsComplete(true);
      onComplete?.();
    }
  }, [isComplete, text, onComplete]);

  return (
    <span
      onClick={handleClick}
      className={`cursor-pointer ${className}`}
    >
      {displayText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
}

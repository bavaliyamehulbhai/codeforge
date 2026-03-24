import { useState, useEffect, useRef } from 'react';

export function useAPMTracker() {
  const [apm, setApm] = useState(0);
  const keystrokesRef = useRef<number[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        keystrokesRef.current.push(Date.now());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;
      
      // Keep only keystrokes from the last 60 seconds
      keystrokesRef.current = keystrokesRef.current.filter(time => time > oneMinuteAgo);
      
      // APM = actions in the last 60s
      setApm(keystrokesRef.current.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return apm;
}

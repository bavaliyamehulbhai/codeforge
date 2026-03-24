import { useEffect, useState } from 'react';
import { useGlobalCoderSpeak } from '@/lib/coder-speak-context';
import VoiceWaveform from './VoiceWaveform';
import styles from './VoiceHUD.module.css';

export default function VoiceHUD() {
  const { isListening, status, lastCommand, interimTranscript } = useGlobalCoderSpeak();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isListening) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

  if (!visible) return null;

  return (
    <div className={`${styles.hud} ${isListening ? styles.active : ''}`}>
      <div className={styles.container}>
        <div className={styles.statusGroup}>
          <div className={`${styles.indicator} ${styles[status]}`} />
          <span className={styles.statusText}>
            {status === 'listening' && 'Listening...'}
            {status === 'processing' && 'Thinking...'}
            {status === 'success' && 'Command Accepted'}
            {status === 'error' && 'Error'}
          </span>
        </div>

        <VoiceWaveform isActive={isListening} />
        
        {status === 'listening' && interimTranscript && (
          <div className={styles.interimContainer}>
            <span className={styles.interimText}>{interimTranscript}...</span>
          </div>
        )}

        {lastCommand && status === 'success' && (
          <div className={styles.commandFeedback}>
            <span className={styles.commandLabel}>Executed:</span>
            <span className={styles.commandValue}>{lastCommand}</span>
          </div>
        )}
      </div>
    </div>
  );
}

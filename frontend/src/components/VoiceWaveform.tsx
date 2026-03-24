import styles from './VoiceWaveform.module.css';

interface VoiceWaveformProps {
  isActive: boolean;
}

export default function VoiceWaveform({ isActive }: VoiceWaveformProps) {
  if (!isActive) return null;

  return (
    <div className={styles.waveform}>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
    </div>
  );
}

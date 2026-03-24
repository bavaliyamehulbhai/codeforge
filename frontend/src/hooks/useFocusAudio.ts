import { useState, useEffect, useRef } from 'react';

export function useFocusAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  const playAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    
    // Create a 2-second buffer of brown noise for a deep, rain-like focus sound
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate for gain loss
    }

    sourceRef.current = ctx.createBufferSource();
    sourceRef.current.buffer = noiseBuffer;
    sourceRef.current.loop = true;

    gainNodeRef.current = ctx.createGain();
    gainNodeRef.current.gain.value = 0.4; // Low volume background noise

    // Simple low-pass filter to make it sound like rain/deep focus rumble
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800; // Muffles high-end static

    sourceRef.current.connect(filter);
    filter.connect(gainNodeRef.current);
    gainNodeRef.current.connect(ctx.destination);

    sourceRef.current.start();
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(console.error);
      }
    };
  }, []);

  return { isPlaying, toggleAudio };
}

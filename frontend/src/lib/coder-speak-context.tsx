import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { useToast } from './toast-context';
import VoiceHUD from '@/components/VoiceHUD';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

type CommandHandler = {
  [key: string]: (arg?: string) => void | boolean; // return true to prevent default propagation
};

interface CoderSpeakContextType {
  isListening: boolean;
  isSupported: boolean;
  toggleListening: () => void;
  startListening: () => void;
  stopListening: () => void;
  registerPageActions: (commands: CommandHandler, onDictate?: (text: string) => void) => () => void;
  status: 'idle' | 'listening' | 'processing' | 'success' | 'error';
  lastCommand: string | null;
  interimTranscript: string;
  engine: 'browser' | 'deepgram' | 'offline';
}

const CoderSpeakContext = createContext<CoderSpeakContextType | undefined>(undefined);

export function CoderSpeakProvider({ children }: { children: ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [engine, setEngine] = useState<'browser' | 'deepgram' | 'offline'>('browser');
  
  const isListeningRef = useRef(false);
  const lastProcessedRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Dynamic page commands
  const pageCommandsRef = useRef<CommandHandler>({});
  const onDictationRef = useRef<((text: string) => void) | null>(null);

  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';

        setRecognition(recog);
        setEngine('browser');
      } else {
        setEngine('offline');
      }
    }
  }, []);

  // 2. Command Dispatcher Logic (Shared between engines)
  const dispatchCommand = useCallback((transcript: string, isFinal: boolean) => {
    const now = Date.now();
    const isCooldown = now - lastProcessedRef.current < 1200;

    if (!isCooldown) {
      const fastPathTriggers = ['run code', 'format code', 'clear console', 'ship it', 'reset all', 'stop music'];
      const matchedFastPath = fastPathTriggers.find(t => transcript.includes(t));

      if (matchedFastPath) {
        lastProcessedRef.current = now;
        setLastCommand(matchedFastPath);
        setStatus('success');
        const handler = pageCommandsRef.current[matchedFastPath];
        if (handler) handler();
        toast(`Fast-Path: ${matchedFastPath}`, 'success');
        setTimeout(() => setStatus('listening'), 1000);
        return true;
      }
    }

    if (!isFinal) return false;

    let handledLocally = false;
    for (const [cmd, handler] of Object.entries(pageCommandsRef.current)) {
      if (transcript.includes(cmd)) {
        setLastCommand(cmd);
        setStatus('success');
        const arg = transcript.split(cmd)[1]?.trim();
        handler(arg);
        handledLocally = true;
        setTimeout(() => setStatus('listening'), 1500);
        break;
      }
    }

    if (!handledLocally) {
      if (transcript.includes('go home')) navigate('/');
      else if (transcript.includes('go to compiler')) navigate('/compiler');
      else if (transcript.includes('go to snippets')) navigate('/snippets');
      else if (transcript.includes('go to dashboard')) navigate('/dashboard');
      else if (transcript.includes('open settings')) navigate('/settings');
      else if (transcript.includes('view my portfolio')) navigate(`/u/${user?.username}`);
      else if (transcript.includes('view my profile')) navigate(`/u/${user?.username}`);
      else if (transcript.includes('sign out') || transcript.includes('log out')) { signOut(); navigate('/'); }
      else if (onDictationRef.current) onDictationRef.current(transcript);
    }
    return handledLocally;
  }, [navigate, signOut, toast, user]);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interim);
      if (interim) setStatus('listening');
      else if (final) setStatus('processing');

      // Use the unified dispatcher
      if (final) {
        setInterimTranscript('');
        dispatchCommand(final.toLowerCase().trim(), true);
      } else if (interim) {
        dispatchCommand(interim.toLowerCase().trim(), false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[CoderSpeak] Error:', event.error);
      if (event.error === 'not-allowed') {
        toast('Microphone access denied', 'error');
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current && !socketRef.current) {
        try {
          recognition.start();
        } catch(e) {}
      } else if (!isListeningRef.current) {
        setIsListening(false);
        setStatus('idle');
      }
    };
  }, [recognition, dispatchCommand]);

  // 3. Deepgram Implementation
  const startDeepgram = async () => {
    try {
      const tokenValue = localStorage.getItem('codeforge_token');
      const response = await fetch(`${API_URL}/voice/token`, {
        headers: tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          toast('Voice usage limit reached. Switching to browser mode.', 'info');
          startFallback();
          return;
        }
        toast(payload?.error || 'Voice service unavailable. Switching to browser mode.', 'error');
        startFallback();
        return;
      }

      const { token } = payload;
      if (!token) throw new Error('No token');

      const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&interim_results=true', ['token', token]);
      socketRef.current = socket;

      socket.onopen = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
              socket.send(event.data);
            }
          });

          mediaRecorder.start(250);
          setStatus('listening');
          setIsListening(true);
          isListeningRef.current = true;
          setEngine('deepgram');
          toast('Production Voice Active (Deepgram)', 'success');
        } catch (err) {
          console.error('[Deepgram Mic Error]', err);
          startFallback();
        }
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel.alternatives[0].transcript;
        if (transcript) {
          if (received.is_final) {
            setInterimTranscript('');
            dispatchCommand(transcript.toLowerCase().trim(), true);
          } else {
            setInterimTranscript(transcript);
            dispatchCommand(transcript.toLowerCase().trim(), false);
          }
        }
      };

      socket.onerror = () => startFallback();
      socket.onclose = () => { if (isListeningRef.current) startFallback(); };

    } catch (err) {
      console.warn('[Deepgram Engine] Could not start, falling back to WebSpeech', err);
      startFallback();
    }
  };

  const startFallback = () => {
    if (recognition && !isListening) {
      setEngine('browser');
      recognition.start();
      setIsListening(true);
      isListeningRef.current = true;
      setStatus('listening');
      toast('Standard Voice Active (Fallback)', 'info');
    }
  };

  const stopDeepgram = () => {
    isListeningRef.current = false;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    socketRef.current?.close();
    socketRef.current = null;
    setIsListening(false);
    setStatus('idle');
    setInterimTranscript('');
  };

  const startListening = useCallback(() => {
    if (!user) {
      toast('Please sign in to use voice control', 'error');
      return;
    }
    if (user.preferences?.voiceEnabled === false) {
      toast('Voice control is disabled in settings', 'info');
      return;
    }
    startDeepgram();
  }, [user]);

  const stopListening = useCallback(() => {
    if (socketRef.current) {
      stopDeepgram();
    } else if (recognition) {
      isListeningRef.current = false;
      recognition.stop();
      setIsListening(false);
      setStatus('idle');
    }
  }, [recognition]);

  const toggleListening = useCallback(() => {
    if (!user) {
      toast('Please sign in to use voice control', 'error');
      return;
    }
    if (user.preferences?.voiceEnabled === false) {
      toast('Voice control is disabled in settings', 'info');
      return;
    }
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening, user]);

  useEffect(() => {
    if (user?.preferences?.voiceEnabled === false && isListening) {
      stopListening();
      toast('Voice control disabled in settings', 'info');
    }
  }, [isListening, stopListening, toast, user?.preferences?.voiceEnabled]);

  const registerPageActions = useCallback((commands: CommandHandler, onDictate?: (text: string) => void) => {
    pageCommandsRef.current = commands;
    if (onDictate) onDictationRef.current = onDictate;
    return () => {
      pageCommandsRef.current = {};
      onDictationRef.current = null;
    };
  }, []);

  return (
    <CoderSpeakContext.Provider value={{
      isListening,
      isSupported: !!recognition || !!(window as any).MediaRecorder,
      toggleListening,
      startListening,
      stopListening,
      registerPageActions,
      status,
      lastCommand,
      interimTranscript,
      engine
    }}>
      {children}
      <VoiceHUD />
    </CoderSpeakContext.Provider>
  );
}

export function useGlobalCoderSpeak() {
  const context = useContext(CoderSpeakContext);
  if (context === undefined) {
    throw new Error('useGlobalCoderSpeak must be used within a CoderSpeakProvider');
  }
  return context;
}

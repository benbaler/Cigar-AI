import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Loader2, Volume2, Info } from 'lucide-react';
import { createPcmBlob, decodeAudio, decodeAudioData } from '../services/audioUtils';

const VISUALIZER_BARS = 5;

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [volumeLevel, setVolumeLevel] = useState(0); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  
  const apiKey = process.env.API_KEY;

  const stopSession = useCallback(async () => {
    // Close Gemini Session
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (error) {
        console.error("Error closing Gemini session:", error);
      }
      sessionRef.current = null;
    }

    // Close Audio Output Context
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          await audioContextRef.current.close();
        }
      } catch (error) {
        console.error("Error closing output context:", error);
      }
      audioContextRef.current = null;
    }

    // Close Audio Input Context
    if (inputContextRef.current) {
      try {
        if (inputContextRef.current.state !== 'closed') {
          await inputContextRef.current.close();
        }
      } catch (error) {
        console.error("Error closing input context:", error);
      }
      inputContextRef.current = null;
    }

    // Stop all playing sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { }
    });
    sourcesRef.current.clear();

    setIsActive(false);
    setStatus('idle');
    setVolumeLevel(0);
  }, []);

  const startSession = async () => {
    if (!apiKey) {
      setErrorMsg("API Key not found.");
      return;
    }

    if (isActive) return;

    setStatus('connecting');
    setErrorMsg(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputContextRef.current = inputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      source.connect(scriptProcessor);
      scriptProcessor.connect(inputCtx.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are an expert Cigar Sommelier named "Havana". 
          Your tone is sophisticated, relaxing, and knowledgeable, like an old friend at a high-end lounge. 
          Help the user identify flavors, suggest pairings (whiskey, coffee, rum), and explain cigar terminology. 
          Keep responses concise but warm.`,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setStatus('connected');
            setIsActive(true);
            nextStartTimeRef.current = outputCtx.currentTime;

            scriptProcessor.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               let sum = 0;
               for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
               const rms = Math.sqrt(sum / inputData.length);
               setVolumeLevel(Math.min(100, rms * 400)); 

               const pcmBlob = createPcmBlob(inputData);
               // Send input using the promise which resolves to the active session
               sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
               const audioBuffer = await decodeAudioData(
                 decodeAudio(base64Audio),
                 outputCtx,
                 24000,
                 1
               );
               const sourceNode = outputCtx.createBufferSource();
               sourceNode.buffer = audioBuffer;
               sourceNode.connect(outputNode);
               sourceNode.addEventListener('ended', () => {
                 sourcesRef.current.delete(sourceNode);
               });
               sourceNode.start(nextStartTimeRef.current);
               sourcesRef.current.add(sourceNode);
               nextStartTimeRef.current += audioBuffer.duration;
            }
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(node => node.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = outputCtx.currentTime;
            }
          },
          onclose: () => {
             console.log("Session closed from server");
             stopSession();
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err);
            setErrorMsg("Connection error.");
            stopSession();
          }
        }
      });

      // Capture the session for cleanup
      const session = await sessionPromise;
      sessionRef.current = session;

    } catch (e) {
      console.error(e);
      setErrorMsg("Microphone access denied or connection failed.");
      setStatus('error');
      stopSession();
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (sessionRef.current) {
          try { sessionRef.current.close(); } catch(e){}
      }
      if (audioContextRef.current) audioContextRef.current.close();
      if (inputContextRef.current) inputContextRef.current.close();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] p-6 text-center space-y-12 bg-[#0c0a09] relative overflow-hidden animate-fadeIn">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#d4af37] rounded-full blur-[150px] animate-pulse"></div>
      </div>

      <div className="z-10 max-w-md space-y-3">
        <h2 className="serif text-4xl text-[#d4af37] tracking-wide">Havana</h2>
        <p className="text-stone-500 text-sm font-medium uppercase tracking-widest">Live Sommelier Assistant</p>
      </div>

      {/* Main Interaction Area */}
      <div className="relative z-10 flex items-center justify-center w-72 h-72 flex-shrink-0">
        {status === 'connecting' && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-48 h-48 border-4 border-[#b45309]/30 border-t-[#d4af37] rounded-full animate-spin"></div>
          </div>
        )}

        {status === 'connected' && (
          <div className="absolute inset-0 flex items-center justify-center space-x-3">
            {/* Visualizer */}
            {Array.from({ length: VISUALIZER_BARS }).map((_, i) => (
              <div 
                key={i} 
                className="w-2 bg-[#d4af37] rounded-full transition-all duration-75 shadow-[0_0_10px_#d4af37]"
                style={{
                  height: `${30 + (volumeLevel * (Math.random() + 0.5))}px`,
                  opacity: 0.8
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={isActive ? stopSession : startSession}
          disabled={status === 'connecting'}
          className={`relative group flex items-center justify-center w-36 h-36 rounded-full transition-all duration-500 shadow-2xl z-20
            ${isActive 
              ? 'bg-[#451a03] border-2 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.3)]' 
              : 'bg-gradient-to-br from-[#b45309] to-[#92400e] border-4 border-[#1c1917] shadow-[0_10px_40px_rgba(180,83,9,0.3)] hover:scale-105'
            }`}
        >
          {isActive ? (
             <MicOff className="w-14 h-14 text-red-400" strokeWidth={1.5} />
          ) : (
             <Mic className="w-14 h-14 text-white" strokeWidth={1.5} />
          )}
          
          {isActive && (
            <span className="absolute inset-0 rounded-full border border-red-500/30 animate-ping opacity-30"></span>
          )}
        </button>
      </div>

      <div className="z-10 h-8">
        {status === 'idle' && <span className="text-stone-600 text-xs uppercase tracking-widest">Tap to Speak</span>}
        {status === 'connecting' && <span className="text-[#d4af37] text-xs uppercase tracking-widest animate-pulse">Establishing Connection...</span>}
        {status === 'connected' && <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest drop-shadow-md">Listening</span>}
        {status === 'error' && <span className="text-red-400 text-xs font-medium uppercase tracking-widest">{errorMsg}</span>}
      </div>

      <div className="z-10 p-5 bg-[#1c1917]/80 backdrop-blur-md rounded-2xl border border-stone-800 max-w-sm shadow-xl">
        <div className="flex items-start space-x-4 text-left">
           <Info className="w-5 h-5 text-[#d4af37] flex-shrink-0 mt-0.5" />
           <p className="text-xs text-stone-400 leading-relaxed">
             Ask Havana about <span className="text-[#d4af37]">pairings</span>, <span className="text-[#d4af37]">origins</span>, or describe your current smoke for a breakdown.
           </p>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
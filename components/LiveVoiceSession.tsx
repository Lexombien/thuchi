import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { X, Mic, MicOff, Loader2 } from 'lucide-react';
import { TransactionType, WalletType } from '../types';

interface LiveVoiceSessionProps {
  onClose: () => void;
  onLogTransaction: (data: any) => string;
  onTransfer: (data: any) => string;
}

export const LiveVoiceSession: React.FC<LiveVoiceSessionProps> = ({ onClose, onLogTransaction, onTransfer }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = inputCtx;
    outputAudioContextRef.current = outputCtx;

    let mediaStream: MediaStream;
    
    const connect = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setIsConnected(true);
              const source = inputCtx.createMediaStreamSource(mediaStream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              // Handle Audio Output
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio && outputCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputCtx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }

              // Handle Interruption
              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }

              // Handle Tool Calls
              if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                  let result = "error";
                  if (fc.name === 'logTransaction') {
                    result = onLogTransaction(fc.args);
                  } else if (fc.name === 'transferMoney') {
                    result = onTransfer(fc.args);
                  }
                  
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: { id: fc.id, name: fc.name, response: { result } }
                    });
                  });
                }
              }
            },
            onerror: (e) => {
              console.error("Live API Error:", e);
              setError("Kết nối thất bại. Thử lại sau.");
            },
            onclose: () => {
              setIsConnected(false);
            }
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: `Bạn là trợ lý tài chính MoneyTalk.
            Bạn giao tiếp bằng giọng nói tự nhiên, thân thiện. 
            Giúp người dùng ghi chép chi tiêu, thu nhập và luân chuyển tiền.
            MẶC ĐỊNH nếu không nói ví nào thì ghi vào 'cash' (tiền mặt).
            Nếu người dùng nói 'ck', 'tài khoản', 'bank' thì dùng ví 'account'.
            Luôn xác nhận lại sau khi thực hiện ghi chép.`,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'logTransaction',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        amount: { type: Type.NUMBER, description: 'Số tiền' },
                        type: { type: Type.STRING, enum: ['income', 'expense'], description: 'Loại giao dịch' },
                        wallet: { type: Type.STRING, enum: ['cash', 'account'], description: 'Ví sử dụng' },
                        category: { type: Type.STRING, description: 'Danh mục (Ăn uống, Lương...)' },
                        description: { type: Type.STRING, description: 'Mô tả chi tiết' }
                      },
                      required: ['amount', 'type', 'wallet']
                    }
                  },
                  {
                    name: 'transferMoney',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        amount: { type: Type.NUMBER, description: 'Số tiền chuyển' },
                        from: { type: Type.STRING, enum: ['cash', 'account'] },
                        to: { type: Type.STRING, enum: ['cash', 'account'] },
                        description: { type: Type.STRING }
                      },
                      required: ['amount', 'from', 'to']
                    }
                  }
                ]
              }
            ]
          }
        });
        
        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error(err);
        setError("Không thể truy cập microphone.");
      }
    };

    connect();

    return () => {
      mediaStream?.getTracks().forEach(t => t.stop());
      sessionRef.current?.close();
      inputCtx?.close();
      outputCtx?.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
      <button 
        onClick={onClose}
        className="absolute top-10 right-10 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
      >
        <X size={24} />
      </button>

      <div className="relative flex flex-col items-center text-center">
        {/* Animated Rings */}
        <div className={`w-40 h-40 rounded-full bg-secondary flex items-center justify-center shadow-2xl shadow-emerald-500/30 transition-all ${isConnected ? 'scale-110' : 'scale-100 opacity-50'}`}>
          {isConnected ? (
            <div className="flex gap-1 items-center h-8">
               <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite_100ms]"></div>
               <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite_300ms]"></div>
               <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite_500ms]"></div>
               <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite_700ms]"></div>
               <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite_900ms]"></div>
            </div>
          ) : (
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          )}
        </div>
        
        {isConnected && (
           <div className="absolute inset-0 -z-10 w-40 h-40 rounded-full bg-secondary opacity-20 animate-ping"></div>
        )}

        <h2 className="mt-12 text-2xl font-bold text-white tracking-tight">
          {isConnected ? 'Đang lắng nghe...' : 'Đang kết nối...'}
        </h2>
        <p className="mt-2 text-slate-400 max-w-xs">
          Bạn có thể nói: "Mua bát phở 50k ck" hoặc "Nạp 1 triệu vào tài khoản"
        </p>

        {error && (
          <div className="mt-6 px-4 py-2 bg-rose-500/20 text-rose-300 rounded-lg text-sm border border-rose-500/30">
            {error}
          </div>
        )}
      </div>

      <div className="mt-24">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
        >
          <MicOff size={20} />
          Dừng trò chuyện
        </button>
      </div>
    </div>
  );
};

// --- HELPERS ---
function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

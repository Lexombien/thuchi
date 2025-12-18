import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { IWindow } from '../types';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isProcessing: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.lang = 'vi-VN';
      recognitionInstance.interimResults = false;
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        onTranscript(text);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn("Trình duyệt không hỗ trợ Web Speech API");
    }
  }, [onTranscript]);

  const toggleListening = useCallback(() => {
    if (isProcessing) return;

    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
      setIsListening(true);
    }
  }, [isListening, recognition, isProcessing]);

  if (!recognition) {
    return (
      <div className="text-xs text-red-500 text-center">
        Trình duyệt không hỗ trợ giọng nói
      </div>
    );
  }

  return (
    <button
      onClick={toggleListening}
      disabled={isProcessing}
      className={`relative p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center
        ${isListening 
          ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
          : 'bg-primary hover:bg-indigo-600'
        }
        ${isProcessing ? 'opacity-70 cursor-wait' : ''}
      `}
    >
      {isProcessing ? (
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      ) : isListening ? (
        <Square className="w-8 h-8 text-white fill-current" />
      ) : (
        <Mic className="w-8 h-8 text-white" />
      )}
      
      {/* Visual Ring Effect */}
      {isListening && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
      )}
    </button>
  );
};

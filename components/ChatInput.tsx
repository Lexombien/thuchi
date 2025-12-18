import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, Square, Loader2 } from 'lucide-react';
import { IWindow } from '../types';

interface ChatInputProps {
  onSend: (text: string) => void;
  isProcessing: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isProcessing }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Don't set text here if we want to auto-send, or set it and then clear in handleSend
        setText(transcript);
        handleSend(transcript); 
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert("Trình duyệt không hỗ trợ nhập liệu giọng nói.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSend = (textToSend: string = text) => {
    if (textToSend.trim()) {
      onSend(textToSend);
      setText(''); // Clear immediately
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-3 pb-6 flex items-end gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập hoặc nói chi tiêu..."
          disabled={isProcessing}
          className="bg-transparent border-none outline-none w-full text-sm text-slate-800 placeholder:text-slate-400"
        />
      </div>
      
      {text.trim() ? (
        <button 
          onClick={() => handleSend()}
          disabled={isProcessing}
          className="p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      ) : (
        <button 
          onClick={handleMicClick}
          disabled={isProcessing}
          className={`p-3 rounded-full text-white transition-all shadow-md flex items-center justify-center
            ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}
            ${isProcessing ? 'opacity-50 cursor-wait' : ''}
          `}
        >
          {isListening ? (
            <Square className="w-5 h-5 fill-current" />
          ) : isProcessing ? (
             <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );
};

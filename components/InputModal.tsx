import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Send, Square, Loader2 } from 'lucide-react';
import { IWindow } from '../types';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  isProcessing: boolean;
}

export const InputModal: React.FC<InputModalProps> = ({ isOpen, onClose, onSend, isProcessing }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'vi-VN';
      recognition.interimResults = true; // Show realtime text

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setText(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setText('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800">Nhập giao dịch mới</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="mb-6 relative">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='Ví dụ: "Mua cafe 30k", "Nạp 2tr vào tài khoản"...'
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-32"
          />
          {isListening && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-rose-500 text-xs font-medium animate-pulse">
              <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
              Đang nghe...
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={toggleListening}
            className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${
              isListening ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isListening ? <Square size={20} /> : <Mic size={20} />}
            {isListening ? 'Dừng' : 'Nói'}
          </button>
          
          <button
            onClick={handleSend}
            disabled={!text.trim() || isProcessing}
            className="flex-1 bg-primary hover:bg-indigo-600 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
          >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            {isProcessing ? 'Xử lý...' : 'Thêm'}
          </button>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-6">
          Hệ thống sẽ tự động phân loại ví (Tiền mặt/Tài khoản)
        </p>
      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Brain,
  Code2,
  Image as ImageIcon,
  Lightbulb,
  Mic,
  MicOff,
  Palette,
  PenTool,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { soundEngine, triggerHaptic } from '../utils/audioSynthesizer';
import { Viseme } from '../types';

interface InputDockProps {
  onSendMessage: (text: string, imageAttachment?: { mimeType: string; data: string; preview: string }) => void;
  isLoading: boolean;
  onVisemeChange: (viseme: Viseme, intensity: number) => void;
  highThinking: boolean;
  onToggleHighThinking: () => void;
}

export const InputDock: React.FC<InputDockProps> = ({
  onSendMessage,
  isLoading,
  onVisemeChange,
  highThinking,
  onToggleHighThinking,
}) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    mimeType: string;
    data: string;
    preview: string;
  } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Chips exactly matching screenshot
  const chips = [
    { label: '+ อัตโนมัติ', prompt: 'วิเคราะห์สถานะระบบและแนะนำขั้นตอนถัดไปแบบอัตโนมัติ', isPrimary: true },
    { label: '? ค้นหา', prompt: 'ค้นหาเทคโนโลยีและเทรนด์ล่าสุดพร้อมสรุปสาระสำคัญ' },
    { label: 'ช่วยคิด', prompt: 'ช่วยคิดไอเดียฟีเจอร์เด็ดสำหรับเว็บแอปพลิเคชัน 5 ข้อ' },
    { label: 'ออกแบบ', prompt: 'ช่วยออกแบบแนวคิด UI สไตล์ Cyberpunk Glassmorphism' },
    { label: 'สร้าง', prompt: 'สร้างเกม Neon Cyber Pong ให้รันบน STAGE ทันที' },
    { label: 'เขียน', prompt: 'ช่วยเขียนสรุปบทความเชิงเทคนิคให้เข้าใจง่ายและน่าสนใจ' },
    { label: 'วางแผน', prompt: 'ช่วยวางแผนขั้นตอนการพัฒนาแอปและสถาปัตยกรรมระบบ' },
  ];

  // Speech Recognition (Web Speech API) + Formant Viseme Lip-Sync
  const toggleSpeechRecognition = async () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      soundEngine.stopMic();
      setIsListening(false);
      onVisemeChange('SILENCE', 0);
      return;
    }

    soundEngine.playLaser();
    triggerHaptic('double');

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.lang = 'th-TH';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsListening(true);
        soundEngine.startMicViseme((v, intensity) => {
          onVisemeChange(v, intensity);
        });
      };

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      rec.onerror = () => {
        setIsListening(false);
        soundEngine.stopMic();
        onVisemeChange('SILENCE', 0);
      };

      rec.onend = () => {
        setIsListening(false);
        soundEngine.stopMic();
        onVisemeChange('SILENCE', 0);
      };

      recognitionRef.current = rec;
      rec.start();
    } else {
      setIsListening(true);
      const ok = await soundEngine.startMicViseme((v, intensity) => {
        onVisemeChange(v, intensity);
      });
      if (!ok) setIsListening(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundEngine.playClick();
    triggerHaptic('tap');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setSelectedImage({
        mimeType: file.type || 'image/png',
        data: base64,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;
    soundEngine.playLaser();
    triggerHaptic('tap');

    onSendMessage(input.trim(), selectedImage || undefined);
    setInput('');
    setSelectedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl px-3 sm:px-4 pb-3 sm:pb-5 pt-1 z-30">
      {/* Scrollable Command Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-2">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundEngine.playLaser();
              triggerHaptic('tap');
              onSendMessage(chip.prompt);
            }}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
              chip.isPrimary
                ? 'bg-[#B6FF00] text-[#07080E] font-bold shadow-[0_0_12px_rgba(182,255,0,0.35)]'
                : 'glass-panel border border-white/10 text-slate-300 hover:text-[#B6FF00] hover:border-[#B6FF00]/40'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Selected Image Thumbnail Preview */}
      {selectedImage && (
        <div className="relative inline-flex items-center gap-2 mb-2 p-1.5 pr-3 rounded-xl glass-panel-heavy border border-cyan-400/40">
          <img
            src={selectedImage.preview}
            alt="Upload Preview"
            className="w-10 h-10 object-cover rounded-lg border border-white/10"
          />
          <div className="text-[11px] text-cyan-300 font-mono">
            พร้อมส่งให้ Gemini 3.8 Flash วิเคราะห์
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1 rounded-full bg-white/10 text-slate-400 hover:text-white cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pill Input Container matching screenshot */}
      <div className="relative flex items-center gap-2 p-1.5 sm:p-2 rounded-full glass-panel-heavy border border-white/15 shadow-[0_4px_30px_rgba(0,0,0,0.6)] focus-within:border-[#B6FF00]/60 focus-within:shadow-[0_0_24px_rgba(182,255,0,0.2)] transition-all">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Circular + Action Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
          title="แนบรูปภาพหรือมัลติมีเดีย"
          aria-label="Add Attachment"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="สั่งผีน้อยได้เลย..."
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-slate-100 placeholder-slate-500 px-2 py-1"
        />

        {/* Microphone STT Button */}
        <button
          onClick={toggleSpeechRecognition}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isListening
              ? 'text-red-400 bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
              : 'text-slate-400 hover:text-[#B6FF00]'
          }`}
          title={isListening ? 'กำลังรับฟังเสียง...' : 'สั่งด้วยเสียง'}
          aria-label="Microphone"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Circular Neon-Lime Send Button (#B6FF00) with arrow → */}
        <button
          onClick={handleSend}
          disabled={(!input.trim() && !selectedImage) || isLoading}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-bold transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 ${
            input.trim() || selectedImage
              ? 'bg-[#B6FF00] text-[#07080E] shadow-[0_0_20px_rgba(182,255,0,0.5)] scale-100 active:scale-90 hover:brightness-110'
              : 'bg-white/10 text-slate-500 cursor-not-allowed scale-95'
          }`}
          title="ส่งคำสั่ง"
          aria-label="Send"
        >
          {isLoading ? (
            <Sparkles className="w-4 h-4 animate-spin text-[#07080E]" />
          ) : (
            <ArrowRight className="w-4 h-4 stroke-[2.8]" />
          )}
        </button>
      </div>
    </div>
  );
};

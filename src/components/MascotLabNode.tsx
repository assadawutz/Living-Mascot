import React, { useState } from 'react';
import {
  Activity,
  Compass,
  Gauge,
  Layers,
  RotateCcw,
  Sliders,
  Smile,
  Sparkles,
  Volume2,
  Wand2,
  Zap,
} from 'lucide-react';
import { Emotion, MascotConfig, Viseme } from '../types';
import { soundEngine, triggerHaptic } from '../utils/audioSynthesizer';

interface MascotLabNodeProps {
  config: MascotConfig;
  onUpdateConfig: (newConf: Partial<MascotConfig>) => void;
  currentEmotion: Emotion;
  onChangeEmotion: (emotion: Emotion) => void;
  currentViseme: Viseme;
  onChangeViseme: (viseme: Viseme) => void;
  onTriggerSquish: (intensity: number) => void;
}

export const MascotLabNode: React.FC<MascotLabNodeProps> = ({
  config,
  onUpdateConfig,
  currentEmotion,
  onChangeEmotion,
  currentViseme,
  onChangeViseme,
  onTriggerSquish,
}) => {
  const [springTension, setSpringTension] = useState<number>(0.18);
  const [squishElasticity, setSquishElasticity] = useState<number>(0.76);

  const emotions: { id: Emotion; label: string; color: string }[] = [
    { id: 'idle', label: 'Idle (ปกติ)', color: 'text-cyan-400 border-cyan-400/30' },
    { id: 'happy', label: 'Happy (ร่าเริง)', color: 'text-[#B6FF00] border-[#B6FF00]/40' },
    { id: 'thinking', label: 'Thinking (คิดวิเคราะห์)', color: 'text-amber-400 border-amber-400/30' },
    { id: 'writing', label: 'Writing (เขียนโค้ด)', color: 'text-purple-400 border-purple-400/30' },
    { id: 'speaking', label: 'Speaking (พูดโต้ตอบ)', color: 'text-cyan-300 border-cyan-300/40' },
    { id: 'overdrive', label: 'Overdrive (พลังขั้นสุด)', color: 'text-pink-500 border-pink-500/40' },
  ];

  const visemes: { id: Viseme; label: string; shape: string }[] = [
    { id: 'SILENCE', label: 'Silence', shape: '😊 ปิดปาก' },
    { id: 'A_E', label: 'A / E', shape: '😮 อ้าปากกว้าง' },
    { id: 'I', label: 'I (Ee)', shape: '😁 ยิ้มกว้าง' },
    { id: 'O_U', label: 'O / U', shape: '😗 ปากจู๋' },
    { id: 'M_B_P', label: 'M / B / P', shape: '😐 เม้มปาก' },
    { id: 'OVERDRIVE', label: 'Overdrive', shape: '😆 ตะโกนสด' },
  ];

  return (
    <div className="w-full max-w-4xl px-3 sm:px-4 py-3 space-y-3.5 animate-fade-in">
      {/* Node Container Section Header */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl glass-panel-heavy border border-cyan-400/25">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-[#00F0FF]">
            <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide font-sans flex items-center gap-2">
              MASCOT PHYSICS & RIGGING LABORATORY
              <span className="w-1.5 h-1.5 rounded-full bg-[#B6FF00] inline-block animate-ping" />
            </h2>
            <p className="text-[11px] text-[#8A90A6]">
              ทดสอบและควบคุม Soft-Body Verlet Spring, Gaze Tracking, และ Formant Viseme แบบเรียลไทม์
            </p>
          </div>
        </div>

        {/* Squish Impulse Fast Buttons */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => {
              onTriggerSquish(1.3);
              soundEngine.playPulse();
              triggerHaptic('tap', config.hapticsEnabled);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00F0FF]/40 text-xs text-slate-200 hover:text-[#00F0FF] transition-all cursor-pointer active:scale-95"
          >
            Soft Poke
          </button>
          <button
            onClick={() => {
              onTriggerSquish(1.6);
              soundEngine.playPulse();
              triggerHaptic('heavy', config.hapticsEnabled);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#B6FF00] text-[#07080E] font-bold text-xs hover:brightness-110 transition-all cursor-pointer active:scale-95 shadow-[0_0_15px_rgba(182,255,0,0.3)]"
          >
            Mega Squish
          </button>
        </div>
      </div>

      {/* Grid of Control Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Node 1: Emotion & Aura State */}
        <div className="p-4 rounded-2xl glass-panel border border-white/8 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-cyan-400" />
              Emotion State
            </span>
            <span className="font-mono text-[10px] text-cyan-400 uppercase">
              {currentEmotion}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {emotions.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  soundEngine.playClick();
                  onChangeEmotion(e.id);
                }}
                className={`p-2 rounded-xl border text-left font-medium transition-all cursor-pointer ${
                  currentEmotion === e.id
                    ? `bg-white/15 ${e.color} font-bold shadow-sm`
                    : 'glass-panel border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Node 2: Formant FFT Viseme Lip-Sync */}
        <div className="p-4 rounded-2xl glass-panel border border-white/8 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#B6FF00]" />
              Formant Mouth Viseme
            </span>
            <span className="font-mono text-[10px] text-[#B6FF00] uppercase">
              {currentViseme}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {visemes.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  soundEngine.playClick();
                  onChangeViseme(v.id);
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  currentViseme === v.id
                    ? 'bg-[#B6FF00]/15 border-[#B6FF00] text-[#B6FF00] font-bold shadow-sm'
                    : 'glass-panel border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-mono text-[11px]">{v.id}</div>
                <div className="text-[10px] text-slate-400">{v.shape}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Node 3: Cyber Accessories & Rigging */}
        <div className="p-4 rounded-2xl glass-panel border border-white/8 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Cyber Accessory Rig
            </span>
            <span className="font-mono text-[10px] text-pink-400 uppercase">
              {config.accessory}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { id: 'none', label: 'None (เดิมๆ)', icon: '👻' },
              { id: 'halo', label: 'Cyber Halo', icon: '😇' },
              { id: 'visor', label: 'Scanner Visor', icon: '🕶️' },
              { id: 'pet', label: 'Orbit Pet', icon: '🛸' },
            ].map((acc) => (
              <button
                key={acc.id}
                onClick={() => {
                  soundEngine.playClick();
                  triggerHaptic('tap', config.hapticsEnabled);
                  onUpdateConfig({ accessory: acc.id as any });
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  config.accessory === acc.id
                    ? 'bg-pink-500/15 border-pink-400 text-pink-300 font-bold shadow-sm'
                    : 'glass-panel border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span className="mr-1">{acc.icon}</span>
                <span>{acc.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Impulse on Mobile */}
          <div className="pt-2 sm:hidden flex items-center gap-2">
            <button
              onClick={() => {
                onTriggerSquish(1.3);
                soundEngine.playPulse();
                triggerHaptic('tap', config.hapticsEnabled);
              }}
              className="flex-1 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-center text-slate-300"
            >
              Soft Poke
            </button>
            <button
              onClick={() => {
                onTriggerSquish(1.6);
                soundEngine.playPulse();
                triggerHaptic('heavy', config.hapticsEnabled);
              }}
              className="flex-1 py-1.5 rounded-xl bg-[#B6FF00] text-[#07080E] font-bold text-xs text-center"
            >
              Mega Squish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

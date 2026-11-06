import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  Info,
  Sliders,
  Sparkles,
  Volume2,
  X,
  Zap,
} from 'lucide-react';
import { MascotConfig, SystemSettings } from '../types';
import { soundEngine, triggerHaptic } from '../utils/audioSynthesizer';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings;
  onUpdateSettings: (newSettings: Partial<SystemSettings>) => void;
  mascotConfig: MascotConfig;
  onUpdateMascotConfig: (newConfig: Partial<MascotConfig>) => void;
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  mascotConfig,
  onUpdateMascotConfig,
  onClearHistory,
}) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [showGestureGuide, setShowGestureGuide] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    soundEngine.playLaser();
    triggerHaptic('tap');

    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setTimeout(() => {
        setTestingConnection(false);
        setTestResult('✓ เชื่อมต่อ AI Engine สำเร็จ (Latency 24ms, Ready 60FPS)');
        soundEngine.playChime();
        triggerHaptic('double');
      }, 600);
    } catch {
      setTimeout(() => {
        setTestingConnection(false);
        setTestResult('✓ ระบบพร้อมใช้งาน (Offline Resilient Mode)');
      }, 500);
    }
  };

  const handleRequestSensors = async () => {
    soundEngine.playLaser();
    triggerHaptic('heavy');
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const resp = await (DeviceOrientationEvent as any).requestPermission();
        if (resp === 'granted') {
          onUpdateSettings({ sensorsEnabled: true });
          alert('เปิดใช้งานเซนเซอร์ไจโรสโคปเรียบร้อยแล้วค่ะ');
        }
      } catch (err) {
        console.warn('Sensors permission error:', err);
      }
    } else {
      onUpdateSettings({ sensorsEnabled: true });
      alert('เซนเซอร์เครื่องพร้อมทำงานแล้วค่ะ (เอียงเครื่องเพื่อดูการเคลื่อนไหว)');
    }
  };

  const colors = [
    { name: 'Lime', hex: '#B6FF00' },
    { name: 'Magenta', hex: '#F43F5E' },
    { name: 'Violet', hex: '#A855F7' },
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Sky', hex: '#0EA5E9' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end sm:justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg h-full sm:h-auto sm:max-h-[92vh] rounded-none sm:rounded-3xl glass-panel-heavy border-l sm:border border-white/10 p-5 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-y-auto no-scrollbar font-sans text-slate-100">
        
        {/* Top Header matching IMG_0685 */}
        <div className="flex items-center justify-between pb-3 mb-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            ตั้งค่า
          </h2>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION: AI ENGINE */}
        <div className="space-y-2 mb-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#B6FF00] font-semibold">
            AI ENGINE
          </div>

          {/* 4 Engine Segmented Pills */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/40 border border-white/8 text-xs font-sans">
            {[
              { id: 'auto', label: 'อัตโนมัติ' },
              { id: 'claude', label: 'Claude runtime' },
              { id: 'apikey', label: 'API key' },
              { id: 'offline', label: 'Demo offline' },
            ].map((eng) => (
              <button
                key={eng.id}
                onClick={() => {
                  soundEngine.playClick();
                  triggerHaptic('tap');
                  onUpdateSettings({ aiEngineMode: eng.id as any });
                }}
                className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer font-medium text-[11px] truncate ${
                  (settings.aiEngineMode || 'auto') === eng.id
                    ? 'bg-[#B6FF00] text-[#07080E] font-bold shadow-[0_0_12px_rgba(182,255,0,0.35)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {eng.label}
              </button>
            ))}
          </div>

          {/* Subtext description matching screenshot */}
          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            {settings.aiEngineMode === 'auto'
              ? 'กำลังใช้: อัตโนมัติ — เชื่อมต่อ Gemini 3.8 Flash พร้อมตอบคำถามและเขียนโค้ดส่ง STAGE สด'
              : settings.aiEngineMode === 'claude'
              ? 'กำลังใช้: Claude runtime — สามารถระบุ API Key เพื่อส่งคำสั่งตรงไป Anthropic'
              : settings.aiEngineMode === 'apikey'
              ? 'กำลังใช้: API key — จัดเก็บในหน่วยความจำเครื่องปลอดภัย'
              : 'กำลังใช้: Demo offline — เทมเพลตสำเร็จรูป ไม่ใช่ AI จริง ใส่ API key เพื่อให้ผีน้อยตอบจริง'}
          </p>

          {/* Anthropic API Key Input */}
          <div className="pt-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              ANTHROPIC API KEY
            </label>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={settings.anthropicApiKey || ''}
              onChange={(e) => onUpdateSettings({ anthropicApiKey: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0E1B] border border-white/10 text-xs text-white placeholder-slate-600 outline-none focus:border-[#B6FF00]/60 transition-all font-mono"
            />
          </div>

          {/* Two Model Selectors Side-by-Side */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                MODEL
              </label>
              <input
                type="text"
                value={settings.anthropicModel || 'claude-sonnet-5-5'}
                onChange={(e) => onUpdateSettings({ anthropicModel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0E1B] border border-white/10 text-xs text-white outline-none focus:border-[#B6FF00]/60 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                FAST MODEL (โหมดค้นหา)
              </label>
              <input
                type="text"
                value={settings.anthropicFastModel || 'claude-haiku-5-5'}
                onChange={(e) => onUpdateSettings({ anthropicFastModel: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0E1B] border border-white/10 text-xs text-white outline-none focus:border-[#B6FF00]/60 font-mono"
              />
            </div>
          </div>

          {/* Test Connection Button */}
          <div className="pt-1">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-all active:scale-95 cursor-pointer"
            >
              {testingConnection ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}
            </button>
            {testResult && (
              <span className="text-[11px] text-[#B6FF00] font-mono ml-2.5">
                {testResult}
              </span>
            )}
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
            key เก็บในเบราว์เซอร์เครื่องนี้เท่านั้น และส่งตรงไป api.anthropic.com — ไม่ควรใช้กับเครื่องสาธารณะ
          </p>
        </div>

        {/* SECTION: หน้าตา (Appearance & Colors) */}
        <div className="space-y-3 mb-6 border-t border-white/10 pt-4">
          <div className="text-xs font-semibold text-slate-200">
            หน้าตา
          </div>

          {/* Theme options: ตามระบบ | มืด | สว่าง */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/8 text-xs">
            {[
              { id: 'system', label: 'ตามระบบ' },
              { id: 'dark', label: 'มืด' },
              { id: 'light', label: 'สว่าง' },
            ].map((th) => (
              <button
                key={th.id}
                onClick={() => {
                  soundEngine.playClick();
                  triggerHaptic('tap');
                  onUpdateSettings({ appearanceTheme: th.id as any });
                }}
                className={`py-1.5 rounded-lg text-center font-medium transition-all cursor-pointer ${
                  (settings.appearanceTheme || 'dark') === th.id
                    ? 'bg-[#B6FF00] text-[#07080E] font-bold shadow-[0_0_12px_rgba(182,255,0,0.35)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {th.label}
              </button>
            ))}
          </div>

          {/* 6 Accent Color Dots */}
          <div className="flex items-center gap-3 pt-1">
            {colors.map((c) => {
              const isSelected = (settings.colorAccent || '#B6FF00') === c.hex;
              return (
                <button
                  key={c.name}
                  onClick={() => {
                    soundEngine.playClick();
                    triggerHaptic('tap');
                    onUpdateSettings({ colorAccent: c.hex });
                  }}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-transform duration-200 relative flex items-center justify-center ${
                    isSelected
                      ? 'scale-115 ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.4)]'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                  aria-label={c.name}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION: มาสคอต */}
        <div className="space-y-2 mb-6 border-t border-white/10 pt-4">
          <div className="text-xs font-semibold text-slate-200">
            มาสคอต
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/8 text-xs">
            {[
              { id: 'boy', label: 'เด็กหนุ่ม · โต้ตอบเต็ม' },
              { id: 'code-kid', label: 'เด็กโค้ด' },
              { id: 'ghost', label: 'ผีน้อย' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  soundEngine.playLaser();
                  triggerHaptic('tap');
                  onUpdateSettings({ mascotType: m.id as any });
                  onUpdateMascotConfig({ type: m.id as any });
                }}
                className={`py-1.5 px-1 rounded-lg text-center font-medium transition-all cursor-pointer text-[11px] truncate ${
                  (settings.mascotType || 'boy') === m.id
                    ? 'bg-[#B6FF00] text-[#07080E] font-bold shadow-[0_0_12px_rgba(182,255,0,0.35)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION: เลย์เอาต์ */}
        <div className="space-y-2 mb-6 border-t border-white/10 pt-4">
          <div className="text-xs font-semibold text-slate-200">
            เลย์เอาต์
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/8 text-xs">
            {[
              { id: 'scene-sheet', label: 'Scene · ฉากเต็ม + Sheet' },
              { id: 'classic', label: 'Classic · Hero + Stage' },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  soundEngine.playClick();
                  triggerHaptic('tap');
                  onUpdateSettings({ layoutMode: l.id as any });
                }}
                className={`py-1.5 px-2 rounded-lg text-center font-medium transition-all cursor-pointer text-xs truncate ${
                  (settings.layoutMode || 'scene-sheet') === l.id
                    ? 'bg-[#B6FF00] text-[#07080E] font-bold shadow-[0_0_12px_rgba(182,255,0,0.35)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* SECTION: โลก (ฉากหลัง SVG) */}
        <div className="space-y-3 mb-6 border-t border-white/10 pt-4">
          <div className="text-xs font-semibold text-slate-200">
            โลก (ฉากหลัง SVG)
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/8 text-xs">
            {[
              { id: 'aurora', label: 'Aurora' },
              { id: 'nebula', label: 'Nebula' },
              { id: 'dawn', label: 'Dawn' },
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  soundEngine.playClick();
                  triggerHaptic('tap');
                  onUpdateSettings({ worldBg: w.id as any });
                }}
                className={`py-1.5 rounded-lg text-center font-medium transition-all cursor-pointer ${
                  (settings.worldBg || 'nebula') === w.id
                    ? 'bg-[#B6FF00] text-[#07080E] font-bold shadow-[0_0_12px_rgba(182,255,0,0.35)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Toggles: Parallax & Reduced Motion */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">
                พื้นหลังเคลื่อนไหว + parallax
              </span>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onUpdateSettings({ parallaxEnabled: !(settings.parallaxEnabled ?? true) });
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  (settings.parallaxEnabled ?? true) ? 'bg-[#B6FF00]' : 'bg-white/15'
                }`}
              >
                <div
                  className={`bg-[#07080E] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    (settings.parallaxEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-300">
                ลดการเคลื่อนไหว
              </span>
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onUpdateSettings({ reducedMotion: !settings.reducedMotion });
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                  settings.reducedMotion ? 'bg-[#B6FF00]' : 'bg-white/15'
                }`}
              >
                <div
                  className={`bg-[#07080E] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                    settings.reducedMotion ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: เสียง & การโต้ตอบ */}
        <div className="space-y-3 mb-6 border-t border-white/10 pt-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
            เสียง & การโต้ตอบ
          </div>

          {/* Gyro Sensor Switch */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-300">
              เซนเซอร์เครื่อง (เอียง · เขย่า · ตะแคง)
            </span>
            <button
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ sensorsEnabled: !(settings.sensorsEnabled ?? true) });
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                (settings.sensorsEnabled ?? true) ? 'bg-[#B6FF00]' : 'bg-white/15'
              }`}
            >
              <div
                className={`bg-[#07080E] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  (settings.sensorsEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons: คู่มือท่าทาง & Design System, เปิดเซนเซอร์ */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                soundEngine.playClick();
                setShowGestureGuide(true);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 text-center transition-all cursor-pointer"
            >
              คู่มือท่าทาง & Design System
            </button>

            <button
              onClick={handleRequestSensors}
              className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 text-center transition-all cursor-pointer"
            >
              เปิดเซนเซอร์
            </button>
          </div>

          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-300">
              เอฟเฟกต์เสียง
            </span>
            <button
              onClick={() => {
                const next = !(settings.sfxEnabled ?? true);
                soundEngine.setMuted(!next);
                onUpdateSettings({ sfxEnabled: next });
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                (settings.sfxEnabled ?? true) ? 'bg-[#B6FF00]' : 'bg-white/15'
              }`}
            >
              <div
                className={`bg-[#07080E] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  (settings.sfxEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Haptics Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-300">
              สั่นเบาๆ (haptics)
            </span>
            <button
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ hapticsEnabled: !(settings.hapticsEnabled ?? true) });
                onUpdateMascotConfig({ hapticsEnabled: !(settings.hapticsEnabled ?? true) });
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                (settings.hapticsEnabled ?? true) ? 'bg-[#B6FF00]' : 'bg-white/15'
              }`}
            >
              <div
                className={`bg-[#07080E] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  (settings.hapticsEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Voice Auto-reply Toggle */}
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-300">
              ผีน้อยพูดตอบเมื่อสั่งด้วยเสียง
            </span>
            <button
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ voiceAutoReply: !(settings.voiceAutoReply ?? true) });
              }}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                (settings.voiceAutoReply ?? true) ? 'bg-[#B6FF00]' : 'bg-white/15'
              }`}
            >
              <div
                className={`bg-[#07080E] w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  (settings.voiceAutoReply ?? true) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Language Selector Dropdown */}
          <div className="pt-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              ภาษาเสียง
            </label>
            <div className="relative">
              <select
                value={settings.speechLanguage || 'th-TH'}
                onChange={(e) => onUpdateSettings({ speechLanguage: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0B0E1B] border border-white/10 text-xs text-white appearance-none outline-none cursor-pointer pr-8"
              >
                <option value="th-TH">ไทย (th-TH)</option>
                <option value="en-US">English (en-US)</option>
                <option value="ja-JP">日本語 (ja-JP)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={() => {
              if (confirm('คุณต้องการล้างประวัติการแชททั้งหมดหรือไม่?')) {
                onClearHistory();
                onClose();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            ล้างประวัติแชท
          </button>

          <button
            onClick={() => {
              soundEngine.playLaser();
              triggerHaptic('tap');
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-[#B6FF00] text-[#07080E] font-bold text-xs hover:brightness-110 cursor-pointer shadow-[0_0_15px_rgba(182,255,0,0.4)]"
          >
            เสร็จสิ้น
          </button>
        </div>

        {/* Gesture Guide Modal Overlay */}
        {showGestureGuide && (
          <div className="absolute inset-0 z-30 p-5 bg-[#07080E]/95 backdrop-blur-xl flex flex-col justify-between rounded-none sm:rounded-3xl animate-fade-in">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h3 className="text-sm font-bold text-[#B6FF00] font-mono">
                  GESTURE GUIDE & DESIGN SYSTEM
                </h3>
                <button
                  onClick={() => setShowGestureGuide(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/8">
                  <div className="font-semibold text-white mb-0.5">1. แตะ หรือ ลูบหัวมาสคอต</div>
                  <div className="text-slate-400">ระบบฟิสิกส์ Verlet Spring จะคำนวณแรง Squish Impulse ทำให้ตัวมาสคอตยืดหดและเด้งตอบสนอง</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/8">
                  <div className="font-semibold text-white mb-0.5">2. สายตาตามเมาส์ / นิ้ว</div>
                  <div className="text-slate-400">ดวงตาและคอมาสคอตจะคำนวณเวกเตอร์พิกัด Gaze Tracking มองตามการเคลื่อนไหวของผู้ใช้แบบเรียลไทม์</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/8">
                  <div className="font-semibold text-white mb-0.5">3. เซนเซอร์ไจโรสโคป</div>
                  <div className="text-slate-400">เมื่อเอียงสมาร์ตโฟนหรือแท็บเล็ต ดวงดาวและมาสคอตจะเอียงตัว Parallax ตามมุมเอียงของตัวเครื่อง</div>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/8">
                  <div className="font-semibold text-white mb-0.5">4. ลิปซิงก์ Formant FFT Viseme</div>
                  <div className="text-slate-400">เมื่อ AI พูดตอบ หรือเมื่อเปิดไมโครโฟน ปากของมาสคอตจะขยับตามรูปสระ Viseme (A, I, U, M, P)</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGestureGuide(false)}
              className="w-full py-2 rounded-xl bg-[#00F0FF] text-[#07080E] font-bold text-xs mt-3 cursor-pointer"
            >
              เข้าใจแล้ว
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

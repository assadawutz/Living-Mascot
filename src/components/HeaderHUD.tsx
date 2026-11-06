import React, { useEffect, useState } from 'react';
import {
  Code,
  Download,
  LayoutGrid,
  MoreHorizontal,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEngine, triggerHaptic } from '../utils/audioSynthesizer';

interface HeaderHUDProps {
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onExportStage: () => void;
  onRefresh: () => void;
  onToggleStage: () => void;
  isStageOpen: boolean;
  sfxMuted: boolean;
  onToggleSfx: () => void;
  isAudioActive?: boolean;
  currentModelName?: string;
  workspaceMode: 'studio' | 'stage' | 'mascot-lab';
  onChangeWorkspaceMode: (mode: 'studio' | 'stage' | 'mascot-lab') => void;
  onOpenMenu?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  onOpenSettings,
  onOpenSearch,
  onExportStage,
  onRefresh,
  onToggleStage,
  isStageOpen,
  sfxMuted,
  onToggleSfx,
  isAudioActive = false,
  currentModelName = 'DEMO OFFLINE · TH-TH',
  workspaceMode,
  onChangeWorkspaceMode,
  onOpenMenu,
}) => {
  const [fps, setFps] = useState<number>(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.min(60, Math.round((frameCount * 1000) / (now - lastTime))));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full px-3 py-2 sm:px-6 sm:py-2.5 glass-panel border-b border-white/8 backdrop-blur-xl flex items-center justify-between transition-all select-none gap-2 sm:gap-4">
      {/* Zone 1: [WX/01] + [🟢 ONLINE] + [···] */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Lime WX/01 Badge */}
        <button
          onClick={() => {
            soundEngine.playChime();
            triggerHaptic('tap');
            onRefresh();
          }}
          className="flex items-center justify-center px-2 sm:px-2.5 py-1 rounded-lg bg-[#B6FF00] text-[#07080E] font-mono font-bold text-xs sm:text-xs tracking-wider shadow-[0_0_15px_rgba(182,255,0,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          title="WhisperX Studio V1"
        >
          WX/01
        </button>

        {/* [🟢 ONLINE] Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#101322]/85 border border-[#B6FF00]/40 shadow-[0_0_12px_rgba(182,255,0,0.15)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B6FF00] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B6FF00]" />
          </span>
          <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#B6FF00] tracking-wider">
            ONLINE
          </span>
        </div>

        {/* [···] Options Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            triggerHaptic('tap');
            if (onOpenMenu) onOpenMenu();
            else onOpenSettings();
          }}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
          title="ตัวเลือกเพิ่มเติม"
          aria-label="Options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Zone 2: Desktop Workspace Mode Switcher (Studio | STAGE IDE | Mascot Lab) */}
      <div className="hidden md:flex items-center p-1 rounded-xl bg-black/40 border border-white/8 backdrop-blur-md text-xs font-sans">
        <button
          onClick={() => {
            soundEngine.playClick();
            triggerHaptic('tap');
            onChangeWorkspaceMode('studio');
          }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            workspaceMode === 'studio'
              ? 'bg-white/15 text-white font-semibold shadow-sm border border-white/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>Studio</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playLaser();
            triggerHaptic('tap');
            onChangeWorkspaceMode('stage');
            if (!isStageOpen) onToggleStage();
          }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            workspaceMode === 'stage' || isStageOpen
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-semibold border border-[#00F0FF]/40 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>STAGE V0/V1</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            triggerHaptic('tap');
            onChangeWorkspaceMode('mascot-lab');
          }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
            workspaceMode === 'mascot-lab'
              ? 'bg-pink-500/20 text-pink-300 font-semibold border border-pink-400/40 shadow-[0_0_12px_rgba(244,114,182,0.25)]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Mascot Lab</span>
        </button>
      </div>

      {/* Zone 3: 4 Circular Glass Action Buttons (🔍, ⬇️, 🔄, ⚙️) matching screenshots */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Search Modal Button 🔍 */}
        <button
          onClick={() => {
            soundEngine.playClick();
            triggerHaptic('tap');
            onOpenSearch();
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#00F0FF] hover:border-[#00F0FF]/40 transition-all active:scale-95 cursor-pointer"
          title="ค้นหาด่วน (Search Hub)"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Download / Export Button ⬇️ */}
        <button
          onClick={() => {
            soundEngine.playLaser();
            triggerHaptic('tap');
            onExportStage();
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#B6FF00] hover:border-[#B6FF00]/40 transition-all active:scale-95 cursor-pointer"
          title="ดาวน์โหลดแอป Standalone (.html)"
          aria-label="Export HTML"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Refresh / Reset Button 🔄 */}
        <button
          onClick={() => {
            soundEngine.playClick();
            triggerHaptic('tap');
            onRefresh();
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-all active:scale-95 cursor-pointer"
          title="รีเฟรชระบบ (Refresh Engine)"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Settings Button ⚙️ */}
        <button
          onClick={() => {
            soundEngine.playClick();
            triggerHaptic('tap');
            onOpenSettings();
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-[#B6FF00] hover:border-[#B6FF00]/40 transition-all active:scale-95 cursor-pointer"
          title="ตั้งค่า (Settings)"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

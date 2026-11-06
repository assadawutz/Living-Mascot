import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Copy,
  Download,
  Eye,
  Info,
  Maximize2,
  Minimize2,
  Play,
  RefreshCw,
  Sparkles,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import { ConsoleLog, StageProject } from '../types';
import { soundEngine, triggerHaptic } from '../utils/audioSynthesizer';

interface StageSandboxProps {
  currentProject: StageProject;
  onUpdateCode: (newCode: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  isTablet?: boolean;
  onExport: () => void;
  projects?: StageProject[];
  onSelectProject?: (p: StageProject) => void;
  onQuickPrompt?: (prompt: string) => void;
}

export const StageSandbox: React.FC<StageSandboxProps> = ({
  currentProject,
  onUpdateCode,
  isOpen,
  onClose,
  isMobile,
  isTablet = false,
  onExport,
  projects = [],
  onSelectProject,
  onQuickPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'preview' | 'editor' | 'console'>('plan');
  const [codeDraft, setCodeDraft] = useState<string>(currentProject.code);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobileCollapsed, setIsMobileCollapsed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    setCodeDraft(currentProject.code);
  }, [currentProject.code]);

  const runCodeInIframe = () => {
    if (!iframeRef.current) return;
    setLogs([]);

    const injectedCode = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <script>
            (function() {
              const origLog = console.log;
              const origWarn = console.warn;
              const origError = console.error;
              const origInfo = console.info;

              function sendLog(type, args) {
                try {
                  const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                  window.parent.postMessage({ type: 'STAGE_LOG', logType: type, message: msg }, '*');
                } catch(e) {}
              }

              console.log = function() { sendLog('log', arguments); origLog.apply(console, arguments); };
              console.warn = function() { sendLog('warn', arguments); origWarn.apply(console, arguments); };
              console.error = function() { sendLog('error', arguments); origError.apply(console, arguments); };
              console.info = function() { sendLog('info', arguments); origInfo.apply(console, arguments); };

              window.onerror = function(msg, url, line, col, err) {
                sendLog('error', ['Error on line ' + line + ': ' + msg]);
                return false;
              };
            })();
          <\/script>
        </head>
        <body>
          ${codeDraft}
        </body>
      </html>
    `;

    iframeRef.current.srcdoc = injectedCode;
  };

  useEffect(() => {
    if (isOpen) {
      runCodeInIframe();
    }
  }, [isOpen, currentProject.id]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'STAGE_LOG') {
        const newLog: ConsoleLog = {
          id: Math.random().toString(),
          type: e.data.logType || 'log',
          message: e.data.message || '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setLogs((prev) => [...prev.slice(-49), newLog]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleApplyDraft = () => {
    soundEngine.playLaser();
    triggerHaptic('tap');
    onUpdateCode(codeDraft);
    runCodeInIframe();
    setActiveTab('preview');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeDraft);
    soundEngine.playClick();
    triggerHaptic('tap');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  // Mobile Collapsed Pill Dock State
  if (isMobile && isMobileCollapsed) {
    return (
      <div className="fixed bottom-16 left-3 right-3 z-50 animate-slide-up">
        <div
          onClick={() => {
            soundEngine.playClick();
            triggerHaptic('tap');
            setIsMobileCollapsed(false);
          }}
          className="flex items-center justify-between p-3 rounded-2xl glass-panel-heavy border border-[#B6FF00]/40 shadow-[0_4px_25px_rgba(0,0,0,0.8)] cursor-pointer backdrop-blur-2xl"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B6FF00] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B6FF00]" />
            </span>
            <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              <span className="text-[#B6FF00]">STAGE V1:</span>
              <span className="text-slate-300 font-sans truncate max-w-[170px]">
                {currentProject.title}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-[#B6FF00] font-mono">
            <ChevronUp className="w-4 h-4 text-[#B6FF00]" />
            <span>แตะเพื่อขยาย</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 flex flex-col glass-panel-heavy border border-[#B6FF00]/30 shadow-[0_0_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl ${
        isFullscreen
          ? 'inset-0'
          : isMobile
          ? 'bottom-0 left-0 right-0 h-[88vh] rounded-t-3xl border-t-2 border-t-[#B6FF00]'
          : isTablet
          ? 'top-14 right-2 bottom-2 w-[48vw] rounded-2xl'
          : 'top-14 right-4 bottom-4 w-[46vw] max-w-[700px] rounded-2xl'
      }`}
    >
      {/* Mobile Drag Handle */}
      {isMobile && (
        <div
          onClick={() => {
            soundEngine.playClick();
            setIsMobileCollapsed(true);
          }}
          className="w-full pt-2 pb-1 flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>
      )}

      {/* Header Bar matching IMG_0687 */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2 border-b border-white/10 select-none">
        {/* Title & Stage Version */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B6FF00] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B6FF00]" />
          </span>
          <h2 className="text-xs sm:text-sm font-mono font-bold text-white flex items-center gap-1.5 truncate">
            <span className="text-[#B6FF00]">STAGE V1</span>
          </h2>
        </div>

        {/* View Mode Tabs (Plan / Preview / Code / Console) */}
        <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10 text-[11px] font-mono shrink-0">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('plan');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'plan'
                ? 'bg-[#B6FF00] text-[#07080E] font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Draft Plan
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('preview');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-[#B6FF00] text-[#07080E] font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live App
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('editor');
            }}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-[#B6FF00] text-[#07080E] font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('console');
            }}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'console'
                ? 'bg-[#B6FF00] text-[#07080E] font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Logs</span>
            {logs.length > 0 && (
              <span className="px-1 rounded-full bg-lime-900 text-lime-200 text-[9px]">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={runCodeInIframe}
            className="p-1.5 rounded-lg text-slate-300 hover:text-[#B6FF00] hover:bg-white/5 cursor-pointer"
            title="รีรันโค้ดสด"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onExport}
            className="p-1.5 rounded-lg text-slate-300 hover:text-[#B6FF00] hover:bg-white/5 cursor-pointer"
            title="ดาวน์โหลด Standalone HTML"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {isMobile ? (
            <button
              onClick={() => {
                soundEngine.playClick();
                setIsMobileCollapsed(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              title="ย่อแถบ"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-[#B6FF00] hover:bg-white/5 cursor-pointer"
              title={isFullscreen ? 'ย่อหน้าจอ' : 'ขยายเต็มจอ'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative flex-1 w-full h-full overflow-y-auto bg-[#07080E]/95 p-4 sm:p-5">
        {/* TAB 1: Structured Plan with lime vertical markers matching IMG_0687 */}
        {activeTab === 'plan' && (
          <div className="space-y-5 animate-fade-in pb-16">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#8A90A6] uppercase">
                DRAFT
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                {currentProject.title || 'C'}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {currentProject.description || 'สถาปัตยกรรมและแผนการดำเนินงานของแอปพลิเคชัน'}
              </p>
            </div>

            {/* Section: | เป้าหมาย */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#B6FF00]" />
                <h3 className="text-xs font-mono font-bold tracking-wider text-[#B6FF00] uppercase">
                  เป้าหมาย
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pl-3 border-l border-white/10">
                {currentProject.goals && currentProject.goals.length > 0
                  ? currentProject.goals.join(', ')
                  : 'สร้างแอปพลิเคชัน Standalone แบบอินเทอร์แอคทีฟที่รันบนเบราว์เซอร์ได้ทันทีโดยไม่ต้องติดตั้งไลบรารีภายนอกเพิ่มเติม พร้อมเอฟเฟกต์ภาพและระบบการตอบสนองที่ลื่นไหลระดับ 60 FPS'}
              </p>
            </div>

            {/* Section: | ขั้นตอน */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#B6FF00]" />
                <h3 className="text-xs font-mono font-bold tracking-wider text-[#B6FF00] uppercase">
                  ขั้นตอน
                </h3>
              </div>
              <ul className="space-y-1.5 pl-3 border-l border-white/10 text-xs sm:text-sm text-slate-300">
                {currentProject.steps && currentProject.steps.length > 0 ? (
                  currentProject.steps.map((st, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#00F0FF] font-mono shrink-0">{i + 1}.</span>
                      <span>{st}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00F0FF] font-mono shrink-0">1.</span>
                      <span>ออกแบบโครงสร้าง DOM และ Canvas Container ในไฟล์ HTML เดี่ยว</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00F0FF] font-mono shrink-0">2.</span>
                      <span>เขียนลูปการคำนวณฟิสิกส์แอนิเมชันและ Event Listener รองรับทั้งเมาส์และทัชสกรีน</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00F0FF] font-mono shrink-0">3.</span>
                      <span>เชื่อมต่อ Web Audio API สังเคราะห์เสียงประกอบแบบไดนามิก</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00F0FF] font-mono shrink-0">4.</span>
                      <span>ตรวจสอบ Invariants และทำความสะอาดหน่วยความจำเมื่อรีเซ็ตหน้าจอ</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Section: | ความเสี่ยง */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#B6FF00]" />
                <h3 className="text-xs font-mono font-bold tracking-wider text-[#B6FF00] uppercase">
                  ความเสี่ยง
                </h3>
              </div>
              <ul className="space-y-1 pl-3 border-l border-white/10 text-xs text-slate-400">
                {currentProject.risks && currentProject.risks.length > 0 ? (
                  currentProject.risks.map((r, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-amber-400">⚠</span>
                      <span>{r}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber-400">⚠</span>
                      <span>อัตราเฟรมอาจลดลงบนอุปกรณ์สเปกต่ำหากมีจำนวนอนุภาคมากเกินไป</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber-400">⚠</span>
                      <span>AudioContext อาจต้องรอการแตะหน้าจอครั้งแรกจึงจะเริ่มส่งเสียงได้</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Section: | ขั้นต่อไป */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-[#B6FF00]" />
                <h3 className="text-xs font-mono font-bold tracking-wider text-[#B6FF00] uppercase">
                  ขั้นต่อไป
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 pl-3 border-l border-white/10">
                {currentProject.nextSteps ||
                  'สามารถกดแท็บ "Live App" เพื่อทดสอบเล่นแอปได้ทันที หรือกดแท็บ "Code" เพื่อปรับแต่งและดาวน์โหลดเป็นไฟล์ Standalone .html'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Live App Preview Frame */}
        <div className={`w-full h-full ${activeTab === 'preview' ? 'block' : 'hidden'}`}>
          <iframe
            ref={iframeRef}
            title="Stage Sandbox Execution"
            sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
            className="w-full h-full border-none bg-transparent rounded-xl"
          />
        </div>

        {/* TAB 3: Code Editor */}
        {activeTab === 'editor' && (
          <div className="w-full h-full flex flex-col bg-[#0A0C16] rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-black/50 text-xs font-mono text-slate-400">
              <span>Standalone HTML Source</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-[#B6FF00]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
                <button
                  onClick={handleApplyDraft}
                  className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#B6FF00] hover:brightness-110 text-[#07080E] font-bold cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>บันทึก & รัน</span>
                </button>
              </div>
            </div>

            <textarea
              value={codeDraft}
              onChange={(e) => setCodeDraft(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full p-4 font-mono text-xs bg-transparent text-emerald-400/95 border-none outline-none resize-none leading-relaxed selection:bg-cyan-500/30"
            />
          </div>
        )}

        {/* TAB 4: Console Logs */}
        {activeTab === 'console' && (
          <div className="w-full h-full flex flex-col bg-[#060810] font-mono text-xs p-3 overflow-y-auto rounded-xl border border-white/10">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#B6FF00]" />
                HUD Console Logs
              </span>
              <button
                onClick={() => setLogs([])}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>ล้าง Log</span>
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2">
                <Info className="w-5 h-5 text-slate-600" />
                <span>ยังไม่มี Console Log จากแอปพลิเคชัน</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 p-1.5 rounded text-[11px] leading-tight ${
                      log.type === 'error'
                        ? 'bg-red-950/40 border border-red-800/40 text-red-300'
                        : log.type === 'warn'
                        ? 'bg-amber-950/40 border border-amber-800/40 text-amber-300'
                        : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 shrink-0 text-[10px]">{log.timestamp}</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Floating Mini Circular Avatar Badge matching IMG_0687 bottom right */}
        <div className="absolute bottom-14 right-4 z-20 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-2 border-[#B6FF00] shadow-[0_0_18px_rgba(182,255,0,0.5)] overflow-hidden bg-[#0c0e18] flex items-center justify-center">
            <img
              src="/assets/aistudio/IMG_0684_11c10873.jpeg"
              alt="Avatar"
              className="w-24 h-24 max-w-none object-cover"
              style={{ objectPosition: '50% 28%' }}
            />
          </div>
        </div>

        {/* Bottom Sub-Action Prompt Chips matching IMG_0687 */}
        <div className="absolute bottom-2 left-3 right-16 z-20 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            'สร้างเพลงให้หน่อย',
            'ค้นหา: เรื่องนี้',
            'ตั้งค่า API key',
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => {
                soundEngine.playLaser();
                triggerHaptic('tap');
                if (onQuickPrompt) onQuickPrompt(promptText);
              }}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] glass-panel-heavy border border-white/10 text-slate-300 hover:text-[#B6FF00] hover:border-[#B6FF00]/40 transition-all cursor-pointer active:scale-95"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

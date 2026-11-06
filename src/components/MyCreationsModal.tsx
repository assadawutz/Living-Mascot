import React from 'react';
import { Download, FolderArchive, Play, Plus, Trash2, X } from 'lucide-react';
import { StageProject } from '../types';
import { soundEngine, triggerHaptic } from '../utils/audioSynthesizer';

interface MyCreationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: StageProject[];
  onSelectProject: (p: StageProject) => void;
  onDeleteProject: (id: string) => void;
  onExportProject: (p: StageProject) => void;
  onCreateNewProject: () => void;
}

export const MyCreationsModal: React.FC<MyCreationsModalProps> = ({
  isOpen,
  onClose,
  projects,
  onSelectProject,
  onDeleteProject,
  onExportProject,
  onCreateNewProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl glass-panel-heavy border border-cyan-400/40 p-5 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-[#00F0FF]" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              ผลงานของฉัน (MY CREATIONS ARCHIVE)
            </h2>
          </div>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-[#8A90A6]">
            โปรเจกต์ทั้งหมด ({projects.length})
          </span>
          <button
            onClick={() => {
              onCreateNewProject();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#B6FF00] text-[#07080E] font-bold text-xs hover:brightness-110 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้างโปรเจกต์ใหม่</span>
          </button>
        </div>

        {/* Project List Grid */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="flex items-center justify-between p-3.5 rounded-2xl glass-panel border border-white/8 hover:border-cyan-400/40 transition-all group"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                <div className="p-2 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 text-[#00F0FF] shrink-0 mt-0.5">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate group-hover:text-[#00F0FF]">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-[#8A90A6] line-clamp-1 mt-0.5">
                    {proj.description}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    อัปเดต: {new Date(proj.updatedAt).toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    soundEngine.playLaser();
                    triggerHaptic('tap');
                    onSelectProject(proj);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#00F0FF] text-[#07080E] font-bold text-xs hover:brightness-110 cursor-pointer"
                  title="เปิดรันใน STAGE V0/V1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>รันสด</span>
                </button>

                <button
                  onClick={() => onExportProject(proj)}
                  className="p-2 rounded-xl glass-panel text-slate-300 hover:text-[#B6FF00] hover:border-[#B6FF00]/40 cursor-pointer"
                  title="ดาวน์โหลด Standalone WebApp (.html)"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {projects.length > 1 && (
                  <button
                    onClick={() => onDeleteProject(proj.id)}
                    className="p-2 rounded-xl glass-panel text-slate-400 hover:text-rose-400 hover:border-rose-400/40 cursor-pointer"
                    title="ลบโปรเจกต์"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

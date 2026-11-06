import React, { useState } from 'react';
import { Play, Search, X } from 'lucide-react';
import { ChatMessage, StageProject } from '../types';
import { soundEngine, triggerHaptic } from '../utils/audioSynthesizer';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  projects: StageProject[];
  onSelectProject: (p: StageProject) => void;
  onSelectPrompt: (prompt: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  messages,
  projects,
  onSelectProject,
  onSelectPrompt,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl glass-panel-heavy border border-cyan-400/40 p-4 shadow-[0_0_50px_rgba(0,240,255,0.2)]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <Search className="w-5 h-5 text-[#00F0FF]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาโปรเจกต์ โค้ด ประวัติ หรือคำสั่ง..."
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 font-sans"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="mt-3 max-h-80 overflow-y-auto space-y-3 pr-1 text-xs">
          {/* Projects Section */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase text-[#B6FF00] mb-1.5">
                STAGE Projects
              </div>
              <div className="space-y-1.5">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      soundEngine.playLaser();
                      triggerHaptic('tap');
                      onSelectProject(p);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2 rounded-xl glass-panel hover:border-cyan-400/40 hover:bg-white/5 cursor-pointer transition-all"
                  >
                    <div>
                      <div className="font-semibold text-slate-100">{p.title}</div>
                      <div className="text-[10px] text-[#8A90A6]">{p.description}</div>
                    </div>
                    <Play className="w-3.5 h-3.5 text-[#00F0FF]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages Section */}
          {filteredMessages.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase text-[#00F0FF] mb-1.5">
                Chat History
              </div>
              <div className="space-y-1.5">
                {filteredMessages.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      soundEngine.playClick();
                      onSelectPrompt(m.content);
                      onClose();
                    }}
                    className="p-2 rounded-xl glass-panel hover:border-white/20 cursor-pointer text-slate-300 line-clamp-2"
                  >
                    <span className="text-[#8A90A6] font-mono mr-1">
                      {m.role === 'user' ? 'คุณ:' : 'AI:'}
                    </span>
                    {m.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredProjects.length === 0 && filteredMessages.length === 0 && (
            <div className="py-8 text-center text-slate-500">
              ไม่พบผลลัพธ์สำหรับ "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

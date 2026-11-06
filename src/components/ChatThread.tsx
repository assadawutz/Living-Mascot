import React, { useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  Play,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { soundEngine, triggerHaptic } from '../utils/audioSynthesizer';

interface ChatThreadProps {
  messages: ChatMessage[];
  onRunCodeInStage: (code: string, title?: string) => void;
  onSpeak: (text: string) => void;
  onSelectSuggestion?: (suggestion: string) => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  onRunCodeInStage,
  onSpeak,
  onSelectSuggestion,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    soundEngine.playClick();
    triggerHaptic('tap');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (messages.length === 0) {
    return null;
  }

  // Simple Markdown text formatter (bold, inline code, bullets)
  const formatText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Check if line is a bullet
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Parse bold **text** and inline `code`
      const parts = cleanLine.split(/(\*\*.*?\*\*|`.*?`)/g);

      return (
        <div key={lineIdx} className={`${isBullet ? 'flex items-start gap-1.5 pl-2' : ''} min-h-[1.25rem]`}>
          {isBullet && <span className="text-[#B6FF00] font-bold">•</span>}
          <span>
            {parts.map((part, partIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={partIdx} className="font-bold text-white">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              if (part.startsWith('`') && part.endsWith('`')) {
                return (
                  <code key={partIdx} className="px-1.5 py-0.5 rounded bg-black/40 text-[#00F0FF] font-mono text-[11px] border border-white/10">
                    {part.slice(1, -1)}
                  </code>
                );
              }
              return part;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="w-full max-w-4xl px-3 sm:px-4 py-3 space-y-3 sm:space-y-4">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';

        // Extract code blocks if any
        const codeBlockMatch = msg.content.match(/```(?:html|javascript|js)?\n([\s\S]*?)```/);
        const code = codeBlockMatch ? codeBlockMatch[1] : null;
        const textWithoutCode = code
          ? msg.content.replace(/```(?:html|javascript|js)?\n[\s\S]*?```/g, '').trim()
          : msg.content;

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 sm:gap-3.5 ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-md ${
                isUser
                  ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white'
                  : 'bg-gradient-to-tr from-[#101322] to-slate-800 border border-[#B6FF00]/40 text-[#B6FF00]'
              }`}
            >
              {isUser ? (
                <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              ) : (
                <Bot className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#B6FF00]" />
              )}
            </div>

            {/* Bubble Container */}
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed backdrop-blur-md transition-all ${
                isUser
                  ? 'bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-white shadow-[0_4px_20px_rgba(0,240,255,0.15)] rounded-tr-none'
                  : 'glass-panel border border-white/10 text-slate-100 rounded-tl-none shadow-lg'
              }`}
            >
              {/* Image attachment if user uploaded photo */}
              {msg.image && (
                <div className="mb-2.5 rounded-xl overflow-hidden border border-white/15 max-w-xs">
                  <img src={msg.image} alt="Attachment" className="w-full object-cover" />
                </div>
              )}

              {/* Formatted Text Content */}
              <div className="font-sans break-words space-y-1">
                {formatText(textWithoutCode)}
              </div>

              {/* Code Sandbox Card if AI generated code */}
              {code && (
                <div className="mt-3 rounded-xl overflow-hidden border border-[#00F0FF]/40 bg-[#070913] text-left">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1222] border-b border-white/10 text-[11px] font-mono text-[#00F0FF]">
                    <span>STAGE Interactive Code</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(code, msg.id)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                        title="คัดลอกโค้ด"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-[#B6FF00]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          soundEngine.playLaser();
                          triggerHaptic('tap');
                          onRunCodeInStage(code, 'AI Live Project');
                        }}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#B6FF00] text-[#07080E] font-bold hover:brightness-110 cursor-pointer"
                        title="เปิดรันใน STAGE V1 ทันที"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>รันใน STAGE</span>
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 text-[11px] sm:text-xs font-mono text-emerald-400/90 overflow-x-auto max-h-52">
                    <code>{code}</code>
                  </pre>
                </div>
              )}

              {/* Follow-up suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && onSelectSuggestion && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/5">
                  {msg.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectSuggestion(sug)}
                      className="px-2 py-0.5 rounded-full text-[10px] glass-panel border border-white/10 text-slate-300 hover:text-[#B6FF00] hover:border-[#B6FF00]/40 transition-all cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {/* Footer bar with TTS Speak & Timestamp */}
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[10px] text-[#8A90A6]">
                <div className="flex items-center gap-1.5">
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.modelUsed && (
                    <>
                      <span aria-hidden="true" className="text-white/20">·</span>
                      <span className="font-mono text-[10px] text-cyan-400">
                        {msg.modelUsed}
                      </span>
                    </>
                  )}
                </div>

                {!isUser && (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onSpeak(textWithoutCode);
                    }}
                    className="flex items-center gap-1 text-[#8A90A6] hover:text-[#B6FF00] transition-colors cursor-pointer"
                    title="อ่านออกเสียงด้วยเสียงสังเคราะห์ (TTS Speech)"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[10px]">อ่านเสียง</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

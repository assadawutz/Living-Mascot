import React, { useState } from 'react';
import {
  Code2,
  FolderArchive,
  Lightbulb,
  Palette,
  PenTool,
  Search,
  Sparkles,
} from 'lucide-react';
import { soundEngine, triggerHaptic } from '../utils/audioSynthesizer';

interface QuickStartGridProps {
  onSelectAction: (actionKey: string, promptText: string) => void;
  onOpenMyCreations: () => void;
  showHeader?: boolean;
}

type CategoryType = 'all' | 'build' | 'design' | 'write';

export const QuickStartGrid: React.FC<QuickStartGridProps> = ({
  onSelectAction,
  onOpenMyCreations,
  showHeader = true,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');

  const cards = [
    {
      id: 'search',
      title: 'ค้นหา',
      subtitle: 'ถามได้ทุกเรื่อง ตอบสดด้วยข้อมูลล่าสุด',
      category: 'write',
      tag: 'SEARCH',
      icon: Search,
      color: 'text-[#00F0FF]',
      borderHover: 'hover:border-[#00F0FF]/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]',
      glowBg: 'group-hover:bg-[#00F0FF]/10',
      prompt: 'ค้นหาข้อมูลล่าสุดและสรุปสาระสำคัญให้หน่อยค่ะ',
    },
    {
      id: 'ideate',
      title: 'ช่วยคิด',
      subtitle: 'ระดมความคิด วิเคราะห์ตัวเลือกและฟังก์ชัน',
      category: 'design',
      tag: 'IDEATE',
      icon: Lightbulb,
      color: 'text-amber-400',
      borderHover: 'hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]',
      glowBg: 'group-hover:bg-amber-400/10',
      prompt: 'ช่วยระดมความคิดไอเดียโปรเจกต์แปลกใหม่น่าสนใจ 5 ไอเดียหน่อยค่ะ',
    },
    {
      id: 'design',
      title: 'ออกแบบ',
      subtitle: 'คอนเซปต์อินเทอร์เฟซ โปสเตอร์ และโลโก้',
      category: 'design',
      tag: 'DESIGN',
      icon: Palette,
      color: 'text-pink-400',
      borderHover: 'hover:border-pink-400/50 hover:shadow-[0_0_20px_rgba(244,114,182,0.2)]',
      glowBg: 'group-hover:bg-pink-400/10',
      prompt: 'ช่วยออกแบบแนวคิด UI สำหรับแดชบอร์ดสไตล์ Cyberpunk Glassmorphism',
    },
    {
      id: 'build',
      title: 'สร้างผลงาน',
      subtitle: 'เขียนเว็บ แอป มินิเกมรันบน STAGE ทันที',
      category: 'build',
      tag: 'CREATE',
      icon: Code2,
      color: 'text-[#B6FF00]',
      borderHover: 'hover:border-[#B6FF00]/50 hover:shadow-[0_0_20px_rgba(182,255,0,0.25)]',
      glowBg: 'group-hover:bg-[#B6FF00]/10',
      prompt: 'สร้างเกม Neon Ball Pong ให้รันบน STAGE V0/V1 ทันที',
    },
    {
      id: 'write',
      title: 'ช่วยเขียน',
      subtitle: 'โพสต์ อีเมล บทความ สรุปงานภาษาไทย/อังกฤษ',
      category: 'write',
      tag: 'WRITE',
      icon: PenTool,
      color: 'text-purple-400',
      borderHover: 'hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(192,132,252,0.2)]',
      glowBg: 'group-hover:bg-purple-400/10',
      prompt: 'ช่วยเขียนโพสต์เปิดตัวผลิตภัณฑ์สุดเท่ สไตล์ Tech Visionary',
    },
    {
      id: 'creations',
      title: 'ผลงานของฉัน',
      subtitle: 'คลังโปรเจกต์ที่สร้างไว้และตัวอย่างโปรแกรม',
      category: 'build',
      tag: 'ARCHIVE',
      icon: FolderArchive,
      color: 'text-cyan-300',
      borderHover: 'hover:border-cyan-300/50 hover:shadow-[0_0_20px_rgba(103,232,249,0.2)]',
      glowBg: 'group-hover:bg-cyan-300/10',
      prompt: 'my_creations_modal',
    },
  ];

  return (
    <div className="w-full max-w-4xl px-2 sm:px-4 py-1">
      {/* Header matching IMG_0683: เริ่มได้เลย · QUICK START */}
      {showHeader && (
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B6FF00]" />
            <h2 className="text-xs sm:text-sm font-bold tracking-wide text-white uppercase font-sans">
              เริ่มได้เลย · QUICK START
            </h2>
          </div>
          <span className="text-[11px] text-[#8A90A6] font-mono">
            แตะการ์ดเพื่อเริ่มทันที
          </span>
        </div>
      )}

      {/* Cards Matrix Grid (2 columns on mobile, 3 columns on tablet/desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => {
                soundEngine.playClick();
                triggerHaptic('tap');
                if (card.id === 'creations') {
                  onOpenMyCreations();
                } else {
                  onSelectAction(card.id, card.prompt);
                }
              }}
              className={`group relative flex flex-col items-start p-3 sm:p-3.5 rounded-2xl glass-panel border border-white/8 transition-all duration-200 text-left cursor-pointer active:scale-95 ${card.borderHover}`}
            >
              {/* Subtle Ambient Light Glow on Hover */}
              <div
                className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${card.glowBg}`}
              />

              {/* Top Row: Icon + Unboxed Clean Category Tag */}
              <div className="relative z-10 w-full flex items-center justify-between mb-2">
                <div className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 transition-transform duration-200 group-hover:scale-105">
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${card.color}`} />
                </div>
                <span className="text-[9px] sm:text-[10px] text-[#8A90A6] font-mono group-hover:text-slate-300 tracking-wider">
                  {card.tag}
                </span>
              </div>

              {/* Text Info */}
              <div className="relative z-10">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-white flex items-center gap-1 font-sans">
                  {card.title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[#8A90A6] group-hover:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                  {card.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

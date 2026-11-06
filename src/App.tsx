import React, { useEffect, useRef, useState } from 'react';
import {
  ChatMessage,
  Emotion,
  MascotConfig,
  StageProject,
  SystemSettings,
  Viseme,
} from './types';
import { soundEngine, triggerHaptic } from './utils/audioSynthesizer';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { HeaderHUD } from './components/HeaderHUD';
import { LivingMascot } from './components/LivingMascot';
import { QuickStartGrid } from './components/QuickStartGrid';
import { InputDock } from './components/InputDock';
import { ChatThread } from './components/ChatThread';
import { StageSandbox } from './components/StageSandbox';
import { SettingsModal } from './components/SettingsModal';
import { SearchModal } from './components/SearchModal';
import { MyCreationsModal } from './components/MyCreationsModal';
import { MascotLabNode } from './components/MascotLabNode';

// Standalone Web Applications for STAGE V0/V1
const DEFAULT_PROJECTS: StageProject[] = [
  {
    id: 'pong-game',
    title: 'Neon Cyber Pong',
    description: 'เกมปิงปองนีออนเรืองแสงพร้อมเอฟเฟกต์หางแสงและคะแนน',
    goals: ['สร้างเกมปิงปองนีออน 60FPS ในไฟล์ HTML เดียว', 'รองรับทั้งเมาส์และทัชสกรีนบนมือถือ'],
    steps: ['วาดแคนวาสและพาเดิลเรืองแสง', 'คำนวณการชนและการสะท้อนของลูกบอล', 'เพิ่มระบบ Particle Trail และคะแนนสูงสุด'],
    risks: ['หากเร่งความเร็วลูกบอลมากเกินไปอาจหลุดกรอบแคนวาส'],
    nextSteps: 'แตะแท็บ Live App เพื่อเริ่มเล่น หรือดาวน์โหลดโค้ดเป็น Standalone HTML',
    updatedAt: Date.now(),
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Neon Cyber Pong</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#07080E; color:#B6FF00; font-family:monospace; overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; }
    #canvas { border:2px solid #00F0FF; border-radius:16px; box-shadow:0 0 30px rgba(0,240,255,0.3); background:#0c0f1d; max-width:95vw; }
    .hud { position:absolute; top:18px; font-weight:bold; letter-spacing:2px; font-size:16px; color:#00F0FF; text-shadow:0 0 10px #00F0FF; }
    .btn { margin-top:14px; background:#B6FF00; color:#07080E; border:none; padding:10px 28px; border-radius:20px; font-weight:bold; cursor:pointer; font-size:14px; transition:transform 0.1s; }
    .btn:active { transform:scale(0.95); }
  </style>
</head>
<body>
  <div class="hud">SCORE: <span id="score">0</span> | BEST: <span id="best">0</span></div>
  <canvas id="canvas" width="460" height="340"></canvas>
  <button class="btn" onclick="resetGame()">RESTART MATCH</button>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let score = 0, best = 0;
    let ball = { x: 230, y: 150, dx: 4.5, dy: -4.5, r: 8, color: '#B6FF00' };
    let paddle = { x: 180, y: 315, w: 100, h: 12, color: '#00F0FF' };
    let trails = [];

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, e.clientX - rect.left - paddle.w / 2));
    });
    window.addEventListener('touchmove', (e) => {
      const rect = canvas.getBoundingClientRect();
      if(e.touches[0]) paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, e.touches[0].clientX - rect.left - paddle.w / 2));
    });

    function loop() {
      ctx.fillStyle = 'rgba(12, 15, 29, 0.28)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      trails.push({ x: ball.x, y: ball.y });
      if(trails.length > 10) trails.shift();
      trails.forEach((t, i) => {
        ctx.fillStyle = 'rgba(182, 255, 0, ' + (i/12) + ')';
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.x + ball.r > canvas.width || ball.x - ball.r < 0) ball.dx *= -1;
      if (ball.y - ball.r < 0) ball.dy *= -1;

      if (ball.y + ball.r >= paddle.y && ball.x >= paddle.x && ball.x <= paddle.x + paddle.w && ball.dy > 0) {
        ball.dy = -Math.abs(ball.dy) * 1.05;
        ball.dx += (Math.random() - 0.5) * 2;
        score += 10;
        document.getElementById('score').innerText = score;
        if(score > best) { best = score; document.getElementById('best').innerText = best; }
      }

      if (ball.y - ball.r > canvas.height) {
        score = 0;
        document.getElementById('score').innerText = score;
        ball.x = 230; ball.y = 150; ball.dx = 4.5; ball.dy = -4.5;
      }

      ctx.fillStyle = ball.color;
      ctx.shadowBlur = 18;
      ctx.shadowColor = ball.color;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = paddle.color;
      ctx.shadowColor = paddle.color;
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
      ctx.shadowBlur = 0;

      requestAnimationFrame(loop);
    }
    function resetGame() {
      score = 0;
      ball = { x: 230, y: 150, dx: 4.5, dy: -4.5, r: 8, color: '#B6FF00' };
    }
    loop();
  </script>
</body>
</html>`,
  },
  {
    id: 'quantum-clock',
    title: 'Quantum Chrono HUD',
    description: 'นาฬิกาไซเบอร์พังค์แสดงวันที่ เวลา และคลื่นควอนตัม',
    goals: ['แสดงเวลาแบบเรียลไทม์พร้อมเอฟเฟกต์คลื่นเสียงควอนตัม', 'รองรับภาษาไทยและฟอร์แมตวันที่สากล'],
    steps: ['ดึงเวลาปัจจุบันผ่าน Date Object', 'แสดงตัวเลขขนาดใหญ่พร้อมเรืองแสงนีออน', 'แอนิเมตแท่งควอนตัมด้วย CSS Keyframes'],
    risks: ['การรัน Interval ต้องทำความสะอาดเพื่อป้องกัน Memory Leak'],
    nextSteps: 'สามารถปรับแต่งจานสีหรือเปลี่ยนเป็นนาฬิกานับถอยหลังได้',
    updatedAt: Date.now() - 3600000,
    code: `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>Quantum Chrono HUD</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background: radial-gradient(circle at center, #101322 0%, #07080E 100%); color:#F0F2FA; font-family: monospace; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; overflow:hidden; }
    .card { background:rgba(16, 19, 34, 0.85); border:1px solid rgba(0,240,255,0.4); border-radius:20px; padding:36px 48px; text-align:center; box-shadow:0 0 50px rgba(0,240,255,0.2); backdrop-filter:blur(24px); }
    .title { color:#8A90A6; font-size:13px; letter-spacing:4px; margin-bottom:12px; }
    .time { font-size:56px; font-weight:bold; color:#B6FF00; text-shadow:0 0 25px rgba(182,255,0,0.7); }
    .date { color:#00F0FF; font-size:16px; margin-top:10px; letter-spacing:2px; }
    .bars { display:flex; gap:8px; margin-top:24px; justify-content:center; }
    .bar { width:8px; height:32px; background:#00F0FF; border-radius:4px; animation:bounce 1.2s infinite ease-in-out; }
    @keyframes bounce { 0%,100% { transform:scaleY(0.3); opacity:0.3; } 50% { transform:scaleY(1.3); opacity:1; filter:drop-shadow(0 0 8px #B6FF00); } }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">WHISPERX / QUANTUM CHRONO</div>
    <div class="time" id="clock">00:00:00</div>
    <div class="date" id="date">CYBER DOCK ACTIVE</div>
    <div class="bars">
      <div class="bar" style="animation-delay:0s"></div>
      <div class="bar" style="animation-delay:0.2s"></div>
      <div class="bar" style="animation-delay:0.4s"></div>
      <div class="bar" style="animation-delay:0.6s"></div>
      <div class="bar" style="animation-delay:0.8s"></div>
    </div>
  </div>
  <script>
    function update() {
      const now = new Date();
      document.getElementById('clock').innerText = now.toTimeString().split(' ')[0];
      document.getElementById('date').innerText = now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    setInterval(update, 1000);
    update();
  </script>
</body>
</html>`,
  },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('whisperx_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [projects, setProjects] = useState<StageProject[]>(() => {
    try {
      const saved = localStorage.getItem('whisperx_stage_projects');
      return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
    } catch {
      return DEFAULT_PROJECTS;
    }
  });

  const [currentProject, setCurrentProject] = useState<StageProject>(() => {
    return projects[0] || DEFAULT_PROJECTS[0];
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('whisperx_system_settings');
      return saved
        ? JSON.parse(saved)
        : {
            aiEngineMode: 'auto',
            aiModel: 'gemini-3.8-flash',
            highThinking: false,
            searchGrounding: false,
            appearanceTheme: 'dark',
            colorAccent: '#B6FF00',
            mascotType: 'boy',
            layoutMode: 'scene-sheet',
            worldBg: 'nebula',
            parallaxEnabled: true,
            reducedMotion: false,
            sensorsEnabled: true,
            sfxEnabled: true,
            hapticsEnabled: true,
            voiceAutoReply: true,
            speechLanguage: 'th-TH',
            bgType: 'planet',
            customBgUrl: null,
            customBgIsVideo: false,
            activeTheme: 'cyber-obsidian',
            workspaceMode: 'studio',
          };
    } catch {
      return {
        aiEngineMode: 'auto',
        aiModel: 'gemini-3.8-flash',
        highThinking: false,
        searchGrounding: false,
        appearanceTheme: 'dark',
        colorAccent: '#B6FF00',
        mascotType: 'boy',
        layoutMode: 'scene-sheet',
        worldBg: 'nebula',
        parallaxEnabled: true,
        reducedMotion: false,
        sensorsEnabled: true,
        sfxEnabled: true,
        hapticsEnabled: true,
        voiceAutoReply: true,
        speechLanguage: 'th-TH',
        bgType: 'planet',
        customBgUrl: null,
        customBgIsVideo: false,
        activeTheme: 'cyber-obsidian',
        workspaceMode: 'studio',
      };
    }
  });

  const [mascotConfig, setMascotConfig] = useState<MascotConfig>(() => {
    try {
      const saved = localStorage.getItem('whisperx_mascot_config');
      return saved
        ? JSON.parse(saved)
        : {
            name: 'WhisperX',
            type: 'boy',
            customTextureUrl: null,
            squishiness: 1,
            eyeTrackingEnabled: true,
            hapticsEnabled: true,
            scale: 1,
            accessory: 'none',
          };
    } catch {
      return {
        name: 'WhisperX',
        type: 'boy',
        customTextureUrl: null,
        squishiness: 1,
        eyeTrackingEnabled: true,
        hapticsEnabled: true,
        scale: 1,
        accessory: 'none',
      };
    }
  });

  // Mascot emotion & speech states
  const [mascotEmotion, setMascotEmotion] = useState<Emotion>('idle');
  const [mascotViseme, setMascotViseme] = useState<Viseme>('SILENCE');
  const [mascotSpeech, setMascotSpeech] = useState<string>('');

  // UI state toggles
  const [isStageOpen, setIsStageOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isCreationsOpen, setIsCreationsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isTablet, setIsTablet] = useState<boolean>(() => typeof window !== 'undefined' ? (window.innerWidth >= 768 && window.innerWidth < 1024) : false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Persistence effects
  useEffect(() => {
    try {
      localStorage.setItem('whisperx_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('whisperx_stage_projects', JSON.stringify(projects));
    } catch {}
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('whisperx_system_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('whisperx_mascot_config', JSON.stringify(mascotConfig));
    } catch {}
  }, [mascotConfig]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync mascot type changes
  useEffect(() => {
    if (settings.mascotType === 'boy') {
      setMascotConfig((prev) => ({ ...prev, type: 'boy', customTextureUrl: null }));
    } else if (settings.mascotType === 'code-kid') {
      setMascotConfig((prev) => ({
        ...prev,
        type: 'code-kid',
        customTextureUrl: '/assets/aistudio/เด็กกวนสายโค้ด.svg',
      }));
    } else if (settings.mascotType === 'ghost') {
      setMascotConfig((prev) => ({ ...prev, type: 'ghost', customTextureUrl: null }));
    }
  }, [settings.mascotType]);

  // Welcome sound
  useEffect(() => {
    soundEngine.playChime();
  }, []);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle Send Message
  const handleSendMessage = async (
    text: string,
    imageAttachment?: { mimeType: string; data: string; preview: string }
  ) => {
    if (!text && !imageAttachment) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      image: imageAttachment?.preview,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setMascotEmotion('thinking');
    setMascotSpeech('กำลังคิดและประมวลผลคำตอบค่ะ... ✨');

    const isAppRequest = /สร้างเกม|สร้างแอป|สร้างเว็บ|เขียนโค้ด|make app|create game|build pong|สร้างนาฬิกา|สร้างเพลง/i.test(
      text
    );

    try {
      if (isAppRequest) {
        setMascotEmotion('writing');
        setMascotSpeech('กำลังเขียนโค้ดและส่งเข้า STAGE V1 ทันทีค่ะ! ⚡');

        const appRes = await fetch('/api/generate-app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: text }),
        });
        const appData = await appRes.json();
        const code = appData.code || DEFAULT_PROJECTS[0].code;

        const newProj: StageProject = {
          id: 'proj-' + Date.now(),
          title: text.slice(0, 28),
          description: `สร้างสำหรับ "${text}" โดย WhisperX Engine`,
          goals: [`พัฒนาโมดูล ${text.slice(0, 20)} ให้ทำงานได้สมบูรณ์`],
          steps: ['สร้าง DOM & Canvas Layout', 'เขียนฟิสิกส์แอนิเมชันและการโต้ตอบ', 'ทดสอบบน STAGE Sandbox'],
          risks: ['ตรวจสอบ Performance บนมือถือ'],
          nextSteps: 'คลิกแท็บ Live App เพื่อเริ่มทดสอบทันที',
          code,
          updatedAt: Date.now(),
        };

        setProjects((prev) => [newProj, ...prev]);
        setCurrentProject(newProj);
        setIsStageOpen(true);

        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          role: 'assistant',
          content: `สร้าง "${text}" เรียบร้อยแล้วค่ะ! ระบบส่งแอปไปรันสดบนหน้าจอ STAGE V1 ให้คุณแล้ว สามารถแตะดู Live App หรือปรับแต่งโค้ดได้เลยค่ะ 🚀\n\n\`\`\`html\n${code}\n\`\`\``,
          timestamp: Date.now(),
          modelUsed: settings.highThinking ? 'gemini-4-argon' : settings.aiModel,
          suggestions: ['ลองรันแอปบน STAGE', 'ช่วยเขียนโค้ดเพิ่มสีสัน', 'อธิบายการทำงาน'],
        };

        setMessages((prev) => [...prev, aiMsg]);
        setMascotEmotion('happy');
        setMascotSpeech('แอปพร้อมทำงานบนหน้าจอ STAGE แล้วค่ะ! 🎉');
        soundEngine.playChime();
        triggerHaptic('heavy', settings.hapticsEnabled);
        if (settings.voiceAutoReply) {
          handleSpeakText('แอปพร้อมทำงานบนหน้าจอ STAGE แล้วค่ะ!');
        }
      } else {
        const payload: any = {
          message: text,
          history: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: settings.aiModel === 'demo' ? 'gemini-3.8-flash' : settings.aiModel,
          searchGrounding: settings.searchGrounding,
          highThinking: settings.highThinking,
        };

        if (imageAttachment) {
          payload.imageAttachment = {
            mimeType: imageAttachment.mimeType,
            data: imageAttachment.data,
          };
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        const replyText =
          data.text ||
          'ได้รับคำสั่งเรียบร้อยแล้วค่ะ! ผีน้อย WhisperX พร้อมช่วยเหลือในขั้นตอนถัดไปค่ะ ✨';

        const aiMsg: ChatMessage = {
          id: Math.random().toString(),
          role: 'assistant',
          content: replyText,
          timestamp: Date.now(),
          modelUsed: settings.highThinking ? 'gemini-4-argon' : settings.aiModel,
          suggestions: ['ช่วยคิดฟังก์ชันเพิ่มเติม', 'สร้างเป็นมินิเกม', 'สรุปเป็นหัวข้อสั้นๆ'],
        };

        setMessages((prev) => [...prev, aiMsg]);
        setMascotEmotion('speaking');
        setMascotSpeech(replyText.slice(0, 55) + '...');
        soundEngine.playClick();
        triggerHaptic('tap', settings.hapticsEnabled);
        if (settings.voiceAutoReply) {
          handleSpeakText(replyText.slice(0, 120));
        }

        setTimeout(() => {
          setMascotEmotion('idle');
          setMascotViseme('SILENCE');
        }, 4000);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: `เกิดข้อผิดพลาดในการประมวลผล ขออภัยด้วยนะคะ สามารถกดลองใหม่อีกครั้งได้ค่ะ`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setMascotEmotion('idle');
      setMascotSpeech('ระบบพร้อมทำงานต่อค่ะ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = settings.speechLanguage || 'th-TH';
    utterance.rate = 1.05;

    const visemes: Viseme[] = ['A_E', 'I', 'O_U', 'M_B_P'];
    let interval: NodeJS.Timeout;

    utterance.onstart = () => {
      setMascotEmotion('speaking');
      interval = setInterval(() => {
        const rand = visemes[Math.floor(Math.random() * visemes.length)];
        setMascotViseme(rand);
      }, 140);
    };

    utterance.onend = () => {
      clearInterval(interval);
      setMascotViseme('SILENCE');
      setMascotEmotion('idle');
    };

    utterance.onerror = () => {
      clearInterval(interval);
      setMascotViseme('SILENCE');
      setMascotEmotion('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleMascotGesture = (gesture: string) => {
    if (gesture === 'pat') {
      setMascotEmotion('happy');
      setMascotSpeech('ชอบจังเลยค่ะ~ นุ่มฟูมาก ขอบคุณนะคะ! ❤️');
      soundEngine.playChime();
    } else if (gesture === 'poke') {
      setMascotEmotion('happy');
      setMascotSpeech('อุ๊ย จั๊กจี้จังเลยค่ะ! 😆');
      soundEngine.playPulse();
    } else if (gesture === 'overdrive') {
      setMascotEmotion('overdrive');
      setMascotSpeech('พลังงานเต็ม 100%! ระบบ AVx พร้อมทำงานขั้นสูงสุดค่ะ ⚡');
      soundEngine.playLaser();
    } else if (gesture === 'toggle-sleep') {
      setMascotEmotion((prev) => {
        const next = prev === 'sleeping' ? 'idle' : 'sleeping';
        if (next === 'sleeping') {
          setMascotSpeech('พักผ่อนก่อนนะคะ... Zzz 💤');
        } else {
          setMascotSpeech('ตื่นแล้วค่ะ! พร้อมลุยงานต่อทันที ✨');
        }
        return next;
      });
    }
  };

  const handleExportStandaloneHtml = (projToExport: StageProject = currentProject) => {
    soundEngine.playLaser();
    triggerHaptic('heavy', settings.hapticsEnabled);

    const blob = new Blob([projToExport.code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projToExport.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'whisperx_app'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMascotSpeech(`ดาวน์โหลดไฟล์ ${a.download} เรียบร้อยแล้วค่ะ! 📥`);
    setMascotEmotion('happy');
  };

  const handleRunCodeInStage = (code: string, title?: string) => {
    const newProj: StageProject = {
      id: 'proj-' + Date.now(),
      title: title || 'Custom Snippet',
      description: 'รันจากโค้ดในแชท',
      code,
      updatedAt: Date.now(),
    };
    setProjects((prev) => [newProj, ...prev]);
    setCurrentProject(newProj);
    setIsStageOpen(true);
    setMascotEmotion('happy');
    setMascotSpeech('กำลังรันโค้ดบน STAGE V1 แล้วค่ะ ⚡');
  };

  const isClassicLayout = settings.layoutMode === 'classic' && !isMobile;

  return (
    <div className="relative w-screen h-screen h-[100dvh] overflow-hidden flex flex-col bg-[#07080E] text-[#F0F2FA] select-none font-sans">
      {/* Background Atmosphere Canvas */}
      <BackgroundCanvas settings={settings} />

      {/* Header HUD matching screenshots */}
      <HeaderHUD
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onExportStage={() => handleExportStandaloneHtml()}
        onRefresh={() => {
          soundEngine.playChime();
          setMascotSpeech('ระบบพร้อมทำงานใหม่แล้วค่ะ ✨');
          setMascotEmotion('idle');
        }}
        onToggleStage={() => setIsStageOpen(!isStageOpen)}
        isStageOpen={isStageOpen}
        sfxMuted={!settings.sfxEnabled}
        onToggleSfx={() => {
          const next = !settings.sfxEnabled;
          soundEngine.setMuted(!next);
          setSettings((prev) => ({ ...prev, sfxEnabled: next }));
        }}
        isAudioActive={mascotViseme !== 'SILENCE' || isLoading}
        currentModelName={
          settings.aiEngineMode === 'auto'
            ? 'GEMINI LIVE · TH-TH'
            : settings.aiEngineMode === 'claude'
            ? 'CLAUDE RUNTIME · TH-TH'
            : 'DEMO OFFLINE · TH-TH'
        }
        workspaceMode={settings.workspaceMode || 'studio'}
        onChangeWorkspaceMode={(mode) => {
          setSettings((prev) => ({ ...prev, workspaceMode: mode }));
          if (mode === 'stage') setIsStageOpen(true);
        }}
        onOpenMenu={() => setIsSettingsOpen(true)}
      />

      {/* Main Responsive Layout */}
      {isClassicLayout ? (
        /* DESKTOP / TABLET 2-COLUMN LANDSCAPE MODE (Matching IMG_0683) */
        <div className="relative flex-1 w-full overflow-hidden flex flex-row items-stretch z-10 p-3 lg:p-6 gap-6">
          {/* Left Column: Hero Brand Lockup + Mascot */}
          <div className="flex-1 flex flex-col items-center justify-between py-2 overflow-y-auto no-scrollbar">
            {/* Hero Title Section */}
            <div className="flex flex-col items-center text-center mt-2 mb-3">
              <div className="text-[10px] font-mono tracking-widest text-[#8A90A6] uppercase mb-1">
                AGENT Nº01 · {settings.aiEngineMode === 'auto' ? 'ONLINE LIVE · TH-TH' : 'DEMO OFFLINE · TH-TH'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-sans">
                  Whisper
                </span>
                <span className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-[#B6FF00] text-[#07080E] font-black text-xl lg:text-2xl flex items-center justify-center shadow-[0_0_18px_rgba(182,255,0,0.5)]">
                  X
                </span>
              </div>
              <p className="text-xs lg:text-sm text-slate-400 mt-1 max-w-sm">
                คู่หูส่วนตัวของคุณ — ค้นหา คิด ออกแบบ สร้างผลงาน
              </p>

              {/* Sensor Pill Button */}
              <button
                onClick={() => {
                  soundEngine.playLaser();
                  triggerHaptic('tap');
                  setSettings((prev) => ({ ...prev, sensorsEnabled: !prev.sensorsEnabled }));
                }}
                className="mt-2 px-3 py-1 rounded-full text-[11px] font-medium bg-[#B6FF00]/10 border border-[#B6FF00]/30 text-[#B6FF00] hover:bg-[#B6FF00]/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>📱</span>
                <span>{settings.sensorsEnabled ? 'เซนเซอร์: พร้อมทำงาน' : 'แตะเพื่อเปิดเซนเซอร์'}</span>
              </button>
            </div>

            {/* Living Mascot in Center */}
            <LivingMascot
              emotion={mascotEmotion}
              viseme={mascotViseme}
              speechText={mascotSpeech}
              config={mascotConfig}
              onMascotClick={() => {
                setMascotEmotion((prev) => (prev === 'happy' ? 'overdrive' : 'happy'));
                setMascotSpeech('นุ่มเด้งจังเลยค่ะ! มีอะไรให้ WhisperX ช่วยไหมคะ? 👻');
              }}
              onTriggerGesture={handleMascotGesture}
            />

            {/* Chat Thread if active */}
            {messages.length > 0 && (
              <div className="w-full max-w-md mt-2">
                <ChatThread
                  messages={messages.slice(-4)}
                  onRunCodeInStage={handleRunCodeInStage}
                  onSpeak={handleSpeakText}
                  onSelectSuggestion={(sug) => handleSendMessage(sug)}
                />
              </div>
            )}

            {/* Input Dock at Bottom Left */}
            <div className="w-full flex justify-center mt-auto">
              <InputDock
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onVisemeChange={(v) => {
                  setMascotViseme(v);
                  if (v !== 'SILENCE') setMascotEmotion('speaking');
                }}
                highThinking={settings.highThinking}
                onToggleHighThinking={() => {
                  setSettings((prev) => ({ ...prev, highThinking: !prev.highThinking }));
                }}
              />
            </div>
          </div>

          {/* Right Column: STAGE V0 / Quick Matrix (Matching IMG_0683) */}
          <div className="flex-1 flex flex-col glass-panel-heavy rounded-2xl border border-white/10 p-4 lg:p-5 overflow-y-auto no-scrollbar shadow-2xl">
            {/* Top STAGE V0 HUD */}
            <div className="flex items-center justify-between pb-3 border-b border-white/8 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#00F0FF]">STAGE V0</span>
                <span className="text-xs text-[#8A90A6]">ready.</span>
                <span className="w-2 h-2 rounded-full bg-[#B6FF00] animate-pulse" />
              </div>
              <button
                onClick={() => setIsStageOpen(true)}
                className="text-xs text-[#B6FF00] hover:underline font-mono cursor-pointer"
              >
                เปิด STAGE V1 เต็มจอ →
              </button>
            </div>

            {/* Quick Start Bento Grid */}
            <QuickStartGrid
              onSelectAction={(_k, prompt) => handleSendMessage(prompt)}
              onOpenMyCreations={() => setIsCreationsOpen(true)}
              showHeader={true}
            />

            {/* Live Mini Preview Runner */}
            <div className="mt-4 flex-1 min-h-[220px] rounded-xl border border-white/10 overflow-hidden bg-[#0A0C16] relative flex flex-col">
              <div className="px-3 py-1.5 bg-black/40 border-b border-white/8 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>STAGE LIVE EXECUTION: {currentProject.title}</span>
                <button
                  onClick={() => handleExportStandaloneHtml(currentProject)}
                  className="text-[#B6FF00] hover:underline cursor-pointer"
                >
                  Download .html
                </button>
              </div>
              <iframe
                title="STAGE Mini Preview"
                srcDoc={currentProject.code}
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
                className="flex-1 w-full h-full border-none bg-transparent"
              />
            </div>
          </div>
        </div>
      ) : (
        /* MOBILE & SCENE-SHEET MODE (Matching IMG_0684 & IMG_0687) */
        <div
          className={`relative flex-1 w-full overflow-hidden flex flex-col items-center z-10 transition-all duration-300 ${
            isStageOpen && !isMobile
              ? isTablet
                ? 'md:pr-[49vw]'
                : 'lg:pr-[47vw] xl:pr-[715px]'
              : ''
          }`}
        >
          {/* Scrollable Center Feed */}
          <div
            ref={scrollRef}
            className="flex-1 w-full overflow-y-auto flex flex-col items-center py-2 sm:py-3 px-3 no-scrollbar"
          >
            {/* Hero Brand Title matching IMG_0684 */}
            <div className="flex flex-col items-center text-center mt-1 mb-2">
              <div className="text-[10px] font-mono tracking-widest text-[#8A90A6] uppercase mb-0.5">
                AGENT Nº01 · {settings.aiEngineMode === 'auto' ? 'ONLINE LIVE · TH-TH' : 'DEMO OFFLINE · TH-TH'}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white font-sans">
                  Whisper
                </span>
                <span className="w-8 h-8 rounded-lg bg-[#B6FF00] text-[#07080E] font-black text-xl flex items-center justify-center shadow-[0_0_18px_rgba(182,255,0,0.5)]">
                  X
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                คู่หูส่วนตัวของคุณ — ค้นหา คิด ออกแบบ สร้างผลงาน
              </p>

              {/* Sensor Pill Button */}
              <button
                onClick={() => {
                  soundEngine.playLaser();
                  triggerHaptic('tap');
                  setSettings((prev) => ({ ...prev, sensorsEnabled: !prev.sensorsEnabled }));
                }}
                className="mt-2 px-3 py-1 rounded-full text-[11px] font-medium bg-[#B6FF00]/10 border border-[#B6FF00]/30 text-[#B6FF00] hover:bg-[#B6FF00]/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>📱</span>
                <span>{settings.sensorsEnabled ? 'เซนเซอร์: พร้อมทำงาน' : 'แตะเพื่อเปิดเซนเซอร์'}</span>
              </button>
            </div>

            {/* Living Mascot Canvas */}
            <LivingMascot
              emotion={mascotEmotion}
              viseme={mascotViseme}
              speechText={mascotSpeech}
              config={mascotConfig}
              compact={isMobile && messages.length > 0}
              onMascotClick={() => {
                setMascotEmotion((prev) => (prev === 'happy' ? 'overdrive' : 'happy'));
                setMascotSpeech('นุ่มเด้งจังเลยค่ะ! มีอะไรให้ WhisperX ช่วยไหมคะ? 👻');
              }}
              onTriggerGesture={handleMascotGesture}
            />

            {/* Dedicated Mascot Lab Mode */}
            {settings.workspaceMode === 'mascot-lab' && (
              <MascotLabNode
                config={mascotConfig}
                onUpdateConfig={(newConf) => setMascotConfig((prev) => ({ ...prev, ...newConf }))}
                currentEmotion={mascotEmotion}
                onChangeEmotion={(em) => setMascotEmotion(em)}
                currentViseme={mascotViseme}
                onChangeViseme={(vi) => setMascotViseme(vi)}
                onTriggerSquish={() => {
                  setMascotSpeech('อุ๊ย! สปริงเด้งดึ๋งเลยค่ะ ✨');
                  setMascotEmotion('happy');
                  soundEngine.playPulse();
                  triggerHaptic('heavy', settings.hapticsEnabled);
                }}
              />
            )}

            {/* Quick Start Bento Grid */}
            {(messages.length === 0 || settings.workspaceMode === 'studio') && (
              <div className="w-full flex justify-center mt-2 animate-fade-in">
                <QuickStartGrid
                  onSelectAction={(_k, prompt) => handleSendMessage(prompt)}
                  onOpenMyCreations={() => setIsCreationsOpen(true)}
                  showHeader={false}
                />
              </div>
            )}

            {/* Chat Thread Messages */}
            <ChatThread
              messages={messages}
              onRunCodeInStage={handleRunCodeInStage}
              onSpeak={handleSpeakText}
              onSelectSuggestion={(sug) => handleSendMessage(sug)}
            />
          </div>

          {/* Floating Action Matrix & Input Dock */}
          <InputDock
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onVisemeChange={(v) => {
              setMascotViseme(v);
              if (v !== 'SILENCE') setMascotEmotion('speaking');
            }}
            highThinking={settings.highThinking}
            onToggleHighThinking={() => {
              setSettings((prev) => ({ ...prev, highThinking: !prev.highThinking }));
            }}
          />
        </div>
      )}

      {/* Autonomous STAGE V1 Code Execution Sandbox Drawer */}
      <StageSandbox
        currentProject={currentProject}
        onUpdateCode={(code) => {
          setCurrentProject((prev) => ({ ...prev, code, updatedAt: Date.now() }));
          setProjects((prev) =>
            prev.map((p) => (p.id === currentProject.id ? { ...p, code, updatedAt: Date.now() } : p))
          );
        }}
        isOpen={isStageOpen}
        onClose={() => setIsStageOpen(false)}
        isMobile={isMobile}
        isTablet={isTablet}
        onExport={() => handleExportStandaloneHtml(currentProject)}
        projects={projects}
        onSelectProject={(p) => setCurrentProject(p)}
        onQuickPrompt={(prompt) => handleSendMessage(prompt)}
      />

      {/* Settings Modal Sheet matching IMG_0685 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => setSettings((prev) => ({ ...prev, ...newSettings }))}
        mascotConfig={mascotConfig}
        onUpdateMascotConfig={(newConf) => setMascotConfig((prev) => ({ ...prev, ...newConf }))}
        onClearHistory={() => {
          setMessages([]);
          localStorage.removeItem('whisperx_chat_history');
          setMascotSpeech('ล้างประวัติแชทเรียบร้อยแล้วค่ะ');
        }}
      />

      {/* Search Hub Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        messages={messages}
        projects={projects}
        onSelectProject={(p) => {
          setCurrentProject(p);
          setIsStageOpen(true);
        }}
        onSelectPrompt={(p) => handleSendMessage(p)}
      />

      {/* My Creations Archive Modal */}
      <MyCreationsModal
        isOpen={isCreationsOpen}
        onClose={() => setIsCreationsOpen(false)}
        projects={projects}
        onSelectProject={(p) => {
          setCurrentProject(p);
          setIsStageOpen(true);
        }}
        onDeleteProject={(id) => {
          setProjects((prev) => prev.filter((p) => p.id !== id));
        }}
        onExportProject={handleExportStandaloneHtml}
        onCreateNewProject={() => {
          const newP: StageProject = {
            id: 'proj-' + Date.now(),
            title: 'โปรเจกต์ใหม่',
            description: 'สร้างใน STAGE V1',
            code: DEFAULT_PROJECTS[1].code,
            updatedAt: Date.now(),
          };
          setProjects((prev) => [newP, ...prev]);
          setCurrentProject(newP);
          setIsStageOpen(true);
        }}
      />
    </div>
  );
}

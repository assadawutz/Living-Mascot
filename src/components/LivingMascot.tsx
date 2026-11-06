import React, { useEffect, useRef, useState } from 'react';
import { Emotion, MascotConfig, Viseme } from '../types';
import { soundEngine, triggerHaptic } from '../utils/audioSynthesizer';
import { Heart, Sparkles, Zap, Moon, Sun, RotateCw, Hand } from 'lucide-react';

interface LivingMascotProps {
  emotion: Emotion;
  viseme: Viseme;
  speechText?: string;
  config: MascotConfig;
  onMascotClick?: () => void;
  compact?: boolean;
  onTriggerGesture?: (gestureName: string) => void;
}

interface ReactionParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  alpha: number;
  size: number;
}

export const LivingMascot: React.FC<LivingMascotProps> = ({
  emotion,
  viseme,
  speechText,
  config,
  onMascotClick,
  compact = false,
  onTriggerGesture,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const customImgRef = useRef<HTMLImageElement | null>(null);
  const boyImgRef = useRef<HTMLImageElement | null>(null);
  const codeKidImgRef = useRef<HTMLImageElement | null>(null);

  // Particles queue
  const particlesRef = useRef<ReactionParticle[]>([]);

  // Flip rotation state
  const flipAngleRef = useRef<number>(0);
  const isFlippingRef = useRef<boolean>(false);

  // Patting detection (mouse stroke over head)
  const lastPatTimeRef = useRef<number>(0);
  const patStrokeDistRef = useRef<number>(0);

  // Physics state
  const physicsRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    squishX: 1,
    squishY: 1,
    squishVx: 0,
    squishVy: 0,
    tiltX: 0,
    tiltY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    isBlinking: false,
    blinkProgress: 0,
    breathTime: 0,
  });

  // Load Boy mascot asset
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/aistudio/IMG_0684_11c10873.jpeg';
    img.onload = () => {
      boyImgRef.current = img;
    };
  }, []);

  // Load Code Kid SVG asset
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/aistudio/เด็กกวนสายโค้ด.svg';
    img.onload = () => {
      codeKidImgRef.current = img;
    };
  }, []);

  // Load custom texture
  useEffect(() => {
    if (config.customTextureUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = config.customTextureUrl;
      img.onload = () => {
        customImgRef.current = img;
      };
    } else {
      customImgRef.current = null;
    }
  }, [config.customTextureUrl]);

  // Gyroscope tilt
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        physicsRef.current.tiltX = Math.max(-16, Math.min(16, e.gamma * 0.42));
        physicsRef.current.tiltY = Math.max(-16, Math.min(16, (e.beta - 45) * 0.42));
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Emit Reaction Particle
  const emitParticle = (text: string, count = 1) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x: (Math.random() - 0.5) * 50,
        y: -30 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -2.5 - Math.random() * 2,
        text,
        alpha: 1,
        size: 16 + Math.random() * 8,
      });
    }
  };

  // Perform 360 Flip Gesture
  const triggerFlip = () => {
    if (isFlippingRef.current) return;
    isFlippingRef.current = true;
    soundEngine.playLaser();
    triggerHaptic('heavy', config.hapticsEnabled);
    emitParticle('⚡', 3);
    emitParticle('✨', 3);
  };

  // Pet Head Gesture
  const triggerPet = () => {
    soundEngine.playChime();
    triggerHaptic('double', config.hapticsEnabled);
    physicsRef.current.squishX = 1.25;
    physicsRef.current.squishY = 0.75;
    physicsRef.current.squishVy = 0.25;
    emitParticle('💖', 4);
    emitParticle('✨', 2);
    if (onTriggerGesture) onTriggerGesture('pat');
  };

  // Poke Gesture
  const triggerPoke = () => {
    soundEngine.playPulse();
    triggerHaptic('tap', config.hapticsEnabled);
    physicsRef.current.squishX = 0.75;
    physicsRef.current.squishY = 1.35;
    physicsRef.current.squishVx = 0.3;
    emitParticle('💢', 1);
    if (onTriggerGesture) onTriggerGesture('poke');
  };

  // Pointer move & Stroke/Petting detection
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const prevX = mousePos.current.x;
      const prevY = mousePos.current.y;
      mousePos.current = { x: e.clientX, y: e.clientY };

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const inHeadArea =
        e.clientX >= rect.left + rect.width * 0.25 &&
        e.clientX <= rect.left + rect.width * 0.75 &&
        e.clientY >= rect.top &&
        e.clientY <= rect.top + rect.height * 0.55;

      // Detect stroke motion over head -> Petting!
      if (inHeadArea && !isDragging.current) {
        const moveDist = Math.hypot(e.clientX - prevX, e.clientY - prevY);
        patStrokeDistRef.current += moveDist;
        if (patStrokeDistRef.current > 120) {
          const now = Date.now();
          if (now - lastPatTimeRef.current > 400) {
            lastPatTimeRef.current = now;
            patStrokeDistRef.current = 0;
            triggerPet();
          }
        }
      }

      if (isDragging.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        physicsRef.current.dragOffsetX = Math.max(-75, Math.min(75, dx));
        physicsRef.current.dragOffsetY = Math.max(-75, Math.min(75, dy));
        physicsRef.current.squishX = 1 + Math.abs(dx) * 0.005 - Math.abs(dy) * 0.003;
        physicsRef.current.squishY = 1 + Math.abs(dy) * 0.005 - Math.abs(dx) * 0.003;
      }
    };

    const handlePointerUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        const p = physicsRef.current;
        p.vx = -p.dragOffsetX * 0.25;
        p.vy = -p.dragOffsetY * 0.25;
        p.squishVx = 0.4;
        p.squishVy = -0.4;
        p.dragOffsetX = 0;
        p.dragOffsetY = 0;
        soundEngine.playPulse();
        triggerHaptic('heavy', config.hapticsEnabled);
        emitParticle('✨', 2);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [config.hapticsEnabled]);

  // Blink interval timer
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const scheduleBlink = () => {
      timeout = setTimeout(() => {
        physicsRef.current.isBlinking = true;
        setTimeout(() => {
          physicsRef.current.isBlinking = false;
          scheduleBlink();
        }, 180);
      }, 2500 + Math.random() * 3200);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.035;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const p = physicsRef.current;
      p.breathTime += 0.03;
      const centerX = w / 2;
      const centerY = h / 2 - (compact ? 6 : 10);

      // 360 Flip animation calculation
      if (isFlippingRef.current) {
        flipAngleRef.current += 0.28;
        if (flipAngleRef.current >= Math.PI * 2) {
          flipAngleRef.current = 0;
          isFlippingRef.current = false;
        }
      }

      // Spring relaxation
      const springK = 0.18;
      const damp = 0.78;
      const fx = (1 - p.squishX) * springK;
      const fy = (1 - p.squishY) * springK;
      p.squishVx = (p.squishVx + fx) * damp;
      p.squishVy = (p.squishVy + fy) * damp;
      p.squishX += p.squishVx;
      p.squishY += p.squishVy;

      // Floating oscillation
      const isSleeping = emotion === 'sleeping';
      const breathScale = isSleeping ? 0.4 : 1;
      const floatY = (Math.sin(time * (isSleeping ? 1.2 : 2.2)) * 6 + p.tiltY + p.dragOffsetY) * breathScale;
      const floatX = (Math.cos(time * 1.5) * 3 + p.tiltX + p.dragOffsetX) * breathScale;

      p.vx = (p.vx + (floatX - p.x) * 0.15) * 0.75;
      p.vy = (p.vy + (floatY - p.y) * 0.15) * 0.75;
      p.x += p.vx;
      p.y += p.vy;

      // Sleep particle emitter
      if (isSleeping && Math.random() < 0.04) {
        emitParticle('💤', 1);
      }

      // Gaze Tracking
      const rect = canvas.getBoundingClientRect();
      const screenX = rect.left + centerX + p.x;
      const screenY = rect.top + centerY + p.y;
      const dx = mousePos.current.x - screenX;
      const dy = mousePos.current.y - screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxGaze = 11;
      const gazeX = dist > 0 ? (dx / dist) * Math.min(maxGaze, dist * 0.04) : 0;
      const gazeY = dist > 0 ? (dy / dist) * Math.min(maxGaze, dist * 0.04) : 0;

      // 1. Holographic Base Platform
      const portalY = centerY + (compact ? 62 : 88);
      ctx.save();
      ctx.translate(centerX + p.x * 0.35, portalY);

      ctx.beginPath();
      ctx.ellipse(0, 0, compact ? 68 : 96, compact ? 18 : 24, 0, 0, Math.PI * 2);
      const portalGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, compact ? 68 : 96);
      portalGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
      portalGrad.addColorStop(0.5, 'rgba(182, 255, 0, 0.25)');
      portalGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = portalGrad;
      ctx.fill();

      // Glowing outer rim
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00F0FF';
      ctx.stroke();

      // Inner pulsating neon ring
      ctx.beginPath();
      ctx.ellipse(0, 0, (compact ? 48 : 70) + Math.sin(time * 3) * 3, compact ? 12 : 16, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(182, 255, 0, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#B6FF00';
      ctx.stroke();
      ctx.restore();

      // 2. Mascot Body with Flip & Squish
      ctx.save();
      ctx.translate(centerX + p.x, centerY + p.y);
      ctx.rotate(flipAngleRef.current);
      ctx.scale(p.squishX, p.squishY);

      // Emotion Aura Glow
      let auraColor = '#00F0FF';
      let auraSize = compact ? 70 : 96;
      if (emotion === 'happy') {
        auraColor = '#B6FF00';
        auraSize = (compact ? 75 : 106) + Math.sin(time * 6) * 6;
      } else if (emotion === 'thinking') {
        auraColor = '#F59E0B';
        auraSize = (compact ? 72 : 98) + Math.sin(time * 4) * 6;
      } else if (emotion === 'writing') {
        auraColor = '#A855F7';
        auraSize = compact ? 74 : 100;
      } else if (emotion === 'speaking') {
        auraColor = '#00F0FF';
        auraSize = (compact ? 78 : 108) + Math.sin(time * 8) * 8;
      } else if (emotion === 'overdrive') {
        auraColor = '#FF007A';
        auraSize = (compact ? 85 : 118) + Math.sin(time * 12) * 12;
      } else if (emotion === 'sleeping') {
        auraColor = '#818CF8';
        auraSize = compact ? 65 : 88;
      }

      const auraGrad = ctx.createRadialGradient(0, -10, 25, 0, -10, auraSize);
      auraGrad.addColorStop(0, auraColor + '40');
      auraGrad.addColorStop(0.6, auraColor + '15');
      auraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -10, auraSize, 0, Math.PI * 2);
      ctx.fill();

      // Render Active Mascot
      if (config.customTextureUrl && customImgRef.current && customImgRef.current.complete) {
        const size = compact ? 115 : 165;
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = auraColor;
        ctx.drawImage(customImgRef.current, -size / 2, -size / 2 - 10, size, size);
        ctx.restore();
      } else if (config.type === 'boy' && boyImgRef.current && boyImgRef.current.complete) {
        // Anime Chibi Boy (cropped from screenshot source)
        const size = compact ? 135 : 190;
        ctx.save();
        ctx.shadowBlur = 25;
        ctx.shadowColor = auraColor;

        ctx.beginPath();
        ctx.arc(0, -8, size * 0.44, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(
          boyImgRef.current,
          155, 660, 665, 665,
          -size / 2, -size / 2 - 12, size, size
        );
        ctx.restore();

        // Cyber Ring
        ctx.beginPath();
        ctx.arc(0, -8, size * 0.44, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.38)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Sleeping Eyelid overlay
        if (isSleeping) {
          ctx.fillStyle = 'rgba(7, 8, 14, 0.75)';
          ctx.beginPath();
          ctx.arc(0, -8, size * 0.44, 0, Math.PI * 2);
          ctx.fill();
          // Draw closed happy/sleeping eyes
          ctx.strokeStyle = '#B6FF00';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(-22, -12, 10, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.arc(22, -12, 10, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.stroke();
        }
      } else if (config.type === 'code-kid' && codeKidImgRef.current && codeKidImgRef.current.complete) {
        // Cheeky Code Kid SVG
        const size = compact ? 135 : 185;
        ctx.save();
        ctx.shadowBlur = 24;
        ctx.shadowColor = auraColor;
        ctx.drawImage(codeKidImgRef.current, -size / 2, -size / 2 - 10, size, size);
        ctx.restore();
      } else {
        // Procedural Ghost
        const radius = compact ? 42 : 56;

        ctx.save();
        ctx.shadowBlur = 24;
        ctx.shadowColor = auraColor;
        ctx.fillStyle = 'rgba(244, 248, 255, 0.96)';

        ctx.beginPath();
        ctx.arc(0, -8, radius, Math.PI, 0, false);

        const ruffles = 4;
        const skirtWidth = radius * 2;
        const ruffW = skirtWidth / ruffles;
        const bottomY = radius + 6;

        ctx.lineTo(radius, bottomY - 5);
        for (let i = ruffles; i > 0; i--) {
          const waveY = bottomY + Math.sin(time * 3 + i) * 5;
          ctx.quadraticCurveTo(
            -radius + i * ruffW - ruffW * 0.2,
            waveY,
            -radius + (i - 1) * ruffW,
            bottomY - 5
          );
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Cheeks Blush
        ctx.fillStyle = 'rgba(255, 105, 180, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-radius * 0.5, 4, 7, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(radius * 0.5, 4, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeOffset = radius * 0.32;
        const eyeY = -4;
        const eyeRad = radius * 0.2;

        if (isSleeping) {
          ctx.strokeStyle = '#0c0e1a';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.arc(-eyeOffset, eyeY, eyeRad * 0.7, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.arc(eyeOffset, eyeY, eyeRad * 0.7, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.stroke();
        } else {
          [-eyeOffset, eyeOffset].forEach((ex) => {
            ctx.save();
            ctx.translate(ex, eyeY);

            ctx.fillStyle = '#0c0e1a';
            ctx.beginPath();
            ctx.arc(0, 0, eyeRad, 0, Math.PI * 2);
            ctx.fill();

            const irisColor = emotion === 'happy' ? '#B6FF00' : '#00F0FF';
            ctx.fillStyle = irisColor;
            ctx.beginPath();
            ctx.arc(gazeX * 0.6, gazeY * 0.6, eyeRad * 0.65, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(gazeX * 0.6 - 2, gazeY * 0.6 - 2, eyeRad * 0.26, 0, Math.PI * 2);
            ctx.fill();

            if (p.isBlinking) {
              ctx.fillStyle = 'rgba(244, 248, 255, 1)';
              ctx.beginPath();
              ctx.rect(-eyeRad - 2, -eyeRad - 2, (eyeRad + 2) * 2, (eyeRad + 2) * 2);
              ctx.fill();
            }

            ctx.restore();
          });
        }

        // Mouth
        ctx.save();
        ctx.translate(0, 12);
        ctx.fillStyle = '#0c0e1a';
        ctx.strokeStyle = '#0c0e1a';
        ctx.lineWidth = 2.4;

        if (isSleeping) {
          ctx.beginPath();
          ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (viseme === 'SILENCE') {
          ctx.beginPath();
          ctx.arc(0, -2, 5, 0.1 * Math.PI, 0.9 * Math.PI);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.ellipse(0, 0, 7, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();

      // 3. Render Floating Reaction Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.02;

        if (pt.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.font = `${pt.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pt.text, centerX + p.x + pt.x, centerY + p.y + pt.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [emotion, viseme, config, compact]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };

    const p = physicsRef.current;
    p.squishX = 1.28;
    p.squishY = 0.72;
    p.squishVx = -0.22;
    p.squishVy = 0.22;
    soundEngine.playPulse();
    triggerHaptic('heavy', config.hapticsEnabled);
    if (onMascotClick) onMascotClick();
  };

  const handleDoubleClick = () => {
    triggerFlip();
  };

  const canvasWidth = compact ? 220 : 300;
  const canvasHeight = compact ? 190 : 255;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Interactive Speech Bubble matching exact screenshot text */}
      <div
        className={`relative z-10 mb-1 px-4 py-2.5 rounded-2xl glass-panel-neon border border-[#B6FF00]/40 text-xs sm:text-sm font-medium text-slate-100 shadow-[0_0_25px_rgba(182,255,0,0.12)] transition-all duration-300 max-w-[290px] sm:max-w-[380px] text-center backdrop-blur-xl ${
          compact ? 'scale-90 -mb-2' : ''
        }`}
      >
        <p className="leading-relaxed">
          {speechText ? (
            speechText
          ) : (
            <>
              สวัสดีค่ะ~ ผีน้อย WhisperX พร้อมแล้ว 👻
              <br />
              <span className="text-slate-300 text-[11px] sm:text-xs">
                ลองแตะ ลูบหัว หรือเอียงเครื่องดูนะ
              </span>
            </>
          )}
        </p>
        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-8 border-t-[#101322]/95" />
      </div>

      {/* Living Physics Mascot Canvas */}
      <div
        className="relative cursor-grab active:cursor-grabbing transition-transform hover:scale-105 active:scale-95"
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        title="แตะ ลูบหัว (Stroke) หรือดับเบิลคลิกเพื่อตีลังกา 360°"
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="pointer-events-auto filter drop-shadow-[0_12px_30px_rgba(0,240,255,0.3)]"
        />

        {/* Emotion Chip */}
        <div className="absolute bottom-2 right-4 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-wider glass-panel border border-cyan-400/30 text-cyan-300 flex items-center gap-1 shadow-sm">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              emotion === 'happy'
                ? 'bg-[#B6FF00] animate-ping'
                : emotion === 'overdrive'
                ? 'bg-pink-500 animate-bounce'
                : emotion === 'sleeping'
                ? 'bg-indigo-400'
                : 'bg-cyan-400'
            }`}
          />
          {emotion}
        </div>
      </div>

      {/* Interactive Micro-Gesture Actions Toolbar */}
      <div className="flex items-center gap-1.5 mt-1 px-2 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[11px] font-sans">
        <button
          onClick={triggerPet}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-pink-500/20 text-slate-300 hover:text-pink-300 transition-all cursor-pointer active:scale-90"
          title="ลูบหัว (Pet Head)"
        >
          <Heart className="w-3.5 h-3.5 text-pink-400" />
          <span>ลูบหัว</span>
        </button>

        <button
          onClick={triggerPoke}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-all cursor-pointer active:scale-90"
          title="จิ้มพุง (Poke)"
        >
          <Hand className="w-3.5 h-3.5 text-amber-400" />
          <span>จิ้มพุง</span>
        </button>

        <button
          onClick={triggerFlip}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-all cursor-pointer active:scale-90"
          title="หมุนตัว 360 องศา (Flip Spin)"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span>ตีลังกา</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playLaser();
            triggerHaptic('heavy', config.hapticsEnabled);
            if (onTriggerGesture) onTriggerGesture('overdrive');
            emitParticle('⚡', 4);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#B6FF00]/20 text-slate-300 hover:text-[#B6FF00] transition-all cursor-pointer active:scale-90"
          title="โอเวอร์ไดรฟ์พลัง (Supercharge)"
        >
          <Zap className="w-3.5 h-3.5 text-[#B6FF00]" />
          <span>ชาร์จ</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playClick();
            triggerHaptic('tap', config.hapticsEnabled);
            if (onTriggerGesture) onTriggerGesture('toggle-sleep');
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 transition-all cursor-pointer active:scale-90"
          title={emotion === 'sleeping' ? 'ปลุกมาสคอต' : 'พักผ่อน'}
        >
          {emotion === 'sleeping' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          )}
        </button>
      </div>
    </div>
  );
};
